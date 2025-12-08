/**
 * Arena Asset Loader
 * Loads and processes arena effect images (hazards, traps, transport)
 * Requirements: 5.1
 */

import { loadImageWithTransparency, type BackgroundType } from './ImageProcessor'
import { dynamicAssets } from './DynamicAssetLoader'

// Arena image imports
import iceCrystalsImg from '../../assets/game/arena/ice-crystals.jpg'
import damageZoneImg from '../../assets/game/arena/damage-zone.jpg'
import empImg from '../../assets/game/arena/emp.jpg'
import mineTrapImg from '../../assets/game/arena/mine-trap.jpg'
import teleporterImg from '../../assets/game/arena/teleporter.jpg'
import jumpPadImg from '../../assets/game/arena/jump-pad.jpg'
import respawnImg from '../../assets/game/arena/respawn.jpg'
import stunImg from '../../assets/game/arena/stun.jpg'
import knockbackImg from '../../assets/game/arena/knockback.jpg'

// ============================================================================
// Asset Definitions
// ============================================================================

interface ArenaAssetDef {
  key: string
  src: string
  bgType: BackgroundType
}

const ARENA_ASSETS: ArenaAssetDef[] = [
  // Hazard icons - use 'auto' to catch various background colors
  { key: 'slow-field', src: iceCrystalsImg, bgType: 'auto' },
  { key: 'damage-zone', src: damageZoneImg, bgType: 'auto' },
  { key: 'emp-zone', src: empImg, bgType: 'checkered-white' },
  
  // Trap icons
  { key: 'trap-mine', src: mineTrapImg, bgType: 'yellow' },
  
  // Transport effects
  { key: 'teleporter', src: teleporterImg, bgType: 'auto' },
  { key: 'jump-pad', src: jumpPadImg, bgType: 'auto' },
  
  // Combat effects
  { key: 'respawn', src: respawnImg, bgType: 'auto' },
  { key: 'stun', src: stunImg, bgType: 'auto' },
  { key: 'knockback', src: knockbackImg, bgType: 'auto' },
]

// ============================================================================
// ArenaAssetLoader Class
// ============================================================================

export class ArenaAssetLoader {
  private assets: Map<string, HTMLCanvasElement | HTMLImageElement> = new Map()
  private loading: Promise<void> | null = null
  private loaded = false

  /**
   * Load all arena assets
   */
  async load(): Promise<void> {
    if (this.loaded) return
    if (this.loading) return this.loading

    this.loading = this.loadAllAssets()
    await this.loading
    this.loaded = true
  }

  private async loadAllAssets(): Promise<void> {
    const loadPromises = ARENA_ASSETS.map(async (asset) => {
      try {
        const canvas = await loadImageWithTransparency(asset.src, asset.bgType)
        this.assets.set(asset.key, canvas)
        console.log(`[ArenaAssets] Loaded: ${asset.key}`)
      } catch (err) {
        console.warn(`[ArenaAssets] Failed to load ${asset.key}:`, err)
      }
    })

    await Promise.all(loadPromises)
    console.log(`[ArenaAssets] Loaded ${this.assets.size}/${ARENA_ASSETS.length} assets`)
  }

  /**
   * Get a loaded asset
   */
  get(key: string): HTMLCanvasElement | HTMLImageElement | null {
    return this.assets.get(key) ?? null
  }

  /**
   * Check if assets are loaded
   */
  isLoaded(): boolean {
    return this.loaded
  }

  /**
   * Draw an asset centered at a position
   */
  drawCentered(
    ctx: CanvasRenderingContext2D,
    key: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): boolean {
    const asset = this.get(key)
    if (!asset) return false

    ctx.drawImage(asset, x - width / 2, y - height / 2, width, height)
    return true
  }

  /**
   * Draw an asset at a position (top-left corner)
   */
  draw(
    ctx: CanvasRenderingContext2D,
    key: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): boolean {
    const asset = this.get(key)
    if (!asset) return false

    ctx.drawImage(asset, x, y, width, height)
    return true
  }

  /**
   * Load a dynamic asset from URL and cache it
   * Requirements: 5.1
   */
  async loadDynamicAsset(key: string, url: string): Promise<boolean> {
    try {
      const image = await dynamicAssets.loadImage(url)
      this.assets.set(key, image)
      console.log(`[ArenaAssets] Loaded dynamic asset: ${key}`)
      return true
    } catch (error) {
      console.warn(`[ArenaAssets] Failed to load dynamic asset ${key}:`, error)
      return false
    }
  }

  /**
   * Check if a specific asset is loaded
   */
  hasAsset(key: string): boolean {
    return this.assets.has(key)
  }
}

// Singleton instance
export const arenaAssets = new ArenaAssetLoader()
