/**
 * OneWayBarrier - Barrier that allows passage in one direction only
 * Handles directional collision logic
 * 
 * @module barriers/OneWayBarrier
 */

import type { BarrierState, Direction } from '../arena/types'
import type { Vector2 } from '../types'

// ============================================================================
// OneWayBarrier Class
// ============================================================================

/**
 * OneWayBarrier allows passage in one configured direction while blocking others
 * Requirements: 2.6, 2.7, 2.8
 */
export class OneWayBarrier {
  private id: string
  private position: Vector2
  private size: Vector2
  private direction: Direction
  private center: Vector2

  /**
   * Create a new one-way barrier
   * 
   * @param state - Barrier state
   * @param direction - Direction that allows passage (N, S, E, W)
   */
  constructor(state: BarrierState, direction: Direction) {
    this.id = state.id
    this.position = { ...state.position }
    this.size = { ...state.size }
    this.direction = direction
    this.center = {
      x: this.position.x + this.size.x / 2,
      y: this.position.y + this.size.y / 2
    }
  }

  /**
   * Get barrier ID
   */
  getId(): string {
    return this.id
  }

  /**
   * Get the direction that allows passage
   */
  getPassDirection(): Direction {
    return this.direction
  }

  /**
   * Check if the barrier should block movement from a given position
   * Requirements: 2.7
   * 
   * @param position - Position of the entity trying to pass
   * @returns true if barrier should block, false if passage is allowed
   */
  shouldBlock(position: Vector2): boolean {
    // Determine which side the entity is approaching from
    const approachDirection = this.getApproachDirection(position)
    
    // Block if approaching from any direction except the allowed one
    return approachDirection !== this.direction
  }

  /**
   * Determine which direction an entity is approaching from
   * 
   * @param position - Entity position
   * @returns Direction the entity is approaching from
   */
  getApproachDirection(position: Vector2): Direction {
    const dx = position.x - this.center.x
    const dy = position.y - this.center.y

    // Determine primary approach direction based on position relative to center
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal approach
      return dx < 0 ? 'E' : 'W'  // Coming from left = approaching East
    } else {
      // Vertical approach
      return dy < 0 ? 'S' : 'N'  // Coming from top = approaching South
    }
  }

  /**
   * Check if a position is on the "pass through" side of the barrier
   * 
   * @param position - Position to check
   * @returns true if on the side that allows passage
   */
  isOnPassSide(position: Vector2): boolean {
    switch (this.direction) {
      case 'N':
        return position.y > this.center.y  // Below the barrier
      case 'S':
        return position.y < this.center.y  // Above the barrier
      case 'E':
        return position.x < this.center.x  // Left of the barrier
      case 'W':
        return position.x > this.center.x  // Right of the barrier
    }
  }

  /**
   * Get the velocity direction for "phase through" effect
   * Returns the direction vector for visual effect when passing through
   * 
   * @returns Normalized direction vector
   */
  getPhaseDirection(): Vector2 {
    switch (this.direction) {
      case 'N':
        return { x: 0, y: -1 }
      case 'S':
        return { x: 0, y: 1 }
      case 'E':
        return { x: 1, y: 0 }
      case 'W':
        return { x: -1, y: 0 }
    }
  }

  /**
   * Update barrier position (for potential future use)
   * 
   * @param position - New position
   */
  setPosition(position: Vector2): void {
    this.position = { ...position }
    this.center = {
      x: this.position.x + this.size.x / 2,
      y: this.position.y + this.size.y / 2
    }
  }
}
