/**
 * EmoteAssetLoader - Handles loading and caching of emote images
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

import type { EmoteAsset, EmoteInventoryItem } from './types'

export class EmoteAssetLoader {
  private assets: Map<string, EmoteAsset> = new Map()
  private loadingPromises: Map<string, Promise<void>> = new Map()

  /**
   * Preload emote images from inventory
   * Requirements: 1.1, 1.5
   */
  async preloadEmotes(emotes: EmoteInventoryItem[]): Promise<void> {
    const loadPromises = emotes.map(emote => this.loadEmote(emote))
    await Promise.allSettled(loadPromises)
  }

  /**
   * Load a single emote image
   * Requirements: 1.2, 1.3, 1.4
   */
  private async loadEmote(emote: EmoteInventoryItem): Promise<void> {
    // Skip if already loaded
    const existing = this.assets.get(emote.id)
    if (existing?.loaded) {
      return
    }

    // Check if already loading
    const existingPromise = this.loadingPromises.get(emote.id)
    if (existingPromise) {
      return existingPromise
    }

    // Create asset entry
    const asset: EmoteAsset = {
      id: emote.id,
      name: emote.name,
      imageUrl: emote.image_url,
      image: null,
      loaded: false,
    }
    this.assets.set(emote.id, asset)

    // Load image
    const loadPromise = new Promise<void>((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        asset.image = img
        asset.loaded = true
        this.loadingPromises.delete(emote.id)
        resolve()
      }

      img.onerror = () => {
        console.error(`[EmoteAssetLoader] Failed to load emote image: ${emote.image_url}`)
        asset.loaded = false
        this.loadingPromises.delete(emote.id)
        resolve() // Resolve anyway to not block other loads
      }

      img.src = emote.image_url
    })

    this.loadingPromises.set(emote.id, loadPromise)
    return loadPromise
  }

  /**
   * Get all loaded assets
   */
  getAssets(): Map<string, EmoteAsset> {
    return this.assets
  }

  /**
   * Get a specific asset
   * Requirements: 1.2
   */
  getAsset(emoteId: string): EmoteAsset | null {
    return this.assets.get(emoteId) ?? null
  }

  /**
   * Check if an emote is loaded
   */
  isLoaded(emoteId: string): boolean {
    const asset = this.assets.get(emoteId)
    return asset?.loaded ?? false
  }

  /**
   * Check if an emote exists in cache (loaded or not)
   */
  hasAsset(emoteId: string): boolean {
    return this.assets.has(emoteId)
  }

  /**
   * Get the number of cached assets
   */
  getCacheSize(): number {
    return this.assets.size
  }

  /**
   * Clear all cached assets
   */
  clear(): void {
    this.assets.clear()
    this.loadingPromises.clear()
  }
}
