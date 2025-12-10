/**
 * TileRenderer - Renders tileset-based terrain on the game canvas
 * 
 * Handles:
 * - Drawing floor tiles from loaded tilesets
 * - 9-slice rendering for walls and water
 * - Multi-layer rendering (floor → props → obstacles → hazards)
 * - Animated tile support (future)
 * - Tile variation for visual interest
 * 
 * @module terrain/TileRenderer
 */

import { tilesetLoader, GRASS_TILES, SCIFI_TILES, WATER_TILES, WALL_TILES, BUSH_TILES, BOX_TILES, BORDER_TILES } from './TilesetLoader'
import type { Tile } from './TilesetLoader'
import type { TileType } from '../arena/types'
import type { ArenaMap } from './IndustrialArenaMap'

// ============================================================================
// Types
// ============================================================================

/**
 * Tile map cell - defines what tile to render at each position
 */
export interface TileMapCell {
  /** Tileset ID to use */
  tilesetId: string
  /** Tile index within the tileset */
  tileIndex: number
  /** Optional rotation in degrees (0, 90, 180, 270) */
  rotation?: number
  /** Optional flip horizontal */
  flipX?: boolean
  /** Optional flip vertical */
  flipY?: boolean
}

/**
 * A complete tile map for rendering
 */
export interface TileMap {
  /** Grid of tile cells (row-major order) */
  cells: (TileMapCell | null)[][]
  /** Width in tiles */
  width: number
  /** Height in tiles */
  height: number
  /** Tile size in pixels */
  tileSize: number
}

/**
 * Theme configuration for tile rendering
 */
export interface TileTheme {
  /** Floor tileset ID */
  floor: string
  /** Wall tileset ID */
  wall: string
  /** Hazard tileset ID (optional) */
  hazard?: string
  /** Water tileset ID (optional) */
  water?: string
  /** Bush tileset ID (optional) */
  bush?: string
  /** Destructible object tileset ID */
  destructible?: string
}

// ============================================================================
// Pre-defined Themes
// ============================================================================

export const TILE_THEMES: Record<string, TileTheme> = {
  // Space/Sci-fi theme (matches current game)
  space: {
    floor: 'scifi-floor',
    wall: 'tile',
    destructible: 'box',
    bush: 'bush',
  },
  
  // Nature/Grass theme (Brawl Stars style)
  nature: {
    floor: 'grass',
    wall: 'tile',
    water: 'water',
    bush: 'bush',
    destructible: 'box',
  },
  
  // Mixed theme (sci-fi with nature elements)
  mixed: {
    floor: 'scifi-floor',
    wall: 'tile',
    water: 'water',
    bush: 'bush',
    destructible: 'box',
  },
}

// ============================================================================
// TileRenderer Class
// ============================================================================

/**
 * Renders tile-based terrain
 */
export class TileRenderer {
  private ctx: CanvasRenderingContext2D
  private tileSize: number
  private theme: TileTheme
  private ready = false
  
  // Cached tile map for the current arena
  private tileMap: TileMap | null = null
  
  // Seeded random for consistent tile variation
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

  /**
   * Check if renderer is ready
   */
  isReady(): boolean {
    return this.ready
  }

  /**
   * Set the theme
   */
  setTheme(theme: TileTheme): void {
    this.theme = theme
    this.ready = false // Need to reload tilesets
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

  /**
   * Get the appropriate tile cell for a tile type
   */
  private getTileCellForType(
    type: TileType,
    x: number,
    y: number,
    tiles: { type: TileType }[][]
  ): TileMapCell | null {
    switch (type) {
      case 'floor':
        return this.getFloorTile(x, y)
      
      case 'wall':
      case 'half_wall':
        return this.getWallTile(x, y, tiles)
      
      case 'hazard_damage':
      case 'hazard_slow':
      case 'hazard_emp':
        return this.getHazardTile(type, x, y)
      
      case 'teleporter':
        return this.getTeleporterTile(x, y)
      
      case 'jump_pad':
        return this.getJumpPadTile(x, y)
      
      default:
        return this.getFloorTile(x, y)
    }
  }

  /**
   * Get a floor tile with variation
   */
  private getFloorTile(x: number, y: number): TileMapCell {
    const tilesetId = this.theme.floor
    
    // Use seeded random for consistent variation
    const hash = this.hashPosition(x, y)
    
    if (tilesetId === 'scifi-floor') {
      // Mostly plain metal, occasional circuit/accent tiles
      const variation = hash % 100
      let tileIndex: number
      
      if (variation < 60) {
        // Plain metal variants
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
      // Grass with occasional flowers/dirt/stones
      const variation = hash % 100
      let tileIndex: number
      
      if (variation < 50) {
        // Plain grass variants
        tileIndex = GRASS_TILES.PLAIN_1 + (hash % 4)
      } else if (variation < 70) {
        // Flowers
        tileIndex = GRASS_TILES.FLOWERS_YELLOW + (hash % 4)
      } else if (variation < 85) {
        // Dirt patches
        tileIndex = GRASS_TILES.DIRT_1 + (hash % 4)
      } else {
        // Stones
        tileIndex = GRASS_TILES.STONES_1 + (hash % 4)
      }
      
      return { tilesetId, tileIndex }
    }
    
    return { tilesetId, tileIndex: 0 }
  }

  /**
   * Get a wall tile using 9-slice based on neighbors
   */
  private getWallTile(x: number, y: number, tiles: { type: TileType }[][]): TileMapCell {
    const tilesetId = this.theme.wall
    
    // Check neighbors to determine which 9-slice piece to use
    const hasTop = this.isWall(tiles, x, y - 1)
    const hasBottom = this.isWall(tiles, x, y + 1)
    const hasLeft = this.isWall(tiles, x - 1, y)
    const hasRight = this.isWall(tiles, x + 1, y)
    
    let tileIndex: number
    
    // Determine 9-slice position
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
   * Check if a position is a wall
   */
  private isWall(tiles: { type: TileType }[][], x: number, y: number): boolean {
    const tile = tiles[y]?.[x]
    return tile?.type === 'wall' || tile?.type === 'half_wall'
  }

  /**
   * Get a hazard tile
   */
  private getHazardTile(type: TileType, _x: number, _y: number): TileMapCell {
    const tilesetId = this.theme.floor // Use floor tileset with hazard variants
    
    if (tilesetId === 'scifi-floor') {
      // Use hazard stripe tiles for damage zones
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
  private getTeleporterTile(_x: number, _y: number): TileMapCell {
    if (this.theme.floor === 'scifi-floor') {
      return { tilesetId: 'scifi-floor', tileIndex: SCIFI_TILES.TELEPORTER }
    }
    return { tilesetId: this.theme.floor, tileIndex: 0 }
  }

  /**
   * Get a jump pad tile
   */
  private getJumpPadTile(_x: number, _y: number): TileMapCell {
    if (this.theme.floor === 'scifi-floor') {
      return { tilesetId: 'scifi-floor', tileIndex: SCIFI_TILES.VENT_CYAN }
    }
    return { tilesetId: this.theme.floor, tileIndex: 0 }
  }

  /**
   * Simple hash function for position-based variation
   */
  private hashPosition(x: number, y: number): number {
    const h = (x * 374761393 + y * 668265263 + this.seed) | 0
    return Math.abs(((h ^ (h >> 13)) * 1274126177) | 0)
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

  /**
   * Draw a single tile at a position
   */
  private drawTile(
    tile: Tile,
    x: number,
    y: number,
    size: number,
    cell: TileMapCell
  ): void {
    this.ctx.save()

    // Apply transformations if needed
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

  /**
   * Draw a bush at a specific position (for hiding spots)
   */
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

  /**
   * Draw a destructible box at a specific position with damage state
   */
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

  /**
   * Draw water using 9-slice at a specific area
   */
  drawWater(startX: number, startY: number, width: number, height: number): void {
    if (!this.theme.water) return
    
    const ts = this.tileSize
    const cols = Math.ceil(width / ts)
    const rows = Math.ceil(height / ts)
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let tileIndex: number
        
        // Determine 9-slice position
        const isTop = row === 0
        const isBottom = row === rows - 1
        const isLeft = col === 0
        const isRight = col === cols - 1
        
        if (isTop && isLeft) tileIndex = WATER_TILES.TOP_LEFT
        else if (isTop && isRight) tileIndex = WATER_TILES.TOP_RIGHT
        else if (isBottom && isLeft) tileIndex = WATER_TILES.BOTTOM_LEFT
        else if (isBottom && isRight) tileIndex = WATER_TILES.BOTTOM_RIGHT
        else if (isTop) tileIndex = WATER_TILES.TOP
        else if (isBottom) tileIndex = WATER_TILES.BOTTOM
        else if (isLeft) tileIndex = WATER_TILES.LEFT
        else if (isRight) tileIndex = WATER_TILES.RIGHT
        else tileIndex = WATER_TILES.CENTER
        
        const tile = tilesetLoader.getTile(this.theme.water, tileIndex)
        if (tile) {
          this.ctx.drawImage(tile.canvas, startX + col * ts, startY + row * ts, ts, ts)
        }
      }
    }
  }

  // ============================================================================
  // Industrial Arena Map Rendering
  // ============================================================================

  /**
   * Render an ArenaMap with multi-layer support
   * Renders in order: floor → props → obstacles → hazards → border
   */
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
    
    // Layer 2: Props (decorative, non-blocking)
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
    
    // Layer 3: Obstacles (blocking)
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
    
    // Layer 4: Hazards (damaging zones and pickups)
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

  /**
   * Render the arena border using 9-slice chain-link fence
   */
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
    
    // Left edge (excluding corners)
    for (let row = 0; row < rows; row++) {
      const tile = tilesetLoader.getTile('arena-border', BORDER_TILES.LEFT)
      if (tile) {
        this.ctx.drawImage(tile.canvas, offsetX - ts, offsetY + row * ts, ts, ts)
      }
    }
    
    // Right edge (excluding corners)
    for (let row = 0; row < rows; row++) {
      const tile = tilesetLoader.getTile('arena-border', BORDER_TILES.RIGHT)
      if (tile) {
        this.ctx.drawImage(tile.canvas, offsetX + width, offsetY + row * ts, ts, ts)
      }
    }
  }

  /**
   * Initialize renderer for industrial arena map
   * Loads all required tilesets
   */
  async initializeForArenaMap(map: ArenaMap): Promise<void> {
    await tilesetLoader.preloadAll(map.tilesets)
    this.ready = true
  }
}

// ============================================================================
// Industrial Arena Renderer (Standalone)
// ============================================================================

/**
 * Standalone renderer for industrial arena maps
 * Use this when you want to render the new industrial map format
 */
export class IndustrialArenaRenderer {
  private ctx: CanvasRenderingContext2D
  private tileSize: number
  private ready = false
  private map: ArenaMap | null = null

  constructor(ctx: CanvasRenderingContext2D, tileSize = 80) {
    this.ctx = ctx
    this.tileSize = tileSize
  }

  /**
   * Load and prepare a map for rendering
   */
  async loadMap(map: ArenaMap): Promise<void> {
    this.map = map
    await tilesetLoader.preloadAll(map.tilesets)
    this.ready = true
    console.log(`[IndustrialArenaRenderer] Loaded map: ${map.name} (${map.width}x${map.height})`)
    console.log(`[IndustrialArenaRenderer] Tile size: ${this.tileSize}px`)
    console.log(`[IndustrialArenaRenderer] Total arena size: ${map.width * this.tileSize}x${map.height * this.tileSize}px`)
    
    // Debug: Check if all floor tiles are available
    const floorTileset = tilesetLoader.isLoaded('floor-tiles')
    console.log(`[IndustrialArenaRenderer] floor-tiles loaded: ${floorTileset}`)
    
    // Check a few specific tiles
    for (let i = 0; i < 16; i++) {
      const tile = tilesetLoader.getTile('floor-tiles', i)
      console.log(`[IndustrialArenaRenderer] floor-tiles[${i}]: ${tile ? `${tile.canvas.width}x${tile.canvas.height}` : 'NULL'}`)
    }
  }

  /**
   * Check if renderer is ready
   */
  isReady(): boolean {
    return this.ready && this.map !== null
  }

  /**
   * Get the current map
   */
  getMap(): ArenaMap | null {
    return this.map
  }

  /**
   * Get tile size
   */
  getTileSize(): number {
    return this.tileSize
  }

  /**
   * Set tile size
   */
  setTileSize(size: number): void {
    this.tileSize = size
  }

  /**
   * Render the complete map
   * Uses Math.floor for pixel-perfect positioning to avoid sub-pixel gaps
   * Fills solid background first to prevent backdrop bleeding through
   * 
   * IMPORTANT: The floor-tiles.jpg sprite sheet has tiles with transparency baked in
   * (checkered pattern). We must fill each cell with a solid color BEFORE drawing
   * the tile to prevent the backdrop from bleeding through.
   */
  render(offsetX = 0, offsetY = 0): void {
    if (!this.ready || !this.map) return
    
    const ts = this.tileSize
    const map = this.map
    
    // Use integer offsets to avoid sub-pixel rendering issues
    const ox = Math.floor(offsetX)
    const oy = Math.floor(offsetY)
    
    // Layer 0: Fill ENTIRE arena with solid dark gray first
    // This is the base layer that prevents ANY backdrop bleeding
    this.ctx.fillStyle = '#3d3d3d'
    this.ctx.fillRect(ox, oy, map.width * ts, map.height * ts)
    
    // Layer 1: Floor tiles with per-tile background fill
    // The sprite sheet has transparency baked in, so we MUST fill each cell
    // with a color that matches the expected tile appearance
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const mapTile = map.tiles[y]?.[x]
        if (!mapTile) continue
        
        const drawX = Math.floor(ox + x * ts)
        const drawY = Math.floor(oy + y * ts)
        
        // Choose background color based on tile type for better visual consistency
        // This fills the transparent areas of the tile with an appropriate color
        const bgColor = this.getTileBackgroundColor(mapTile.floor)
        this.ctx.fillStyle = bgColor
        this.ctx.fillRect(drawX, drawY, ts, ts)
        
        const tile = tilesetLoader.getTile('floor-tiles', mapTile.floor)
        if (tile) {
          this.ctx.drawImage(tile.canvas, drawX, drawY, ts, ts)
        }
      }
    }
    
    // Layer 2: Props (decorative)
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const mapTile = map.tiles[y]?.[x]
        if (!mapTile?.prop) continue
        
        const tile = tilesetLoader.getTile('prop-tiles', mapTile.prop)
        if (tile) {
          const drawX = Math.floor(ox + x * ts)
          const drawY = Math.floor(oy + y * ts)
          this.ctx.drawImage(tile.canvas, drawX, drawY, ts, ts)
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
          const drawX = Math.floor(ox + x * ts)
          const drawY = Math.floor(oy + y * ts)
          this.ctx.drawImage(tile.canvas, drawX, drawY, ts, ts)
        }
      }
    }
    
    // Layer 4: Hazards and pickups
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const mapTile = map.tiles[y]?.[x]
        if (mapTile?.hazard === undefined) continue
        
        const tile = tilesetLoader.getTile('hazard-tiles', mapTile.hazard)
        if (tile) {
          const drawX = Math.floor(ox + x * ts)
          const drawY = Math.floor(oy + y * ts)
          this.ctx.drawImage(tile.canvas, drawX, drawY, ts, ts)
        }
      }
    }
  }

  /**
   * Render the border around the arena
   */
  renderBorder(offsetX = 0, offsetY = 0): void {
    if (!this.ready || !this.map) return
    
    const ts = this.tileSize
    const width = this.map.width * ts
    const height = this.map.height * ts
    const cols = this.map.width
    const rows = this.map.height
    
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

  /**
   * Check if a world position is walkable
   */
  isWalkable(worldX: number, worldY: number): boolean {
    if (!this.map) return false
    
    const tileX = Math.floor(worldX / this.tileSize)
    const tileY = Math.floor(worldY / this.tileSize)
    
    if (tileX < 0 || tileX >= this.map.width || tileY < 0 || tileY >= this.map.height) {
      return false
    }
    
    return !this.map.tiles[tileY][tileX].solid
  }

  /**
   * Get damage at a world position (0 if none)
   */
  getDamageAt(worldX: number, worldY: number): number {
    if (!this.map) return 0
    
    const tileX = Math.floor(worldX / this.tileSize)
    const tileY = Math.floor(worldY / this.tileSize)
    
    if (tileX < 0 || tileX >= this.map.width || tileY < 0 || tileY >= this.map.height) {
      return 0
    }
    
    const tile = this.map.tiles[tileY][tileX]
    return tile.damaging ? (tile.damage || 0) : 0
  }

  /**
   * Get spawn position for a player
   */
  getSpawnPosition(isPlayer1: boolean): { x: number; y: number } {
    if (!this.map) {
      return isPlayer1 ? { x: 160, y: 360 } : { x: 1120, y: 360 }
    }
    
    const spawn = isPlayer1 ? this.map.spawn1 : this.map.spawn2
    return {
      x: spawn.x * this.tileSize + this.tileSize / 2,
      y: spawn.y * this.tileSize + this.tileSize / 2,
    }
  }

  /**
   * Get all solid tiles for collision detection
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
   * Get all hazard tiles for damage detection
   */
  getHazardTiles(): Array<{ x: number; y: number; width: number; height: number; damage: number }> {
    if (!this.map) return []
    
    const hazards: Array<{ x: number; y: number; width: number; height: number; damage: number }> = []
    
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
   * Get appropriate background color for a floor tile index
   * This fills transparent areas of tiles with a matching solid color
   * 
   * Floor tile indices (from FLOOR_TILES):
   * 0-3: Concrete (gray)
   * 4-7: Metal (silver/brown)
   * 8-11: Tile (cream/beige)
   * 12-15: Special (dark gray)
   * 
   * NOTE: The floor-tiles.jpg has checkered transparency patterns baked into
   * some tiles. We use colors that closely match the tile content to hide
   * these patterns when they show through.
   */
  private getTileBackgroundColor(floorIndex: number): string {
    // Row 0: Concrete tiles (0-3) - match the gray concrete color closely
    if (floorIndex >= 0 && floorIndex <= 3) {
      // Use a gray that matches the concrete tiles in the sprite sheet
      return '#7a7a7a'
    }
    // Row 1: Metal tiles (4-7)
    if (floorIndex >= 4 && floorIndex <= 7) {
      // Metal diamond (4) = silver, Metal rusted (5) = brown, Grate (6-7) = dark
      if (floorIndex === 4) return '#8a8a8a' // Silver metal
      if (floorIndex === 5) return '#6b4423' // Rusted brown
      return '#4a4a4a' // Dark for grates
    }
    // Row 2: Tile tiles (8-11) - cream/beige
    if (floorIndex >= 8 && floorIndex <= 11) {
      return '#c4b8a8' // Cream/beige for white tiles
    }
    // Row 3: Special tiles (12-15) - dark gray
    return '#4a4a4a'
  }
}
