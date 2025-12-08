/**
 * Dynamic Asset Loader - Loads cosmetic assets from Supabase Storage URLs
 * Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.3, 5.4
 *
 * Handles:
 * - Loading shop images from dynamic URLs
 * - Loading sprite sheets from storage
 * - Loading single images as static skins (non-animated)
 * - Automatic white/light background removal for JPG/JPEG images
 * - Caching loaded assets
 * - Fallback handling on errors
 * - Retry with exponential backoff
 */

import { processSpriteSheet, type SpriteSheetConfig } from './SpriteSheetProcessor'
import { removeBackground } from './ImageProcessor'

// Default sprite sheet config (8x4 grid)
const DEFAULT_SPRITE_CONFIG: SpriteSheetConfig = {
  columns: 8,
  rows: 4,
}

// Minimum dimensions to consider an image a sprite sheet
// A proper 8x4 sprite sheet should be at least 512x256 (64px per frame)
const MIN_SPRITE_SHEET_WIDTH = 256
const MIN_SPRITE_SHEET_HEIGHT = 128

// Placeholder image for fallback
const PLACEHOLDER_DATA_URL = 'data:image/svg+xml,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <rect width="64" height="64" fill="#1f2937"/>
    <text x="32" y="36" text-anchor="middle" fill="#6b7280" font-size="12">?</text>
  </svg>
`)

export interface SpriteMetadata {
  frameWidth: number
  frameHeight: number
  columns: number
  rows: number
  animations?: Record<string, { start: number; end: number; loop?: boolean }>
}

export interface LoadedSpriteSheet {
  frames: HTMLCanvasElement[]
  metadata: SpriteMetadata
}

interface CacheEntry<T> {
  data: T
  timestamp: number
}

/**
 * Dynamic Asset Loader for cosmetic images and sprite sheets
 */
export class DynamicAssetLoader {
  private imageCache: Map<string, CacheEntry<HTMLImageElement>> = new Map()
  private spriteCache: Map<string, CacheEntry<LoadedSpriteSheet>> = new Map()
  private loadingPromises: Map<string, Promise<unknown>> = new Map()
  
  // Cache TTL in milliseconds (30 minutes)
  private cacheTTL = 30 * 60 * 1000
  
  // Retry config
  private maxRetries = 3
  private baseDelay = 1000

  /**
   * Load a cosmetic image from URL
   * Requirements: 4.1, 4.2, 4.3
   */
  async loadImage(url: string): Promise<HTMLImageElement> {
    // Check cache
    const cached = this.imageCache.get(url)
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data
    }

    // Check if already loading
    const existing = this.loadingPromises.get(url)
    if (existing) {
      return existing as Promise<HTMLImageElement>
    }

    // Load with retry
    const loadPromise = this.loadImageWithRetry(url)
    this.loadingPromises.set(url, loadPromise)

    try {
      const image = await loadPromise
      this.imageCache.set(url, { data: image, timestamp: Date.now() })
      return image
    } finally {
      this.loadingPromises.delete(url)
    }
  }

  /**
   * Load image with exponential backoff retry
   * Requirements: 4.3
   */
  private async loadImageWithRetry(url: string, attempt = 0): Promise<HTMLImageElement> {
    try {
      return await this.loadImageOnce(url)
    } catch (error) {
      if (attempt < this.maxRetries) {
        const delay = this.baseDelay * Math.pow(2, attempt)
        console.warn(`[DynamicAssetLoader] Retry ${attempt + 1}/${this.maxRetries} for ${url} in ${delay}ms`)
        await this.sleep(delay)
        return this.loadImageWithRetry(url, attempt + 1)
      }
      
      console.error(`[DynamicAssetLoader] Failed to load image after ${this.maxRetries} retries:`, url)
      return this.createPlaceholderImage()
    }
  }

  /**
   * Load a single image
   */
  private loadImageOnce(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Failed to load: ${url}`))
      
      img.src = url
    })
  }

  /**
   * Create a placeholder image for fallback
   * Requirements: 4.3, 5.3
   */
  private createPlaceholderImage(): HTMLImageElement {
    const img = new Image()
    img.src = PLACEHOLDER_DATA_URL
    return img
  }

  /**
   * Load a sprite sheet from URL with optional metadata
   * Requirements: 4.4, 5.1, 5.4
   */
  async loadSpriteSheet(
    spriteUrl: string,
    metadataUrl?: string,
    config?: Partial<SpriteSheetConfig>
  ): Promise<LoadedSpriteSheet> {
    const cacheKey = `${spriteUrl}|${metadataUrl || ''}`
    
    // Check cache
    const cached = this.spriteCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data
    }

    // Check if already loading
    const existing = this.loadingPromises.get(cacheKey)
    if (existing) {
      return existing as Promise<LoadedSpriteSheet>
    }

    const loadPromise = this.loadSpriteSheetInternal(spriteUrl, metadataUrl, config)
    this.loadingPromises.set(cacheKey, loadPromise)

    try {
      const result = await loadPromise
      this.spriteCache.set(cacheKey, { data: result, timestamp: Date.now() })
      return result
    } finally {
      this.loadingPromises.delete(cacheKey)
    }
  }

  /**
   * Internal sprite sheet loading
   * Detects if image is a sprite sheet or single image and handles accordingly
   */
  private async loadSpriteSheetInternal(
    spriteUrl: string,
    metadataUrl?: string,
    config?: Partial<SpriteSheetConfig>
  ): Promise<LoadedSpriteSheet> {
    // Load metadata if URL provided
    let metadata: SpriteMetadata | null = null
    if (metadataUrl) {
      try {
        metadata = await this.loadMetadata(metadataUrl)
      } catch (error) {
        console.warn(`[DynamicAssetLoader] Failed to load metadata, using defaults:`, error)
      }
    }

    // First, load the image to check its dimensions
    try {
      const img = await this.loadImageOnce(spriteUrl)
      
      // Check if this looks like a sprite sheet or a single image
      const isSpriteSheet = this.isSpriteSheet(img, metadata, config)
      console.log(`[DynamicAssetLoader] Image ${spriteUrl}: ${img.width}x${img.height}, isSpriteSheet: ${isSpriteSheet}`)
      
      if (!isSpriteSheet) {
        // Single image - create a single frame from it
        console.log(`[DynamicAssetLoader] Treating as single image skin`)
        const frame = this.createFrameFromImage(img, spriteUrl)
        return {
          frames: [frame],
          metadata: {
            frameWidth: img.width,
            frameHeight: img.height,
            columns: 1,
            rows: 1,
          },
        }
      }

      // Build sprite config from metadata or defaults
      const spriteConfig: SpriteSheetConfig = {
        columns: metadata?.columns ?? config?.columns ?? DEFAULT_SPRITE_CONFIG.columns,
        rows: metadata?.rows ?? config?.rows ?? DEFAULT_SPRITE_CONFIG.rows,
        frameWidth: metadata?.frameWidth ?? config?.frameWidth,
        frameHeight: metadata?.frameHeight ?? config?.frameHeight,
      }

      // Process sprite sheet
      const frames = await processSpriteSheet(spriteUrl, spriteConfig)
      
      return {
        frames,
        metadata: metadata ?? {
          frameWidth: spriteConfig.frameWidth ?? 64,
          frameHeight: spriteConfig.frameHeight ?? 64,
          columns: spriteConfig.columns,
          rows: spriteConfig.rows,
        },
      }
    } catch (error) {
      console.error(`[DynamicAssetLoader] Failed to process sprite sheet:`, error)
      // Return empty frames as fallback
      return {
        frames: [],
        metadata: {
          frameWidth: 64,
          frameHeight: 64,
          columns: 8,
          rows: 4,
        },
      }
    }
  }

  /**
   * Determine if an image is a sprite sheet or a single image
   * Sprite sheets are typically wider than tall (8x4 grid) and have minimum dimensions
   */
  private isSpriteSheet(
    img: HTMLImageElement,
    metadata: SpriteMetadata | null,
    config?: Partial<SpriteSheetConfig>
  ): boolean {
    // If metadata explicitly defines grid, trust it
    if (metadata && (metadata.columns > 1 || metadata.rows > 1)) {
      return true
    }
    
    // If config explicitly defines grid, trust it
    if (config && ((config.columns && config.columns > 1) || (config.rows && config.rows > 1))) {
      return true
    }
    
    // Check dimensions - sprite sheets should be large enough to contain multiple frames
    // A typical 8x4 sprite sheet with 64x64 frames would be 512x256
    if (img.width < MIN_SPRITE_SHEET_WIDTH || img.height < MIN_SPRITE_SHEET_HEIGHT) {
      return false
    }
    
    // Check aspect ratio - 8x4 sprite sheets have width:height ratio of 2:1
    // Single images are typically closer to 1:1 or portrait
    const aspectRatio = img.width / img.height
    
    // Sprite sheets typically have aspect ratio >= 1.5 (wider than tall)
    // Single character images are usually square-ish or portrait
    if (aspectRatio < 1.5) {
      return false
    }
    
    return true
  }

  /**
   * Create a canvas frame from a single image
   * Automatically removes white/light backgrounds for non-PNG images
   */
  private createFrameFromImage(img: HTMLImageElement, sourceUrl?: string): HTMLCanvasElement {
    // Check if we should remove background (for JPG/JPEG or images without transparency)
    const shouldRemoveBackground = this.shouldRemoveBackground(sourceUrl)
    
    if (shouldRemoveBackground) {
      console.log(`[DynamicAssetLoader] Removing background from image: ${sourceUrl}`)
      return removeBackground(img, 'auto')
    }
    
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    return canvas
  }

  /**
   * Determine if we should remove background from an image
   * Returns true for JPG/JPEG files or URLs without .png extension
   */
  private shouldRemoveBackground(url?: string): boolean {
    if (!url) return false
    
    const lowerUrl = url.toLowerCase()
    
    // Always remove background for JPG/JPEG
    if (lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg')) {
      return true
    }
    
    // Don't remove for PNG (assumed to have proper transparency)
    if (lowerUrl.includes('.png')) {
      return false
    }
    
    // For unknown formats, try to remove background
    return true
  }

  /**
   * Load sprite metadata JSON
   * Requirements: 4.4
   */
  private async loadMetadata(url: string): Promise<SpriteMetadata> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status}`)
    }
    return response.json()
  }

  /**
   * Preload multiple images
   */
  async preloadImages(urls: string[]): Promise<void> {
    await Promise.all(urls.map(url => this.loadImage(url)))
  }

  /**
   * Clear cache for memory management
   * Requirements: 5.4
   */
  clearCache(): void {
    this.imageCache.clear()
    this.spriteCache.clear()
    console.log('[DynamicAssetLoader] Cache cleared')
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now()
    
    for (const [key, entry] of this.imageCache) {
      if (now - entry.timestamp > this.cacheTTL) {
        this.imageCache.delete(key)
      }
    }
    
    for (const [key, entry] of this.spriteCache) {
      if (now - entry.timestamp > this.cacheTTL) {
        this.spriteCache.delete(key)
      }
    }
  }

  /**
   * Get cache stats for debugging
   */
  getCacheStats(): { images: number; sprites: number } {
    return {
      images: this.imageCache.size,
      sprites: this.spriteCache.size,
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Singleton instance
export const dynamicAssets = new DynamicAssetLoader()
