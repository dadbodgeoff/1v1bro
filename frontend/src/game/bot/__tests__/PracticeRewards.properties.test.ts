/**
 * PracticeRewards Property-Based Tests
 *
 * Property tests for XP calculation and daily bonus logic.
 * Uses fast-check for property-based testing.
 *
 * **Feature: single-player-enhancement**
 */

import fc from 'fast-check'
import { describe, it, expect } from 'vitest'
import {
  calculatePracticeXP,
  shouldAwardDailyBonus,
  getPersonalBestBonus,
  getTutorialCompletionBonus,
  getDailyPracticeBonus,
  getSessionsUntilDailyBonus,
  calculateSessionRewards,
} from '../PracticeRewards'

/**
 * **Feature: single-player-enhancement, Property 12: Practice XP calculation**
 * **Validates: Requirements 7.1**
 *
 * For any practice session score, the XP awarded SHALL equal 25% of the
 * equivalent multiplayer XP value (floor division).
 */
describe('Property 12: Practice XP calculation', () => {
  it('XP equals 25% of multiplayer equivalent (floor division)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100000 }), (score) => {
        const practiceXP = calculatePracticeXP(score)

        // Multiplayer XP = floor(score * 0.1)
        // Practice XP = floor(multiplayerXP * 0.25)
        const multiplayerXP = Math.floor(score * 0.1)
        const expectedXP = Math.floor(multiplayerXP * 0.25)

        expect(practiceXP).toBe(expectedXP)
        return practiceXP === expectedXP
      }),
      { numRuns: 100 }
    )
  })

  it('XP is always non-negative', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100000 }), (score) => {
        const xp = calculatePracticeXP(score)
        expect(xp).toBeGreaterThanOrEqual(0)
        return xp >= 0
      }),
      { numRuns: 100 }
    )
  })

  it('XP is always an integer', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100000 }), (score) => {
        const xp = calculatePracticeXP(score)
        expect(Number.isInteger(xp)).toBe(true)
        return Number.isInteger(xp)
      }),
      { numRuns: 100 }
    )
  })

  it('higher scores give more XP', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 50000 }),
        fc.integer({ min: 1, max: 50000 }),
        (baseScore, increase) => {
          const lowerXP = calculatePracticeXP(baseScore)
          const higherXP = calculatePracticeXP(baseScore + increase)

          expect(higherXP).toBeGreaterThanOrEqual(lowerXP)
          return higherXP >= lowerXP
        }
      ),
      { numRuns: 100 }
    )
  })

  it('zero score gives zero XP', () => {
    expect(calculatePracticeXP(0)).toBe(0)
  })

  it('example: 1000 score gives 25 XP', () => {
    // 1000 * 0.1 = 100 multiplayer XP
    // 100 * 0.25 = 25 practice XP
    expect(calculatePracticeXP(1000)).toBe(25)
  })

  it('example: 4000 score gives 100 XP', () => {
    // 4000 * 0.1 = 400 multiplayer XP
    // 400 * 0.25 = 100 practice XP
    expect(calculatePracticeXP(4000)).toBe(100)
  })
})

/**
 * **Feature: single-player-enhancement, Property 13: Daily bonus threshold**
 * **Validates: Requirements 7.4**
 *
 * For any user who completes exactly 5 practice sessions in a single day,
 * the daily bonus of 75 XP SHALL be awarded exactly once.
 */
describe('Property 13: Daily bonus threshold', () => {
  it('awards bonus at exactly 5 sessions if not claimed', () => {
    expect(shouldAwardDailyBonus(5, false)).toBe(true)
  })

  it('does not award bonus if already claimed', () => {
    fc.assert(
      fc.property(fc.integer({ min: 5, max: 100 }), (sessionCount) => {
        const shouldAward = shouldAwardDailyBonus(sessionCount, true)
        expect(shouldAward).toBe(false)
        return shouldAward === false
      }),
      { numRuns: 100 }
    )
  })

  it('does not award bonus before 5 sessions', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 4 }), (sessionCount) => {
        const shouldAward = shouldAwardDailyBonus(sessionCount, false)
        expect(shouldAward).toBe(false)
        return shouldAward === false
      }),
      { numRuns: 100 }
    )
  })

  it('awards bonus at 5 or more sessions if not claimed', () => {
    fc.assert(
      fc.property(fc.integer({ min: 5, max: 100 }), (sessionCount) => {
        const shouldAward = shouldAwardDailyBonus(sessionCount, false)
        expect(shouldAward).toBe(true)
        return shouldAward === true
      }),
      { numRuns: 100 }
    )
  })

  it('daily bonus is exactly 75 XP', () => {
    expect(getDailyPracticeBonus()).toBe(75)
  })

  it('sessions until bonus decreases correctly', () => {
    expect(getSessionsUntilDailyBonus(0)).toBe(5)
    expect(getSessionsUntilDailyBonus(1)).toBe(4)
    expect(getSessionsUntilDailyBonus(2)).toBe(3)
    expect(getSessionsUntilDailyBonus(3)).toBe(2)
    expect(getSessionsUntilDailyBonus(4)).toBe(1)
    expect(getSessionsUntilDailyBonus(5)).toBe(0)
    expect(getSessionsUntilDailyBonus(10)).toBe(0)
  })
})

/**
 * Other bonus tests
 */
describe('Other bonuses', () => {
  it('personal best bonus is 50 XP', () => {
    expect(getPersonalBestBonus()).toBe(50)
  })

  it('tutorial completion bonus is 100 XP', () => {
    expect(getTutorialCompletionBonus()).toBe(100)
  })
})

/**
 * Session rewards calculation tests
 */
describe('Session rewards calculation', () => {
  it('calculates total correctly with all bonuses', () => {
    const rewards = calculateSessionRewards(
      4000, // score
      true, // isPersonalBest
      5, // sessionCount (triggers daily)
      false, // dailyBonusClaimed
      true // tutorialJustCompleted
    )

    expect(rewards.baseXP).toBe(100) // 4000 * 0.1 * 0.25
    expect(rewards.personalBestBonus).toBe(50)
    expect(rewards.dailyBonus).toBe(75)
    expect(rewards.tutorialBonus).toBe(100)
    expect(rewards.totalXP).toBe(325)
  })

  it('calculates correctly with no bonuses', () => {
    const rewards = calculateSessionRewards(
      1000, // score
      false, // isPersonalBest
      2, // sessionCount
      false, // dailyBonusClaimed
      false // tutorialJustCompleted
    )

    expect(rewards.baseXP).toBe(25)
    expect(rewards.personalBestBonus).toBe(0)
    expect(rewards.dailyBonus).toBe(0)
    expect(rewards.tutorialBonus).toBe(0)
    expect(rewards.totalXP).toBe(25)
  })

  it('does not give daily bonus if already claimed', () => {
    const rewards = calculateSessionRewards(
      1000,
      false,
      10, // Many sessions
      true, // Already claimed
      false
    )

    expect(rewards.dailyBonus).toBe(0)
  })
})
