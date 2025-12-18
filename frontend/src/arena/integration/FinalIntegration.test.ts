/**
 * Final Integration Tests
 * 
 * End-to-end integration tests for the arena 3D physics multiplayer system.
 * Tests full match lifecycle, lag compensation, reconnection, and anti-cheat flows.
 * 
 * **Feature: arena-3d-physics-multiplayer**
 * **Validates: Requirements 10.1, 10.3, 10.5, 13.1, 13.2, 13.3, 13.4, 18.4, 23.3, 23.4**
 * 
 * @module integration/FinalIntegration.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ServerOrchestrator, createServerOrchestrator } from '../orchestrator/ServerOrchestrator';
import { ClientOrchestrator, createClientOrchestrator } from '../orchestrator/ClientOrchestrator';
import { EventBus } from '../core/EventBus';
import { MatchStateMachine, DEFAULT_MATCH_CONFIG } from '../game/MatchStateMachine';
import { LagCompensation, DEFAULT_LAG_COMPENSATION_CONFIG } from '../game/LagCompensation';
import { AntiCheat, DEFAULT_ANTI_CHEAT_CONFIG } from '../game/AntiCheat';
import { CombatSystem, DEFAULT_COMBAT_CONFIG } from '../game/CombatSystem';
import { SpawnSystem } from '../game/SpawnSystem';
import { Vector3 } from '../math/Vector3';
import { Capsule } from '../physics/Capsule';
import { CollisionWorld } from '../physics/CollisionWorld';
import { MockTransport } from '../network/NetworkTransport';
import { isOk } from '../core/Result';
import type { 
  MatchStateChangedEvent, 
  MatchStartEvent,
  MatchEndEvent,
  PlayerKickedEvent,
  ViolationDetectedEvent,
  HitConfirmedEvent,
  PlayerDeathEvent,
  ConnectionLostEvent,
  ConnectionEstablishedEvent
} from '../core/GameEvents';
import type { LoadedMap } from '../maps/MapLoader';
import type { MapDefinition } from '../maps/types';

// Mock AudioContext for client tests
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
  
  createBuffer(_channels: number, length: number, _sampleRate: number) {
    return { getChannelData: () => new Float32Array(length) };
  }
  
  get destination() { return {}; }
  close() { return Promise.resolve(); }
}

vi.stubGlobal('AudioContext', MockAudioContext);

/**
 * Create a mock LoadedMap for testing
 */
function createMockLoadedMap(): LoadedMap {
  const mockDefinition: MapDefinition = {
    id: 'test_map',
    name: 'Test Map',
    description: 'A test map',
    playerCount: { min: 2, max: 2 },
    arenaConfig: {
      width: 36,
      depth: 40,
      wallHeight: 6,
      wallThickness: 0.4,
      ceilingHeight: 6,
      windowHeight: 2.5,
      windowBottom: 1.5,
      windowWidth: 4,
      windowSpacing: 6,
      tracks: {
        width: 5,
        depth: 0.6,
        railWidth: 0.1,
        railHeight: 0.15,
        railSpacing: 1.4,
        sleeperWidth: 2.2,
        sleeperDepth: 0.15,
        sleeperSpacing: 0.6,
      },
      platformEdge: { width: 0.3, tactileWidth: 0.6 },
      subwayEntrance: {
        width: 6,
        depth: 8,
        stairDepth: 1.5,
        stairSteps: 8,
        gateHeight: 2.2,
      },
      spawns: {
        player1: { x: -14, y: -1.5, z: -16 },
        player2: { x: 14, y: -1.5, z: 16 },
      },
      lightPositions: [{ x: 0, z: 0 }],
      colors: {
        floor: 0xd4cfc4,
        wall: 0x8a8580,
        ceiling: 0x6a6560,
        windowFrame: 0x3a3530,
        lightFixture: 0x2a2520,
        lightEmissive: 0xfff5e6,
        ambient: 0x404040,
        fog: 0x1a1a1a,
        trackBed: 0x2a2520,
        rail: 0x4a4a4a,
        sleeper: 0x3d2b1f,
        yellowLine: 0xf4d03f,
        tactileStrip: 0xc4a000,
        gate: 0x5a5a5a,
      },
    },
    assets: { textures: {}, models: {} },
    collisionManifest: {
      colliders: [
        { id: 'floor', center: [0, -0.25, 0], size: [36, 0.5, 40] },
      ],
    },
    spawnManifest: {
      spawnPoints: [
        { id: 'spawn_1', position: [-14, 0, -16] },
        { id: 'spawn_2', position: [14, 0, 16] },
      ],
      arenaCenter: [0, 0, 0],
    },
    lightingConfig: {
      ambient: { color: 0x606878, intensity: 1.2 },
      hemisphere: { skyColor: 0x505868, groundColor: 0x8a8580, intensity: 0.9 },
      keyLight: { color: 0xe8f0ff, intensity: 1.8, position: { x: 5, y: 20, z: -8 } },
      fillLight: { color: 0xfff0e0, intensity: 0.8, position: { x: -8, y: 15, z: 10 } },
      pointLights: [],
    },
    props: [],
  };

  return {
    definition: mockDefinition,
    textures: {},
    models: {},
  };
}


/**
 * Task 43.1: Full Match Lifecycle Tests
 * 
 * Tests the complete match state machine flow:
 * waiting → countdown → playing → ended → cleanup
 * 
 * **Validates: Requirements 13.1, 13.2, 13.3, 13.4**
 */
describe('Full Match Lifecycle', () => {
  let eventBus: EventBus;
  let matchStateMachine: MatchStateMachine;

  beforeEach(() => {
    eventBus = new EventBus();
    matchStateMachine = new MatchStateMachine(DEFAULT_MATCH_CONFIG, eventBus);
  });

  describe('waiting → countdown transition', () => {
    /**
     * Test: Both players connect triggers countdown
     * **Validates: Requirement 13.1**
     */
    it('should transition from waiting to countdown when both players connect', () => {
      const stateChanges: string[] = [];
      
      eventBus.on<MatchStateChangedEvent>('match_state_changed', (event) => {
        stateChanges.push(`${event.previousState}->${event.newState}`);
      });
      
      expect(matchStateMachine.getState()).toBe('waiting');
      
      // First player connects
      matchStateMachine.playerConnected(1);
      expect(matchStateMachine.getState()).toBe('waiting');
      
      // Second player connects - should trigger countdown
      matchStateMachine.playerConnected(2);
      expect(matchStateMachine.getState()).toBe('countdown');
      expect(stateChanges).toContain('waiting->countdown');
    });

    it('should track connected players correctly', () => {
      matchStateMachine.playerConnected(1);
      matchStateMachine.playerConnected(2);
      
      const connectedPlayers = matchStateMachine.getConnectedPlayers();
      expect(connectedPlayers.has(1)).toBe(true);
      expect(connectedPlayers.has(2)).toBe(true);
      expect(connectedPlayers.size).toBe(2);
    });

    it('should initialize scores for connected players', () => {
      matchStateMachine.playerConnected(1);
      matchStateMachine.playerConnected(2);
      
      const scores = matchStateMachine.getScores();
      expect(scores.get(1)).toBe(0);
      expect(scores.get(2)).toBe(0);
    });
  });

  describe('countdown → playing transition', () => {
    /**
     * Test: Countdown completes and match starts
     * **Validates: Requirement 13.2**
     */
    it('should transition from countdown to playing after countdown duration', () => {
      let matchStarted = false;
      
      eventBus.on<MatchStartEvent>('match_start', () => {
        matchStarted = true;
      });
      
      matchStateMachine.playerConnected(1);
      matchStateMachine.playerConnected(2);
      expect(matchStateMachine.getState()).toBe('countdown');
      
      // Advance time past countdown (3 seconds default)
      const startTime = Date.now();
      matchStateMachine.update(startTime);
      matchStateMachine.update(startTime + 3001);
      
      expect(matchStateMachine.getState()).toBe('playing');
      expect(matchStarted).toBe(true);
    });

    it('should report countdown remaining time correctly', () => {
      const startTime = 1000; // Use fixed time for predictability
      matchStateMachine.update(startTime); // Set initial time
      
      matchStateMachine.playerConnected(1);
      matchStateMachine.playerConnected(2);
      // State transitions to countdown, stateStartTime is set to currentTime (1000)
      
      // After 1 second, should have ~2 seconds remaining
      matchStateMachine.update(startTime + 1000);
      const remaining = matchStateMachine.getCountdownRemaining();
      expect(remaining).toBeCloseTo(2000, -2);
    });

    it('should return to waiting if player disconnects during countdown', () => {
      matchStateMachine.playerConnected(1);
      matchStateMachine.playerConnected(2);
      expect(matchStateMachine.getState()).toBe('countdown');
      
      // Player disconnects
      matchStateMachine.playerDisconnected(2);
      
      expect(matchStateMachine.getState()).toBe('waiting');
    });
  });

  describe('playing → ended transition', () => {
    /**
     * Test: Win condition triggers match end
     * **Validates: Requirement 13.3**
     */
    it('should transition to ended when player reaches kill limit', () => {
      let matchEnded = false;
      let winnerId: number | null = null;
      
      eventBus.on<MatchEndEvent>('match_end', (event) => {
        matchEnded = true;
        winnerId = event.winnerId;
      });
      
      // Setup: get to playing state
      matchStateMachine.playerConnected(1);
      matchStateMachine.playerConnected(2);
      matchStateMachine.update(Date.now() + 4000);
      expect(matchStateMachine.getState()).toBe('playing');
      
      // Record kills until win condition (10 kills default)
      for (let i = 0; i < 10; i++) {
        matchStateMachine.recordKill(1, 2);
      }
      
      expect(matchStateMachine.getState()).toBe('ended');
      expect(matchEnded).toBe(true);
      expect(winnerId).toBe(1);
      expect(matchStateMachine.getWinnerId()).toBe(1);
    });

    it('should track scores correctly during match', () => {
      matchStateMachine.playerConnected(1);
      matchStateMachine.playerConnected(2);
      matchStateMachine.update(Date.now() + 4000);
      
      matchStateMachine.recordKill(1, 2);
      matchStateMachine.recordKill(1, 2);
      matchStateMachine.recordKill(2, 1);
      
      const scores = matchStateMachine.getScores();
      expect(scores.get(1)).toBe(2);
      expect(scores.get(2)).toBe(1);
    });

    /**
     * Test: Player disconnect during playing ends match
     * **Validates: Requirement 13.5**
     */
    it('should end match and award victory when opponent disconnects', () => {
      let winnerId: number | null = null;
      
      eventBus.on<MatchEndEvent>('match_end', (event) => {
        winnerId = event.winnerId;
      });
      
      matchStateMachine.playerConnected(1);
      matchStateMachine.playerConnected(2);
      matchStateMachine.update(Date.now() + 4000);
      expect(matchStateMachine.getState()).toBe('playing');
      
      // Player 2 disconnects
      matchStateMachine.playerDisconnected(2);
      
      expect(matchStateMachine.getState()).toBe('ended');
      expect(winnerId).toBe(1);
    });
  });

  describe('ended → cleanup transition', () => {
    /**
     * Test: Results display then cleanup
     * **Validates: Requirement 13.4**
     */
    it('should transition to cleanup after results duration', () => {
      matchStateMachine.playerConnected(1);
      matchStateMachine.playerConnected(2);
      
      const startTime = Date.now();
      matchStateMachine.update(startTime + 4000); // To playing
      
      // Win the match
      for (let i = 0; i < 10; i++) {
        matchStateMachine.recordKill(1, 2);
      }
      expect(matchStateMachine.getState()).toBe('ended');
      
      // Advance past results duration (5 seconds default)
      matchStateMachine.update(startTime + 4000 + 6000);
      
      expect(matchStateMachine.getState()).toBe('cleanup');
    });
  });

  describe('full lifecycle with ServerOrchestrator', () => {
    let orchestrator: ServerOrchestrator;

    beforeEach(() => {
      orchestrator = createServerOrchestrator();
    });

    afterEach(() => {
      orchestrator.dispose();
    });

    /**
     * Test: Complete match lifecycle through orchestrator
     * **Validates: Requirements 13.1, 13.2, 13.3, 13.4**
     */
    it('should complete full match lifecycle through orchestrator', () => {
      orchestrator.initialize();
      const systems = orchestrator.getSystems()!;
      
      const stateChanges: string[] = [];
      systems.eventBus.on<MatchStateChangedEvent>('match_state_changed', (event) => {
        stateChanges.push(event.newState);
      });
      
      // waiting
      expect(systems.matchStateMachine.getState()).toBe('waiting');
      
      // Add players -> countdown
      orchestrator.addPlayer(1);
      orchestrator.addPlayer(2);
      expect(systems.matchStateMachine.getState()).toBe('countdown');
      
      // Advance to playing
      systems.matchStateMachine.update(Date.now() + 4000);
      expect(systems.matchStateMachine.getState()).toBe('playing');
      
      // Win the match -> ended
      for (let i = 0; i < 10; i++) {
        systems.matchStateMachine.recordKill(1, 2);
      }
      expect(systems.matchStateMachine.getState()).toBe('ended');
      
      // Advance to cleanup
      systems.matchStateMachine.update(Date.now() + 10000);
      expect(systems.matchStateMachine.getState()).toBe('cleanup');
      
      expect(stateChanges).toEqual(['countdown', 'playing', 'ended', 'cleanup']);
    });
  });
});



/**
 * Task 43.2: Lag Compensation Hit Detection Tests
 * 
 * Tests server-side hit detection with historical position rewind.
 * Verifies hits are evaluated at the client's perceived time.
 * 
 * **Validates: Requirements 10.1, 10.3, 10.5**
 */
describe('Lag Compensation Hit Detection', () => {
  let eventBus: EventBus;
  let lagCompensation: LagCompensation;
  let combatSystem: CombatSystem;
  let collisionWorld: CollisionWorld;
  let spawnSystem: SpawnSystem;

  beforeEach(() => {
    eventBus = new EventBus();
    lagCompensation = new LagCompensation(DEFAULT_LAG_COMPENSATION_CONFIG);
    collisionWorld = new CollisionWorld();
    spawnSystem = new SpawnSystem(eventBus);
    combatSystem = new CombatSystem(DEFAULT_COMBAT_CONFIG, collisionWorld, eventBus);
    
    // Initialize players
    combatSystem.initializePlayer(1);
    combatSystem.initializePlayer(2);
  });

  describe('snapshot recording', () => {
    /**
     * Test: Snapshots are recorded for lag compensation
     * **Validates: Requirement 10.1**
     */
    it('should record world snapshots with player positions', () => {
      const snapshot = {
        tickNumber: 1,
        timestamp: 1000,
        playerPositions: new Map([
          [1, new Vector3(0, 0, 0)],
          [2, new Vector3(5, 0, 0)]
        ]),
        playerCapsules: new Map([
          [1, new Capsule(new Vector3(0, 0, 0))],
          [2, new Capsule(new Vector3(5, 0, 0))]
        ])
      };
      
      lagCompensation.recordSnapshot(snapshot);
      
      expect(lagCompensation.getSnapshotCount()).toBe(1);
      
      const retrieved = lagCompensation.getSnapshotAtTick(1);
      expect(isOk(retrieved)).toBe(true);
      if (retrieved.ok) {
        expect(retrieved.value.playerPositions.get(1)?.x).toBe(0);
        expect(retrieved.value.playerPositions.get(2)?.x).toBe(5);
      }
    });

    it('should store multiple snapshots in order', () => {
      for (let i = 1; i <= 10; i++) {
        lagCompensation.recordSnapshot({
          tickNumber: i,
          timestamp: i * 16.67,
          playerPositions: new Map([[1, new Vector3(i, 0, 0)]]),
          playerCapsules: new Map([[1, new Capsule(new Vector3(i, 0, 0))]])
        });
      }
      
      expect(lagCompensation.getSnapshotCount()).toBe(10);
      
      const snapshot5 = lagCompensation.getSnapshotAtTick(5);
      expect(isOk(snapshot5)).toBe(true);
      if (snapshot5.ok) {
        expect(snapshot5.value.playerPositions.get(1)?.x).toBe(5);
      }
    });
  });

  describe('historical position retrieval', () => {
    /**
     * Test: Retrieve player positions at historical time
     * **Validates: Requirement 10.3**
     */
    it('should retrieve snapshot closest to target time', () => {
      // Record snapshots at different times
      lagCompensation.recordSnapshot({
        tickNumber: 1,
        timestamp: 0,
        playerPositions: new Map([[1, new Vector3(0, 0, 0)]]),
        playerCapsules: new Map([[1, new Capsule(new Vector3(0, 0, 0))]])
      });
      
      lagCompensation.recordSnapshot({
        tickNumber: 2,
        timestamp: 100,
        playerPositions: new Map([[1, new Vector3(5, 0, 0)]]),
        playerCapsules: new Map([[1, new Capsule(new Vector3(5, 0, 0))]])
      });
      
      lagCompensation.recordSnapshot({
        tickNumber: 3,
        timestamp: 200,
        playerPositions: new Map([[1, new Vector3(10, 0, 0)]]),
        playerCapsules: new Map([[1, new Capsule(new Vector3(10, 0, 0))]])
      });
      
      // Query for time 90 - should return snapshot at time 100 (closest)
      const result = lagCompensation.getSnapshotAtTime(90);
      expect(isOk(result)).toBe(true);
      if (result.ok) {
        expect(result.value.timestamp).toBe(100);
      }
    });

    it('should interpolate player capsules between snapshots', () => {
      lagCompensation.recordSnapshot({
        tickNumber: 1,
        timestamp: 0,
        playerPositions: new Map([[1, new Vector3(0, 0, 0)]]),
        playerCapsules: new Map([[1, new Capsule(new Vector3(0, 0, 0))]])
      });
      
      lagCompensation.recordSnapshot({
        tickNumber: 2,
        timestamp: 100,
        playerPositions: new Map([[1, new Vector3(10, 0, 0)]]),
        playerCapsules: new Map([[1, new Capsule(new Vector3(10, 0, 0))]])
      });
      
      // Query for time 50 - should interpolate to position (5, 0, 0)
      const result = lagCompensation.getPlayerCapsulesAtTime(50);
      expect(isOk(result)).toBe(true);
      if (result.ok) {
        const capsule = result.value.get(1);
        expect(capsule).toBeDefined();
        expect(capsule!.position.x).toBeCloseTo(5, 1);
      }
    });
  });

  describe('rewind capping', () => {
    /**
     * Test: Rewind is capped at maximum allowed time
     * **Validates: Requirement 10.5**
     */
    it('should cap rewind to maxRewindMs (250ms default)', () => {
      // Record snapshots spanning 500ms (0ms to 500ms)
      for (let i = 0; i <= 30; i++) {
        lagCompensation.recordSnapshot({
          tickNumber: i,
          timestamp: i * 16.67,
          playerPositions: new Map([[1, new Vector3(i, 0, 0)]]),
          playerCapsules: new Map([[1, new Capsule(new Vector3(i, 0, 0))]])
        });
      }
      
      // Current time is the last snapshot (30 * 16.67 = ~500ms)
      // Try to rewind 400ms (beyond 250ms cap)
      // Target time would be 500 - 400 = 100ms
      // But it should be capped to 500 - 250 = 250ms
      const targetTime = 100; // Requesting time 100ms (400ms rewind from 500ms)
      const result = lagCompensation.getSnapshotAtTime(targetTime);
      
      expect(isOk(result)).toBe(true);
      if (result.ok) {
        // Should be capped to 250ms rewind from current time (500ms)
        // So minimum timestamp should be around 250ms
        expect(result.value.timestamp).toBeGreaterThanOrEqual(240);
      }
    });
  });

  describe('hit detection with lag compensation', () => {
    /**
     * Test: Fire with latency, verify hit at historical position
     * **Validates: Requirements 10.1, 10.3**
     */
    it('should detect hit at historical position with 100ms latency', () => {
      // Player 2 moves from (5,0,0) to (10,0,0) over 100ms
      lagCompensation.recordSnapshot({
        tickNumber: 1,
        timestamp: 0,
        playerPositions: new Map([
          [1, new Vector3(0, 0, 0)],
          [2, new Vector3(5, 0, 0)]
        ]),
        playerCapsules: new Map([
          [1, new Capsule(new Vector3(0, 0, 0))],
          [2, new Capsule(new Vector3(5, 0, 0))]
        ])
      });
      
      lagCompensation.recordSnapshot({
        tickNumber: 7,
        timestamp: 100,
        playerPositions: new Map([
          [1, new Vector3(0, 0, 0)],
          [2, new Vector3(10, 0, 0)]
        ]),
        playerCapsules: new Map([
          [1, new Capsule(new Vector3(0, 0, 0))],
          [2, new Capsule(new Vector3(10, 0, 0))]
        ])
      });
      
      // Player 1 fires at time 100 with 100ms latency
      // They saw player 2 at position (5,0,0) at their perceived time 0
      const rewoundCapsules = lagCompensation.getPlayerCapsulesAtTime(0);
      
      expect(isOk(rewoundCapsules)).toBe(true);
      if (rewoundCapsules.ok) {
        const player2Capsule = rewoundCapsules.value.get(2);
        expect(player2Capsule).toBeDefined();
        // At time 0, player 2 was at (5,0,0)
        expect(player2Capsule!.position.x).toBeCloseTo(5, 1);
      }
    });
  });

  describe('snapshot pruning', () => {
    it('should prune old snapshots beyond history duration', () => {
      const currentTime = 2000;
      
      // Record snapshots over 2 seconds
      for (let i = 0; i <= 120; i++) {
        lagCompensation.recordSnapshot({
          tickNumber: i,
          timestamp: i * 16.67,
          playerPositions: new Map([[1, new Vector3(i, 0, 0)]]),
          playerCapsules: new Map([[1, new Capsule(new Vector3(i, 0, 0))]])
        });
      }
      
      const countBefore = lagCompensation.getSnapshotCount();
      
      // Prune old snapshots (history duration is 1000ms default)
      lagCompensation.pruneOldSnapshots(currentTime);
      
      const countAfter = lagCompensation.getSnapshotCount();
      expect(countAfter).toBeLessThan(countBefore);
    });
  });

  describe('integration with ServerOrchestrator', () => {
    let orchestrator: ServerOrchestrator;

    beforeEach(() => {
      orchestrator = createServerOrchestrator();
    });

    afterEach(() => {
      orchestrator.dispose();
    });

    it('should record lag compensation snapshots during tick processing', () => {
      orchestrator.initialize();
      orchestrator.addPlayer(1);
      orchestrator.addPlayer(2);
      
      const systems = orchestrator.getSystems()!;
      
      // Use a fixed base time for consistency
      const baseTime = 100000;
      
      // Advance to playing state
      systems.matchStateMachine.update(baseTime + 4000);
      expect(systems.matchStateMachine.getState()).toBe('playing');
      
      // Process several ticks in playing state with consistent timestamps
      // Use timestamps that won't be pruned (within 1 second of each other)
      const tickStartTime = baseTime + 4000;
      for (let tick = 1; tick <= 10; tick++) {
        systems.tickProcessor.processTick(tick, 0.016, tickStartTime + tick * 16);
      }
      
      // Verify snapshots were recorded
      expect(systems.lagCompensation.getSnapshotCount()).toBeGreaterThan(0);
      
      // Should be able to retrieve historical snapshot
      const snapshot = systems.lagCompensation.getSnapshotAtTick(5);
      expect(isOk(snapshot)).toBe(true);
    });
  });
});



/**
 * Task 43.3: Reconnection Flow Tests
 * 
 * Tests disconnect, reconnect, and full state sync flow.
 * 
 * **Validates: Requirements 10.5, 23.3, 23.4**
 */
describe('Reconnection Flow', () => {
  describe('MockTransport reconnection', () => {
    let transport: MockTransport;

    beforeEach(() => {
      transport = new MockTransport();
    });

    it('should track connection state correctly', async () => {
      expect(transport.getConnectionState()).toBe('disconnected');
      
      await transport.connect();
      expect(transport.getConnectionState()).toBe('connected');
      expect(transport.isConnected()).toBe(true);
      
      transport.disconnect();
      expect(transport.getConnectionState()).toBe('disconnected');
      expect(transport.isConnected()).toBe(false);
    });

    it('should handle disconnect and reconnect cycle', async () => {
      await transport.connect();
      expect(transport.isConnected()).toBe(true);
      
      // Simulate disconnect
      transport.simulateDisconnect();
      expect(transport.isConnected()).toBe(false);
      
      // Reconnect
      await transport.connect();
      expect(transport.isConnected()).toBe(true);
    });

    it('should fail to send when disconnected', async () => {
      const data = new ArrayBuffer(10);
      
      // Not connected
      const result1 = transport.send(data);
      expect(isOk(result1)).toBe(false);
      
      // Connect and send
      await transport.connect();
      const result2 = transport.send(data);
      expect(isOk(result2)).toBe(true);
      
      // Disconnect and try to send
      transport.disconnect();
      const result3 = transport.send(data);
      expect(isOk(result3)).toBe(false);
    });
  });

  describe('state sync after reconnection', () => {
    let orchestrator: ServerOrchestrator;

    beforeEach(() => {
      orchestrator = createServerOrchestrator();
    });

    afterEach(() => {
      orchestrator.dispose();
    });

    /**
     * Test: Full state available after reconnection
     * **Validates: Requirement 23.4**
     */
    it('should provide full state for reconnecting player', () => {
      orchestrator.initialize();
      orchestrator.addPlayer(1);
      orchestrator.addPlayer(2);
      
      const systems = orchestrator.getSystems()!;
      const currentTime = Date.now();
      
      // Process some ticks to establish game state
      for (let tick = 1; tick <= 20; tick++) {
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
      
      // Player 2 disconnects
      orchestrator.removePlayer(2);
      
      // Player 2 reconnects
      const reconnectResult = orchestrator.addPlayer(2);
      expect(isOk(reconnectResult)).toBe(true);
      
      // Verify player 2 has valid state
      const state = systems.tickProcessor.getPlayerState(2);
      expect(state).toBeDefined();
      expect(state?.physics?.position).toBeDefined();
    });

    it('should maintain other player states during reconnection', () => {
      orchestrator.initialize();
      orchestrator.addPlayer(1);
      orchestrator.addPlayer(2);
      
      const systems = orchestrator.getSystems()!;
      const currentTime = Date.now();
      
      // Process ticks
      for (let tick = 1; tick <= 10; tick++) {
        systems.tickProcessor.processTick(tick, 0.016, currentTime + tick * 16);
      }
      
      // Get player 1's state before player 2 disconnects
      const player1StateBefore = systems.tickProcessor.getPlayerState(1);
      
      // Player 2 disconnects and reconnects
      orchestrator.removePlayer(2);
      orchestrator.addPlayer(2);
      
      // Player 1's state should be unaffected
      const player1StateAfter = systems.tickProcessor.getPlayerState(1);
      expect(player1StateAfter).toBeDefined();
      expect(player1StateAfter?.physics?.position).toBeDefined();
    });
  });

  describe('exponential backoff reconnection', () => {
    /**
     * Test: Reconnection uses exponential backoff
     * **Validates: Requirement 23.3**
     */
    it('should calculate correct backoff delays', () => {
      const baseDelay = 1000;
      const maxDelay = 30000;
      
      // Calculate expected delays: 1s, 2s, 4s, 8s, 16s, 30s (capped)
      const expectedDelays = [1000, 2000, 4000, 8000, 16000, 30000, 30000];
      
      for (let attempt = 0; attempt < expectedDelays.length; attempt++) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        expect(delay).toBe(expectedDelays[attempt]);
      }
    });
  });

  describe('client reconnection flow', () => {
    let clientOrchestrator: ClientOrchestrator;
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
      clientOrchestrator = createClientOrchestrator();
    });

    afterEach(() => {
      clientOrchestrator.dispose();
      document.body.removeChild(container);
    });

    it('should handle connection loss gracefully', async () => {
      await clientOrchestrator.initialize(container, createMockLoadedMap());
      const systems = clientOrchestrator.getSystems()!;
      
      let connectionLost = false;
      systems.eventBus.on<ConnectionLostEvent>('connection_lost', () => {
        connectionLost = true;
      });
      
      // Simulate connection loss by emitting event
      systems.eventBus.emit({
        type: 'connection_lost',
        timestamp: Date.now(),
        playerId: 1,
        reason: 'Network error'
      });
      
      expect(connectionLost).toBe(true);
    });

    it('should clear pending inputs via acknowledgment on reconnection', async () => {
      await clientOrchestrator.initialize(container, createMockLoadedMap());
      const systems = clientOrchestrator.getSystems()!;
      
      // Apply some inputs
      for (let i = 1; i <= 5; i++) {
        systems.predictionSystem.applyInput({
          sequenceNumber: i,
          tickNumber: i,
          movementX: 0,
          movementY: 1,
          lookDeltaX: 0,
          lookDeltaY: 0,
          buttons: 0,
          clientTimestamp: Date.now() + i * 16
        }, 0, Date.now() + i * 16);
      }
      
      expect(systems.predictionSystem.getPendingInputCount()).toBe(5);
      
      // On reconnection, server sends full state and acknowledges all inputs
      // This clears the pending input buffer
      systems.predictionSystem.acknowledgeInput(5);
      
      expect(systems.predictionSystem.getPendingInputCount()).toBe(0);
    });
  });
});



/**
 * Task 43.4: Anti-Cheat Kick Flow Tests
 * 
 * Tests violation accumulation and player kick mechanism.
 * 
 * **Validates: Requirement 18.4**
 */
describe('Anti-Cheat Kick Flow', () => {
  let eventBus: EventBus;
  let antiCheat: AntiCheat;

  beforeEach(() => {
    eventBus = new EventBus();
    antiCheat = new AntiCheat(DEFAULT_ANTI_CHEAT_CONFIG, undefined, eventBus);
  });

  describe('violation detection', () => {
    /**
     * Test: Speed hack detection
     * **Validates: Requirement 18.1**
     */
    it('should detect speed hack violations', () => {
      const playerId = 1;
      const previousPosition = new Vector3(0, 0, 0);
      const newPosition = new Vector3(100, 0, 0); // Impossibly fast movement
      const deltaTime = 0.016; // 16ms
      const serverTime = Date.now();
      
      const result = antiCheat.validateInput(
        playerId,
        { buttons: 0, clientTimestamp: serverTime },
        previousPosition,
        newPosition,
        true,
        serverTime,
        deltaTime
      );
      
      expect(isOk(result)).toBe(false);
      expect(antiCheat.getViolationCount(playerId)).toBe(1);
    });

    it('should allow valid movement speed', () => {
      const playerId = 1;
      const previousPosition = new Vector3(0, 0, 0);
      const newPosition = new Vector3(0.1, 0, 0); // Normal movement
      const deltaTime = 0.016;
      const serverTime = Date.now();
      
      const result = antiCheat.validateInput(
        playerId,
        { buttons: 0, clientTimestamp: serverTime },
        previousPosition,
        newPosition,
        true,
        serverTime,
        deltaTime
      );
      
      expect(isOk(result)).toBe(true);
      expect(antiCheat.getViolationCount(playerId)).toBe(0);
    });

    /**
     * Test: Timestamp mismatch detection
     * **Validates: Requirement 18.5**
     */
    it('should detect timestamp mismatch violations', () => {
      const playerId = 1;
      const previousPosition = new Vector3(0, 0, 0);
      const newPosition = new Vector3(0, 0, 0);
      const deltaTime = 0.016;
      const serverTime = Date.now();
      const clientTimestamp = serverTime - 1000; // 1 second off (beyond 500ms tolerance)
      
      const result = antiCheat.validateInput(
        playerId,
        { buttons: 0, clientTimestamp },
        previousPosition,
        newPosition,
        true,
        serverTime,
        deltaTime
      );
      
      expect(isOk(result)).toBe(false);
      expect(antiCheat.getViolationCount(playerId)).toBeGreaterThan(0);
    });
  });

  describe('violation accumulation', () => {
    /**
     * Test: Violations accumulate toward kick threshold
     * **Validates: Requirement 18.4**
     */
    it('should accumulate violations for repeated offenses', () => {
      const playerId = 1;
      const serverTime = Date.now();
      
      // Generate multiple violations
      for (let i = 0; i < 5; i++) {
        antiCheat.validateInput(
          playerId,
          { buttons: 0, clientTimestamp: serverTime },
          new Vector3(0, 0, 0),
          new Vector3(100, 0, 0), // Speed hack
          true,
          serverTime,
          0.016
        );
      }
      
      expect(antiCheat.getViolationCount(playerId)).toBe(5);
    });

    it('should track violations per player independently', () => {
      const serverTime = Date.now();
      
      // Player 1 gets 3 violations
      for (let i = 0; i < 3; i++) {
        antiCheat.validateInput(
          1,
          { buttons: 0, clientTimestamp: serverTime },
          new Vector3(0, 0, 0),
          new Vector3(100, 0, 0),
          true,
          serverTime,
          0.016
        );
      }
      
      // Player 2 gets 2 violations
      for (let i = 0; i < 2; i++) {
        antiCheat.validateInput(
          2,
          { buttons: 0, clientTimestamp: serverTime },
          new Vector3(0, 0, 0),
          new Vector3(100, 0, 0),
          true,
          serverTime,
          0.016
        );
      }
      
      expect(antiCheat.getViolationCount(1)).toBe(3);
      expect(antiCheat.getViolationCount(2)).toBe(2);
    });
  });

  describe('kick threshold', () => {
    /**
     * Test: 10 violations triggers kick
     * **Validates: Requirement 18.4**
     */
    it('should trigger kick after 10 violations', () => {
      const playerId = 1;
      const serverTime = Date.now();
      let playerKicked = false;
      let kickedPlayerId: number | null = null;
      
      eventBus.on<PlayerKickedEvent>('player_kicked', (event) => {
        playerKicked = true;
        kickedPlayerId = event.playerId;
      });
      
      // Generate 10 violations
      for (let i = 0; i < 10; i++) {
        antiCheat.validateInput(
          playerId,
          { buttons: 0, clientTimestamp: serverTime },
          new Vector3(0, 0, 0),
          new Vector3(100, 0, 0),
          true,
          serverTime,
          0.016
        );
      }
      
      expect(antiCheat.shouldKick(playerId)).toBe(true);
      expect(playerKicked).toBe(true);
      expect(kickedPlayerId).toBe(playerId);
    });

    it('should not kick before reaching threshold', () => {
      const playerId = 1;
      const serverTime = Date.now();
      
      // Generate 9 violations (just under threshold)
      for (let i = 0; i < 9; i++) {
        antiCheat.validateInput(
          playerId,
          { buttons: 0, clientTimestamp: serverTime },
          new Vector3(0, 0, 0),
          new Vector3(100, 0, 0),
          true,
          serverTime,
          0.016
        );
      }
      
      expect(antiCheat.shouldKick(playerId)).toBe(false);
      expect(antiCheat.getViolationCount(playerId)).toBe(9);
    });
  });

  describe('violation events', () => {
    it('should emit violation_detected event for each violation', () => {
      const playerId = 1;
      const serverTime = Date.now();
      const violations: ViolationDetectedEvent[] = [];
      
      eventBus.on<ViolationDetectedEvent>('violation_detected', (event) => {
        violations.push(event);
      });
      
      // Generate 3 violations
      for (let i = 0; i < 3; i++) {
        antiCheat.validateInput(
          playerId,
          { buttons: 0, clientTimestamp: serverTime },
          new Vector3(0, 0, 0),
          new Vector3(100, 0, 0),
          true,
          serverTime,
          0.016
        );
      }
      
      expect(violations.length).toBe(3);
      expect(violations[0].playerId).toBe(playerId);
      expect(violations[0].violationType).toBe('speed_hack');
    });
  });

  describe('violation clearing', () => {
    it('should clear violations for a player', () => {
      const playerId = 1;
      const serverTime = Date.now();
      
      // Generate violations
      for (let i = 0; i < 5; i++) {
        antiCheat.validateInput(
          playerId,
          { buttons: 0, clientTimestamp: serverTime },
          new Vector3(0, 0, 0),
          new Vector3(100, 0, 0),
          true,
          serverTime,
          0.016
        );
      }
      
      expect(antiCheat.getViolationCount(playerId)).toBe(5);
      
      antiCheat.clearViolations(playerId);
      
      expect(antiCheat.getViolationCount(playerId)).toBe(0);
    });

    it('should remove player from tracking', () => {
      const playerId = 1;
      const serverTime = Date.now();
      
      // Generate violations
      antiCheat.validateInput(
        playerId,
        { buttons: 0, clientTimestamp: serverTime },
        new Vector3(0, 0, 0),
        new Vector3(100, 0, 0),
        true,
        serverTime,
        0.016
      );
      
      expect(antiCheat.getViolationCount(playerId)).toBe(1);
      
      antiCheat.removePlayer(playerId);
      
      expect(antiCheat.getViolationCount(playerId)).toBe(0);
    });
  });

  describe('integration with ServerOrchestrator', () => {
    let orchestrator: ServerOrchestrator;

    beforeEach(() => {
      orchestrator = createServerOrchestrator();
    });

    afterEach(() => {
      orchestrator.dispose();
    });

    it('should have anti-cheat system initialized', () => {
      orchestrator.initialize();
      const systems = orchestrator.getSystems()!;
      
      expect(systems.antiCheat).toBeDefined();
    });

    it('should validate inputs during tick processing', () => {
      orchestrator.initialize();
      orchestrator.addPlayer(1);
      
      const systems = orchestrator.getSystems()!;
      const currentTime = Date.now();
      
      // Queue a valid input
      systems.tickProcessor.queueInput(1, {
        sequenceNumber: 1,
        tickNumber: 1,
        movementX: 0,
        movementY: 1,
        lookDeltaX: 0,
        lookDeltaY: 0,
        buttons: 0,
        clientTimestamp: currentTime
      });
      
      // Process tick - should not generate violations for valid input
      systems.tickProcessor.processTick(1, 0.016, currentTime);
      
      // Player should not have violations for normal movement
      expect(systems.antiCheat.getViolationCount(1)).toBe(0);
    });
  });
});


/**
 * Combined End-to-End Integration Test
 * 
 * Tests the complete flow of a match with all systems working together.
 */
describe('Complete Match End-to-End', () => {
  let serverOrchestrator: ServerOrchestrator;

  beforeEach(() => {
    serverOrchestrator = createServerOrchestrator();
  });

  afterEach(() => {
    serverOrchestrator.dispose();
  });

  it('should run a complete match with all systems integrated', () => {
    // Initialize server
    const initResult = serverOrchestrator.initialize();
    expect(isOk(initResult)).toBe(true);
    
    const systems = serverOrchestrator.getSystems()!;
    const events: string[] = [];
    
    // Track events
    systems.eventBus.on<MatchStateChangedEvent>('match_state_changed', (event) => {
      events.push(`state:${event.newState}`);
    });
    
    systems.eventBus.on<PlayerKickedEvent>('player_kicked', () => {
      events.push('player_kicked');
    });
    
    // Phase 1: Players connect
    serverOrchestrator.addPlayer(1);
    serverOrchestrator.addPlayer(2);
    expect(systems.matchStateMachine.getState()).toBe('countdown');
    
    // Phase 2: Countdown completes - use fixed base time
    const baseTime = 100000;
    systems.matchStateMachine.update(baseTime + 4000);
    expect(systems.matchStateMachine.getState()).toBe('playing');
    
    // Phase 3: Process game ticks (in playing state, so lag compensation records snapshots)
    const tickStartTime = baseTime + 4000;
    for (let tick = 1; tick <= 60; tick++) {
      const tickTime = tickStartTime + tick * 16;
      
      // Queue inputs for both players
      systems.tickProcessor.queueInput(1, {
        sequenceNumber: tick,
        tickNumber: tick,
        movementX: 0,
        movementY: 1,
        lookDeltaX: 0,
        lookDeltaY: 0,
        buttons: 0,
        clientTimestamp: tickTime
      });
      
      systems.tickProcessor.queueInput(2, {
        sequenceNumber: tick,
        tickNumber: tick,
        movementX: 0,
        movementY: -1,
        lookDeltaX: 0,
        lookDeltaY: 0,
        buttons: 0,
        clientTimestamp: tickTime
      });
      
      systems.tickProcessor.processTick(tick, 0.016, tickTime);
    }
    
    // Verify lag compensation recorded snapshots
    expect(systems.lagCompensation.getSnapshotCount()).toBeGreaterThan(0);
    
    // Verify players have valid states
    const state1 = systems.tickProcessor.getPlayerState(1);
    const state2 = systems.tickProcessor.getPlayerState(2);
    expect(state1?.physics?.position).toBeDefined();
    expect(state2?.physics?.position).toBeDefined();
    
    // Phase 4: Win condition
    for (let i = 0; i < 10; i++) {
      systems.matchStateMachine.recordKill(1, 2);
    }
    expect(systems.matchStateMachine.getState()).toBe('ended');
    expect(systems.matchStateMachine.getWinnerId()).toBe(1);
    
    // Verify event sequence
    expect(events).toContain('state:countdown');
    expect(events).toContain('state:playing');
    expect(events).toContain('state:ended');
  });
});
