/**
 * AdaptiveDifficultyManager - Tracks player performance and adjusts bot difficulty
 *
 * **Feature: single-player-enhancement**
 * **Validates: Requirements 5.1, 5.2, 5.4**
 */

import {
  type DifficultyConfig,
  type DifficultyLevel,
  getDifficultyConfig,
  applyAdaptiveAdjustment,
} from './BotConfigManager'

// Round result for tracking
interface RoundResult {
  playerScore: number
  botScore: number
  margin: number // playerScore - botScore
}

// Threshold for significant win/loss (Requirements 5.1, 5.2)
const MARGIN_THRESHOLD = 500

// Number of consecutive rounds needed to trigger adjustment
const CONSECUTIVE_ROUNDS_THRESHOLD = 3

// Adjustment amount per trigger (10 percentage points)
const ADJUSTMENT_AMOUNT = 0.1

// Bounds for quiz accuracy (Requirements 5.1, 5.2)
const MIN_ACCURACY = 0.3
const MAX_ACCURACY = 0.85

/**
 * Calculate adjustment based on round results
 * **Property 9: Adaptive difficulty increase threshold**
 * **Property 10: Adaptive difficulty decrease threshold**
 * **Validates: Requirements 5.1, 5.2**
 */
export function calculateAdjustment(results: RoundResult[]): number {
  if (results.length < CONSECUTIVE_ROUNDS_THRESHOLD) {
    return 0
  }

  // Check last N rounds for consecutive wins/losses by margin
  const recentResults = results.slice(-CONSECUTIVE_ROUNDS_THRESHOLD)

  // Check for consecutive player wins by > 500 points
  const allPlayerWins = recentResults.every((r) => r.margin > MARGIN_THRESHOLD)
  if (allPlayerWins) {
    return ADJUSTMENT_AMOUNT // Increase difficulty
  }

  // Check for consecutive player losses by > 500 points
  const allPlayerLosses = recentResults.every(
    (r) => r.margin < -MARGIN_THRESHOLD
  )
  if (allPlayerLosses) {
    return -ADJUSTMENT_AMOUNT // Decrease difficulty
  }

  return 0
}

/**
 * Apply bounds to accuracy value
 */
export function clampAccuracy(accuracy: number): number {
  return Math.max(MIN_ACCURACY, Math.min(MAX_ACCURACY, accuracy))
}

/**
 * AdaptiveDifficultyManager class
 */
export class AdaptiveDifficultyManager {
  private results: RoundResult[] = []
  private baseLevel: DifficultyLevel = 'medium'
  private currentAdjustment = 0

  constructor(baseLevel: DifficultyLevel = 'medium') {
    this.baseLevel = baseLevel
  }

  /**
   * Record a round result
   */
  recordRoundResult(playerScore: number, botScore: number): void {
    const margin = playerScore - botScore
    this.results.push({ playerScore, botScore, margin })

    // Recalculate adjustment after each round
    this.updateAdjustment()
  }

  /**
   * Update the current adjustment based on recent results
   */
  private updateAdjustment(): void {
    const adjustment = calculateAdjustment(this.results)

    if (adjustment !== 0) {
      // Apply adjustment and clamp
      const baseConfig = getDifficultyConfig(this.baseLevel)
      const newAccuracy = clampAccuracy(
        baseConfig.quizAccuracy + this.currentAdjustment + adjustment
      )

      // Calculate actual adjustment from base
      this.currentAdjustment = newAccuracy - baseConfig.quizAccuracy

      // Clear results after adjustment to start fresh count
      this.results = []
    }
  }

  /**
   * Get the current adjustment value (-0.2 to +0.2 typically)
   */
  getCurrentAdjustment(): number {
    return Math.round(this.currentAdjustment * 100) / 100
  }

  /**
   * Get the effective difficulty config with adjustment applied
   */
  getEffectiveDifficulty(): DifficultyConfig {
    const base = getDifficultyConfig(this.baseLevel)
    return applyAdaptiveAdjustment(base, this.currentAdjustment)
  }

  /**
   * Get the effective quiz accuracy (for display)
   */
  getEffectiveAccuracy(): number {
    return this.getEffectiveDifficulty().quizAccuracy
  }

  /**
   * Set the base difficulty level
   * **Validates: Requirements 5.4**
   */
  setBaseLevel(level: DifficultyLevel): void {
    this.baseLevel = level
    // Reset adjustment when base level changes
    this.currentAdjustment = 0
    this.results = []
  }

  /**
   * Get the base difficulty level
   */
  getBaseLevel(): DifficultyLevel {
    return this.baseLevel
  }

  /**
   * Get number of rounds recorded
   */
  getRoundCount(): number {
    return this.results.length
  }

  /**
   * Reset the manager
   */
  reset(): void {
    this.results = []
    this.currentAdjustment = 0
  }
}
