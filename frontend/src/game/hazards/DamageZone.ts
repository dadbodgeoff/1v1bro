/**
 * DamageZone - Hazard zone that deals periodic damage
 * 
 * @module hazards/DamageZone
 */

import type { HazardState } from '../arena/types'
import type { Rectangle } from '../types'

// ============================================================================
// Constants
// ============================================================================

const TICK_INTERVAL_MS = 250  // 4 ticks per second
const DEFAULT_DAMAGE_PER_SECOND = 10

// ============================================================================
// DamageZone Class
// ============================================================================

/**
 * DamageZone deals periodic damage to players inside
 * Requirements: 3.1, 3.6
 */
export class DamageZone {
  private id: string
  private bounds: Rectangle
  private damagePerSecond: number
  private lastTickTime: Map<string, number> = new Map()

  /**
   * Create a new damage zone
   * 
   * @param state - Hazard state
   */
  constructor(state: HazardState) {
    this.id = state.id
    this.bounds = { ...state.bounds }
    this.damagePerSecond = state.intensity || DEFAULT_DAMAGE_PER_SECOND
  }

  /**
   * Get zone ID
   */
  getId(): string {
    return this.id
  }

  /**
   * Get zone bounds
   */
  getBounds(): Rectangle {
    return this.bounds
  }

  /**
   * Get damage per tick (intensity / 4 for 4 ticks per second)
   * Requirements: 3.6
   */
  getDamagePerTick(): number {
    return this.damagePerSecond / 4
  }

  /**
   * Get tick interval in milliseconds
   * Requirements: 3.6
   */
  getTickInterval(): number {
    return TICK_INTERVAL_MS
  }

  /**
   * Check if a player should take damage this frame
   * 
   * @param playerId - Player ID
   * @param currentTime - Current timestamp
   * @returns Damage amount if tick occurred, 0 otherwise
   */
  checkDamageTick(playerId: string, currentTime: number): number {
    const lastTick = this.lastTickTime.get(playerId) || 0
    
    if (currentTime - lastTick >= TICK_INTERVAL_MS) {
      this.lastTickTime.set(playerId, currentTime)
      return this.getDamagePerTick()
    }
    
    return 0
  }

  /**
   * Reset tick timer for a player (when they enter the zone)
   * 
   * @param playerId - Player ID
   */
  resetTick(playerId: string): void {
    this.lastTickTime.delete(playerId)
  }

  /**
   * Clear all tick timers
   */
  clearTicks(): void {
    this.lastTickTime.clear()
  }
}
