/**
 * PhraseComposer - Generates coherent 3-5 pattern sequences
 * Instead of spawning one pattern at a time, composes "phrases"
 * that flow together as a unit with opening, development, and resolution
 */

import type { ObstaclePattern, DifficultyTier, PacingPhase } from './types'
import type { PatternLibrary } from './PatternLibrary'
import type { FlowAnalyzer } from './FlowAnalyzer'
import type { TensionCurve } from './TensionCurve'

/**
 * A phrase is a composed sequence of patterns
 */
export interface Phrase {
  id: string
  patterns: ObstaclePattern[]
  structure: PhraseStructure
  totalLength: number
  intensity: number           // 0-1 overall intensity
  actionVariety: number       // 0-1 how varied the actions are
}

/**
 * Phrase structure types
 */
export type PhraseStructure = 
  | 'buildup'      // Easy → Hard
  | 'release'      // Hard → Easy
  | 'wave'         // Easy → Hard → Easy
  | 'plateau'      // Consistent difficulty
  | 'spike'        // Easy → Spike → Easy
  | 'cascade'      // Multiple small peaks

/**
 * Phrase template for composition
 */
interface PhraseTemplate {
  structure: PhraseStructure
  length: number              // Number of patterns
  intensityCurve: number[]    // Relative intensity at each position (0-1)
  actionFlow: ('vertical' | 'lateral' | 'any')[]
  minTier: DifficultyTier
  weight: number
}

/**
 * Phrase templates for different situations
 */
const PHRASE_TEMPLATES: PhraseTemplate[] = [
  // Buildup phrases - tension rising
  {
    structure: 'buildup',
    length: 4,
    intensityCurve: [0.3, 0.5, 0.7, 0.9],
    actionFlow: ['any', 'lateral', 'vertical', 'any'],
    minTier: 'rookie',
    weight: 1.0,
  },
  {
    structure: 'buildup',
    length: 3,
    intensityCurve: [0.4, 0.6, 0.85],
    actionFlow: ['vertical', 'lateral', 'any'],
    minTier: 'rookie',
    weight: 1.2,
  },

  // Release phrases - tension falling
  {
    structure: 'release',
    length: 3,
    intensityCurve: [0.8, 0.5, 0.3],
    actionFlow: ['any', 'lateral', 'vertical'],
    minTier: 'intermediate',
    weight: 0.8,
  },
  {
    structure: 'release',
    length: 4,
    intensityCurve: [0.9, 0.7, 0.4, 0.2],
    actionFlow: ['any', 'vertical', 'lateral', 'any'],
    minTier: 'intermediate',
    weight: 0.7,
  },

  // Wave phrases - up and down
  {
    structure: 'wave',
    length: 5,
    intensityCurve: [0.3, 0.6, 0.9, 0.6, 0.3],
    actionFlow: ['vertical', 'lateral', 'any', 'lateral', 'vertical'],
    minTier: 'intermediate',
    weight: 1.0,
  },
  {
    structure: 'wave',
    length: 4,
    intensityCurve: [0.4, 0.8, 0.7, 0.35],
    actionFlow: ['any', 'any', 'lateral', 'vertical'],
    minTier: 'rookie',
    weight: 1.1,
  },

  // Plateau phrases - consistent challenge
  {
    structure: 'plateau',
    length: 3,
    intensityCurve: [0.6, 0.65, 0.6],
    actionFlow: ['vertical', 'lateral', 'vertical'],
    minTier: 'intermediate',
    weight: 0.9,
  },
  {
    structure: 'plateau',
    length: 4,
    intensityCurve: [0.7, 0.75, 0.7, 0.72],
    actionFlow: ['lateral', 'vertical', 'lateral', 'any'],
    minTier: 'advanced',
    weight: 0.8,
  },

  // Spike phrases - sudden difficulty spike
  {
    structure: 'spike',
    length: 3,
    intensityCurve: [0.3, 0.95, 0.3],
    actionFlow: ['any', 'any', 'vertical'],
    minTier: 'advanced',
    weight: 0.6,
  },
  {
    structure: 'spike',
    length: 5,
    intensityCurve: [0.3, 0.5, 1.0, 0.5, 0.25],
    actionFlow: ['vertical', 'lateral', 'any', 'lateral', 'any'],
    minTier: 'expert',
    weight: 0.5,
  },

  // Cascade phrases - multiple small peaks
  {
    structure: 'cascade',
    length: 5,
    intensityCurve: [0.5, 0.7, 0.5, 0.8, 0.4],
    actionFlow: ['vertical', 'any', 'lateral', 'any', 'vertical'],
    minTier: 'advanced',
    weight: 0.7,
  },
]

export class PhraseComposer {
  private library: PatternLibrary
  private flowAnalyzer: FlowAnalyzer
  private tensionCurve: TensionCurve
  
  private phraseCounter: number = 0
  private lastPhraseStructure: PhraseStructure | null = null

  constructor(
    library: PatternLibrary,
    flowAnalyzer: FlowAnalyzer,
    tensionCurve: TensionCurve
  ) {
    this.library = library
    this.flowAnalyzer = flowAnalyzer
    this.tensionCurve = tensionCurve
  }

  /**
   * Compose a new phrase based on current game state
   */
  compose(
    distance: number,
    currentTier: DifficultyTier,
    currentPhase: PacingPhase,
    recentPatterns: string[]
  ): Phrase | null {
    // Get tension state
    const tensionState = this.tensionCurve.getState(distance)
    
    // Select appropriate template
    const template = this.selectTemplate(currentTier, currentPhase, tensionState.currentTension)
    if (!template) return null

    // Compose patterns for each slot
    const patterns = this.fillTemplate(template, currentTier, recentPatterns)
    if (patterns.length === 0) return null

    // Calculate phrase metrics
    const phrase: Phrase = {
      id: `phrase-${this.phraseCounter++}`,
      patterns,
      structure: template.structure,
      totalLength: patterns.reduce((sum, p) => sum + p.length, 0),
      intensity: this.calculatePhraseIntensity(patterns),
      actionVariety: this.calculateActionVariety(patterns),
    }

    this.lastPhraseStructure = template.structure
    
    return phrase
  }

  /**
   * Select a template based on current state
   */
  private selectTemplate(
    currentTier: DifficultyTier,
    currentPhase: PacingPhase,
    tension: number
  ): PhraseTemplate | null {
    const tierOrder = ['rookie', 'intermediate', 'advanced', 'expert', 'master']
    const currentTierIndex = tierOrder.indexOf(currentTier)

    // Filter templates by tier
    let candidates = PHRASE_TEMPLATES.filter(t => {
      const templateTierIndex = tierOrder.indexOf(t.minTier)
      return templateTierIndex <= currentTierIndex
    })

    if (candidates.length === 0) return null

    // Weight templates based on phase and tension
    const weighted = candidates.map(template => {
      let weight = template.weight

      // Phase-based weighting
      if (currentPhase === 'building' && template.structure === 'buildup') {
        weight *= 1.5
      } else if (currentPhase === 'intense' && template.structure === 'plateau') {
        weight *= 1.4
      } else if (currentPhase === 'climax' && template.structure === 'spike') {
        weight *= 1.6
      } else if (currentPhase === 'breather' && template.structure === 'release') {
        weight *= 2.0
      }

      // Tension-based weighting
      if (tension > 0.7 && (template.structure === 'spike' || template.structure === 'cascade')) {
        weight *= 1.3
      } else if (tension < 0.4 && template.structure === 'buildup') {
        weight *= 1.4
      }

      // Avoid repeating same structure
      if (template.structure === this.lastPhraseStructure) {
        weight *= 0.5
      }

      return { template, weight }
    })

    // Weighted random selection
    const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0)
    let random = Math.random() * totalWeight

    for (const { template, weight } of weighted) {
      random -= weight
      if (random <= 0) return template
    }

    return weighted[0]?.template || null
  }

  /**
   * Fill a template with actual patterns
   */
  private fillTemplate(
    template: PhraseTemplate,
    currentTier: DifficultyTier,
    recentPatterns: string[]
  ): ObstaclePattern[] {
    const patterns: ObstaclePattern[] = []
    const allPatterns = this.library.getPatternsForDifficulty(currentTier)
    
    if (allPatterns.length === 0) return []

    for (let i = 0; i < template.length; i++) {
      const targetIntensity = template.intensityCurve[i]
      const actionPreference = template.actionFlow[i]

      // Find best matching pattern
      const pattern = this.selectPatternForSlot(
        allPatterns,
        targetIntensity,
        actionPreference,
        patterns,
        recentPatterns
      )

      if (pattern) {
        patterns.push(pattern)
      }
    }

    return patterns
  }

  /**
   * Select a pattern for a specific slot in the phrase
   */
  private selectPatternForSlot(
    candidates: ObstaclePattern[],
    targetIntensity: number,
    actionPreference: 'vertical' | 'lateral' | 'any',
    alreadySelected: ObstaclePattern[],
    recentPatterns: string[]
  ): ObstaclePattern | null {
    // Filter and score candidates
    const scored = candidates
      .filter(p => !alreadySelected.some(s => s.id === p.id)) // No duplicates in phrase
      .filter(p => !recentPatterns.slice(-3).includes(p.id)) // Not too recent
      .map(pattern => {
        let score = 1.0

        // Intensity matching (based on pattern complexity)
        const patternIntensity = this.estimatePatternIntensity(pattern)
        const intensityDiff = Math.abs(patternIntensity - targetIntensity)
        score *= 1 - (intensityDiff * 0.5)

        // Action preference matching
        if (actionPreference !== 'any') {
          const hasVertical = pattern.requiredActions.includes('jump') || 
                             pattern.requiredActions.includes('slide')
          const hasLateral = pattern.requiredActions.includes('laneLeft') ||
                            pattern.requiredActions.includes('laneRight') ||
                            pattern.requiredActions.includes('laneChange')

          if (actionPreference === 'vertical' && hasVertical) {
            score *= 1.3
          } else if (actionPreference === 'lateral' && hasLateral) {
            score *= 1.3
          } else if (actionPreference === 'vertical' && !hasVertical) {
            score *= 0.6
          } else if (actionPreference === 'lateral' && !hasLateral) {
            score *= 0.6
          }
        }

        // Flow analysis
        const flowWeight = this.flowAnalyzer.getFlowWeight(pattern)
        score *= flowWeight

        return { pattern, score }
      })
      .filter(s => s.score > 0.3)
      .sort((a, b) => b.score - a.score)

    if (scored.length === 0) return null

    // Pick from top candidates with some randomness
    const topCandidates = scored.slice(0, Math.min(3, scored.length))
    const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)]

    return selected?.pattern || null
  }

  /**
   * Estimate pattern intensity (0-1)
   */
  private estimatePatternIntensity(pattern: ObstaclePattern): number {
    // Based on number of obstacles and required actions
    const obstacleCount = pattern.placements.length
    const actionCount = pattern.requiredActions.length

    let intensity = 0

    // More obstacles = higher intensity
    intensity += Math.min(0.5, obstacleCount * 0.1)

    // More actions = higher intensity
    intensity += Math.min(0.3, actionCount * 0.1)

    // Mixed actions = higher intensity
    const hasVertical = pattern.requiredActions.includes('jump') || 
                       pattern.requiredActions.includes('slide')
    const hasLateral = pattern.requiredActions.includes('laneLeft') ||
                      pattern.requiredActions.includes('laneRight') ||
                      pattern.requiredActions.includes('laneChange')
    if (hasVertical && hasLateral) {
      intensity += 0.2
    }

    return Math.min(1, intensity)
  }

  /**
   * Calculate overall phrase intensity
   */
  private calculatePhraseIntensity(patterns: ObstaclePattern[]): number {
    if (patterns.length === 0) return 0

    const intensities = patterns.map(p => this.estimatePatternIntensity(p))
    return intensities.reduce((sum, i) => sum + i, 0) / patterns.length
  }

  /**
   * Calculate action variety in phrase
   */
  private calculateActionVariety(patterns: ObstaclePattern[]): number {
    const allActions = new Set<string>()
    
    patterns.forEach(p => {
      p.requiredActions.forEach(a => allActions.add(a))
    })

    // More unique actions = higher variety
    // Max possible is ~5 (jump, slide, laneLeft, laneRight, laneChange)
    return Math.min(1, allActions.size / 4)
  }

  /**
   * Reset state
   */
  reset(): void {
    this.phraseCounter = 0
    this.lastPhraseStructure = null
  }
}
