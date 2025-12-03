/**
 * Abstract base class for all renderers
 * Provides common rendering utilities
 */

import type { RenderContext } from '../types'

export abstract class BaseRenderer {
  protected ctx: CanvasRenderingContext2D | null = null
  protected animationTime = 0

  /**
   * Set the render context before drawing
   */
  setContext(context: RenderContext): void {
    this.ctx = context.ctx
    this.animationTime = context.animationTime
  }

  /**
   * Main render method - must be implemented by subclasses
   */
  abstract render(): void

  /**
   * Helper: Draw a circle with optional glow
   */
  protected drawCircle(
    x: number,
    y: number,
    radius: number,
    fillColor: string,
    options?: {
      strokeColor?: string
      strokeWidth?: number
      glowColor?: string
      glowBlur?: number
      alpha?: number
    }
  ): void {
    if (!this.ctx) return
    const ctx = this.ctx

    ctx.save()

    if (options?.alpha !== undefined) {
      ctx.globalAlpha = options.alpha
    }

    if (options?.glowColor && options?.glowBlur) {
      ctx.shadowColor = options.glowColor
      ctx.shadowBlur = options.glowBlur
    }

    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = fillColor
    ctx.fill()

    if (options?.strokeColor) {
      ctx.strokeStyle = options.strokeColor
      ctx.lineWidth = options.strokeWidth ?? 2
      ctx.stroke()
    }

    ctx.restore()
  }

  /**
   * Helper: Draw a rectangle with optional glow
   */
  protected drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    fillColor: string,
    options?: {
      strokeColor?: string
      strokeWidth?: number
      glowColor?: string
      glowBlur?: number
    }
  ): void {
    if (!this.ctx) return
    const ctx = this.ctx

    ctx.save()

    if (options?.glowColor && options?.glowBlur) {
      ctx.shadowColor = options.glowColor
      ctx.shadowBlur = options.glowBlur
    }

    ctx.fillStyle = fillColor
    ctx.fillRect(x, y, width, height)

    if (options?.strokeColor) {
      ctx.strokeStyle = options.strokeColor
      ctx.lineWidth = options.strokeWidth ?? 2
      ctx.strokeRect(x, y, width, height)
    }

    ctx.restore()
  }

  /**
   * Helper: Get pulse value (0-1) based on animation time
   */
  protected getPulse(speed: number): number {
    return (Math.sin(this.animationTime / speed) + 1) / 2
  }
}
