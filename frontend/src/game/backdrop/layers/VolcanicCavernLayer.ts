/**
 * VolcanicCavernLayer - Dark volcanic cavern background
 * Creates a deep underground cavern atmosphere with lava glow from below
 * 
 * @module backdrop/layers/VolcanicCavernLayer
 */

import type { BackdropConfig, BackdropLayer } from '../types'
import { VOLCANIC_COLORS } from '../types'

export class VolcanicCavernLayer implements BackdropLayer {
  private config: BackdropConfig

  constructor(config: BackdropConfig) {
    this.config = config
  }

  update(_deltaTime: number, _time: number): void {
    // Static layer - no animation needed
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.config

    // Dark cavern gradient from top (dark) to bottom (lava glow)
    const cavernGradient = ctx.createLinearGradient(0, 0, 0, height)
    cavernGradient.addColorStop(0, '#0a0505')      // Very dark at top
    cavernGradient.addColorStop(0.3, '#120808')    // Dark reddish
    cavernGradient.addColorStop(0.6, '#1a0a0a')    // Warmer dark
    cavernGradient.addColorStop(0.85, '#2a1010')   // Red tint from lava
    cavernGradient.addColorStop(1, '#3a1515')      // Lava glow at bottom

    ctx.fillStyle = cavernGradient
    ctx.fillRect(0, 0, width, height)

    // Add rocky texture overlay
    this.renderRockyTexture(ctx)

    // Add subtle lava glow from bottom
    this.renderBottomGlow(ctx)
  }

  private renderRockyTexture(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.config

    // Create subtle rock texture with random darker patches
    ctx.globalAlpha = 0.15
    ctx.fillStyle = VOLCANIC_COLORS.obsidian

    // Seed-based pseudo-random for consistent texture
    const seed = 42
    for (let i = 0; i < 50; i++) {
      const x = ((seed * (i + 1) * 17) % width)
      const y = ((seed * (i + 1) * 23) % height)
      const size = 20 + ((seed * (i + 1) * 7) % 60)

      ctx.beginPath()
      ctx.ellipse(x, y, size, size * 0.6, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.globalAlpha = 1
  }

  private renderBottomGlow(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.config

    // Radial glow from bottom center
    const glowGradient = ctx.createRadialGradient(
      width / 2, height + 100, 0,
      width / 2, height + 100, height * 0.8
    )
    glowGradient.addColorStop(0, 'rgba(255, 68, 0, 0.3)')
    glowGradient.addColorStop(0.5, 'rgba(255, 68, 0, 0.1)')
    glowGradient.addColorStop(1, 'transparent')

    ctx.fillStyle = glowGradient
    ctx.fillRect(0, 0, width, height)
  }
}
