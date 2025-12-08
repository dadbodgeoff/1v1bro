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
