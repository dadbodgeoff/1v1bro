/**
 * Backdrop System
 * Coordinates all backdrop layers for rendering
 */

import type { BackdropConfig, BackdropLayer } from './types'
import {
  SpaceVoidLayer,
  NebulaLayer,
  StarFieldLayer,
  ShootingStarLayer,
  CosmicDustLayer,
} from './layers'

export class BackdropSystem {
  private config: BackdropConfig
  private layers: BackdropLayer[] = []
  private time = 0

  constructor(width: number, height: number) {
    this.config = { width, height }

    // Create layers in render order (back to front)
    // 1. Deep black void
    this.layers.push(new SpaceVoidLayer(this.config))

    // 2. Distant nebula clouds (very subtle)
    this.layers.push(new NebulaLayer(this.config))

    // 3. Star field with parallax
    this.layers.push(new StarFieldLayer(this.config))

    // 4. Cosmic dust particles
    this.layers.push(new CosmicDustLayer(this.config))

    // 5. Occasional shooting stars
    this.layers.push(new ShootingStarLayer(this.config))
  }

  /**
   * Update all animated layers
   */
  update(deltaTime: number): void {
    this.time += deltaTime

    for (const layer of this.layers) {
      layer.update(deltaTime, this.time)
    }
  }

  /**
   * Render all layers
   */
  render(ctx: CanvasRenderingContext2D): void {
    for (const layer of this.layers) {
      layer.render(ctx)
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
}
