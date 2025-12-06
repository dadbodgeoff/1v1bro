/**
 * Renders power-up spawn points with custom icons
 */

import { BaseRenderer } from './BaseRenderer'
import { POWERUP_CONFIG } from '../config'
import { COLORS } from '../config/colors'
import { getAssets } from '../assets'
import type { PowerUpState, PowerUpType } from '../types'

export class PowerUpRenderer extends BaseRenderer {
  private powerUps: PowerUpState[] = []

  setPowerUps(powerUps: PowerUpState[]): void {
    this.powerUps = powerUps
  }

  render(): void {
    this.powerUps.forEach((pu) => this.renderPowerUp(pu))
  }

  private renderPowerUp(powerUp: PowerUpState): void {
    // Only render active, uncollected power-ups
    if (!powerUp.active || powerUp.collected || !this.ctx) return

    const { position, active, type } = powerUp
    const assets = getAssets()

    // Try to draw icon image (canvas with transparency)
    const icon = this.getIcon(type, assets)
    if (icon) {
      // Base size of 70, pulses up to 85 when active
      const baseSize = 70
      const pulse = active ? this.getPulse(POWERUP_CONFIG.pulseSpeed) : 0
      const iconSize = baseSize + pulse * 15
      const x = position.x - iconSize / 2
      const y = position.y - iconSize / 2

      this.ctx.save()
      this.ctx.imageSmoothingEnabled = true
      this.ctx.imageSmoothingQuality = 'high'
      this.ctx.drawImage(icon, x, y, iconSize, iconSize)
      this.ctx.restore()
    } else {
      // Fallback: draw background circle with text label
      const radius = this.calculateRadius(active)
      const color = this.calculateColor(active)
      this.drawCircle(position.x, position.y, radius, COLORS.background, {
        strokeColor: color,
        strokeWidth: 2,
        alpha: 0.9,
      })
      this.drawLabel(powerUp)
    }
  }

  private getIcon(
    type: PowerUpType,
    assets: ReturnType<typeof getAssets>
  ): HTMLCanvasElement | null {
    if (!assets) return null

    const iconMap: Record<PowerUpType, HTMLCanvasElement> = {
      shield: assets.powerups.shield,
      sos: assets.powerups.sos,
      time_steal: assets.powerups.timeSteal,
      double_points: assets.powerups.doublePoints,
    }

    return iconMap[type] ?? null
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
    ctx.fillText(this.getTextLabel(type), position.x, position.y)
    ctx.restore()
  }

  private getTextLabel(type: PowerUpType): string {
    const labels: Record<PowerUpType, string> = {
      sos: 'SOS',
      time_steal: '⏱',
      shield: '🛡',
      double_points: '2X',
    }
    return labels[type] ?? '?'
  }
}
