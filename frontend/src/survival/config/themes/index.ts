/**
 * Map Theme System - Barrel Export
 * 
 * Import themes and the registry from here.
 */

// Types
export type {
  MapTheme,
  ThemeAssets,
  ObstacleVisualConfig,
  CollisionBoxConfig,
  BackgroundConfig,
  LightingConfig,
  ThemeRegistry,
} from './types'

// Built-in themes
export { SPACE_HIGHWAY_THEME } from './space-highway'
export { ZEN_GARDEN_THEME } from './zen-garden'

// Theme adapter (bridges to existing code)
export {
  setActiveTheme,
  getActiveTheme,
  getThemeAssets,
  getObstacleVisual,
  getCollisionBox,
  createCollisionBoxFromTheme,
  getSpaceBackgroundConfig,
  getCityScapeConfig,
  getTrackScale,
  getObstacleScale,
  getBackgroundColor,
  getFogConfig,
  getLightingConfig,
  getThemeColors,
  shouldShowStars,
  getBackgroundImage,
  hasImageBackground,
  getCelestialKeys,
  shouldForceThemeCharacter,
  getThemeCharacterSkin,
  getCharacterRotationY,
  isTriviaEnabled,
  isGhostEnabled,
} from './ThemeAdapter'

// Theme registry
import type { MapTheme, ThemeRegistry } from './types'
import { SPACE_HIGHWAY_THEME } from './space-highway'
import { ZEN_GARDEN_THEME } from './zen-garden'

/**
 * Global theme registry
 * Add new themes here to make them available
 */
const themes = new Map<string, MapTheme>()
themes.set(SPACE_HIGHWAY_THEME.id, SPACE_HIGHWAY_THEME)
themes.set(ZEN_GARDEN_THEME.id, ZEN_GARDEN_THEME)

export const THEME_REGISTRY: ThemeRegistry = {
  themes,
  defaultThemeId: 'zen-garden', // Switch to new theme as default for testing
}

/**
 * Get a theme by ID
 */
export function getTheme(id: string): MapTheme | undefined {
  return THEME_REGISTRY.themes.get(id)
}

/**
 * Get the default theme
 */
export function getDefaultTheme(): MapTheme {
  const theme = THEME_REGISTRY.themes.get(THEME_REGISTRY.defaultThemeId)
  if (!theme) {
    throw new Error(`Default theme '${THEME_REGISTRY.defaultThemeId}' not found`)
  }
  return theme
}

/**
 * Get all available theme IDs
 */
export function getAvailableThemeIds(): string[] {
  return Array.from(THEME_REGISTRY.themes.keys())
}

/**
 * Register a custom theme
 */
export function registerTheme(theme: MapTheme): void {
  THEME_REGISTRY.themes.set(theme.id, theme)
}
