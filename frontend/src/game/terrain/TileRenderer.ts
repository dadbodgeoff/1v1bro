/**
 * TileRenderer - Renders tileset-based terrain on the game canvas
 * 
 * Handles:
 * - Drawing floor tiles from loaded tilesets
 * - 9-slice rendering for walls and water
 * - Multi-layer rendering (floor → props → obstacles → hazards)
 * - Tile variation for visual interest
 * 
 * @module terrain/TileRenderer
 */

import { tilesetLoader, BUSH_TILES, BOX_TILES, BORDER_TILES } from './TilesetLoader'
import type { Tile } from './TilesetLoader'
import type { TileType } from '../arena/types'
import type { ArenaMap } from './IndustrialArenaMap'

// Re-export types and themes for backward compatibility
export * from './TileTypes'
export { IndustrialArenaRenderer } from './IndustrialArenaRenderer'

import type { TileMapCell, TileMap, TileTheme } from './TileTypes'
import { TILE_THEMES } from './TileTypes'
import {
  getFloorTile,
  getWallTile,
  getHazardTile,
  getTeleporterTile,
  getJumpPadTile,
  getWaterTileIndex,
} from './TileVariation'

/**
 * Renders tile-based terrain
 */
export class TileRenderer {
  private ctx: CanvasRenderingContext2D
  private tileSize: number
  private theme: TileTheme
  private ready = false
  private tileMap: TileMap | null = null
  private seed: number

  constructor(ctx: CanvasRenderingContext2D, tileSize = 80, theme: TileTheme = TILE_THEMES.space) {
    this.ctx = ctx
    this.tileSize = tileSize
    this.theme = theme
    this.seed = Math.random() * 10000
  }

  /**
   * Initialize the renderer by loading required tilesets
   */
  async initialize(): Promise<void> {
    const tilesetIds = [
      this.theme.floor,
      this.theme.wall,
      this.theme.hazard,
      this.theme.water,
      this.theme.bush,
      this.theme.destructible,
    ].filter((id): id is string => !!id)

    await tilesetLoader.preloadAll(tilesetIds)
    this.ready = true
  }

  isReady(): boolean {
    return this.ready
  }

  setTheme(theme: TileTheme): void {
    this.theme = theme
    this.ready = false
  }

  /**
   * Generate a tile map from the arena's tile grid
   */
  generateTileMap(tiles: { type: TileType }[][], width: number, height: number): TileMap {
    const cells: (TileMapCell | null)[][] = []

    for (let y = 0; y < height; y++) {
      const row: (TileMapCell | null)[] = []
      for (let x = 0; x < width; x++) {
        const tile = tiles[y]?.[x]
        if (!tile) {
          row.push(null)
          continue
        }
        const cell = this.getTileCellForType(tile.type, x, y, tiles)
        row.push(cell)
      }
      cells.push(row)
    }

    this.tileMap = { cells, width, height, tileSize: this.tileSize }
    return this.tileMap
  }

  private getTileCellForType(
    type: TileType,
    x: number,
    y: number,
    tiles: { type: TileType }[][]
  ): TileMapCell | null {
    switch (type) {
      case 'floor':
        return getFloorTile(x, y, this.theme, this.seed)
      case 'wall':
      case 'half_wall':
        return getWallTile(x, y, tiles, this.theme)
      case 'hazard_damage':
      case 'hazard_slow':
      case 'hazard_emp':
        return getHazardTile(type, this.theme)
      case 'teleporter':
        return getTeleporterTile(this.theme)
      case 'jump_pad':
        return getJumpPadTile(this.theme)
      default:
        return getFloorTile(x, y, this.theme, this.seed)
    }
  }

  /**
   * Render the tile map to the canvas
   */
  render(): void {
    if (!this.ready || !this.tileMap) return

    const { cells, width, height, tileSize } = this.tileMap

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = cells[y]?.[x]
        if (!cell) continue

        const tile = tilesetLoader.getTile(cell.tilesetId, cell.tileIndex)
        if (!tile) continue

        this.drawTile(tile, x * tileSize, y * tileSize, tileSize, cell)
      }
    }
  }

  private drawTile(tile: Tile, x: number, y: number, size: number, cell: TileMapCell): void {
    this.ctx.save()

    if (cell.rotation || cell.flipX || cell.flipY) {
      this.ctx.translate(x + size / 2, y + size / 2)
      if (cell.rotation) {
        this.ctx.rotate((cell.rotation * Math.PI) / 180)
      }
      if (cell.flipX) this.ctx.scale(-1, 1)
      if (cell.flipY) this.ctx.scale(1, -1)
      this.ctx.translate(-size / 2, -size / 2)
      this.ctx.drawImage(tile.canvas, 0, 0, size, size)
    } else {
      this.ctx.drawImage(tile.canvas, x, y, size, size)
    }

    this.ctx.restore()
  }

  drawBush(x: number, y: number, size: 'small' | 'medium' | 'large' | 'extra_large' = 'medium'): void {
    if (!this.theme.bush) return
    
    const sizeMap = {
      small: BUSH_TILES.SMALL,
      medium: BUSH_TILES.MEDIUM,
      large: BUSH_TILES.LARGE,
      extra_large: BUSH_TILES.EXTRA_LARGE,
    }
    
    const tile = tilesetLoader.getTile(this.theme.bush, sizeMap[size])
    if (!tile) return
    
    this.ctx.drawImage(tile.canvas, x, y, this.tileSize, this.tileSize)
  }

  drawBox(x: number, y: number, healthPercent: number): void {
    if (!this.theme.destructible) return
    
    let tileIndex: number
    if (healthPercent > 75) {
      tileIndex = BOX_TILES.INTACT
    } else if (healthPercent > 50) {
      tileIndex = BOX_TILES.DAMAGED
    } else if (healthPercent > 0) {
      tileIndex = BOX_TILES.BREAKING
    } else {
      tileIndex = BOX_TILES.DEBRIS
    }
    
    const tile = tilesetLoader.getTile(this.theme.destructible, tileIndex)
    if (!tile) return
    
    this.ctx.drawImage(tile.canvas, x, y, this.tileSize, this.tileSize)
  }

  drawWater(startX: number, startY: number, width: number, height: number): void {
    if (!this.theme.water) return
    
    const ts = this.tileSize
    const cols = Math.ceil(width / ts)
    const rows = Math.ceil(height / ts)
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const tileIndex = getWaterTileIndex(row, col, rows, cols)
        const tile = tilesetLoader.getTile(this.theme.water, tileIndex)
        if (tile) {
          this.ctx.drawImage(tile.canvas, startX + col * ts, startY + row * ts, ts, ts)
        }
      }
    }
  }

  renderArenaMap(map: ArenaMap, offsetX = 0, offsetY = 0): void {
    const ts = this.tileSize
    
    // Layer 1: Floor tiles
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const mapTile = map.tiles[y]?.[x]
        if (!mapTile) continue
        
        const tile = tilesetLoader.getTile('floor-tiles', mapTile.floor)
        if (tile) {
          this.ctx.drawImage(tile.canvas, offsetX + x * ts, offsetY + y * ts, ts, ts)
        }
      }
    }
    
    // Layer 2: Props
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const mapTile = map.tiles[y]?.[x]
        if (!mapTile?.prop) continue
        
        const tile = tilesetLoader.getTile('prop-tiles', mapTile.prop)
        if (tile) {
          this.ctx.drawImage(tile.canvas, offsetX + x * ts, offsetY + y * ts, ts, ts)
        }
      }
    }
    
    // Layer 3: Obstacles
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const mapTile = map.tiles[y]?.[x]
        if (!mapTile?.obstacle) continue
        
        const tile = tilesetLoader.getTile('cover-tiles', mapTile.obstacle)
        if (tile) {
          this.ctx.drawImage(tile.canvas, offsetX + x * ts, offsetY + y * ts, ts, ts)
        }
      }
    }
    
    // Layer 4: Hazards
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const mapTile = map.tiles[y]?.[x]
        if (mapTile?.hazard === undefined) continue
        
        const tile = tilesetLoader.getTile('hazard-tiles', mapTile.hazard)
        if (tile) {
          this.ctx.drawImage(tile.canvas, offsetX + x * ts, offsetY + y * ts, ts, ts)
        }
      }
    }
  }

  renderArenaBorder(width: number, height: number, offsetX = 0, offsetY = 0): void {
    const ts = this.tileSize
    const cols = Math.ceil(width / ts)
    const rows = Math.ceil(height / ts)
    
    // Top edge
    for (let col = 0; col < cols; col++) {
      let tileIndex: number
      if (col === 0) tileIndex = BORDER_TILES.TOP_LEFT
      else if (col === cols - 1) tileIndex = BORDER_TILES.TOP_RIGHT
      else tileIndex = BORDER_TILES.TOP
      
      const tile = tilesetLoader.getTile('arena-border', tileIndex)
      if (tile) {
        this.ctx.drawImage(tile.canvas, offsetX + col * ts, offsetY - ts, ts, ts)
      }
    }
    
    // Bottom edge
    for (let col = 0; col < cols; col++) {
      let tileIndex: number
      if (col === 0) tileIndex = BORDER_TILES.BOTTOM_LEFT
      else if (col === cols - 1) tileIndex = BORDER_TILES.BOTTOM_RIGHT
      else tileIndex = BORDER_TILES.BOTTOM
      
      const tile = tilesetLoader.getTile('arena-border', tileIndex)
      if (tile) {
        this.ctx.drawImage(tile.canvas, offsetX + col * ts, offsetY + height, ts, ts)
      }
    }
    
    // Left edge
    for (let row = 0; row < rows; row++) {
      const tile = tilesetLoader.getTile('arena-border', BORDER_TILES.LEFT)
      if (tile) {
        this.ctx.drawImage(tile.canvas, offsetX - ts, offsetY + row * ts, ts, ts)
      }
    }
    
    // Right edge
    for (let row = 0; row < rows; row++) {
      const tile = tilesetLoader.getTile('arena-border', BORDER_TILES.RIGHT)
      if (tile) {
        this.ctx.drawImage(tile.canvas, offsetX + width, offsetY + row * ts, ts, ts)
      }
    }
  }

  async initializeForArenaMap(map: ArenaMap): Promise<void> {
    await tilesetLoader.preloadAll(map.tilesets)
    this.ready = true
  }
}
