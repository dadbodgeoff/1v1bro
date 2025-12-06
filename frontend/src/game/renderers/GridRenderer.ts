/**
 * Renders the arena floor with tiled texture
 */

import { BaseRenderer } from './BaseRenderer'
import { ARENA_SIZE, GRID_SIZE, RENDER_CONFIG } from '../config'
import { COLORS } from '../config/colors'
import { getAssets } from '../assets'

export class GridRenderer extends BaseRenderer {
  private pattern: CanvasPattern | null = null
  private patternCreated = false

  render(): void {
    if (!this.ctx) return

    this.drawBackground()
    this.drawGridLines()
  }

  private drawBackground(): void {
    if (!this.ctx) return
    const ctx = this.ctx
    const assets = getAssets()

    // Try to use tiled floor texture
    if (assets?.tiles.floor && assets.tiles.floor.complete) {
      if (!this.patternCreated) {
        this.pattern = ctx.createPattern(assets.tiles.floor, 'repeat')
        this.patternCreated = true
      }

      if (this.pattern) {
        ctx.save()
        ctx.fillStyle = this.pattern
        ctx.globalAlpha = 0.8
        ctx.fillRect(0, 0, ARENA_SIZE.width, ARENA_SIZE.height)
        ctx.restore()

        // Add dark overlay for better contrast
        ctx.save()
        ctx.fillStyle = COLORS.background
        ctx.globalAlpha = 0.4
        ctx.fillRect(0, 0, ARENA_SIZE.width, ARENA_SIZE.height)
        ctx.restore()
        return
      }
    }

    // Fallback to solid color
    ctx.fillStyle = COLORS.background
    ctx.fillRect(0, 0, ARENA_SIZE.width, ARENA_SIZE.height)
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
