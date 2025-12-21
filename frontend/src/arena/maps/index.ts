/**
 * Maps Module - Public API
 *
 * Exports the map registry, loader, and type definitions for the
 * data-driven map system.
 *
 * @module maps
 */

// Core services
export { MapRegistry, DuplicateMapIdError } from './MapRegistry';
export { MapLoader } from './MapLoader';

// Types
export type {
  Position3,
  Vector3Config,
  TrackConfig,
  ColorConfig,
  ArenaConfig,
  TextureAssets,
  ModelAssets,
  AssetManifest,
  AmbientLightConfig,
  DirectionalLightConfig,
  PointLightConfig,
  PointLightType,
  LightingConfig,
  PropPlacement,
  PropInstance,
  MapDefinition,
} from './types';

// Constants
export { POINT_LIGHT_PRIORITY } from './types';

export type {
  LoadedTextures,
  LoadedModels,
  LoadedMap,
  LoadProgress,
  ProgressCallback,
  MapLoadErrorType,
  MapLoadError,
} from './MapLoader';

// Map definitions (auto-registers on import)
export * from './definitions';
