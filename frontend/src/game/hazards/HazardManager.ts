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
import type { MapTheme } from '../config/maps/map-schema'
import type { Vector2 } from '../types'
import { DamageZone } from './DamageZone'
import { SlowField } from './SlowField'
import { EMPZone } from './EMPZone'
import { HazardRenderer } from './HazardRenderer'

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
  private renderer: HazardRenderer

  constructor() {
    this.renderer = new HazardRenderer()
  }

  setTheme(theme: MapTheme): void {
    this.renderer.setTheme(theme)
  }

  initialize(configs: HazardConfig[]): void {
    this.hazards.clear()
    this.damageZones.clear()
    this.slowFields.clear()
    this.empZones.clear()
    this.playerLastDamageTick.clear()

    for (const config of configs) {
      this.createHazard(config)
    }
  }

  setCallbacks(callbacks: HazardCallbacks): void {
    this.callbacks = callbacks
  }

  addHazard(config: HazardConfig): void {
    this.createHazard(config)
  }

  private createHazard(config: HazardConfig): void {
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

  removeHazard(hazardId: string): void {
    const hazard = this.hazards.get(hazardId)
    if (!hazard) return

    for (const playerId of hazard.playersInside) {
      this.callbacks.onEffectRemoved?.(playerId, hazardId)
    }

    this.damageZones.delete(hazardId)
    this.slowFields.delete(hazardId)
    this.empZones.delete(hazardId)
    this.hazards.delete(hazardId)
  }

  update(_deltaTime: number, players: Map<string, Vector2>): void {
    const currentTime = Date.now()

    for (const [playerId, position] of players) {
      this.updatePlayerHazards(playerId, position, currentTime)
    }
  }

  private updatePlayerHazards(playerId: string, position: Vector2, currentTime: number): void {
    for (const [hazardId, hazard] of this.hazards) {
      if (!hazard.isActive) continue

      const wasInside = hazard.playersInside.has(playerId)
      const isInside = this.isPointInBounds(position, hazard.bounds)

      if (isInside && !wasInside) {
        hazard.playersInside.add(playerId)
        this.callbacks.onEffectApplied?.(playerId, hazardId, hazard.type)
      } else if (!isInside && wasInside) {
        hazard.playersInside.delete(playerId)
        this.callbacks.onEffectRemoved?.(playerId, hazardId)
      }

      if (isInside && hazard.type === 'damage') {
        this.applyDamageTick(playerId, hazardId, currentTime)
      }
    }
  }

  private applyDamageTick(playerId: string, hazardId: string, currentTime: number): void {
    const damageZone = this.damageZones.get(hazardId)
    if (!damageZone) return

    const damage = damageZone.checkDamageTick(playerId, currentTime)
    if (damage > 0) {
      this.callbacks.onDamage?.(playerId, damage, hazardId)
    }
  }

  getAllHazards(): HazardState[] {
    return Array.from(this.hazards.values())
  }

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

  isInHazard(playerId: string, hazardType: HazardType): boolean {
    for (const hazard of this.hazards.values()) {
      if (!hazard.isActive) continue
      if (hazard.type === hazardType && hazard.playersInside.has(playerId)) {
        return true
      }
    }
    return false
  }

  getSpeedMultiplier(playerId: string): number {
    let multiplier = 1.0
    
    for (const [hazardId, hazard] of this.hazards) {
      if (!hazard.isActive || hazard.type !== 'slow') continue
      if (hazard.playersInside.has(playerId)) {
        const slowField = this.slowFields.get(hazardId)
        if (slowField) {
          multiplier = Math.min(multiplier, slowField.getSpeedMultiplier())
        }
      }
    }
    
    return multiplier
  }

  arePowerUpsDisabled(playerId: string): boolean {
    return this.isInHazard(playerId, 'emp')
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.renderer.render(ctx, this.getAllHazards())
  }

  private isPointInBounds(point: Vector2, bounds: { x: number; y: number; width: number; height: number }): boolean {
    return point.x >= bounds.x && 
           point.x <= bounds.x + bounds.width &&
           point.y >= bounds.y && 
           point.y <= bounds.y + bounds.height
  }
}
