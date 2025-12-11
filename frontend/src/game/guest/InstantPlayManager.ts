/**
 * InstantPlayManager - Zero-friction game initialization
 * 
 * Handles asset preloading and instant game start for guest players.
 * Preloads assets on CTA hover to ensure <3 second game start.
 * 
 * @module game/guest/InstantPlayManager
 * Requirements: 1.1, 1.2
 */

import { VORTEX_ARENA, type MapConfig } from '../config/maps'

/**
 * Configuration for instant play mode
 */
export interface InstantPlayConfig {
  defaultCategory: string
  defaultMap: MapConfig
  tutorialEnabled: boolean
  preloadAssets: boolean
  showCategoryPicker: boolean // Show category selection before game
}

/**
 * Default configuration optimized for first impressions
 */
const DEFAULT_CONFIG: InstantPlayConfig = {
  defaultCategory: 'general', // Fallback if picker skipped
  defaultMap: VORTEX_ARENA,   // Primary arena map
  tutorialEnabled: true,
  preloadAssets: true,
  showCategoryPicker: true,   // Let users choose their trivia category
}

/**
 * Asset URLs to preload for instant play
 */
const PRELOAD_ASSETS = [
  // Map backgrounds
  '/maps/nexus-arena-bg.png',
  '/maps/nexus-arena-thumb.png',
  // UI assets
  '/ui/health-bar.png',
  '/ui/score-panel.png',
  // Sound effects (small files)
  '/sounds/shoot.mp3',
  '/sounds/hit.mp3',
  '/sounds/correct.mp3',
]

/**
 * InstantPlayManager class
 * 
 * Singleton for managing instant play state and asset preloading.
 */
export class InstantPlayManager {
  private static instance: InstantPlayManager | null = null
  
  private config: InstantPlayConfig
  private preloadStartTime: number = 0
  private preloadComplete: boolean = false
  private preloadPromise: Promise<void> | null = null
  private initStartTime: number = 0
  private initEndTime: number = 0
  private listeners: Set<(ready: boolean) => void> = new Set()

  private constructor(config: Partial<InstantPlayConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Get singleton instance
   */
  static getInstance(): InstantPlayManager {
    if (!InstantPlayManager.instance) {
      InstantPlayManager.instance = new InstantPlayManager()
    }
    return InstantPlayManager.instance
  }

  /**
   * Reset singleton (for testing)
   */
  static resetInstance(): void {
    InstantPlayManager.instance = null
  }

  /**
   * Initialize with custom config
   */
  initialize(config?: Partial<InstantPlayConfig>): void {
    if (config) {
      this.config = { ...this.config, ...config }
    }
  }

  /**
   * Start preloading assets
   * Call this on CTA hover for best performance
   */
  async preloadAssets(): Promise<void> {
    if (this.preloadComplete || this.preloadPromise) {
      return this.preloadPromise ?? Promise.resolve()
    }

    this.preloadStartTime = performance.now()
    
    this.preloadPromise = this.doPreload()
    await this.preloadPromise
    
    this.preloadComplete = true
    this.notifyListeners()
  }

  /**
   * Internal preload implementation
   */
  private async doPreload(): Promise<void> {
    const imagePromises = PRELOAD_ASSETS
      .filter(url => url.endsWith('.png') || url.endsWith('.jpg'))
      .map(url => this.preloadImage(url))

    const audioPromises = PRELOAD_ASSETS
      .filter(url => url.endsWith('.mp3') || url.endsWith('.wav'))
      .map(url => this.preloadAudio(url))

    // Wait for all assets, but don't fail if some are missing
    await Promise.allSettled([...imagePromises, ...audioPromises])
  }


  /**
   * Preload a single image with timeout
   */
  private preloadImage(url: string): Promise<void> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(), 2000) // 2s timeout
      const img = new Image()
      img.onload = () => {
        clearTimeout(timeout)
        resolve()
      }
      img.onerror = () => {
        clearTimeout(timeout)
        resolve() // Don't fail on missing assets
      }
      img.src = url
    })
  }

  /**
   * Preload a single audio file with timeout
   */
  private preloadAudio(url: string): Promise<void> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(), 2000) // 2s timeout
      const audio = new Audio()
      audio.oncanplaythrough = () => {
        clearTimeout(timeout)
        resolve()
      }
      audio.onerror = () => {
        clearTimeout(timeout)
        resolve() // Don't fail on missing assets
      }
      audio.src = url
    })
  }

  /**
   * Check if assets are preloaded
   */
  isReady(): boolean {
    return this.preloadComplete
  }

  /**
   * Get current configuration
   */
  getConfig(): InstantPlayConfig {
    return { ...this.config }
  }

  /**
   * Get default category for instant play
   */
  getDefaultCategory(): string {
    return this.config.defaultCategory
  }

  /**
   * Get default map for instant play
   */
  getDefaultMap(): MapConfig {
    return this.config.defaultMap
  }

  /**
   * Check if tutorial should be shown
   */
  shouldShowTutorial(): boolean {
    return this.config.tutorialEnabled
  }

  /**
   * Mark initialization start (for timing metrics)
   */
  markInitStart(): void {
    this.initStartTime = performance.now()
  }

  /**
   * Mark initialization end (for timing metrics)
   */
  markInitEnd(): void {
    this.initEndTime = performance.now()
  }

  /**
   * Get initialization time in milliseconds
   */
  getInitTimeMs(): number {
    if (this.initStartTime === 0 || this.initEndTime === 0) {
      return -1
    }
    return this.initEndTime - this.initStartTime
  }

  /**
   * Get preload time in milliseconds
   */
  getPreloadTimeMs(): number {
    if (this.preloadStartTime === 0 || !this.preloadComplete) {
      return -1
    }
    return performance.now() - this.preloadStartTime
  }

  /**
   * Subscribe to ready state changes
   */
  subscribe(listener: (ready: boolean) => void): () => void {
    this.listeners.add(listener)
    // Immediately notify if already ready
    if (this.preloadComplete) {
      listener(true)
    }
    return () => this.listeners.delete(listener)
  }

  /**
   * Notify listeners of ready state change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.preloadComplete))
  }

  /**
   * Disable tutorial (after first play)
   */
  disableTutorial(): void {
    this.config.tutorialEnabled = false
  }

  /**
   * Check if category picker should be shown
   */
  shouldShowCategoryPicker(): boolean {
    return this.config.showCategoryPicker
  }

  /**
   * Set the selected category (from picker)
   */
  setSelectedCategory(category: string): void {
    this.config.defaultCategory = category
  }

  /**
   * Disable category picker (after first selection)
   */
  disableCategoryPicker(): void {
    this.config.showCategoryPicker = false
  }
}

// Export singleton getter for convenience
export const getInstantPlayManager = () => InstantPlayManager.getInstance()
