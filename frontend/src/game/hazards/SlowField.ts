/**
 * SlowField - Hazard zone that reduces player movement speed
 * 
 * @module hazards/SlowField
 */

import type { HazardState } from '../arena/types'
import type { Rectangle } from '../types'

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_SPEED_MULTIPLIER = 0.5  // 50% speed reduction

// ============================================================================
// SlowField Class
// ============================================================================

/**
 * SlowField reduces player movement speed while inside
 * Requirements: 3.2
 */
export class SlowField {
  private id: string
  private bounds: Rectangle
  private speedMultiplier: number

  /**
   * Create a new slow field
   * 
   * @param state - Hazard state
   */
  constructor(state: HazardState) {
    this.id = state.id
    this.bounds = { ...state.bounds }
    // Intensity represents the speed multiplier (0.25-0.75)
    this.speedMultiplier = state.intensity || DEFAULT_SPEED_MULTIPLIER
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
   * Get speed multiplier (0.25-0.75)
   * Requirements: 3.2
   * 
   * @returns Speed multiplier (1.0 = normal, 0.5 = 50% speed)
   */
  getSpeedMultiplier(): number {
    return this.speedMultiplier
  }

  /**
   * Get speed reduction percentage for display
   * 
   * @returns Percentage reduction (e.g., 50 for 50% reduction)
   */
  getSpeedReductionPercent(): number {
    return Math.round((1 - this.speedMultiplier) * 100)
  }
}
