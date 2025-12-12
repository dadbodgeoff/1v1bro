/**
 * Map Configuration Schema and Validation
 * Defines the structure for arena map configurations
 * 
 * @module config/maps/map-schema
 */

import type { Vector2 } from '../../types'
import type {
  TileType,
  BarrierConfig,
  HazardConfig,
  TrapConfig,
  TeleporterConfig,
  JumpPadConfig,
  ValidationResult
} from '../../arena/types'

// Re-export types for consumers
export type { ValidationResult, TeleporterConfig }

// ============================================================================
// Map Configuration Types
// ============================================================================

/**
 * Tile definition for map configuration
 */
export interface TileDefinition {
  type: TileType
  metadata?: Record<string, unknown>
}

/**
 * Available backdrop themes for maps
 */
export type MapTheme = 'space' | 'volcanic' | 'void' | 'industrial' | 'simple' | 'cornfield'

/**
 * Map metadata
 * Requirements: 9.4
 */
export interface MapMetadata {
  name: string              // 3-50 characters
  author: string
  version: string           // Semver format (e.g., "1.0.0")
  description: string       // Max 200 characters
  thumbnail?: string        // Optional preview image path
  theme?: MapTheme          // Visual theme for backdrop (default: 'space')
}

/**
 * Spawn point configuration
 */
export interface SpawnPointConfig {
  id: 'player1' | 'player2'
  position: Vector2
}

/**
 * ArenaMap tile structure for tileset-based maps
 */
export interface ArenaMapTile {
  floor: number
  obstacle?: number
  hazard?: number
  prop?: number
  solid: boolean
  damaging: boolean
  damage?: number
}

/**
 * ArenaMap structure for tileset-based maps
 */
export interface ArenaMap {
  name: string
  width: number
  height: number
  tiles: ArenaMapTile[][]
  spawn1: { x: number; y: number }
  spawn2: { x: number; y: number }
  tilesets: string[]
}

/**
 * Complete map configuration
 * Requirements: 9.1, 3.4
 */
export interface MapConfig {
  metadata: MapMetadata
  tiles: TileDefinition[][]
  barriers: BarrierConfig[]
  hazards: HazardConfig[]
  traps: TrapConfig[]
  teleporters: TeleporterConfig[]
  jumpPads: JumpPadConfig[]
  spawnPoints: SpawnPointConfig[]
  powerUpSpawns: Vector2[]
  
  // Tileset support (Requirements: 3.4)
  tilesetMap?: ArenaMap  // Optional tile-based map data
  requiredTilesets?: string[]  // Tileset IDs to preload
}


// ============================================================================
// Validation Constants
// ============================================================================

const GRID_WIDTH = 16
const GRID_HEIGHT = 9
const TILE_SIZE = 80

const NAME_MIN_LENGTH = 3
const NAME_MAX_LENGTH = 50
const DESCRIPTION_MAX_LENGTH = 200

const SEMVER_REGEX = /^\d+\.\d+\.\d+$/

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Check if two rectangles overlap
 */
export function rectanglesOverlap(
  a: { position: Vector2; size: Vector2 },
  b: { position: Vector2; size: Vector2 }
): boolean {
  return (
    a.position.x < b.position.x + b.size.x &&
    a.position.x + a.size.x > b.position.x &&
    a.position.y < b.position.y + b.size.y &&
    a.position.y + a.size.y > b.position.y
  )
}

/**
 * Convert pixel position to grid coordinates
 */
export function pixelToGrid(pixel: Vector2): { gridX: number; gridY: number } {
  return {
    gridX: Math.floor(pixel.x / TILE_SIZE),
    gridY: Math.floor(pixel.y / TILE_SIZE)
  }
}

/**
 * Check if grid coordinates are valid
 */
export function isValidGridPosition(gridX: number, gridY: number): boolean {
  return gridX >= 0 && gridX < GRID_WIDTH && gridY >= 0 && gridY < GRID_HEIGHT
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate map metadata
 */
function validateMetadata(metadata: MapMetadata, errors: string[]): void {
  // Name validation
  if (!metadata.name || metadata.name.length < NAME_MIN_LENGTH) {
    errors.push(`Map name must be at least ${NAME_MIN_LENGTH} characters`)
  }
  if (metadata.name && metadata.name.length > NAME_MAX_LENGTH) {
    errors.push(`Map name must be at most ${NAME_MAX_LENGTH} characters`)
  }

  // Author validation
  if (!metadata.author || metadata.author.trim().length === 0) {
    errors.push('Map author is required')
  }

  // Version validation
  if (!metadata.version || !SEMVER_REGEX.test(metadata.version)) {
    errors.push('Map version must be in semver format (e.g., "1.0.0")')
  }

  // Description validation
  if (metadata.description && metadata.description.length > DESCRIPTION_MAX_LENGTH) {
    errors.push(`Map description must be at most ${DESCRIPTION_MAX_LENGTH} characters`)
  }
}

/**
 * Validate tile grid dimensions
 */
function validateTileGrid(tiles: TileDefinition[][], errors: string[]): void {
  if (!tiles || tiles.length !== GRID_HEIGHT) {
    errors.push(`Tile grid must have exactly ${GRID_HEIGHT} rows, found ${tiles?.length ?? 0}`)
    return
  }

  for (let y = 0; y < tiles.length; y++) {
    if (!tiles[y] || tiles[y].length !== GRID_WIDTH) {
      errors.push(`Tile grid row ${y} must have exactly ${GRID_WIDTH} columns, found ${tiles[y]?.length ?? 0}`)
    }
  }
}

/**
 * Validate teleporter pairs
 * Requirements: 9.7
 */
function validateTeleporterPairs(teleporters: TeleporterConfig[], errors: string[]): void {
  const pairCounts = new Map<string, number>()
  const randomExitTeleporters = new Set<string>()

  for (const tp of teleporters) {
    // Teleporters with randomExits don't need pairs - they teleport to random locations
    if (tp.randomExits && tp.randomExits.length > 0) {
      randomExitTeleporters.add(tp.id)
      continue
    }
    pairCounts.set(tp.pairId, (pairCounts.get(tp.pairId) || 0) + 1)
  }

  for (const [pairId, count] of pairCounts) {
    if (count !== 2) {
      errors.push(`Teleporter pair "${pairId}" must have exactly 2 pads, found ${count}`)
    }
  }
}

/**
 * Validate spawn points are on floor tiles
 * Requirements: 9.7
 */
function validateSpawnPoints(
  spawnPoints: SpawnPointConfig[],
  tiles: TileDefinition[][],
  errors: string[]
): void {
  for (const spawn of spawnPoints) {
    const { gridX, gridY } = pixelToGrid(spawn.position)

    if (!isValidGridPosition(gridX, gridY)) {
      errors.push(`Spawn point ${spawn.id} is outside the map bounds`)
      continue
    }

    const tile = tiles[gridY]?.[gridX]
    if (!tile || tile.type !== 'floor') {
      errors.push(`Spawn point ${spawn.id} must be on a floor tile, found "${tile?.type ?? 'undefined'}"`)
    }
  }

  // Ensure both spawn points exist
  const hasPlayer1 = spawnPoints.some(s => s.id === 'player1')
  const hasPlayer2 = spawnPoints.some(s => s.id === 'player2')

  if (!hasPlayer1) errors.push('Missing spawn point for player1')
  if (!hasPlayer2) errors.push('Missing spawn point for player2')
}

/**
 * Validate no overlapping barriers
 * Requirements: 9.7
 */
function validateBarrierOverlaps(barriers: BarrierConfig[], errors: string[]): void {
  for (let i = 0; i < barriers.length; i++) {
    for (let j = i + 1; j < barriers.length; j++) {
      if (rectanglesOverlap(barriers[i], barriers[j])) {
        errors.push(`Barriers "${barriers[i].id}" and "${barriers[j].id}" overlap`)
      }
    }
  }
}

/**
 * Validate barrier health values
 */
function validateBarrierHealth(barriers: BarrierConfig[], errors: string[]): void {
  for (const barrier of barriers) {
    if (barrier.type === 'destructible') {
      const health = barrier.health ?? 100
      if (health < 50 || health > 200) {
        errors.push(`Barrier "${barrier.id}" health must be between 50 and 200, found ${health}`)
      }
    }
  }
}

/**
 * Validate hazard intensity values
 */
function validateHazardIntensity(hazards: HazardConfig[], errors: string[]): void {
  for (const hazard of hazards) {
    if (hazard.type === 'damage') {
      if (hazard.intensity < 5 || hazard.intensity > 25) {
        errors.push(`Damage zone "${hazard.id}" intensity must be between 5 and 25, found ${hazard.intensity}`)
      }
    } else if (hazard.type === 'slow') {
      if (hazard.intensity < 0.25 || hazard.intensity > 0.75) {
        errors.push(`Slow field "${hazard.id}" intensity must be between 0.25 and 0.75, found ${hazard.intensity}`)
      }
    }
  }
}

/**
 * Validate trap cooldown values
 */
function validateTrapCooldowns(traps: TrapConfig[], errors: string[]): void {
  for (const trap of traps) {
    if (trap.cooldown < 5 || trap.cooldown > 30) {
      errors.push(`Trap "${trap.id}" cooldown must be between 5 and 30 seconds, found ${trap.cooldown}`)
    }

    if (trap.type === 'timed' && trap.interval !== undefined) {
      if (trap.interval < 5 || trap.interval > 30) {
        errors.push(`Timed trap "${trap.id}" interval must be between 5 and 30 seconds, found ${trap.interval}`)
      }
    }
  }
}

// ============================================================================
// Main Validation Function
// ============================================================================

/**
 * Validate a complete map configuration
 * Requirements: 9.2, 9.3, 9.7, 9.8
 * 
 * @param config - The map configuration to validate
 * @returns Validation result with errors if any
 */
export function validateMapConfig(config: MapConfig): ValidationResult {
  const errors: string[] = []

  // Validate metadata
  validateMetadata(config.metadata, errors)

  // Validate tile grid
  validateTileGrid(config.tiles, errors)

  // Validate teleporter pairs
  validateTeleporterPairs(config.teleporters, errors)

  // Validate spawn points (only if tile grid is valid)
  if (config.tiles?.length === GRID_HEIGHT) {
    validateSpawnPoints(config.spawnPoints, config.tiles, errors)
  }

  // Validate barrier overlaps
  validateBarrierOverlaps(config.barriers, errors)

  // Validate barrier health
  validateBarrierHealth(config.barriers, errors)

  // Validate hazard intensity
  validateHazardIntensity(config.hazards, errors)

  // Validate trap cooldowns
  validateTrapCooldowns(config.traps, errors)

  return {
    valid: errors.length === 0,
    errors
  }
}
