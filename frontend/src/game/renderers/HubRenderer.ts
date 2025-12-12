/**
 * Renders the central hub (contested zone)
 * Adapts colors based on map theme
 */

import { BaseRenderer } from './BaseRenderer'
import { HUB_CONFIG } from '../config'
import type { MapTheme } from '../config/maps/map-schema'

export class HubRenderer extends BaseRenderer {
  private theme: MapTheme = 'space'

  setTheme(theme: MapTheme): void {
    this.theme = theme
  }

  render(): void {
    if (!this.ctx) return

    // Skip hub rendering for volcanic theme - the LavaVortexRenderer handles the center
    // Skip hub rendering for simple theme - no central hub needed
    if (this.theme === 'volcanic' || this.theme === 'simple') {
      return
    }

    this.drawOuterRing()
    this.drawInnerHub()
    this.drawGlow()
  }

  private drawOuterRing(): void {
    if (!this.ctx) return
    const ctx = this.ctx
    const { center, outerRadius, pulseSpeed } = HUB_CONFIG

    const pulseAlpha = 0.15 + this.getPulse(pulseSpeed) * 0.1

    ctx.save()
    ctx.beginPath()
    ctx.arc(center.x, center.y, outerRadius, 0, Math.PI * 2)
    // Purple to match space theme
    ctx.strokeStyle = '#9933ff'
    ctx.globalAlpha = pulseAlpha
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.restore()
  }

  private drawInnerHub(): void {
    if (!this.ctx) return
    const ctx = this.ctx
    const { center, innerRadius } = HUB_CONFIG

    ctx.save()
    ctx.beginPath()
    ctx.arc(center.x, center.y, innerRadius, 0, Math.PI * 2)
    // Purple/magenta ring
    ctx.strokeStyle = '#aa44ff'
    ctx.globalAlpha = 0.4
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.restore()
  }

  private drawGlow(): void {
    if (!this.ctx) return
    const ctx = this.ctx
    const { center, innerRadius } = HUB_CONFIG

    // Purple/magenta glow to match space theme
    const gradient = ctx.createRadialGradient(
      center.x,
      center.y,
      0,
      center.x,
      center.y,
      innerRadius
    )
    gradient.addColorStop(0, 'rgba(150, 50, 200, 0.15)')
    gradient.addColorStop(0.5, 'rgba(100, 0, 150, 0.08)')
    gradient.addColorStop(1, 'rgba(50, 0, 100, 0)')

    ctx.save()
    ctx.beginPath()
    ctx.arc(center.x, center.y, innerRadius, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()
    ctx.restore()
  }
}
