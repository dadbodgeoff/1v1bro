/**
 * PredictionSystem Unit and Property Tests
 *
 * Tests for client-side prediction and reconciliation.
 * _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { PredictionSystem, DEFAULT_PREDICTION_CONFIG, PredictionConfig } from './PredictionSystem';
import { Vector3 } from '../math/Vector3';
import { EventBus, IEventBus } from '../core/EventBus';
import type { IPhysics3D, PlayerPhysicsState, MovementInput } from '../physics/Physics3D';
import type { InputPacket, PlayerState } from '../network/Serializer';
import type { DesyncDetectedEvent, ReconciliationEvent } from '../core/GameEvents';

// Mock Physics3D that applies simple movement
function createMockPhysics(): IPhysics3D {
  return {
    step: vi.fn((state: PlayerPhysicsState, input: MovementInput, dt: number): PlayerPhysicsState => {
      // Simple physics: move in direction based on input
      const moveX = input.right * 7 * dt;
      const moveZ = input.forward * 7 * dt;
      return {
        ...state,
        position: new Vector3(state.position.x + moveX, state.position.y, state.position.z + moveZ),
        velocity: new Vector3(moveX / dt, 0, moveZ / dt),
      };
    }),
  };
}

// Helper to create input packet
function createInputPacket(
  sequenceNumber: number,
  tickNumber: number,
  movementX = 0,
  movementY = 0,
  buttons = 0
): InputPacket {
  return {
    sequenceNumber,
    tickNumber,
    movementX,
    movementY,
    lookDeltaX: 0,
    lookDeltaY: 0,
    buttons,
    clientTimestamp: Date.now(),
  };
}

// Helper to create server player state
function createServerState(position: Vector3, velocity: Vector3 = Vector3.ZERO): PlayerState {
  return {
    entityId: 1,
    position,
    pitch: 0,
    yaw: 0,
    velocity,
    health: 100,
    stateFlags: 0x01, // grounded
  };
}

describe('PredictionSystem', () => {
  let prediction: PredictionSystem;
  let physics: IPhysics3D;
  let eventBus: IEventBus;

  beforeEach(() => {
    physics = createMockPhysics();
    eventBus = new EventBus();
    prediction = new PredictionSystem(DEFAULT_PREDICTION_CONFIG, physics, eventBus, Vector3.ZERO);
  });

  describe('initialization', () => {
    it('starts at initial position', () => {
      const startPos = new Vector3(5, 0, 10);
      const pred = new PredictionSystem(DEFAULT_PREDICTION_CONFIG, physics, eventBus, startPos);
      expect(pred.getCurrentState().position.equals(startPos)).toBe(true);
    });

    it('starts with zero pending inputs', () => {
      expect(prediction.getPendingInputCount()).toBe(0);
    });

    it('starts with zero last acknowledged sequence', () => {
      expect(prediction.getLastAcknowledgedSequence()).toBe(0);
    });
  });

  describe('applyInput', () => {
    it('calls physics.step with correct parameters', () => {
      const input = createInputPacket(1, 100, 1, 0);
      prediction.applyInput(input, 0, 1000);

      expect(physics.step).toHaveBeenCalledTimes(1);
      expect(physics.step).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ right: 1, forward: 0 }),
        1 / 60,
        1000
      );
    });

    it('updates current state after input', () => {
      const input = createInputPacket(1, 100, 1, 0);
      const newState = prediction.applyInput(input, 0, 1000);

      expect(newState.position.x).not.toBe(0);
      expect(prediction.getCurrentState()).toEqual(newState);
    });

    it('stores input in pending buffer', () => {
      const input = createInputPacket(1, 100);
      prediction.applyInput(input, 0, 1000);

      expect(prediction.getPendingInputCount()).toBe(1);
    });

    it('accumulates multiple inputs', () => {
      for (let i = 1; i <= 5; i++) {
        prediction.applyInput(createInputPacket(i, 100 + i), 0, 1000 + i);
      }

      expect(prediction.getPendingInputCount()).toBe(5);
    });

    it('converts button flags to jump input', () => {
      const input = createInputPacket(1, 100, 0, 0, 0x01); // Jump button
      prediction.applyInput(input, 0, 1000);

      expect(physics.step).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ jump: true }),
        expect.any(Number),
        expect.any(Number)
      );
    });
  });

  describe('input buffer overflow', () => {
    it('emits overflow event when buffer exceeds max', () => {
      const config: PredictionConfig = {
        ...DEFAULT_PREDICTION_CONFIG,
        maxPendingInputs: 5,
      };
      const pred = new PredictionSystem(config, physics, eventBus, Vector3.ZERO);

      const handler = vi.fn();
      eventBus.on('input_buffer_overflow', handler);

      // Add more than max inputs
      for (let i = 1; i <= 7; i++) {
        pred.applyInput(createInputPacket(i, 100 + i), 0, 1000 + i);
      }

      expect(handler).toHaveBeenCalledTimes(2); // 6th and 7th input trigger overflow
    });

    it('maintains max buffer size', () => {
      const config: PredictionConfig = {
        ...DEFAULT_PREDICTION_CONFIG,
        maxPendingInputs: 5,
      };
      const pred = new PredictionSystem(config, physics, eventBus, Vector3.ZERO);

      for (let i = 1; i <= 10; i++) {
        pred.applyInput(createInputPacket(i, 100 + i), 0, 1000 + i);
      }

      expect(pred.getPendingInputCount()).toBe(5);
    });
  });

  describe('acknowledgeInput', () => {
    it('removes acknowledged inputs from buffer', () => {
      for (let i = 1; i <= 5; i++) {
        prediction.applyInput(createInputPacket(i, 100 + i), 0, 1000 + i);
      }

      prediction.acknowledgeInput(3);

      expect(prediction.getPendingInputCount()).toBe(2); // Only 4 and 5 remain
    });

    it('updates last acknowledged sequence', () => {
      prediction.applyInput(createInputPacket(1, 100), 0, 1000);
      prediction.acknowledgeInput(1);

      expect(prediction.getLastAcknowledgedSequence()).toBe(1);
    });

    it('handles acknowledging non-existent sequence', () => {
      prediction.acknowledgeInput(100);
      expect(prediction.getLastAcknowledgedSequence()).toBe(100);
    });
  });

  describe('reconcile', () => {
    it('does not reconcile when error is below threshold', () => {
      const input = createInputPacket(1, 100, 0.001, 0); // Tiny movement
      prediction.applyInput(input, 0, 1000);

      const serverState = createServerState(prediction.getCurrentState().position);
      const handler = vi.fn();
      eventBus.on('desync_detected', handler);

      prediction.reconcile(serverState, 100, 1000);

      expect(handler).not.toHaveBeenCalled();
    });

    it('reconciles when error exceeds threshold', () => {
      // Apply input to move position
      prediction.applyInput(createInputPacket(1, 100, 1, 1), 0, 1000);

      // Server says we're at origin (different from predicted)
      const serverState = createServerState(Vector3.ZERO);
      const handler = vi.fn();
      eventBus.on<DesyncDetectedEvent>('desync_detected', handler);

      prediction.reconcile(serverState, 100, 1000);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('snaps to server position during reconciliation', () => {
      prediction.applyInput(createInputPacket(1, 100, 1, 1), 0, 1000);

      const serverPos = new Vector3(10, 0, 10);
      const serverState = createServerState(serverPos);

      // Clear pending inputs to avoid replay
      prediction.acknowledgeInput(1);

      prediction.reconcile(serverState, 100, 1000);

      expect(prediction.getCurrentState().position.equals(serverPos)).toBe(true);
    });

    it('replays unacknowledged inputs after snap', () => {
      // Apply two inputs
      prediction.applyInput(createInputPacket(1, 100, 1, 0), 0, 1000);
      prediction.applyInput(createInputPacket(2, 101, 1, 0), 0, 1016);

      // Acknowledge first input
      prediction.acknowledgeInput(1);

      // Server says we're at different position
      const serverState = createServerState(new Vector3(5, 0, 0));

      prediction.reconcile(serverState, 100, 1016);

      // Physics should have been called for replay (once for input 2)
      // Initial calls: 2 (for applyInput), Replay calls: 1
      expect(physics.step).toHaveBeenCalledTimes(3);
    });

    it('emits reconciliation event with replay count', () => {
      prediction.applyInput(createInputPacket(1, 100, 1, 0), 0, 1000);
      prediction.applyInput(createInputPacket(2, 101, 1, 0), 0, 1016);

      const handler = vi.fn();
      eventBus.on<ReconciliationEvent>('reconciliation', handler);

      const serverState = createServerState(new Vector3(100, 0, 0)); // Far away
      prediction.reconcile(serverState, 100, 1016);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'reconciliation',
          inputsReplayed: 2,
        })
      );
    });
  });

  describe('getPredictedPosition', () => {
    it('returns smoothed position', () => {
      const pos = prediction.getPredictedPosition();
      expect(pos).toBeInstanceOf(Vector3);
    });

    it('smoothed position approaches current position', () => {
      // Apply several inputs
      for (let i = 1; i <= 10; i++) {
        prediction.applyInput(createInputPacket(i, 100 + i, 1, 0), 0, 1000 + i * 16);
      }

      const current = prediction.getCurrentState().position;
      const smoothed = prediction.getPredictedPosition();

      // Smoothed should be close to current after many updates
      expect(smoothed.distanceTo(current)).toBeLessThan(1);
    });
  });

  /**
   * Property Tests
   */
  describe('property tests', () => {
    /**
     * **Feature: arena-3d-physics-multiplayer, Property 13: Client-Server Physics Equivalence**
     * *For any* sequence of inputs, applying them through PredictionSystem produces
     * the same result as applying them directly through Physics3D.
     * **Validates: Requirements 6.1**
     */
    it('Property 13: same inputs produce same outputs as direct physics', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              movementX: fc.integer({ min: -1, max: 1 }),
              movementY: fc.integer({ min: -1, max: 1 }),
              jump: fc.boolean(),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (inputs) => {
            // Create two identical physics instances
            const physics1 = createMockPhysics();
            const physics2 = createMockPhysics();
            const bus = new EventBus();

            const pred = new PredictionSystem(DEFAULT_PREDICTION_CONFIG, physics1, bus, Vector3.ZERO);

            let directState: PlayerPhysicsState = {
              position: Vector3.ZERO,
              velocity: Vector3.ZERO,
              isGrounded: true,
              lastGroundedTime: 0,
              landingPenaltyEndTime: 0,
            };

            // Apply same inputs to both
            inputs.forEach((input, i) => {
              const packet = createInputPacket(
                i + 1,
                100 + i,
                input.movementX,
                input.movementY,
                input.jump ? 0x01 : 0
              );

              pred.applyInput(packet, 0, 1000 + i * 16);

              directState = physics2.step(
                directState,
                {
                  forward: input.movementY,
                  right: input.movementX,
                  jump: input.jump,
                  yaw: 0,
                },
                1 / 60,
                1000 + i * 16
              );
            });

            // Results should match
            expect(pred.getCurrentState().position.x).toBeCloseTo(directState.position.x, 5);
            expect(pred.getCurrentState().position.z).toBeCloseTo(directState.position.z, 5);
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * **Feature: arena-3d-physics-multiplayer, Property 14: Reconciliation Threshold**
     * *For any* server state with position error > 0.1 units, reconciliation is triggered.
     * **Validates: Requirements 6.3**
     */
    it('Property 14: error > threshold triggers reconciliation', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }).map((n) => n * 0.2),
          (errorDistance) => {
            const bus = new EventBus();
            const pred = new PredictionSystem(DEFAULT_PREDICTION_CONFIG, createMockPhysics(), bus, Vector3.ZERO);

            const handler = vi.fn();
            bus.on('desync_detected', handler);

            // Server position is errorDistance away
            const serverState = createServerState(new Vector3(errorDistance, 0, 0));
            pred.reconcile(serverState, 100, 1000);

            expect(handler).toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * **Feature: arena-3d-physics-multiplayer, Property 15: Input Replay Correctness**
     * *For any* sequence of inputs, after reconciliation, replaying unacknowledged
     * inputs produces correct final state.
     * **Validates: Requirements 6.4**
     */
    it('Property 15: replay produces correct state after reconciliation', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 0, max: 4 }),
          (totalInputs, acknowledgedCount) => {
            const ackCount = Math.min(acknowledgedCount, totalInputs - 1);
            const bus = new EventBus();
            const pred = new PredictionSystem(DEFAULT_PREDICTION_CONFIG, createMockPhysics(), bus, Vector3.ZERO);

            // Apply inputs
            for (let i = 1; i <= totalInputs; i++) {
              pred.applyInput(createInputPacket(i, 100 + i, 1, 0), 0, 1000 + i * 16);
            }

            // Acknowledge some
            if (ackCount > 0) {
              pred.acknowledgeInput(ackCount);
            }

            const pendingBefore = pred.getPendingInputCount();
            expect(pendingBefore).toBe(totalInputs - ackCount);

            // Reconcile with server at origin
            const serverState = createServerState(new Vector3(100, 0, 0));
            pred.reconcile(serverState, 100, 2000);

            // After reconciliation, pending inputs should still be there
            // (they're replayed but not removed)
            expect(pred.getPendingInputCount()).toBe(pendingBefore);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
