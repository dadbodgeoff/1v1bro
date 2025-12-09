/**
 * AAA Arena Visual System
 * @module visual
 *
 * This module provides production-quality 2D graphics for the arena PvP system.
 * It includes six core visual subsystems:
 *
 * 1. TileArtSystem - Procedural textures with cracks, weathering, and baked lighting
 * 2. ParallaxDepthSystem - Enhanced 4-layer backdrop with environmental detail
 * 3. EnvironmentalPropSystem - Decorative elements (chains, crystals, steam vents)
 * 4. DynamicLightingSystem - Light sources from lava with rim lighting and player underglow
 * 5. AnimationLifeSystem - Animated lava, steam particles, environmental events
 * 6. VisualHierarchySystem - Clear contrast between gameplay and decorative elements
 *
 * Plus supporting systems:
 * - ThemeAssetLoader - Structured asset pipeline for themes
 * - QualityManager - Performance-based quality scaling
 */

// Core visual systems
export { TileArtSystem } from './TileArtSystem'
export { ParallaxDepthSystem } from './ParallaxDepthSystem'
export { EnvironmentalPropSystem } from './EnvironmentalPropSystem'
export { DynamicLightingSystem } from './DynamicLightingSystem'
export { AnimationLifeSystem } from './AnimationLifeSystem'
export { VisualHierarchySystem } from './VisualHierarchySystem'

// Supporting systems
export { ThemeAssetLoader } from './ThemeAssetLoader'
export { QualityManager } from './QualityManager'

// Coordinator
export { VisualSystemCoordinator } from './VisualSystemCoordinator'
export type { VisualCoordinatorConfig } from './VisualSystemCoordinator'

// Types
export type {
  // Core types
  Vector2,
  Rect,
  // Theme types
  ThemePalette,
  TileArtConfig,
  LightingConfig,
  ThemeManifest,
  // Tile types
  TileType,
  EdgeFlags,
  TileTexture,
  // Parallax types
  ParallaxLayer,
  LayerElement,
  // Prop types
  PropCategory,
  PropLayer,
  PropDefinition,
  PropInstance,
  PropAnchor,
  // Lighting types
  LightSource,
  HazardZone,
  // Animation types
  AnimatedElement,
  EnvironmentalEvent,
  ParticleEmitterConfig,
  // Quality types
  QualityPreset,
  QualitySettings,
  // Visual hierarchy types
  HierarchyConfig,
  // Validation types
  ValidationResult,
} from './types'
