/**
 * Renders power-up spawn points
 */

import { BaseRenderer } from './BaseRenderer'
import { POWERUP_CONFIG, RENDER_CONFIG } from '../config'
import { COLORS } from '../config/colors'
import type { PowerUpState, PowerUpType } from '../types'

export class PowerUpRenderer extends BaseRenderer {
  private powerUps: PowerUpState[] = []

  setPowerUps(powerUps: PowerUpState[]): void {
    this.powerUps = powerUps
  }

  render(): void {
    this.powerUps.forEach(pu => this.renderPowerUp(pu))
  }

  private renderPowerUp(powerUp: PowerUpState): void {
    if (powerUp.collected || !this.ctx) return

    const { position, active } = powerUp
    const radius = this.calculateRadius(active)
    const color = this.calculateColor(active)

    // Draw glow and circle
    this.drawCircle(position.x, position.y, radius, color, {
      strokeColor: COLORS.white,
      strokeWidth: 2,
      glowColor: color,
      glowBlur: active ? RENDER_CONFIG.glowBlurIntense : RENDER_CONFIG.glowBlur,
      alpha: 0.8,
    })

    // Draw label
    this.drawLabel(powerUp)
  }

  private calculateRadius(active: boolean): number {
    const base = active ? POWERUP_CONFIG.radiusActive : POWERUP_CONFIG.radiusInactive
    if (!active) return base

    const pulse = this.getPulse(POWERUP_CONFIG.pulseSpeed)
    return base + pulse * 5
  }

  private calculateColor(active: boolean): string {
    if (!active) return COLORS.powerUpInactive

    const pulse = this.getPulse(POWERUP_CONFIG.pulseSpeed)
    return pulse > 0.5 ? COLORS.powerUpActive : COLORS.powerUpInactive
  }

  private drawLabel(powerUp: PowerUpState): void {
    if (!this.ctx) return
    const ctx = this.ctx
    const { position, type } = powerUp

    ctx.save()
    ctx.fillStyle = COLORS.white
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.getLabel(type), position.x, position.y)
    ctx.restore()
  }

  private getLabel(type: PowerUpType): string {
    const labels: Record<PowerUpType, string> = {
      sos: 'SOS',
      time_steal: '⏱',
      shield: '◉',
      double_points: '2X',
    }
    return labels[type] ?? '?'
  }
}
