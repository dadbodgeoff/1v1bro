/**
 * Space Background System - Barrel Export
 * Enterprise-grade procedural space environment
 */

// Main coordinator
export { SpaceBackground } from './SpaceBackground'
export type { SpaceBackgroundConfig, SpaceBackgroundEvents } from './SpaceBackground'

// Components
export { StarField, DEFAULT_STAR_LAYERS } from './StarField'
export { NebulaBackground } from './NebulaBackground'
export { ShootingStars } from './ShootingStars'
export { CelestialManager } from './CelestialManager'
export { CityScape } from './CityScape'
export { SpaceParticles } from './SpaceParticles'
export type { SpaceParticlesConfig } from './SpaceParticles'

// Types
export type {
  StarLayerConfig,
  NebulaConfig,
  CelestialType,
  CelestialObject,
  CelestialSpawnConfig,
  ShootingStarConfig,
  ShootingStar,
  SpaceBackgroundState,
  QualityPreset,
  QualitySettings,
} from './types'

export { QUALITY_PRESETS } from './types'
