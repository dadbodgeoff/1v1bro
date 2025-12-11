/**
 * TileVariation - Handles tile variation and selection logic
 * 
 * Provides functions for selecting appropriate tiles based on:
 * - Position-based variation (seeded random)
 * - Neighbor-based 9-slice selection
 * - Tile type mapping
 * 
 * @module terrain/TileVariation
 */

import { GRASS_TILES, SCIFI_TILES, WATER_TILES, WALL_TILES } from './TilesetLoader'
import type { TileType } from '../arena/types'
import type { TileMapCell, TileTheme } from './TileTypes'

/**
 * Simple hash function for position-based variation
 */
export function hashPosition(x: number, y: number, seed: number): number {
  const h = (x * 374761393 + y * 668265263 + seed) | 0
  return Math.abs(((h ^ (h >> 13)) * 1274126177) | 0)
}

/**
 * Get a floor tile with variation based on position
 */
export function getFloorTile(
  x: number,
  y: number,
  theme: TileTheme,
  seed: number
): TileMapCell {
  const tilesetId = theme.floor
  const hash = hashPosition(x, y, seed)
  
  if (tilesetId === 'scifi-floor') {
    const variation = hash % 100
    let tileIndex: number
    
    if (variation < 60) {
      tileIndex = SCIFI_TILES.METAL_PLAIN
    } else if (variation < 75) {
      tileIndex = SCIFI_TILES.CIRCUIT_PURPLE
    } else if (variation < 85) {
      tileIndex = SCIFI_TILES.CIRCUIT_CYAN
    } else if (variation < 92) {
      tileIndex = SCIFI_TILES.TECH_PANEL
    } else {
      tileIndex = SCIFI_TILES.METAL_ACCENT
    }
    
    return { tilesetId, tileIndex }
  } else if (tilesetId === 'grass') {
    const variation = hash % 100
    let tileIndex: number
    
    if (variation < 50) {
      tileIndex = GRASS_TILES.PLAIN_1 + (hash % 4)
    } else if (variation < 70) {
      tileIndex = GRASS_TILES.FLOWERS_YELLOW + (hash % 4)
    } else if (variation < 85) {
      tileIndex = GRASS_TILES.DIRT_1 + (hash % 4)
    } else {
      tileIndex = GRASS_TILES.STONES_1 + (hash % 4)
    }
    
    return { tilesetId, tileIndex }
  }
  
  return { tilesetId, tileIndex: 0 }
}

/**
 * Check if a position is a wall
 */
export function isWall(tiles: { type: TileType }[][], x: number, y: number): boolean {
  const tile = tiles[y]?.[x]
  return tile?.type === 'wall' || tile?.type === 'half_wall'
}

/**
 * Get a wall tile using 9-slice based on neighbors
 */
export function getWallTile(
  x: number,
  y: number,
  tiles: { type: TileType }[][],
  theme: TileTheme
): TileMapCell {
  const tilesetId = theme.wall
  
  const hasTop = isWall(tiles, x, y - 1)
  const hasBottom = isWall(tiles, x, y + 1)
  const hasLeft = isWall(tiles, x - 1, y)
  const hasRight = isWall(tiles, x + 1, y)
  
  let tileIndex: number
  
  if (!hasTop && !hasLeft) {
    tileIndex = WALL_TILES.TOP_LEFT
  } else if (!hasTop && !hasRight) {
    tileIndex = WALL_TILES.TOP_RIGHT
  } else if (!hasBottom && !hasLeft) {
    tileIndex = WALL_TILES.BOTTOM_LEFT
  } else if (!hasBottom && !hasRight) {
    tileIndex = WALL_TILES.BOTTOM_RIGHT
  } else if (!hasTop) {
    tileIndex = WALL_TILES.TOP
  } else if (!hasBottom) {
    tileIndex = WALL_TILES.BOTTOM
  } else if (!hasLeft) {
    tileIndex = WALL_TILES.LEFT
  } else if (!hasRight) {
    tileIndex = WALL_TILES.RIGHT
  } else {
    tileIndex = WALL_TILES.CENTER
  }
  
  return { tilesetId, tileIndex }
}

/**
 * Get a hazard tile
 */
export function getHazardTile(
  type: TileType,
  theme: TileTheme
): TileMapCell {
  const tilesetId = theme.floor
  
  if (tilesetId === 'scifi-floor') {
    if (type === 'hazard_damage') {
      return { tilesetId, tileIndex: SCIFI_TILES.HAZARD_FULL }
    } else if (type === 'hazard_slow') {
      return { tilesetId, tileIndex: SCIFI_TILES.ENERGY_CORE }
    } else if (type === 'hazard_emp') {
      return { tilesetId, tileIndex: SCIFI_TILES.POWER_BUTTON }
    }
  }
  
  return { tilesetId, tileIndex: 0 }
}

/**
 * Get a teleporter tile
 */
export function getTeleporterTile(theme: TileTheme): TileMapCell {
  if (theme.floor === 'scifi-floor') {
    return { tilesetId: 'scifi-floor', tileIndex: SCIFI_TILES.TELEPORTER }
  }
  return { tilesetId: theme.floor, tileIndex: 0 }
}

/**
 * Get a jump pad tile
 */
export function getJumpPadTile(theme: TileTheme): TileMapCell {
  if (theme.floor === 'scifi-floor') {
    return { tilesetId: 'scifi-floor', tileIndex: SCIFI_TILES.VENT_CYAN }
  }
  return { tilesetId: theme.floor, tileIndex: 0 }
}

/**
 * Get water tile index for 9-slice position
 */
export function getWaterTileIndex(
  row: number,
  col: number,
  rows: number,
  cols: number
): number {
  const isTop = row === 0
  const isBottom = row === rows - 1
  const isLeft = col === 0
  const isRight = col === cols - 1
  
  if (isTop && isLeft) return WATER_TILES.TOP_LEFT
  if (isTop && isRight) return WATER_TILES.TOP_RIGHT
  if (isBottom && isLeft) return WATER_TILES.BOTTOM_LEFT
  if (isBottom && isRight) return WATER_TILES.BOTTOM_RIGHT
  if (isTop) return WATER_TILES.TOP
  if (isBottom) return WATER_TILES.BOTTOM
  if (isLeft) return WATER_TILES.LEFT
  if (isRight) return WATER_TILES.RIGHT
  return WATER_TILES.CENTER
}
