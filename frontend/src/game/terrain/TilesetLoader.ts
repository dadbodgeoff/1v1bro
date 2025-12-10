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
 */
export const TILESET_CONFIGS: Record<string, Omit<TilesetConfig, 'url'>> = {
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
 */
class TilesetLoaderClass {
  private cache = new Map<string, LoadedTileset>()
  private loading = new Map<string, Promise<LoadedTileset>>()
  private supabaseUrl: string | null = null

  /**
   * Set the Supabase URL for building storage URLs
   */
  setSupabaseUrl(url: string): void {
    this.supabaseUrl = url.replace(/\/$/, '') // Remove trailing slash
  }

  /**
   * Build a storage URL for a tileset
   */
  private buildStorageUrl(filename: string): string {
    if (!this.supabaseUrl) {
      // Fallback to environment variable
      const envUrl = import.meta.env.VITE_SUPABASE_URL
      if (envUrl) {
        this.supabaseUrl = envUrl.replace(/\/$/, '')
      } else {
        throw new Error('Supabase URL not configured. Call setSupabaseUrl() first.')
      }
    }
    return `${this.supabaseUrl}/storage/v1/object/public/cosmetics/tilesets/${filename}`
  }

  /**
   * Load a tileset by ID
   */
  async load(tilesetId: string): Promise<LoadedTileset> {
    // Check cache first
    const cached = this.cache.get(tilesetId)
    if (cached) return cached

    // Check if already loading
    const existing = this.loading.get(tilesetId)
    if (existing) return existing

    // Get config
    const baseConfig = TILESET_CONFIGS[tilesetId]
    if (!baseConfig) {
      throw new Error(`Unknown tileset: ${tilesetId}`)
    }

    // Build full config with URL
    const config: TilesetConfig = {
      ...baseConfig,
      url: this.buildStorageUrl(`${tilesetId}.jpeg`),
      removeBackground: true,
    }

    // Start loading
    const loadPromise = this.loadTileset(config)
    this.loading.set(tilesetId, loadPromise)

    try {
      const result = await loadPromise
      this.cache.set(tilesetId, result)
      return result
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
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        try {
          const tiles = this.extractTiles(img, config)
          resolve({
            config,
            tiles,
            tileCount: tiles.length,
            loaded: true,
          })
        } catch (err) {
          reject(err)
        }
      }

      img.onerror = () => {
        reject(new Error(`Failed to load tileset: ${config.url}`))
      }

      img.src = config.url
    })
  }

  /**
   * Extract individual tiles from a sprite sheet
   */
  private extractTiles(img: HTMLImageElement, config: TilesetConfig): Tile[] {
    const { columns, rows, tileWidth, tileHeight, removeBackground: shouldRemove = true } = config
    const tiles: Tile[] = []

    // First, process the full image to remove background if needed
    let sourceCanvas: HTMLCanvasElement
    if (shouldRemove) {
      sourceCanvas = removeBackground(img, 'auto')
    } else {
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
