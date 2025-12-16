/**
 * WorldConfig Singleton
 * 
 * Single source of truth for runtime-calculated world geometry values.
 * These values are calculated from loaded 3D models (track, player) and
 * should not be confused with static config values in getSurvivalConfig().
 * 
 * Usage:
 * - TrackManager sets trackSurfaceHeight after loading track model
 * - PlayerManager sets playerDimensions after loading player model
 * - All other systems read from WorldConfig instead of receiving values as parameters
 * 
 * @module survival/config/WorldConfig
 */

/**
 * Player collision box dimensions calculated from the loaded model
 */
export interface PlayerDimensions {
  width: number
  height: number
  depth: number
  footOffset: number  // Distance from model origin to feet
}

/**
 * Default player dimensions used before model loads
 */
const DEFAULT_PLAYER_DIMENSIONS: PlayerDimensions = {
  width: 1.0,
  height: 2.0,
  depth: 0.8,
  footOffset: 0,
}

/**
 * Default track surface height used before track loads
 */
const DEFAULT_TRACK_SURFACE_HEIGHT = 1.3

/**
 * Speed configuration defaults (from getSurvivalConfig)
 */
const DEFAULT_SPEED_CONFIG = {
  baseSpeed: 15,
  maxSpeed: 40,
  speedIncreaseRate: 0.3,
}

/**
 * WorldConfig singleton class
 * Holds runtime-calculated geometry values from loaded 3D models
 * and centralized speed/gameplay configuration
 */
export class WorldConfig {
  private static instance: WorldConfig | null = null

  // Runtime-calculated geometry (from models)
  private trackSurfaceHeight: number = DEFAULT_TRACK_SURFACE_HEIGHT
  private playerDimensions: PlayerDimensions = { ...DEFAULT_PLAYER_DIMENSIONS }

  // Speed configuration (centralized)
  private baseSpeed: number = DEFAULT_SPEED_CONFIG.baseSpeed
  private maxSpeed: number = DEFAULT_SPEED_CONFIG.maxSpeed
  private speedIncreaseRate: number = DEFAULT_SPEED_CONFIG.speedIncreaseRate

  // Initialization state
  private isTrackInitialized: boolean = false
  private isPlayerInitialized: boolean = false

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): WorldConfig {
    if (!WorldConfig.instance) {
      WorldConfig.instance = new WorldConfig()
    }
    return WorldConfig.instance
  }

  /**
   * Set the track surface height (called by TrackManager after loading)
   * @param height - The Y coordinate of the track's walking surface
   */
  setTrackSurfaceHeight(height: number): void {
    this.trackSurfaceHeight = height
    this.isTrackInitialized = true
  }

  /**
   * Get the track surface height
   * Logs a warning if called before track initialization
   * @returns The track surface height (default 1.3 if not initialized)
   */
  getTrackSurfaceHeight(): number {
    if (!this.isTrackInitialized) {
      console.warn(
        '[WorldConfig] getTrackSurfaceHeight() called before track initialization. ' +
        `Using default value: ${DEFAULT_TRACK_SURFACE_HEIGHT}`
      )
    }
    return this.trackSurfaceHeight
  }

  /**
   * Set the player dimensions (called by PlayerManager after loading model)
   * @param dimensions - The player collision box dimensions
   */
  setPlayerDimensions(dimensions: PlayerDimensions): void {
    this.playerDimensions = { ...dimensions }
    this.isPlayerInitialized = true
  }

  /**
   * Get the player dimensions
   * @returns The player dimensions (defaults if not initialized)
   */
  getPlayerDimensions(): PlayerDimensions {
    return { ...this.playerDimensions }
  }

  /**
   * Check if both track and player are initialized
   * @returns true if both track surface height and player dimensions are set
   */
  isInitialized(): boolean {
    return this.isTrackInitialized && this.isPlayerInitialized
  }

  /**
   * Check if track surface height is initialized
   * @returns true if track surface height has been set
   */
  isTrackSurfaceInitialized(): boolean {
    return this.isTrackInitialized
  }

  /**
   * Check if player dimensions are initialized
   * @returns true if player dimensions have been set
   */
  isPlayerDimensionsInitialized(): boolean {
    return this.isPlayerInitialized
  }

  // ============================================
  // Speed Configuration (centralized)
  // ============================================

  /**
   * Set speed configuration (called during initialization)
   * @param base - Starting speed (units/sec)
   * @param max - Maximum speed cap
   * @param rate - Speed increase per second
   */
  setSpeedConfig(base: number, max: number, rate: number): void {
    this.baseSpeed = base
    this.maxSpeed = max
    this.speedIncreaseRate = rate
  }

  /**
   * Get base speed (starting speed)
   */
  getBaseSpeed(): number {
    return this.baseSpeed
  }

  /**
   * Get maximum speed cap
   */
  getMaxSpeed(): number {
    return this.maxSpeed
  }

  /**
   * Get speed increase rate (per second)
   */
  getSpeedIncreaseRate(): number {
    return this.speedIncreaseRate
  }

  /**
   * Reset the WorldConfig state
   * Used for testing or when starting a new game session
   */
  reset(): void {
    this.trackSurfaceHeight = DEFAULT_TRACK_SURFACE_HEIGHT
    this.playerDimensions = { ...DEFAULT_PLAYER_DIMENSIONS }
    this.baseSpeed = DEFAULT_SPEED_CONFIG.baseSpeed
    this.maxSpeed = DEFAULT_SPEED_CONFIG.maxSpeed
    this.speedIncreaseRate = DEFAULT_SPEED_CONFIG.speedIncreaseRate
    this.isTrackInitialized = false
    this.isPlayerInitialized = false
  }

  /**
   * Reset the singleton instance (primarily for testing)
   * This completely destroys the instance so a fresh one is created
   */
  static resetInstance(): void {
    WorldConfig.instance = null
  }
}

/**
 * Export default values for testing and reference
 */
export const WORLD_CONFIG_DEFAULTS = {
  trackSurfaceHeight: DEFAULT_TRACK_SURFACE_HEIGHT,
  playerDimensions: DEFAULT_PLAYER_DIMENSIONS,
  speedConfig: DEFAULT_SPEED_CONFIG,
} as const
