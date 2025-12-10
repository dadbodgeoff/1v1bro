/**
 * IndustrialMapConverter - Converts ArenaMap to MapConfig format
 * 
 * Bridges the new industrial tileset-based map format with the existing
 * game engine's MapConfig system.
 * 
 * @module terrain/IndustrialMapConverter
 */

import type { MapConfig, TileDefinition, SpawnPointConfig, MapTheme } from '../config/maps/map-schema'
import type { BarrierConfig, HazardConfig } from '../arena/types'
import type { ArenaMap } from './IndustrialArenaMap'
import { HAZARD_TILES } from './TilesetLoader'

// ============================================================================
// Constants
// ============================================================================

const TILE_SIZE = 80 // Standard tile size (matches other maps)

// ============================================================================
// Converter Functions
// ============================================================================

/**
 * Convert an ArenaMap to MapConfig format
 * This allows industrial maps to work with the existing game engine
 */
export function convertArenaMapToConfig(arenaMap: ArenaMap): MapConfig {
  const tiles = convertTiles(arenaMap)
  const barriers = extractBarriers(arenaMap)
  const hazards = extractHazards(arenaMap)
  const spawnPoints = extractSpawnPoints(arenaMap)
  const powerUpSpawns = extractPowerUpSpawns(arenaMap)

  return {
    metadata: {
      name: arenaMap.name,
      author: 'Industrial Map Generator',
      version: '1.0.0',
      description: `${arenaMap.width}x${arenaMap.height} industrial arena`,
      theme: 'industrial' as MapTheme, // Custom theme
    },
    tiles,
    barriers,
    hazards,
    traps: [], // Traps can be added later
    teleporters: [],
    jumpPads: [],
    spawnPoints,
    powerUpSpawns,
  }
}

/**
 * Convert ArenaMap tiles to TileDefinition format
 */
function convertTiles(arenaMap: ArenaMap): TileDefinition[][] {
  const tiles: TileDefinition[][] = []

  for (let y = 0; y < arenaMap.height; y++) {
    const row: TileDefinition[] = []
    for (let x = 0; x < arenaMap.width; x++) {
      const mapTile = arenaMap.tiles[y]?.[x]
      if (!mapTile) {
        row.push({ type: 'floor' })
        continue
      }

      // Determine tile type based on properties
      if (mapTile.solid) {
        row.push({ type: 'wall', metadata: { obstacle: mapTile.obstacle } })
      } else if (mapTile.damaging) {
        row.push({ 
          type: 'hazard_damage', 
          metadata: { hazard: mapTile.hazard, damage: mapTile.damage } 
        })
      } else {
        row.push({ 
          type: 'floor', 
          metadata: { floor: mapTile.floor, prop: mapTile.prop } 
        })
      }
    }
    tiles.push(row)
  }

  return tiles
}

/**
 * Extract barrier configs from solid tiles
 */
function extractBarriers(arenaMap: ArenaMap): BarrierConfig[] {
  const barriers: BarrierConfig[] = []
  let barrierId = 0

  for (let y = 0; y < arenaMap.height; y++) {
    for (let x = 0; x < arenaMap.width; x++) {
      const mapTile = arenaMap.tiles[y]?.[x]
      if (mapTile?.solid && mapTile.obstacle !== undefined) {
        barriers.push({
          id: `barrier_${barrierId++}`,
          type: 'full', // Cover objects block movement and projectiles
          position: { x: x * TILE_SIZE, y: y * TILE_SIZE },
          size: { x: TILE_SIZE, y: TILE_SIZE },
        })
      }
    }
  }

  return barriers
}

/**
 * Extract hazard configs from damaging tiles
 */
function extractHazards(arenaMap: ArenaMap): HazardConfig[] {
  const hazards: HazardConfig[] = []
  let hazardId = 0

  for (let y = 0; y < arenaMap.height; y++) {
    for (let x = 0; x < arenaMap.width; x++) {
      const mapTile = arenaMap.tiles[y]?.[x]
      if (mapTile?.damaging && mapTile.damage) {
        hazards.push({
          id: `hazard_${hazardId++}`,
          type: 'damage',
          bounds: {
            x: x * TILE_SIZE,
            y: y * TILE_SIZE,
            width: TILE_SIZE,
            height: TILE_SIZE,
          },
          intensity: mapTile.damage,
        })
      }
    }
  }

  return hazards
}

/**
 * Extract spawn points from ArenaMap
 */
function extractSpawnPoints(arenaMap: ArenaMap): SpawnPointConfig[] {
  return [
    {
      id: 'player1',
      position: {
        x: arenaMap.spawn1.x * TILE_SIZE + TILE_SIZE / 2,
        y: arenaMap.spawn1.y * TILE_SIZE + TILE_SIZE / 2,
      },
    },
    {
      id: 'player2',
      position: {
        x: arenaMap.spawn2.x * TILE_SIZE + TILE_SIZE / 2,
        y: arenaMap.spawn2.y * TILE_SIZE + TILE_SIZE / 2,
      },
    },
  ]
}

/**
 * Extract power-up spawn locations from pickup tiles
 */
function extractPowerUpSpawns(arenaMap: ArenaMap): Array<{ x: number; y: number }> {
  const spawns: Array<{ x: number; y: number }> = []

  for (let y = 0; y < arenaMap.height; y++) {
    for (let x = 0; x < arenaMap.width; x++) {
      const mapTile = arenaMap.tiles[y]?.[x]
      // Check if this is a pickup tile (health kit or ammo crate)
      if (mapTile?.hazard === HAZARD_TILES.HEALTH_KIT || 
          mapTile?.hazard === HAZARD_TILES.AMMO_CRATE) {
        spawns.push({
          x: x * TILE_SIZE + TILE_SIZE / 2,
          y: y * TILE_SIZE + TILE_SIZE / 2,
        })
      }
    }
  }

  return spawns
}

/**
 * Get the pixel dimensions of an ArenaMap
 */
export function getArenaMapDimensions(arenaMap: ArenaMap): { width: number; height: number } {
  return {
    width: arenaMap.width * TILE_SIZE,
    height: arenaMap.height * TILE_SIZE,
  }
}

/**
 * Get tile size used by industrial maps
 */
export function getIndustrialTileSize(): number {
  return TILE_SIZE
}
