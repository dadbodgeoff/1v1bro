/**
 * PredictionSystem - Client-side prediction and reconciliation
 *
 * Layer 4: Client Systems - Implements client-side prediction for responsive controls
 * and reconciliation when server state diverges from prediction.
 *
 * @example
 * const prediction = new PredictionSystem(config, physics, eventBus, startPos);
 * const state = prediction.applyInput(input, yaw, time);
 * prediction.reconcile(serverState, serverTick, time);
 */

import { Vector3 } from '../math/Vector3';
import type { IPhysics3D, PlayerPhysicsState, MovementInput } from '../physics/Physics3D';
import type { IEventBus } from '../core/EventBus';
import type { DesyncDetectedEvent, InputBufferOverflowEvent, ReconciliationEvent } from '../core/GameEvents';
import type { InputPacket, PlayerState } from '../network/Serializer';

/**
 * Configuration for prediction behavior
 */
export interface PredictionConfig {
  /** Position error threshold to trigger reconciliation (default: 0.1 units) */
  readonly reconciliationThreshold: number;
  /** Maximum pending inputs before dropping oldest (default: 64) */
  readonly maxPendingInputs: number;
  /** Smoothing factor for position interpolation (default: 0.1) */
  readonly smoothingFactor: number;
}

export const DEFAULT_PREDICTION_CONFIG: PredictionConfig = {
  reconciliationThreshold: 0.1,
  maxPendingInputs: 64,
  smoothingFactor: 0.1,
};

/**
 * Pending input awaiting server acknowledgment
 */
interface PendingInput {
  input: InputPacket;
  yaw: number; // Track yaw at time of input for correct replay
  resultingState: PlayerPhysicsState;
}

/**
 * Interface for prediction system
 */
export interface IPredictionSystem {
  /** Apply input locally and store for potential replay */
  applyInput(input: InputPacket, yaw: number, currentTime: number): PlayerPhysicsState;
  /** Remove acknowledged inputs from pending buffer */
  acknowledgeInput(sequenceNumber: number): void;
  /** Reconcile with server state, replaying unacknowledged inputs if needed */
  reconcile(serverState: PlayerState, serverTick: number, currentTime: number): PlayerPhysicsState;
  /** Get current predicted state */
  getCurrentState(): PlayerPhysicsState;
  /** Get smoothed predicted position for rendering */
  getPredictedPosition(): Vector3;
  /** Get count of pending unacknowledged inputs */
  getPendingInputCount(): number;
  /** Get last acknowledged sequence number */
  getLastAcknowledgedSequence(): number;
}

/**
 * PredictionSystem implementation
 *
 * Features:
 * - Immediate local input application using same physics as server
 * - Input buffering for reconciliation replay
 * - Automatic reconciliation when prediction error exceeds threshold
 * - Position smoothing for visual stability
 *
 * _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
 */
export class PredictionSystem implements IPredictionSystem {
  private currentState: PlayerPhysicsState;
  private pendingInputs: PendingInput[] = [];
  private lastAcknowledgedSequence = 0;
  private smoothedPosition: Vector3;
  private readonly config: PredictionConfig;
  private readonly physics: IPhysics3D;
  private readonly eventBus: IEventBus;

  constructor(
    config: PredictionConfig,
    physics: IPhysics3D,
    eventBus: IEventBus,
    initialPosition: Vector3
  ) {
    this.config = config;
    this.physics = physics;
    this.eventBus = eventBus;
    this.currentState = {
      position: initialPosition,
      velocity: Vector3.ZERO,
      isGrounded: true,
      lastGroundedTime: 0,
      landingPenaltyEndTime: 0,
    };
    this.smoothedPosition = initialPosition;
  }

  /**
   * Apply input locally using identical physics as server
   *
   * Stores input for potential replay during reconciliation.
   * _Requirements: 6.1_
   */
  applyInput(input: InputPacket, yaw: number, currentTime: number): PlayerPhysicsState {
    const movementInput: MovementInput = {
      forward: input.movementY,
      right: input.movementX,
      jump: (input.buttons & 0x01) !== 0,
      yaw,
    };

    const deltaTime = 1 / 60; // Fixed timestep
    const newState = this.physics.step(this.currentState, movementInput, deltaTime, currentTime);

    // Store pending input with yaw for correct replay
    this.pendingInputs.push({
      input,
      yaw,
      resultingState: newState,
    });

    // Trim if too many pending
    if (this.pendingInputs.length > this.config.maxPendingInputs) {
      this.pendingInputs.shift();
      this.eventBus.emit<InputBufferOverflowEvent>({
        type: 'input_buffer_overflow',
        timestamp: currentTime,
        droppedCount: 1,
      });
    }

    this.currentState = newState;
    this.smoothedPosition = this.smoothedPosition.lerp(newState.position, this.config.smoothingFactor);

    return newState;
  }

  /**
   * Remove acknowledged inputs from pending buffer
   *
   * Called when server acknowledges receipt of inputs.
   * _Requirements: 6.4_
   */
  acknowledgeInput(sequenceNumber: number): void {
    this.lastAcknowledgedSequence = sequenceNumber;
    this.pendingInputs = this.pendingInputs.filter((p) => p.input.sequenceNumber > sequenceNumber);
  }

  /**
   * Reconcile with authoritative server state
   *
   * If prediction error exceeds threshold, snaps to server state
   * and replays all unacknowledged inputs.
   *
   * _Requirements: 6.2, 6.3, 6.4_
   */
  reconcile(serverState: PlayerState, serverTick: number, currentTime: number): PlayerPhysicsState {
    const serverPosition = serverState.position;
    const predictionError = this.currentState.position.distanceTo(serverPosition);

    if (predictionError > this.config.reconciliationThreshold) {
      this.eventBus.emit<DesyncDetectedEvent>({
        type: 'desync_detected',
        timestamp: currentTime,
        predictionError,
        tickNumber: serverTick,
      });

      // Snap to server state
      this.currentState = {
        position: serverPosition,
        velocity: serverState.velocity,
        isGrounded: (serverState.stateFlags & 0x01) !== 0,
        lastGroundedTime: currentTime,
        landingPenaltyEndTime: 0,
      };

      const inputsReplayed = this.pendingInputs.length;

      // Replay unacknowledged inputs
      for (const pending of this.pendingInputs) {
        const movementInput: MovementInput = {
          forward: pending.input.movementY,
          right: pending.input.movementX,
          jump: (pending.input.buttons & 0x01) !== 0,
          yaw: pending.yaw, // Use stored yaw for correct replay
        };

        this.currentState = this.physics.step(this.currentState, movementInput, 1 / 60, currentTime);
      }

      this.smoothedPosition = this.currentState.position;

      this.eventBus.emit<ReconciliationEvent>({
        type: 'reconciliation',
        timestamp: currentTime,
        tickNumber: serverTick,
        errorMagnitude: predictionError,
        inputsReplayed,
      });
    }

    return this.currentState;
  }

  /**
   * Get current predicted state
   */
  getCurrentState(): PlayerPhysicsState {
    return this.currentState;
  }

  /**
   * Get smoothed predicted position for rendering
   */
  getPredictedPosition(): Vector3 {
    return this.smoothedPosition;
  }

  /**
   * Get count of pending unacknowledged inputs
   */
  getPendingInputCount(): number {
    return this.pendingInputs.length;
  }

  /**
   * Get last acknowledged sequence number
   */
  getLastAcknowledgedSequence(): number {
    return this.lastAcknowledgedSequence;
  }
}
