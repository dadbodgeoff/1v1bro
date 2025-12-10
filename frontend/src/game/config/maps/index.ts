/**
 * Map Configuration Exports
 * @module config/maps
 */

// Export map schema types and validation
export type {
  MapConfig,
  MapMetadata,
  TileDefinition,
  SpawnPointConfig
} from './map-schema'

export {
  validateMapConfig,
  rectanglesOverlap,
  pixelToGrid,
  isValidGridPosition
} from './map-schema'

// Export map configurations
export { NEXUS_ARENA } from './nexus-arena'
export { VORTEX_ARENA } from './vortex-arena'
export { INDUSTRIAL_FACILITY, INDUSTRIAL_FACILITY_INFO, INDUSTRIAL_FACILITY_DIMENSIONS } from './industrial-facility'

// Export map loading utilities
export {
  getMapConfig,
  getAvailableMaps,
  isValidMapSlug,
  getMapInfo,
  AVAILABLE_MAPS,
  type MapInfo,
} from './map-loader'
