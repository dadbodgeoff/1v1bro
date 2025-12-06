/**
 * DestructibleBarrier - Barrier with health that can be destroyed
 * Handles damage application and state transitions
 * 
 * @module barriers/DestructibleBarrier
 */

import type { BarrierState, DamageState } from '../arena/types'
import { getDamageState, BARRIER_HEALTH } from './BarrierTypes'

// ============================================================================
// Types
// ============================================================================

export interface DamageResult {
  health: number
  damageState: DamageState
  destroyed: boolean
  damageDealt: number
}

// ============================================================================
// DestructibleBarrier Class
// ============================================================================

/**
 * DestructibleBarrier manages a barrier that can take damage and be destroyed
 * Requirements: 2.3, 2.4, 2.5
 */
export class DestructibleBarrier {
  private id: string
  private health: number
  private maxHealth: number
  private damageState: DamageState
  private destroyed: boolean = false

  /**
   * Create a new destructible barrier
   * 
   * @param state - Initial barrier state
   */
  constructor(state: BarrierState) {
    this.id = state.id
    this.maxHealth = state.maxHealth || BARRIER_HEALTH.DEFAULT
    this.health = state.health || this.maxHealth
    this.damageState = getDamageState(this.health, this.maxHealth)
  }

  /**
   * Get barrier ID
   */
  getId(): string {
    return this.id
  }

  /**
   * Get current health
   */
  getHealth(): number {
    return this.health
  }

  /**
   * Get maximum health
   */
  getMaxHealth(): number {
    return this.maxHealth
  }

  /**
   * Get current damage state
   * Requirements: 2.4
   */
  getDamageState(): DamageState {
    return this.damageState
  }

  /**
   * Check if barrier is destroyed
   * Requirements: 2.5
   */
  isDestroyed(): boolean {
    return this.destroyed
  }

  /**
   * Get health percentage (0-1)
   */
  getHealthPercentage(): number {
    return this.health / this.maxHealth
  }

  /**
   * Apply damage to the barrier
   * Requirements: 2.3, 2.4, 2.5
   * 
   * @param amount - Damage amount to apply
   * @returns DamageResult with new state
   */
  applyDamage(amount: number): DamageResult {
    if (this.destroyed) {
      return {
        health: 0,
        damageState: 'destroyed',
        destroyed: true,
        damageDealt: 0
      }
    }

    const previousHealth = this.health
    this.health = Math.max(0, this.health - amount)
    const damageDealt = previousHealth - this.health

    // Update damage state
    this.damageState = getDamageState(this.health, this.maxHealth)

    // Check for destruction
    if (this.health <= 0) {
      this.destroyed = true
      this.damageState = 'destroyed'
    }

    return {
      health: this.health,
      damageState: this.damageState,
      destroyed: this.destroyed,
      damageDealt
    }
  }

  /**
   * Heal the barrier (for potential future use)
   * 
   * @param amount - Heal amount
   * @returns New health value
   */
  heal(amount: number): number {
    if (this.destroyed) return 0

    this.health = Math.min(this.maxHealth, this.health + amount)
    this.damageState = getDamageState(this.health, this.maxHealth)
    
    return this.health
  }

  /**
   * Reset barrier to full health
   */
  reset(): void {
    this.health = this.maxHealth
    this.damageState = 'intact'
    this.destroyed = false
  }
}
