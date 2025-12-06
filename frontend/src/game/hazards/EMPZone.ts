/**
 * EMPZone - Hazard zone that disables power-ups
 * 
 * @module hazards/EMPZone
 */

import type { HazardState } from '../arena/types'
import type { Rectangle } from '../types'

// ============================================================================
// EMPZone Class
// ============================================================================

/**
 * EMPZone disables all active power-up effects while player is inside
 * Requirements: 3.3
 */
export class EMPZone {
  private id: string
  private bounds: Rectangle

  /**
   * Create a new EMP zone
   * 
   * @param state - Hazard state
   */
  constructor(state: HazardState) {
    this.id = state.id
    this.bounds = { ...state.bounds }
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
   * Check if power-ups are disabled (always true for EMP zones)
   * Requirements: 3.3
   * 
   * @returns true - power-ups are always disabled in EMP zones
   */
  isPowerUpDisabled(): boolean {
    return true
  }
}
