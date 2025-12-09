/**
 * VisualSystemCoordinator - Orchestrates all AAA visual systems
 * 
 * This coordinator manages the lifecycle and integration of all visual subsystems:
 * - TileArtSystem: Procedural tile textures
 * - ParallaxDepthSystem: 4-layer parallax backdrop
 * - EnvironmentalPropSystem: Decorative props
 * - DynamicLightingSystem: Real-time lighting
 * - AnimationLifeSystem: Environmental animations
 * - VisualHierarchySystem: Gameplay clarity post-processing
 * 
 * @module visual/VisualSystemCoordinator
 */

import { TileArtSystem } from './TileArtSystem'
import { ParallaxDepthSystem } from './ParallaxDepthSystem'
import { EnvironmentalPropSystem } from './EnvironmentalPropSystem'
import { DynamicLightingSystem } from './DynamicLightingSystem'
import { AnimationLifeSystem } from './AnimationLifeSystem'
import { VisualHierarchySystem } from './VisualHierarchySystem'
import { ThemeAssetLoader } from './ThemeAssetLoader'
import { QualityManager } from './QualityManager'
import type {
  ThemeManifest,
  HierarchyConfig,
  HazardZone,
  PropAnchor,
  Vector2,
  Rect,
  EdgeFlags,
} from './types'

// Default volcanic theme manifest
const DEFAULT_VOLCANIC_MANIFEST: ThemeManifest = {
  id: 'volcanic',
  name: 'Volcanic Cavern',
  version: '1.0.0',
  palette: {
    primary: '#ff4400',
    secondary: '#ff6600',
    background: '#1a0a0a',
    platform: '#2d2d2d',
    hazard: '#ff2200',
  },
  tileConfig: {
    seed: 42,
    crackDensity: 0.3,
    weatheringIntensity: 0.5,
    edgeErosion: true,
  },
  lighting: {
    ambientColor: '#1a0505',
    ambientIntensity: 0.3,
    rimLightingEnabled: true,
    rimLightColor: '#ff6600',
    rimLightWidth: 3,
  },
}

const DEFAULT_HIERARCHY_CONFIG: HierarchyConfig = {
  platformBrightness: 1.2,
  backgroundDesaturation: 0.4,
  backgroundBlur: 3,
  hazardContrastRatio: 4.5,
  vignetteIntensity: 0.25,
  vignetteRadius: 0.7,
}

export interface VisualCoordinatorConfig {
  width: number
  height: number
  themeId?: string
  enableAAA?: boolean // Toggle for AAA visuals (default: true)
}

export class VisualSystemCoordinator {
  // Core systems
  private tileArtSystem: TileArtSystem | null = null
  private parallaxDepthSystem: ParallaxDepthSystem | null = null
  private environmentalPropSystem: EnvironmentalPropSystem | null = null
  private dynamicLightingSystem: DynamicLightingSystem | null = null
  private animationLifeSystem: AnimationLifeSystem | null = null
  private visualHierarchySystem: VisualHierarchySystem | null = null

  // Supporting systems
  private themeAssetLoader: ThemeAssetLoader
  private qualityManager: QualityManager

  // State
  private config: VisualCoordinatorConfig
  private manifest: ThemeManifest | null = null
  private initialized = false
  private enabled = true
  private time = 0

  constructor(config: VisualCoordinatorConfig) {
    this.config = config
    this.enabled = config.enableAAA !== false
    this.themeAssetLoader = new ThemeAssetLoader()
    this.qualityManager = new QualityManager()
  }

  /**
   * Initialize all visual systems with theme
   */
  async initialize(themeId: string = 'volcanic'): Promise<void> {
    if (!this.enabled) return

    try {
      // Try to load theme manifest, fall back to default
      try {
        this.manifest = await this.themeAssetLoader.loadTheme(themeId)
      } catch {
        console.warn(`Failed to load theme ${themeId}, using default volcanic theme`)
        this.manifest = DEFAULT_VOLCANIC_MANIFEST
      }

      const { width, height } = this.config
      const qualitySettings = this.qualityManager.getSettings()

      // Initialize TileArtSystem
      this.tileArtSystem = new TileArtSystem(
        this.manifest.tileConfig || DEFAULT_VOLCANIC_MANIFEST.tileConfig!,
        this.manifest.palette
      )

      // Initialize ParallaxDepthSystem (respects quality settings)
      if (qualitySettings.parallaxLayers >= 2) {
        this.parallaxDepthSystem = new ParallaxDepthSystem(width, height, this.manifest)
      }

      // Initialize EnvironmentalPropSystem
      this.environmentalPropSystem = new EnvironmentalPropSystem()
      await this.environmentalPropSystem.loadDefinitions(themeId).catch(() => {
        console.warn('No prop definitions found for theme')
      })

      // Initialize DynamicLightingSystem (respects quality settings)
      if (qualitySettings.dynamicLightingEnabled) {
        this.dynamicLightingSystem = new DynamicLightingSystem(
          this.manifest.lighting || DEFAULT_VOLCANIC_MANIFEST.lighting!
        )
      }

      // Initialize AnimationLifeSystem (respects quality settings)
      if (qualitySettings.animatedTilesEnabled) {
        this.animationLifeSystem = new AnimationLifeSystem()
        this.animationLifeSystem.setArenaDimensions(width, height)
      }

      // Initialize VisualHierarchySystem
      this.visualHierarchySystem = new VisualHierarchySystem(DEFAULT_HIERARCHY_CONFIG)

      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize visual systems:', error)
      this.enabled = false
    }
  }

  /**
   * Check if AAA visuals are enabled and initialized
   */
  isEnabled(): boolean {
    return this.enabled && this.initialized
  }

  /**
   * Get quality manager for external access
   */
  getQualityManager(): QualityManager {
    return this.qualityManager
  }

  /**
   * Get current theme manifest
   */
  getManifest(): ThemeManifest | null {
    return this.manifest
  }

  // ============================================================================
  // Hazard and Prop Integration
  // ============================================================================

  /**
   * Register hazard zones for lighting
   */
  registerHazards(hazards: HazardZone[]): void {
    if (!this.enabled) return

    this.dynamicLightingSystem?.createLightsFromHazards(hazards)

    // Register lava animations for damage hazards
    for (const hazard of hazards) {
      if (hazard.type === 'damage') {
        this.animationLifeSystem?.registerLavaAnimation(hazard.id, {
          x: hazard.bounds.x + hazard.bounds.width / 2,
          y: hazard.bounds.y + hazard.bounds.height / 2,
        })
      }
    }
  }

  /**
   * Place props from map configuration
   */
  placeProps(anchors: PropAnchor[]): void {
    if (!this.enabled) return
    this.environmentalPropSystem?.placePropsFromAnchors(anchors)
  }

  /**
   * Register steam vent for particle effects
   */
  registerSteamVent(propId: string, position: Vector2): void {
    if (!this.enabled) return
    this.animationLifeSystem?.registerSteamVent(propId, position)
  }

  // ============================================================================
  // Update Loop
  // ============================================================================

  /**
   * Update all visual systems
   */
  update(deltaTime: number): void {
    if (!this.enabled) return

    this.time += deltaTime

    // Record frame time for quality auto-adjustment
    const frameStart = performance.now()

    // Update systems
    this.animationLifeSystem?.update(deltaTime)
    this.dynamicLightingSystem?.update(deltaTime)
    this.environmentalPropSystem?.update(deltaTime)

    // Check for quality auto-adjustment
    const frameTime = performance.now() - frameStart
    this.qualityManager.recordFrameTime(frameTime)
    
    if (this.qualityManager.shouldReduceQuality()) {
      this.qualityManager.autoAdjustQuality()
    }
  }

  /**
   * Update camera position for parallax
   */
  updateCameraPosition(position: Vector2): void {
    if (!this.enabled) return
    this.parallaxDepthSystem?.updateCameraPosition(position)
  }

  // ============================================================================
  // Rendering
  // ============================================================================

  /**
   * Render parallax background layers (before gameplay)
   */
  renderBackground(ctx: CanvasRenderingContext2D): void {
    if (!this.enabled || !this.parallaxDepthSystem) return
    this.parallaxDepthSystem.render(ctx)
  }

  /**
   * Render background props (before platforms)
   */
  renderBackgroundProps(ctx: CanvasRenderingContext2D): void {
    if (!this.enabled || !this.environmentalPropSystem) return
    this.environmentalPropSystem.render(ctx, 'background')
  }

  /**
   * Render gameplay props (with platforms)
   */
  renderGameplayProps(ctx: CanvasRenderingContext2D): void {
    if (!this.enabled || !this.environmentalPropSystem) return
    this.environmentalPropSystem.render(ctx, 'gameplay')
  }

  /**
   * Render foreground props (after players)
   */
  renderForegroundProps(ctx: CanvasRenderingContext2D): void {
    if (!this.enabled || !this.environmentalPropSystem) return
    this.environmentalPropSystem.render(ctx, 'foreground')
  }

  /**
   * Render environmental events (debris, lava bursts)
   */
  renderEnvironmentalEvents(ctx: CanvasRenderingContext2D): void {
    if (!this.enabled || !this.animationLifeSystem) return
    this.animationLifeSystem.renderEvents(ctx)
  }

  /**
   * Apply rim lighting to platform
   */
  applyRimLighting(
    ctx: CanvasRenderingContext2D,
    platformBounds: Rect,
    edges: EdgeFlags
  ): void {
    if (!this.enabled || !this.dynamicLightingSystem) return
    this.dynamicLightingSystem.applyRimLighting(ctx, platformBounds, edges)
  }

  /**
   * Apply player underglow effect
   */
  applyPlayerUnderglow(
    ctx: CanvasRenderingContext2D,
    playerPosition: Vector2,
    playerRadius: number
  ): void {
    if (!this.enabled || !this.dynamicLightingSystem) return
    this.dynamicLightingSystem.applyPlayerUnderglow(ctx, playerPosition, playerRadius)
  }

  /**
   * Apply hazard indicators
   */
  applyHazardIndicators(
    ctx: CanvasRenderingContext2D,
    hazards: HazardZone[],
    playerPosition: Vector2 | null
  ): void {
    if (!this.enabled || !this.visualHierarchySystem) return
    this.visualHierarchySystem.applyHazardIndicators(ctx, hazards, playerPosition, this.time)
  }

  /**
   * Apply vignette effect (final pass)
   */
  applyVignette(ctx: CanvasRenderingContext2D): void {
    if (!this.enabled || !this.visualHierarchySystem) return
    
    const qualitySettings = this.qualityManager.getSettings()
    if (!qualitySettings.blurEffectsEnabled) return
    
    this.visualHierarchySystem.applyVignette(ctx)
  }

  // ============================================================================
  // Tile Art Integration
  // ============================================================================

  /**
   * Generate procedural tile texture
   */
  generateTileTexture(
    type: string,
    gridX: number,
    gridY: number,
    edges: EdgeFlags
  ): HTMLCanvasElement | null {
    if (!this.enabled || !this.tileArtSystem) return null
    
    const texture = this.tileArtSystem.generateTileTexture(
      type as import('./types').TileType,
      gridX,
      gridY,
      edges
    )
    return texture.canvas
  }

  /**
   * Check if player is in underglow range
   */
  isPlayerInUnderglowRange(playerPosition: Vector2): boolean {
    if (!this.enabled || !this.dynamicLightingSystem) return false
    return this.dynamicLightingSystem.isPlayerInUnderglowRange(playerPosition)
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  /**
   * Clean up resources
   */
  destroy(): void {
    this.environmentalPropSystem?.clearInstances()
    this.initialized = false
  }
}
