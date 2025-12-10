/**
 * Backdrop System
 * Coordinates all backdrop layers for rendering
 * Supports parallax scrolling based on camera position
 * Supports multiple themes: space (default), volcanic
 */

import type { BackdropConfig, BackdropLayer, CameraOffset } from './types'
import type { MapTheme } from '../config/maps/map-schema'
import {
  SpaceVoidLayer,
  NebulaLayer,
  StarFieldLayer,
  ShootingStarLayer,
  CosmicDustLayer,
  VolcanicCavernLayer,
  LavaGlowLayer,
  EmberParticleLayer,
  SmokeHazeLayer,
  IndustrialConcreteLayer,
  IndustrialLightingLayer,
  IndustrialDustLayer,
  IndustrialSparkLayer,
} from './layers'

interface LayerEntry {
  layer: BackdropLayer
  parallax: number
}

export class BackdropSystem {
  private config: BackdropConfig
  private layerEntries: LayerEntry[] = []
  private time = 0
  private cameraOffset: CameraOffset = { x: 0, y: 0 }
  private theme: MapTheme

  constructor(width: number, height: number, theme: MapTheme = 'space') {
    this.config = { width, height }
    this.theme = theme

    // Create layers based on theme
    if (theme === 'volcanic') {
      this.createVolcanicLayers()
    } else if (theme === 'industrial') {
      this.createIndustrialLayers()
    } else {
      this.createSpaceLayers()
    }
  }

  /**
   * Create space theme layers (default)
   */
  private createSpaceLayers(): void {
    // 1. Deep black void (fixed, no parallax)
    this.layerEntries.push({ layer: new SpaceVoidLayer(this.config), parallax: 0 })

    // 2. Distant nebula clouds (very slow parallax)
    this.layerEntries.push({ layer: new NebulaLayer(this.config), parallax: 0.1 })

    // 3. Star field with medium parallax
    this.layerEntries.push({ layer: new StarFieldLayer(this.config), parallax: 0.3 })

    // 4. Cosmic dust particles (faster parallax)
    this.layerEntries.push({ layer: new CosmicDustLayer(this.config), parallax: 0.5 })

    // 5. Occasional shooting stars (fastest parallax)
    this.layerEntries.push({ layer: new ShootingStarLayer(this.config), parallax: 0.7 })
  }

  /**
   * Create volcanic theme layers
   */
  private createVolcanicLayers(): void {
    // 1. Dark volcanic cavern background (fixed, no parallax)
    this.layerEntries.push({ layer: new VolcanicCavernLayer(this.config), parallax: 0 })

    // 2. Pulsing lava glow at edges (fixed)
    this.layerEntries.push({ layer: new LavaGlowLayer(this.config), parallax: 0 })

    // 3. Drifting smoke/haze (slow parallax)
    this.layerEntries.push({ layer: new SmokeHazeLayer(this.config), parallax: 0.2 })

    // 4. Floating ember particles (medium parallax)
    this.layerEntries.push({ layer: new EmberParticleLayer(this.config), parallax: 0.4 })
  }

  /**
   * Create industrial theme layers
   */
  private createIndustrialLayers(): void {
    // 1. Dark concrete/metal background (fixed, no parallax)
    this.layerEntries.push({ layer: new IndustrialConcreteLayer(this.config), parallax: 0 })

    // 2. Dim overhead lighting (fixed)
    this.layerEntries.push({ layer: new IndustrialLightingLayer(this.config), parallax: 0 })

    // 3. Floating dust particles (slow parallax)
    this.layerEntries.push({ layer: new IndustrialDustLayer(this.config), parallax: 0.2 })

    // 4. Occasional sparks (medium parallax)
    this.layerEntries.push({ layer: new IndustrialSparkLayer(this.config), parallax: 0.3 })
  }

  /**
   * Get current theme
   */
  getTheme(): MapTheme {
    return this.theme
  }

  /**
   * Set camera offset for parallax effect
   * Call this when camera/viewport moves
   */
  setCameraOffset(x: number, y: number): void {
    this.cameraOffset = { x, y }
  }

  /**
   * Update all animated layers
   */
  update(deltaTime: number): void {
    this.time += deltaTime

    for (const entry of this.layerEntries) {
      entry.layer.update(deltaTime, this.time)
    }
  }

  /**
   * Render all layers with parallax offset
   */
  render(ctx: CanvasRenderingContext2D): void {
    for (const entry of this.layerEntries) {
      ctx.save()
      
      // Apply parallax offset
      if (entry.parallax > 0) {
        const offsetX = this.cameraOffset.x * entry.parallax
        const offsetY = this.cameraOffset.y * entry.parallax
        ctx.translate(-offsetX, -offsetY)
      }
      
      entry.layer.render(ctx)
      ctx.restore()
    }
  }

  /**
   * Resize the backdrop
   */
  resize(width: number, height: number): void {
    this.config.width = width
    this.config.height = height
    // Note: Layers will need to reinitialize on next render
  }

  /**
   * Get all layers (for debugging)
   */
  get layers(): BackdropLayer[] {
    return this.layerEntries.map(e => e.layer)
  }
}
