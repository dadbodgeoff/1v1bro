/**
 * Renders player characters and trails
 */

import { BaseRenderer } from './BaseRenderer'
import { PLAYER_CONFIG, RENDER_CONFIG } from '../config'
import { COLORS } from '../config/colors'
import type { PlayerState } from '../types'

export class PlayerRenderer extends BaseRenderer {
  private players: Array<{ state: PlayerState; color: string; label: string }> = []

  setPlayers(player1: PlayerState | null, player2: PlayerState | null): void {
    this.players = []
    
    // Render opponent first (so local player appears on top)
    if (player2) {
      this.players.push({
        state: player2,
        color: player2.isLocal ? COLORS.player1 : COLORS.player2,
        label: player2.isLocal ? 'P1' : 'P2',
      })
    }
    if (player1) {
      this.players.push({
        state: player1,
        color: player1.isLocal ? COLORS.player1 : COLORS.player2,
        label: player1.isLocal ? 'P1' : 'P2',
      })
    }
  }

  render(): void {
    this.players.forEach(({ state, color, label }) => {
      this.renderTrail(state, color)
      this.renderPlayer(state, color, label)
    })
  }

  private renderTrail(player: PlayerState, color: string): void {
    if (!this.ctx) return

    player.trail.forEach(point => {
      if (point.alpha <= 0) return

      this.drawCircle(
        point.x,
        point.y,
        PLAYER_CONFIG.radius * 0.5,
        color,
        { alpha: point.alpha * 0.5 }
      )
    })
  }

  private renderPlayer(player: PlayerState, color: string, label: string): void {
    if (!this.ctx) return
    const ctx = this.ctx
    const { position } = player

    // Draw player circle with glow
    this.drawCircle(position.x, position.y, PLAYER_CONFIG.radius, color, {
      strokeColor: COLORS.white,
      strokeWidth: 2,
      glowColor: color,
      glowBlur: RENDER_CONFIG.glowBlur,
    })

    // Draw label
    ctx.save()
    ctx.fillStyle = COLORS.black
    ctx.font = 'bold 10px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, position.x, position.y)
    ctx.restore()
  }
}
