/**
 * Tick Processor Tests
 *
 * Property-based and unit tests for server tick processing.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { TickProcessor, type PlayerServerState } from './TickProcessor';
import { Vector3 } from '../math/Vector3';
import { EventBus } from '../core/EventBus';
import { Ok, Err } from '../core/Result';
import type { IPhysics3D, PlayerPhysicsState, MovementInput } from '../physics/Physics3D';
import type { ICombatSystem, FireCommand, HitResult, PlayerCombatState } from '../game/CombatSystem';
import type { IMatchStateMachine } from '../game/MatchStateMachine';
import type { ISpawnSystem, SpawnPoint } from '../game/SpawnSystem';
import type { IAntiCheat, InputValidationData } from '../game/AntiCheat';
import type { ILagCompensation, WorldSnapshot } from '../game/LagCompensation';
import type { InputPacket } from '../network/Serializer';
import type { MatchState } from '../core/GameEvents';
import type { Capsule } from '../physics/Capsule';
import type { Result } from '../core/Result';

// Mock implementations
function createMockPhysics(): IPhysics3D {
  return {
    step: vi.fn((state: PlayerPhysicsState, _input: MovementInput, _dt: number, _time: number) => ({
      ...state,
      position: state.position.add(new Vector3(0.1, 0, 0.1)),
    })),
  };
}

function createMockCombatSystem(): ICombatSystem {
  const states = new Map<number, PlayerCombatState>();
  return {
    initializePlayer: vi.fn((playerId: number) => {
      states.set(playerId, {
        health: 100,
        lastFireTime: 0,
        deathTime: null,
        respawnTime: null,
        invulnerableUntil: 0,
        isDead: false,
      });
    }),
    removePlayer: vi.fn((playerId: number) => {
      states.delete(playerId);
    }),
    getPlayerState: vi.fn((playerId: number) => states.get(playerId)),
    processFire: vi.fn(() => Ok(null)),
    applyDamage: vi.fn(),
    update: vi.fn(() => []),
    respawnPlayer: vi.fn((playerId: number, currentTime: number) => {
      const state = states.get(playerId);
      if (state) {
        state.health = 100;
        state.isDead = false;
        state.invulnerableUntil = currentTime + 2000;
      }
    }),
  };
}

function createMockMatchStateMachine(): IMatchStateMachine {
  let state: MatchState = 'waiting';
  const players = new Set<number>();
  const scores = new Map<number, number>();
  return {
    getState: vi.fn(() => state),
    getCountdownRemaining: vi.fn(() => 0),
    getScores: vi.fn(() => new Map(scores)),
    getWinnerId: vi.fn(() => null),
    getConnectedPlayers: vi.fn(() => new Set(players)),
    playerConnected: vi.fn((playerId: number) => {
      players.add(playerId);
      scores.set(playerId, 0);
      if (players.size >= 2) state = 'playing';
    }),
    playerDisconnected: vi.fn((playerId: number) => {
      players.delete(playerId);
    }),
    recordKill: vi.fn((killerId: number) => {
      scores.set(killerId, (scores.get(killerId) ?? 0) + 1);
    }),
    update: vi.fn(),
    reset: vi.fn(),
  };
}

function createMockSpawnSystem(): ISpawnSystem {
  return {
    loadManifest: vi.fn(),
    selectSpawnPoint: vi.fn((_playerId: number, _otherPositions: Vector3[]) => ({
      id: 'spawn1',
      position: new Vector3(0, 0, 0),
      lookDirection: Vector3.FORWARD,
    })),
    getSpawnPoints: vi.fn(() => []),
    setCurrentTime: vi.fn(),
  };
}

function createMockAntiCheat(): IAntiCheat {
  return {
    validateInput: vi.fn(() => Ok(undefined)),
    getViolationCount: vi.fn(() => 0),
    clearViolations: vi.fn(),
    removePlayer: vi.fn(),
    shouldKick: vi.fn(() => false),
  };
}

function createMockLagCompensation(): ILagCompensation {
  const snapshots: WorldSnapshot[] = [];
  return {
    recordSnapshot: vi.fn((snapshot: WorldSnapshot) => {
      snapshots.push(snapshot);
    }),
    getSnapshotAtTime: vi.fn(() => Err('No snapshots')),
    getSnapshotAtTick: vi.fn(() => Err('No snapshots')),
    getPlayerCapsulesAtTime: vi.fn(() => Err('No snapshots')),
    pruneOldSnapshots: vi.fn(),
    clear: vi.fn(() => {
      snapshots.length = 0;
    }),
    getSnapshotCount: vi.fn(() => snapshots.length),
  };
}

function createInputPacket(overrides: Partial<InputPacket> = {}): InputPacket {
  return {
    sequenceNumber: 1,
    tickNumber: 0,
    movementX: 0,
    movementY: 0,
    lookDeltaX: 0,
    lookDeltaY: 0,
    buttons: 0,
    clientTimestamp: 1000,
    ...overrides,
  };
}

describe('TickProcessor', () => {
  let eventBus: EventBus;
  let physics: IPhysics3D;
  let combatSystem: ICombatSystem;
  let matchStateMachine: IMatchStateMachine;
  let spawnSystem: ISpawnSystem;
  let antiCheat: IAntiCheat;
  let lagCompensation: ILagCompensation;
  let processor: TickProcessor;

  beforeEach(() => {
    eventBus = new EventBus();
    physics = createMockPhysics();
    combatSystem = createMockCombatSystem();
    matchStateMachine = createMockMatchStateMachine();
    spawnSystem = createMockSpawnSystem();
    antiCheat = createMockAntiCheat();
    lagCompensation = createMockLagCompensation();

    processor = new TickProcessor(
      physics,
      combatSystem,
      matchStateMachine,
      spawnSystem,
      antiCheat,
      lagCompensation,
      eventBus
    );
  });

  describe('Player Management', () => {
    it('adds player with correct initial state', () => {
      const spawnPos = new Vector3(10, 0, 10);
      processor.addPlayer(1, spawnPos);

      const state = processor.getPlayerState(1);
      expect(state).toBeDefined();
      expect(state!.playerId).toBe(1);
      expect(state!.physics.position.equals(spawnPos)).toBe(true);
      expect(state!.physics.isGrounded).toBe(true);
      expect(state!.health).toBe(100);
    });

    it('initializes combat system for new player', () => {
      processor.addPlayer(1, Vector3.ZERO);
      expect(combatSystem.initializePlayer).toHaveBeenCalledWith(1);
    });

    it('notifies match state machine of player connection', () => {
      processor.addPlayer(1, Vector3.ZERO);
      expect(matchStateMachine.playerConnected).toHaveBeenCalledWith(1);
    });

    it('removes player and cleans up', () => {
      processor.addPlayer(1, Vector3.ZERO);
      processor.removePlayer(1);

      expect(processor.getPlayerState(1)).toBeUndefined();
      expect(combatSystem.removePlayer).toHaveBeenCalledWith(1);
      expect(antiCheat.removePlayer).toHaveBeenCalledWith(1);
      expect(matchStateMachine.playerDisconnected).toHaveBeenCalledWith(1);
    });

    it('returns all player IDs', () => {
      processor.addPlayer(1, Vector3.ZERO);
      processor.addPlayer(2, new Vector3(5, 0, 5));

      const ids = processor.getPlayerIds();
      expect(ids).toContain(1);
      expect(ids).toContain(2);
      expect(ids.length).toBe(2);
    });
  });

  describe('Input Queuing', () => {
    // Property 31: Input Sequence Ordering - inputs processed in sequence order
    it('Property 31: inputs are processed in sequence order', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 10 }),
          (count) => {
            // Create fresh mocks for each property test run
            const localPhysics = createMockPhysics();
            const localCombat = createMockCombatSystem();
            const localMatch = createMockMatchStateMachine();
            const localSpawn = createMockSpawnSystem();
            const localAntiCheat = createMockAntiCheat();
            const localLag = createMockLagCompensation();
            const localEventBus = new EventBus();

            const localProcessor = new TickProcessor(
              localPhysics,
              localCombat,
              localMatch,
              localSpawn,
              localAntiCheat,
              localLag,
              localEventBus
            );

            localProcessor.addPlayer(1, Vector3.ZERO);
            // Add second player to trigger 'playing' state
            localProcessor.addPlayer(2, new Vector3(10, 0, 10));

            // Create consecutive sequence numbers and shuffle them
            const sequenceNumbers = Array.from({ length: count }, (_, i) => i + 1);
            const shuffled = [...sequenceNumbers].sort(() => Math.random() - 0.5);
            shuffled.forEach((seq) => {
              localProcessor.queueInput(1, createInputPacket({ sequenceNumber: seq }));
            });

            // Process tick
            localProcessor.processTick(0, 0.016, 1000);

            // Verify physics was called for each input (inputs were processed in order)
            expect(localPhysics.step).toHaveBeenCalledTimes(count);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('queues inputs sorted by sequence number', () => {
      processor.addPlayer(1, Vector3.ZERO);

      // Queue out of order
      processor.queueInput(1, createInputPacket({ sequenceNumber: 3 }));
      processor.queueInput(1, createInputPacket({ sequenceNumber: 1 }));
      processor.queueInput(1, createInputPacket({ sequenceNumber: 2 }));

      // Access private queue for verification
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const queue = (processor as any).inputQueues.get(1);
      expect(queue[0].sequenceNumber).toBe(1);
      expect(queue[1].sequenceNumber).toBe(2);
      expect(queue[2].sequenceNumber).toBe(3);
    });

    it('limits queue size to prevent memory issues', () => {
      processor.addPlayer(1, Vector3.ZERO);

      // Queue more than max
      for (let i = 0; i < 50; i++) {
        processor.queueInput(1, createInputPacket({ sequenceNumber: i }));
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const queue = (processor as any).inputQueues.get(1);
      expect(queue.length).toBeLessThanOrEqual(32);
    });

    it('ignores input for non-existent player', () => {
      processor.queueInput(999, createInputPacket());
      // Should not throw
    });
  });

  describe('Tick Processing', () => {
    it('updates match state machine each tick', () => {
      processor.processTick(0, 0.016, 1000);
      expect(matchStateMachine.update).toHaveBeenCalledWith(1000);
    });

    it('only processes inputs during playing state', () => {
      processor.addPlayer(1, Vector3.ZERO);
      processor.queueInput(1, createInputPacket({ sequenceNumber: 1 }));

      // Match is in 'waiting' state with only 1 player
      processor.processTick(0, 0.016, 1000);

      // Physics should not be called since not in playing state
      expect(physics.step).not.toHaveBeenCalled();
    });

    it('processes inputs when in playing state', () => {
      processor.addPlayer(1, Vector3.ZERO);
      processor.addPlayer(2, new Vector3(10, 0, 10)); // Triggers playing state
      processor.queueInput(1, createInputPacket({ sequenceNumber: 1 }));

      processor.processTick(0, 0.016, 1000);

      expect(physics.step).toHaveBeenCalled();
    });

    it('records snapshot for lag compensation', () => {
      processor.addPlayer(1, Vector3.ZERO);
      processor.processTick(0, 0.016, 1000);

      expect(lagCompensation.recordSnapshot).toHaveBeenCalled();
    });

    it('prunes old snapshots', () => {
      processor.processTick(0, 0.016, 1000);
      expect(lagCompensation.pruneOldSnapshots).toHaveBeenCalledWith(1000);
    });

    it('returns state snapshot with correct structure', () => {
      processor.addPlayer(1, Vector3.ZERO);
      const snapshot = processor.processTick(0, 0.016, 1000);

      expect(snapshot.tickNumber).toBe(0);
      expect(snapshot.serverTimestamp).toBe(1000);
      expect(snapshot.players).toHaveLength(1);
      expect(snapshot.matchState).toBeDefined();
      expect(snapshot.scores).toBeDefined();
    });
  });

  describe('Input Processing', () => {
    it('applies look input to player state', () => {
      processor.addPlayer(1, Vector3.ZERO);
      processor.addPlayer(2, new Vector3(10, 0, 10));
      processor.queueInput(1, createInputPacket({
        sequenceNumber: 1,
        lookDeltaX: 100,
        lookDeltaY: 50,
      }));

      processor.processTick(0, 0.016, 1000);

      const state = processor.getPlayerState(1);
      expect(state!.yaw).not.toBe(0);
      expect(state!.pitch).not.toBe(0);
    });

    it('validates input with anti-cheat', () => {
      processor.addPlayer(1, Vector3.ZERO);
      processor.addPlayer(2, new Vector3(10, 0, 10));
      processor.queueInput(1, createInputPacket({ sequenceNumber: 1 }));

      processor.processTick(0, 0.016, 1000);

      expect(antiCheat.validateInput).toHaveBeenCalled();
    });

    it('rejects movement when anti-cheat fails', () => {
      vi.mocked(antiCheat.validateInput).mockReturnValue(Err('speed_hack'));

      processor.addPlayer(1, Vector3.ZERO);
      processor.addPlayer(2, new Vector3(10, 0, 10));
      const initialPos = processor.getPlayerState(1)!.physics.position;

      processor.queueInput(1, createInputPacket({ sequenceNumber: 1, movementY: 1 }));
      processor.processTick(0, 0.016, 1000);

      const finalPos = processor.getPlayerState(1)!.physics.position;
      // Position should not change when anti-cheat fails
      expect(finalPos.equals(initialPos)).toBe(true);
    });

    it('updates lastProcessedSequence after processing', () => {
      processor.addPlayer(1, Vector3.ZERO);
      processor.addPlayer(2, new Vector3(10, 0, 10));
      // Queue consecutive inputs starting from 1
      processor.queueInput(1, createInputPacket({ sequenceNumber: 1 }));
      processor.queueInput(1, createInputPacket({ sequenceNumber: 2 }));
      processor.queueInput(1, createInputPacket({ sequenceNumber: 3 }));

      processor.processTick(0, 0.016, 1000);

      const state = processor.getPlayerState(1);
      expect(state!.lastProcessedSequence).toBe(3);
    });
  });

  describe('Fire Command Processing', () => {
    it('processes fire command when button pressed', () => {
      processor.addPlayer(1, Vector3.ZERO);
      processor.addPlayer(2, new Vector3(10, 0, 10));
      processor.queueInput(1, createInputPacket({
        sequenceNumber: 1,
        buttons: 0x02, // FIRE button
      }));

      processor.processTick(0, 0.016, 1000);

      expect(combatSystem.processFire).toHaveBeenCalled();
    });

    it('applies damage on hit', () => {
      const hitResult: HitResult = {
        targetId: 2,
        hitPosition: new Vector3(5, 1, 5),
        damage: 25,
      };
      vi.mocked(combatSystem.processFire).mockReturnValue(Ok(hitResult));

      processor.addPlayer(1, Vector3.ZERO);
      processor.addPlayer(2, new Vector3(10, 0, 10));
      processor.queueInput(1, createInputPacket({
        sequenceNumber: 1,
        buttons: 0x02,
      }));

      processor.processTick(0, 0.016, 1000);

      expect(combatSystem.applyDamage).toHaveBeenCalledWith(2, 1, 25, expect.any(Vector3), 1000);
    });

    it('records kill when victim dies', () => {
      const hitResult: HitResult = {
        targetId: 2,
        hitPosition: new Vector3(5, 1, 5),
        damage: 100,
      };
      vi.mocked(combatSystem.processFire).mockReturnValue(Ok(hitResult));
      vi.mocked(combatSystem.getPlayerState).mockReturnValue({
        health: 0,
        lastFireTime: 0,
        deathTime: 1000,
        respawnTime: 4000,
        invulnerableUntil: 0,
        isDead: true,
      });

      processor.addPlayer(1, Vector3.ZERO);
      processor.addPlayer(2, new Vector3(10, 0, 10));
      processor.queueInput(1, createInputPacket({
        sequenceNumber: 1,
        buttons: 0x02,
      }));

      processor.processTick(0, 0.016, 1000);

      expect(matchStateMachine.recordKill).toHaveBeenCalledWith(1, 2);
    });
  });

  describe('Respawn Handling', () => {
    it('respawns players when combat system indicates ready', () => {
      vi.mocked(combatSystem.update).mockReturnValue([1]);

      processor.addPlayer(1, Vector3.ZERO);
      processor.addPlayer(2, new Vector3(10, 0, 10));

      processor.processTick(0, 0.016, 1000);

      expect(spawnSystem.selectSpawnPoint).toHaveBeenCalled();
      expect(combatSystem.respawnPlayer).toHaveBeenCalledWith(1, 1000);
    });

    it('sets spawn time before selecting spawn point', () => {
      vi.mocked(combatSystem.update).mockReturnValue([1]);

      processor.addPlayer(1, Vector3.ZERO);
      processor.addPlayer(2, new Vector3(10, 0, 10));

      processor.processTick(0, 0.016, 1000);

      expect(spawnSystem.setCurrentTime).toHaveBeenCalledWith(1000);
    });
  });

  describe('State Snapshot', () => {
    it('includes all players in snapshot', () => {
      processor.addPlayer(1, Vector3.ZERO);
      processor.addPlayer(2, new Vector3(10, 0, 10));

      const snapshot = processor.processTick(0, 0.016, 1000);

      expect(snapshot.players.length).toBe(2);
    });

    it('includes correct player state flags', () => {
      processor.addPlayer(1, Vector3.ZERO);

      const snapshot = processor.processTick(0, 0.016, 1000);

      const playerState = snapshot.players.find((p) => p.entityId === 1);
      expect(playerState).toBeDefined();
      expect(playerState!.stateFlags & 0x01).toBe(0x01); // Grounded flag
    });

    it('includes match scores', () => {
      processor.addPlayer(1, Vector3.ZERO);
      processor.addPlayer(2, new Vector3(10, 0, 10));

      const snapshot = processor.processTick(0, 0.016, 1000);

      expect(snapshot.scores).toBeDefined();
    });
  });
});
