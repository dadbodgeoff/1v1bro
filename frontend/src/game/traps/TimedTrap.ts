/**
 * TimedTrap - Trap that activates on a fixed interval
 * 
 * @module traps/TimedTrap
 */

import type { TrapState } from '../arena/types'
import type { Vector2 } from '../types'

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_INTERVAL = 15  // 15 seconds

// ============================================================================
// TimedTrap Class
// ============================================================================

/**
 * TimedTrap activates on a fixed interval
 * Requirements: 4.2
 */
export class TimedTrap {
  private id: string
  private position: Vector2
  private radius: number
  private interval: number  // Seconds between activations
  private lastTriggerTime: number = 0

  /**
   * Create a new timed trap
   * 
   * @param state - Trap state
   */
  constructor(state: TrapState) {
    this.id = state.id
    this.position = { ...state.position }
    this.radius = state.radius
    this.interval = state.interval ?? DEFAULT_INTERVAL
    this.lastTriggerTime = state.lastTriggerTime || Date.now()
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
   * Get interval in seconds
   */
  getInterval(): number {
    return this.interval
  }

  /**
   * Check if the trap should trigger based on time
   * Requirements: 4.2
   * 
   * @param currentTime - Current timestamp in milliseconds
   * @returns true if trap should trigger
   */
  shouldTrigger(currentTime: number): boolean {
    const elapsed = currentTime - this.lastTriggerTime
    return elapsed >= this.interval * 1000
  }

  /**
   * Get time until next trigger in seconds
   * 
   * @param currentTime - Current timestamp
   * @returns Seconds until next trigger
   */
  getTimeUntilTrigger(currentTime: number): number {
    const elapsed = currentTime - this.lastTriggerTime
    const remaining = (this.interval * 1000) - elapsed
    return Math.max(0, remaining / 1000)
  }

  /**
   * Get next trigger timestamp
   * 
   * @returns Timestamp of next trigger
   */
  getNextTriggerTime(): number {
    return this.lastTriggerTime + (this.interval * 1000)
  }

  /**
   * Mark trap as triggered
   * 
   * @param currentTime - Current timestamp
   */
  markTriggered(currentTime: number): void {
    this.lastTriggerTime = currentTime
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
