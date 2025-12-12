/**
 * VisualHierarchySystem - Post-processing for gameplay clarity
 * @module visual/VisualHierarchySystem
 */

import type { HierarchyConfig, HazardZone, Vector2, Rect } from './types'

export class VisualHierarchySystem {
  private config: HierarchyConfig

  constructor(config: HierarchyConfig) {
    this.config = config
  }

  /**
   * Apply brightness boost to platforms
   */
  applyPlatformContrast(ctx: CanvasRenderingContext2D, platforms: Rect[]): void {
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    ctx.fillStyle = `rgba(255, 255, 255, ${this.config.platformBrightness - 1})`

    for (const platform of platforms) {
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
    }

    ctx.restore()
  }

  /**
   * Apply desaturation and blur to background
   */
  applyBackgroundEffects(
    ctx: CanvasRenderingContext2D,
    backgroundCanvas: HTMLCanvasElement
  ): void {
    ctx.save()

    // Apply blur
    if (this.config.backgroundBlur > 0) {
      ctx.filter = `blur(${this.config.backgroundBlur}px)`
    }

    // Draw background
    ctx.drawImage(backgroundCanvas, 0, 0)

    // Apply desaturation overlay
    ctx.globalCompositeOperation = 'saturation'
    ctx.fillStyle = `hsl(0, ${100 - this.config.backgroundDesaturation * 100}%, 50%)`
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    ctx.restore()
  }

  /**
   * Apply pulsing danger indicators to hazards
   */
  applyHazardIndicators(
    ctx: CanvasRenderingContext2D,
    hazards: HazardZone[],
    playerPosition: Vector2 | null,
    time: number
  ): void {
    const basePulse = 0.5 + 0.5 * Math.sin(time * Math.PI * 4) // 2Hz

    for (const hazard of hazards) {
      // Check if player is inside
      const playerInside =
        playerPosition && this.isPointInRect(playerPosition, hazard.bounds)
      const intensity = playerInside ? basePulse * 1.5 : basePulse

      ctx.save()
      ctx.globalAlpha = intensity * 0.3
      ctx.fillStyle = '#ff2200'
      ctx.fillRect(
        hazard.bounds.x,
        hazard.bounds.y,
        hazard.bounds.width,
        hazard.bounds.height
      )
      ctx.restore()
    }
  }

  /**
   * Apply glow to interactive elements
   */
  applyInteractiveGlow(
    ctx: CanvasRenderingContext2D,
    elements: Array<{ position: Vector2; radius: number; type: string }>,
    time: number
  ): void {
    for (const element of elements) {
      const color = element.type === 'teleporter' ? '#3b82f6' : '#10b981'
      const pulse = 0.7 + 0.3 * Math.sin(time * Math.PI * 2)

      const gradient = ctx.createRadialGradient(
        element.position.x,
        element.position.y,
        0,
        element.position.x,
        element.position.y,
        element.radius * 1.5
      )
      gradient.addColorStop(
        0,
        `${color}${Math.round(pulse * 80)
          .toString(16)
          .padStart(2, '0')}`
      )
      gradient.addColorStop(1, 'transparent')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(element.position.x, element.position.y, element.radius * 1.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  /**
   * Apply vignette effect to focus attention
   */
  applyVignette(ctx: CanvasRenderingContext2D): void {
    const { width, height } = ctx.canvas
    const centerX = width / 2
    const centerY = height / 2
    const radius =
      Math.sqrt(centerX * centerX + centerY * centerY) * this.config.vignetteRadius

    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      radius * 0.5,
      centerX,
      centerY,
      radius
    )
    gradient.addColorStop(0, 'transparent')
    gradient.addColorStop(1, `rgba(0, 0, 0, ${this.config.vignetteIntensity})`)

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }

  /**
   * Calculate contrast ratio between two colors (WCAG formula)
   */
  calculateContrastRatio(color1: string, color2: string): number {
    const lum1 = this.getRelativeLuminance(color1)
    const lum2 = this.getRelativeLuminance(color2)
    const lighter = Math.max(lum1, lum2)
    const darker = Math.min(lum1, lum2)
    return (lighter + 0.05) / (darker + 0.05)
  }

  private getRelativeLuminance(color: string): number {
    // Parse hex color and calculate luminance
    const rgb = this.hexToRgb(color)
    const [r, g, b] = rgb.map((c) => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [0, 0, 0]
  }

  private isPointInRect(point: Vector2, rect: Rect): boolean {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    )
  }

  /**
   * Apply screen edge tint when player is in hazard
   */
  applyHazardScreenTint(ctx: CanvasRenderingContext2D, intensity: number): void {
    if (intensity <= 0) return

    ctx.save()
    ctx.globalAlpha = intensity * 0.1

    const { width, height } = ctx.canvas
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.3,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.7
    )
    gradient.addColorStop(0, 'transparent')
    gradient.addColorStop(1, '#ff0000')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
    ctx.restore()
  }

  /**
   * Get config for testing
   */
  getConfig(): HierarchyConfig {
    return this.config
  }
}
