/**
 * Map Loading Utility
 * 
 * Provides functions to load map configurations by slug.
 * Requirements: 4.2, 4.5
 */

import { VORTEX_ARENA } from './vortex-arena'
import { SIMPLE_ARENA } from './simple-arena'
import type { MapConfig } from './map-schema'

/**
 * Registry of available maps by slug.
 * Using Object.create(null) to avoid prototype pollution issues.
 */
const MAP_REGISTRY: Record<string, MapConfig> = Object.assign(Object.create(null), {
  'vortex-arena': VORTEX_ARENA,
  'simple-arena': SIMPLE_ARENA,
})

/**
 * Map metadata for UI display.
 */
export interface MapInfo {
  slug: string
  name: string
  description: string
  thumbnail: string
  theme: 'volcanic' | 'simple'
}

/**
 * Available maps with display metadata.
 * Runtime Ruins (simple-arena) is the default/primary map for quick play.
 * Vortex Arena is the secondary option.
 */
export const AVAILABLE_MAPS: MapInfo[] = [
  // Runtime Ruins - default quick play map
  {
    slug: 'simple-arena',
    name: 'Runtime Ruins',
    description: 'Ancient ruins simulated in a high-tech arena',
    thumbnail: '/maps/simple-arena-thumb.png',
    theme: 'simple',
  },
  // Vortex Arena - secondary map
  {
    slug: 'vortex-arena',
    name: 'Vortex Arena',
    description: 'Volcanic arena with rotating hazards',
    thumbnail: '/maps/vortex-arena-thumb.png',
    theme: 'volcanic',
  },
]

/**
 * Default map for quick play and fallback.
 */
export const DEFAULT_MAP = SIMPLE_ARENA
export const DEFAULT_MAP_SLUG = 'simple-arena'

/**
 * Get a map configuration by slug.
 * 
 * @param slug - Map slug (e.g., 'simple-arena', 'vortex-arena')
 * @returns MapConfig for the specified slug, or SIMPLE_ARENA (Runtime Ruins) if invalid/missing
 * 
 * Requirements: 4.2, 4.5
 */
export function getMapConfig(slug: string | undefined | null): MapConfig {
  if (!slug) {
    return SIMPLE_ARENA
  }
  return MAP_REGISTRY[slug] ?? SIMPLE_ARENA
}

/**
 * Get list of available map slugs.
 * 
 * @returns Array of valid map slugs
 */
export function getAvailableMaps(): string[] {
  return Object.keys(MAP_REGISTRY)
}

/**
 * Check if a map slug is valid.
 * 
 * @param slug - Map slug to check
 * @returns true if the slug corresponds to a valid map
 */
export function isValidMapSlug(slug: string): boolean {
  return slug in MAP_REGISTRY
}

/**
 * Get map info by slug.
 * 
 * @param slug - Map slug
 * @returns MapInfo or undefined if not found
 */
export function getMapInfo(slug: string): MapInfo | undefined {
  return AVAILABLE_MAPS.find(m => m.slug === slug)
}
