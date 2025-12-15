/**
 * PatternSelector - Intelligent pattern selection based on context
 * Considers difficulty, pacing, recent history, and fairness constraints
 */

import type { ObstaclePattern, DifficultyTier, OrchestratorState } from './types'
import type { PatternLibrary } from './PatternLibrary'
import type { DifficultyManager } from './DifficultyManager'
import type { PacingController } from './PacingController'

/**
 * Selection context for pattern picking
 */
export interface SelectionContext {
  state: OrchestratorState
  currentSpeed: number
}

/**
 * Weighted pattern for selection
 */
interface WeightedPattern {
  pattern: ObstaclePattern
  weight: number
  reasons: string[]  // Debug info
}

/**
 * Fairness constraints
 */
interface FairnessConfig {
  maxConsecutiveJumps: number
  maxConsecutiveSlides: number
  maxConsecutiveLaneChanges: number
  guaranteedSafePath: boolean
}

const DEFAULT_FAIRNESS: FairnessConfig = {
  maxConsecutiveJumps: 3,
  maxConsecutiveSlides: 2,
  maxConsecutiveLaneChanges: 4,
  guaranteedSafePath: true,
}

export class PatternSelector {
  private library: PatternLibrary
  private difficultyManager: DifficultyManager
  private pacingController: PacingController
  private fairnessConfig: FairnessConfig
  
  // Track recent actions for fairness
  private recentActions: string[] = []
  private readonly actionHistorySize = 10

  constructor(
    library: PatternLibrary,
    difficultyManager: DifficultyManager,
    pacingController: PacingController,
    fairnessConfig: FairnessConfig = DEFAULT_FAIRNESS
  ) {
    this.library = library
    this.difficultyManager = difficultyManager
    this.pacingController = pacingController
    this.fairnessConfig = fairnessConfig
  }

  /**
   * Select the next pattern to spawn
   */
  selectPattern(context: SelectionContext): ObstaclePattern | null {
    const currentTier = this.difficultyManager.getCurrentTier()
    
    // Get all patterns valid for current difficulty
    const candidates = this.library.getPatternsForDifficulty(currentTier)
    
    if (candidates.length === 0) {
      console.warn('[PatternSelector] No patterns available for tier:', currentTier)
      return null
    }

    // Weight each candidate
    const weighted = candidates
      .map(pattern => this.weightPattern(pattern, context))
      .filter(wp => wp.weight > 0)

    if (weighted.length === 0) {
      console.warn('[PatternSelector] All patterns filtered out, using fallback')
      return this.getFallbackPattern(currentTier)
    }

    // Select using weighted random
    const selected = this.weightedRandomSelect(weighted)
    
    // Track actions for fairness
    if (selected) {
      this.trackActions(selected.pattern)
    }

    return selected?.pattern || null
  }

  /**
   * Calculate weight for a pattern based on all factors
   */
  private weightPattern(pattern: ObstaclePattern, context: SelectionContext): WeightedPattern {
    const { state: orchestratorState } = context
    const reasons: string[] = []
    let weight = pattern.baseWeight

    // Check cooldown
    if (this.isOnCooldown(pattern, orchestratorState.recentPatterns)) {
      return { pattern, weight: 0, reasons: ['on cooldown'] }
    }

    // Check forbidden sequences
    if (orchestratorState.lastPatternId && pattern.forbiddenAfter.includes(orchestratorState.lastPatternId)) {
      return { pattern, weight: 0, reasons: ['forbidden after ' + orchestratorState.lastPatternId] }
    }

    // Check fairness constraints
    if (!this.passesFairnessCheck(pattern)) {
      weight *= 0.1  // Heavily penalize but don't eliminate
      reasons.push('fairness penalty')
    }

    // Apply pacing modifier
    const pacingMod = this.pacingController.getPatternWeightModifier(pattern.id)
    weight *= pacingMod
    if (pacingMod !== 1.0) {
      reasons.push(`pacing: x${pacingMod.toFixed(2)}`)
    }

    // Complexity check - don't spawn complex patterns too early in a phase
    const phaseProgress = this.pacingController.getPhaseProgress()
    if (pattern.placements.length > 3 && phaseProgress < 0.3) {
      weight *= 0.5
      reasons.push('too complex for phase start')
    }

    // Boost variety - patterns not seen recently get bonus
    if (!orchestratorState.recentPatterns.includes(pattern.id)) {
      weight *= 1.2
      reasons.push('variety bonus')
    }

    // Knowledge gate spacing - don't spawn too frequently
    if (pattern.id === 'knowledge-solo') {
      const gateCount = orchestratorState.recentPatterns.filter(id => id === 'knowledge-solo').length
      if (gateCount > 0) {
        weight *= 0.3
        reasons.push('recent knowledge gate')
      }
    }

    return { pattern, weight, reasons }
  }

  /**
   * Check if pattern is on cooldown
   */
  private isOnCooldown(pattern: ObstaclePattern, recentPatterns: string[]): boolean {
    const lastIndex = recentPatterns.lastIndexOf(pattern.id)
    if (lastIndex === -1) return false
    
    const patternsSince = recentPatterns.length - lastIndex - 1
    return patternsSince < pattern.cooldownPatterns
  }

  /**
   * Check fairness constraints
   */
  private passesFairnessCheck(pattern: ObstaclePattern): boolean {
    const actions = pattern.requiredActions

    // Count consecutive same-type actions
    if (actions.includes('jump')) {
      const consecutiveJumps = this.countConsecutiveAction('jump')
      if (consecutiveJumps >= this.fairnessConfig.maxConsecutiveJumps) {
        return false
      }
    }

    if (actions.includes('slide')) {
      const consecutiveSlides = this.countConsecutiveAction('slide')
      if (consecutiveSlides >= this.fairnessConfig.maxConsecutiveSlides) {
        return false
      }
    }

    const hasLaneChange = actions.includes('laneLeft') || 
                          actions.includes('laneRight') || 
                          actions.includes('laneChange')
    if (hasLaneChange) {
      const consecutiveLane = this.countConsecutiveAction('laneChange')
      if (consecutiveLane >= this.fairnessConfig.maxConsecutiveLaneChanges) {
        return false
      }
    }

    return true
  }

  /**
   * Count consecutive occurrences of an action type
   */
  private countConsecutiveAction(action: string): number {
    let count = 0
    for (let i = this.recentActions.length - 1; i >= 0; i--) {
      if (this.recentActions[i] === action) {
        count++
      } else {
        break
      }
    }
    return count
  }

  /**
   * Track actions from selected pattern
   */
  private trackActions(pattern: ObstaclePattern): void {
    // Normalize lane actions
    const normalizedActions = pattern.requiredActions.map(action => {
      if (action === 'laneLeft' || action === 'laneRight') {
        return 'laneChange'
      }
      return action
    })

    // Add unique actions
    const uniqueActions = [...new Set(normalizedActions)]
    this.recentActions.push(...uniqueActions)

    // Trim history
    while (this.recentActions.length > this.actionHistorySize) {
      this.recentActions.shift()
    }
  }

  /**
   * Weighted random selection
   */
  private weightedRandomSelect(weighted: WeightedPattern[]): WeightedPattern | null {
    const totalWeight = weighted.reduce((sum, wp) => sum + wp.weight, 0)
    if (totalWeight <= 0) return null

    let random = Math.random() * totalWeight
    
    for (const wp of weighted) {
      random -= wp.weight
      if (random <= 0) {
        return wp
      }
    }

    return weighted[weighted.length - 1]
  }

  /**
   * Get a safe fallback pattern
   */
  private getFallbackPattern(_tier: DifficultyTier): ObstaclePattern | null {
    // Always have simple patterns available
    const fallbacks = ['single-jump-gate', 'single-spikes', 'center-block']
    
    for (const id of fallbacks) {
      const pattern = this.library.getPattern(id)
      if (pattern) return pattern
    }

    return null
  }

  /**
   * Reset state
   */
  reset(): void {
    this.recentActions = []
  }
}
