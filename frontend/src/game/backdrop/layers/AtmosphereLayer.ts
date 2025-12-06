/**
 * Atmosphere Layer
 * Renders vignette, scan lines, and edge glow effects
 */

import type { BackdropLayer, BackdropConfig } from '../types'

export class AtmosphereLayer implements BackdropLayer {
  private config: BackdropConfig
  private vignetteGradient: CanvasGradient | null = null

  constructor(config: BackdropConfig) {
    this.config = config
  }

  update(_deltaTime: number, _time: number): void {
    // Static layer
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.renderVignette(ctx)
    this.renderScanLines(ctx)
    this.renderEdgeGlow(ctx)
  }

  private renderVignette(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.config

    if (!this.vignetteGradient) {
      this.vignetteGradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        height * 0.3,
        width / 2,
        height / 2,
        width * 0.8
      )
      this.vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
      this.vignetteGradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.2)')
      this.vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)')
    }

    ctx.fillStyle = this.vignetteGradient
    ctx.fillRect(0, 0, width, height)
  }

  private renderScanLines(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.config

    ctx.save()
    ctx.globalAlpha = 0.03
    ctx.fillStyle = '#000'

    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 2)
    }

    ctx.restore()
  }

  private renderEdgeGlow(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.config

    // Top edge - cyan glow
    const topGradient = ctx.createLinearGradient(0, 0, 0, 60)
    topGradient.addColorStop(0, 'rgba(0, 255, 255, 0.1)')
    topGradient.addColorStop(1, 'rgba(0, 255, 255, 0)')
    ctx.fillStyle = topGradient
    ctx.fillRect(0, 0, width, 60)

    // Bottom edge - magenta glow
    const bottomGradient = ctx.createLinearGradient(0, height - 60, 0, height)
    bottomGradient.addColorStop(0, 'rgba(255, 0, 255, 0)')
    bottomGradient.addColorStop(1, 'rgba(255, 0, 255, 0.1)')
    ctx.fillStyle = bottomGradient
    ctx.fillRect(0, height - 60, width, 60)
  }
}
