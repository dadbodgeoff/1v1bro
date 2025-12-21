/**
 * ThemeAdapter - Bridges the theme system to existing survival code
 * 
 * This adapter converts theme config into the formats expected by
 * existing managers (ObstacleManager, TrackManager, SpaceBackground, etc.)
 * without requiring rewrites of those systems.
 */

import type { MapTheme, ObstacleVisualConfig, CollisionBoxConfig } from './types'
import type { SurvivalAssets, ObstacleType, Lane } from '../../types/survival'
import type { SpaceBackgroundConfig } from '../../space/SpaceBackground'
import type { CityScapeConfig } from '../../space/CityScape'
// Import themes directly to avoid circular dependency with index.ts
import { ZEN_GARDEN_THEME } from './zen-garden'

/**
 * Current active theme - lazy initialized to avoid circular dependency
 */
let activeTheme: MapTheme | null = null

/**
 * Get the default theme (avoids circular import)
 */
function getDefaultThemeInternal(): MapTheme {
  return ZEN_GARDEN_THEME
}

/**
 * Set the active theme
 */
export function setActiveTheme(theme: MapTheme): void {
  activeTheme = theme
}

/**
 * Get the active theme
 */
export function getActiveTheme(): MapTheme {
  if (!activeTheme) {
    activeTheme = getDefaultThemeInternal()
  }
  return activeTheme
}

/**
 * Convert theme assets to legacy SurvivalAssets format
 * Used by AssetLoader
 */
export function getThemeAssets(theme?: MapTheme): SurvivalAssets {
  const t = theme ?? getActiveTheme()
  // Get character assets - use theme's or fall back to default
  const defaultTheme = getDefaultThemeInternal()
  const characterAssets = t.assets.character || defaultTheme.assets.character!
  
  return {
    track: {
      longTile: t.assets.track,
    },
    obstacles: {
      highBarrier: t.assets.obstacles.highBarrier,
      lowBarrier: t.assets.obstacles.lowBarrier,
      laneBarrier: t.assets.obstacles.laneBarrier,
      spikes: t.assets.obstacles.spikes,
      knowledgeGate: t.assets.obstacles.knowledgeGate || t.assets.obstacles.laneBarrier,
    },
    character: {
      runner: {
        run: characterAssets.run,
        jump: characterAssets.jump,
        down: characterAssets.down,
      },
    },
    celestials: t.assets.environment.celestials as SurvivalAssets['celestials'],
    environment: t.assets.environment.scenery 
      ? { city: t.assets.environment.scenery }
      : undefined,
    collectibles: t.assets.collectibles?.gem 
      ? { gem: t.assets.collectibles.gem }
      : undefined,
  }
}

/**
 * Get obstacle visual config for a specific type
 * Used by ObstacleManager.spawnClonedObstacle()
 */
export function getObstacleVisual(
  type: ObstacleType,
  theme?: MapTheme
): ObstacleVisualConfig {
  const t = theme ?? getActiveTheme()
  return t.obstacleVisuals[type] || {
    scale: 1.0,
    yOffset: 0,
    rotationY: 0,
    forceLane: null,
  }
}

/**
 * Get collision box config for a specific type
 * Used by ObstacleManager.createCollisionBox()
 */
export function getCollisionBox(
  type: ObstacleType,
  theme?: MapTheme
): CollisionBoxConfig {
  const t = theme ?? getActiveTheme()
  return t.collisionBoxes[type] || {
    halfWidth: 1.0,
    minY: 0,
    maxY: 2.0,
    halfDepth: 0.5,
  }
}

/**
 * Create collision box from theme config
 * Drop-in replacement for ObstacleManager.createCollisionBox()
 */
export function createCollisionBoxFromTheme(
  type: ObstacleType,
  lane: Lane,
  z: number,
  laneWidth: number,
  baseY: number,
  theme?: MapTheme
): { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number } {
  const t = theme ?? getActiveTheme()
  const config = getCollisionBox(type, t)
  const x = lane * laneWidth
  
  // Handle lane-spanning obstacles
  const halfWidth = config.spansAllLanes 
    ? laneWidth * 1.5 
    : config.halfWidth
  
  return {
    minX: config.spansAllLanes ? -halfWidth : x - halfWidth,
    maxX: config.spansAllLanes ? halfWidth : x + halfWidth,
    minY: baseY + config.minY,
    maxY: baseY + config.maxY,
    minZ: z - config.halfDepth,
    maxZ: z + config.halfDepth,
  }
}

/**
 * Get SpaceBackground config from theme
 */
export function getSpaceBackgroundConfig(theme?: MapTheme): Partial<SpaceBackgroundConfig> {
  const t = theme ?? getActiveTheme()
  const bg = t.background
  
  return {
    quality: 'medium',
    nebulaColors: bg.skyColors,
    shootingStarRate: bg.particles?.spawnRate,
  }
}

/**
 * Get CityScape config from theme
 */
export function getCityScapeConfig(theme?: MapTheme): Partial<CityScapeConfig> | null {
  const t = theme ?? getActiveTheme()
  const scenery = t.background.scenery
  
  if (!scenery?.enabled) {
    return null
  }
  
  return {
    scale: scenery.scale,
    yOffset: scenery.yOffset,
    xOffset: scenery.xOffset,
    zSpacing: scenery.zSpacing,
    instanceCount: scenery.instanceCount,
  }
}

/**
 * Get track scale from theme
 */
export function getTrackScale(theme?: MapTheme): number {
  const t = theme ?? getActiveTheme()
  return t.track.scale
}

/**
 * Get obstacle scale from theme
 */
export function getObstacleScale(theme?: MapTheme): number {
  const t = theme ?? getActiveTheme()
  // Use the average of obstacle scales, or default to 10
  const visuals = Object.values(t.obstacleVisuals)
  if (visuals.length === 0) return 10
  
  // The base scale multiplier (what gets passed to initialize())
  // Individual obstacles then apply their own scale on top
  return 10
}

/**
 * Get background color from theme
 */
export function getBackgroundColor(theme?: MapTheme): number {
  const t = theme ?? getActiveTheme()
  return t.background.backgroundColor
}

/**
 * Get fog config from theme
 */
export function getFogConfig(theme?: MapTheme): { color: number; density: number } | null {
  const t = theme ?? getActiveTheme()
  return t.background.fog || null
}

/**
 * Get lighting config from theme
 */
export function getLightingConfig(theme?: MapTheme): MapTheme['lighting'] {
  const t = theme ?? getActiveTheme()
  return t.lighting
}

/**
 * Get UI colors from theme
 */
export function getThemeColors(theme?: MapTheme): MapTheme['colors'] {
  const t = theme ?? getActiveTheme()
  return t.colors
}

/**
 * Check if stars should be enabled
 */
export function shouldShowStars(theme?: MapTheme): boolean {
  const t = theme ?? getActiveTheme()
  return t.background.stars?.enabled ?? true
}

/**
 * Get background image URL (for static image backgrounds)
 */
export function getBackgroundImage(theme?: MapTheme): string | undefined {
  const t = theme ?? getActiveTheme()
  return t.background.backgroundImage
}

/**
 * Check if theme uses static image background
 */
export function hasImageBackground(theme?: MapTheme): boolean {
  const t = theme ?? getActiveTheme()
  return !!t.background.backgroundImage
}

/**
 * Get celestial asset keys from theme
 */
export function getCelestialKeys(theme?: MapTheme): string[] {
  const t = theme ?? getActiveTheme()
  const celestials = t.assets.environment.celestials
  return celestials ? Object.keys(celestials) : []
}

/**
 * Check if theme forces its own character skin (overrides user's equipped cosmetic)
 */
export function shouldForceThemeCharacter(theme?: MapTheme): boolean {
  const t = theme ?? getActiveTheme()
  return t.forceThemeCharacter ?? false
}

/**
 * Get theme's character skin URLs (if theme has character assets)
 */
export function getThemeCharacterSkin(theme?: MapTheme): { run: string; jump: string; down: string } | null {
  const t = theme ?? getActiveTheme()
  return t.assets.character ?? null
}

/**
 * Get theme's character rotation (Y axis)
 * Default is Math.PI/2 for backward compatibility with space theme models
 */
export function getCharacterRotationY(theme?: MapTheme): number {
  const t = theme ?? getActiveTheme()
  return t.assets.character?.rotationY ?? Math.PI / 2
}

/**
 * Check if trivia is enabled for this theme
 * Default is true (trivia enabled)
 */
export function isTriviaEnabled(theme?: MapTheme): boolean {
  const t = theme ?? getActiveTheme()
  return t.triviaEnabled ?? true
}

/**
 * Check if ghost replay is enabled for this theme
 * Default is true (ghost enabled)
 */
export function isGhostEnabled(theme?: MapTheme): boolean {
  const t = theme ?? getActiveTheme()
  return t.ghostEnabled ?? true
}
