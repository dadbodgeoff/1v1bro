/**
 * Health Manager
 * Handles health, shields, damage, and invulnerability
 */

import { HEALTH_CONFIG } from '../config'
import type { HealthState } from '../types'

export class HealthManager {
  private states: Map<string, HealthState> = new Map()

  /**
   * Initialize health state for a player
   */
  initPlayer(playerId: string): void {
    this.states.set(playerId, {
      current: HEALTH_CONFIG.maxHealth,
      max: HEALTH_CONFIG.maxHealth,
      shield: 0,
      shieldMax: HEALTH_CONFIG.maxShield,
      lastDamageTime: 0,
      isInvulnerable: false,
      invulnerabilityEnd: 0,
    })
  }

  /**
   * Apply damage to a player
   * Returns actual damage dealt to health (after shield)
   */
  applyDamage(playerId: string, damage: number): number {
    const state = this.states.get(playerId)
    if (!state) return 0

    // Check invulnerability
    if (this.isInvulnerable(playerId)) return 0

    let remainingDamage = damage

    // Shield absorbs damage first
    if (state.shield > 0) {
      const shieldDamage = Math.min(state.shield, remainingDamage)
      state.shield -= shieldDamage
      remainingDamage -= shieldDamage
    }

    // Apply remaining damage to health
    const healthDamage = Math.min(state.current, remainingDamage)
    state.current -= healthDamage
    state.lastDamageTime = Date.now()

    return healthDamage
  }


  /**
   * Check if player is alive
   * Returns true for untracked players (allows hits to register before explicit init)
   */
  isAlive(playerId: string): boolean {
    const state = this.states.get(playerId)
    // If player isn't tracked yet, assume alive (e.g., bot opponent before full init)
    if (!state) return true
    return state.current > 0
  }

  /**
   * Check if player is currently invulnerable
   */
  isInvulnerable(playerId: string): boolean {
    const state = this.states.get(playerId)
    if (!state) return false
    return state.isInvulnerable && Date.now() < state.invulnerabilityEnd
  }

  /**
   * Respawn player with full health and invulnerability
   */
  respawn(playerId: string): void {
    const state = this.states.get(playerId)
    if (!state) return

    state.current = state.max
    state.shield = 0
    state.isInvulnerable = true
    state.invulnerabilityEnd = Date.now() + HEALTH_CONFIG.invulnerabilityDuration
  }

  /**
   * Add shield to player (from power-up)
   */
  addShield(playerId: string, amount: number): void {
    const state = this.states.get(playerId)
    if (!state) return
    state.shield = Math.min(state.shieldMax, state.shield + amount)
  }

  /**
   * Set health directly (for server reconciliation)
   */
  setHealth(playerId: string, health: number): void {
    const state = this.states.get(playerId)
    if (state) {
      state.current = Math.max(0, Math.min(state.max, health))
    }
  }

  /**
   * Get health state for a player
   */
  getState(playerId: string): HealthState | null {
    return this.states.get(playerId) ?? null
  }

  /**
   * Get health percentage (0-1)
   */
  getHealthPercent(playerId: string): number {
    const state = this.states.get(playerId)
    if (!state) return 0
    return state.current / state.max
  }

  /**
   * Check if player was recently damaged (for flash effect)
   */
  wasRecentlyDamaged(playerId: string): boolean {
    const state = this.states.get(playerId)
    if (!state) return false
    return Date.now() - state.lastDamageTime < HEALTH_CONFIG.damageFlashDuration
  }

  /**
   * Remove player from tracking
   */
  removePlayer(playerId: string): void {
    this.states.delete(playerId)
  }

  /**
   * Reset all health states
   */
  reset(): void {
    this.states.clear()
  }

  /**
   * Get all health states (for telemetry)
   */
  getAllStates(): Map<string, HealthState | null> {
    return new Map(this.states)
  }

  /**
   * Set health from server state (for server-authoritative combat)
   */
  setFromServer(playerId: string, health: number, maxHealth: number): void {
    let state = this.states.get(playerId)
    if (!state) {
      // Initialize if not exists
      this.initPlayer(playerId)
      state = this.states.get(playerId)!
    }
    state.current = health
    state.max = maxHealth
  }
}
