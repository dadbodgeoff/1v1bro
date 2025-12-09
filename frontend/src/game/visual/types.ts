/**
 * Shared types for the AAA Arena Visual System
 * @module visual/types
 */

// ============================================================================
// Core Types
// ============================================================================

export interface Vector2 {
  x: number
  y: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

// ============================================================================
// Theme Types
// ============================================================================

export interface ThemePalette {
  primary: string
  secondary: string
  background: string
  platform: string
  hazard: string
  interactive?: string
}

export interface TileArtConfig {
  seed: number
  crackDensity: number // 0-1, density of crack patterns
  weatheringIntensity: number // 0-1, amount of color variation
  edgeErosion: boolean // Enable crumbling edge effects
}

export interface LightingConfig {
  ambientColor: string
  ambientIntensity: number
  rimLightingEnabled: boolean
  rimLightColor: string
  rimLightWidth: number
}

export interface ThemeManifest {
  id: string
  name: string
  version: string
  palette: ThemePalette
  tileConfig: TileArtConfig
  lighting: LightingConfig
  props?: PropDefinition[]
}


// ============================================================================
// Tile Types
// ============================================================================

export type TileType = 'platform' | 'wall' | 'hazard' | 'background'

export interface EdgeFlags {
  top: boolean // Adjacent to empty space above
  right: boolean // Adjacent to empty space right
  bottom: boolean // Adjacent to empty space below
  left: boolean // Adjacent to empty space left
}

export interface TileTexture {
  canvas: HTMLCanvasElement
  width: number
  height: number
  edges: EdgeFlags
}

// ============================================================================
// Parallax Types
// ============================================================================

export interface ParallaxLayer {
  id: string
  depth: number // 0=far, 1=mid, 2=gameplay, 3=foreground
  scrollRatio: number // Movement relative to camera
  canvas: OffscreenCanvas | null // Pre-rendered static content
  elements: LayerElement[]
  isStatic: boolean // Can be cached
}

export interface LayerElement {
  type: 'sprite' | 'procedural' | 'particle'
  sprite?: HTMLImageElement
  position: Vector2
  size: Vector2
  alpha: number
  parallaxOffset: Vector2 // Additional per-element offset
}

// ============================================================================
// Prop Types
// ============================================================================

export type PropCategory = 'structural' | 'organic' | 'atmospheric'
export type PropLayer = 'background' | 'gameplay' | 'foreground'

export interface PropDefinition {
  id: string
  category: PropCategory
  sprite: string // Path relative to theme/props/
  size: { width: number; height: number }
  anchor: { x: number; y: number } // 0-1 normalized
  animation?: {
    frames: number
    frameRate: number
    loop: boolean
  }
  particles?: ParticleEmitterConfig
}

export interface PropInstance {
  id: string
  definitionId: string
  position: Vector2
  layer: PropLayer
  rotation: number
  scale: number
  currentFrame: number
  animationTime: number
  phaseOffset: number // Stagger timing
}

export interface PropAnchor {
  id: string
  definitionId: string
  position: Vector2
  layer: PropLayer
  rotation?: number
  scale?: number
}

// ============================================================================
// Lighting Types
// ============================================================================

export interface LightSource {
  id: string
  position: Vector2
  color: string
  intensity: number // 0-1
  radius: number
  falloff: 'linear' | 'quadratic'
  animation?: {
    type: 'pulse' | 'flicker'
    speed: number
    amplitude: number // 0-1, variation range
  }
}

export interface HazardZone {
  id: string
  type: 'damage' | 'slow' | 'bounce'
  bounds: Rect
  intensity: number
}

// ============================================================================
// Animation Types
// ============================================================================

export interface AnimatedElement {
  id: string
  type: 'lava' | 'steam' | 'debris' | 'event'
  position: Vector2
  frames: HTMLCanvasElement[]
  frameRate: number
  currentFrame: number
  phaseOffset: number
  loop: boolean
}

export interface EnvironmentalEvent {
  type: 'debris_fall' | 'lava_burst' | 'lightning'
  position: Vector2
  startTime: number
  duration: number
  progress: number
}

export interface ParticleEmitterConfig {
  type: string
  rate: number
  lifetime: { min: number; max: number }
}

// ============================================================================
// Quality Types
// ============================================================================

export type QualityPreset = 'low' | 'medium' | 'high' | 'ultra'

export interface QualitySettings {
  parallaxLayers: number
  particleMultiplier: number
  animatedTilesEnabled: boolean
  dynamicLightingEnabled: boolean
  blurEffectsEnabled: boolean
  maxDrawCalls: number
}

// ============================================================================
// Visual Hierarchy Types
// ============================================================================

export interface HierarchyConfig {
  platformBrightness: number // 1.0 = normal, 1.2 = 20% brighter
  backgroundDesaturation: number // 0-1, percentage to desaturate
  backgroundBlur: number // Pixels of blur
  hazardContrastRatio: number // Minimum contrast (4.5 for WCAG AA)
  vignetteIntensity: number // 0-1
  vignetteRadius: number // 0-1, percentage of screen
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
  valid: boolean
  errors: string[]
}
