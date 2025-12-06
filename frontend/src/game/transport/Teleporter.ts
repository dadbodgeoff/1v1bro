/**
 * Teleporter - Paired teleporter pad logic
 * 
 * @module transport/Teleporter
 */

import type { TeleporterState } from '../arena/types'
import type { Vector2 } from '../types'

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_COOLDOWN_MS = 3000  // 3 seconds
const INVULNERABILITY_MS = 500   // 0.5 seconds after teleport

// ============================================================================
// Teleporter Class
// ============================================================================

/**
 * Teleporter handles paired teleporter pad logic
 * Requirements: 5.1, 5.2, 5.5
 */
export class Teleporter {
  private id: string
  private pairId: string
  private position: Vector2
  private radius: number
  private linkedTeleporterId: string | null = null
  private playerCooldowns: Map<string, number> = new Map()

  /**
   * Create a new teleporter
   * 
   * @param state - Teleporter state
   */
  constructor(state: TeleporterState) {
    this.id = state.id
    this.pairId = state.pairId
    this.position = { ...state.position }
    this.radius = state.radius
    this.linkedTeleporterId = state.linkedTeleporterId
  }

  /**
   * Get teleporter ID
   */
  getId(): string {
    return this.id
  }

  /**
   * Get pair ID
   */
  getPairId(): string {
    return this.pairId
  }

  /**
   * Get teleporter position
   */
  getPosition(): Vector2 {
    return this.position
  }

  /**
   * Get trigger radius
   */
  getRadius(): number {
    return this.radius
  }

  /**
   * Get linked teleporter ID
   */
  getLinkedTeleporterId(): string | null {
    return this.linkedTeleporterId
  }

  /**
   * Link to another teleporter
   * Requirements: 5.1
   * 
   * @param otherTeleporter - Teleporter to link to
   */
  linkTo(otherTeleporter: Teleporter): void {
    this.linkedTeleporterId = otherTeleporter.getId()
  }

  /**
   * Check if a player can teleport (not on cooldown)
   * Requirements: 5.5
   * 
   * @param playerId - Player ID
   * @param currentTime - Current timestamp
   * @returns true if player can teleport
   */
  canTeleport(playerId: string, currentTime: number): boolean {
    const cooldownEnd = this.playerCooldowns.get(playerId)
    if (cooldownEnd && currentTime < cooldownEnd) {
      return false
    }
    return true
  }

  /**
   * Check if a player is within teleporter radius
   * 
   * @param position - Player position
   * @returns true if within radius
   */
  isInRange(position: Vector2): boolean {
    const dx = position.x - this.position.x
    const dy = position.y - this.position.y
    const distSq = dx * dx + dy * dy
    return distSq <= this.radius * this.radius
  }

  /**
   * Teleport a player and return destination
   * Requirements: 5.2
   * 
   * @param playerId - Player ID
   * @param destination - Destination teleporter
   * @param currentTime - Current timestamp
   * @returns Destination position
   */
  teleport(playerId: string, destination: Teleporter, currentTime: number): Vector2 {
    // Apply cooldown to both teleporters
    this.applyCooldown(playerId, currentTime)
    destination.applyCooldown(playerId, currentTime)

    return destination.getPosition()
  }

  /**
   * Apply cooldown to a player
   * Requirements: 5.5
   * 
   * @param playerId - Player ID
   * @param currentTime - Current timestamp
   */
  applyCooldown(playerId: string, currentTime: number): void {
    this.playerCooldowns.set(playerId, currentTime + DEFAULT_COOLDOWN_MS)
  }

  /**
   * Get remaining cooldown for a player
   * 
   * @param playerId - Player ID
   * @param currentTime - Current timestamp
   * @returns Remaining cooldown in milliseconds, 0 if not on cooldown
   */
  getCooldownRemaining(playerId: string, currentTime: number): number {
    const cooldownEnd = this.playerCooldowns.get(playerId)
    if (!cooldownEnd) return 0
    return Math.max(0, cooldownEnd - currentTime)
  }

  /**
   * Check if teleporter is on cooldown for a player
   * Requirements: 5.6
   * 
   * @param playerId - Player ID
   * @param currentTime - Current timestamp
   * @returns true if on cooldown
   */
  isOnCooldown(playerId: string, currentTime: number): boolean {
    return !this.canTeleport(playerId, currentTime)
  }

  /**
   * Get invulnerability duration after teleport
   * Requirements: 5.4
   * 
   * @returns Invulnerability duration in milliseconds
   */
  getInvulnerabilityDuration(): number {
    return INVULNERABILITY_MS
  }

  /**
   * Clean up expired cooldowns
   * 
   * @param currentTime - Current timestamp
   */
  cleanupCooldowns(currentTime: number): void {
    for (const [playerId, cooldownEnd] of this.playerCooldowns) {
      if (currentTime >= cooldownEnd) {
        this.playerCooldowns.delete(playerId)
      }
    }
  }
}
