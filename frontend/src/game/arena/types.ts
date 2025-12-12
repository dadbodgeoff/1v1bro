/**
 * Arena Type Definitions
 * Core types for the AAA arena upgrade system
 * 
 * @module arena/types
 */

import type { Vector2, Rectangle } from '../types'

// ============================================================================
// Tile System Types
// ============================================================================

/**
 * All supported tile types in the arena
 * Requirements: 1.3
 */
export type TileType =
  | 'floor'
  | 'wall'
  | 'half_wall'
  | 'hazard_damage'
  | 'hazard_slow'
  | 'hazard_emp'
  | 'trap_pressure'
  | 'trap_timed'
  | 'teleporter'
  | 'jump_pad'

/**
 * Data for a single tile in the map
 */
export interface TileData {
  type: TileType
  gridX: number
  gridY: number
  pixelX: number
  pixelY: number
  metadata?: Record<string, unknown>
}

/**
 * Tile map configuration interface
 */
export interface TileMapConfig {
  width: number       // Grid width (16)
  height: number      // Grid height (9)
  tileSize: number    // Pixels per tile (80)
  tiles: TileData[][]
}

// ============================================================================
// Barrier Types
// ============================================================================

/**
 * Types of barriers supported
 * Requirements: 2.1-2.6
 */
export type BarrierType = 'full' | 'half' | 'destructible' | 'one_way'

/**
 * Direction for one-way barriers
 */
export type Direction = 'N' | 'S' | 'E' | 'W'


/**
 * Configuration for creating a barrier
 */
export interface BarrierConfig {
  id: string
  type: BarrierType
  position: Vector2
  size: Vector2
  health?: number           // For destructible (default: 100, min: 50, max: 200)
  direction?: Direction     // For one-way barriers
}

/**
 * Damage state for destructible barriers
 * intact: 100-67% HP, cracked: 66-34% HP, damaged: 33-1% HP, destroyed: 0 HP
 */
export type DamageState = 'intact' | 'cracked' | 'damaged' | 'destroyed'

/**
 * Runtime state of a barrier
 */
export interface BarrierState {
  id: string
  type: BarrierType
  position: Vector2
  size: Vector2
  health: number
  maxHealth: number
  damageState: DamageState
  isActive: boolean
}

// ============================================================================
// Hazard Types
// ============================================================================

/**
 * Types of hazard zones
 * Requirements: 3.1-3.3
 */
export type HazardType = 'damage' | 'slow' | 'emp'

/**
 * Configuration for creating a hazard zone
 */
export interface HazardConfig {
  id: string
  type: HazardType
  bounds: Rectangle
  intensity: number         // Damage per sec (5-25), speed multiplier (0.25-0.75), or 1 for EMP
}

/**
 * Runtime state of a hazard zone
 */
export interface HazardState {
  id: string
  type: HazardType
  bounds: Rectangle
  intensity: number
  isActive: boolean
  playersInside: Set<string>
}

// ============================================================================
// Trap Types
// ============================================================================

/**
 * Types of traps
 * Requirements: 4.1-4.3
 */
export type TrapType = 'pressure' | 'timed' | 'projectile'

/**
 * Effects that traps can apply
 * Requirements: 4.5
 */
export type TrapEffect = 'damage_burst' | 'knockback' | 'stun'

/**
 * Trap state machine states
 * warning: brief telegraph before triggering (0.3s)
 */
export type TrapStateType = 'armed' | 'warning' | 'triggered' | 'cooldown'

/**
 * Configuration for creating a trap
 */
export interface TrapConfig {
  id: string
  type: TrapType
  position: Vector2
  radius: number            // Trigger radius (default: 40px)
  effect: TrapEffect
  effectValue: number       // Damage (50), knockback force (200), stun duration (0.5s)
  cooldown: number          // Seconds (5-30, default: 10)
  interval?: number         // For timed traps (5-30 seconds)
  chainRadius?: number      // For trap chains (160px)
}

/**
 * Runtime state of a trap
 */
export interface TrapState {
  id: string
  type: TrapType
  position: Vector2
  radius: number
  effect: TrapEffect
  effectValue: number
  cooldown: number
  cooldownRemaining: number
  state: TrapStateType
  lastTriggerTime: number
  interval?: number
  chainRadius?: number
}

// ============================================================================
// Transport Types
// ============================================================================

/**
 * Configuration for creating a teleporter
 * Requirements: 5.1
 */
export interface TeleporterConfig {
  id: string
  pairId: string            // Matching pair identifier (A↔A, B↔B, etc.)
  position: Vector2
  radius: number            // Trigger radius (default: 30px)
  randomExits?: Vector2[]   // Optional: random exit destinations (chaos teleporters)
}

/**
 * Runtime state of a teleporter
 */
export interface TeleporterState {
  id: string
  pairId: string
  position: Vector2
  radius: number
  linkedTeleporterId: string | null
  playerCooldowns: Map<string, number>  // playerId -> cooldown end timestamp
  randomExits?: Vector2[]   // Optional: random exit destinations (chaos teleporters)
}

/**
 * Directions for jump pads
 * Requirements: 6.7
 */
export type JumpDirection = 'N' | 'S' | 'E' | 'W' | 'NE' | 'NW' | 'SE' | 'SW'

/**
 * Configuration for creating a jump pad
 * Requirements: 6.1
 */
export interface JumpPadConfig {
  id: string
  position: Vector2
  radius: number            // Trigger radius (default: 40px)
  direction: JumpDirection
  force: number             // Launch velocity (default: 400 units/sec)
}

/**
 * Runtime state of a jump pad
 */
export interface JumpPadState {
  id: string
  position: Vector2
  radius: number
  direction: JumpDirection
  force: number
  playerCooldowns: Map<string, number>  // playerId -> cooldown end timestamp
}

// ============================================================================
// Zone Effect Types
// ============================================================================

/**
 * Types of zone effects that can be applied to players
 * Requirements: 8.1
 */
export type ZoneEffectType = 'speed_modifier' | 'damage_over_time' | 'power_up_disable'

/**
 * A single zone effect applied to a player
 */
export interface ZoneEffect {
  sourceId: string          // ID of the zone that applied this effect
  type: ZoneEffectType
  value: number             // Speed multiplier, damage per second, or 1 for disable
  startTime: number         // Timestamp when effect was applied
}

/**
 * Aggregated effect state for a player
 * Requirements: 8.4, 8.5
 */
export interface EffectState {
  speedMultiplier: number   // 1.0 = normal, 0.5 = 50% speed (multiplicative)
  damagePerSecond: number   // Total DOT from all sources (additive)
  powerUpsDisabled: boolean // True if any EMP zone active (boolean OR)
  activeEffects: ZoneEffect[]
}

// ============================================================================
// Render Layer Types
// ============================================================================

/**
 * Render layers in draw order (back to front)
 * Requirements: 7.1
 */
export const RenderLayer = {
  BACKGROUND: 0,
  FLOOR: 1,
  HAZARDS: 2,
  BARRIERS: 3,
  ENTITIES: 4,
  EFFECTS: 5,
  UI: 6
} as const

export type RenderLayerType = typeof RenderLayer[keyof typeof RenderLayer]

/**
 * A renderable object that can be registered with the layer manager
 * Requirements: 7.8
 */
export interface Renderable {
  id: string
  layer: RenderLayerType
  subLayer: number          // 0-99 for Y-sorting within layer
  render: (ctx: CanvasRenderingContext2D) => void
}

// ============================================================================
// Callback Types
// ============================================================================

/**
 * Callbacks for barrier events
 */
export interface BarrierCallbacks {
  onDestroyed?: (barrierId: string, position: Vector2) => void
  onDamaged?: (barrierId: string, health: number, maxHealth: number) => void
}

/**
 * Callbacks for hazard events
 */
export interface HazardCallbacks {
  onDamage?: (playerId: string, damage: number, sourceId: string) => void
  onEffectApplied?: (playerId: string, hazardId: string, type: HazardType) => void
  onEffectRemoved?: (playerId: string, hazardId: string) => void
}

/**
 * Callbacks for trap events
 */
export interface TrapCallbacks {
  onTriggered?: (trapId: string, affectedPlayers: string[]) => void
  onCooldownComplete?: (trapId: string) => void
}

/**
 * Callbacks for transport events
 */
export interface TransportCallbacks {
  onTeleport?: (playerId: string, from: Vector2, to: Vector2) => void
  onLaunch?: (playerId: string, velocity: Vector2) => void
  onLaunchCollision?: (launchedPlayerId: string, hitPlayerId: string, knockbackDir: Vector2) => void
}

/**
 * Callbacks for zone manager events
 */
export interface ZoneManagerCallbacks {
  onEffectAdded?: (playerId: string, effect: ZoneEffect) => void
  onEffectRemoved?: (playerId: string, sourceId: string) => void
  onEffectModified?: (playerId: string, effect: ZoneEffect) => void
}

/**
 * Callbacks for arena manager events
 */
export interface ArenaCallbacks {
  onBarrierDestroyed?: (barrierId: string, position: Vector2) => void
  onTrapTriggered?: (trapId: string, affectedPlayers: string[]) => void
  onPlayerTeleported?: (playerId: string, from: Vector2, to: Vector2) => void
  onPlayerLaunched?: (playerId: string, direction: Vector2) => void
  onHazardDamage?: (playerId: string, damage: number, sourceId: string) => void
}

// ============================================================================
// Result Types
// ============================================================================

/**
 * Result of trap effect application
 */
export interface TrapEffectResult {
  playerId: string
  type: TrapEffect
  value: number
  position: Vector2
}

/**
 * Result of map validation
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
}
