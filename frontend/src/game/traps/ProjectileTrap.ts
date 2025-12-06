/**
 * ProjectileTrap - Trap that activates when hit by a projectile
 * 
 * @module traps/ProjectileTrap
 */

import type { TrapState } from '../arena/types'
import type { Vector2 } from '../types'

// ============================================================================
// ProjectileTrap Class
// ============================================================================

/**
 * ProjectileTrap activates when hit by any projectile
 * Requirements: 4.3
 */
export class ProjectileTrap {
  private id: string
  private position: Vector2
  private radius: number
  private hitRadius: number  // Radius for projectile hit detection

  /**
   * Create a new projectile trap
   * 
   * @param state - Trap state
   */
  constructor(state: TrapState) {
    this.id = state.id
    this.position = { ...state.position }
    this.radius = state.radius
    this.hitRadius = state.radius * 0.5  // Smaller hit detection radius
  }

  /**
   * Get trap ID
   */
  getId(): string {
    return this.id
  }

  /**
   * Get trap position
   */
  getPosition(): Vector2 {
    return this.position
  }

  /**
   * Get effect radius
   */
  getRadius(): number {
    return this.radius
  }

  /**
   * Get hit detection radius
   */
  getHitRadius(): number {
    return this.hitRadius
  }

  /**
   * Check if a projectile hits the trap
   * Requirements: 4.3
   * 
   * @param projectilePosition - Position of the projectile
   * @returns true if projectile hits the trap
   */
  checkProjectileHit(projectilePosition: Vector2): boolean {
    const dx = projectilePosition.x - this.position.x
    const dy = projectilePosition.y - this.position.y
    const distSq = dx * dx + dy * dy
    return distSq <= this.hitRadius * this.hitRadius
  }

  /**
   * Get players in effect radius
   * 
   * @param playerPositions - Map of player IDs to positions
   * @returns Array of player IDs in radius
   */
  getPlayersInRadius(playerPositions: Map<string, Vector2>): string[] {
    const inRadius: string[] = []

    for (const [playerId, position] of playerPositions) {
      const dx = position.x - this.position.x
      const dy = position.y - this.position.y
      const distSq = dx * dx + dy * dy
      
      if (distSq <= this.radius * this.radius) {
        inRadius.push(playerId)
      }
    }

    return inRadius
  }
}
