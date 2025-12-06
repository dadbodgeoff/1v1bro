/**
 * Space Void Layer
 * Deep black space background with subtle gradient
 */

import type { BackdropLayer, BackdropConfig } from '../types'

export class SpaceVoidLayer implements BackdropLayer {
  private config: BackdropConfig
  private gradient: CanvasGradient | null = null

  constructor(config: BackdropConfig) {
    this.config = config
  }

  update(_deltaTime: number, _time: number): void {
    // Static layer
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.config

    // Create gradient once
    if (!this.gradient) {
      this.gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        width * 0.8
      )
      // Deep space - almost pure black with subtle blue tint
      this.gradient.addColorStop(0, '#0a0a12')
      this.gradient.addColorStop(0.5, '#050508')
      this.gradient.addColorStop(1, '#020204')
    }

    ctx.fillStyle = this.gradient
    ctx.fillRect(0, 0, width, height)
  }
}
