/**
 * Renders barriers with texture and arena boundary
 */

import { BaseRenderer } from './BaseRenderer'
import { ARENA_SIZE, BARRIERS, RENDER_CONFIG } from '../config'
import { COLORS } from '../config/colors'
import { getAssets } from '../assets'

export class BarrierRenderer extends BaseRenderer {
  render(): void {
    this.drawBarriers()
    this.drawBoundary()
  }

  private drawBarriers(): void {
    if (!this.ctx) return
    const ctx = this.ctx
    const assets = getAssets()

    BARRIERS.forEach((barrier) => {
      // Draw barrier image if available
      if (assets?.tiles.barrier) {
        ctx.save()

        // Add glow effect
        ctx.shadowColor = COLORS.barrierGlow
        ctx.shadowBlur = RENDER_CONFIG.glowBlur * 2

        // Enable smooth scaling
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        // Draw the barrier image stretched to fit the barrier area
        ctx.drawImage(
          assets.tiles.barrier,
          barrier.x,
          barrier.y,
          barrier.width,
          barrier.height
        )

        ctx.restore()
      } else {
        // Fallback to solid color
        this.drawRect(
          barrier.x,
          barrier.y,
          barrier.width,
          barrier.height,
          COLORS.barrier,
          {
            strokeColor: COLORS.barrierGlow,
            strokeWidth: 2,
            glowColor: COLORS.barrierGlow,
            glowBlur: RENDER_CONFIG.glowBlur,
          }
        )
      }
    })
  }

  private drawBoundary(): void {
    if (!this.ctx) return
    const ctx = this.ctx
    const padding = 4

    ctx.save()
    ctx.strokeStyle = COLORS.boundary
    ctx.lineWidth = RENDER_CONFIG.boundaryWidth
    ctx.shadowColor = COLORS.barrierGlow
    ctx.shadowBlur = RENDER_CONFIG.glowBlur
    ctx.strokeRect(
      padding,
      padding,
      ARENA_SIZE.width - padding * 2,
      ARENA_SIZE.height - padding * 2
    )
    ctx.restore()
  }
}
