/**
 * Telemetry System Types
 * Types for capturing, storing, and replaying combat telemetry
 */

import type { Vector2 } from '../types'

// ============================================================================
// Snapshot Types (captured every tick)
// ============================================================================

export interface PlayerSnapshot {
  playerId: string
  position: Vector2
  velocity: Vector2
  health: number
  shield: number
  isInvulnerable: boolean
  aimDirection: Vector2
  state: 'alive' | 'dead' | 'respawning'
}

export interface ProjectileSnapshot {
  id: string
  ownerId: string
  position: Vector2
  velocity: Vector2
  spawnTick: number
}

export interface NetworkStats {
  clientTick: number
  serverTick: number
  rttMs: number
  jitterMs: number
  packetLoss: number // 0-1
}

// ============================================================================
// Combat Event Types (for telemetry)
// ============================================================================

export type TelemetryCombatEventType = 'fire' | 'hit' | 'damage' | 'death' | 'respawn'

export interface TelemetryFireEventData {
  playerId: string
  position: Vector2
  direction: Vector2
  projectileId?: string
}

export interface TelemetryHitEventData {
  projectileId: string
  shooterId: string
  targetId: string
  hitPosition: Vector2
  targetPosition: Vector2
  clientTargetPosition: Vector2
  damage: number
  latencyMs: number
}

export interface TelemetryDamageEventData {
  targetId: string
  damage: number
  source: string // 'projectile', 'trap', 'hazard'
  healthAfter: number
}

export interface TelemetryDeathEventData {
  playerId: string
  killerId: string
  finalHitPosition: Vector2
  healthBeforeHit: number
  damageDealt: number
}

export interface TelemetryRespawnEventData {
  playerId: string
  position: Vector2
}

export type TelemetryCombatEventData =
  | TelemetryFireEventData
  | TelemetryHitEventData
  | TelemetryDamageEventData
  | TelemetryDeathEventData
  | TelemetryRespawnEventData

export interface TelemetryCombatEvent {
  type: TelemetryCombatEventType
  tick: number
  timestamp: number
  data: TelemetryCombatEventData
}

// ============================================================================
// Frame Types
// ============================================================================

export interface TelemetryFrame {
  tick: number
  timestamp: number
  players: PlayerSnapshot[]
  projectiles: ProjectileSnapshot[]
  events: TelemetryCombatEvent[]
  networkStats: NetworkStats
}

// ============================================================================
// Replay Types
// ============================================================================

export interface DeathReplay {
  id: string
  lobbyId: string
  victimId: string
  killerId: string
  deathTick: number
  deathTimestamp: number
  frames: TelemetryFrame[]
  flagged: boolean
  flagReason?: string
  createdAt: number
  expiresAt: number
}

// ============================================================================
// Recorder Config
// ============================================================================

export interface TelemetryConfig {
  maxFrames: number // Ring buffer size
  replayFrames: number // Frames to extract for death replay
  captureRate: number // Frames per second (usually matches game tick rate)
}

export const DEFAULT_TELEMETRY_CONFIG: TelemetryConfig = {
  maxFrames: 600, // 10 seconds at 60fps
  replayFrames: 300, // 5 seconds
  captureRate: 60,
}
