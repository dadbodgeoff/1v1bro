/**
 * TerrainTypes - Terrain properties and friction modifiers
 * Based on Arena Assets Cheatsheet recommendations
 * 
 * @module terrain/TerrainTypes
 */

import type { TileType } from '../arena/types'

// ============================================================================
// Terrain Properties Interface
// ============================================================================

export interface TerrainProperties {
  /** Friction coefficient (0-1). Lower = more slippery. Default floor = 1.0 */
  friction: number
  /** Speed multiplier applied to movement. 1.0 = normal speed */
  speedMultiplier: number
  /** Whether players can walk on this terrain */
  walkable: boolean
  /** Damage per second while standing on this terrain (0 = no damage) */
  damagePerSecond: number
  /** Sound tag for footstep audio */
  soundTag: string
  /** Visual color tint for the terrain (hex) */
  colorTint: string
  /** Whether this terrain blocks projectiles */
  blocksProjectiles: boolean
}

// ============================================================================
// Default Terrain Properties
// ============================================================================

/**
 * Terrain properties lookup by tile type
 * Friction values based on cheatsheet:
 * - Stone: 0.95 (less slippery)
 * - Grass: 0.85 (normal)
 * - Sand: 0.70 (slower movement)
 * - Ice: 0.40 (very slippery)
 */
export const TERRAIN_PROPERTIES: Record<TileType, TerrainProperties> = {
  // Standard floor - normal movement
  floor: {
    friction: 1.0,
    speedMultiplier: 1.0,
    walkable: true,
    damagePerSecond: 0,
    soundTag: 'stone',
    colorTint: '#1a1a2e',
    blocksProjectiles: false,
  },

  // Wall - blocks movement and projectiles
  wall: {
    friction: 1.0,
    speedMultiplier: 0,
    walkable: false,
    damagePerSecond: 0,
    soundTag: 'none',
    colorTint: '#2d2d44',
    blocksProjectiles: true,
  },

  // Half wall - partial cover, can shoot over
  half_wall: {
    friction: 1.0,
    speedMultiplier: 0,
    walkable: false,
    damagePerSecond: 0,
    soundTag: 'none',
    colorTint: '#3d3d5c',
    blocksProjectiles: false, // Can shoot over
  },

  // Damage hazard - hurts players
  hazard_damage: {
    friction: 0.9,
    speedMultiplier: 0.9,
    walkable: true,
    damagePerSecond: 15, // 5-25 per cheatsheet
    soundTag: 'hazard',
    colorTint: '#ff4444',
    blocksProjectiles: false,
  },

  // Slow field - reduces movement speed
  hazard_slow: {
    friction: 0.5, // Slippery like ice
    speedMultiplier: 0.5, // 50% speed
    walkable: true,
    damagePerSecond: 0,
    soundTag: 'slow',
    colorTint: '#4444ff',
    blocksProjectiles: false,
  },

  // EMP zone - disables power-ups
  hazard_emp: {
    friction: 1.0,
    speedMultiplier: 1.0,
    walkable: true,
    damagePerSecond: 0,
    soundTag: 'emp',
    colorTint: '#ffff44',
    blocksProjectiles: false,
  },

  // Pressure trap tile
  trap_pressure: {
    friction: 1.0,
    speedMultiplier: 1.0,
    walkable: true,
    damagePerSecond: 0,
    soundTag: 'trap',
    colorTint: '#ff8844',
    blocksProjectiles: false,
  },

  // Timed trap tile
  trap_timed: {
    friction: 1.0,
    speedMultiplier: 1.0,
    walkable: true,
    damagePerSecond: 0,
    soundTag: 'trap',
    colorTint: '#ff8844',
    blocksProjectiles: false,
  },

  // Teleporter pad
  teleporter: {
    friction: 1.0,
    speedMultiplier: 1.0,
    walkable: true,
    damagePerSecond: 0,
    soundTag: 'teleporter',
    colorTint: '#44ffff',
    blocksProjectiles: false,
  },

  // Jump pad
  jump_pad: {
    friction: 1.0,
    speedMultiplier: 1.0,
    walkable: true,
    damagePerSecond: 0,
    soundTag: 'jumppad',
    colorTint: '#44ff44',
    blocksProjectiles: false,
  },
}

// ============================================================================
// Extended Terrain Types (Future Use)
// ============================================================================

/**
 * Extended terrain types for future map variety
 * These can be added to TileType enum when needed
 */
export const EXTENDED_TERRAIN: Record<string, TerrainProperties> = {
  // Ice terrain - very slippery
  ice: {
    friction: 0.4,
    speedMultiplier: 1.1, // Slightly faster due to sliding
    walkable: true,
    damagePerSecond: 0,
    soundTag: 'ice',
    colorTint: '#aaddff',
    blocksProjectiles: false,
  },

  // Sand terrain - slower movement
  sand: {
    friction: 0.7,
    speedMultiplier: 0.8,
    walkable: true,
    damagePerSecond: 0,
    soundTag: 'sand',
    colorTint: '#ddcc88',
    blocksProjectiles: false,
  },

  // Water - slows and damages
  water: {
    friction: 0.6,
    speedMultiplier: 0.5,
    walkable: true,
    damagePerSecond: 5,
    soundTag: 'water',
    colorTint: '#4488ff',
    blocksProjectiles: false,
  },

  // Lava - high damage
  lava: {
    friction: 0.8,
    speedMultiplier: 0.7,
    walkable: true,
    damagePerSecond: 25,
    soundTag: 'lava',
    colorTint: '#ff4400',
    blocksProjectiles: false,
  },

  // Void - instant death
  void: {
    friction: 1.0,
    speedMultiplier: 1.0,
    walkable: false,
    damagePerSecond: 1000, // Effectively instant death
    soundTag: 'void',
    colorTint: '#110022',
    blocksProjectiles: false,
  },

  // Grass - standard outdoor terrain
  grass: {
    friction: 0.85,
    speedMultiplier: 1.0,
    walkable: true,
    damagePerSecond: 0,
    soundTag: 'grass',
    colorTint: '#2d4a2d',
    blocksProjectiles: false,
  },

  // Stone - slightly better traction
  stone: {
    friction: 0.95,
    speedMultiplier: 1.0,
    walkable: true,
    damagePerSecond: 0,
    soundTag: 'stone',
    colorTint: '#4a4a4a',
    blocksProjectiles: false,
  },
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get terrain properties for a tile type
 * Falls back to floor properties if type not found
 */
export function getTerrainProperties(tileType: TileType): TerrainProperties {
  return TERRAIN_PROPERTIES[tileType] ?? TERRAIN_PROPERTIES.floor
}

/**
 * Calculate effective speed multiplier for a position
 * Combines terrain friction and speed modifier
 */
export function calculateSpeedMultiplier(tileType: TileType): number {
  const props = getTerrainProperties(tileType)
  return props.speedMultiplier * props.friction
}

/**
 * Check if terrain is hazardous (deals damage)
 */
export function isHazardousTerrain(tileType: TileType): boolean {
  const props = getTerrainProperties(tileType)
  return props.damagePerSecond > 0
}

/**
 * Check if terrain blocks movement
 */
export function isBlockingTerrain(tileType: TileType): boolean {
  const props = getTerrainProperties(tileType)
  return !props.walkable
}
