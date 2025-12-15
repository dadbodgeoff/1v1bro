/**
 * DynamicBreather - Intelligent breather timing
 * Instead of fixed breather frequency, triggers based on:
 * - Consecutive near-misses (player struggling)
 * - Time since last mistake
 * - Complexity debt (after hard sections)
 * - Tension curve valleys
 */

import type { TensionCurve } from './TensionCurve'

/**
 * Player performance metrics
 */
export interface PerformanceMetrics {
  recentHits: number          // Hits in last N patterns
  recentNearMisses: number    // Close calls in last N patterns
  patternsSinceHit: number    // Patterns cleared since last hit
  averageReactionTime: number // Rolling average reaction time
  streakLength: number        // Current success streak
}

/**
 * Breather recommendation
 */
export interface BreatherRecommendation {
  shouldBreather: boolean
  urgency: 'low' | 'medium' | 'high' | 'critical'
  reason: string
  suggestedDuration: number   // Number of easy patterns
}

/**
 * Complexity debt tracking
 */
interface ComplexityDebt {
  accumulated: number         // Total complexity since last breather
  threshold: number           // When to trigger breather
  lastBreatherDistance: number
}

export class DynamicBreather {
  private tensionCurve: TensionCurve
  
  // Performance tracking
  private performance: PerformanceMetrics = {
    recentHits: 0,
    recentNearMisses: 0,
    patternsSinceHit: 0,
    averageReactionTime: 400,
    streakLength: 0,
  }
  
  // Complexity debt
  private debt: ComplexityDebt = {
    accumulated: 0,
    threshold: 15,
    lastBreatherDistance: 0,
  }
  
  // Tracking windows
  private hitHistory: boolean[] = []        // true = hit, false = clear
  private nearMissHistory: boolean[] = []   // true = near miss
  private complexityHistory: number[] = []  // Pattern complexities
  private readonly historySize = 10
  
  // Config
  private minBreatherInterval: number = 150  // Min distance between breathers
  private maxWithoutBreather: number = 400   // Force breather after this distance
  private nearMissThreshold: number = 3      // Near misses to trigger breather
  private hitThreshold: number = 2           // Hits to trigger breather

  constructor(tensionCurve: TensionCurve) {
    this.tensionCurve = tensionCurve
  }

  /**
   * Record a pattern result
   */
  recordPatternResult(
    wasHit: boolean,
    wasNearMiss: boolean,
    patternComplexity: number,
    _distance: number
  ): void {
    // Update histories
    this.hitHistory.push(wasHit)
    this.nearMissHistory.push(wasNearMiss)
    this.complexityHistory.push(patternComplexity)

    // Trim histories
    while (this.hitHistory.length > this.historySize) {
      this.hitHistory.shift()
      this.nearMissHistory.shift()
      this.complexityHistory.shift()
    }

    // Update performance metrics
    this.performance.recentHits = this.hitHistory.filter(h => h).length
    this.performance.recentNearMisses = this.nearMissHistory.filter(n => n).length

    if (wasHit) {
      this.performance.patternsSinceHit = 0
      this.performance.streakLength = 0
    } else {
      this.performance.patternsSinceHit++
      this.performance.streakLength++
    }

    // Accumulate complexity debt
    this.debt.accumulated += patternComplexity
  }

  /**
   * Check if a breather should be triggered
   */
  shouldTriggerBreather(distance: number): BreatherRecommendation {
    const distanceSinceBreather = distance - this.debt.lastBreatherDistance

    // Check minimum interval
    if (distanceSinceBreather < this.minBreatherInterval) {
      return {
        shouldBreather: false,
        urgency: 'low',
        reason: 'Too soon since last breather',
        suggestedDuration: 0,
      }
    }

    // Critical: Player is struggling badly
    if (this.performance.recentHits >= this.hitThreshold) {
      return {
        shouldBreather: true,
        urgency: 'critical',
        reason: `Player hit ${this.performance.recentHits} times recently`,
        suggestedDuration: 3,
      }
    }

    // High: Many near misses
    if (this.performance.recentNearMisses >= this.nearMissThreshold) {
      return {
        shouldBreather: true,
        urgency: 'high',
        reason: `${this.performance.recentNearMisses} near misses detected`,
        suggestedDuration: 2,
      }
    }

    // High: Forced breather after max distance
    if (distanceSinceBreather >= this.maxWithoutBreather) {
      return {
        shouldBreather: true,
        urgency: 'high',
        reason: 'Maximum distance without breather reached',
        suggestedDuration: 2,
      }
    }

    // Medium: Complexity debt exceeded
    if (this.debt.accumulated >= this.debt.threshold) {
      return {
        shouldBreather: true,
        urgency: 'medium',
        reason: 'Complexity debt threshold reached',
        suggestedDuration: 2,
      }
    }

    // Medium: Tension curve at valley (natural breather point)
    if (this.tensionCurve.isAtValley(distance) && distanceSinceBreather > this.minBreatherInterval * 1.5) {
      return {
        shouldBreather: true,
        urgency: 'medium',
        reason: 'Natural tension valley',
        suggestedDuration: 2,
      }
    }

    // Low: Long streak without break (reward player)
    if (this.performance.streakLength >= 15 && distanceSinceBreather > this.minBreatherInterval * 2) {
      return {
        shouldBreather: true,
        urgency: 'low',
        reason: 'Reward for long streak',
        suggestedDuration: 1,
      }
    }

    return {
      shouldBreather: false,
      urgency: 'low',
      reason: 'No breather needed',
      suggestedDuration: 0,
    }
  }

  /**
   * Record that a breather was given
   */
  recordBreather(distance: number): void {
    this.debt.accumulated = 0
    this.debt.lastBreatherDistance = distance
    
    // Clear near miss history (fresh start)
    this.nearMissHistory = []
    this.performance.recentNearMisses = 0
  }

  /**
   * Get current stress level (0-1)
   * Higher = player is struggling more
   */
  getStressLevel(): number {
    let stress = 0

    // Recent hits contribute most
    stress += this.performance.recentHits * 0.25

    // Near misses contribute
    stress += this.performance.recentNearMisses * 0.1

    // Complexity debt contributes
    stress += Math.min(0.3, this.debt.accumulated / this.debt.threshold * 0.3)

    // Long time without breather contributes
    // (Would need current distance to calculate properly)

    return Math.min(1, stress)
  }

  /**
   * Adjust difficulty based on performance
   * Returns multiplier (< 1 = easier, > 1 = harder)
   */
  getDifficultyAdjustment(): number {
    const stress = this.getStressLevel()

    // High stress = make it easier
    if (stress > 0.7) return 0.7
    if (stress > 0.5) return 0.85
    if (stress > 0.3) return 0.95

    // Low stress and good streak = can make it harder
    if (stress < 0.2 && this.performance.streakLength > 10) {
      return 1.1
    }

    return 1.0
  }

  /**
   * Get gap multiplier based on performance
   * Struggling players get more space
   */
  getGapMultiplier(): number {
    const stress = this.getStressLevel()

    // More stress = more space
    if (stress > 0.6) return 1.4
    if (stress > 0.4) return 1.2
    if (stress > 0.2) return 1.1

    return 1.0
  }

  /**
   * Update reaction time tracking
   */
  recordReactionTime(timeMs: number): void {
    // Exponential moving average
    const alpha = 0.2
    this.performance.averageReactionTime = 
      alpha * timeMs + (1 - alpha) * this.performance.averageReactionTime
  }

  /**
   * Get performance metrics
   */
  getPerformance(): Readonly<PerformanceMetrics> {
    return { ...this.performance }
  }

  /**
   * Get debug info
   */
  getDebugInfo(): object {
    return {
      performance: this.performance,
      debt: this.debt,
      stressLevel: this.getStressLevel(),
      difficultyAdjustment: this.getDifficultyAdjustment(),
      gapMultiplier: this.getGapMultiplier(),
    }
  }

  /**
   * Reset state
   */
  reset(): void {
    this.performance = {
      recentHits: 0,
      recentNearMisses: 0,
      patternsSinceHit: 0,
      averageReactionTime: 400,
      streakLength: 0,
    }
    this.debt = {
      accumulated: 0,
      threshold: 15,
      lastBreatherDistance: 0,
    }
    this.hitHistory = []
    this.nearMissHistory = []
    this.complexityHistory = []
  }
}
