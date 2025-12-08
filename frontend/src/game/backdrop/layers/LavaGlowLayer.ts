/**
 * LavaGlowLayer - Pulsing lava glow effect at edges
 * Creates an animated glow that pulses to simulate lava heat
 * 
 * @module backdrop/layers/LavaGlowLayer
 */

import type { BackdropConfig, BackdropLayer } from '../types'

export class LavaGlowLayer implements BackdropLayer {
  private config: BackdropConfig
  private pulseTime = 0

  constructor(config: BackdropConfig) {
    this.config = config
  }

  update(deltaTime: number, _time: number): void {
    this.pulseTime += deltaTime
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.config

    // Pulse intensity using sine wave (2-3 second cycle)
    const pulse = 0.5 + 0.3 * Math.sin(this.pulseTime * 2.5)
    const secondaryPulse = 0.4 + 0.2 * Math.sin(this.pulseTime * 1.8 + 1)

    // Bottom edge glow
    const bottomGlow = ctx.createLinearGradient(0, height * 0.7, 0, height)
    bottomGlow.addColorStop(0, 'transparent')
    bottomGlow.addColorStop(0.5, `rgba(255, 68, 0, ${0.1 * pulse})`)
    bottomGlow.addColorStop(1, `rgba(255, 102, 0, ${0.25 * pulse})`)

    ctx.fillStyle = bottomGlow
    ctx.fillRect(0, 0, width, height)

    // Left edge glow
    const leftGlow = ctx.createLinearGradient(0, 0, width * 0.15, 0)
    leftGlow.addColorStop(0, `rgba(255, 68, 0, ${0.15 * secondaryPulse})`)
    leftGlow.addColorStop(1, 'transparent')

    ctx.fillStyle = leftGlow
    ctx.fillRect(0, 0, width, height)

    // Right edge glow
    const rightGlow = ctx.createLinearGradient(width, 0, width * 0.85, 0)
    rightGlow.addColorStop(0, `rgba(255, 68, 0, ${0.15 * secondaryPulse})`)
    rightGlow.addColorStop(1, 'transparent')

    ctx.fillStyle = rightGlow
    ctx.fillRect(0, 0, width, height)

    // Corner hot spots
    this.renderCornerGlow(ctx, 0, height, pulse)
    this.renderCornerGlow(ctx, width, height, pulse)
  }

  private renderCornerGlow(ctx: CanvasRenderingContext2D, x: number, y: number, pulse: number): void {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 200)
    gradient.addColorStop(0, `rgba(255, 68, 0, ${0.2 * pulse})`)
    gradient.addColorStop(0.5, `rgba(204, 51, 0, ${0.1 * pulse})`)
    gradient.addColorStop(1, 'transparent')

    ctx.fillStyle = gradient
    ctx.fillRect(x - 200, y - 200, 400, 400)
  }
}
