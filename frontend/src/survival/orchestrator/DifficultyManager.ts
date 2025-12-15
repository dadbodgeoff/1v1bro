/**
 * DifficultyManager - Handles difficulty progression and tier transitions
 * Scales challenge based on distance traveled and player performance
 */

import type { DifficultyTier, DifficultyConfig, OrchestratorState } from './types'

/**
 * Default difficulty configurations
 * Tuned for smooth progression from rookie to master
 */
export const DEFAULT_DIFFICULTY_CONFIGS: DifficultyConfig[] = [
  {
    tier: 'rookie',
    minDistance: 0,
    baseGapMultiplier: 1.5,      // Very generous spacing
    patternComplexityMax: 2,
    reactionTimeMs: 800,         // Slow reactions expected
    intensePhaseDuration: 3,
    breatherFrequency: 4,
  },
  {
    tier: 'intermediate',
    minDistance: 200,
    baseGapMultiplier: 1.25,
    patternComplexityMax: 3,
    reactionTimeMs: 600,
    intensePhaseDuration: 4,
    breatherFrequency: 5,
  },
  {
    tier: 'advanced',
    minDistance: 500,
    baseGapMultiplier: 1.0,
    patternComplexityMax: 4,
    reactionTimeMs: 450,
    intensePhaseDuration: 5,
    breatherFrequency: 6,
  },
  {
    tier: 'expert',
    minDistance: 1000,
    baseGapMultiplier: 0.85,
    patternComplexityMax: 5,
    reactionTimeMs: 350,
    intensePhaseDuration: 6,
    breatherFrequency: 7,
  },
  {
    tier: 'master',
    minDistance: 2000,
    baseGapMultiplier: 0.7,      // Tight spacing
    patternComplexityMax: 8,
    reactionTimeMs: 280,         // Fast reactions required
    intensePhaseDuration: 8,
    breatherFrequency: 8,
  },
]

/**
 * Tier order for comparisons
 */
const TIER_ORDER: DifficultyTier[] = ['rookie', 'intermediate', 'advanced', 'expert', 'master']

export class DifficultyManager {
  private configs: Map<DifficultyTier, DifficultyConfig> = new Map()
  private currentTier: DifficultyTier = 'rookie'
  private tierTransitionCallbacks: Array<(from: DifficultyTier, to: DifficultyTier) => void> = []

  constructor(configs: DifficultyConfig[] = DEFAULT_DIFFICULTY_CONFIGS) {
    configs.forEach(config => this.configs.set(config.tier, config))
  }

  /**
   * Update difficulty based on current game state
   * Returns true if tier changed
   */
  update(state: OrchestratorState): boolean {
    const newTier = this.calculateTier(state.distanceTraveled)
    
    if (newTier !== this.currentTier) {
      const oldTier = this.currentTier
      this.currentTier = newTier
      this.notifyTierChange(oldTier, newTier)
      return true
    }
    
    return false
  }

  /**
   * Calculate appropriate tier for given distance
   */
  private calculateTier(distance: number): DifficultyTier {
    let result: DifficultyTier = 'rookie'
    
    for (const tier of TIER_ORDER) {
      const config = this.configs.get(tier)
      if (config && distance >= config.minDistance) {
        result = tier
      }
    }
    
    return result
  }

  /**
   * Get current difficulty tier
   */
  getCurrentTier(): DifficultyTier {
    return this.currentTier
  }

  /**
   * Get config for current tier
   */
  getCurrentConfig(): DifficultyConfig {
    return this.configs.get(this.currentTier) || DEFAULT_DIFFICULTY_CONFIGS[0]
  }

  /**
   * Get config for specific tier
   */
  getConfigForTier(tier: DifficultyTier): DifficultyConfig | undefined {
    return this.configs.get(tier)
  }

  /**
   * Get gap multiplier for current difficulty
   */
  getGapMultiplier(): number {
    return this.getCurrentConfig().baseGapMultiplier
  }

  /**
   * Get expected reaction time for current difficulty
   */
  getReactionTimeMs(): number {
    return this.getCurrentConfig().reactionTimeMs
  }

  /**
   * Get max pattern complexity for current difficulty
   */
  getMaxComplexity(): number {
    return this.getCurrentConfig().patternComplexityMax
  }

  /**
   * Get breather frequency for current difficulty
   */
  getBreatherFrequency(): number {
    return this.getCurrentConfig().breatherFrequency
  }

  /**
   * Check if a tier is at or above current
   */
  isTierUnlocked(tier: DifficultyTier): boolean {
    const currentIndex = TIER_ORDER.indexOf(this.currentTier)
    const checkIndex = TIER_ORDER.indexOf(tier)
    return checkIndex <= currentIndex
  }

  /**
   * Compare two tiers
   * Returns negative if a < b, 0 if equal, positive if a > b
   */
  static compareTiers(a: DifficultyTier, b: DifficultyTier): number {
    return TIER_ORDER.indexOf(a) - TIER_ORDER.indexOf(b)
  }

  /**
   * Register callback for tier transitions
   */
  onTierChange(callback: (from: DifficultyTier, to: DifficultyTier) => void): void {
    this.tierTransitionCallbacks.push(callback)
  }

  private notifyTierChange(from: DifficultyTier, to: DifficultyTier): void {
    this.tierTransitionCallbacks.forEach(cb => cb(from, to))
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.currentTier = 'rookie'
  }

  /**
   * Force set tier (for testing/debug)
   */
  setTier(tier: DifficultyTier): void {
    if (tier !== this.currentTier) {
      const oldTier = this.currentTier
      this.currentTier = tier
      this.notifyTierChange(oldTier, tier)
    }
  }
}
