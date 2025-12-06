/**
 * Renders player characters with animated sprites and trails
 */

import { BaseRenderer } from './BaseRenderer'
import { PLAYER_CONFIG } from '../config'
import { COLORS } from '../config/colors'
import { SpriteAnimator, getAssets } from '../assets'
import type { PlayerState, Vector2 } from '../types'

interface PlayerRenderData {
  state: PlayerState
  color: string
  animator: SpriteAnimator | null
  lastPosition: Vector2
  isFlashing: boolean
  isRespawning: boolean
}

export class PlayerRenderer extends BaseRenderer {
  private players: PlayerRenderData[] = []
  private animators: Map<string, SpriteAnimator> = new Map()
  private lastPositions: Map<string, Vector2> = new Map()
  private flashingPlayers: Set<string> = new Set()
  private respawningPlayers: Set<string> = new Set()

  /**
   * Set which players are currently showing damage flash
   */
  setFlashingPlayers(playerIds: string[]): void {
    this.flashingPlayers = new Set(playerIds)
  }

  /**
   * Set which players are currently respawning (ghost mode)
   */
  setRespawningPlayers(playerIds: string[]): void {
    this.respawningPlayers = new Set(playerIds)
  }

  setPlayers(player1: PlayerState | null, player2: PlayerState | null): void {
    this.players = []
    const assets = getAssets()

    // Render opponent first (so local player appears on top)
    if (player2) {
      this.players.push(this.createPlayerData(player2, assets))
    }
    if (player1) {
      this.players.push(this.createPlayerData(player1, assets))
    }
  }

  private createPlayerData(
    player: PlayerState,
    assets: ReturnType<typeof getAssets>
  ): PlayerRenderData {
    // Use isPlayer1 for consistent sprite colors across both players' views
    // Player 1 = green sprite, Player 2 = pink sprite
    const isGreen = player.isPlayer1 ?? player.isLocal
    const color = isGreen ? COLORS.player1 : COLORS.player2

    // Get or create animator for this player
    let animator = this.animators.get(player.id)
    if (!animator && assets) {
      const frames = isGreen ? assets.sprites.green : assets.sprites.pink
      animator = new SpriteAnimator(frames, 12)
      this.animators.set(player.id, animator)
    }

    const lastPos = this.lastPositions.get(player.id) ?? { ...player.position }

    return {
      state: player,
      color,
      animator: animator ?? null,
      lastPosition: lastPos,
      isFlashing: this.flashingPlayers.has(player.id),
      isRespawning: this.respawningPlayers.has(player.id),
    }
  }

  /**
   * Update sprite animations - call this from game loop
   */
  updateAnimations(deltaTime: number): void {
    this.players.forEach(({ state, animator, lastPosition }) => {
      if (!animator) return

      // Calculate velocity from position change
      const dx = state.position.x - lastPosition.x
      const dy = state.position.y - lastPosition.y
      const isMoving = Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1

      // Pass velocity to animator for directional animation
      animator.update(deltaTime, isMoving, dx, dy)

      // Update last position
      this.lastPositions.set(state.id, { ...state.position })
    })
  }

  render(): void {
    this.players.forEach((data) => {
      this.renderTrail(data.state, data.color, data.isRespawning)
      this.renderPlayer(data)
    })
  }

  private renderTrail(player: PlayerState, color: string, isRespawning: boolean): void {
    if (!this.ctx) return

    // Ghost trail uses reduced alpha
    const alphaMultiplier = isRespawning ? 0.15 : 0.3

    player.trail.forEach((point) => {
      if (point.alpha <= 0) return

      this.drawCircle(point.x, point.y, PLAYER_CONFIG.radius * 0.4, color, {
        alpha: point.alpha * alphaMultiplier,
      })
    })
  }

  private renderPlayer(data: PlayerRenderData): void {
    if (!this.ctx) return
    const ctx = this.ctx
    const { state, color, animator, isFlashing, isRespawning } = data
    const { position } = state

    // Ghost effect for respawning players
    const ghostAlpha = isRespawning ? 0.4 : 1.0
    const ghostPulse = isRespawning ? 0.1 * Math.sin(Date.now() / 200) : 0

    // Try to render sprite
    if (animator) {
      const frame = animator.getCurrentFrame()
      if (frame) {
        // Calculate sprite size (scale to fit player radius)
        const spriteSize = PLAYER_CONFIG.radius * 4
        const x = position.x - spriteSize / 2
        const y = position.y - spriteSize / 2

        // Draw sprite frame - use pixelated rendering for pixel art
        ctx.save()
        ctx.imageSmoothingEnabled = false
        ctx.globalAlpha = ghostAlpha + ghostPulse

        // Draw sprite (ghost effect is just transparency via globalAlpha)
        ctx.drawImage(frame, x, y, spriteSize, spriteSize)

        // Apply damage flash overlay (red tint)
        if (isFlashing && !isRespawning) {
          ctx.globalCompositeOperation = 'source-atop'
          ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'
          ctx.fillRect(x, y, spriteSize, spriteSize)
        }

        ctx.restore()
        return
      }
    }

    // Fallback to circle if no sprite
    ctx.save()
    ctx.globalAlpha = ghostAlpha + ghostPulse
    const flashColor = isFlashing && !isRespawning ? '#ff0000' : color
    this.drawCircle(position.x, position.y, PLAYER_CONFIG.radius, flashColor, {
      strokeColor: COLORS.white,
      strokeWidth: 2,
      glowColor: isFlashing && !isRespawning ? '#ff0000' : color,
      glowBlur: isRespawning ? 16 : 8,
    })

    // Draw label for fallback
    ctx.fillStyle = COLORS.black
    ctx.font = 'bold 10px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(state.isLocal ? 'P1' : 'P2', position.x, position.y)
    ctx.restore()
  }
}
