/**
 * Renders the central hub (contested zone)
 */

import { BaseRenderer } from './BaseRenderer'
import { HUB_CONFIG } from '../config'
import { COLORS } from '../config/colors'

export class HubRenderer extends BaseRenderer {
  render(): void {
    if (!this.ctx) return

    this.drawOuterRing()
    this.drawInnerHub()
    this.drawGlow()
  }

  private drawOuterRing(): void {
    if (!this.ctx) return
    const ctx = this.ctx
    const { center, outerRadius, pulseSpeed } = HUB_CONFIG

    const pulseAlpha = 0.1 + this.getPulse(pulseSpeed) * 0.05

    ctx.save()
    ctx.beginPath()
    ctx.arc(center.x, center.y, outerRadius, 0, Math.PI * 2)
    ctx.strokeStyle = COLORS.hub
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
    ctx.strokeStyle = COLORS.hub
    ctx.globalAlpha = 0.3
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.restore()
  }

  private drawGlow(): void {
    if (!this.ctx) return
    const ctx = this.ctx
    const { center, innerRadius } = HUB_CONFIG

    const gradient = ctx.createRadialGradient(
      center.x, center.y, 0,
      center.x, center.y, innerRadius
    )
    gradient.addColorStop(0, 'rgba(0, 212, 255, 0.1)')
    gradient.addColorStop(1, 'rgba(0, 212, 255, 0)')

    ctx.save()
    ctx.beginPath()
    ctx.arc(center.x, center.y, innerRadius, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()
    ctx.restore()
  }
}
