/**
 * AdaptiveDifficultyManager Property-Based Tests
 *
 * Property tests for adaptive difficulty adjustments.
 * Uses fast-check for property-based testing.
 *
 * **Feature: single-player-enhancement**
 */

import fc from 'fast-check'
import { describe, it, expect, beforeEach } from 'vitest'
import {
  calculateAdjustment,
  clampAccuracy,
  AdaptiveDifficultyManager,
} from '../AdaptiveDifficultyManager'
import { getDifficultyConfig } from '../BotConfigManager'
import type { DifficultyLevel } from '../BotConfigManager'

// Strategy for generating round results
const roundResultStrategy = fc.record({
  playerScore: fc.integer({ min: 0, max: 10000 }),
  botScore: fc.integer({ min: 0, max: 10000 }),
  margin: fc.integer({ min: -10000, max: 10000 }),
})

// Strategy for generating difficulty levels
const difficultyStrategy = fc.constantFrom<DifficultyLevel>(
  'easy',
  'medium',
  'hard'
)

/**
 * **Feature: single-player-enhancement, Property 9: Adaptive difficulty increase threshold**
 * **Validates: Requirements 5.1**
 *
 * For any sequence of round results where the player wins 3 consecutive rounds
 * by more than 500 points, the bot quiz accuracy SHALL increase by exactly
 * 10 percentage points, capped at 85%.
 */
describe('Property 9: Adaptive difficulty increase threshold', () => {
  it('increases by 10pp after 3 consecutive wins by >500 points', () => {
    // Create 3 consecutive wins by more than 500 points
    const results = [
      { playerScore: 1000, botScore: 400, margin: 600 },
      { playerScore: 1200, botScore: 500, margin: 700 },
      { playerScore: 1100, botScore: 300, margin: 800 },
    ]

    const adjustment = calculateAdjustment(results)
    expect(adjustment).toBe(0.1) // 10 percentage points
  })

  it('does not increase if margin is exactly 500', () => {
    const results = [
      { playerScore: 1000, botScore: 500, margin: 500 },
      { playerScore: 1000, botScore: 500, margin: 500 },
      { playerScore: 1000, botScore: 500, margin: 500 },
    ]

    const adjustment = calculateAdjustment(results)
    expect(adjustment).toBe(0) // Not > 500
  })

  it('does not increase if only 2 consecutive wins', () => {
    const results = [
      { playerScore: 1000, botScore: 400, margin: 600 },
      { playerScore: 1200, botScore: 500, margin: 700 },
    ]

    const adjustment = calculateAdjustment(results)
    expect(adjustment).toBe(0)
  })

  it('caps accuracy at 85%', () => {
    fc.assert(
      fc.property(difficultyStrategy, (level) => {
        const manager = new AdaptiveDifficultyManager(level)

        // Simulate many consecutive wins to push accuracy up
        for (let i = 0; i < 10; i++) {
          manager.recordRoundResult(1500, 500) // Win by 1000
          manager.recordRoundResult(1500, 500)
          manager.recordRoundResult(1500, 500)
        }

        const effectiveAccuracy = manager.getEffectiveAccuracy()
        expect(effectiveAccuracy).toBeLessThanOrEqual(0.85)
        return effectiveAccuracy <= 0.85
      }),
      { numRuns: 100 }
    )
  })

  it('increases difficulty for any 3 consecutive big wins', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 501, max: 5000 }), {
          minLength: 3,
          maxLength: 3,
        }),
        (margins) => {
          const results = margins.map((margin) => ({
            playerScore: 1000 + margin,
            botScore: 1000,
            margin,
          }))

          const adjustment = calculateAdjustment(results)
          expect(adjustment).toBe(0.1)
          return adjustment === 0.1
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: single-player-enhancement, Property 10: Adaptive difficulty decrease threshold**
 * **Validates: Requirements 5.2**
 *
 * For any sequence of round results where the player loses 3 consecutive rounds
 * by more than 500 points, the bot quiz accuracy SHALL decrease by exactly
 * 10 percentage points, floored at 30%.
 */
describe('Property 10: Adaptive difficulty decrease threshold', () => {
  it('decreases by 10pp after 3 consecutive losses by >500 points', () => {
    // Create 3 consecutive losses by more than 500 points
    const results = [
      { playerScore: 400, botScore: 1000, margin: -600 },
      { playerScore: 500, botScore: 1200, margin: -700 },
      { playerScore: 300, botScore: 1100, margin: -800 },
    ]

    const adjustment = calculateAdjustment(results)
    expect(adjustment).toBe(-0.1) // -10 percentage points
  })

  it('does not decrease if margin is exactly -500', () => {
    const results = [
      { playerScore: 500, botScore: 1000, margin: -500 },
      { playerScore: 500, botScore: 1000, margin: -500 },
      { playerScore: 500, botScore: 1000, margin: -500 },
    ]

    const adjustment = calculateAdjustment(results)
    expect(adjustment).toBe(0) // Not < -500
  })

  it('does not decrease if only 2 consecutive losses', () => {
    const results = [
      { playerScore: 400, botScore: 1000, margin: -600 },
      { playerScore: 500, botScore: 1200, margin: -700 },
    ]

    const adjustment = calculateAdjustment(results)
    expect(adjustment).toBe(0)
  })

  it('floors accuracy at 30%', () => {
    fc.assert(
      fc.property(difficultyStrategy, (level) => {
        const manager = new AdaptiveDifficultyManager(level)

        // Simulate many consecutive losses to push accuracy down
        for (let i = 0; i < 10; i++) {
          manager.recordRoundResult(500, 1500) // Lose by 1000
          manager.recordRoundResult(500, 1500)
          manager.recordRoundResult(500, 1500)
        }

        const effectiveAccuracy = manager.getEffectiveAccuracy()
        expect(effectiveAccuracy).toBeGreaterThanOrEqual(0.3)
        return effectiveAccuracy >= 0.3
      }),
      { numRuns: 100 }
    )
  })

  it('decreases difficulty for any 3 consecutive big losses', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 501, max: 5000 }), {
          minLength: 3,
          maxLength: 3,
        }),
        (margins) => {
          const results = margins.map((margin) => ({
            playerScore: 1000,
            botScore: 1000 + margin,
            margin: -margin,
          }))

          const adjustment = calculateAdjustment(results)
          expect(adjustment).toBe(-0.1)
          return adjustment === -0.1
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * Accuracy bounds tests
 */
describe('Accuracy bounds', () => {
  it('clampAccuracy keeps values within 30%-85%', () => {
    fc.assert(
      fc.property(fc.double({ min: -1, max: 2, noNaN: true }), (accuracy) => {
        const clamped = clampAccuracy(accuracy)
        expect(clamped).toBeGreaterThanOrEqual(0.3)
        expect(clamped).toBeLessThanOrEqual(0.85)
        return clamped >= 0.3 && clamped <= 0.85
      }),
      { numRuns: 100 }
    )
  })

  it('effective accuracy always stays within bounds', () => {
    fc.assert(
      fc.property(
        difficultyStrategy,
        fc.array(
          fc.record({
            playerScore: fc.integer({ min: 0, max: 5000 }),
            botScore: fc.integer({ min: 0, max: 5000 }),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (level, rounds) => {
          const manager = new AdaptiveDifficultyManager(level)

          for (const round of rounds) {
            manager.recordRoundResult(round.playerScore, round.botScore)
          }

          const accuracy = manager.getEffectiveAccuracy()
          expect(accuracy).toBeGreaterThanOrEqual(0.3)
          expect(accuracy).toBeLessThanOrEqual(0.85)
          return accuracy >= 0.3 && accuracy <= 0.85
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * AdaptiveDifficultyManager class tests
 */
describe('AdaptiveDifficultyManager', () => {
  let manager: AdaptiveDifficultyManager

  beforeEach(() => {
    manager = new AdaptiveDifficultyManager('medium')
  })

  it('starts with zero adjustment', () => {
    expect(manager.getCurrentAdjustment()).toBe(0)
  })

  it('uses base level config initially', () => {
    const baseConfig = getDifficultyConfig('medium')
    const effectiveConfig = manager.getEffectiveDifficulty()
    expect(effectiveConfig.quizAccuracy).toBe(baseConfig.quizAccuracy)
  })

  it('setBaseLevel resets adjustment (Requirements 5.4)', () => {
    // Build up some adjustment
    manager.recordRoundResult(1500, 500)
    manager.recordRoundResult(1500, 500)
    manager.recordRoundResult(1500, 500)

    // Change base level
    manager.setBaseLevel('hard')

    expect(manager.getCurrentAdjustment()).toBe(0)
    expect(manager.getBaseLevel()).toBe('hard')
  })

  it('reset clears all state', () => {
    manager.recordRoundResult(1500, 500)
    manager.recordRoundResult(1500, 500)
    manager.recordRoundResult(1500, 500)

    manager.reset()

    expect(manager.getCurrentAdjustment()).toBe(0)
    expect(manager.getRoundCount()).toBe(0)
  })

  it('tracks round count correctly', () => {
    expect(manager.getRoundCount()).toBe(0)

    manager.recordRoundResult(1000, 800)
    expect(manager.getRoundCount()).toBe(1)

    manager.recordRoundResult(1000, 800)
    expect(manager.getRoundCount()).toBe(2)
  })

  it('clears results after adjustment triggers', () => {
    // Record 3 big wins
    manager.recordRoundResult(1500, 500)
    manager.recordRoundResult(1500, 500)
    manager.recordRoundResult(1500, 500)

    // Results should be cleared after adjustment
    expect(manager.getRoundCount()).toBe(0)
  })
})
