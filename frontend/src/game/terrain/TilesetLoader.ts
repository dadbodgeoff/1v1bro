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

// Re-export tile indices for backward compatibility
export * from './TileIndices'

// ============================================================================
// Types
// ============================================================================

export interface TilesetConfig {
  id: string
  url: string
  columns: number
  rows: number
  tileWidth: number
  tileHeight: number
  removeBackground?: boolean
}

export interface Tile {
  canvas: HTMLCanvasElement
  index: number
  col: number
  row: number
}

export interface LoadedTileset {
  config: TilesetConfig
  tiles: Tile[]
  tileCount: number
  loaded: boolean
}

// ============================================================================
// Tileset Definitions
// ============================================================================

export const TILESET_CONFIGS: Record<string, Omit<TilesetConfig, 'url'>> = {
  // Cyber Arena tilesets (88x88 tiles)
  'cyber-tilesheet': {
    id: 'cyber-tilesheet',
    columns: 4,
    rows: 4,
    tileWidth: 88,
    tileHeight: 88,
    removeBackground: false,
  },
  'cyber-tilesheet2': {
    id: 'cyber-tilesheet2',
    columns: 4,
    rows: 3,
    tileWidth: 88,
    tileHeight: 88,
    removeBackground: false,
  },
  // New industrial tilesets
  'floor-tiles': {
    id: 'floor-tiles',
    columns: 4,
    rows: 4,
    tileWidth: 0,
    tileHeight: 0,
    removeBackground: false,
  },
  'wall-tiles': {
    id: 'wall-tiles',
    columns: 3,
    rows: 3,
    tileWidth: 0,
    tileHeight: 0,
    removeBackground: false,
  },

  'cover-tiles': {
    id: 'cover-tiles',
    columns: 4,
    rows: 2,
    tileWidth: 0,
    tileHeight: 0,
    removeBackground: false,
  },
  'hazard-tiles': {
    id: 'hazard-tiles',
    columns: 4,
    rows: 2,
    tileWidth: 0,
    tileHeight: 0,
    removeBackground: false,
  },
  'prop-tiles': {
    id: 'prop-tiles',
    columns: 4,
    rows: 2,
    tileWidth: 0,
    tileHeight: 0,
    removeBackground: false,
  },
  'arena-border': {
    id: 'arena-border',
    columns: 3,
    rows: 3,
    tileWidth: 0,
    tileHeight: 0,
    removeBackground: false,
  },
  // Legacy tilesets
  grass: {
    id: 'grass',
    columns: 4,
    rows: 4,
    tileWidth: 64,
    tileHeight: 64,
  },
  'scifi-floor': {
    id: 'scifi-floor',
    columns: 4,
    rows: 4,
    tileWidth: 64,
    tileHeight: 64,
  },
  water: {
    id: 'water',
    columns: 3,
    rows: 3,
    tileWidth: 64,
    tileHeight: 64,
  },
  bush: {
    id: 'bush',
    columns: 4,
    rows: 1,
    tileWidth: 64,
    tileHeight: 64,
  },
  tile: {
    id: 'tile',
    columns: 3,
    rows: 3,
    tileWidth: 64,
    tileHeight: 64,
  },
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

class TilesetLoaderClass {
  private cache = new Map<string, LoadedTileset>()
  private loading = new Map<string, Promise<LoadedTileset>>()
  private readonly TILESET_BASE_URL = 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets'

  private buildStorageUrl(filename: string): string {
    return `${this.TILESET_BASE_URL}/${filename}`
  }

  async load(tilesetId: string): Promise<LoadedTileset> {
    const cached = this.cache.get(tilesetId)
    if (cached) return cached

    const existing = this.loading.get(tilesetId)
    if (existing) return existing

    const baseConfig = TILESET_CONFIGS[tilesetId]
    if (!baseConfig) {
      throw new Error(`Unknown tileset: ${tilesetId}`)
    }

    const newTilesets = ['floor-tiles', 'wall-tiles', 'cover-tiles', 'hazard-tiles', 'prop-tiles', 'arena-border']
    const cyberTilesets = ['cyber-tilesheet', 'cyber-tilesheet2']

    let extension = 'jpeg'
    if (newTilesets.includes(tilesetId) || cyberTilesets.includes(tilesetId)) {
      extension = 'jpg'
    }
    
    // Map cyber tileset IDs to actual filenames
    let filename = tilesetId
    if (tilesetId === 'cyber-tilesheet') {
      filename = 'tilesheet'
    } else if (tilesetId === 'cyber-tilesheet2') {
      filename = 'tilesheet2'
    }
    const shouldRemoveBackground = baseConfig.removeBackground !== undefined 
      ? baseConfig.removeBackground 
      : true

    console.log(`[TilesetLoader] Config for ${tilesetId}: removeBackground in baseConfig = ${baseConfig.removeBackground}, shouldRemoveBackground = ${shouldRemoveBackground}`)
    
    const config: TilesetConfig = {
      ...baseConfig,
      url: this.buildStorageUrl(`${filename}.${extension}`),
      removeBackground: shouldRemoveBackground,
    }

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

  async loadCustom(config: TilesetConfig): Promise<LoadedTileset> {
    const cached = this.cache.get(config.id)
    if (cached) return cached

    const result = await this.loadTileset(config)
    this.cache.set(config.id, result)
    return result
  }

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

  private extractTiles(img: HTMLImageElement, config: TilesetConfig): Tile[] {
    const { columns, rows, removeBackground: shouldRemove = true } = config
    const tiles: Tile[] = []

    const tileWidth = config.tileWidth > 0 ? config.tileWidth : Math.floor(img.width / columns)
    const tileHeight = config.tileHeight > 0 ? config.tileHeight : Math.floor(img.height / rows)

    console.log(`[TilesetLoader] Extracting tiles from ${config.id}: ${columns}x${rows}, removeBackground=${shouldRemove}`)

    let sourceCanvas: HTMLCanvasElement
    if (shouldRemove) {
      console.log(`[TilesetLoader] Removing background for ${config.id}`)
      sourceCanvas = removeBackground(img, 'auto')
    } else {
      console.log(`[TilesetLoader] Keeping original image for ${config.id} (no background removal)`)
      sourceCanvas = document.createElement('canvas')
      sourceCanvas.width = img.width
      sourceCanvas.height = img.height
      const ctx = sourceCanvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
    }

    const sourceCtx = sourceCanvas.getContext('2d')!

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const index = row * columns + col
        const sx = col * tileWidth
        const sy = row * tileHeight

        const tileCanvas = document.createElement('canvas')
        tileCanvas.width = tileWidth
        tileCanvas.height = tileHeight
        const tileCtx = tileCanvas.getContext('2d')!

        const imageData = sourceCtx.getImageData(sx, sy, tileWidth, tileHeight)
        tileCtx.putImageData(imageData, 0, 0)

        tiles.push({ canvas: tileCanvas, index, col, row })
      }
    }

    return tiles
  }

  getTile(tilesetId: string, index: number): Tile | null {
    const tileset = this.cache.get(tilesetId)
    if (!tileset) return null
    return tileset.tiles[index] ?? null
  }

  getTileAt(tilesetId: string, col: number, row: number): Tile | null {
    const tileset = this.cache.get(tilesetId)
    if (!tileset) return null
    const index = row * tileset.config.columns + col
    return tileset.tiles[index] ?? null
  }

  isLoaded(tilesetId: string): boolean {
    return this.cache.has(tilesetId)
  }

  async preloadAll(tilesetIds: string[]): Promise<void> {
    await Promise.all(tilesetIds.map(id => this.load(id)))
  }

  clearCache(): void {
    this.cache.clear()
  }
}

export const tilesetLoader = new TilesetLoaderClass()
