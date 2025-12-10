/**
 * SessionStatsCalculator Property-Based Tests
 *
 * Property tests for session statistics calculations.
 * Uses fast-check for property-based testing.
 *
 * **Feature: single-player-enhancement**
 */

import fc from 'fast-check'
import { describe, it, expect } from 'vitest'
import {
  calculateAccuracy,
  calculateAverageTime,
  calculateLongestStreak,
  calculateKDRatio,
  SessionStatsCalculator,
} from '../SessionStatsCalculator'

/**
 * **Feature: single-player-enhancement, Property 3: Accuracy calculation correctness**
 * **Validates: Requirements 3.1**
 *
 * For any sequence of quiz answers, the calculated accuracy percentage SHALL equal
 * (correct answers / total questions) * 100, rounded to two decimal places.
 */
describe('Property 3: Accuracy calculation correctness', () => {
  it('accuracy equals (correct / total) * 100 for any answer sequence', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }), // correct answers
        fc.integer({ min: 0, max: 100 }), // additional wrong answers
        (correct, additionalWrong) => {
          const total = correct + additionalWrong

          if (total === 0) {
            expect(calculateAccuracy(correct, total)).toBe(0)
            return true
          }

          const accuracy = calculateAccuracy(correct, total)
          const expected = Math.round((correct / total) * 10000) / 100

          expect(accuracy).toBe(expected)
          return accuracy === expected
        }
      ),
      { numRuns: 100 }
    )
  })

  it('accuracy is 0 when no questions answered', () => {
    expect(calculateAccuracy(0, 0)).toBe(0)
  })

  it('accuracy is 100 when all answers correct', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), (total) => {
        const accuracy = calculateAccuracy(total, total)
        expect(accuracy).toBe(100)
        return accuracy === 100
      }),
      { numRuns: 100 }
    )
  })

  it('accuracy is 0 when all answers wrong', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), (total) => {
        const accuracy = calculateAccuracy(0, total)
        expect(accuracy).toBe(0)
        return accuracy === 0
      }),
      { numRuns: 100 }
    )
  })

  it('accuracy is between 0 and 100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        (correct, total) => {
          const safeCorrect = Math.min(correct, total)
          const accuracy = calculateAccuracy(safeCorrect, total)

          expect(accuracy).toBeGreaterThanOrEqual(0)
          expect(accuracy).toBeLessThanOrEqual(100)
          return accuracy >= 0 && accuracy <= 100
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: single-player-enhancement, Property 4: Average answer time calculation**
 * **Validates: Requirements 3.2**
 *
 * For any sequence of answer times, the calculated average SHALL equal
 * the sum of all times divided by the count of answers.
 */
describe('Property 4: Average answer time calculation', () => {
  it('average equals sum / count for any time sequence', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 100, max: 30000 }), {
          minLength: 1,
          maxLength: 50,
        }),
        (timesMs) => {
          const average = calculateAverageTime(timesMs)
          const sum = timesMs.reduce((acc, t) => acc + t, 0)
          const expected = Math.round((sum / timesMs.length / 1000) * 100) / 100

          expect(average).toBe(expected)
          return average === expected
        }
      ),
      { numRuns: 100 }
    )
  })

  it('average is 0 when no answers', () => {
    expect(calculateAverageTime([])).toBe(0)
  })

  it('average equals single time when only one answer', () => {
    fc.assert(
      fc.property(fc.integer({ min: 100, max: 30000 }), (timeMs) => {
        const average = calculateAverageTime([timeMs])
        const expected = Math.round((timeMs / 1000) * 100) / 100

        expect(average).toBe(expected)
        return average === expected
      }),
      { numRuns: 100 }
    )
  })

  it('average is in seconds (converted from ms)', () => {
    const timesMs = [1000, 2000, 3000] // 1s, 2s, 3s
    const average = calculateAverageTime(timesMs)
    expect(average).toBe(2) // 2 seconds
  })
})

/**
 * **Feature: single-player-enhancement, Property 5: Streak calculation correctness**
 * **Validates: Requirements 3.3**
 *
 * For any sequence of boolean answer results, the longest streak SHALL equal
 * the maximum count of consecutive true values in the sequence.
 */
describe('Property 5: Streak calculation correctness', () => {
  it('finds maximum consecutive trues for any sequence', () => {
    fc.assert(
      fc.property(
        fc.array(fc.boolean(), { minLength: 0, maxLength: 50 }),
        (results) => {
          const streak = calculateLongestStreak(results)

          // Calculate expected manually
          let maxStreak = 0
          let currentStreak = 0
          for (const r of results) {
            if (r) {
              currentStreak++
              maxStreak = Math.max(maxStreak, currentStreak)
            } else {
              currentStreak = 0
            }
          }

          expect(streak).toBe(maxStreak)
          return streak === maxStreak
        }
      ),
      { numRuns: 100 }
    )
  })

  it('streak is 0 for empty sequence', () => {
    expect(calculateLongestStreak([])).toBe(0)
  })

  it('streak is 0 when all answers wrong', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 20 }), (count) => {
        const results = Array(count).fill(false)
        const streak = calculateLongestStreak(results)

        expect(streak).toBe(0)
        return streak === 0
      }),
      { numRuns: 100 }
    )
  })

  it('streak equals length when all answers correct', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 20 }), (count) => {
        const results = Array(count).fill(true)
        const streak = calculateLongestStreak(results)

        expect(streak).toBe(count)
        return streak === count
      }),
      { numRuns: 100 }
    )
  })

  it('streak is at least 1 if any answer is correct', () => {
    fc.assert(
      fc.property(
        fc.array(fc.boolean(), { minLength: 1, maxLength: 20 }),
        (results) => {
          const hasCorrect = results.some((r) => r)
          const streak = calculateLongestStreak(results)

          if (hasCorrect) {
            expect(streak).toBeGreaterThanOrEqual(1)
            return streak >= 1
          }
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('handles alternating pattern correctly', () => {
    // true, false, true, false, true
    const results = [true, false, true, false, true]
    expect(calculateLongestStreak(results)).toBe(1)
  })

  it('finds streak at end of sequence', () => {
    // false, false, true, true, true
    const results = [false, false, true, true, true]
    expect(calculateLongestStreak(results)).toBe(3)
  })

  it('finds streak at start of sequence', () => {
    // true, true, true, false, false
    const results = [true, true, true, false, false]
    expect(calculateLongestStreak(results)).toBe(3)
  })
})

/**
 * **Feature: single-player-enhancement, Property 6: K/D ratio calculation**
 * **Validates: Requirements 3.4**
 *
 * For any kills and deaths count, the K/D ratio SHALL equal
 * kills / max(deaths, 1) to avoid division by zero.
 */
describe('Property 6: K/D ratio calculation', () => {
  it('KD equals kills / max(deaths, 1) for any values', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (kills, deaths) => {
          const kd = calculateKDRatio(kills, deaths)
          const divisor = Math.max(deaths, 1)
          const expected = Math.round((kills / divisor) * 100) / 100

          expect(kd).toBe(expected)
          return kd === expected
        }
      ),
      { numRuns: 100 }
    )
  })

  it('KD equals kills when deaths is 0', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), (kills) => {
        const kd = calculateKDRatio(kills, 0)
        expect(kd).toBe(kills)
        return kd === kills
      }),
      { numRuns: 100 }
    )
  })

  it('KD is 0 when kills is 0', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), (deaths) => {
        const kd = calculateKDRatio(0, deaths)
        expect(kd).toBe(0)
        return kd === 0
      }),
      { numRuns: 100 }
    )
  })

  it('KD is 1 when kills equals deaths (and both > 0)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), (count) => {
        const kd = calculateKDRatio(count, count)
        expect(kd).toBe(1)
        return kd === 1
      }),
      { numRuns: 100 }
    )
  })

  it('KD is never negative', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (kills, deaths) => {
          const kd = calculateKDRatio(kills, deaths)
          expect(kd).toBeGreaterThanOrEqual(0)
          return kd >= 0
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * SessionStatsCalculator class integration tests
 */
describe('SessionStatsCalculator Integration', () => {
  it('tracks answers correctly', () => {
    const calc = new SessionStatsCalculator()

    calc.recordAnswer(true, 2000)
    calc.recordAnswer(false, 3000)
    calc.recordAnswer(true, 1500)

    const stats = calc.getCurrentStats()
    expect(stats.totalQuestions).toBe(3)
    expect(stats.correctAnswers).toBe(2)
    expect(stats.accuracy).toBe(66.67)
    expect(stats.longestStreak).toBe(1)
  })

  it('tracks combat stats correctly', () => {
    const calc = new SessionStatsCalculator()

    calc.recordKill()
    calc.recordKill()
    calc.recordDeath()
    calc.recordDamage(50)
    calc.recordDamage(30)

    const stats = calc.getCurrentStats()
    expect(stats.kills).toBe(2)
    expect(stats.deaths).toBe(1)
    expect(stats.kdRatio).toBe(2)
    expect(stats.damageDealt).toBe(80)
  })

  it('calculates final stats with all fields', () => {
    const calc = new SessionStatsCalculator()

    calc.recordAnswer(true, 2000)
    calc.recordAnswer(true, 1500)
    calc.recordKill()
    calc.setFinalScore(1500)
    calc.setEffectiveDifficulty(0.65)

    const stats = calc.calculateFinalStats(true)

    expect(stats.totalQuestions).toBe(2)
    expect(stats.correctAnswers).toBe(2)
    expect(stats.accuracy).toBe(100)
    expect(stats.longestStreak).toBe(2)
    expect(stats.kills).toBe(1)
    expect(stats.deaths).toBe(0)
    expect(stats.kdRatio).toBe(1)
    expect(stats.finalScore).toBe(1500)
    expect(stats.effectiveDifficulty).toBe(0.65)
    expect(stats.isPersonalBest).toBe(true)
    expect(stats.duration).toBeGreaterThanOrEqual(0)
  })

  it('resets all stats', () => {
    const calc = new SessionStatsCalculator()

    calc.recordAnswer(true, 2000)
    calc.recordKill()
    calc.recordDamage(50)

    calc.reset()

    const stats = calc.getCurrentStats()
    expect(stats.totalQuestions).toBe(0)
    expect(stats.kills).toBe(0)
    expect(stats.damageDealt).toBe(0)
  })
})
