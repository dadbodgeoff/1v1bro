/**
 * TrapEffects - Implements trap effect application
 * 
 * @module traps/TrapEffects
 */

import type { TrapEffect, TrapEffectResult } from '../arena/types'
import type { Vector2 } from '../types'

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_DAMAGE_BURST = 50
const DEFAULT_KNOCKBACK_FORCE = 200
const DEFAULT_STUN_DURATION = 0.5
const DEFAULT_EFFECT_RADIUS = 80

// ============================================================================
// TrapEffects Class
// ============================================================================

/**
 * TrapEffects handles applying trap effects to players
 * Requirements: 4.4, 4.5
 */
export class TrapEffects {
  private pendingResults: TrapEffectResult[] = []

  /**
   * Apply a trap effect to players
   * Requirements: 4.4, 4.5
   * 
   * @param effect - Type of effect to apply
   * @param value - Effect value (damage, force, duration)
   * @param playerIds - IDs of affected players
   * @param trapPosition - Position of the trap
   * @param playerPositions - Map of player positions
   */
  apply(
    effect: TrapEffect,
    value: number,
    playerIds: string[],
    trapPosition: Vector2,
    playerPositions: Map<string, Vector2>
  ): void {
    for (const playerId of playerIds) {
      const playerPos = playerPositions.get(playerId)
      if (!playerPos) continue

      switch (effect) {
        case 'damage_burst':
          this.applyDamageBurst(playerId, value, trapPosition)
          break
        case 'knockback':
          this.applyKnockback(playerId, value, trapPosition, playerPos)
          break
        case 'stun':
          this.applyStun(playerId, value, trapPosition)
          break
      }
    }
  }

  /**
   * Apply damage burst effect
   * Requirements: 4.5
   * 
   * @param playerId - Player to damage
   * @param damage - Damage amount
   * @param position - Trap position
   */
  private applyDamageBurst(playerId: string, damage: number, position: Vector2): void {
    this.pendingResults.push({
      playerId,
      type: 'damage_burst',
      value: damage || DEFAULT_DAMAGE_BURST,
      position: { ...position }
    })
  }

  /**
   * Apply knockback effect
   * Requirements: 4.5
   * 
   * @param playerId - Player to knock back
   * @param force - Knockback force
   * @param trapPosition - Trap position
   * @param playerPosition - Player position
   */
  private applyKnockback(
    playerId: string, 
    force: number, 
    trapPosition: Vector2, 
    playerPosition: Vector2
  ): void {
    // Calculate direction away from trap
    const dx = playerPosition.x - trapPosition.x
    const dy = playerPosition.y - trapPosition.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    
    // Normalize and apply force
    const normalizedForce = force || DEFAULT_KNOCKBACK_FORCE
    const knockbackX = dist > 0 ? (dx / dist) * normalizedForce : 0
    const knockbackY = dist > 0 ? (dy / dist) * normalizedForce : normalizedForce

    this.pendingResults.push({
      playerId,
      type: 'knockback',
      value: normalizedForce,
      position: { x: knockbackX, y: knockbackY }  // Using position to store velocity
    })
  }

  /**
   * Apply stun effect
   * Requirements: 4.5
   * 
   * @param playerId - Player to stun
   * @param duration - Stun duration in seconds
   * @param position - Trap position
   */
  private applyStun(playerId: string, duration: number, position: Vector2): void {
    this.pendingResults.push({
      playerId,
      type: 'stun',
      value: duration || DEFAULT_STUN_DURATION,
      position: { ...position }
    })
  }

  /**
   * Get and clear pending effect results
   * 
   * @returns Array of effect results
   */
  getAndClearResults(): TrapEffectResult[] {
    const results = [...this.pendingResults]
    this.pendingResults = []
    return results
  }

  /**
   * Check if there are pending results
   * 
   * @returns true if there are pending results
   */
  hasPendingResults(): boolean {
    return this.pendingResults.length > 0
  }

  /**
   * Get players within effect radius of a position
   * 
   * @param position - Center position
   * @param radius - Effect radius
   * @param playerPositions - Map of player positions
   * @returns Array of player IDs within radius
   */
  static getPlayersInRadius(
    position: Vector2,
    radius: number,
    playerPositions: Map<string, Vector2>
  ): string[] {
    const inRadius: string[] = []
    const radiusSq = (radius || DEFAULT_EFFECT_RADIUS) ** 2

    for (const [playerId, playerPos] of playerPositions) {
      const dx = playerPos.x - position.x
      const dy = playerPos.y - position.y
      const distSq = dx * dx + dy * dy
      
      if (distSq <= radiusSq) {
        inRadius.push(playerId)
      }
    }

    return inRadius
  }
}
