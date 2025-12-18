/**
 * GameEvents - All typed event interfaces for the arena system
 * 
 * Events are organized by category:
 * - System Events: Initialization, lifecycle
 * - Match Events: State changes, start/end
 * - Player Events: Spawn, death, damage
 * - Combat Events: Weapon fire, hits
 * - Network Events: Connection, sync
 * - Input Events: Pointer lock, buffer
 * - Anti-Cheat Events: Violations, kicks
 */

import type { GameEvent } from './EventBus';

// ============================================================================
// Type Definitions
// ============================================================================

export type MatchState = 'waiting' | 'countdown' | 'playing' | 'ended' | 'cleanup';
export type ViolationType = 'speed_hack' | 'invalid_jump' | 'fire_rate' | 'timestamp_mismatch';

// ============================================================================
// System Events
// ============================================================================

export interface SystemReadyEvent extends GameEvent {
  readonly type: 'system_ready';
  readonly systemName: string;
}

export interface InitializationFailedEvent extends GameEvent {
  readonly type: 'initialization_failed';
  readonly systemName: string;
  readonly error: string;
}

export interface SystemsReadyEvent extends GameEvent {
  readonly type: 'systems_ready';
}

// ============================================================================
// Match Events
// ============================================================================

export interface MatchStateChangedEvent extends GameEvent {
  readonly type: 'match_state_changed';
  readonly previousState: MatchState;
  readonly newState: MatchState;
}

export interface MatchStartEvent extends GameEvent {
  readonly type: 'match_start';
  readonly tickNumber: number;
}

export interface MatchEndEvent extends GameEvent {
  readonly type: 'match_end';
  readonly winnerId: number;
  readonly finalScores: ReadonlyMap<number, number>;
}

export interface CountdownTickEvent extends GameEvent {
  readonly type: 'countdown_tick';
  readonly secondsRemaining: number;
}

// ============================================================================
// Player Events
// ============================================================================

export interface PlayerSpawnedEvent extends GameEvent {
  readonly type: 'player_spawned';
  readonly playerId: number;
  readonly positionX: number;
  readonly positionY: number;
  readonly positionZ: number;
}

export interface PlayerDeathEvent extends GameEvent {
  readonly type: 'player_death';
  readonly victimId: number;
  readonly killerId: number;
  readonly positionX: number;
  readonly positionY: number;
  readonly positionZ: number;
}

export interface PlayerDamagedEvent extends GameEvent {
  readonly type: 'player_damaged';
  readonly victimId: number;
  readonly attackerId: number;
  readonly damage: number;
  readonly hitPositionX: number;
  readonly hitPositionY: number;
  readonly hitPositionZ: number;
}

export interface PlayerConnectedEvent extends GameEvent {
  readonly type: 'player_connected';
  readonly playerId: number;
}

export interface PlayerDisconnectedEvent extends GameEvent {
  readonly type: 'player_disconnected';
  readonly playerId: number;
  readonly reason: string;
}

// ============================================================================
// Combat Events
// ============================================================================

export interface WeaponFiredEvent extends GameEvent {
  readonly type: 'weapon_fired';
  readonly playerId: number;
  readonly originX: number;
  readonly originY: number;
  readonly originZ: number;
  readonly directionX: number;
  readonly directionY: number;
  readonly directionZ: number;
}

export interface HitConfirmedEvent extends GameEvent {
  readonly type: 'hit_confirmed';
  readonly shooterId: number;
  readonly targetId: number;
  readonly hitPositionX: number;
  readonly hitPositionY: number;
  readonly hitPositionZ: number;
  readonly damage: number;
}

export interface KillConfirmedEvent extends GameEvent {
  readonly type: 'kill_confirmed';
  readonly killerId: number;
  readonly victimId: number;
  readonly killerScore: number;
}

// ============================================================================
// Network Events
// ============================================================================

export interface ConnectionEstablishedEvent extends GameEvent {
  readonly type: 'connection_established';
  readonly playerId: number;
  readonly rtt: number;
}

export interface ConnectionLostEvent extends GameEvent {
  readonly type: 'connection_lost';
  readonly playerId: number;
  readonly reason: string;
}

export interface DesyncDetectedEvent extends GameEvent {
  readonly type: 'desync_detected';
  readonly predictionError: number;
  readonly tickNumber: number;
}

export interface ReconciliationEvent extends GameEvent {
  readonly type: 'reconciliation';
  readonly tickNumber: number;
  readonly errorMagnitude: number;
  readonly inputsReplayed: number;
}

export interface FullStateSyncEvent extends GameEvent {
  readonly type: 'full_state_sync';
  readonly tickNumber: number;
}

// ============================================================================
// Input Events
// ============================================================================

export interface PointerLockedEvent extends GameEvent {
  readonly type: 'pointer_locked';
}

export interface PointerReleasedEvent extends GameEvent {
  readonly type: 'pointer_released';
}

export interface InputBufferOverflowEvent extends GameEvent {
  readonly type: 'input_buffer_overflow';
  readonly droppedCount: number;
}

export interface InputAcknowledgedEvent extends GameEvent {
  readonly type: 'input_acknowledged';
  readonly sequenceNumber: number;
}

// ============================================================================
// Anti-Cheat Events
// ============================================================================

export interface ViolationDetectedEvent extends GameEvent {
  readonly type: 'violation_detected';
  readonly playerId: number;
  readonly violationType: ViolationType;
  readonly details: string;
}

export interface PlayerKickedEvent extends GameEvent {
  readonly type: 'player_kicked';
  readonly playerId: number;
  readonly reason: string;
  readonly violationCount: number;
}

// ============================================================================
// Physics Events
// ============================================================================

export interface LandImpactEvent extends GameEvent {
  readonly type: 'land_impact';
  readonly playerId: number;
  readonly fallHeight: number;
}

export interface JumpEvent extends GameEvent {
  readonly type: 'jump';
  readonly playerId: number;
}

// ============================================================================
// Clock/Timing Events
// ============================================================================

export interface ClockDriftDetectedEvent extends GameEvent {
  readonly type: 'clock_drift_detected';
  readonly drift: number;
}

export interface ClockSyncCompleteEvent extends GameEvent {
  readonly type: 'clock_sync_complete';
  readonly offset: number;
  readonly rtt: number;
}

// ============================================================================
// Tick Events
// ============================================================================

export interface TickCatchupWarningEvent extends GameEvent {
  readonly type: 'tick_catchup_warning';
  readonly skippedTicks: number;
}

export interface TickHandlerErrorEvent extends GameEvent {
  readonly type: 'tick_handler_error';
  readonly tickNumber: number;
  readonly error: string;
}

// ============================================================================
// Network Quality Events
// ============================================================================

export interface NetworkWarningEvent extends GameEvent {
  readonly type: 'network_warning';
  readonly rtt: number;
  readonly packetLoss: number;
}

export interface HighLatencyEvent extends GameEvent {
  readonly type: 'high_latency';
  readonly rtt: number;
}

// ============================================================================
// Union Type of All Events
// ============================================================================

export type ArenaGameEvent =
  // System
  | SystemReadyEvent
  | InitializationFailedEvent
  | SystemsReadyEvent
  // Match
  | MatchStateChangedEvent
  | MatchStartEvent
  | MatchEndEvent
  | CountdownTickEvent
  // Player
  | PlayerSpawnedEvent
  | PlayerDeathEvent
  | PlayerDamagedEvent
  | PlayerConnectedEvent
  | PlayerDisconnectedEvent
  // Combat
  | WeaponFiredEvent
  | HitConfirmedEvent
  | KillConfirmedEvent
  // Network
  | ConnectionEstablishedEvent
  | ConnectionLostEvent
  | DesyncDetectedEvent
  | ReconciliationEvent
  | FullStateSyncEvent
  // Input
  | PointerLockedEvent
  | PointerReleasedEvent
  | InputBufferOverflowEvent
  | InputAcknowledgedEvent
  // Anti-Cheat
  | ViolationDetectedEvent
  | PlayerKickedEvent
  // Physics
  | LandImpactEvent
  | JumpEvent
  // Clock
  | ClockDriftDetectedEvent
  | ClockSyncCompleteEvent
  // Tick
  | TickCatchupWarningEvent
  | TickHandlerErrorEvent
  // Network Quality
  | NetworkWarningEvent
  | HighLatencyEvent;
