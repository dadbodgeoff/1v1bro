/**
 * TileMap - Tile-based map data structure
 * Manages the 16x9 tile grid for arena layouts
 * 
 * @module arena/TileMap
 */

import type { TileDefinition } from '../config/maps/map-schema'
import type { TileType, TileData, TileMapConfig } from './types'

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_TILE_SIZE = 80
const DEFAULT_GRID_WIDTH = 16
const DEFAULT_GRID_HEIGHT = 9

// ============================================================================
// TileMap Class
// ============================================================================

/**
 * TileMap manages the tile-based arena layout
 * Requirements: 1.1, 1.2, 1.5, 1.6, 1.7
 */
export class TileMap {
  private tiles: TileData[][] = []
  private width: number = DEFAULT_GRID_WIDTH
  private height: number = DEFAULT_GRID_HEIGHT
  private tileSize: number = DEFAULT_TILE_SIZE
  private cacheValid: boolean = false
  private tileTypeCache: Map<string, TileType> = new Map()

  /**
   * Get grid width in tiles
   */
  getWidth(): number {
    return this.width
  }

  /**
   * Get grid height in tiles
   */
  getHeight(): number {
    return this.height
  }

  /**
   * Get tile size in pixels
   */
  getTileSize(): number {
    return this.tileSize
  }

  /**
   * Load tiles from a tile definition grid
   * Requirements: 1.2
   * 
   * @param tileDefinitions - 2D array of tile definitions from map config
   */
  load(tileDefinitions: TileDefinition[][]): void {
    this.height = tileDefinitions.length
    this.width = tileDefinitions[0]?.length ?? 0
    this.tiles = []
    this.invalidateCache()

    for (let gridY = 0; gridY < this.height; gridY++) {
      const row: TileData[] = []
      for (let gridX = 0; gridX < this.width; gridX++) {
        const def = tileDefinitions[gridY][gridX]
        row.push({
          type: def.type,
          gridX,
          gridY,
          pixelX: gridX * this.tileSize,
          pixelY: gridY * this.tileSize,
          metadata: def.metadata
        })
      }
      this.tiles.push(row)
    }

    this.rebuildCache()
  }

  /**
   * Get tile data at grid coordinates
   * Requirements: 1.5
   * 
   * @param gridX - Grid X coordinate (0-15)
   * @param gridY - Grid Y coordinate (0-8)
   * @returns TileData or null if out of bounds
   */
  getTileAt(gridX: number, gridY: number): TileData | null {
    if (!this.isValidGridPosition(gridX, gridY)) {
      return null
    }
    return this.tiles[gridY][gridX]
  }

  /**
   * Get tile data at pixel coordinates
   * Requirements: 1.6
   * 
   * @param pixelX - Pixel X coordinate
   * @param pixelY - Pixel Y coordinate
   * @returns TileData or null if out of bounds
   */
  getTileAtPixel(pixelX: number, pixelY: number): TileData | null {
    const gridX = Math.floor(pixelX / this.tileSize)
    const gridY = Math.floor(pixelY / this.tileSize)
    return this.getTileAt(gridX, gridY)
  }

  /**
   * Get tile type at grid coordinates (cached for performance)
   * 
   * @param gridX - Grid X coordinate
   * @param gridY - Grid Y coordinate
   * @returns TileType or null if out of bounds
   */
  getTileTypeAt(gridX: number, gridY: number): TileType | null {
    const key = `${gridX},${gridY}`
    if (this.cacheValid && this.tileTypeCache.has(key)) {
      return this.tileTypeCache.get(key)!
    }
    const tile = this.getTileAt(gridX, gridY)
    return tile?.type ?? null
  }

  /**
   * Set tile type at grid coordinates
   * Requirements: 1.7
   * 
   * @param gridX - Grid X coordinate
   * @param gridY - Grid Y coordinate
   * @param type - New tile type
   * @returns true if successful, false if out of bounds
   */
  setTile(gridX: number, gridY: number, type: TileType): boolean {
    if (!this.isValidGridPosition(gridX, gridY)) {
      return false
    }

    const tile = this.tiles[gridY][gridX]
    tile.type = type
    
    // Invalidate cache for this tile
    this.tileTypeCache.set(`${gridX},${gridY}`, type)
    
    return true
  }

  /**
   * Get all tiles of a specific type
   * 
   * @param type - Tile type to find
   * @returns Array of TileData matching the type
   */
  getTilesByType(type: TileType): TileData[] {
    const result: TileData[] = []
    for (const row of this.tiles) {
      for (const tile of row) {
        if (tile.type === type) {
          result.push(tile)
        }
      }
    }
    return result
  }

  /**
   * Check if a grid position is valid
   * 
   * @param gridX - Grid X coordinate
   * @param gridY - Grid Y coordinate
   * @returns true if position is within bounds
   */
  isValidGridPosition(gridX: number, gridY: number): boolean {
    return gridX >= 0 && gridX < this.width && gridY >= 0 && gridY < this.height
  }

  /**
   * Check if a tile is walkable (floor type)
   * 
   * @param gridX - Grid X coordinate
   * @param gridY - Grid Y coordinate
   * @returns true if tile is walkable
   */
  isWalkable(gridX: number, gridY: number): boolean {
    const tile = this.getTileAt(gridX, gridY)
    if (!tile) return false
    
    // Walls and half walls block movement
    return tile.type !== 'wall' && tile.type !== 'half_wall'
  }

  /**
   * Convert pixel coordinates to grid coordinates
   * 
   * @param pixelX - Pixel X coordinate
   * @param pixelY - Pixel Y coordinate
   * @returns Grid coordinates
   */
  pixelToGrid(pixelX: number, pixelY: number): { gridX: number; gridY: number } {
    return {
      gridX: Math.floor(pixelX / this.tileSize),
      gridY: Math.floor(pixelY / this.tileSize)
    }
  }

  /**
   * Convert grid coordinates to pixel coordinates (center of tile)
   * 
   * @param gridX - Grid X coordinate
   * @param gridY - Grid Y coordinate
   * @returns Pixel coordinates at tile center
   */
  gridToPixel(gridX: number, gridY: number): { pixelX: number; pixelY: number } {
    return {
      pixelX: gridX * this.tileSize + this.tileSize / 2,
      pixelY: gridY * this.tileSize + this.tileSize / 2
    }
  }

  /**
   * Get the full tile map configuration
   * 
   * @returns TileMapConfig object
   */
  getConfig(): TileMapConfig {
    return {
      width: this.width,
      height: this.height,
      tileSize: this.tileSize,
      tiles: this.tiles
    }
  }

  /**
   * Invalidate the tile type cache
   * Requirements: 1.7
   */
  invalidateCache(): void {
    this.cacheValid = false
    this.tileTypeCache.clear()
  }

  /**
   * Rebuild the tile type cache
   */
  private rebuildCache(): void {
    this.tileTypeCache.clear()
    for (const row of this.tiles) {
      for (const tile of row) {
        this.tileTypeCache.set(`${tile.gridX},${tile.gridY}`, tile.type)
      }
    }
    this.cacheValid = true
  }
}
