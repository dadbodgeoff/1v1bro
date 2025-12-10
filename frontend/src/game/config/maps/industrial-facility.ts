/**
 * Industrial Facility Map Configuration
 * 
 * A military-themed arena using the new industrial tilesets.
 * This is a pre-converted version of IndustrialArenaMap for direct use
 * with the game engine.
 * 
 * @module config/maps/industrial-facility
 */

import type { MapConfig } from './map-schema'
import { INDUSTRIAL_ARENA } from '../../terrain/IndustrialArenaMap'
import { convertArenaMapToConfig, getArenaMapDimensions } from '../../terrain/IndustrialMapConverter'

// ============================================================================
// Industrial Facility Map
// ============================================================================

/**
 * Pre-converted industrial facility map
 * Uses 80px tiles in a 16x9 grid (1280x720 pixels)
 */
export const INDUSTRIAL_FACILITY: MapConfig = convertArenaMapToConfig(INDUSTRIAL_ARENA)

/**
 * Get the dimensions of the industrial facility map
 */
export const INDUSTRIAL_FACILITY_DIMENSIONS = getArenaMapDimensions(INDUSTRIAL_ARENA)

/**
 * Industrial map metadata for selection UI
 */
export const INDUSTRIAL_FACILITY_INFO = {
  id: 'industrial-facility',
  name: INDUSTRIAL_ARENA.name,
  description: 'A gritty military facility with strategic cover, hazard zones, and industrial aesthetics.',
  thumbnail: '/maps/industrial-facility-thumb.png',
  dimensions: INDUSTRIAL_FACILITY_DIMENSIONS,
  features: [
    'Strategic cover positions (crates, barrels, barriers)',
    'Hazard zones (toxic waste, fire)',
    'Health and ammo pickups',
    'Chain-link fence border',
  ],
}
