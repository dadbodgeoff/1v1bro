/**
 * Renders the arena floor grid
 */

import { BaseRenderer } from './BaseRenderer'
import { ARENA_SIZE, GRID_SIZE, RENDER_CONFIG } from '../config'
import { COLORS } from '../config/colors'

export class GridRenderer extends BaseRenderer {
  render(): void {
    if (!this.ctx) return

    this.drawBackground()
    this.drawGridLines()
  }

  private drawBackground(): void {
    if (!this.ctx) return
    this.ctx.fillStyle = COLORS.background
    this.ctx.fillRect(0, 0, ARENA_SIZE.width, ARENA_SIZE.height)
  }

  private drawGridLines(): void {
    if (!this.ctx) return
    const ctx = this.ctx

    ctx.save()
    ctx.strokeStyle = COLORS.grid
    ctx.globalAlpha = RENDER_CONFIG.gridOpacity
    ctx.lineWidth = 1

    // Vertical lines
    for (let x = 0; x <= ARENA_SIZE.width; x += GRID_SIZE) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, ARENA_SIZE.height)
      ctx.stroke()
    }

    // Horizontal lines
    for (let y = 0; y <= ARENA_SIZE.height; y += GRID_SIZE) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(ARENA_SIZE.width, y)
      ctx.stroke()
    }

    ctx.restore()
  }
}
