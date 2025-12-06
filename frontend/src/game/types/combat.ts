/**
 * Combat system type definitions
 * Types for projectiles, weapons, health, and combat events
 */

import type { Vector2 } from './index'

// ============================================================================
// Projectile Types
// ============================================================================

export interface Projectile {
  id: string
  ownerId: string // Player who fired
  position: Vector2
  velocity: Vector2
  spawnTime: number
  spawnPosition: Vector2 // For range calculation
  damage: number
  isPredicted: boolean // Client-side prediction flag
}

// ============================================================================
// Weapon Types
// ============================================================================

export interface WeaponConfig {
  fireRate: number // Shots per second
  projectileSpeed: number // Units per second
  maxRange: number // Units before despawn
  damage: number // Health points per hit
  spread: number // Degrees of random deviation
  knockback: number // Units of pushback on hit
}

// ============================================================================
// Health Types
// ============================================================================

export interface HealthState {
  current: number
  max: number
  shield: number
  shieldMax: number
  lastDamageTime: number
  isInvulnerable: boolean
  invulnerabilityEnd: number
}

export interface CombatState {
  health: HealthState
  isAlive: boolean
  respawnTime: number | null // Timestamp when respawn occurs
  kills: number
  deaths: number
}


// ============================================================================
// Combat Event Types
// ============================================================================

export interface HitEvent {
  projectileId: string
  shooterId: string
  targetId: string
  damage: number
  position: Vector2
  timestamp: number
}

export interface FireEvent {
  playerId: string
  position: Vector2
  direction: Vector2
  timestamp: number
  sequenceNum: number // For reconciliation
}

export interface DeathEvent {
  playerId: string
  killerId: string
  timestamp: number
}

export interface RespawnEvent {
  playerId: string
  position: Vector2
  timestamp: number
}

// ============================================================================
// Combat Callbacks
// ============================================================================

export interface CombatCallbacks {
  onFire?: (event: FireEvent) => void
  onHit?: (event: HitEvent) => void
  onDeath?: (event: DeathEvent) => void
  onRespawn?: (event: RespawnEvent) => void
}
