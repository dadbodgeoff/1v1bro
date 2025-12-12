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
export { VORTEX_ARENA } from './vortex-arena'
export { SIMPLE_ARENA, SIMPLE_TILE_SIZE, SIMPLE_ARENA_SIZE } from './simple-arena'

// Export map loading utilities
export {
  getMapConfig,
  getAvailableMaps,
  isValidMapSlug,
  getMapInfo,
  AVAILABLE_MAPS,
  type MapInfo,
} from './map-loader'
