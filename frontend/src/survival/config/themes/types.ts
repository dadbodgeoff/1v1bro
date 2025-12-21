/**
 * Map Theme System - Type Definitions
 * 
 * Consolidates all map-specific configuration into a single theme definition.
 * Swap themes to completely change the visual style without touching game logic.
 */

import type { ObstacleType, Lane } from '../../types/survival'

/**
 * Asset URLs for a theme
 */
export interface ThemeAssets {
  /** Track tile model */
  track: string
  
  /** Obstacle models by type */
  obstacles: {
    highBarrier: string    // Slide under
    lowBarrier: string     // Jump over
    laneBarrier: string    // Dodge left/right
    spikes: string         // Ground hazard
    knowledgeGate?: string // Trivia trigger (optional)
  }
  
  /** Background/environment models */
  environment: {
    /** Repeating scenery on sides of track (like city skyline) */
    scenery?: string
    /** Celestial/background objects that float by */
    celestials?: Record<string, string>
  }
  
  /** Collectible models */
  collectibles?: {
    gem?: string
    [key: string]: string | undefined
  }
  
  /** Character models (optional - can use default) */
  character?: {
    run: string
    jump: string
    down: string
    /** Y rotation in radians (default: Math.PI/2 for space theme models) */
    rotationY?: number
  }
}

/**
 * Obstacle visual configuration
 * Defines how each obstacle type is positioned and scaled
 */
export interface ObstacleVisualConfig {
  /** Scale multiplier for the model */
  scale: number
  /** Y offset from track surface */
  yOffset: number
  /** Y rotation in radians (0 = facing forward) */
  rotationY?: number
  /** Force to specific lane (-1, 0, 1) or null for any */
  forceLane?: Lane | null
}

/**
 * Collision box dimensions
 * Defines the hitbox for each obstacle type
 */
export interface CollisionBoxConfig {
  /** Half-width (extends both directions from center) */
  halfWidth: number
  /** Min Y relative to track surface */
  minY: number
  /** Max Y relative to track surface */
  maxY: number
  /** Half-depth (extends both directions from center) */
  halfDepth: number
  /** If true, spans all lanes (ignores lane position) */
  spansAllLanes?: boolean
}

/**
 * Background/environment configuration
 */
export interface BackgroundConfig {
  /** Scene background color */
  backgroundColor: number
  
  /** Static background image URL (alternative to procedural nebula) */
  backgroundImage?: string
  
  /** Fog configuration */
  fog?: {
    color: number
    density: number
  }
  
  /** Nebula/sky gradient colors [top, middle, bottom] */
  skyColors?: [number, number, number]
  
  /** Star field configuration */
  stars?: {
    enabled: boolean
    count?: number
    color?: number
  }
  
  /** Shooting stars / particle effects */
  particles?: {
    shootingStars?: boolean
    cosmicDust?: boolean
    spawnRate?: number
  }
  
  /** Side scenery configuration (city, mountains, etc.) */
  scenery?: {
    enabled: boolean
    scale: number
    yOffset: number      // Below track
    xOffset: number      // Distance from track center
    zSpacing: number     // Distance between instances
    instanceCount: number
  }
}

/**
 * Lighting configuration
 */
export interface LightingConfig {
  /** Ambient light */
  ambient: {
    color: number
    intensity: number
  }
  
  /** Directional light (sun/moon) */
  directional?: {
    color: number
    intensity: number
    position: { x: number; y: number; z: number }
    castShadow?: boolean
  }
  
  /** Point lights for atmosphere */
  pointLights?: Array<{
    color: number
    intensity: number
    position: { x: number; y: number; z: number }
    distance?: number
  }>
}

/**
 * Complete map theme definition
 */
export interface MapTheme {
  /** Unique theme identifier */
  id: string
  
  /** Display name */
  name: string
  
  /** Theme description */
  description: string
  
  /** Preview image URL (for theme selector) */
  previewImage?: string
  
  /** Asset URLs */
  assets: ThemeAssets
  
  /** Obstacle visual configs by type */
  obstacleVisuals: Record<ObstacleType, ObstacleVisualConfig>
  
  /** Collision box configs by type */
  collisionBoxes: Record<ObstacleType, CollisionBoxConfig>
  
  /** Background/environment config */
  background: BackgroundConfig
  
  /** Lighting config */
  lighting: LightingConfig
  
  /** Track configuration */
  track: {
    /** Scale multiplier */
    scale: number
    /** Tile depth (calculated from model if not specified) */
    tileDepth?: number
  }
  
  /** Brand/accent colors for UI elements */
  colors: {
    primary: number
    secondary: number
    accent: number
    danger: number
  }
  
  /** 
   * Force theme's character skin instead of user's equipped cosmetic
   * Useful for themed maps where the character should match the aesthetic
   */
  forceThemeCharacter?: boolean
  
  /**
   * Enable/disable trivia billboards for this theme
   * Default: true (trivia enabled)
   */
  triviaEnabled?: boolean
  
  /**
   * Enable/disable ghost replay (racing against your best run)
   * Default: true (ghost enabled)
   */
  ghostEnabled?: boolean
}

/**
 * Theme registry for managing multiple themes
 */
export interface ThemeRegistry {
  themes: Map<string, MapTheme>
  defaultThemeId: string
}
