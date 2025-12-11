/**
 * TransportManager - Coordinates teleporters and jump pads
 * 
 * @module transport/TransportManager
 */

import type { 
  TeleporterConfig, 
  TeleporterState,
  JumpPadConfig, 
  JumpPadState,
  TransportCallbacks 
} from '../arena/types'
import type { MapTheme } from '../config/maps/map-schema'
import type { Vector2 } from '../types'
import { Teleporter } from './Teleporter'
import { JumpPad } from './JumpPad'
import { arenaAssets } from '../assets/ArenaAssetLoader'

// ============================================================================
// TransportManager Class
// ============================================================================

/**
 * TransportManager coordinates all teleporters and jump pads
 * Requirements: 5.1, 5.2, 5.4, 5.5, 5.6, 5.7, 6.1, 6.2, 6.4, 6.8
 */
export class TransportManager {
  private teleporters: Map<string, Teleporter> = new Map()
  private jumpPads: Map<string, JumpPad> = new Map()
  private teleporterPairs: Map<string, [string, string]> = new Map()
  private callbacks: TransportCallbacks = {}
  private theme: MapTheme = 'space'

  /**
   * Set the visual theme for transport rendering
   * @param theme - Map theme ('space' | 'volcanic' | etc.)
   */
  setTheme(theme: MapTheme): void {
    this.theme = theme
  }

  /**
   * Initialize transport systems from map configuration
   * 
   * @param teleporterConfigs - Array of teleporter configurations
   * @param jumpPadConfigs - Array of jump pad configurations
   */
  initialize(teleporterConfigs: TeleporterConfig[], jumpPadConfigs: JumpPadConfig[]): void {
    this.teleporters.clear()
    this.jumpPads.clear()
    this.teleporterPairs.clear()

    // Create teleporters
    for (const config of teleporterConfigs) {
      const state: TeleporterState = {
        id: config.id,
        pairId: config.pairId,
        position: { ...config.position },
        radius: config.radius,
        linkedTeleporterId: null,
        playerCooldowns: new Map()
      }
      this.teleporters.set(config.id, new Teleporter(state))
    }

    // Link teleporter pairs
    this.linkTeleporterPairs()

    // Create jump pads
    for (const config of jumpPadConfigs) {
      const state: JumpPadState = {
        id: config.id,
        position: { ...config.position },
        radius: config.radius,
        direction: config.direction,
        force: config.force,
        playerCooldowns: new Map()
      }
      this.jumpPads.set(config.id, new JumpPad(state))
    }
  }

  /**
   * Link teleporter pairs by pairId
   * Requirements: 5.1
   */
  private linkTeleporterPairs(): void {
    const pairMap = new Map<string, Teleporter[]>()

    // Group teleporters by pairId
    for (const teleporter of this.teleporters.values()) {
      const pairId = teleporter.getPairId()
      if (!pairMap.has(pairId)) {
        pairMap.set(pairId, [])
      }
      pairMap.get(pairId)!.push(teleporter)
    }

    // Link pairs
    for (const [pairId, teleporters] of pairMap) {
      if (teleporters.length === 2) {
        teleporters[0].linkTo(teleporters[1])
        teleporters[1].linkTo(teleporters[0])
        this.teleporterPairs.set(pairId, [teleporters[0].getId(), teleporters[1].getId()])
      }
    }
  }

  /**
   * Set event callbacks
   * 
   * @param callbacks - Callback functions for transport events
   */
  setCallbacks(callbacks: TransportCallbacks): void {
    this.callbacks = callbacks
  }

  /**
   * Update transport cooldowns
   * 
   * @param deltaTime - Time since last update in seconds
   */
  update(_deltaTime: number): void {
    const currentTime = Date.now()

    // Clean up expired cooldowns
    for (const teleporter of this.teleporters.values()) {
      teleporter.cleanupCooldowns(currentTime)
    }
    for (const jumpPad of this.jumpPads.values()) {
      jumpPad.cleanupCooldowns(currentTime)
    }
  }

  /**
   * Check if player should teleport
   * Requirements: 5.2
   * 
   * @param playerId - Player ID
   * @param position - Player position
   * @returns Destination position or null
   */
  checkTeleport(playerId: string, position: Vector2): Vector2 | null {
    const currentTime = Date.now()

    for (const teleporter of this.teleporters.values()) {
      if (!teleporter.isInRange(position)) continue
      if (!teleporter.canTeleport(playerId, currentTime)) continue

      const linkedId = teleporter.getLinkedTeleporterId()
      if (!linkedId) continue

      const destination = this.teleporters.get(linkedId)
      if (!destination) continue

      const from = teleporter.getPosition()
      const to = teleporter.teleport(playerId, destination, currentTime)

      this.callbacks.onTeleport?.(playerId, from, to)
      return to
    }

    return null
  }

  /**
   * Check if player should be launched by jump pad
   * Requirements: 6.1, 6.2
   * 
   * @param playerId - Player ID
   * @param position - Player position
   * @returns Velocity vector or null
   */
  checkJumpPad(playerId: string, position: Vector2): Vector2 | null {
    const currentTime = Date.now()

    for (const jumpPad of this.jumpPads.values()) {
      if (!jumpPad.isInRange(position)) continue
      if (!jumpPad.canLaunch(playerId, currentTime)) continue

      const velocity = jumpPad.launch(playerId, currentTime)
      this.callbacks.onLaunch?.(playerId, velocity)
      return velocity
    }

    return null
  }

  /**
   * Check if a teleporter is on cooldown for a player
   * Requirements: 5.6
   * 
   * @param teleporterId - Teleporter ID
   * @param playerId - Player ID
   * @returns true if on cooldown
   */
  isTeleporterOnCooldown(teleporterId: string, playerId: string): boolean {
    const teleporter = this.teleporters.get(teleporterId)
    if (!teleporter) return false
    return teleporter.isOnCooldown(playerId, Date.now())
  }

  /**
   * Get all teleporters
   * 
   * @returns Array of teleporters
   */
  getTeleporters(): Teleporter[] {
    return Array.from(this.teleporters.values())
  }

  /**
   * Get all jump pads
   * 
   * @returns Array of jump pads
   */
  getJumpPads(): JumpPad[] {
    return Array.from(this.jumpPads.values())
  }

  /**
   * Render all transport elements
   * Requirements: 5.7, 6.5, 6.8
   * 
   * @param ctx - Canvas rendering context
   */
  render(ctx: CanvasRenderingContext2D): void {
    // Render teleporters
    for (const teleporter of this.teleporters.values()) {
      this.renderTeleporter(ctx, teleporter)
    }

    // Render jump pads
    for (const jumpPad of this.jumpPads.values()) {
      this.renderJumpPad(ctx, jumpPad)
    }
  }

  /**
   * Render a teleporter
   * Requirements: 5.7
   */
  private renderTeleporter(ctx: CanvasRenderingContext2D, teleporter: Teleporter): void {
    if (this.theme === 'volcanic') {
      this.renderVolcanicTeleporter(ctx, teleporter)
      return
    }

    const pos = teleporter.getPosition()
    const radius = teleporter.getRadius()

    ctx.save()

    // Draw teleporter image (smaller size, no particles)
    const imageSize = radius * 1.6
    ctx.globalAlpha = 0.9
    const drawn = arenaAssets.drawCentered(ctx, 'teleporter', pos.x, pos.y, imageSize, imageSize)
    ctx.globalAlpha = 1

    // Fallback if image not loaded
    if (!drawn) {
      // Base glow
      const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius)
      gradient.addColorStop(0, 'rgba(0, 255, 255, 0.6)')
      gradient.addColorStop(0.5, 'rgba(0, 200, 255, 0.3)')
      gradient.addColorStop(1, 'rgba(0, 150, 255, 0)')
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }

  /**
   * Render volcanic teleporter - obsidian ring with dark void center
   * Fits volcanic theme but clearly different from damage hazards
   */
  private renderVolcanicTeleporter(ctx: CanvasRenderingContext2D, teleporter: Teleporter): void {
    const pos = teleporter.getPosition()
    const radius = teleporter.getRadius()
    const time = Date.now() / 1000

    ctx.save()

    // Obsidian ring base (dark volcanic rock)
    ctx.fillStyle = '#1a1a1f'
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, radius + 3, 0, Math.PI * 2)
    ctx.fill()

    // Dark void center (where you teleport)
    const centerGradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius * 0.8)
    centerGradient.addColorStop(0, 'rgba(10, 10, 15, 0.95)')
    centerGradient.addColorStop(0.6, 'rgba(20, 15, 25, 0.9)')
    centerGradient.addColorStop(1, 'rgba(30, 20, 35, 0.85)')
    
    ctx.fillStyle = centerGradient
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, radius * 0.8, 0, Math.PI * 2)
    ctx.fill()

    // Subtle inner swirl (very dark, barely visible)
    const swirlAlpha = 0.1 + 0.05 * Math.sin(time * 1.5)
    ctx.strokeStyle = `rgba(60, 40, 70, ${swirlAlpha})`
    ctx.lineWidth = 1.5
    for (let i = 0; i < 2; i++) {
      const spiralOffset = time * 0.3 + i * Math.PI
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, radius * (0.3 + i * 0.2), spiralOffset, spiralOffset + Math.PI * 1.2)
      ctx.stroke()
    }

    // Obsidian ring edge (darker than surroundings)
    ctx.strokeStyle = '#2a2a32'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2)
    ctx.stroke()

    // Subtle ember accents on ring (ties to volcanic theme without being "danger")
    const emberAlpha = 0.3 + 0.1 * Math.sin(time * 2)
    ctx.fillStyle = `rgba(120, 60, 40, ${emberAlpha})`
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI / 2) + time * 0.2
      const ex = pos.x + Math.cos(angle) * (radius - 1)
      const ey = pos.y + Math.sin(angle) * (radius - 1)
      ctx.beginPath()
      ctx.arc(ex, ey, 2, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }

  /**
   * Render a jump pad with directional arrow
   * Requirements: 6.8
   */
  private renderJumpPad(ctx: CanvasRenderingContext2D, jumpPad: JumpPad): void {
    if (this.theme === 'volcanic') {
      this.renderVolcanicJumpPad(ctx, jumpPad)
      return
    }

    const pos = jumpPad.getPosition()
    const radius = jumpPad.getRadius()
    const dir = jumpPad.getDirectionVector()
    const time = Date.now() / 1000
    const pulse = 0.7 + 0.3 * Math.sin(time * 4)

    ctx.save()

    // Calculate rotation angle from direction vector
    // The arrow image points UP by default, so we rotate based on direction
    // atan2 gives angle from positive X axis, arrow pointing up needs +PI/2 offset
    const angle = Math.atan2(dir.y, dir.x) + Math.PI / 2

    // Draw jump pad arrow image (rotated)
    const imageSize = radius * 2.2
    ctx.translate(pos.x, pos.y)
    ctx.rotate(angle)
    ctx.globalAlpha = 0.9
    const drawn = arenaAssets.drawCentered(ctx, 'jump-pad', 0, 0, imageSize, imageSize)
    ctx.globalAlpha = 1
    ctx.rotate(-angle)
    ctx.translate(-pos.x, -pos.y)

    // Fallback if image not loaded
    if (!drawn) {
      // Base pad
      const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius)
      gradient.addColorStop(0, 'rgba(255, 200, 0, 0.6)')
      gradient.addColorStop(0.5, 'rgba(255, 150, 0, 0.3)')
      gradient.addColorStop(1, 'rgba(255, 100, 0, 0)')
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2)
      ctx.fill()

      // Arrow
      const arrowLength = radius * 0.8
      const arrowWidth = radius * 0.4
      ctx.fillStyle = `rgba(255, 255, 100, ${0.5 + pulse * 0.5})`
      ctx.beginPath()
      const tipX = pos.x + dir.x * arrowLength
      const tipY = pos.y + dir.y * arrowLength
      const perpX = -dir.y
      const perpY = dir.x
      ctx.moveTo(tipX, tipY)
      ctx.lineTo(pos.x + perpX * arrowWidth, pos.y + perpY * arrowWidth)
      ctx.lineTo(pos.x - perpX * arrowWidth, pos.y - perpY * arrowWidth)
      ctx.closePath()
      ctx.fill()
    }

    ctx.restore()
  }

  /**
   * Render volcanic jump pad - stone platform with warm directional glow
   * Fits volcanic theme, clearly a "boost" not a hazard
   */
  private renderVolcanicJumpPad(ctx: CanvasRenderingContext2D, jumpPad: JumpPad): void {
    const pos = jumpPad.getPosition()
    const radius = jumpPad.getRadius()
    const dir = jumpPad.getDirectionVector()
    const time = Date.now() / 1000

    ctx.save()

    // Calculate rotation angle from direction
    const angle = Math.atan2(dir.y, dir.x)

    // Stone base (volcanic rock, darker than floor)
    ctx.fillStyle = '#252528'
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2)
    ctx.fill()

    // Carved ring edge
    ctx.strokeStyle = '#3a3a3f'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, radius - 2, 0, Math.PI * 2)
    ctx.stroke()

    // Warm glow from center (not orange/red like hazards - more amber/gold)
    const glowPulse = 0.4 + 0.15 * Math.sin(time * 2.5)
    const glowGradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius * 0.7)
    glowGradient.addColorStop(0, `rgba(180, 140, 80, ${glowPulse})`)
    glowGradient.addColorStop(0.5, `rgba(140, 100, 50, ${glowPulse * 0.5})`)
    glowGradient.addColorStop(1, 'transparent')
    
    ctx.fillStyle = glowGradient
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, radius * 0.7, 0, Math.PI * 2)
    ctx.fill()

    // Direction arrow (carved into stone, subtle)
    ctx.save()
    ctx.translate(pos.x, pos.y)
    ctx.rotate(angle)

    const arrowLength = radius * 0.6
    const arrowWidth = radius * 0.35
    
    // Arrow glow
    const arrowAlpha = 0.5 + 0.2 * Math.sin(time * 3)
    ctx.fillStyle = `rgba(200, 160, 100, ${arrowAlpha})`
    
    ctx.beginPath()
    ctx.moveTo(arrowLength * 0.8, 0)
    ctx.lineTo(-arrowLength * 0.3, -arrowWidth)
    ctx.lineTo(-arrowLength * 0.1, 0)
    ctx.lineTo(-arrowLength * 0.3, arrowWidth)
    ctx.closePath()
    ctx.fill()

    ctx.restore()

    ctx.restore()
  }
}
