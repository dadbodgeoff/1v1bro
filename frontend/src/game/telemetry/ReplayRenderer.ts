/**
 * Replay Renderer
 * Renders telemetry frames with debug overlays for death replay
 */

import type { Vector2 } from '../types'
import type { TelemetryFrame, PlayerSnapshot, ProjectileSnapshot, NetworkStats } from './types'

export interface ReplayRenderOptions {
  showHitboxes: boolean
  showTrails: boolean
  showLatencyOverlay: boolean
  showVelocityVectors: boolean
}

const DEFAULT_OPTIONS: ReplayRenderOptions = {
  showHitboxes: false,
  showTrails: true,
  showLatencyOverlay: false,
  showVelocityVectors: false,
}

// Colors
const COLORS = {
  victim: '#ff4444',
  killer: '#44ff44',
  other: '#4488ff',
  projectile: '#f59e0b',
  trail: '#ffffff',
  hitbox: 'rgba(245, 158, 11, 0.4)',
  projectileHitbox: 'rgba(99, 102, 241, 0.4)',
  velocity: '#3b82f6',
  healthHigh: '#10b981',
  healthMed: '#f59e0b',
  healthLow: '#ef4444',
  shield: '#3b82f6',
}

export class ReplayRenderer {
  private ctx: CanvasRenderingContext2D | null = null
  private options: ReplayRenderOptions = { ...DEFAULT_OPTIONS }

  // Trail history for smooth visualization
  private playerTrails: Map<string, Vector2[]> = new Map()
  private projectileTrails: Map<string, Vector2[]> = new Map()

  private readonly TRAIL_MAX_LENGTH = 30
  private readonly PLAYER_RADIUS = 16
  private readonly PROJECTILE_RADIUS = 4
  private readonly HIT_RADIUS = 12 // Player hurtbox

  /**
   * Set the canvas context
   */
  setContext(ctx: CanvasRenderingContext2D): void {
    this.ctx = ctx
  }

  /**
   * Update render options
   */
  setOptions(options: Partial<ReplayRenderOptions>): void {
    this.options = { ...this.options, ...options }
  }

  /**
   * Get current options
   */
  getOptions(): ReplayRenderOptions {
    return { ...this.options }
  }

  /**
   * Render a telemetry frame
   */
  renderFrame(frame: TelemetryFrame, victimId: string, killerId: string): void {
    if (!this.ctx) return

    // Update trails
    this.updateTrails(frame)

    // Clear canvas
    this.ctx.fillStyle = '#1a1a2e'
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)

    // Render layers
    if (this.options.showTrails) {
      this.renderPlayerTrails(victimId, killerId)
      this.renderProjectileTrails()
    }

    this.renderProjectiles(frame.projectiles)
    this.renderPlayers(frame.players, victimId, killerId)

    if (this.options.showHitboxes) {
      this.renderHitboxes(frame)
    }

    if (this.options.showVelocityVectors) {
      this.renderVelocityVectors(frame.players)
    }

    if (this.options.showLatencyOverlay) {
      this.renderLatencyOverlay(frame.networkStats, frame.tick)
    }

    // Render combat events
    this.renderEvents(frame)
  }

  /**
   * Update trail history from frame
   */
  private updateTrails(frame: TelemetryFrame): void {
    // Update player trails
    for (const player of frame.players) {
      let trail = this.playerTrails.get(player.playerId)
      if (!trail) {
        trail = []
        this.playerTrails.set(player.playerId, trail)
      }
      trail.unshift({ ...player.position })
      if (trail.length > this.TRAIL_MAX_LENGTH) {
        trail.pop()
      }
    }

    // Update projectile trails
    for (const proj of frame.projectiles) {
      let trail = this.projectileTrails.get(proj.id)
      if (!trail) {
        trail = []
        this.projectileTrails.set(proj.id, trail)
      }
      trail.unshift({ ...proj.position })
      if (trail.length > this.TRAIL_MAX_LENGTH) {
        trail.pop()
      }
    }

    // Clean up trails for destroyed projectiles
    const activeIds = new Set(frame.projectiles.map(p => p.id))
    for (const id of this.projectileTrails.keys()) {
      if (!activeIds.has(id)) {
        this.projectileTrails.delete(id)
      }
    }
  }

  /**
   * Render player trails
   */
  private renderPlayerTrails(victimId: string, killerId: string): void {
    if (!this.ctx) return

    for (const [playerId, trail] of this.playerTrails) {
      if (trail.length < 2) continue

      const color = playerId === victimId ? COLORS.victim :
                    playerId === killerId ? COLORS.killer : COLORS.other

      this.ctx.beginPath()
      this.ctx.moveTo(trail[0].x, trail[0].y)

      for (let i = 1; i < trail.length; i++) {
        this.ctx.lineTo(trail[i].x, trail[i].y)
      }

      this.ctx.strokeStyle = color
      this.ctx.lineWidth = 2
      this.ctx.globalAlpha = 0.3
      this.ctx.stroke()
      this.ctx.globalAlpha = 1
    }
  }

  /**
   * Render projectile trails
   */
  private renderProjectileTrails(): void {
    if (!this.ctx) return

    for (const trail of this.projectileTrails.values()) {
      if (trail.length < 2) continue

      this.ctx.beginPath()
      this.ctx.moveTo(trail[0].x, trail[0].y)

      for (let i = 1; i < trail.length; i++) {
        this.ctx.lineTo(trail[i].x, trail[i].y)
      }

      this.ctx.strokeStyle = COLORS.projectile
      this.ctx.lineWidth = 2
      this.ctx.globalAlpha = 0.4
      this.ctx.stroke()
      this.ctx.globalAlpha = 1
    }
  }

  /**
   * Render players
   */
  private renderPlayers(players: PlayerSnapshot[], victimId: string, killerId: string): void {
    if (!this.ctx) return

    for (const player of players) {
      const isVictim = player.playerId === victimId
      const isKiller = player.playerId === killerId
      const color = isVictim ? COLORS.victim : isKiller ? COLORS.killer : COLORS.other

      // Skip dead players (render as ghost)
      const alpha = player.state === 'dead' ? 0.3 : player.state === 'respawning' ? 0.5 : 1

      this.ctx.globalAlpha = alpha

      // Player circle
      this.ctx.beginPath()
      this.ctx.arc(player.position.x, player.position.y, this.PLAYER_RADIUS, 0, Math.PI * 2)
      this.ctx.fillStyle = color
      this.ctx.fill()

      // Invulnerability ring
      if (player.isInvulnerable) {
        this.ctx.beginPath()
        this.ctx.arc(player.position.x, player.position.y, this.PLAYER_RADIUS + 4, 0, Math.PI * 2)
        this.ctx.strokeStyle = '#ffffff'
        this.ctx.lineWidth = 2
        this.ctx.stroke()
      }

      // Aim direction indicator
      const aimEnd = {
        x: player.position.x + player.aimDirection.x * 30,
        y: player.position.y + player.aimDirection.y * 30,
      }
      this.ctx.beginPath()
      this.ctx.moveTo(player.position.x, player.position.y)
      this.ctx.lineTo(aimEnd.x, aimEnd.y)
      this.ctx.strokeStyle = '#ffffff'
      this.ctx.lineWidth = 2
      this.ctx.stroke()

      // Health bar
      this.renderHealthBar(player)

      // Label
      this.ctx.fillStyle = '#ffffff'
      this.ctx.font = 'bold 10px monospace'
      this.ctx.textAlign = 'center'
      const label = isVictim ? 'VICTIM' : isKiller ? 'KILLER' : player.playerId.slice(0, 6)
      this.ctx.fillText(label, player.position.x, player.position.y - 30)

      this.ctx.globalAlpha = 1
    }
  }

  /**
   * Render health bar above player
   */
  private renderHealthBar(player: PlayerSnapshot): void {
    if (!this.ctx) return

    const barWidth = 40
    const barHeight = 4
    const x = player.position.x - barWidth / 2
    const y = player.position.y - 24

    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    this.ctx.fillRect(x - 1, y - 1, barWidth + 2, barHeight + 2)

    // Health
    const healthPercent = player.health / 100
    const healthColor = healthPercent > 0.6 ? COLORS.healthHigh :
                        healthPercent > 0.3 ? COLORS.healthMed : COLORS.healthLow
    this.ctx.fillStyle = healthColor
    this.ctx.fillRect(x, y, barWidth * healthPercent, barHeight)

    // Shield
    if (player.shield > 0) {
      const shieldPercent = player.shield / 50
      this.ctx.fillStyle = COLORS.shield
      this.ctx.fillRect(x, y - 3, barWidth * shieldPercent, 2)
    }
  }

  /**
   * Render projectiles
   */
  private renderProjectiles(projectiles: ProjectileSnapshot[]): void {
    if (!this.ctx) return

    for (const proj of projectiles) {
      // Glow
      this.ctx.beginPath()
      this.ctx.arc(proj.position.x, proj.position.y, this.PROJECTILE_RADIUS + 4, 0, Math.PI * 2)
      this.ctx.fillStyle = 'rgba(255, 170, 0, 0.3)'
      this.ctx.fill()

      // Core
      this.ctx.beginPath()
      this.ctx.arc(proj.position.x, proj.position.y, this.PROJECTILE_RADIUS, 0, Math.PI * 2)
      this.ctx.fillStyle = COLORS.projectile
      this.ctx.fill()
    }
  }

  /**
   * Render hitboxes for debugging
   */
  private renderHitboxes(frame: TelemetryFrame): void {
    if (!this.ctx) return

    // Player hurtboxes
    for (const player of frame.players) {
      if (player.state === 'dead') continue

      this.ctx.beginPath()
      this.ctx.arc(player.position.x, player.position.y, this.HIT_RADIUS, 0, Math.PI * 2)
      this.ctx.strokeStyle = COLORS.hitbox
      this.ctx.lineWidth = 2
      this.ctx.stroke()
    }

    // Projectile hitboxes
    for (const proj of frame.projectiles) {
      this.ctx.beginPath()
      this.ctx.arc(proj.position.x, proj.position.y, this.PROJECTILE_RADIUS, 0, Math.PI * 2)
      this.ctx.strokeStyle = COLORS.projectileHitbox
      this.ctx.lineWidth = 2
      this.ctx.stroke()
    }
  }

  /**
   * Render velocity vectors
   */
  private renderVelocityVectors(players: PlayerSnapshot[]): void {
    if (!this.ctx) return

    for (const player of players) {
      const velLength = Math.sqrt(player.velocity.x ** 2 + player.velocity.y ** 2)
      if (velLength < 1) continue

      const scale = 0.1 // Scale down velocity for display
      const endX = player.position.x + player.velocity.x * scale
      const endY = player.position.y + player.velocity.y * scale

      this.ctx.beginPath()
      this.ctx.moveTo(player.position.x, player.position.y)
      this.ctx.lineTo(endX, endY)
      this.ctx.strokeStyle = COLORS.velocity
      this.ctx.lineWidth = 2
      this.ctx.stroke()

      // Arrow head
      const angle = Math.atan2(player.velocity.y, player.velocity.x)
      const arrowSize = 6
      this.ctx.beginPath()
      this.ctx.moveTo(endX, endY)
      this.ctx.lineTo(
        endX - arrowSize * Math.cos(angle - Math.PI / 6),
        endY - arrowSize * Math.sin(angle - Math.PI / 6)
      )
      this.ctx.moveTo(endX, endY)
      this.ctx.lineTo(
        endX - arrowSize * Math.cos(angle + Math.PI / 6),
        endY - arrowSize * Math.sin(angle + Math.PI / 6)
      )
      this.ctx.stroke()
    }
  }

  /**
   * Render latency overlay
   */
  private renderLatencyOverlay(stats: NetworkStats, tick: number): void {
    if (!this.ctx) return

    const x = 10
    const y = this.ctx.canvas.height - 90

    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(x, y, 160, 80)

    this.ctx.font = '11px monospace'
    this.ctx.textAlign = 'left'

    // RTT with color coding
    const rttColor = stats.rttMs < 50 ? COLORS.healthHigh :
                     stats.rttMs < 100 ? COLORS.healthMed : COLORS.healthLow

    this.ctx.fillStyle = '#ffffff'
    this.ctx.fillText('RTT:', x + 5, y + 15)
    this.ctx.fillStyle = rttColor
    this.ctx.fillText(`${stats.rttMs}ms`, x + 50, y + 15)

    this.ctx.fillStyle = '#ffffff'
    this.ctx.fillText(`Jitter: ${stats.jitterMs}ms`, x + 5, y + 30)
    this.ctx.fillText(`Client Tick: ${stats.clientTick}`, x + 5, y + 45)
    this.ctx.fillText(`Server Tick: ${stats.serverTick}`, x + 5, y + 60)
    this.ctx.fillText(`Frame Tick: ${tick}`, x + 5, y + 75)
  }

  /**
   * Render combat events (hit markers, etc.)
   */
  private renderEvents(frame: TelemetryFrame): void {
    if (!this.ctx) return

    for (const event of frame.events) {
      if (event.type === 'hit') {
        const data = event.data as { hitPosition: Vector2 }
        this.renderHitMarker(data.hitPosition)
      } else if (event.type === 'death') {
        const data = event.data as { finalHitPosition: Vector2 }
        this.renderDeathMarker(data.finalHitPosition)
      }
    }
  }

  /**
   * Render hit marker
   */
  private renderHitMarker(position: Vector2): void {
    if (!this.ctx) return

    const size = 12
    this.ctx.strokeStyle = '#ff0000'
    this.ctx.lineWidth = 3

    // X shape
    this.ctx.beginPath()
    this.ctx.moveTo(position.x - size, position.y - size)
    this.ctx.lineTo(position.x + size, position.y + size)
    this.ctx.moveTo(position.x + size, position.y - size)
    this.ctx.lineTo(position.x - size, position.y + size)
    this.ctx.stroke()
  }

  /**
   * Render death marker
   */
  private renderDeathMarker(position: Vector2): void {
    if (!this.ctx) return

    // Skull icon or large X
    const size = 20
    this.ctx.strokeStyle = '#ff0000'
    this.ctx.lineWidth = 4

    this.ctx.beginPath()
    this.ctx.arc(position.x, position.y, size, 0, Math.PI * 2)
    this.ctx.stroke()

    this.ctx.beginPath()
    this.ctx.moveTo(position.x - size * 0.7, position.y - size * 0.7)
    this.ctx.lineTo(position.x + size * 0.7, position.y + size * 0.7)
    this.ctx.moveTo(position.x + size * 0.7, position.y - size * 0.7)
    this.ctx.lineTo(position.x - size * 0.7, position.y + size * 0.7)
    this.ctx.stroke()
  }

  /**
   * Clear trail history
   */
  clearTrails(): void {
    this.playerTrails.clear()
    this.projectileTrails.clear()
  }

  /**
   * Reset renderer state
   */
  reset(): void {
    this.clearTrails()
    this.options = { ...DEFAULT_OPTIONS }
  }
}
