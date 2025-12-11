/**
 * IndustrialArenaRenderer - Standalone renderer for industrial arena maps
 * 
 * Handles:
 * - Multi-layer rendering (floor → props → obstacles → hazards)
 * - 9-slice border rendering
 * - Collision and hazard detection helpers
 * - Spawn position calculation
 * 
 * @module terrain/IndustrialArenaRenderer
 */

import { tilesetLoader, BORDER_TILES } from './TilesetLoader'
import type { ArenaMap } from './IndustrialArenaMap'

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
   */
  render(offsetX = 0, offsetY = 0): void {
    if (!this.ready || !this.map) return
    
    const ts = this.tileSize
    const map = this.map
    
    // Use integer offsets to avoid sub-pixel rendering issues
    const ox = Math.floor(offsetX)
    const oy = Math.floor(offsetY)
    
    // Layer 0: Fill ENTIRE arena with solid dark gray first (darkened for enterprise look)
    this.ctx.fillStyle = '#2a2a2a'
    this.ctx.fillRect(ox, oy, map.width * ts, map.height * ts)
    
    // Layer 1: Floor tiles with per-tile background fill
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const mapTile = map.tiles[y]?.[x]
        if (!mapTile) continue
        
        const drawX = Math.floor(ox + x * ts)
        const drawY = Math.floor(oy + y * ts)
        
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
   * Darkened for better contrast with cover/walls (enterprise look)
   */
  private getTileBackgroundColor(floorIndex: number): string {
    // Row 0: Concrete tiles (0-3) - darkened
    if (floorIndex >= 0 && floorIndex <= 3) {
      return '#5a5a5a'
    }
    // Row 1: Metal tiles (4-7) - darkened
    if (floorIndex >= 4 && floorIndex <= 7) {
      if (floorIndex === 4) return '#6a6a6a'
      if (floorIndex === 5) return '#4a3018'
      return '#3a3a3a'
    }
    // Row 2: Tile tiles (8-11) - darkened
    if (floorIndex >= 8 && floorIndex <= 11) {
      return '#9a9080'
    }
    // Row 3: Special tiles (12-15)
    return '#3a3a3a'
  }

  /**
   * Render cover/obstacle highlights for better visibility
   * Called after main render to add subtle borders
   */
  renderCoverHighlights(offsetX = 0, offsetY = 0): void {
    if (!this.ready || !this.map) return
    
    const ts = this.tileSize
    const ox = Math.floor(offsetX)
    const oy = Math.floor(offsetY)
    
    this.ctx.save()
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
    this.ctx.lineWidth = 2
    
    for (let y = 0; y < this.map.height; y++) {
      for (let x = 0; x < this.map.width; x++) {
        const mapTile = this.map.tiles[y]?.[x]
        if (!mapTile?.obstacle) continue
        
        const drawX = Math.floor(ox + x * ts)
        const drawY = Math.floor(oy + y * ts)
        
        // Subtle highlight border on cover
        this.ctx.strokeRect(drawX + 1, drawY + 1, ts - 2, ts - 2)
      }
    }
    
    this.ctx.restore()
  }
}
