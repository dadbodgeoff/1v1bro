/**
 * TilesetLoader - Loads and processes tileset sprite sheets from Supabase Storage
 * 
 * Handles:
 * - Loading tileset images from storage URLs
 * - Background removal (checkered pattern from AI-generated images)
 * - Slicing sprite sheets into individual tiles
 * - Caching loaded tilesets
 * 
 * @module terrain/TilesetLoader
 */

import { removeBackground } from '../assets/ImageProcessor'

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration for a tileset sprite sheet
 */
export interface TilesetConfig {
  /** Unique identifier for this tileset */
  id: string
  /** URL to the tileset image (Supabase Storage) */
  url: string
  /** Number of columns in the sprite sheet */
  columns: number
  /** Number of rows in the sprite sheet */
  rows: number
  /** Width of each tile in pixels */
  tileWidth: number
  /** Height of each tile in pixels */
  tileHeight: number
  /** Whether to remove background (default: true for JPEGs) */
  removeBackground?: boolean
}

/**
 * A single tile extracted from a tileset
 */
export interface Tile {
  /** Canvas containing the tile image */
  canvas: HTMLCanvasElement
  /** Index in the tileset (0-based, row-major order) */
  index: number
  /** Column position in tileset */
  col: number
  /** Row position in tileset */
  row: number
}

/**
 * A loaded tileset with all extracted tiles
 */
export interface LoadedTileset {
  /** Tileset configuration */
  config: TilesetConfig
  /** Array of extracted tiles */
  tiles: Tile[]
  /** Total number of tiles */
  tileCount: number
  /** Whether the tileset is fully loaded */
  loaded: boolean
}

// ============================================================================
// Tileset Definitions
// ============================================================================

/**
 * Pre-defined tileset configurations for your Supabase assets
 * These match the files you uploaded to cosmetics/tilesets/
 * 
 * NEW INDUSTRIAL TILESETS (2024):
 * - floor-tiles: 4x4 grid - concrete, metal, tile floors
 * - wall-tiles: 3x3 grid - 9-slice concrete/metal walls
 * - cover-tiles: 4x2 grid - crates, barrels, sandbags, barriers
 * - hazard-tiles: 4x2 grid - toxic, fire, electric, pickups
 * - prop-tiles: 4x2 grid - debris, decorative props
 * - arena-border: 3x3 grid - chain-link fence 9-slice
 */
export const TILESET_CONFIGS: Record<string, Omit<TilesetConfig, 'url'>> = {
  // ============================================
  // NEW INDUSTRIAL MILITARY TILESETS
  // These are JPEGs with actual content - NO background removal needed
  // ============================================
  
  // Floor tiles - 4x4 grid (concrete, metal, tile, special)
  // Auto-detect tile size from sprite sheet dimensions
  'floor-tiles': {
    id: 'floor-tiles',
    columns: 4,
    rows: 4,
    tileWidth: 0, // Auto-detect from image
    tileHeight: 0,
    removeBackground: false, // IMPORTANT: Don't remove gray floor pixels!
  },
  
  // Wall tiles - 3x3 grid (9-slice concrete walls with barbed wire)
  'wall-tiles': {
    id: 'wall-tiles',
    columns: 3,
    rows: 3,
    tileWidth: 0,
    tileHeight: 0,
    removeBackground: false,
  },
  
  // Cover/obstacle tiles - 4x2 grid (crates, barrels, sandbags, barriers)
  'cover-tiles': {
    id: 'cover-tiles',
    columns: 4,
    rows: 2,
    tileWidth: 0,
    tileHeight: 0,
    removeBackground: false,
  },
  
  // Hazard tiles - 4x2 grid (toxic, oil, fire, electric, pickups)
  'hazard-tiles': {
    id: 'hazard-tiles',
    columns: 4,
    rows: 2,
    tileWidth: 0,
    tileHeight: 0,
    removeBackground: false,
  },
  
  // Prop/debris tiles - 4x2 grid (rubble, debris, decorative)
  'prop-tiles': {
    id: 'prop-tiles',
    columns: 4,
    rows: 2,
    tileWidth: 0,
    tileHeight: 0,
    removeBackground: false,
  },
  
  // Arena border - 3x3 grid (chain-link fence 9-slice)
  'arena-border': {
    id: 'arena-border',
    columns: 3,
    rows: 3,
    tileWidth: 0,
    tileHeight: 0,
    removeBackground: false,
  },
  
  // ============================================
  // LEGACY TILESETS (kept for compatibility)
  // ============================================
  
  // Grass tiles - 4x4 grid (plain, flowers, dirt, stones)
  grass: {
    id: 'grass',
    columns: 4,
    rows: 4,
    tileWidth: 64,
    tileHeight: 64,
  },
  
  // Sci-fi floor tiles - 4x4 grid (metal panels, circuits, hazard stripes)
  'scifi-floor': {
    id: 'scifi-floor',
    columns: 4,
    rows: 4,
    tileWidth: 64,
    tileHeight: 64,
  },
  
  // Water tiles - 3x3 grid (9-slice with grass edges)
  water: {
    id: 'water',
    columns: 3,
    rows: 3,
    tileWidth: 64,
    tileHeight: 64,
  },
  
  // Bush tiles - 4x1 strip (small to large bushes)
  bush: {
    id: 'bush',
    columns: 4,
    rows: 1,
    tileWidth: 64,
    tileHeight: 64,
  },
  
  // Stone wall tiles - 3x3 grid (9-slice walls)
  tile: {
    id: 'tile',
    columns: 3,
    rows: 3,
    tileWidth: 64,
    tileHeight: 64,
  },
  
  // Destructible box - 4x1 strip (destruction sequence)
  box: {
    id: 'box',
    columns: 4,
    rows: 1,
    tileWidth: 64,
    tileHeight: 64,
  },
}

// ============================================================================
// TilesetLoader Class
// ============================================================================

/**
 * Singleton loader for tileset assets
 * Loads sprite sheets from Supabase Storage
 */
class TilesetLoaderClass {
  private cache = new Map<string, LoadedTileset>()
  private loading = new Map<string, Promise<LoadedTileset>>()
  
  // Supabase Storage base URL for tilesets
  private readonly TILESET_BASE_URL = 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets'

  /**
   * Build a storage URL for a tileset
   */
  private buildStorageUrl(filename: string): string {
    const url = `${this.TILESET_BASE_URL}/${filename}`
    console.log('[TilesetLoader] Loading from:', url)
    return url
  }

  /**
   * Load a tileset by ID
   */
  async load(tilesetId: string): Promise<LoadedTileset> {
    console.log(`[TilesetLoader] Loading tileset: ${tilesetId}`)
    
    // Check cache first
    const cached = this.cache.get(tilesetId)
    if (cached) {
      console.log(`[TilesetLoader] ${tilesetId} found in cache`)
      return cached
    }

    // Check if already loading
    const existing = this.loading.get(tilesetId)
    if (existing) {
      console.log(`[TilesetLoader] ${tilesetId} already loading, waiting...`)
      return existing
    }

    // Get config
    const baseConfig = TILESET_CONFIGS[tilesetId]
    if (!baseConfig) {
      console.error(`[TilesetLoader] Unknown tileset: ${tilesetId}`)
      throw new Error(`Unknown tileset: ${tilesetId}`)
    }

    // Build full config with URL
    // New industrial tilesets use .jpg, legacy use .jpeg
    const newTilesets = ['floor-tiles', 'wall-tiles', 'cover-tiles', 'hazard-tiles', 'prop-tiles', 'arena-border']
    const extension = newTilesets.includes(tilesetId) ? 'jpg' : 'jpeg'
    
    // Use removeBackground from config if specified, otherwise default to true for legacy tilesets
    const shouldRemoveBackground = baseConfig.removeBackground !== undefined 
      ? baseConfig.removeBackground 
      : true
    
    const config: TilesetConfig = {
      ...baseConfig,
      url: this.buildStorageUrl(`${tilesetId}.${extension}`),
      removeBackground: shouldRemoveBackground,
    }
    
    console.log(`[TilesetLoader] ${tilesetId} URL: ${config.url}`)

    // Start loading
    const loadPromise = this.loadTileset(config)
    this.loading.set(tilesetId, loadPromise)

    try {
      const result = await loadPromise
      this.cache.set(tilesetId, result)
      console.log(`[TilesetLoader] ${tilesetId} loaded successfully: ${result.tileCount} tiles`)
      return result
    } catch (err) {
      console.error(`[TilesetLoader] Failed to load ${tilesetId}:`, err)
      throw err
    } finally {
      this.loading.delete(tilesetId)
    }
  }

  /**
   * Load a tileset from a custom config
   */
  async loadCustom(config: TilesetConfig): Promise<LoadedTileset> {
    const cached = this.cache.get(config.id)
    if (cached) return cached

    const result = await this.loadTileset(config)
    this.cache.set(config.id, result)
    return result
  }

  /**
   * Internal: Load and process a tileset
   */
  private async loadTileset(config: TilesetConfig): Promise<LoadedTileset> {
    console.log(`[TilesetLoader] Starting image load: ${config.url}`)
    
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        console.log(`[TilesetLoader] Image loaded: ${config.id} (${img.width}x${img.height})`)
        try {
          const tiles = this.extractTiles(img, config)
          console.log(`[TilesetLoader] Extracted ${tiles.length} tiles from ${config.id}`)
          resolve({
            config,
            tiles,
            tileCount: tiles.length,
            loaded: true,
          })
        } catch (err) {
          console.error(`[TilesetLoader] Error extracting tiles from ${config.id}:`, err)
          reject(err)
        }
      }

      img.onerror = (e) => {
        console.error(`[TilesetLoader] Failed to load image: ${config.url}`, e)
        reject(new Error(`Failed to load tileset: ${config.url}`))
      }

      img.src = config.url
    })
  }

  /**
   * Extract individual tiles from a sprite sheet
   * Auto-detects tile size if tileWidth/tileHeight are 0
   * 
   * For industrial tilesets (floor-tiles, etc.), we need special handling:
   * The JPG images may have checkered patterns baked in where transparency
   * was intended. We detect and replace these with solid colors.
   */
  private extractTiles(img: HTMLImageElement, config: TilesetConfig): Tile[] {
    const { columns, rows, removeBackground: shouldRemove = true } = config
    const tiles: Tile[] = []

    // Auto-detect tile size from image dimensions if not specified
    const tileWidth = config.tileWidth > 0 ? config.tileWidth : Math.floor(img.width / columns)
    const tileHeight = config.tileHeight > 0 ? config.tileHeight : Math.floor(img.height / rows)

    console.log(`[TilesetLoader] ${config.id}: ${img.width}x${img.height} → ${columns}x${rows} grid → ${tileWidth}x${tileHeight} tiles, removeBackground=${shouldRemove}`)

    // First, process the full image to remove background if needed
    let sourceCanvas: HTMLCanvasElement
    if (shouldRemove) {
      sourceCanvas = removeBackground(img, 'auto')
    } else {
      // For industrial tilesets, we DON'T remove background or modify pixels
      // The JPG tiles should be used as-is without any processing
      sourceCanvas = document.createElement('canvas')
      sourceCanvas.width = img.width
      sourceCanvas.height = img.height
      const ctx = sourceCanvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
    }

    const sourceCtx = sourceCanvas.getContext('2d')!

    // Extract each tile
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const index = row * columns + col
        const sx = col * tileWidth
        const sy = row * tileHeight

        // Create canvas for this tile
        const tileCanvas = document.createElement('canvas')
        tileCanvas.width = tileWidth
        tileCanvas.height = tileHeight
        const tileCtx = tileCanvas.getContext('2d')!

        // Copy tile from source
        const imageData = sourceCtx.getImageData(sx, sy, tileWidth, tileHeight)
        tileCtx.putImageData(imageData, 0, 0)

        tiles.push({
          canvas: tileCanvas,
          index,
          col,
          row,
        })
      }
    }

    return tiles
  }



  /**
   * Get a specific tile from a loaded tileset
   */
  getTile(tilesetId: string, index: number): Tile | null {
    const tileset = this.cache.get(tilesetId)
    if (!tileset) return null
    return tileset.tiles[index] ?? null
  }

  /**
   * Get a tile by row and column
   */
  getTileAt(tilesetId: string, col: number, row: number): Tile | null {
    const tileset = this.cache.get(tilesetId)
    if (!tileset) return null
    const index = row * tileset.config.columns + col
    return tileset.tiles[index] ?? null
  }

  /**
   * Check if a tileset is loaded
   */
  isLoaded(tilesetId: string): boolean {
    return this.cache.has(tilesetId)
  }

  /**
   * Preload multiple tilesets
   */
  async preloadAll(tilesetIds: string[]): Promise<void> {
    await Promise.all(tilesetIds.map(id => this.load(id)))
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear()
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const tilesetLoader = new TilesetLoaderClass()

// ============================================================================
// Tile Index Constants
// ============================================================================

/**
 * Named tile indices for grass tileset (4x4)
 */
export const GRASS_TILES = {
  // Row 0: Plain grass variants
  PLAIN_1: 0,
  PLAIN_2: 1,
  PLAIN_3: 2,
  PLAIN_4: 3,
  // Row 1: Grass with flowers
  FLOWERS_YELLOW: 4,
  FLOWERS_BLUE: 5,
  FLOWERS_WHITE: 6,
  FLOWERS_MIXED: 7,
  // Row 2: Grass with dirt patches
  DIRT_1: 8,
  DIRT_2: 9,
  DIRT_3: 10,
  DIRT_4: 11,
  // Row 3: Grass with stones/pebbles
  STONES_1: 12,
  STONES_2: 13,
  STONES_3: 14,
  STONES_4: 15,
}

/**
 * Named tile indices for sci-fi floor tileset (4x4)
 */
export const SCIFI_TILES = {
  // Row 0: Plain metal and circuit panels
  METAL_PLAIN: 0,
  CIRCUIT_PURPLE: 1,
  CIRCUIT_CYAN: 2,
  TECH_PANEL: 3,
  // Row 1: Grate and vent tiles
  GRATE_PURPLE: 4,
  GRATE_DARK: 5,
  VENT_CYAN: 6,
  ENERGY_CORE: 7,
  // Row 2: Hazard stripe tiles
  HAZARD_FULL: 8,
  HAZARD_CENTER: 9,
  HAZARD_BORDER: 10,
  METAL_ACCENT: 11,
  // Row 3: Special tiles
  DAMAGED: 12,
  POWER_BUTTON: 13,
  TELEPORTER: 14,
  FRAMED: 15,
}

/**
 * Named tile indices for water tileset (3x3 9-slice)
 */
export const WATER_TILES = {
  TOP_LEFT: 0,
  TOP: 1,
  TOP_RIGHT: 2,
  LEFT: 3,
  CENTER: 4,
  RIGHT: 5,
  BOTTOM_LEFT: 6,
  BOTTOM: 7,
  BOTTOM_RIGHT: 8,
}

/**
 * Named tile indices for stone wall tileset (3x3 9-slice)
 */
export const WALL_TILES = {
  TOP_LEFT: 0,
  TOP: 1,
  TOP_RIGHT: 2,
  LEFT: 3,
  CENTER: 4,
  RIGHT: 5,
  BOTTOM_LEFT: 6,
  BOTTOM: 7,
  BOTTOM_RIGHT: 8,
}

/**
 * Named tile indices for bush tileset (4x1)
 */
export const BUSH_TILES = {
  SMALL: 0,
  MEDIUM: 1,
  LARGE: 2,
  EXTRA_LARGE: 3,
}

/**
 * Named tile indices for box destruction sequence (4x1)
 */
export const BOX_TILES = {
  INTACT: 0,
  DAMAGED: 1,
  BREAKING: 2,
  DEBRIS: 3,
}

// ============================================================================
// NEW INDUSTRIAL TILESET INDICES
// ============================================================================

/**
 * Named tile indices for industrial floor tileset (4x4)
 * Based on the generated floor-tiles.jpg
 */
export const FLOOR_TILES = {
  // Row 0: Concrete
  CONCRETE_PLAIN: 0,
  CONCRETE_CRACKED: 1,
  CONCRETE_STAINED: 2,
  CONCRETE_TIRE_MARKS: 3,
  // Row 1: Metal
  METAL_DIAMOND: 4,
  METAL_RUSTED: 5,
  METAL_GRATE: 6,
  METAL_RIVETED: 7,
  // Row 2: Tile
  TILE_WHITE: 8,
  TILE_DIRTY: 9,
  TILE_BROKEN: 10,
  TILE_BLOOD: 11,
  // Row 3: Special
  DRAIN: 12,
  VENT: 13,
  MANHOLE: 14,
  ARROW_MARKING: 15,
}

/**
 * Named tile indices for industrial wall tileset (3x3 9-slice)
 * Based on the generated wall-tiles.jpg
 */
export const INDUSTRIAL_WALL_TILES = {
  // Row 0: Top edge with barbed wire
  TOP_LEFT: 0,
  TOP: 1,
  TOP_RIGHT: 2,
  // Row 1: Middle with railing
  LEFT: 3,
  CENTER: 4,
  RIGHT: 5,
  // Row 2: Bottom edge
  BOTTOM_LEFT: 6,
  BOTTOM: 7,
  BOTTOM_RIGHT: 8,
}

/**
 * Named tile indices for cover/obstacle tileset (4x2)
 * Based on the generated cover-tiles.jpg
 */
export const COVER_TILES = {
  // Row 0: Large cover
  WOODEN_CRATE: 0,
  SHIPPING_CONTAINER: 1,
  SANDBAGS: 2,
  JERSEY_BARRIER: 3,
  // Row 1: Small cover
  OIL_BARREL: 4,
  TIRES: 5,
  VEHICLE_WRECK: 6,
  SUPPLY_PALLET: 7,
}

/**
 * Named tile indices for hazard tileset (4x2)
 * Based on the generated hazard-tiles.jpg
 */
export const HAZARD_TILES = {
  // Row 0: Hazards
  TOXIC_WASTE: 0,
  OIL_SLICK: 1,
  FIRE: 2,
  ELECTRIC: 3,
  // Row 1: Interactables
  PRESSURE_PLATE: 4,
  AMMO_CRATE: 5,
  HEALTH_KIT: 6,
  LADDER_HATCH: 7,
}

/**
 * Named tile indices for prop/debris tileset (4x2)
 * Based on the generated prop-tiles.jpg
 */
export const PROP_TILES = {
  // Row 0: Debris
  RUBBLE: 0,
  BRICKS: 1,
  PIPES: 2,
  JUNK_PILE: 3,
  // Row 1: Props
  CONCRETE_SLAB: 4,
  METAL_GRATE_PROP: 5,
  BARREL_FALLEN: 6,
  TIRE_SINGLE: 7,
}

/**
 * Named tile indices for arena border tileset (3x3 9-slice)
 * Based on the generated arena-border.jpg - chain-link fence
 */
export const BORDER_TILES = {
  // Row 0: Top
  TOP_LEFT: 0,
  TOP: 1,
  TOP_RIGHT: 2,
  // Row 1: Middle
  LEFT: 3,
  CENTER: 4,
  RIGHT: 5,
  // Row 2: Bottom
  BOTTOM_LEFT: 6,
  BOTTOM: 7,
  BOTTOM_RIGHT: 8,
}
