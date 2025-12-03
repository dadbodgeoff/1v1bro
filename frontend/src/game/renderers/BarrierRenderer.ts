/**
 * Renders barriers and arena boundary
 */

import { BaseRenderer } from './BaseRenderer'
import { ARENA_SIZE, BARRIERS, RENDER_CONFIG } from '../config'
import { COLORS } from '../config/colors'

export class BarrierRenderer extends BaseRenderer {
  render(): void {
    this.drawBarriers()
    this.drawBoundary()
  }

  private drawBarriers(): void {
    BARRIERS.forEach(barrier => {
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
