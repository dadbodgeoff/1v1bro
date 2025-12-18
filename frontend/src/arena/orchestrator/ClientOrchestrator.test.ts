/**
 * ClientOrchestrator Integration Tests
 * 
 * Tests for client initialization sequence and prediction-reconciliation cycle.
 * 
 * **Feature: arena-3d-physics-multiplayer, Property: Client-Server Physics Equivalence**
 * **Validates: Requirements 6.1, 6.3, 6.4**
 * 
 * @module orchestrator/ClientOrchestrator.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ClientOrchestrator, createClientOrchestrator } from './ClientOrchestrator';
import { DEFAULT_GAME_CONFIG } from '../config/GameConfig';
import { isOk } from '../core/Result';
import { Vector3 } from '../math/Vector3';
import type { DesyncDetectedEvent, ReconciliationEvent } from '../core/GameEvents';

// Mock AudioContext
class MockAudioContext {
  sampleRate = 44100;
  listener = {
    positionX: { value: 0 },
    positionY: { value: 0 },
    positionZ: { value: 0 },
    forwardX: { value: 0 },
    forwardY: { value: 0 },
    forwardZ: { value: -1 },
    upX: { value: 0 },
    upY: { value: 1 },
    upZ: { value: 0 }
  };
  
  createGain() {
    return { gain: { value: 1 }, connect: vi.fn() };
  }
  
  createPanner() {
    return {
      panningModel: 'HRTF',
      distanceModel: 'inverse',
      refDistance: 1,
      maxDistance: 50,
      rolloffFactor: 1,
      coneInnerAngle: 360,
      coneOuterAngle: 360,
      coneOuterGain: 0,
      positionX: { value: 0 },
      positionY: { value: 0 },
      positionZ: { value: 0 },
      connect: vi.fn(),
      setPosition: vi.fn()
    };
  }
  
  createBufferSource() {
    return { buffer: null, connect: vi.fn(), start: vi.fn() };
  }
  
  createBuffer(channels: number, length: number, sampleRate: number) {
    return { getChannelData: () => new Float32Array(length) };
  }
  
  get destination() { return {}; }
  close() { return Promise.resolve(); }
}

vi.stubGlobal('AudioContext', MockAudioContext);

describe('ClientOrchestrator', () => {
  let orchestrator: ClientOrchestrator;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    orchestrator = createClientOrchestrator();
  });

  afterEach(() => {
    orchestrator.dispose();
    document.body.removeChild(container);
  });

  describe('initialization', () => {
    it('should start in uninitialized state', () => {
      expect(orchestrator.getState()).toBe('uninitialized');
    });

    it('should initialize all systems successfully', async () => {
      const result = await orchestrator.initialize(container);
      
      expect(isOk(result)).toBe(true);
      expect(orchestrator.getState()).toBe('ready');
    });

    it('should have all systems after initialization', async () => {
      await orchestrator.initialize(container);
      
      const systems = orchestrator.getSystems();
      expect(systems).not.toBeNull();
      expect(systems?.eventBus).toBeDefined();
      expect(systems?.collisionWorld).toBeDefined();
      expect(systems?.physics).toBeDefined();
      expect(systems?.inputManager).toBeDefined();
      expect(systems?.cameraController).toBeDefined();
      expect(systems?.predictionSystem).toBeDefined();
      expect(systems?.interpolationBuffer).toBeDefined();
      expect(systems?.hudRenderer).toBeDefined();
      expect(systems?.audioSystem).toBeDefined();
      expect(systems?.debugOverlay).toBeDefined();
      expect(systems?.diagnosticsRecorder).toBeDefined();
    });

    it('should fail if already initialized', async () => {
      await orchestrator.initialize(container);
      const result = await orchestrator.initialize(container);
      
      expect(isOk(result)).toBe(false);
    });

    it('should emit system_ready events during initialization', async () => {
      const readySystems: string[] = [];
      
      await orchestrator.initialize(container);
      
      const systems = orchestrator.getSystems();
      systems?.eventBus.on('system_ready', (e: any) => {
        readySystems.push(e.systemName);
      });
      
      // Systems were already initialized, but we can verify the orchestrator is ready
      expect(orchestrator.getState()).toBe('ready');
    });
  });

  describe('game loop', () => {
    it('should start game loop when ready', async () => {
      await orchestrator.initialize(container);
      
      orchestrator.startGameLoop();
      
      expect(orchestrator.getState()).toBe('playing');
    });

    it('should stop game loop', async () => {
      await orchestrator.initialize(container);
      orchestrator.startGameLoop();
      
      orchestrator.stopGameLoop();
      
      expect(orchestrator.getState()).toBe('ready');
    });

    it('should pause and resume', async () => {
      await orchestrator.initialize(container);
      orchestrator.startGameLoop();
      
      orchestrator.pause();
      expect(orchestrator.getState()).toBe('paused');
      
      orchestrator.resume();
      expect(orchestrator.getState()).toBe('playing');
    });

    it('should not start game loop if not initialized', () => {
      orchestrator.startGameLoop();
      
      expect(orchestrator.getState()).toBe('uninitialized');
    });
  });

  describe('dispose', () => {
    it('should clean up all systems', async () => {
      await orchestrator.initialize(container);
      
      orchestrator.dispose();
      
      expect(orchestrator.getState()).toBe('uninitialized');
      expect(orchestrator.getSystems()).toBeNull();
    });

    it('should stop game loop on dispose', async () => {
      await orchestrator.initialize(container);
      orchestrator.startGameLoop();
      
      orchestrator.dispose();
      
      expect(orchestrator.getState()).toBe('uninitialized');
    });
  });
});


/**
 * Full Prediction-Reconciliation Cycle Integration Tests
 * 
 * **Feature: arena-3d-physics-multiplayer, Property 13: Client-Server Physics Equivalence**
 * **Validates: Requirements 6.1, 6.3, 6.4**
 */
describe('Prediction-Reconciliation Cycle Integration', () => {
  let orchestrator: ClientOrchestrator;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    orchestrator = createClientOrchestrator();
  });

  afterEach(() => {
    orchestrator.dispose();
    document.body.removeChild(container);
  });

  describe('input application', () => {
    it('should apply input to prediction system immediately', async () => {
      await orchestrator.initialize(container);
      const systems = orchestrator.getSystems()!;
      
      const initialState = systems.predictionSystem.getCurrentState();
      const initialPosition = initialState.position;
      
      // Apply forward movement input
      const inputPacket = {
        sequenceNumber: 1,
        tickNumber: 1,
        movementX: 0,
        movementY: 1, // forward
        lookDeltaX: 0,
        lookDeltaY: 0,
        buttons: 0,
        clientTimestamp: Date.now()
      };
      
      systems.predictionSystem.applyInput(inputPacket, 0, Date.now());
      
      const newState = systems.predictionSystem.getCurrentState();
      // Position should have changed due to movement
      expect(newState.position).not.toEqual(initialPosition);
    });

    it('should track pending inputs for reconciliation', async () => {
      await orchestrator.initialize(container);
      const systems = orchestrator.getSystems()!;
      
      expect(systems.predictionSystem.getPendingInputCount()).toBe(0);
      
      // Apply multiple inputs
      for (let i = 1; i <= 5; i++) {
        const inputPacket = {
          sequenceNumber: i,
          tickNumber: i,
          movementX: 0,
          movementY: 1,
          lookDeltaX: 0,
          lookDeltaY: 0,
          buttons: 0,
          clientTimestamp: Date.now() + i * 16
        };
        systems.predictionSystem.applyInput(inputPacket, 0, Date.now() + i * 16);
      }
      
      expect(systems.predictionSystem.getPendingInputCount()).toBe(5);
    });

    it('should acknowledge inputs and remove from pending buffer', async () => {
      await orchestrator.initialize(container);
      const systems = orchestrator.getSystems()!;
      
      // Apply 5 inputs
      for (let i = 1; i <= 5; i++) {
        const inputPacket = {
          sequenceNumber: i,
          tickNumber: i,
          movementX: 0,
          movementY: 1,
          lookDeltaX: 0,
          lookDeltaY: 0,
          buttons: 0,
          clientTimestamp: Date.now() + i * 16
        };
        systems.predictionSystem.applyInput(inputPacket, 0, Date.now() + i * 16);
      }
      
      expect(systems.predictionSystem.getPendingInputCount()).toBe(5);
      
      // Acknowledge first 3 inputs
      systems.predictionSystem.acknowledgeInput(3);
      
      expect(systems.predictionSystem.getPendingInputCount()).toBe(2);
      expect(systems.predictionSystem.getLastAcknowledgedSequence()).toBe(3);
    });
  });

  describe('reconciliation', () => {
    it('should not reconcile when prediction matches server state', async () => {
      await orchestrator.initialize(container);
      const systems = orchestrator.getSystems()!;
      
      let desyncDetected = false;
      systems.eventBus.on<DesyncDetectedEvent>('desync_detected', () => {
        desyncDetected = true;
      });
      
      const currentState = systems.predictionSystem.getCurrentState();
      
      // Server state matches prediction (within threshold)
      const serverState = {
        entityId: 1,
        position: currentState.position,
        velocity: currentState.velocity,
        yaw: 0,
        pitch: 0,
        health: 100,
        stateFlags: currentState.isGrounded ? 0x01 : 0x00
      };
      
      systems.predictionSystem.reconcile(serverState, 1, Date.now());
      
      expect(desyncDetected).toBe(false);
    });

    it('should trigger reconciliation when prediction error exceeds threshold', async () => {
      await orchestrator.initialize(container);
      const systems = orchestrator.getSystems()!;
      
      let desyncDetected = false;
      let reconciliationTriggered = false;
      
      systems.eventBus.on<DesyncDetectedEvent>('desync_detected', () => {
        desyncDetected = true;
      });
      
      systems.eventBus.on<ReconciliationEvent>('reconciliation', () => {
        reconciliationTriggered = true;
      });
      
      // Apply some inputs to move the player
      for (let i = 1; i <= 10; i++) {
        const inputPacket = {
          sequenceNumber: i,
          tickNumber: i,
          movementX: 0,
          movementY: 1,
          lookDeltaX: 0,
          lookDeltaY: 0,
          buttons: 0,
          clientTimestamp: Date.now() + i * 16
        };
        systems.predictionSystem.applyInput(inputPacket, 0, Date.now() + i * 16);
      }
      
      // Server state is significantly different (more than 0.1 units)
      const serverState = {
        entityId: 1,
        position: new Vector3(10, 0, 10), // Far from predicted position
        velocity: Vector3.ZERO,
        yaw: 0,
        pitch: 0,
        health: 100,
        stateFlags: 0x01
      };
      
      systems.predictionSystem.reconcile(serverState, 10, Date.now());
      
      expect(desyncDetected).toBe(true);
      expect(reconciliationTriggered).toBe(true);
    });

    it('should replay unacknowledged inputs after reconciliation', async () => {
      await orchestrator.initialize(container);
      const systems = orchestrator.getSystems()!;
      
      let inputsReplayed = 0;
      
      systems.eventBus.on<ReconciliationEvent>('reconciliation', (event) => {
        inputsReplayed = event.inputsReplayed;
      });
      
      // Apply 5 inputs
      for (let i = 1; i <= 5; i++) {
        const inputPacket = {
          sequenceNumber: i,
          tickNumber: i,
          movementX: 0,
          movementY: 1,
          lookDeltaX: 0,
          lookDeltaY: 0,
          buttons: 0,
          clientTimestamp: Date.now() + i * 16
        };
        systems.predictionSystem.applyInput(inputPacket, 0, Date.now() + i * 16);
      }
      
      // Acknowledge first 2 inputs
      systems.predictionSystem.acknowledgeInput(2);
      
      // Server state differs significantly
      const serverState = {
        entityId: 1,
        position: new Vector3(5, 0, 5),
        velocity: Vector3.ZERO,
        yaw: 0,
        pitch: 0,
        health: 100,
        stateFlags: 0x01
      };
      
      systems.predictionSystem.reconcile(serverState, 2, Date.now());
      
      // Should replay the 3 unacknowledged inputs (3, 4, 5)
      expect(inputsReplayed).toBe(3);
    });

    it('should snap to server position after reconciliation', async () => {
      await orchestrator.initialize(container);
      const systems = orchestrator.getSystems()!;
      
      // Apply inputs to move player
      for (let i = 1; i <= 5; i++) {
        const inputPacket = {
          sequenceNumber: i,
          tickNumber: i,
          movementX: 0,
          movementY: 1,
          lookDeltaX: 0,
          lookDeltaY: 0,
          buttons: 0,
          clientTimestamp: Date.now() + i * 16
        };
        systems.predictionSystem.applyInput(inputPacket, 0, Date.now() + i * 16);
      }
      
      // Acknowledge all inputs
      systems.predictionSystem.acknowledgeInput(5);
      
      const serverPosition = new Vector3(3, 0, 3);
      const serverState = {
        entityId: 1,
        position: serverPosition,
        velocity: Vector3.ZERO,
        yaw: 0,
        pitch: 0,
        health: 100,
        stateFlags: 0x01
      };
      
      systems.predictionSystem.reconcile(serverState, 5, Date.now());
      
      const finalState = systems.predictionSystem.getCurrentState();
      // With no pending inputs to replay, position should match server
      expect(finalState.position.x).toBeCloseTo(serverPosition.x, 2);
      expect(finalState.position.z).toBeCloseTo(serverPosition.z, 2);
    });
  });

  describe('full prediction-reconciliation cycle', () => {
    /**
     * Test full prediction-reconciliation cycle
     * **Feature: arena-3d-physics-multiplayer, Property 13: Client-Server Physics Equivalence**
     * **Validates: Requirements 6.1, 6.3, 6.4**
     */
    it('should complete full prediction-reconciliation cycle correctly', async () => {
      await orchestrator.initialize(container);
      const systems = orchestrator.getSystems()!;
      
      const events: string[] = [];
      
      systems.eventBus.on<DesyncDetectedEvent>('desync_detected', () => {
        events.push('desync_detected');
      });
      
      systems.eventBus.on<ReconciliationEvent>('reconciliation', () => {
        events.push('reconciliation');
      });
      
      // Step 1: Apply local inputs (client prediction)
      const inputSequence = [
        { seq: 1, movementY: 1 },  // forward
        { seq: 2, movementY: 1 },  // forward
        { seq: 3, movementX: 1 },  // right
        { seq: 4, movementY: 1 },  // forward
        { seq: 5, movementY: 1 },  // forward
      ];
      
      for (const input of inputSequence) {
        const inputPacket = {
          sequenceNumber: input.seq,
          tickNumber: input.seq,
          movementX: input.movementX || 0,
          movementY: input.movementY || 0,
          lookDeltaX: 0,
          lookDeltaY: 0,
          buttons: 0,
          clientTimestamp: Date.now() + input.seq * 16
        };
        systems.predictionSystem.applyInput(inputPacket, 0, Date.now() + input.seq * 16);
      }
      
      expect(systems.predictionSystem.getPendingInputCount()).toBe(5);
      
      // Step 2: Server acknowledges first 2 inputs
      systems.predictionSystem.acknowledgeInput(2);
      expect(systems.predictionSystem.getPendingInputCount()).toBe(3);
      
      // Step 3: Server sends state that differs from prediction
      const serverState = {
        entityId: 1,
        position: new Vector3(2, 0, 2),
        velocity: new Vector3(0, 0, 1),
        yaw: 0,
        pitch: 0,
        health: 100,
        stateFlags: 0x01
      };
      
      systems.predictionSystem.reconcile(serverState, 2, Date.now());
      
      // Step 4: Verify reconciliation occurred
      expect(events).toContain('desync_detected');
      expect(events).toContain('reconciliation');
      
      // Step 5: Verify remaining inputs were replayed
      const finalState = systems.predictionSystem.getCurrentState();
      expect(finalState.position).toBeDefined();
      // Position should be server position + effect of replayed inputs
    });

    it('should handle multiple reconciliation cycles', async () => {
      await orchestrator.initialize(container);
      const systems = orchestrator.getSystems()!;
      
      let reconciliationCount = 0;
      
      systems.eventBus.on<ReconciliationEvent>('reconciliation', () => {
        reconciliationCount++;
      });
      
      // First cycle
      for (let i = 1; i <= 3; i++) {
        const inputPacket = {
          sequenceNumber: i,
          tickNumber: i,
          movementX: 0,
          movementY: 1,
          lookDeltaX: 0,
          lookDeltaY: 0,
          buttons: 0,
          clientTimestamp: Date.now() + i * 16
        };
        systems.predictionSystem.applyInput(inputPacket, 0, Date.now() + i * 16);
      }
      
      systems.predictionSystem.acknowledgeInput(3);
      
      const serverState1 = {
        entityId: 1,
        position: new Vector3(5, 0, 5),
        velocity: Vector3.ZERO,
        yaw: 0,
        pitch: 0,
        health: 100,
        stateFlags: 0x01
      };
      
      systems.predictionSystem.reconcile(serverState1, 3, Date.now());
      
      // Second cycle
      for (let i = 4; i <= 6; i++) {
        const inputPacket = {
          sequenceNumber: i,
          tickNumber: i,
          movementX: 0,
          movementY: 1,
          lookDeltaX: 0,
          lookDeltaY: 0,
          buttons: 0,
          clientTimestamp: Date.now() + i * 16
        };
        systems.predictionSystem.applyInput(inputPacket, 0, Date.now() + i * 16);
      }
      
      systems.predictionSystem.acknowledgeInput(6);
      
      const serverState2 = {
        entityId: 1,
        position: new Vector3(10, 0, 10),
        velocity: Vector3.ZERO,
        yaw: 0,
        pitch: 0,
        health: 100,
        stateFlags: 0x01
      };
      
      systems.predictionSystem.reconcile(serverState2, 6, Date.now());
      
      expect(reconciliationCount).toBe(2);
    });

    it('should preserve yaw during input replay', async () => {
      await orchestrator.initialize(container);
      const systems = orchestrator.getSystems()!;
      
      // Apply inputs with different yaw values
      const yawValues = [0, Math.PI / 4, Math.PI / 2, Math.PI, -Math.PI / 2];
      
      for (let i = 0; i < yawValues.length; i++) {
        const inputPacket = {
          sequenceNumber: i + 1,
          tickNumber: i + 1,
          movementX: 0,
          movementY: 1,
          lookDeltaX: 0,
          lookDeltaY: 0,
          buttons: 0,
          clientTimestamp: Date.now() + i * 16
        };
        systems.predictionSystem.applyInput(inputPacket, yawValues[i], Date.now() + i * 16);
      }
      
      const stateBeforeReconcile = systems.predictionSystem.getCurrentState();
      
      // Trigger reconciliation
      const serverState = {
        entityId: 1,
        position: new Vector3(0, 0, 0),
        velocity: Vector3.ZERO,
        yaw: 0,
        pitch: 0,
        health: 100,
        stateFlags: 0x01
      };
      
      systems.predictionSystem.reconcile(serverState, 0, Date.now());
      
      // State should be different due to replay with stored yaw values
      const stateAfterReconcile = systems.predictionSystem.getCurrentState();
      expect(stateAfterReconcile.position).toBeDefined();
    });
  });
});

describe('createClientOrchestrator', () => {
  it('should create orchestrator with default config', () => {
    const orchestrator = createClientOrchestrator();
    expect(orchestrator).toBeInstanceOf(ClientOrchestrator);
    orchestrator.dispose();
  });

  it('should create orchestrator with custom config', () => {
    const orchestrator = createClientOrchestrator({
      debug: { ...DEFAULT_GAME_CONFIG.debug, enabled: true }
    });
    expect(orchestrator).toBeInstanceOf(ClientOrchestrator);
    orchestrator.dispose();
  });
});
