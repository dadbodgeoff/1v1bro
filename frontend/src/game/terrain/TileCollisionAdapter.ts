/**
 * TileCollisionAdapter - Bridges tile-based collision with the game engine
 * 
 * Handles:
 * - World to grid coordinate conversion
 * - Collision detection against solid tiles
 * - Out of bounds detection
 * 
 * @module terrain/TileCollisionAdapter
 * 
 * Requirements: 4.1, 4.2, 4.4
 */

import type { IndustrialArenaRenderer } from './TileRenderer'
import type { ArenaMap } from './IndustrialArenaMap'

export interface Vector2 {
  x: number
  y: number
}

/**
 * Convert world position to grid coordinates
 * Property 5: World to Grid Coordinate Conversion
 * For any world position (x, y) and tile size, the grid coordinates 
 * SHALL be calculated as (floor(x / tileSize), floor(y / tileSize))
 */
export function worldToGrid(worldX: number, worldY: number, tileSize: number): { gridX: number; gridY: number } {
  return {
    gridX: Math.floor(worldX / tileSize),
    gridY: Math.floor(worldY / tileSize),
  }
}

/**
 * Convert grid coordinates to world position (center of tile)
 */
export function gridToWorld(gridX: number, gridY: number, tileSize: number): { x: number; y: number } {
  return {
    x: gridX * tileSize + tileSize / 2,
    y: gridY * tileSize + tileSize / 2,
  }
}

/**
 * Check if grid coordinates are within map bounds
 * Property 6: Out of Bounds Non-Walkable
 */
export function isInBounds(gridX: number, gridY: number, mapWidth: number, mapHeight: number): boolean {
  return gridX >= 0 && gridX < mapWidth && gridY >= 0 && gridY < mapHeight
}

/**
 * TileCollisionAdapter - Adapts tile-based collision for the game engine
 */
export class TileCollisionAdapter {
  private map: ArenaMap | null = null
  private tileSize: number

  constructor(tileSize = 80) {
    this.tileSize = tileSize
  }

  /**
   * Set the renderer to use for collision checks
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
   * Check if a world position is walkable
   * Property 4: Solid Tile Collision
   * Property 6: Out of Bounds Non-Walkable
   */
  isWalkable(worldX: number, worldY: number): boolean {
    if (!this.map) return false

    const { gridX, gridY } = worldToGrid(worldX, worldY, this.tileSize)

    // Out of bounds is not walkable
    if (!isInBounds(gridX, gridY, this.map.width, this.map.height)) {
      return false
    }

    // Check if tile is solid
    const tile = this.map.tiles[gridY]?.[gridX]
    if (!tile) return false

    return !tile.solid
  }

  /**
   * Check collision for a circle at a position
   * Returns true if there is a collision (position is blocked)
   */
  checkCollision(position: Vector2, radius: number): boolean {
    if (!this.map) return false

    const { gridX, gridY } = worldToGrid(position.x, position.y, this.tileSize)

    // Check surrounding tiles for collision
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const checkX = gridX + dx
        const checkY = gridY + dy

        // Out of bounds is a collision
        if (!isInBounds(checkX, checkY, this.map.width, this.map.height)) {
          // Check if circle actually overlaps the out-of-bounds area
          const tileLeft = checkX * this.tileSize
          const tileTop = checkY * this.tileSize
          if (this.circleRectCollision(position, radius, tileLeft, tileTop, this.tileSize, this.tileSize)) {
            return true
          }
          continue
        }

        const tile = this.map.tiles[checkY]?.[checkX]
        if (tile?.solid) {
          const tileLeft = checkX * this.tileSize
          const tileTop = checkY * this.tileSize
          if (this.circleRectCollision(position, radius, tileLeft, tileTop, this.tileSize, this.tileSize)) {
            return true
          }
        }
      }
    }

    return false
  }

  /**
   * Check if a circle overlaps a rectangle
   */
  private circleRectCollision(
    circlePos: Vector2,
    radius: number,
    rectX: number,
    rectY: number,
    rectWidth: number,
    rectHeight: number
  ): boolean {
    // Find the closest point on the rectangle to the circle center
    const closestX = Math.max(rectX, Math.min(circlePos.x, rectX + rectWidth))
    const closestY = Math.max(rectY, Math.min(circlePos.y, rectY + rectHeight))

    // Calculate distance from circle center to closest point
    const dx = circlePos.x - closestX
    const dy = circlePos.y - closestY
    const distanceSquared = dx * dx + dy * dy

    return distanceSquared < radius * radius
  }

  /**
   * Get all solid tiles as rectangles for collision detection
   */
  getSolidTiles(): Array<{ x: number; y: number; width: number; height: number }> {
    if (!this.map) return []

    const solids: Array<{ x: number; y: number; width: number; height: number }> = []

    for (let y = 0; y < this.map.height; y++) {
      for (let x = 0; x < this.map.width; x++) {
        if (this.map.tiles[y][x].solid) {
          solids.push({
            x: x * this.tileSize,
            y: y * this.tileSize,
            width: this.tileSize,
            height: this.tileSize,
          })
        }
      }
    }

    return solids
  }

  /**
   * Resolve collision by pushing the position out of solid tiles
   */
  resolveCollision(position: Vector2, radius: number): Vector2 {
    if (!this.map) return position

    let resolved = { ...position }
    const { gridX, gridY } = worldToGrid(position.x, position.y, this.tileSize)

    // Check surrounding tiles
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const checkX = gridX + dx
        const checkY = gridY + dy

        // Handle out of bounds
        if (!isInBounds(checkX, checkY, this.map.width, this.map.height)) {
          resolved = this.pushOutOfRect(
            resolved,
            radius,
            checkX * this.tileSize,
            checkY * this.tileSize,
            this.tileSize,
            this.tileSize
          )
          continue
        }

        const tile = this.map.tiles[checkY]?.[checkX]
        if (tile?.solid) {
          resolved = this.pushOutOfRect(
            resolved,
            radius,
            checkX * this.tileSize,
            checkY * this.tileSize,
            this.tileSize,
            this.tileSize
          )
        }
      }
    }

    return resolved
  }

  /**
   * Push a circle out of a rectangle
   */
  private pushOutOfRect(
    circlePos: Vector2,
    radius: number,
    rectX: number,
    rectY: number,
    rectWidth: number,
    rectHeight: number
  ): Vector2 {
    // Find closest point on rectangle
    const closestX = Math.max(rectX, Math.min(circlePos.x, rectX + rectWidth))
    const closestY = Math.max(rectY, Math.min(circlePos.y, rectY + rectHeight))

    const dx = circlePos.x - closestX
    const dy = circlePos.y - closestY
    const distanceSquared = dx * dx + dy * dy

    if (distanceSquared >= radius * radius) {
      return circlePos // No collision
    }

    const distance = Math.sqrt(distanceSquared)
    if (distance === 0) {
      // Circle center is inside rectangle, push out in nearest direction
      const centerX = rectX + rectWidth / 2
      const centerY = rectY + rectHeight / 2
      const pushX = circlePos.x - centerX
      const pushY = circlePos.y - centerY
      const pushDist = Math.sqrt(pushX * pushX + pushY * pushY)
      if (pushDist === 0) {
        return { x: circlePos.x + radius, y: circlePos.y }
      }
      return {
        x: circlePos.x + (pushX / pushDist) * radius,
        y: circlePos.y + (pushY / pushDist) * radius,
      }
    }

    // Push circle out along the collision normal
    const overlap = radius - distance
    return {
      x: circlePos.x + (dx / distance) * overlap,
      y: circlePos.y + (dy / distance) * overlap,
    }
  }
}
