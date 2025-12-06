/**
 * Health Bar Renderer
 * Renders health bars above player sprites
 */

import { BaseRenderer } from './BaseRenderer'
import { COLORS } from '../config/colors'
import type { HealthState, Vector2 } from '../types'

interface PlayerHealthData {
  position: Vector2
  state: HealthState
  isLocal: boolean
}

export class HealthBarRenderer extends BaseRenderer {
  private players: PlayerHealthData[] = []

  setPlayers(players: PlayerHealthData[]): void {
    this.players = players
  }

  render(): void {
    for (const player of this.players) {
      this.renderHealthBar(player)
    }
  }

  private renderHealthBar(player: PlayerHealthData): void {
    if (!this.ctx) return

    const { position, state } = player
    const barWidth = 40
    const barHeight = 5
    const yOffset = -35 // Above sprite

    const x = position.x - barWidth / 2
    const y = position.y + yOffset

    // Background (dark)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    this.ctx.fillRect(x - 1, y - 1, barWidth + 2, barHeight + 2)

    // Health bar
    const healthPercent = state.current / state.max
    const healthWidth = barWidth * healthPercent
    const healthColor = this.getHealthColor(healthPercent)

    this.ctx.fillStyle = healthColor
    this.ctx.fillRect(x, y, healthWidth, barHeight)


    // Shield bar (above health bar)
    if (state.shield > 0) {
      const shieldPercent = state.shield / state.shieldMax
      const shieldWidth = barWidth * shieldPercent

      this.ctx.fillStyle = COLORS.shield
      this.ctx.fillRect(x, y - 4, shieldWidth, 2)
    }

    // Invulnerability indicator (pulsing border)
    if (state.isInvulnerable && Date.now() < state.invulnerabilityEnd) {
      const pulse = this.getPulse(0.5) // Fast pulse
      this.ctx.strokeStyle = COLORS.invulnerable
      this.ctx.lineWidth = 1 + pulse
      this.ctx.globalAlpha = 0.5 + pulse * 0.5
      this.ctx.strokeRect(x - 2, y - 6, barWidth + 4, barHeight + 8)
      this.ctx.globalAlpha = 1
    }
  }

  private getHealthColor(percent: number): string {
    if (percent > 0.6) return COLORS.healthHigh
    if (percent > 0.3) return COLORS.healthMed
    return COLORS.healthLow
  }
}
