/**
 * Deep Space Layer
 * Renders the base gradient background
 */

import type { BackdropLayer, BackdropConfig } from '../types'

export class DeepSpaceLayer implements BackdropLayer {
  private config: BackdropConfig
  private gradient: CanvasGradient | null = null

  constructor(config: BackdropConfig) {
    this.config = config
  }

  update(_deltaTime: number, _time: number): void {
    // Static layer - no updates needed
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.config

    // Create gradient once and cache
    if (!this.gradient) {
      this.gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        width * 0.7
      )
      this.gradient.addColorStop(0, '#0a0a20')
      this.gradient.addColorStop(0.5, '#050515')
      this.gradient.addColorStop(1, '#020208')
    }

    ctx.fillStyle = this.gradient
    ctx.fillRect(0, 0, width, height)
  }
}
