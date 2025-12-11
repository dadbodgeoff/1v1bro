/**
 * Map Loading Utility
 * 
 * Provides functions to load map configurations by slug.
 * Requirements: 4.2, 4.5
 */

import { NEXUS_ARENA } from './nexus-arena'
import { VORTEX_ARENA } from './vortex-arena'
import { INDUSTRIAL_FACILITY } from './industrial-facility'
import type { MapConfig } from './map-schema'

/**
 * Registry of available maps by slug.
 * Using Object.create(null) to avoid prototype pollution issues.
 */
const MAP_REGISTRY: Record<string, MapConfig> = Object.assign(Object.create(null), {
  'nexus-arena': NEXUS_ARENA,
  'vortex-arena': VORTEX_ARENA,
  'industrial-facility': INDUSTRIAL_FACILITY,
})

/**
 * Map metadata for UI display.
 */
export interface MapInfo {
  slug: string
  name: string
  description: string
  thumbnail: string
  theme: 'space' | 'volcanic' | 'industrial'
}

/**
 * Feature flags for maps.
 * Set to true when maps are ready for production.
 */
const NEXUS_ARENA_ENABLED = false      // Basic first map - disabled for now
const INDUSTRIAL_MAP_ENABLED = false   // Tilesets not ready

/**
 * Available maps with display metadata.
 * Only Vortex Arena is currently enabled.
 */
export const AVAILABLE_MAPS: MapInfo[] = [
  // Vortex Arena - primary map
  {
    slug: 'vortex-arena',
    name: 'Vortex Arena',
    description: 'Volcanic arena with rotating hazards',
    thumbnail: '/maps/vortex-arena-thumb.png',
    theme: 'volcanic',
  },
  // Nexus Arena hidden until we want to bring it back
  ...(NEXUS_ARENA_ENABLED ? [{
    slug: 'nexus-arena',
    name: 'Nexus Arena',
    description: 'Classic three-lane space arena',
    thumbnail: '/maps/nexus-arena-thumb.png',
    theme: 'space' as const,
  }] : []),
  // Industrial map hidden behind feature flag until tilesets are ready
  ...(INDUSTRIAL_MAP_ENABLED ? [{
    slug: 'industrial-facility',
    name: 'Industrial Facility',
    description: 'Military facility with strategic cover and hazard zones',
    thumbnail: '/maps/industrial-facility-thumb.png',
    theme: 'industrial' as const,
  }] : []),
]

/**
 * Get a map configuration by slug.
 * 
 * @param slug - Map slug (e.g., 'nexus-arena', 'vortex-arena', 'industrial-facility')
 * @returns MapConfig for the specified slug, or VORTEX_ARENA if invalid/missing
 * 
 * Requirements: 4.2, 4.5
 */
export function getMapConfig(slug: string | undefined | null): MapConfig {
  if (!slug) {
    return VORTEX_ARENA
  }
  return MAP_REGISTRY[slug] ?? VORTEX_ARENA
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
