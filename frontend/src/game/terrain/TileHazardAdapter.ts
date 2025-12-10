/**
 * TileHazardAdapter - Bridges tile-based hazards with the game engine
 * 
 * Handles:
 * - Damage calculation at world positions
 * - Hazard zone extraction for integration with existing system
 * - Default damage values
 * - Maximum damage from overlapping hazards
 * 
 * @module terrain/TileHazardAdapter
 * 
 * Requirements: 5.1, 5.2, 5.4
 */

import type { IndustrialArenaRenderer } from './TileRenderer'
import type { ArenaMap } from './IndustrialArenaMap'
import { worldToGrid, isInBounds } from './TileCollisionAdapter'

// Re-export for external use
export type { IndustrialArenaRenderer }

export interface HazardConfig {
  id: string
  type: 'damage' | 'slow' | 'bounce'
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
  intensity: number
}

export interface HazardTile {
  x: number
  y: number
  width: number
  height: number
  damage: number
}

/** Default damage per second when not specified */
const DEFAULT_DAMAGE = 10

/**
 * TileHazardAdapter - Adapts tile-based hazards for the game engine
 */
export class TileHazardAdapter {
  private map: ArenaMap | null = null
  private tileSize: number

  constructor(tileSize = 80) {
    this.tileSize = tileSize
  }

  /**
   * Set the renderer to use for hazard checks
   */
  setRenderer(industrialRenderer: IndustrialArenaRenderer): void {
    this.map = industrialRenderer.getMap()
  }

  /**
   * Set the map directly (for testing without renderer)
   */
  setMap(map: ArenaMap): void {
    this.map = map
  }

  /**
   * Get tile size
   */
  getTileSize(): number {
    return this.tileSize
  }

  /**
   * Get damage at a world position
   * Property 7: Hazard Damage Application
   * Returns damage per second at the position (0 if none)
   * Uses default damage of 10 if not specified (Requirement 5.2)
   */
  getDamageAtPosition(worldX: number, worldY: number): number {
    if (!this.map) return 0

    const { gridX, gridY } = worldToGrid(worldX, worldY, this.tileSize)

    // Out of bounds has no damage
    if (!isInBounds(gridX, gridY, this.map.width, this.map.height)) {
      return 0
    }

    const tile = this.map.tiles[gridY]?.[gridX]
    if (!tile || !tile.damaging) {
      return 0
    }

    // Use default damage if not specified
    return tile.damage ?? DEFAULT_DAMAGE
  }

  /**
   * Get maximum damage from overlapping hazard tiles at a position
   * Property 8: Maximum Hazard Damage
   * For overlapping hazards, returns the highest damage value
   */
  getMaxDamageAtPosition(worldX: number, worldY: number, radius: number): number {
    if (!this.map) return 0

    const { gridX, gridY } = worldToGrid(worldX, worldY, this.tileSize)
    let maxDamage = 0

    // Check surrounding tiles that the player might overlap
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const checkX = gridX + dx
        const checkY = gridY + dy

        if (!isInBounds(checkX, checkY, this.map.width, this.map.height)) {
          continue
        }

        const tile = this.map.tiles[checkY]?.[checkX]
        if (!tile?.damaging) continue

        // Check if player circle overlaps this tile
        const tileLeft = checkX * this.tileSize
        const tileTop = checkY * this.tileSize
        
        if (this.circleRectOverlap(worldX, worldY, radius, tileLeft, tileTop, this.tileSize, this.tileSize)) {
          const damage = tile.damage ?? DEFAULT_DAMAGE
          maxDamage = Math.max(maxDamage, damage)
        }
      }
    }

    return maxDamage
  }

  /**
   * Check if a circle overlaps a rectangle
   */
  private circleRectOverlap(
    cx: number,
    cy: number,
    radius: number,
    rectX: number,
    rectY: number,
    rectWidth: number,
    rectHeight: number
  ): boolean {
    const closestX = Math.max(rectX, Math.min(cx, rectX + rectWidth))
    const closestY = Math.max(rectY, Math.min(cy, rectY + rectHeight))
    const dx = cx - closestX
    const dy = cy - closestY
    return dx * dx + dy * dy < radius * radius
  }

  /**
   * Get all hazard tiles as HazardConfig for integration with existing system
   */
  getHazardZones(): HazardConfig[] {
    if (!this.map) return []

    const hazards: HazardConfig[] = []

    for (let y = 0; y < this.map.height; y++) {
      for (let x = 0; x < this.map.width; x++) {
        const tile = this.map.tiles[y][x]
        if (tile.damaging) {
          hazards.push({
            id: `tile-hazard-${x}-${y}`,
            type: 'damage',
            bounds: {
              x: x * this.tileSize,
              y: y * this.tileSize,
              width: this.tileSize,
              height: this.tileSize,
            },
            intensity: tile.damage ?? DEFAULT_DAMAGE,
          })
        }
      }
    }

    return hazards
  }

  /**
   * Get all hazard tiles with their damage values
   */
  getHazardTiles(): HazardTile[] {
    if (!this.map) return []

    const hazards: HazardTile[] = []

    for (let y = 0; y < this.map.height; y++) {
      for (let x = 0; x < this.map.width; x++) {
        const tile = this.map.tiles[y][x]
        if (tile.damaging && tile.damage) {
          hazards.push({
            x: x * this.tileSize,
            y: y * this.tileSize,
            width: this.tileSize,
            height: this.tileSize,
            damage: tile.damage,
          })
        }
      }
    }

    return hazards
  }

  /**
   * Calculate total damage for a duration at a position
   * Property 7: Hazard Damage Application
   * Total damage = damage per second * time in seconds
   */
  calculateDamageForDuration(worldX: number, worldY: number, durationSeconds: number): number {
    const damagePerSecond = this.getDamageAtPosition(worldX, worldY)
    return damagePerSecond * durationSeconds
  }
}
