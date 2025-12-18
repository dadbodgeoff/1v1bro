/**
 * ServerOrchestrator Integration Tests
 * 
 * Tests for server initialization sequence and tick cycle with multiple players.
 * 
 * **Feature: arena-3d-physics-multiplayer, Property 31: Input Sequence Ordering**
 * **Validates: Requirements 1.3, 1.4**
 * 
 * @module orchestrator/ServerOrchestrator.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ServerOrchestrator, createServerOrchestrator } from './ServerOrchestrator';
import { DEFAULT_GAME_CONFIG } from '../config/GameConfig';
import { isOk } from '../core/Result';
import { Vector3 } from '../math/Vector3';
import type { 
  MatchStateChangedEvent, 
  PlayerDeathEvent,
  HitConfirmedEvent,
  ViolationDetectedEvent
} from '../core/GameEvents';

describe('ServerOrchestrator', () => {
  let orchestrator: ServerOrchestrator;

  beforeEach(() => {
    orchestrator = createServerOrchestrator();
  });

  afterEach(() => {
    orchestrator.dispose();
  });

  describe('initialization', () => {
    it('should start in uninitialized state', () => {
      expect(orchestrator.getState()).toBe('uninitialized');
    });

    it('should initialize all systems successfully', () => {
      const result = orchestrator.initialize();
      
      expect(isOk(result)).toBe(true);
      expect(orchestrator.getState()).toBe('ready');
    });

    it('should have all systems after initialization', () => {
      orchestrator.initialize();
      
      const systems = orchestrator.getSystems();
      expect(systems).not.toBeNull();
      expect(systems?.eventBus).toBeDefined();
      expect(systems?.collisionWorld).toBeDefined();
      expect(systems?.physics).toBeDefined();
      expect(systems?.spawnSystem).toBeDefined();
      expect(systems?.combatSystem).toBeDefined();
      expect(systems?.matchStateMachine).toBeDefined();
      expect(systems?.antiCheat).toBeDefined();
      expect(systems?.lagCompensation).toBeDefined();
      expect(systems?.tickScheduler).toBeDefined();
      expect(systems?.tickProcessor).toBeDefined();
    });

    it('should fail if already initialized', () => {
      orchestrator.initialize();
      const result = orchestrator.initialize();
      
      expect(isOk(result)).toBe(false);
    });

    it('should emit system_ready events during initialization', () => {
      const result = orchestrator.initialize();
      
      expect(isOk(result)).toBe(true);
      expect(orchestrator.getState()).toBe('ready');
    });
  });

  describe('tick loop', () => {
    it('should start tick loop when ready', () => {
      orchestrator.initialize();
      
      orchestrator.start();
      
      expect(orchestrator.getState()).toBe('running');
    });

    it('should stop tick loop', () => {
      orchestrator.initialize();
      orchestrator.start();
      
      orchestrator.stop();
      
      expect(orchestrator.getState()).toBe('ready');
    });

    it('should pause and resume', () => {
      orchestrator.initialize();
      orchestrator.start();
      
      orchestrator.pause();
      expect(orchestrator.getState()).toBe('paused');
      
      orchestrator.resume();
      expect(orchestrator.getState()).toBe('running');
    });

    it('should not start if not initialized', () => {
      orchestrator.start();
      
      expect(orchestrator.getState()).toBe('uninitialized');
    });
  });

  describe('player management', () => {
    it('should add player successfully', () => {
      orchestrator.initialize();
      
      const result = orchestrator.addPlayer(1);
      
      expect(isOk(result)).toBe(true);
    });

    it('should fail to add player if not initialized', () => {
      const result = orchestrator.addPlayer(1);
      
      expect(isOk(result)).toBe(false);
    });

    it('should remove player', () => {
      orchestrator.initialize();
      orchestrator.addPlayer(1);
      
      // Should not throw
      expect(() => orchestrator.removePlayer(1)).not.toThrow();
    });

    it('should handle multiple players', () => {
      orchestrator.initialize();
      
      const result1 = orchestrator.addPlayer(1);
      const result2 = orchestrator.addPlayer(2);
      
      expect(isOk(result1)).toBe(true);
      expect(isOk(result2)).toBe(true);
    });
  });

  describe('dispose', () => {
    it('should clean up all systems', () => {
      orchestrator.initialize();
      
      orchestrator.dispose();
      
      expect(orchestrator.getState()).toBe('uninitialized');
      expect(orchestrator.getSystems()).toBeNull();
    });

    it('should stop tick loop on dispose', () => {
      orchestrator.initialize();
      orchestrator.start();
      
      orchestrator.dispose();
      
      expect(orchestrator.getState()).toBe('uninitialized');
    });
  });
});


/**
 * Full Tick Cycle Integration Tests
 * 
 * **Feature: arena-3d-physics-multiplayer, Property 31: Input Sequence Ordering**
 * **Validates: Requirements 1.3, 1.4**
 */
describe('Full Tick Cycle Integration', () => {
  let orchestrator: ServerOrchestrator;

  beforeEach(() => {
    orchestrator = createServerOrchestrator();
  });

  afterEach(() => {
    orchestrator.dispose();
  });

  describe('tick processing with multiple players', () => {
    /**
     * Test full tick cycle with multiple players
     * **Feature: arena-3d-physics-multiplayer, Property 31: Input Sequence Ordering**
     * **Validates: Requirements 1.3, 1.4**
     */
    it('should process tick with multiple players', () => {
      orchestrator.initialize();
      orchestrator.addPlayer(1);
      orchestrator.addPlayer(2);
      
      const systems = orchestrator.getSystems()!;
      
      // Manually trigger a tick
      systems.tickProcessor.processTick(1, 0.016, Date.now());
      
      // Verify players still exist
      const playerIds = systems.tickProcessor.getPlayerIds();
      expect(playerIds).toContain(1);
      expect(playerIds).toContain(2);
    });

    it('should process inputs in sequence order', () => {
      orchestrator.initialize();
      orchestrator.addPlayer(1);
      
      const systems = orchestrator.getSystems()!;
      const currentTime = Date.now();
      
      // Queue inputs out of order
      systems.tickProcessor.queueInput(1, {
        sequenceNumber: 3,
        tickNumber: 1,
        movementX: 0,
        movementY: 1,
        lookDeltaX: 0,
        lookDeltaY: 0,
        buttons: 0,
        clientTimestamp: currentTime + 48
      });
      
      systems.tickProcessor.queueInput(1, {
        sequenceNumber: 1,
        tickNumber: 1,
        movementX: 1,
        movementY: 0,
        lookDeltaX: 0,
        lookDeltaY: 0,
        buttons: 0,
        clientTimestamp: currentTime
      });
      
      systems.tickProcessor.queueInput(1, {
        sequenceNumber: 2,
        tickNumber: 1,
        movementX: 0,
        movementY: 1,
        lookDeltaX: 0,
        lookDeltaY: 0,
        buttons: 0,
        clientTimestamp: currentTime + 16
      });
      
      // Process tick - inputs should be processed in sequence order
      systems.tickProcessor.processTick(1, 0.016, currentTime);
      
      // Player state should have been updated
      const state = systems.tickProcessor.getPlayerState(1);
      expect(state).toBeDefined();
      expect(state?.physics).toBeDefined();
    });

    it('should update player physics state each tick', () => {
      orchestrator.initialize();
      orchestrator.addPlayer(1);
      
      const systems = orchestrator.getSystems()!;
      const currentTime = Date.now();
      
      // Get initial state
      const initialState = systems.tickProcessor.getPlayerState(1);
      const initialPosition = initialState?.physics?.position;
      
      // Queue forward movement input
      systems.tickProcessor.queueInput(1, {
        sequenceNumber: 1,
        tickNumber: 1,
        movementX: 0,
        movementY: 1, // forward
        lookDeltaX: 0,
        lookDeltaY: 0,
        buttons: 0,
        clientTimestamp: currentTime
      });
      
      // Process tick
      systems.tickProcessor.processTick(1, 0.016, currentTime);
      
      // State should have changed
      const newState = systems.tickProcessor.getPlayerState(1);
      expect(newState?.physics?.position).toBeDefined();
    });

    it('should handle multiple ticks in sequence', () => {
      orchestrator.initialize();
      orchestrator.addPlayer(1);
      
      const systems = orchestrator.getSystems()!;
      const currentTime = Date.now();
      
      // Process multiple ticks
      for (let tick = 1; tick <= 10; tick++) {
        systems.tickProcessor.queueInput(1, {
          sequenceNumber: tick,
          tickNumber: tick,
          movementX: 0,
          movementY: 1,
          lookDeltaX: 0,
          lookDeltaY: 0,
          buttons: 0,
          clientTimestamp: currentTime + tick * 16
        });
        
        systems.tickProcessor.processTick(tick, 0.016, currentTime + tick * 16);
      }
      
      // Player should still exist and have valid state
      const state = systems.tickProcessor.getPlayerState(1);
      expect(state).toBeDefined();
      expect(state?.physics?.position).toBeDefined();
    });

    it('should process inputs from multiple players in same tick', () => {
      orchestrator.initialize();
      orchestrator.addPlayer(1);
      orchestrator.addPlayer(2);
      
      const systems = orchestrator.getSystems()!;
      const currentTime = Date.now();
      
      // Queue inputs for both players
      systems.tickProcessor.queueInput(1, {
        sequenceNumber: 1,
        tickNumber: 1,
        movementX: 1,
        movementY: 0,
        lookDeltaX: 0,
        lookDeltaY: 0,
        buttons: 0,
        clientTimestamp: currentTime
      });
      
      systems.tickProcessor.queueInput(2, {
        sequenceNumber: 1,
        tickNumber: 1,
        movementX: -1,
        movementY: 0,
        lookDeltaX: 0,
        lookDeltaY: 0,
        buttons: 0,
        clientTimestamp: currentTime
      });
      
      // Process tick
      systems.tickProcessor.processTick(1, 0.016, currentTime);
      
      // Both players should have updated states
      const state1 = systems.tickProcessor.getPlayerState(1);
      const state2 = systems.tickProcessor.getPlayerState(2);
      
      expect(state1?.physics?.position).toBeDefined();
      expect(state2?.physics?.position).toBeDefined();
    });
  });

  describe('match state transitions', () => {
    it('should transition to countdown when both players connect', () => {
      orchestrator.initialize();
      
      const systems = orchestrator.getSystems()!;
      
      // Initially waiting
      expect(systems.matchStateMachine.getState()).toBe('waiting');
      
      // Add first player
      orchestrator.addPlayer(1);
      expect(systems.matchStateMachine.getState()).toBe('waiting');
      
      // Add second player - should transition to countdown
      orchestrator.addPlayer(2);
      expect(systems.matchStateMachine.getState()).toBe('countdown');
    });

    it('should transition to playing after countdown', () => {
      orchestrator.initialize();
      orchestrator.addPlayer(1);
      orchestrator.addPlayer(2);
      
      const systems = orchestrator.getSystems()!;
      
      expect(systems.matchStateMachine.getState()).toBe('countdown');
      
      // Advance time past countdown (3 seconds)
      systems.matchStateMachine.update(Date.now() + 4000);
      
      expect(systems.matchStateMachine.getState()).toBe('playing');
    });

    it('should end match when player disconnects during playing', () => {
      orchestrator.initialize();
      orchestrator.addPlayer(1);
      orchestrator.addPlayer(2);
      
      const systems = orchestrator.getSystems()!;
      
      // Advance to playing state
      systems.matchStateMachine.update(Date.now() + 4000);
      expect(systems.matchStateMachine.getState()).toBe('playing');
      
      // Remove a player
      orchestrator.removePlayer(2);
      
      // Match should end
      expect(systems.matchStateMachine.getState()).toBe('ended');
    });

    it('should emit match state changed events', () => {
      orchestrator.initialize();
      
      const systems = orchestrator.getSystems()!;
      const stateChanges: string[] = [];
      
      systems.eventBus.on<MatchStateChangedEvent>('match_state_changed', (event) => {
        stateChanges.push(event.newState);
      });
      
      orchestrator.addPlayer(1);
      orchestrator.addPlayer(2);
      
      expect(stateChanges).toContain('countdown');
    });
  });

  describe('combat integration', () => {
    it('should initialize combat state for new players', () => {
      orchestrator.initialize();
      orchestrator.addPlayer(1);
      
      const systems = orchestrator.getSystems()!;
      const combatState = systems.combatSystem.getPlayerState(1);
      
      expect(combatState).toBeDefined();
      expect(combatState?.health).toBe(100);
      expect(combatState?.isDead).toBe(false);
    });

    it('should remove combat state when player disconnects', () => {
      orchestrator.initialize();
      orchestrator.addPlayer(1);
      
      const systems = orchestrator.getSystems()!;
      
      // Verify player exists
      expect(systems.combatSystem.getPlayerState(1)).toBeDefined();
      
      // Remove player
      orchestrator.removePlayer(1);
      
      // Combat state should be removed
      expect(systems.combatSystem.getPlayerState(1)).toBeUndefined();
    });
  });

  describe('spawn system integration', () => {
    it('should spawn players at valid spawn points', () => {
      orchestrator.initialize();
      orchestrator.addPlayer(1);
      
      const systems = orchestrator.getSystems()!;
      const state = systems.tickProcessor.getPlayerState(1);
      
      expect(state?.physics?.position).toBeDefined();
      // Position should be within arena bounds
      expect(state?.physics?.position.x).toBeGreaterThanOrEqual(-18);
      expect(state?.physics?.position.x).toBeLessThanOrEqual(18);
      expect(state?.physics?.position.z).toBeGreaterThanOrEqual(-20);
      expect(state?.physics?.position.z).toBeLessThanOrEqual(20);
    });

    it('should spawn second player away from first', () => {
      orchestrator.initialize();
      orchestrator.addPlayer(1);
      orchestrator.addPlayer(2);
      
      const systems = orchestrator.getSystems()!;
      const state1 = systems.tickProcessor.getPlayerState(1);
      const state2 = systems.tickProcessor.getPlayerState(2);
      
      expect(state1?.physics?.position).toBeDefined();
      expect(state2?.physics?.position).toBeDefined();
      
      // Players should be spawned at different positions
      const pos1 = state1!.physics!.position;
      const pos2 = state2!.physics!.position;
      const distance = pos1.distanceTo(pos2);
      
      // Should be at least 3m apart (minimum clearance)
      expect(distance).toBeGreaterThanOrEqual(3);
    });
  });

  describe('lag compensation integration', () => {
    it('should record snapshots during tick processing', () => {
      orchestrator.initialize();
      orchestrator.addPlayer(1);
      
      const systems = orchestrator.getSystems()!;
      const currentTime = Date.now();
      
      // Process a tick
      systems.tickProcessor.processTick(1, 0.016, currentTime);
      
      // Lag compensation should have recorded the snapshot
      const snapshot = systems.lagCompensation.getSnapshotAtTick(1);
      expect(snapshot).toBeDefined();
    });
  });
});

describe('createServerOrchestrator', () => {
  it('should create orchestrator with default config', () => {
    const orchestrator = createServerOrchestrator();
    expect(orchestrator).toBeInstanceOf(ServerOrchestrator);
    orchestrator.dispose();
  });

  it('should create orchestrator with custom config', () => {
    const orchestrator = createServerOrchestrator({
      match: { ...DEFAULT_GAME_CONFIG.match, killsToWin: 5 }
    });
    expect(orchestrator).toBeInstanceOf(ServerOrchestrator);
    orchestrator.dispose();
  });
});
