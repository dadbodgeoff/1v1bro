/**
 * PacingController - Manages gameplay rhythm and intensity phases
 * Creates the ebb and flow that makes endless runners engaging
 */

import type { PacingPhase, PacingConfig } from './types'
import type { DifficultyManager } from './DifficultyManager'

/**
 * Default pacing configurations
 */
export const DEFAULT_PACING_CONFIGS: PacingConfig[] = [
  {
    phase: 'warmup',
    durationPatterns: 5,
    gapMultiplier: 1.5,
    patternWeightModifiers: {
      'single-jump-gate': 1.5,
      'single-spikes': 1.5,
      'single-dodge-left': 1.3,
      'single-dodge-right': 1.3,
      'center-block': 1.3,
    },
  },
  {
    phase: 'building',
    durationPatterns: 6,
    gapMultiplier: 1.2,
    patternWeightModifiers: {
      'jump-then-dodge': 1.2,
      'spikes-dodge': 1.2,
      'lane-weave-simple': 1.3,
    },
  },
  {
    phase: 'intense',
    durationPatterns: 4,
    gapMultiplier: 0.9,
    patternWeightModifiers: {
      'triple-weave': 1.3,
      'spikes-weave': 1.2,
      'corridor-spikes': 1.2,
      'rapid-weave': 1.3,
      'spike-gauntlet': 1.1,
    },
  },
  {
    phase: 'breather',
    durationPatterns: 2,
    gapMultiplier: 2.0,
    patternWeightModifiers: {
      'single-jump-gate': 2.0,
      'single-spikes': 2.0,
      'center-block': 1.5,
      'knowledge-solo': 3.0,  // Good time for trivia
    },
  },
  {
    phase: 'climax',
    durationPatterns: 3,
    gapMultiplier: 0.85,
    patternWeightModifiers: {
      'spike-gauntlet': 1.5,
      'death-corridor': 1.5,
      'rapid-weave': 1.3,
    },
  },
]

/**
 * Phase cycle order
 */
const PHASE_CYCLE: PacingPhase[] = ['warmup', 'building', 'intense', 'breather', 'building', 'intense', 'climax', 'breather']

export class PacingController {
  private configs: Map<PacingPhase, PacingConfig> = new Map()
  private difficultyManager: DifficultyManager
  
  private currentPhase: PacingPhase = 'warmup'
  private patternsInPhase: number = 0
  private cycleIndex: number = 0
  private isFirstCycle: boolean = true
  
  private phaseChangeCallbacks: Array<(from: PacingPhase, to: PacingPhase) => void> = []

  constructor(difficultyManager: DifficultyManager, configs: PacingConfig[] = DEFAULT_PACING_CONFIGS) {
    this.difficultyManager = difficultyManager
    configs.forEach(config => this.configs.set(config.phase, config))
  }

  /**
   * Called after each pattern is spawned
   * Returns true if phase changed
   */
  onPatternSpawned(): boolean {
    this.patternsInPhase++
    
    const currentConfig = this.getCurrentConfig()
    const phaseDuration = this.getAdjustedPhaseDuration(currentConfig)
    
    if (this.patternsInPhase >= phaseDuration) {
      return this.advancePhase()
    }
    
    return false
  }

  /**
   * Advance to next phase in cycle
   */
  private advancePhase(): boolean {
    const oldPhase = this.currentPhase
    
    // Move to next phase in cycle
    this.cycleIndex = (this.cycleIndex + 1) % PHASE_CYCLE.length
    
    // After first warmup, skip it in future cycles
    if (this.isFirstCycle && this.cycleIndex === 0) {
      this.isFirstCycle = false
      this.cycleIndex = 1  // Skip warmup
    }
    
    this.currentPhase = PHASE_CYCLE[this.cycleIndex]
    this.patternsInPhase = 0
    
    if (oldPhase !== this.currentPhase) {
      this.notifyPhaseChange(oldPhase, this.currentPhase)
      return true
    }
    
    return false
  }

  /**
   * Get phase duration adjusted for difficulty
   */
  private getAdjustedPhaseDuration(config: PacingConfig): number {
    const baseDuration = config.durationPatterns
    
    // Intense phases get longer at higher difficulties
    if (config.phase === 'intense' || config.phase === 'climax') {
      const diffConfig = this.difficultyManager.getCurrentConfig()
      return baseDuration + Math.floor(diffConfig.intensePhaseDuration / 2)
    }
    
    // Breathers stay consistent
    if (config.phase === 'breather') {
      return baseDuration
    }
    
    return baseDuration
  }

  /**
   * Get current pacing phase
   */
  getCurrentPhase(): PacingPhase {
    return this.currentPhase
  }

  /**
   * Get config for current phase
   */
  getCurrentConfig(): PacingConfig {
    return this.configs.get(this.currentPhase) || DEFAULT_PACING_CONFIGS[0]
  }

  /**
   * Get gap multiplier for current phase
   */
  getGapMultiplier(): number {
    return this.getCurrentConfig().gapMultiplier
  }

  /**
   * Get pattern weight modifier for current phase
   */
  getPatternWeightModifier(patternId: string): number {
    const modifiers = this.getCurrentConfig().patternWeightModifiers
    return modifiers[patternId] || 1.0
  }

  /**
   * Check if we're in a high-intensity phase
   */
  isIntensePhase(): boolean {
    return this.currentPhase === 'intense' || this.currentPhase === 'climax'
  }

  /**
   * Check if we're in a recovery phase
   */
  isRecoveryPhase(): boolean {
    return this.currentPhase === 'breather' || this.currentPhase === 'warmup'
  }

  /**
   * Get progress through current phase (0-1)
   */
  getPhaseProgress(): number {
    const config = this.getCurrentConfig()
    const duration = this.getAdjustedPhaseDuration(config)
    return Math.min(1, this.patternsInPhase / duration)
  }

  /**
   * Force transition to specific phase (for events/triggers)
   */
  forcePhase(phase: PacingPhase): void {
    if (phase !== this.currentPhase) {
      const oldPhase = this.currentPhase
      this.currentPhase = phase
      this.patternsInPhase = 0
      this.notifyPhaseChange(oldPhase, phase)
    }
  }

  /**
   * Register callback for phase changes
   */
  onPhaseChange(callback: (from: PacingPhase, to: PacingPhase) => void): void {
    this.phaseChangeCallbacks.push(callback)
  }

  private notifyPhaseChange(from: PacingPhase, to: PacingPhase): void {
    this.phaseChangeCallbacks.forEach(cb => cb(from, to))
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.currentPhase = 'warmup'
    this.patternsInPhase = 0
    this.cycleIndex = 0
    this.isFirstCycle = true
  }
}
