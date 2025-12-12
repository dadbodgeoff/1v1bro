/**
 * Category Configuration
 * 
 * Centralized category display config for enterprise configurability.
 * Colors reference CSS variables from tokens.css.
 * 
 * @module config/categories
 */

export interface CategoryDisplayConfig {
  icon: string
  /** CSS variable name for color (e.g., '--color-rarity-epic') */
  colorVar: string
  label: string
  /** Whether this category is enabled (default: true) */
  enabled?: boolean
}

/**
 * Default category display configuration
 * Colors use CSS variables for consistency with design system
 */
export const CATEGORY_DISPLAY_CONFIG: Record<string, CategoryDisplayConfig> = {
  fortnite: { 
    icon: '🎮', 
    colorVar: '--color-rarity-epic', // Purple
    label: 'Fortnite',
    enabled: true,
  },
  nfl: { 
    icon: '🏈', 
    colorVar: '--color-accent-success', // Green
    label: 'NFL',
    enabled: true,
  },
  sports: { 
    icon: '⚽', 
    colorVar: '--color-accent-info', // Blue
    label: 'Sports',
    enabled: true,
  },
  movies: { 
    icon: '🎬', 
    colorVar: '--color-accent-error', // Red
    label: 'Movies',
    enabled: true,
  },
  music: { 
    icon: '🎵', 
    colorVar: '--color-accent-error', // Pink (using error as closest)
    label: 'Music',
    enabled: true,
  },
  general: { 
    icon: '🧠', 
    colorVar: '--color-brand', // Orange
    label: 'General',
    enabled: true,
  },
}

/**
 * Fallback config for unknown categories
 */
export const FALLBACK_CATEGORY_CONFIG: CategoryDisplayConfig = {
  icon: '❓',
  colorVar: '--color-text-muted',
  label: 'Unknown',
  enabled: true,
}

/**
 * Get category display config with fallback
 */
export function getCategoryConfig(slug: string): CategoryDisplayConfig {
  return CATEGORY_DISPLAY_CONFIG[slug] || FALLBACK_CATEGORY_CONFIG
}

/**
 * Get CSS color value from variable name
 */
export function getCategoryColor(slug: string): string {
  const config = getCategoryConfig(slug)
  if (typeof window === 'undefined') {
    // SSR fallback colors
    const fallbacks: Record<string, string> = {
      '--color-rarity-epic': '#A855F7',
      '--color-accent-success': '#10B981',
      '--color-accent-info': '#3B82F6',
      '--color-accent-error': '#F43F5E',
      '--color-brand': '#F97316',
      '--color-text-muted': '#737373',
    }
    return fallbacks[config.colorVar] || '#737373'
  }
  return getComputedStyle(document.documentElement).getPropertyValue(config.colorVar).trim() || '#737373'
}

/**
 * Get all enabled categories
 */
export function getEnabledCategories(): Record<string, CategoryDisplayConfig> {
  return Object.fromEntries(
    Object.entries(CATEGORY_DISPLAY_CONFIG).filter(([, config]) => config.enabled !== false)
  )
}
