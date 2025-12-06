/**
 * HazardManager - Manages all hazard zones and their effects
 * 
 * @module hazards/HazardManager
 */

import type { 
  HazardConfig, 
  HazardState, 
  HazardType,
  HazardCallbacks 
} from '../arena/types'
import type { Vector2 } from '../types'
import { DamageZone } from './DamageZone'
import { SlowField } from './SlowField'
import { EMPZone } from './EMPZone'
import { arenaAssets } from '../assets/ArenaAssetLoader'

// ============================================================================
// HazardManager Class
// ============================================================================

/**
 * HazardManager coordinates all hazard zones and their effects on players
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.9, 3.10
 */
export class HazardManager {
  private hazards: Map<string, HazardState> = new Map()
  private damageZones: Map<string, DamageZone> = new Map()
  private slowFields: Map<string, SlowField> = new Map()
  private empZones: Map<string, EMPZone> = new Map()
  private callbacks: HazardCallbacks = {}
  private playerLastDamageTick: Map<string, Map<string, number>> = new Map()

  /**
   * Initialize hazards from map configuration
   * 
   * @param configs - Array of hazard configurations
   */
  initialize(configs: HazardConfig[]): void {
    this.hazards.clear()
    this.damageZones.clear()
    this.slowFields.clear()
    this.empZones.clear()
    this.playerLastDamageTick.clear()

    for (const config of configs) {
      const state: HazardState = {
        id: config.id,
        type: config.type,
        bounds: { ...config.bounds },
        intensity: config.intensity,
        isActive: true,
        playersInside: new Set()
      }

      this.hazards.set(config.id, state)

      switch (config.type) {
        case 'damage':
          this.damageZones.set(config.id, new DamageZone(state))
          break
        case 'slow':
          this.slowFields.set(config.id, new SlowField(state))
          break
        case 'emp':
          this.empZones.set(config.id, new EMPZone(state))
          break
      }
    }
  }

  /**
   * Set event callbacks
   * 
   * @param callbacks - Callback functions for hazard events
   */
  setCallbacks(callbacks: HazardCallbacks): void {
    this.callbacks = callbacks
  }

  /**
   * Add a single hazard dynamically
   * 
   * @param config - Hazard configuration to add
   */
  addHazard(config: HazardConfig): void {
    const state: HazardState = {
      id: config.id,
      type: config.type,
      bounds: { ...config.bounds },
      intensity: config.intensity,
      isActive: true,
      playersInside: new Set()
    }

    this.hazards.set(config.id, state)

    switch (config.type) {
      case 'damage':
        this.damageZones.set(config.id, new DamageZone(state))
        break
      case 'slow':
        this.slowFields.set(config.id, new SlowField(state))
        break
      case 'emp':
        this.empZones.set(config.id, new EMPZone(state))
        break
    }
  }

  /**
   * Remove a hazard dynamically
   * 
   * @param hazardId - ID of hazard to remove
   */
  removeHazard(hazardId: string): void {
    const hazard = this.hazards.get(hazardId)
    if (!hazard) return

    // Notify players that effect is removed
    for (const playerId of hazard.playersInside) {
      this.callbacks.onEffectRemoved?.(playerId, hazardId)
    }

    // Clean up type-specific data
    this.damageZones.delete(hazardId)
    this.slowFields.delete(hazardId)
    this.empZones.delete(hazardId)
    this.hazards.delete(hazardId)
  }

  /**
   * Update hazard effects on players
   * Requirements: 3.4, 3.5, 3.6
   * 
   * @param deltaTime - Time since last update in seconds
   * @param players - Map of player IDs to positions
   */
  update(_deltaTime: number, players: Map<string, Vector2>): void {
    const currentTime = Date.now()

    for (const [playerId, position] of players) {
      this.updatePlayerHazards(playerId, position, currentTime)
    }
  }

  /**
   * Update hazard effects for a single player
   */
  private updatePlayerHazards(playerId: string, position: Vector2, currentTime: number): void {
    for (const [hazardId, hazard] of this.hazards) {
      if (!hazard.isActive) continue

      const wasInside = hazard.playersInside.has(playerId)
      const isInside = this.isPointInBounds(position, hazard.bounds)

      if (isInside && !wasInside) {
        // Player entered zone
        hazard.playersInside.add(playerId)
        this.callbacks.onEffectApplied?.(playerId, hazardId, hazard.type)
      } else if (!isInside && wasInside) {
        // Player exited zone
        hazard.playersInside.delete(playerId)
        this.callbacks.onEffectRemoved?.(playerId, hazardId)
      }

      // Apply damage ticks for damage zones
      if (isInside && hazard.type === 'damage') {
        this.applyDamageTick(playerId, hazardId, currentTime)
      }
    }
  }

  /**
   * Apply damage tick from a damage zone
   * Requirements: 3.6
   */
  private applyDamageTick(playerId: string, hazardId: string, currentTime: number): void {
    const damageZone = this.damageZones.get(hazardId)
    if (!damageZone) return

    const damage = damageZone.checkDamageTick(playerId, currentTime)
    if (damage > 0) {
      this.callbacks.onDamage?.(playerId, damage, hazardId)
    }
  }

  /**
   * Get all hazards at a position
   * 
   * @param position - Position to check
   * @returns Array of hazard states at position
   */
  getHazardsAtPosition(position: Vector2): HazardState[] {
    const result: HazardState[] = []
    
    for (const hazard of this.hazards.values()) {
      if (!hazard.isActive) continue
      if (this.isPointInBounds(position, hazard.bounds)) {
        result.push(hazard)
      }
    }
    
    return result
  }

  /**
   * Check if a player is in a specific hazard type
   * Requirements: 3.11
   * 
   * @param playerId - Player ID
   * @param hazardType - Type of hazard to check
   * @returns true if player is in a hazard of that type
   */
  isInHazard(playerId: string, hazardType: HazardType): boolean {
    for (const hazard of this.hazards.values()) {
      if (!hazard.isActive) continue
      if (hazard.type === hazardType && hazard.playersInside.has(playerId)) {
        return true
      }
    }
    return false
  }

  /**
   * Get speed multiplier for a player (from slow fields)
   * 
   * @param playerId - Player ID
   * @returns Speed multiplier (1.0 if not in slow field)
   */
  getSpeedMultiplier(playerId: string): number {
    let multiplier = 1.0
    
    for (const [hazardId, hazard] of this.hazards) {
      if (!hazard.isActive || hazard.type !== 'slow') continue
      if (hazard.playersInside.has(playerId)) {
        const slowField = this.slowFields.get(hazardId)
        if (slowField) {
          // Use strongest slow effect (lowest multiplier)
          multiplier = Math.min(multiplier, slowField.getSpeedMultiplier())
        }
      }
    }
    
    return multiplier
  }

  /**
   * Check if power-ups are disabled for a player
   * 
   * @param playerId - Player ID
   * @returns true if player is in an EMP zone
   */
  arePowerUpsDisabled(playerId: string): boolean {
    return this.isInHazard(playerId, 'emp')
  }

  /**
   * Render all hazard zones
   * Requirements: 3.9
   * 
   * @param ctx - Canvas rendering context
   */
  render(ctx: CanvasRenderingContext2D): void {
    for (const hazard of this.hazards.values()) {
      if (!hazard.isActive) continue
      this.renderHazard(ctx, hazard)
    }
  }

  /**
   * Render a single hazard zone
   */
  private renderHazard(ctx: CanvasRenderingContext2D, hazard: HazardState): void {
    const { bounds, type } = hazard
    const time = Date.now() / 1000

    ctx.save()

    // Type-specific rendering
    switch (type) {
      case 'damage':
        this.renderDamageZone(ctx, bounds, time)
        break
      case 'slow':
        this.renderSlowField(ctx, bounds, time)
        break
      case 'emp':
        this.renderEMPZone(ctx, bounds, time)
        break
    }

    ctx.restore()
  }

  /**
   * Render damage zone with danger visuals
   */
  private renderDamageZone(ctx: CanvasRenderingContext2D, bounds: { x: number; y: number; width: number; height: number }, time: number): void {
    const pulse = 0.5 + 0.3 * Math.sin(time * 4)
    const centerX = bounds.x + bounds.width / 2
    const centerY = bounds.y + bounds.height / 2
    
    // Gradient fill
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, bounds.width / 2
    )
    gradient.addColorStop(0, `rgba(255, 50, 50, ${0.4 * pulse})`)
    gradient.addColorStop(1, `rgba(200, 0, 0, ${0.2 * pulse})`)
    
    ctx.fillStyle = gradient
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)

    // Danger stripes
    ctx.save()
    ctx.beginPath()
    ctx.rect(bounds.x, bounds.y, bounds.width, bounds.height)
    ctx.clip()
    
    ctx.strokeStyle = `rgba(255, 100, 0, ${0.3 + pulse * 0.2})`
    ctx.lineWidth = 8
    const stripeSpacing = 20
    const offset = (time * 30) % stripeSpacing
    
    for (let i = -bounds.height; i < bounds.width + bounds.height; i += stripeSpacing) {
      ctx.beginPath()
      ctx.moveTo(bounds.x + i + offset, bounds.y)
      ctx.lineTo(bounds.x + i + offset - bounds.height, bounds.y + bounds.height)
      ctx.stroke()
    }
    ctx.restore()

    // Draw skull icon in center
    const iconSize = Math.min(bounds.width, bounds.height) * 0.6
    ctx.globalAlpha = 0.7 + pulse * 0.3
    arenaAssets.drawCentered(ctx, 'damage-zone', centerX, centerY, iconSize, iconSize)
    ctx.globalAlpha = 1

    // Border
    ctx.strokeStyle = '#ff4444'
    ctx.lineWidth = 2
    ctx.setLineDash([8, 4])
    ctx.lineDashOffset = -time * 50
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
    ctx.setLineDash([])
  }

  /**
   * Render slow field with ice/frost visuals
   */
  private renderSlowField(ctx: CanvasRenderingContext2D, bounds: { x: number; y: number; width: number; height: number }, time: number): void {
    const centerX = bounds.x + bounds.width / 2
    const centerY = bounds.y + bounds.height / 2
    const pulse = 0.7 + 0.3 * Math.sin(time * 2)
    
    // Subtle icy gradient background
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, bounds.width / 2
    )
    gradient.addColorStop(0, 'rgba(100, 200, 255, 0.2)')
    gradient.addColorStop(0.5, 'rgba(50, 150, 255, 0.15)')
    gradient.addColorStop(1, 'rgba(0, 100, 200, 0.08)')
    
    ctx.fillStyle = gradient
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)

    // Draw ice crystal icon in center
    const iconSize = Math.min(bounds.width, bounds.height) * 0.7
    ctx.globalAlpha = 0.7 + pulse * 0.3
    arenaAssets.drawCentered(ctx, 'slow-field', centerX, centerY, iconSize, iconSize)
    ctx.globalAlpha = 1
  }

  /**
   * Render EMP zone with lightning bolt icon
   */
  private renderEMPZone(ctx: CanvasRenderingContext2D, bounds: { x: number; y: number; width: number; height: number }, time: number): void {
    const centerX = bounds.x + bounds.width / 2
    const centerY = bounds.y + bounds.height / 2
    const pulse = 0.7 + 0.3 * Math.sin(time * 3)
    
    // Subtle yellow warning gradient background
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, bounds.width / 2
    )
    gradient.addColorStop(0, 'rgba(255, 255, 100, 0.2)')
    gradient.addColorStop(0.5, 'rgba(255, 220, 50, 0.15)')
    gradient.addColorStop(1, 'rgba(200, 180, 0, 0.08)')
    
    ctx.fillStyle = gradient
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)

    // Draw EMP lightning bolt icon in center
    const iconSize = Math.min(bounds.width, bounds.height) * 0.7
    ctx.globalAlpha = 0.7 + pulse * 0.3
    arenaAssets.drawCentered(ctx, 'emp-zone', centerX, centerY, iconSize, iconSize)
    ctx.globalAlpha = 1
  }

  /**
   * Check if a point is inside bounds
   */
  private isPointInBounds(point: Vector2, bounds: { x: number; y: number; width: number; height: number }): boolean {
    return point.x >= bounds.x && 
           point.x <= bounds.x + bounds.width &&
           point.y >= bounds.y && 
           point.y <= bounds.y + bounds.height
  }
}
