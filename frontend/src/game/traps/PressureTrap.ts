/**
 * PressureTrap - Trap that activates when stepped on
 * 
 * @module traps/PressureTrap
 */

import type { TrapState } from '../arena/types'
import type { Vector2 } from '../types'

// ============================================================================
// PressureTrap Class
// ============================================================================

/**
 * PressureTrap activates when any player steps on it
 * Requirements: 4.1
 */
export class PressureTrap {
  private id: string
  private position: Vector2
  private radius: number

  /**
   * Create a new pressure trap
   * 
   * @param state - Trap state
   */
  constructor(state: TrapState) {
    this.id = state.id
    this.position = { ...state.position }
    this.radius = state.radius
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
   * Get trigger radius
   */
  getRadius(): number {
    return this.radius
  }

  /**
   * Check if any player triggers the trap
   * Requirements: 4.1
   * 
   * @param playerPositions - Map of player IDs to positions
   * @returns Array of player IDs that triggered the trap
   */
  checkTrigger(playerPositions: Map<string, Vector2>): string[] {
    const triggered: string[] = []

    for (const [playerId, position] of playerPositions) {
      if (this.isInTriggerRadius(position)) {
        triggered.push(playerId)
      }
    }

    return triggered
  }

  /**
   * Check if a position is within trigger radius
   * 
   * @param position - Position to check
   * @returns true if within trigger radius
   */
  isInTriggerRadius(position: Vector2): boolean {
    const dx = position.x - this.position.x
    const dy = position.y - this.position.y
    const distSq = dx * dx + dy * dy
    return distSq <= this.radius * this.radius
  }
}
