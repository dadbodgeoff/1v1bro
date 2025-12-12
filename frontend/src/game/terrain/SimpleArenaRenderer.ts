/**
 * SimpleArenaRenderer - Multi-tile grass floor renderer for Simple Arena
 *
 * Renders a 16x9 grid (144 tiles) using 3 grass tile variants with weighted
 * random distribution for a natural-looking grass field.
 *
 * Tile variants:
 * - Base grass (70%) - Most common, medium tone
 * - Dark grass (15%) - Shadows, edges, variety
 * - Light grass (15%) - Highlights, variety
 *
 * @module terrain/SimpleArenaRenderer
 */

import { BaseRenderer } from '../renderers/BaseRenderer'
import { ARENA_SIZE, GRID_SIZE } from '../config'
import { PropRenderer } from '../props/PropRenderer'
import { SIMPLE_ARENA_PROPS } from '../config/maps/simple-arena'
import { getPreloadedImage } from '../assets/MapPreloader'

// Grass tile URLs (80x80, need center crop extraction)
export const GRASS_TILE_URLS = {
  base: 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets/grass%20(1).jpeg',
  dark: 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets/image2.jpeg',
  light: 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets/image3.jpeg',
}

// Wall tile URL (horizontal stone wall segment)
const WALL_TILE_URL =
  'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets/wallbarrier.jpg'

// Wall dimensions - the wall is a thin horizontal bar in the source image
// We extract just the stone portion and render as border strips
const WALL_THICKNESS = 20 // How thick the wall border should be in pixels

// Wall crop settings - extract the horizontal stone bar from center of image
// The source image has checkered background above/below the stone bar
const WALL_CROP_Y_PERCENT = 0.35 // Start at 35% from top (skip checkered area)
const WALL_CROP_HEIGHT_PERCENT = 0.30 // Take 30% of height (just the stone bar)

// Tile variant type
type TileVariant = 0 | 1 | 2
const TILE_BASE: TileVariant = 0
const TILE_DARK: TileVariant = 1
const TILE_LIGHT: TileVariant = 2

// Rotation values (0, 90, 180, 270 degrees)
type TileRotation = 0 | 1 | 2 | 3

// Grid dimensions (standard 16x9)
const COLS = 16
const ROWS = 9

// Tile size (standard 80px)
const TILE_SIZE = GRID_SIZE

// Grass crop percentage (how much of center to extract)
const GRASS_CROP_PERCENT = 0.45

// Seeded random for consistent pattern
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
}

export class SimpleArenaRenderer extends BaseRenderer {
  private grassTiles: Map<TileVariant, HTMLCanvasElement> = new Map()
  private wallTileH: HTMLCanvasElement | null = null // Horizontal wall strip
  private wallTileV: HTMLCanvasElement | null = null // Vertical wall strip (rotated)
  private cornerTile: HTMLCanvasElement | null = null // Corner piece
  private propRenderer: PropRenderer = new PropRenderer() // Prop rendering
  private tilesLoaded = false
  private loadingPromise: Promise<void> | null = null
  private showGrid = false
  private showWalls = true // Enable wall borders
  private showProps = true // Enable prop rendering
  private tileMap: TileVariant[][] = []
  private rotationMap: TileRotation[][] = []

  constructor() {
    super()
    // Generate tile map on construction (consistent pattern)
    this.generateTileMap()
  }

  /**
   * Generate the tile map - UNIFORM floor with minimal variation
   * 
   * Principal Engineer Rule: "The floor should be boring so the obstacles pop."
   * - 95% base grass (uniform)
   * - 5% subtle rotation variation (same tile, different angle)
   * - NO checkerboard pattern
   */
  private generateTileMap(): void {
    const random = seededRandom(42) // Fixed seed for consistency
    this.tileMap = []
    this.rotationMap = []

    for (let row = 0; row < ROWS; row++) {
      const rowTiles: TileVariant[] = []
      const rowRotations: TileRotation[] = []
      for (let col = 0; col < COLS; col++) {
        // 95% base grass - uniform floor
        rowTiles.push(TILE_BASE)
        // Subtle rotation variation (same tile, different angle) for texture
        const rotation = this.pickRotation(random())
        rowRotations.push(rotation)
      }
      this.tileMap.push(rowTiles)
      this.rotationMap.push(rowRotations)
    }
  }

  /**
   * Pick a random rotation (0°, 90°, 180°, 270°)
   */
  private pickRotation(rand: number): TileRotation {
    return Math.floor(rand * 4) as TileRotation
  }

  /**
   * Load all grass tile images with background removal
   */
  async loadTiles(): Promise<void> {
    if (this.tilesLoaded) return
    if (this.loadingPromise) return this.loadingPromise

    this.loadingPromise = (async () => {
      console.log('[SimpleArenaRenderer] Loading grass tiles with background removal...')

      try {
        // Load all 3 tiles in parallel
        // Note: These grass tiles don't need background removal - they're solid textures
        // The checkered pattern in the source images is just the AI preview, 
        // but the actual grass area should fill the entire tile
        const [baseImg, darkImg, lightImg] = await Promise.all([
          this.loadImage(GRASS_TILE_URLS.base),
          this.loadImage(GRASS_TILE_URLS.dark),
          this.loadImage(GRASS_TILE_URLS.light),
        ])

        // Extract just the grass portion from center of each image
        // (source images have checkered borders around the grass)
        const baseCanvas = this.extractGrassFromImage(baseImg)
        const darkCanvas = this.extractGrassFromImage(darkImg)
        const lightCanvas = this.extractGrassFromImage(lightImg)

        this.grassTiles.set(TILE_BASE, baseCanvas)
        this.grassTiles.set(TILE_DARK, darkCanvas)
        this.grassTiles.set(TILE_LIGHT, lightCanvas)

        // Load wall tile and extract horizontal/vertical strips + corner
        const wallImg = await this.loadImage(WALL_TILE_URL)
        const wallStrips = this.extractWallStrip(wallImg)
        this.wallTileH = wallStrips.horizontal
        this.wallTileV = wallStrips.vertical
        this.cornerTile = wallStrips.corner

        // Load props
        await this.propRenderer.loadProps(SIMPLE_ARENA_PROPS)

        this.tilesLoaded = true
        console.log('[SimpleArenaRenderer] All tiles loaded successfully (grass + walls + props)')
      } catch (error) {
        console.error('[SimpleArenaRenderer] Failed to load tiles:', error)
        throw error
      }
    })()

    return this.loadingPromise
  }

  /**
   * Load an image from URL (uses preloaded cache if available)
   */
  private loadImage(src: string): Promise<HTMLImageElement> {
    // Check preload cache first for instant loading
    const preloaded = getPreloadedImage(src)
    if (preloaded) {
      return Promise.resolve(preloaded)
    }

    // Fall back to loading on demand
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Failed to load: ${src}`))
      img.src = src
    })
  }

  /**
   * Extract the grass portion from the center of the image
   * The source images have checkered borders - we need to crop to just the grass
   */
  private extractGrassFromImage(img: HTMLImageElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    // Output size is 80x80 (our tile size)
    canvas.width = TILE_SIZE
    canvas.height = TILE_SIZE
    const ctx = canvas.getContext('2d')!

    // The grass is in the center of the image
    // Source images appear to be ~1024x1024 with grass in center ~400x400 area
    // We need to find and extract just the grass portion
    const imgSize = Math.min(img.width, img.height)
    
    // Estimate grass area - extract center portion
    const grassSize = imgSize * GRASS_CROP_PERCENT
    const offsetX = (img.width - grassSize) / 2
    const offsetY = (img.height - grassSize) / 2

    // Draw the center grass portion scaled to 80x80
    ctx.drawImage(
      img,
      offsetX, offsetY, grassSize, grassSize, // Source rect (center crop)
      0, 0, TILE_SIZE, TILE_SIZE // Dest rect (full tile)
    )

    return canvas
  }

  /**
   * Extract the wall strip from the image
   * The source image has a horizontal stone bar in the middle with checkered background above/below
   * We extract just the stone portion and create horizontal, vertical, and corner versions
   */
  private extractWallStrip(img: HTMLImageElement): { 
    horizontal: HTMLCanvasElement
    vertical: HTMLCanvasElement
    corner: HTMLCanvasElement 
  } {
    const imgW = img.width
    const imgH = img.height

    // Calculate crop area - extract the horizontal stone bar from center
    const cropY = imgH * WALL_CROP_Y_PERCENT
    const cropH = imgH * WALL_CROP_HEIGHT_PERCENT
    
    // Create horizontal wall strip (full width, thin height)
    const hCanvas = document.createElement('canvas')
    hCanvas.width = TILE_SIZE
    hCanvas.height = WALL_THICKNESS
    const hCtx = hCanvas.getContext('2d')!
    
    // Draw the stone bar portion, scaled to tile width x wall thickness
    hCtx.drawImage(
      img,
      0, cropY, imgW, cropH, // Source: full width, just the stone bar
      0, 0, TILE_SIZE, WALL_THICKNESS // Dest: tile width x wall thickness
    )
    
    // Create vertical wall strip (rotated 90 degrees)
    const vCanvas = document.createElement('canvas')
    vCanvas.width = WALL_THICKNESS
    vCanvas.height = TILE_SIZE
    const vCtx = vCanvas.getContext('2d')!
    
    // Rotate and draw for vertical orientation
    vCtx.save()
    vCtx.translate(WALL_THICKNESS / 2, TILE_SIZE / 2)
    vCtx.rotate(-Math.PI / 2)
    vCtx.drawImage(
      img,
      0, cropY, imgW, cropH,
      -TILE_SIZE / 2, -WALL_THICKNESS / 2, TILE_SIZE, WALL_THICKNESS
    )
    vCtx.restore()
    
    // Create corner piece - sample a square from the stone bar
    const cCanvas = document.createElement('canvas')
    cCanvas.width = WALL_THICKNESS
    cCanvas.height = WALL_THICKNESS
    const cCtx = cCanvas.getContext('2d')!
    
    // Sample from center of the stone bar for a nice textured corner
    const cornerSrcSize = Math.min(cropH, imgW * 0.15) // Take a square portion
    const cornerSrcX = (imgW - cornerSrcSize) / 2 // Center horizontally
    const cornerSrcY = cropY + (cropH - cornerSrcSize) / 2 // Center in stone bar
    
    cCtx.drawImage(
      img,
      cornerSrcX, cornerSrcY, cornerSrcSize, cornerSrcSize,
      0, 0, WALL_THICKNESS, WALL_THICKNESS
    )
    
    return { horizontal: hCanvas, vertical: vCanvas, corner: cCanvas }
  }

  /**
   * Toggle wall visibility
   */
  setShowWalls(show: boolean): void {
    this.showWalls = show
  }

  /**
   * Toggle prop visibility
   */
  setShowProps(show: boolean): void {
    this.showProps = show
  }

  /**
   * Get the prop renderer for external access (e.g., collision checks)
   */
  getPropRenderer(): PropRenderer {
    return this.propRenderer
  }

  /**
   * Legacy method for compatibility
   */
  async loadTile(): Promise<void> {
    return this.loadTiles()
  }

  /**
   * Check if tiles are loaded
   */
  isReady(): boolean {
    return this.tilesLoaded
  }

  /**
   * Toggle grid line visibility
   */
  setShowGrid(show: boolean): void {
    this.showGrid = show
  }

  /**
   * Update animation time (for future animated effects)
   */
  update(deltaTime: number): void {
    this.animationTime += deltaTime
  }

  /**
   * Main render method - draws the grass tiles in the generated pattern
   */
  render(): void {
    if (!this.ctx) return

    // If tiles not loaded, render fallback
    if (!this.tilesLoaded) {
      this.renderFallback()
      return
    }

    const ctx = this.ctx

    ctx.save()

    // First fill with a base green color to prevent any gaps
    ctx.fillStyle = '#2d5a1e'
    ctx.fillRect(0, 0, ARENA_SIZE.width, ARENA_SIZE.height)

    // Render each tile according to the tile map with rotation
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const variant = this.tileMap[row][col]
        const rotation = this.rotationMap[row][col]
        const tile = this.grassTiles.get(variant)

        if (tile) {
          const x = col * TILE_SIZE
          const y = row * TILE_SIZE
          
          // Apply rotation around tile center
          if (rotation === 0) {
            // No rotation - direct draw
            ctx.drawImage(tile, x, y, TILE_SIZE, TILE_SIZE)
          } else {
            // Rotate tile
            const centerX = x + TILE_SIZE / 2
            const centerY = y + TILE_SIZE / 2
            const angle = (rotation * Math.PI) / 2 // 0, 90, 180, 270 degrees
            
            ctx.save()
            ctx.translate(centerX, centerY)
            ctx.rotate(angle)
            ctx.drawImage(tile, -TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE)
            ctx.restore()
          }
        }
      }
    }

    // Render props on top of floor (Y-sorted)
    if (this.showProps && this.propRenderer.isReady()) {
      this.propRenderer.setContext(ctx)
      this.propRenderer.render()
    }

    // Render wall borders AFTER props so border renders on top of grass/props at edges
    if (this.showWalls) {
      this.renderWallBorder()
    }

    // Render grid lines if enabled (on top of everything for debugging)
    if (this.showGrid) {
      this.renderGridLines()
    }

    ctx.restore()
  }

  /**
   * Render stone wall border around the arena
   * Walls are drawn as thin strips along the inner edge of the arena
   * This creates a natural border effect without requiring canvas resize
   */
  private renderWallBorder(): void {
    if (!this.ctx || !this.wallTileH || !this.wallTileV) return
    const ctx = this.ctx

    // Top wall - draw along the top edge (inside the arena)
    for (let col = 0; col < COLS; col++) {
      ctx.drawImage(this.wallTileH, col * TILE_SIZE, 0)
    }

    // Bottom wall - draw along the bottom edge
    for (let col = 0; col < COLS; col++) {
      ctx.drawImage(this.wallTileH, col * TILE_SIZE, ARENA_SIZE.height - WALL_THICKNESS)
    }

    // Left wall - draw along the left edge
    for (let row = 0; row < ROWS; row++) {
      ctx.drawImage(this.wallTileV, 0, row * TILE_SIZE)
    }

    // Right wall - draw along the right edge
    for (let row = 0; row < ROWS; row++) {
      ctx.drawImage(this.wallTileV, ARENA_SIZE.width - WALL_THICKNESS, row * TILE_SIZE)
    }

    // Corner pieces - use textured corner tile sampled from wall image
    if (this.cornerTile) {
      ctx.drawImage(this.cornerTile, 0, 0) // Top-left
      ctx.drawImage(this.cornerTile, ARENA_SIZE.width - WALL_THICKNESS, 0) // Top-right
      ctx.drawImage(this.cornerTile, 0, ARENA_SIZE.height - WALL_THICKNESS) // Bottom-left
      ctx.drawImage(this.cornerTile, ARENA_SIZE.width - WALL_THICKNESS, ARENA_SIZE.height - WALL_THICKNESS) // Bottom-right
    }
  }

  /**
   * Render fallback when tiles not loaded
   */
  private renderFallback(): void {
    if (!this.ctx) return
    const ctx = this.ctx

    ctx.save()

    // Green gradient background as fallback
    const gradient = ctx.createLinearGradient(0, 0, ARENA_SIZE.width, ARENA_SIZE.height)
    gradient.addColorStop(0, '#2d5a1e')
    gradient.addColorStop(0.5, '#3d7a2e')
    gradient.addColorStop(1, '#2d5a1e')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, ARENA_SIZE.width, ARENA_SIZE.height)

    // Loading indicator
    ctx.fillStyle = '#ffffff'
    ctx.font = '16px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('Loading grass tiles...', ARENA_SIZE.width / 2, ARENA_SIZE.height / 2)

    ctx.restore()

    if (this.showGrid) {
      this.renderGridLines()
    }
  }

  /**
   * Render grid lines
   */
  private renderGridLines(): void {
    if (!this.ctx) return
    const ctx = this.ctx

    ctx.save()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 1

    // Vertical lines
    for (let x = 0; x <= ARENA_SIZE.width; x += TILE_SIZE) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, ARENA_SIZE.height)
      ctx.stroke()
    }

    // Horizontal lines
    for (let y = 0; y <= ARENA_SIZE.height; y += TILE_SIZE) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(ARENA_SIZE.width, y)
      ctx.stroke()
    }

    ctx.restore()
  }

  /**
   * Render foreground props (grass, etc.) that should appear ABOVE players
   * Call this AFTER rendering players
   */
  renderForeground(): void {
    if (!this.ctx || !this.tilesLoaded || !this.showProps) return
    if (!this.propRenderer.isReady()) return

    this.propRenderer.setContext(this.ctx)
    this.propRenderer.renderForeground()
  }

  /**
   * Get render statistics
   */
  getStats(): {
    tilesLoaded: boolean
    tileCount: number
    arenaSize: { width: number; height: number }
    distribution: { base: number; dark: number; light: number }
  } {
    // Count tile distribution
    let base = 0,
      dark = 0,
      light = 0
    for (const row of this.tileMap) {
      for (const variant of row) {
        if (variant === TILE_BASE) base++
        else if (variant === TILE_DARK) dark++
        else light++
      }
    }

    return {
      tilesLoaded: this.tilesLoaded,
      tileCount: COLS * ROWS,
      arenaSize: ARENA_SIZE,
      distribution: { base, dark, light },
    }
  }
}
