/**
 * BotConfigManager Property-Based Tests
 * 
 * Property tests for the bot configuration system.
 * Uses fast-check for property-based testing.
 * 
 * **Feature: single-player-enhancement**
 */

import fc from 'fast-check'
import { describe, it, expect } from 'vitest'
import {
  getDifficultyConfig,
  getPracticeTypeConfig,
  applyAdaptiveAdjustment,
  isValidDifficultyLevel,
  isValidPracticeType,
  getAllDifficultyLevels,
  getAllPracticeTypes,
  DEFAULT_DIFFICULTY,
  DEFAULT_PRACTICE_TYPE,
  type DifficultyLevel,
  type PracticeType,
  type DifficultyConfig,
} from '../BotConfigManager'

// Strategies for generating valid inputs
const difficultyLevelStrategy = fc.constantFrom<DifficultyLevel>('easy', 'medium', 'hard')
const practiceTypeStrategy = fc.constantFrom<PracticeType>('quiz_only', 'combat_only', 'full_game')

// Expected values per requirements
const EXPECTED_CONFIGS = {
  easy: {
    quizAccuracy: 0.40,
    shootCooldown: 1200,
    movementSpeed: 80,
  },
  medium: {
    quizAccuracy: 0.55,
    shootCooldown: 800,
    movementSpeed: 120,
  },
  hard: {
    quizAccuracy: 0.75,
    shootCooldown: 500,
    movementSpeed: 160,
  },
}

/**
 * **Feature: single-player-enhancement, Property 1: Difficulty configuration consistency**
 * **Validates: Requirements 1.2, 1.3, 1.4**
 * 
 * For any difficulty level selection, the returned bot configuration SHALL contain
 * quiz accuracy, shoot cooldown, and movement speed values that exactly match
 * the predefined constants for that level.
 */
describe('Property 1: Difficulty configuration consistency', () => {
  it('returns exact predefined values for any difficulty level', () => {
    fc.assert(
      fc.property(
        difficultyLevelStrategy,
        (level: DifficultyLevel) => {
          const config = getDifficultyConfig(level)
          const expected = EXPECTED_CONFIGS[level]
          
          // Quiz accuracy must match exactly
          expect(config.quizAccuracy).toBe(expected.quizAccuracy)
          
          // Shoot cooldown must match exactly
          expect(config.shootCooldown).toBe(expected.shootCooldown)
          
          // Movement speed must match exactly
          expect(config.movementSpeed).toBe(expected.movementSpeed)
          
          return (
            config.quizAccuracy === expected.quizAccuracy &&
            config.shootCooldown === expected.shootCooldown &&
            config.movementSpeed === expected.movementSpeed
          )
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Easy difficulty has 40% accuracy, 1200ms cooldown, 80 speed', () => {
    const config = getDifficultyConfig('easy')
    expect(config.quizAccuracy).toBe(0.40)
    expect(config.shootCooldown).toBe(1200)
    expect(config.movementSpeed).toBe(80)
  })

  it('Medium difficulty has 55% accuracy, 800ms cooldown, 120 speed', () => {
    const config = getDifficultyConfig('medium')
    expect(config.quizAccuracy).toBe(0.55)
    expect(config.shootCooldown).toBe(800)
    expect(config.movementSpeed).toBe(120)
  })

  it('Hard difficulty has 75% accuracy, 500ms cooldown, 160 speed', () => {
    const config = getDifficultyConfig('hard')
    expect(config.quizAccuracy).toBe(0.75)
    expect(config.shootCooldown).toBe(500)
    expect(config.movementSpeed).toBe(160)
  })

  it('config values are immutable (returns copy)', () => {
    fc.assert(
      fc.property(
        difficultyLevelStrategy,
        (level: DifficultyLevel) => {
          const config1 = getDifficultyConfig(level)
          const config2 = getDifficultyConfig(level)
          
          // Should be equal but not the same object
          expect(config1).toEqual(config2)
          expect(config1).not.toBe(config2)
          
          // Modifying one should not affect the other
          config1.quizAccuracy = 0.99
          expect(config2.quizAccuracy).toBe(EXPECTED_CONFIGS[level].quizAccuracy)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('difficulty increases from easy to hard', () => {
    const easy = getDifficultyConfig('easy')
    const medium = getDifficultyConfig('medium')
    const hard = getDifficultyConfig('hard')
    
    // Quiz accuracy increases
    expect(easy.quizAccuracy).toBeLessThan(medium.quizAccuracy)
    expect(medium.quizAccuracy).toBeLessThan(hard.quizAccuracy)
    
    // Shoot cooldown decreases (faster shooting)
    expect(easy.shootCooldown).toBeGreaterThan(medium.shootCooldown)
    expect(medium.shootCooldown).toBeGreaterThan(hard.shootCooldown)
    
    // Movement speed increases
    expect(easy.movementSpeed).toBeLessThan(medium.movementSpeed)
    expect(medium.movementSpeed).toBeLessThan(hard.movementSpeed)
  })
})

/**
 * **Feature: single-player-enhancement, Property 2: Practice type configuration consistency**
 * **Validates: Requirements 2.2, 2.3, 2.4**
 * 
 * For any practice type selection, the returned configuration SHALL correctly
 * enable/disable combat and quiz mechanics according to the type definition.
 */
describe('Property 2: Practice type configuration consistency', () => {
  it('returns correct enable/disable settings for any practice type', () => {
    fc.assert(
      fc.property(
        practiceTypeStrategy,
        (type: PracticeType) => {
          const config = getPracticeTypeConfig(type)
          
          switch (type) {
            case 'quiz_only':
              // Requirements 2.2: disable combat, enable quiz
              expect(config.combatEnabled).toBe(false)
              expect(config.quizEnabled).toBe(true)
              return !config.combatEnabled && config.quizEnabled
              
            case 'combat_only':
              // Requirements 2.3: enable combat, disable quiz, enable respawn
              expect(config.combatEnabled).toBe(true)
              expect(config.quizEnabled).toBe(false)
              expect(config.respawnEnabled).toBe(true)
              return config.combatEnabled && !config.quizEnabled && config.respawnEnabled
              
            case 'full_game':
              // Requirements 2.4: enable both
              expect(config.combatEnabled).toBe(true)
              expect(config.quizEnabled).toBe(true)
              return config.combatEnabled && config.quizEnabled
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Quiz Only disables combat and enables quiz', () => {
    const config = getPracticeTypeConfig('quiz_only')
    expect(config.combatEnabled).toBe(false)
    expect(config.quizEnabled).toBe(true)
  })

  it('Combat Only enables combat and disables quiz', () => {
    const config = getPracticeTypeConfig('combat_only')
    expect(config.combatEnabled).toBe(true)
    expect(config.quizEnabled).toBe(false)
    expect(config.respawnEnabled).toBe(true)
  })

  it('Full Game enables both combat and quiz', () => {
    const config = getPracticeTypeConfig('full_game')
    expect(config.combatEnabled).toBe(true)
    expect(config.quizEnabled).toBe(true)
  })

  it('config values are immutable (returns copy)', () => {
    fc.assert(
      fc.property(
        practiceTypeStrategy,
        (type: PracticeType) => {
          const config1 = getPracticeTypeConfig(type)
          const config2 = getPracticeTypeConfig(type)
          
          // Should be equal but not the same object
          expect(config1).toEqual(config2)
          expect(config1).not.toBe(config2)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * Additional property tests for validation and defaults
 */
describe('Validation and Defaults', () => {
  it('default difficulty is medium (Requirements 1.5)', () => {
    expect(DEFAULT_DIFFICULTY).toBe('medium')
  })

  it('default practice type is full_game (Requirements 2.5)', () => {
    expect(DEFAULT_PRACTICE_TYPE).toBe('full_game')
  })

  it('isValidDifficultyLevel accepts only valid levels', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (str: string) => {
          const isValid = isValidDifficultyLevel(str)
          const shouldBeValid = str === 'easy' || str === 'medium' || str === 'hard'
          expect(isValid).toBe(shouldBeValid)
          return isValid === shouldBeValid
        }
      ),
      { numRuns: 100 }
    )
  })

  it('isValidPracticeType accepts only valid types', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (str: string) => {
          const isValid = isValidPracticeType(str)
          const shouldBeValid = str === 'quiz_only' || str === 'combat_only' || str === 'full_game'
          expect(isValid).toBe(shouldBeValid)
          return isValid === shouldBeValid
        }
      ),
      { numRuns: 100 }
    )
  })

  it('getAllDifficultyLevels returns all three levels', () => {
    const levels = getAllDifficultyLevels()
    expect(levels).toHaveLength(3)
    expect(levels).toContain('easy')
    expect(levels).toContain('medium')
    expect(levels).toContain('hard')
  })

  it('getAllPracticeTypes returns all three types', () => {
    const types = getAllPracticeTypes()
    expect(types).toHaveLength(3)
    expect(types).toContain('quiz_only')
    expect(types).toContain('combat_only')
    expect(types).toContain('full_game')
  })
})

/**
 * Adaptive difficulty adjustment tests (preview for Property 9 & 10)
 */
describe('Adaptive Difficulty Adjustment', () => {
  it('adjustment stays within bounds (30% min, 85% max)', () => {
    fc.assert(
      fc.property(
        difficultyLevelStrategy,
        fc.double({ min: -1.0, max: 1.0, noNaN: true }),
        (level: DifficultyLevel, adjustment: number) => {
          const base = getDifficultyConfig(level)
          const adjusted = applyAdaptiveAdjustment(base, adjustment)
          
          // Must stay within bounds
          expect(adjusted.quizAccuracy).toBeGreaterThanOrEqual(0.30)
          expect(adjusted.quizAccuracy).toBeLessThanOrEqual(0.85)
          
          return adjusted.quizAccuracy >= 0.30 && adjusted.quizAccuracy <= 0.85
        }
      ),
      { numRuns: 100 }
    )
  })

  it('handles NaN adjustment gracefully', () => {
    const base = getDifficultyConfig('medium')
    const adjusted = applyAdaptiveAdjustment(base, NaN)
    
    // Should return base accuracy when adjustment is NaN
    expect(adjusted.quizAccuracy).toBe(base.quizAccuracy)
  })

  it('positive adjustment increases accuracy (up to cap)', () => {
    const base = getDifficultyConfig('medium')
    const adjusted = applyAdaptiveAdjustment(base, 0.10)
    
    expect(adjusted.quizAccuracy).toBe(0.65) // 0.55 + 0.10
  })

  it('negative adjustment decreases accuracy (down to floor)', () => {
    const base = getDifficultyConfig('medium')
    const adjusted = applyAdaptiveAdjustment(base, -0.10)
    
    expect(adjusted.quizAccuracy).toBe(0.45) // 0.55 - 0.10
  })

  it('adjustment caps at 85%', () => {
    const base = getDifficultyConfig('hard') // 75%
    const adjusted = applyAdaptiveAdjustment(base, 0.20)
    
    expect(adjusted.quizAccuracy).toBe(0.85) // Capped at 85%
  })

  it('adjustment floors at 30%', () => {
    const base = getDifficultyConfig('easy') // 40%
    const adjusted = applyAdaptiveAdjustment(base, -0.20)
    
    expect(adjusted.quizAccuracy).toBe(0.30) // Floored at 30%
  })

  it('adjustment preserves other config values', () => {
    fc.assert(
      fc.property(
        difficultyLevelStrategy,
        fc.double({ min: -0.2, max: 0.2 }),
        (level: DifficultyLevel, adjustment: number) => {
          const base = getDifficultyConfig(level)
          const adjusted = applyAdaptiveAdjustment(base, adjustment)
          
          // All other values should remain unchanged
          expect(adjusted.shootCooldown).toBe(base.shootCooldown)
          expect(adjusted.movementSpeed).toBe(base.movementSpeed)
          expect(adjusted.aggroRange).toBe(base.aggroRange)
          expect(adjusted.retreatHealth).toBe(base.retreatHealth)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})
