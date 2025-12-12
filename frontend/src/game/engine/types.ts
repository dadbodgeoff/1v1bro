/**
 * Shared types for game engine modules
 */

import type {
  RenderContext,
  PlayerState,
  PowerUpState,
  Vector2,
  FireEvent,
  HitEvent,
  DeathEvent,
  RespawnEvent,
  Projectile,
  HealthState,
} from '../types'
import type { DeathReplay } from '../telemetry'

export interface GameEngineCallbacks {
  onPositionUpdate?: (position: Vector2) => void
  onPowerUpCollect?: (powerUpId: number) => void
  onAssetsLoaded?: () => void
  onCombatFire?: (event: FireEvent) => void
  onCombatHit?: (event: HitEvent) => void
  onCombatDeath?: (event: DeathEvent) => void
  onCombatRespawn?: (event: RespawnEvent) => void
  onDeathReplayReady?: (replay: DeathReplay) => void
  onLocalHazardDamage?: (playerId: string, damage: number) => void
  onLocalTrapTriggered?: (playerId: string, damage: number) => void
}

export interface GameState {
  localPlayer: PlayerState | null
  opponent: PlayerState | null
  powerUps: PowerUpState[]
  combatEnabled: boolean
  mousePosition: Vector2
}

export interface LaunchState {
  velocity: Vector2 | null
  timeRemaining: number
  hitApplied: boolean
}

export type {
  RenderContext,
  PlayerState,
  PowerUpState,
  Vector2,
  Projectile,
  HealthState,
  FireEvent,
  HitEvent,
  DeathEvent,
  RespawnEvent,
}
