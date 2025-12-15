/**
 * FlowAnalyzer - Ensures action variety and rhythm
 * Tracks the rhythm of player inputs and ensures engaging flow
 * 
 * Good flow: jump → dodge → slide → dodge (varied, engaging)
 * Bad flow: jump → jump → jump (monotonous)
 */

import type { ObstaclePattern } from './types'

/**
 * Action categories for flow analysis
 */
type ActionCategory = 'vertical' | 'lateral' | 'none'

/**
 * Flow metrics for a sequence
 */
export interface FlowMetrics {
  varietyScore: number        // 0-1, higher = more varied
  rhythmScore: number         // 0-1, higher = better rhythm
  monotonyPenalty: number     // 0-1, higher = more monotonous
  transitionQuality: number   // 0-1, how smooth are action transitions
  overallFlow: number         // Combined score
}

/**
 * Rhythm pattern detection
 */
interface RhythmPattern {
  pattern: ActionCategory[]
  quality: number
  name: string
}

/**
 * Known good rhythm patterns
 */
const GOOD_RHYTHMS: RhythmPattern[] = [
  { pattern: ['vertical', 'lateral', 'vertical'], quality: 0.9, name: 'alternating' },
  { pattern: ['lateral', 'vertical', 'lateral'], quality: 0.9, name: 'alternating' },
  { pattern: ['vertical', 'lateral', 'none', 'vertical'], quality: 0.85, name: 'breathe' },
  { pattern: ['lateral', 'lateral', 'vertical'], quality: 0.75, name: 'weave-jump' },
  { pattern: ['vertical', 'none', 'lateral'], quality: 0.8, name: 'recover-dodge' },
]

/**
 * Known bad rhythm patterns
 */
const BAD_RHYTHMS: RhythmPattern[] = [
  { pattern: ['vertical', 'vertical', 'vertical'], quality: 0.2, name: 'jump-spam' },
  { pattern: ['lateral', 'lateral', 'lateral', 'lateral'], quality: 0.3, name: 'weave-spam' },
]

export class FlowAnalyzer {
  // Track recent actions
  private actionHistory: ActionCategory[] = []
  private patternHistory: ObstaclePattern[] = []
  private readonly maxHistory = 15

  // Flow state
  private consecutiveSameCategory: number = 0
  private lastCategory: ActionCategory = 'none'

  /**
   * Analyze flow quality of adding a pattern
   */
  analyzePatternFit(pattern: ObstaclePattern): FlowMetrics {
    const category = this.categorizePattern(pattern)
    const projectedHistory = [...this.actionHistory, category]

    return {
      varietyScore: this.calculateVariety(projectedHistory),
      rhythmScore: this.calculateRhythm(projectedHistory),
      monotonyPenalty: this.calculateMonotony(projectedHistory),
      transitionQuality: this.calculateTransitionQuality(this.lastCategory, category),
      overallFlow: this.calculateOverallFlow(projectedHistory, category),
    }
  }

  /**
   * Record that a pattern was spawned
   */
  recordPattern(pattern: ObstaclePattern): void {
    const category = this.categorizePattern(pattern)
    
    // Update consecutive tracking
    if (category === this.lastCategory && category !== 'none') {
      this.consecutiveSameCategory++
    } else {
      this.consecutiveSameCategory = 1
    }
    this.lastCategory = category

    // Update history
    this.actionHistory.push(category)
    this.patternHistory.push(pattern)

    while (this.actionHistory.length > this.maxHistory) {
      this.actionHistory.shift()
      this.patternHistory.shift()
    }
  }

  /**
   * Get weight modifier for a pattern based on flow
   */
  getFlowWeight(pattern: ObstaclePattern): number {
    const metrics = this.analyzePatternFit(pattern)
    
    // High flow = boost weight, low flow = reduce weight
    // Range: 0.3 to 1.5
    return 0.3 + (metrics.overallFlow * 1.2)
  }

  /**
   * Check if a pattern would break flow
   */
  wouldBreakFlow(pattern: ObstaclePattern): boolean {
    const metrics = this.analyzePatternFit(pattern)
    return metrics.overallFlow < 0.3
  }

  /**
   * Suggest what action category should come next for best flow
   */
  suggestNextCategory(): ActionCategory {
    if (this.actionHistory.length === 0) return 'vertical'

    // If we've had too many of one type, suggest the other
    if (this.consecutiveSameCategory >= 2) {
      if (this.lastCategory === 'vertical') return 'lateral'
      if (this.lastCategory === 'lateral') return 'vertical'
    }

    // Check what would create best rhythm
    const recentThree = this.actionHistory.slice(-2)
    
    // After two verticals, suggest lateral
    if (recentThree.every(c => c === 'vertical')) return 'lateral'
    
    // After two laterals, suggest vertical
    if (recentThree.every(c => c === 'lateral')) return 'vertical'

    // Default: alternate
    return this.lastCategory === 'vertical' ? 'lateral' : 'vertical'
  }

  /**
   * Categorize a pattern by its primary action type
   */
  private categorizePattern(pattern: ObstaclePattern): ActionCategory {
    const actions = pattern.requiredActions

    if (actions.length === 0) return 'none'

    const hasVertical = actions.includes('jump') || actions.includes('slide')
    const hasLateral = actions.includes('laneLeft') || 
                       actions.includes('laneRight') || 
                       actions.includes('laneChange')

    // Mixed patterns count as the dominant type
    if (hasVertical && hasLateral) {
      // Count which has more
      const verticalCount = actions.filter(a => a === 'jump' || a === 'slide').length
      const lateralCount = actions.filter(a => 
        a === 'laneLeft' || a === 'laneRight' || a === 'laneChange'
      ).length
      return verticalCount >= lateralCount ? 'vertical' : 'lateral'
    }

    if (hasVertical) return 'vertical'
    if (hasLateral) return 'lateral'
    return 'none'
  }

  /**
   * Calculate variety score (how diverse are the actions)
   */
  private calculateVariety(history: ActionCategory[]): number {
    if (history.length < 2) return 1

    const recent = history.slice(-8)
    const counts = { vertical: 0, lateral: 0, none: 0 }
    
    recent.forEach(cat => counts[cat]++)

    // Perfect variety would be equal distribution
    const total = recent.length
    const idealCount = total / 3

    // Calculate deviation from ideal
    const deviation = Object.values(counts).reduce((sum, count) => {
      return sum + Math.abs(count - idealCount)
    }, 0)

    // Normalize: 0 deviation = 1.0, max deviation = 0.0
    const maxDeviation = total * 2 / 3
    return 1 - (deviation / maxDeviation)
  }

  /**
   * Calculate rhythm score (does it match good patterns)
   */
  private calculateRhythm(history: ActionCategory[]): number {
    if (history.length < 3) return 0.7

    const recent = history.slice(-4)
    let bestMatch = 0.5 // Default neutral

    // Check against good rhythms
    for (const rhythm of GOOD_RHYTHMS) {
      if (this.matchesRhythm(recent, rhythm.pattern)) {
        bestMatch = Math.max(bestMatch, rhythm.quality)
      }
    }

    // Check against bad rhythms (penalty)
    for (const rhythm of BAD_RHYTHMS) {
      if (this.matchesRhythm(recent, rhythm.pattern)) {
        bestMatch = Math.min(bestMatch, rhythm.quality)
      }
    }

    return bestMatch
  }

  /**
   * Check if history matches a rhythm pattern
   */
  private matchesRhythm(history: ActionCategory[], pattern: ActionCategory[]): boolean {
    if (history.length < pattern.length) return false

    const recent = history.slice(-pattern.length)
    return recent.every((cat, i) => cat === pattern[i])
  }

  /**
   * Calculate monotony penalty
   */
  private calculateMonotony(history: ActionCategory[]): number {
    if (history.length < 3) return 0

    const recent = history.slice(-5)
    let consecutive = 1
    let maxConsecutive = 1

    for (let i = 1; i < recent.length; i++) {
      if (recent[i] === recent[i - 1] && recent[i] !== 'none') {
        consecutive++
        maxConsecutive = Math.max(maxConsecutive, consecutive)
      } else {
        consecutive = 1
      }
    }

    // 1-2 consecutive = no penalty, 3+ = increasing penalty
    if (maxConsecutive <= 2) return 0
    return Math.min(1, (maxConsecutive - 2) * 0.3)
  }

  /**
   * Calculate transition quality between categories
   */
  private calculateTransitionQuality(from: ActionCategory, to: ActionCategory): number {
    // Same category transitions are less interesting
    if (from === to && from !== 'none') return 0.4

    // Vertical to lateral or vice versa is great
    if ((from === 'vertical' && to === 'lateral') ||
        (from === 'lateral' && to === 'vertical')) {
      return 1.0
    }

    // Transitions involving 'none' are neutral
    if (from === 'none' || to === 'none') return 0.7

    return 0.6
  }

  /**
   * Calculate overall flow score
   */
  private calculateOverallFlow(history: ActionCategory[], newCategory: ActionCategory): number {
    const variety = this.calculateVariety(history)
    const rhythm = this.calculateRhythm(history)
    const monotony = this.calculateMonotony(history)
    const transition = this.calculateTransitionQuality(this.lastCategory, newCategory)

    // Weighted combination
    const score = (
      variety * 0.25 +
      rhythm * 0.35 +
      (1 - monotony) * 0.2 +
      transition * 0.2
    )

    return Math.max(0, Math.min(1, score))
  }

  /**
   * Get current flow state for debugging
   */
  getFlowState(): object {
    return {
      recentActions: this.actionHistory.slice(-5),
      consecutiveSame: this.consecutiveSameCategory,
      lastCategory: this.lastCategory,
      suggestedNext: this.suggestNextCategory(),
    }
  }

  /**
   * Reset state
   */
  reset(): void {
    this.actionHistory = []
    this.patternHistory = []
    this.consecutiveSameCategory = 0
    this.lastCategory = 'none'
  }
}
