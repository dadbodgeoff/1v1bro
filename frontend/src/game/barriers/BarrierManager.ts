/**
 * BarrierManager - Manages all barrier instances and their lifecycle
 * Handles collision detection, damage, and destruction
 * 
 * @module barriers/BarrierManager
 */

import type { 
  BarrierConfig, 
  BarrierState, 
  BarrierCallbacks
} from '../arena/types'
import type { MapTheme } from '../config/maps/map-schema'
import type { Vector2 } from '../types'
import { DestructibleBarrier } from './DestructibleBarrier'
import { OneWayBarrier } from './OneWayBarrier'
import { blocksProjectiles, BARRIER_HEALTH } from './BarrierTypes'
import { VOLCANIC_COLORS } from '../backdrop/types'

// ============================================================================
// BarrierManager Class
// ============================================================================

/**
 * BarrierManager manages all barrier instances and their lifecycle
 * Requirements: 2.1, 2.2, 2.3, 2.5, 2.9, 2.10, 2.11
 */
export class BarrierManager {
  private barriers: Map<string, BarrierState> = new Map()
  private destructibles: Map<string, DestructibleBarrier> = new Map()
  private oneWays: Map<string, OneWayBarrier> = new Map()
  private callbacks: BarrierCallbacks = {}
  private theme: MapTheme = 'space'

  /**
   * Set the visual theme for barrier rendering
   * @param theme - Map theme ('space' | 'volcanic' | etc.)
   */
  setTheme(theme: MapTheme): void {
    this.theme = theme
  }

  /**
   * Initialize barriers from map configuration
   * 
   * @param configs - Array of barrier configurations
   */
  initialize(configs: BarrierConfig[]): void {
    this.barriers.clear()
    this.destructibles.clear()
    this.oneWays.clear()

    for (const config of configs) {
      const state: BarrierState = {
        id: config.id,
        type: config.type,
        position: { ...config.position },
        size: { ...config.size },
        health: config.health ?? BARRIER_HEALTH.DEFAULT,
        maxHealth: config.health ?? BARRIER_HEALTH.DEFAULT,
        damageState: 'intact',
        isActive: true
      }

      this.barriers.set(config.id, state)

      if (config.type === 'destructible') {
        this.destructibles.set(config.id, new DestructibleBarrier(state))
      } else if (config.type === 'one_way' && config.direction) {
        this.oneWays.set(config.id, new OneWayBarrier(state, config.direction))
      }
    }
  }

  /**
   * Set event callbacks
   * 
   * @param callbacks - Callback functions for barrier events
   */
  setCallbacks(callbacks: BarrierCallbacks): void {
    this.callbacks = callbacks
  }

  /**
   * Check collision against barriers
   * Requirements: 2.1, 2.2, 10.1
   * 
   * @param position - Position to check
   * @param radius - Collision radius
   * @param nearbyIds - IDs of nearby barriers from spatial hash
   * @returns true if collision detected
   */
  checkCollision(position: Vector2, radius: number, nearbyIds: string[]): boolean {
    for (const id of nearbyIds) {
      const barrier = this.barriers.get(id)
      if (!barrier || !barrier.isActive) continue

      // One-way barriers have special collision logic
      if (barrier.type === 'one_way') {
        const oneWay = this.oneWays.get(id)
        if (oneWay && !oneWay.shouldBlock(position)) continue
      }

      if (this.circleRectCollision(position, radius, barrier)) {
        return true
      }
    }
    return false
  }

  /**
   * Check if a projectile should collide with barriers
   * 
   * @param position - Projectile position
   * @param nearbyIds - IDs of nearby barriers
   * @returns Barrier ID if collision, null otherwise
   */
  checkProjectileCollision(position: Vector2, nearbyIds: string[]): string | null {
    for (const id of nearbyIds) {
      const barrier = this.barriers.get(id)
      if (!barrier || !barrier.isActive) continue

      // Half walls don't block projectiles
      if (!blocksProjectiles(barrier.type)) continue

      if (this.pointInRect(position, barrier)) {
        return id
      }
    }
    return null
  }

  /**
   * Resolve collision by pushing position out of barriers
   * 
   * @param position - Current position
   * @param radius - Collision radius
   * @param nearbyIds - IDs of nearby barriers
   * @returns Resolved position
   */
  resolveCollision(position: Vector2, radius: number, nearbyIds: string[]): Vector2 {
    let resolved = { ...position }

    for (const id of nearbyIds) {
      const barrier = this.barriers.get(id)
      if (!barrier || !barrier.isActive) continue

      // One-way barriers
      if (barrier.type === 'one_way') {
        const oneWay = this.oneWays.get(id)
        if (oneWay && !oneWay.shouldBlock(resolved)) continue
      }

      if (this.circleRectCollision(resolved, radius, barrier)) {
        resolved = this.pushOutOfRect(resolved, radius, barrier)
      }
    }

    return resolved
  }

  /**
   * Apply damage to a destructible barrier
   * Requirements: 2.3, 2.5, 2.11
   * 
   * @param barrierId - ID of barrier to damage
   * @param damage - Damage amount
   */
  applyDamage(barrierId: string, damage: number): void {
    const destructible = this.destructibles.get(barrierId)
    if (!destructible) return

    const result = destructible.applyDamage(damage)
    const barrier = this.barriers.get(barrierId)!

    barrier.health = result.health
    barrier.damageState = result.damageState

    this.callbacks.onDamaged?.(barrierId, result.health, barrier.maxHealth)

    if (result.destroyed) {
      barrier.isActive = false
      this.callbacks.onDestroyed?.(barrierId, barrier.position)
    }
  }

  /**
   * Get all active barriers for spatial hash
   * 
   * @returns Array of active barrier states
   */
  getActiveBarriers(): BarrierState[] {
    return Array.from(this.barriers.values()).filter(b => b.isActive)
  }

  /**
   * Get barrier at position
   * Requirements: 2.10
   * 
   * @param position - Position to check
   * @returns BarrierState or null
   */
  getBarrierAt(position: Vector2): BarrierState | null {
    for (const barrier of this.barriers.values()) {
      if (!barrier.isActive) continue
      if (this.pointInRect(position, barrier)) {
        return barrier
      }
    }
    return null
  }

  /**
   * Get barrier by ID
   * 
   * @param id - Barrier ID
   * @returns BarrierState or undefined
   */
  getBarrier(id: string): BarrierState | undefined {
    return this.barriers.get(id)
  }

  /**
   * Apply server-authoritative barrier state
   * SERVER AUTHORITY: Sync client state with server
   * Requirements: 6.1
   * 
   * @param serverState - Array of barrier states from server
   */
  applyServerState(serverState: Array<{
    id: string
    x: number
    y: number
    width: number
    height: number
    type: string
    health: number
    max_health: number
    is_active: boolean
    direction?: string
  }>): void {
    const serverIds = new Set(serverState.map(s => s.id))

    // Remove barriers that no longer exist on server
    for (const id of this.barriers.keys()) {
      if (!serverIds.has(id)) {
        this.barriers.delete(id)
        this.destructibles.delete(id)
        this.oneWays.delete(id)
      }
    }

    // Map server direction to client direction
    const mapDirection = (dir?: string): 'N' | 'S' | 'E' | 'W' | undefined => {
      if (!dir) return undefined
      const dirMap: Record<string, 'N' | 'S' | 'E' | 'W'> = {
        'up': 'N', 'down': 'S', 'left': 'W', 'right': 'E',
        'N': 'N', 'S': 'S', 'E': 'E', 'W': 'W'
      }
      return dirMap[dir]
    }

    // Update or create barriers from server state
    for (const state of serverState) {
      const existing = this.barriers.get(state.id)
      
      if (existing) {
        // Update existing barrier
        existing.position = { x: state.x, y: state.y }
        existing.size = { x: state.width, y: state.height }
        existing.health = state.health
        existing.maxHealth = state.max_health
        existing.isActive = state.is_active
        
        // Update damage state based on health percentage
        const healthPercent = state.health / state.max_health
        if (healthPercent <= 0) {
          existing.damageState = 'destroyed'
        } else if (healthPercent <= 0.33) {
          existing.damageState = 'damaged'
        } else if (healthPercent <= 0.66) {
          existing.damageState = 'cracked'
        } else {
          existing.damageState = 'intact'
        }
      } else {
        // Create new barrier from server state
        const newState: BarrierState = {
          id: state.id,
          type: state.type as BarrierState['type'],
          position: { x: state.x, y: state.y },
          size: { x: state.width, y: state.height },
          health: state.health,
          maxHealth: state.max_health,
          damageState: 'intact',
          isActive: state.is_active
        }
        
        this.barriers.set(state.id, newState)
        
        if (state.type === 'destructible') {
          this.destructibles.set(state.id, new DestructibleBarrier(newState))
        } else if (state.type === 'one_way') {
          const dir = mapDirection(state.direction)
          if (dir) {
            this.oneWays.set(state.id, new OneWayBarrier(newState, dir))
          }
        }
      }
    }
  }

  /**
   * Handle server barrier damage event
   * SERVER AUTHORITY: Apply damage from server
   * 
   * @param barrierId - ID of damaged barrier
   * @param health - New health value
   * @param maxHealth - Max health value
   */
  applyServerDamage(barrierId: string, health: number, maxHealth: number): void {
    const barrier = this.barriers.get(barrierId)
    if (!barrier) return

    barrier.health = health
    barrier.maxHealth = maxHealth

    // Update damage state
    const healthPercent = health / maxHealth
    if (healthPercent <= 0) {
      barrier.damageState = 'destroyed'
      barrier.isActive = false
    } else if (healthPercent <= 0.33) {
      barrier.damageState = 'damaged'
    } else if (healthPercent <= 0.66) {
      barrier.damageState = 'cracked'
    }

    this.callbacks.onDamaged?.(barrierId, health, maxHealth)
  }

  /**
   * Handle server barrier destruction event
   * SERVER AUTHORITY: Mark barrier as destroyed
   * 
   * @param barrierId - ID of destroyed barrier
   */
  applyServerDestruction(barrierId: string): void {
    const barrier = this.barriers.get(barrierId)
    if (!barrier) return

    barrier.health = 0
    barrier.damageState = 'destroyed'
    barrier.isActive = false

    this.callbacks.onDestroyed?.(barrierId, barrier.position)
  }

  /**
   * Render all barriers
   * Requirements: 2.9
   * 
   * @param ctx - Canvas rendering context
   */
  render(ctx: CanvasRenderingContext2D): void {
    for (const barrier of this.barriers.values()) {
      if (!barrier.isActive) continue
      this.renderBarrier(ctx, barrier)
    }
  }

  /**
   * Render a single barrier
   */
  private renderBarrier(ctx: CanvasRenderingContext2D, barrier: BarrierState): void {
    if (this.theme === 'volcanic') {
      this.renderVolcanicBarrier(ctx, barrier)
      return
    }

    const { position, size, type, damageState } = barrier
    const time = Date.now() / 1000
    const pulse = 0.6 + 0.4 * Math.sin(time * 1.5)

    ctx.save()

    // Spaceship hull plating style - dark metallic with subtle glow
    const isHorizontal = size.x > size.y
    
    // Main body - dark metallic hull
    const coreGradient = isHorizontal
      ? ctx.createLinearGradient(position.x, position.y, position.x, position.y + size.y)
      : ctx.createLinearGradient(position.x, position.y, position.x + size.x, position.y)
    
    coreGradient.addColorStop(0, 'rgba(60, 65, 75, 0.95)')
    coreGradient.addColorStop(0.2, 'rgba(35, 40, 50, 0.98)')
    coreGradient.addColorStop(0.8, 'rgba(35, 40, 50, 0.98)')
    coreGradient.addColorStop(1, 'rgba(50, 55, 65, 0.95)')
    
    ctx.fillStyle = coreGradient
    ctx.fillRect(position.x, position.y, size.x, size.y)

    // Subtle outer edge highlight
    ctx.strokeStyle = 'rgba(100, 105, 115, 0.8)'
    ctx.lineWidth = 2
    ctx.strokeRect(position.x, position.y, size.x, size.y)

    // Inner bevel - darker edge for depth
    ctx.strokeStyle = 'rgba(20, 25, 35, 0.9)'
    ctx.lineWidth = 1
    ctx.strokeRect(position.x + 2, position.y + 2, size.x - 4, size.y - 4)

    // Panel seams
    this.renderPanelSeams(ctx, barrier)

    // Subtle warning lights at corners
    this.renderWarningLights(ctx, barrier, pulse)

    // Draw cracks for damaged destructibles
    if (type === 'destructible' && damageState !== 'intact') {
      this.renderCracks(ctx, barrier)
    }

    // Draw direction indicator for one-way barriers
    if (type === 'one_way') {
      this.renderOneWayIndicator(ctx, barrier)
    }

    ctx.restore()
  }

  /**
   * Render volcanic obsidian barrier
   */
  private renderVolcanicBarrier(ctx: CanvasRenderingContext2D, barrier: BarrierState): void {
    const { position, size, type, damageState, health, maxHealth } = barrier
    const time = Date.now() / 1000
    const pulse = 0.6 + 0.4 * Math.sin(time * 2)

    ctx.save()

    // Dark obsidian base gradient
    const isHorizontal = size.x > size.y
    const obsidianGradient = isHorizontal
      ? ctx.createLinearGradient(position.x, position.y, position.x, position.y + size.y)
      : ctx.createLinearGradient(position.x, position.y, position.x + size.x, position.y)

    obsidianGradient.addColorStop(0, '#2d2d2d')
    obsidianGradient.addColorStop(0.3, VOLCANIC_COLORS.obsidian)
    obsidianGradient.addColorStop(0.7, VOLCANIC_COLORS.obsidian)
    obsidianGradient.addColorStop(1, '#2d2d2d')

    ctx.fillStyle = obsidianGradient
    ctx.fillRect(position.x, position.y, size.x, size.y)

    // Orange/red glow along edges
    ctx.save()
    ctx.shadowColor = VOLCANIC_COLORS.lavaGlow
    ctx.shadowBlur = 8 * pulse
    ctx.strokeStyle = VOLCANIC_COLORS.lavaDark
    ctx.lineWidth = 2
    ctx.strokeRect(position.x, position.y, size.x, size.y)
    ctx.restore()

    // Inner edge highlight
    ctx.strokeStyle = `rgba(255, 102, 0, ${0.3 * pulse})`
    ctx.lineWidth = 1
    ctx.strokeRect(position.x + 2, position.y + 2, size.x - 4, size.y - 4)

    // Volcanic rock texture
    this.renderVolcanicTexture(ctx, barrier)

    // Cracks with lava glow for destructible barriers
    if (type === 'destructible') {
      const crackIntensity = 1 - (health / maxHealth)
      this.renderVolcanicCracks(ctx, barrier, crackIntensity)
    }

    // Half walls show more cracks
    if (type === 'half' || damageState !== 'intact') {
      this.renderVolcanicCracks(ctx, barrier, type === 'half' ? 0.3 : 0.5)
    }

    // Draw direction indicator for one-way barriers
    if (type === 'one_way') {
      this.renderOneWayIndicator(ctx, barrier)
    }

    ctx.restore()
  }

  /**
   * Render volcanic rock texture
   */
  private renderVolcanicTexture(ctx: CanvasRenderingContext2D, barrier: BarrierState): void {
    const { position, size } = barrier

    // Add subtle rock texture with darker patches
    ctx.globalAlpha = 0.3
    ctx.fillStyle = '#0a0a0a'

    const seed = position.x * 7 + position.y * 13
    for (let i = 0; i < 5; i++) {
      const x = position.x + ((seed * (i + 1) * 17) % size.x)
      const y = position.y + ((seed * (i + 1) * 23) % size.y)
      const w = 8 + ((seed * (i + 1) * 7) % 15)
      const h = 6 + ((seed * (i + 1) * 11) % 10)

      ctx.fillRect(x, y, w, h)
    }

    ctx.globalAlpha = 1
  }

  /**
   * Render volcanic cracks with lava glow
   */
  private renderVolcanicCracks(ctx: CanvasRenderingContext2D, barrier: BarrierState, intensity: number): void {
    if (intensity <= 0) return

    const { position, size } = barrier
    const time = Date.now() / 1000
    const glowPulse = 0.5 + 0.5 * Math.sin(time * 3)

    // Crack lines with lava glow
    ctx.save()
    ctx.shadowColor = VOLCANIC_COLORS.lavaCore
    ctx.shadowBlur = 6 * intensity * glowPulse
    ctx.strokeStyle = VOLCANIC_COLORS.crack
    ctx.lineWidth = 2 * intensity

    const crackCount = Math.floor(2 + intensity * 4)
    const seed = position.x * 11 + position.y * 7

    for (let i = 0; i < crackCount; i++) {
      const startX = position.x + ((seed * (i + 1) * 13) % size.x)
      const startY = position.y + ((seed * (i + 1) * 17) % size.y)
      const endX = startX + ((seed * (i + 1) * 7) % 30) - 15
      const endY = startY + ((seed * (i + 1) * 11) % 30) - 15

      ctx.beginPath()
      ctx.moveTo(startX, startY)
      ctx.lineTo(
        Math.max(position.x, Math.min(position.x + size.x, endX)),
        Math.max(position.y, Math.min(position.y + size.y, endY))
      )
      ctx.stroke()
    }

    ctx.restore()
  }

  /**
   * Render panel seam lines for industrial spaceship look
   */
  private renderPanelSeams(ctx: CanvasRenderingContext2D, barrier: BarrierState): void {
    const { position, size } = barrier
    const panelSize = 35

    ctx.strokeStyle = 'rgba(20, 25, 35, 0.6)'
    ctx.lineWidth = 1

    // Horizontal seams
    for (let y = panelSize; y < size.y; y += panelSize) {
      ctx.beginPath()
      ctx.moveTo(position.x + 3, position.y + y)
      ctx.lineTo(position.x + size.x - 3, position.y + y)
      ctx.stroke()
    }

    // Vertical seams
    for (let x = panelSize; x < size.x; x += panelSize) {
      ctx.beginPath()
      ctx.moveTo(position.x + x, position.y + 3)
      ctx.lineTo(position.x + x, position.y + size.y - 3)
      ctx.stroke()
    }

    // Highlight below seams for 3D effect
    ctx.strokeStyle = 'rgba(80, 85, 95, 0.4)'
    for (let y = panelSize; y < size.y; y += panelSize) {
      ctx.beginPath()
      ctx.moveTo(position.x + 3, position.y + y + 1)
      ctx.lineTo(position.x + size.x - 3, position.y + y + 1)
      ctx.stroke()
    }
  }

  /**
   * Render subtle warning lights at corners
   */
  private renderWarningLights(ctx: CanvasRenderingContext2D, barrier: BarrierState, pulse: number): void {
    const { position, size } = barrier
    const lightSize = 4
    const inset = 6
    
    // Amber/orange warning lights - subtle
    ctx.fillStyle = `rgba(255, 150, 50, ${0.3 + pulse * 0.4})`
    ctx.shadowColor = 'rgba(255, 120, 30, 0.5)'
    ctx.shadowBlur = 6 * pulse
    
    // Four corners
    ctx.beginPath()
    ctx.arc(position.x + inset, position.y + inset, lightSize, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.beginPath()
    ctx.arc(position.x + size.x - inset, position.y + inset, lightSize, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.beginPath()
    ctx.arc(position.x + inset, position.y + size.y - inset, lightSize, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.beginPath()
    ctx.arc(position.x + size.x - inset, position.y + size.y - inset, lightSize, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.shadowBlur = 0
  }

  /**
   * Render crack effects on damaged barriers
   */
  private renderCracks(ctx: CanvasRenderingContext2D, barrier: BarrierState): void {
    const { position, size, damageState } = barrier
    
    ctx.strokeStyle = '#00000066'
    ctx.lineWidth = 2

    const crackCount = damageState === 'cracked' ? 2 : 4

    for (let i = 0; i < crackCount; i++) {
      ctx.beginPath()
      const startX = position.x + Math.random() * size.x
      const startY = position.y + Math.random() * size.y
      ctx.moveTo(startX, startY)
      ctx.lineTo(startX + (Math.random() - 0.5) * 30, startY + (Math.random() - 0.5) * 30)
      ctx.stroke()
    }
  }

  /**
   * Render direction indicator for one-way barriers
   */
  private renderOneWayIndicator(ctx: CanvasRenderingContext2D, barrier: BarrierState): void {
    const oneWay = this.oneWays.get(barrier.id)
    if (!oneWay) return

    const { position, size } = barrier
    const centerX = position.x + size.x / 2
    const centerY = position.y + size.y / 2
    const dir = oneWay.getPhaseDirection()

    ctx.fillStyle = '#00ffff88'
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(centerX + dir.x * 20 - dir.y * 10, centerY + dir.y * 20 + dir.x * 10)
    ctx.lineTo(centerX + dir.x * 20 + dir.y * 10, centerY + dir.y * 20 - dir.x * 10)
    ctx.closePath()
    ctx.fill()
  }

  /**
   * Circle-rectangle collision detection
   */
  private circleRectCollision(pos: Vector2, radius: number, barrier: BarrierState): boolean {
    const { position, size } = barrier
    
    const closestX = Math.max(position.x, Math.min(pos.x, position.x + size.x))
    const closestY = Math.max(position.y, Math.min(pos.y, position.y + size.y))
    
    const dx = pos.x - closestX
    const dy = pos.y - closestY
    
    return (dx * dx + dy * dy) < (radius * radius)
  }

  /**
   * Point in rectangle test
   */
  private pointInRect(pos: Vector2, barrier: BarrierState): boolean {
    const { position, size } = barrier
    return pos.x >= position.x && pos.x <= position.x + size.x &&
           pos.y >= position.y && pos.y <= position.y + size.y
  }

  /**
   * Push circle out of rectangle
   */
  private pushOutOfRect(pos: Vector2, radius: number, barrier: BarrierState): Vector2 {
    const { position, size } = barrier
    
    const closestX = Math.max(position.x, Math.min(pos.x, position.x + size.x))
    const closestY = Math.max(position.y, Math.min(pos.y, position.y + size.y))
    
    const dx = pos.x - closestX
    const dy = pos.y - closestY
    const dist = Math.sqrt(dx * dx + dy * dy)
    
    if (dist === 0) {
      // Inside the rectangle, push to nearest edge
      const toLeft = pos.x - position.x
      const toRight = position.x + size.x - pos.x
      const toTop = pos.y - position.y
      const toBottom = position.y + size.y - pos.y
      
      const minDist = Math.min(toLeft, toRight, toTop, toBottom)
      
      if (minDist === toLeft) return { x: position.x - radius, y: pos.y }
      if (minDist === toRight) return { x: position.x + size.x + radius, y: pos.y }
      if (minDist === toTop) return { x: pos.x, y: position.y - radius }
      return { x: pos.x, y: position.y + size.y + radius }
    }
    
    const overlap = radius - dist
    if (overlap > 0) {
      return {
        x: pos.x + (dx / dist) * overlap,
        y: pos.y + (dy / dist) * overlap
      }
    }
    
    return pos
  }
}
