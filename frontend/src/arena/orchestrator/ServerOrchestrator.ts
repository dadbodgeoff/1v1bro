/**
 * ServerOrchestrator - Server-side game initialization and tick loop
 * 
 * Manages the initialization sequence and tick processing for the server.
 * Initialization order: Config → EventBus → CollisionWorld → Physics3D → 
 * SpawnSystem → CombatSystem → PlayerStates → TickScheduler
 * 
 * @module orchestrator/ServerOrchestrator
 */

import type { Result } from '../core/Result';
import { Ok, Err, isOk } from '../core/Result';
import type { IEventBus } from '../core/EventBus';
import { EventBus } from '../core/EventBus';
import type { 
  SystemReadyEvent
} from '../core/GameEvents';
import type { InitializationError } from '../core/Errors';
import { createInitializationError } from '../core/Errors';
import type { GameConfig } from '../config/GameConfig';
import { DEFAULT_GAME_CONFIG } from '../config/GameConfig';
import { CollisionWorld } from '../physics/CollisionWorld';
import { Physics3D } from '../physics/Physics3D';
import { SpawnSystem } from '../game/SpawnSystem';
import { CombatSystem } from '../game/CombatSystem';
import { MatchStateMachine } from '../game/MatchStateMachine';
import { AntiCheat } from '../game/AntiCheat';
import { LagCompensation } from '../game/LagCompensation';
import { TickScheduler } from '../server/TickScheduler';
import { TickProcessor } from '../server/TickProcessor';
import { 
  ABANDONED_TERMINAL_COLLISION_MANIFEST,
  ABANDONED_TERMINAL_SPAWN_MANIFEST 
} from '../config/AbandonedTerminalManifest';
import { Vector3 } from '../math/Vector3';

// ============================================================================
// Types
// ============================================================================

export type ServerState = 
  | 'uninitialized'
  | 'initializing'
  | 'ready'
  | 'running'
  | 'paused'
  | 'error';

export interface ServerSystems {
  eventBus: IEventBus;
  collisionWorld: CollisionWorld;
  physics: Physics3D;
  spawnSystem: SpawnSystem;
  combatSystem: CombatSystem;
  matchStateMachine: MatchStateMachine;
  antiCheat: AntiCheat;
  lagCompensation: LagCompensation;
  tickScheduler: TickScheduler;
  tickProcessor: TickProcessor;
}

// ============================================================================
// Interface
// ============================================================================

export interface IServerOrchestrator {
  initialize(): Result<void, InitializationError>;
  dispose(): void;
  getState(): ServerState;
  getSystems(): ServerSystems | null;
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  addPlayer(playerId: number): Result<void, string>;
  removePlayer(playerId: number): void;
}

// ============================================================================
// Implementation
// ============================================================================

export class ServerOrchestrator implements IServerOrchestrator {
  private state: ServerState = 'uninitialized';
  private systems: ServerSystems | null = null;
  private config: GameConfig;

  constructor(config: GameConfig = DEFAULT_GAME_CONFIG) {
    this.config = config;
  }

  initialize(): Result<void, InitializationError> {
    if (this.state !== 'uninitialized') {
      return Err(createInitializationError(
        'SYSTEM_INIT_FAILED',
        'Server already initialized or initializing'
      ));
    }

    this.state = 'initializing';

    try {
      // 1. Create EventBus
      const eventBus = new EventBus();
      this.emitSystemReady(eventBus, 'EventBus');

      // 2. Create CollisionWorld and load manifest
      const collisionWorld = new CollisionWorld(4);
      const loadResult = collisionWorld.loadManifest(ABANDONED_TERMINAL_COLLISION_MANIFEST);
      if (!isOk(loadResult)) {
        return Err(createInitializationError(
          'ASSET_LOAD_FAILED',
          `Failed to load collision manifest: ${loadResult.error}`,
          'CollisionWorld'
        ));
      }
      this.emitSystemReady(eventBus, 'CollisionWorld');

      // 3. Create Physics3D
      const physics = new Physics3D(this.config.physics, collisionWorld, eventBus);
      this.emitSystemReady(eventBus, 'Physics3D');

      // 4. Create SpawnSystem and load manifest
      const spawnSystem = new SpawnSystem(eventBus);
      spawnSystem.loadManifest(ABANDONED_TERMINAL_SPAWN_MANIFEST);
      this.emitSystemReady(eventBus, 'SpawnSystem');

      // 5. Create CombatSystem
      const combatSystem = new CombatSystem(this.config.combat, collisionWorld, eventBus);
      this.emitSystemReady(eventBus, 'CombatSystem');

      // 6. Create MatchStateMachine
      const matchStateMachine = new MatchStateMachine(this.config.match, eventBus);
      this.emitSystemReady(eventBus, 'MatchStateMachine');

      // 7. Create AntiCheat
      const antiCheat = new AntiCheat({
        maxViolations: this.config.antiCheat.violationThreshold,
        violationWindowMs: this.config.antiCheat.violationWindowMs,
        speedToleranceFactor: this.config.antiCheat.maxSpeedMultiplier,
        timestampToleranceMs: this.config.antiCheat.maxTimestampDeviationMs
      }, this.config.physics, eventBus);
      this.emitSystemReady(eventBus, 'AntiCheat');

      // 8. Create LagCompensation
      const lagCompensation = new LagCompensation({
        maxRewindMs: this.config.lagCompensation.maxRewindMs,
        historyDurationMs: this.config.lagCompensation.snapshotHistoryMs,
        tickDurationMs: this.config.tick.tickDurationMs
      });
      this.emitSystemReady(eventBus, 'LagCompensation');

      // 9. Create TickScheduler
      const tickScheduler = new TickScheduler(
        { tickRate: this.config.tick.tickRate, maxCatchUpTicks: this.config.tick.maxCatchupTicks },
        eventBus
      );
      this.emitSystemReady(eventBus, 'TickScheduler');

      // 10. Create TickProcessor
      const tickProcessor = new TickProcessor(
        physics,
        combatSystem,
        matchStateMachine,
        spawnSystem,
        antiCheat,
        lagCompensation,
        eventBus
      );
      this.emitSystemReady(eventBus, 'TickProcessor');

      // Wire up tick handler
      tickScheduler.onTick((tickNumber) => {
        const currentTime = Date.now();
        const deltaTime = this.config.tick.tickDurationMs / 1000;
        tickProcessor.processTick(tickNumber, deltaTime, currentTime);
      });

      // Store all systems
      this.systems = {
        eventBus,
        collisionWorld,
        physics,
        spawnSystem,
        combatSystem,
        matchStateMachine,
        antiCheat,
        lagCompensation,
        tickScheduler,
        tickProcessor
      };

      this.state = 'ready';
      return Ok(undefined);

    } catch (error) {
      this.state = 'error';
      return Err(createInitializationError(
        'SYSTEM_INIT_FAILED',
        `Initialization failed: ${error}`,
        undefined,
        { error: String(error) }
      ));
    }
  }

  dispose(): void {
    this.stop();

    if (this.systems) {
      this.systems.eventBus.clear();
      this.systems = null;
    }

    this.state = 'uninitialized';
  }

  getState(): ServerState {
    return this.state;
  }

  getSystems(): ServerSystems | null {
    return this.systems;
  }

  start(): void {
    if (this.state !== 'ready' && this.state !== 'paused') return;
    if (!this.systems) return;

    this.systems.tickScheduler.start();
    this.state = 'running';
  }

  stop(): void {
    if (!this.systems) return;

    this.systems.tickScheduler.stop();
    
    if (this.state === 'running') {
      this.state = 'ready';
    }
  }

  pause(): void {
    if (this.state === 'running') {
      this.stop();
      this.state = 'paused';
    }
  }

  resume(): void {
    if (this.state === 'paused') {
      this.start();
    }
  }

  addPlayer(playerId: number): Result<void, string> {
    if (!this.systems) {
      return Err('Server not initialized');
    }

    // Spawn player first to get position
    const otherPositions = this.getOtherPlayerPositions(playerId);
    const spawnPoint = this.systems.spawnSystem.selectSpawnPoint(playerId, otherPositions);

    // Add to tick processor with spawn position
    this.systems.tickProcessor.addPlayer(playerId, spawnPoint.position);

    // Initialize combat state
    this.systems.combatSystem.initializePlayer(playerId);

    // Notify match state machine
    this.systems.matchStateMachine.playerConnected(playerId);

    return Ok(undefined);
  }

  removePlayer(playerId: number): void {
    if (!this.systems) return;

    this.systems.tickProcessor.removePlayer(playerId);
    this.systems.combatSystem.removePlayer(playerId);
    this.systems.antiCheat.removePlayer(playerId);
    this.systems.matchStateMachine.playerDisconnected(playerId);
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  private getOtherPlayerPositions(excludePlayerId: number): Vector3[] {
    if (!this.systems) return [];

    const positions: Vector3[] = [];
    const playerIds = this.systems.tickProcessor.getPlayerIds();

    for (const id of playerIds) {
      if (id === excludePlayerId) continue;
      const state = this.systems.tickProcessor.getPlayerState(id);
      if (state && state.physics && state.physics.position) {
        positions.push(state.physics.position);
      }
    }

    return positions;
  }

  private emitSystemReady(eventBus: IEventBus, systemName: string): void {
    eventBus.emit<SystemReadyEvent>({
      type: 'system_ready',
      timestamp: Date.now(),
      systemName
    });
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a server orchestrator with default config
 */
export function createServerOrchestrator(config?: Partial<GameConfig>): ServerOrchestrator {
  const fullConfig = config ? { ...DEFAULT_GAME_CONFIG, ...config } : DEFAULT_GAME_CONFIG;
  return new ServerOrchestrator(fullConfig);
}
