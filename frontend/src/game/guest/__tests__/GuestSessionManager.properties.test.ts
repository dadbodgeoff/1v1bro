/**
 * Property-Based Tests for GuestSessionManager
 * 
 * Uses fast-check for property-based testing of session stats
 * accumulation, XP calculation, and milestone detection.
 * 
 * @module game/guest/__tests__/GuestSessionManager.properties
 */

import fc from 'fast-check'
import { describe, it, expect, beforeEach } from 'vitest'
import {
  GuestSessionManager,
  calculatePreviewXp,
  accumulateStats,
  type GuestSessionStats,
  type MatchResult,
} from '../GuestSessionManager'

// Strategy for generating valid match results
const matchResultStrategy = fc.record({
  won: fc.boolean(),
  playerScore: fc.integer({ min: 0, max: 15000 }),
  botScore: fc.integer({ min: 0, max: 15000 }),
  kills: fc.integer({ min: 0, max: 50 }),
  deaths: fc.integer({ min: 0, max: 50 }),
  questionsAnswered: fc.integer({ min: 0, max: 15 }),
  questionsCorrect: fc.integer({ min: 0, max: 15 }),
  matchDurationMs: fc.integer({ min: 30000, max: 600000 }),
  category: fc.constantFrom('fortnite', 'nfl', 'sports', 'movies', 'music', 'general'),
}).filter(r => r.questionsCorrect <= r.questionsAnswered)

// All available categories
const ALL_CATEGORIES = ['fortnite', 'nfl', 'sports', 'movies', 'music', 'general'] as const

// Strategy for generating initial session stats with unique categories
const initialStatsStrategy = fc.record({
  sessionId: fc.string({ minLength: 10, maxLength: 30 }),
  startedAt: fc.integer({ min: 1700000000000, max: 1800000000000 }),
  lastPlayedAt: fc.integer({ min: 1700000000000, max: 1800000000000 }),
  matchesPlayed: fc.integer({ min: 0, max: 100 }),
  matchesWon: fc.integer({ min: 0, max: 100 }),
  totalKills: fc.integer({ min: 0, max: 500 }),
  totalDeaths: fc.integer({ min: 0, max: 500 }),
  questionsAnswered: fc.integer({ min: 0, max: 1500 }),
  questionsCorrect: fc.integer({ min: 0, max: 1500 }),
  previewXpEarned: fc.integer({ min: 0, max: 50000 }),
  milestonesAchieved: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { maxLength: 10 }),
  categoriesPlayed: fc.uniqueArray(fc.constantFrom(...ALL_CATEGORIES), { maxLength: 6 }),
}).filter(s => s.matchesWon <= s.matchesPlayed && s.questionsCorrect <= s.questionsAnswered)

/**
 * **Feature: guest-experience-enhancement, Property 4: Session stats accumulation correctness**
 * 
 * For any sequence of match results, the accumulated session statistics
 * SHALL equal the sum of individual match statistics.
 * 
 * **Validates: Requirements 4.1**
 */
describe('Property 4: Session stats accumulation correctness', () => {
  it('accumulated stats equal sum of individual match stats for matchesPlayed', () => {
    fc.assert(
      fc.property(
        initialStatsStrategy,
        fc.array(matchResultStrategy, { minLength: 1, maxLength: 20 }),
        (initial, results) => {
          const accumulated = accumulateStats(initial, results)
          expect(accumulated.matchesPlayed).toBe(initial.matchesPlayed + results.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('accumulated stats equal sum of individual match stats for matchesWon', () => {
    fc.assert(
      fc.property(
        initialStatsStrategy,
        fc.array(matchResultStrategy, { minLength: 1, maxLength: 20 }),
        (initial, results) => {
          const accumulated = accumulateStats(initial, results)
          const winsInResults = results.filter(r => r.won).length
          expect(accumulated.matchesWon).toBe(initial.matchesWon + winsInResults)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('accumulated stats equal sum of individual match stats for totalKills', () => {
    fc.assert(
      fc.property(
        initialStatsStrategy,
        fc.array(matchResultStrategy, { minLength: 1, maxLength: 20 }),
        (initial, results) => {
          const accumulated = accumulateStats(initial, results)
          const killsInResults = results.reduce((sum, r) => sum + r.kills, 0)
          expect(accumulated.totalKills).toBe(initial.totalKills + killsInResults)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('accumulated stats equal sum of individual match stats for totalDeaths', () => {
    fc.assert(
      fc.property(
        initialStatsStrategy,
        fc.array(matchResultStrategy, { minLength: 1, maxLength: 20 }),
        (initial, results) => {
          const accumulated = accumulateStats(initial, results)
          const deathsInResults = results.reduce((sum, r) => sum + r.deaths, 0)
          expect(accumulated.totalDeaths).toBe(initial.totalDeaths + deathsInResults)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('accumulated stats equal sum of individual match stats for questionsAnswered', () => {
    fc.assert(
      fc.property(
        initialStatsStrategy,
        fc.array(matchResultStrategy, { minLength: 1, maxLength: 20 }),
        (initial, results) => {
          const accumulated = accumulateStats(initial, results)
          const answeredInResults = results.reduce((sum, r) => sum + r.questionsAnswered, 0)
          expect(accumulated.questionsAnswered).toBe(initial.questionsAnswered + answeredInResults)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('accumulated stats equal sum of individual match stats for questionsCorrect', () => {
    fc.assert(
      fc.property(
        initialStatsStrategy,
        fc.array(matchResultStrategy, { minLength: 1, maxLength: 20 }),
        (initial, results) => {
          const accumulated = accumulateStats(initial, results)
          const correctInResults = results.reduce((sum, r) => sum + r.questionsCorrect, 0)
          expect(accumulated.questionsCorrect).toBe(initial.questionsCorrect + correctInResults)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('accumulated previewXpEarned equals sum of individual match XP calculations', () => {
    fc.assert(
      fc.property(
        initialStatsStrategy,
        fc.array(matchResultStrategy, { minLength: 1, maxLength: 20 }),
        (initial, results) => {
          const accumulated = accumulateStats(initial, results)
          const xpInResults = results.reduce((sum, r) => sum + calculatePreviewXp(r), 0)
          expect(accumulated.previewXpEarned).toBe(initial.previewXpEarned + xpInResults)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('categoriesPlayed contains all unique categories from results', () => {
    fc.assert(
      fc.property(
        initialStatsStrategy,
        fc.array(matchResultStrategy, { minLength: 1, maxLength: 20 }),
        (initial, results) => {
          const accumulated = accumulateStats(initial, results)
          const uniqueCategories = new Set([...initial.categoriesPlayed, ...results.map(r => r.category)])
          expect(accumulated.categoriesPlayed.length).toBe(uniqueCategories.size)
          uniqueCategories.forEach(cat => {
            expect(accumulated.categoriesPlayed).toContain(cat)
          })
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: guest-experience-enhancement, Property 3: Preview XP calculation consistency**
 * 
 * For any match result, the calculated preview XP SHALL be identical
 * whether displayed as in-game preview or in session transfer summary.
 * 
 * **Validates: Requirements 2.3, 8.2**
 */
describe('Property 3: Preview XP calculation consistency', () => {
  it('XP calculation is deterministic - same input always produces same output', () => {
    fc.assert(
      fc.property(
        matchResultStrategy,
        (result) => {
          const xp1 = calculatePreviewXp(result)
          const xp2 = calculatePreviewXp(result)
          expect(xp1).toBe(xp2)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('XP calculation is always non-negative', () => {
    fc.assert(
      fc.property(
        matchResultStrategy,
        (result) => {
          const xp = calculatePreviewXp(result)
          expect(xp).toBeGreaterThanOrEqual(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('XP calculation includes base XP of at least 50', () => {
    fc.assert(
      fc.property(
        matchResultStrategy,
        (result) => {
          const xp = calculatePreviewXp(result)
          expect(xp).toBeGreaterThanOrEqual(50)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('winning a match always gives more XP than losing with same stats', () => {
    fc.assert(
      fc.property(
        matchResultStrategy,
        (result) => {
          const winResult = { ...result, won: true }
          const loseResult = { ...result, won: false }
          const winXp = calculatePreviewXp(winResult)
          const loseXp = calculatePreviewXp(loseResult)
          expect(winXp).toBeGreaterThan(loseXp)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('more kills always gives more or equal XP', () => {
    fc.assert(
      fc.property(
        matchResultStrategy,
        fc.integer({ min: 1, max: 10 }),
        (result, extraKills) => {
          const baseXp = calculatePreviewXp(result)
          const moreKillsResult = { ...result, kills: result.kills + extraKills }
          const moreKillsXp = calculatePreviewXp(moreKillsResult)
          expect(moreKillsXp).toBeGreaterThan(baseXp)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('XP from accumulated stats equals sum of individual match XP', () => {
    fc.assert(
      fc.property(
        fc.array(matchResultStrategy, { minLength: 1, maxLength: 10 }),
        (results) => {
          const sumOfIndividual = results.reduce((sum, r) => sum + calculatePreviewXp(r), 0)
          const initial: GuestSessionStats = {
            sessionId: 'test',
            startedAt: Date.now(),
            lastPlayedAt: Date.now(),
            matchesPlayed: 0,
            matchesWon: 0,
            totalKills: 0,
            totalDeaths: 0,
            questionsAnswered: 0,
            questionsCorrect: 0,
            previewXpEarned: 0,
            milestonesAchieved: [],
            categoriesPlayed: [],
          }
          const accumulated = accumulateStats(initial, results)
          expect(accumulated.previewXpEarned).toBe(sumOfIndividual)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Reset singleton between tests
beforeEach(() => {
  GuestSessionManager.resetInstance()
})


// Import milestone functions for testing
import {
  checkMilestones,
  getNewMilestones,
  calculateMilestoneXpBonus,
  getAllMilestones,
} from '../MilestoneSystem'

/**
 * **Feature: guest-experience-enhancement, Property 5: Milestone detection determinism**
 * 
 * For any guest session state, the set of achieved milestones SHALL be
 * deterministic based solely on the session statistics.
 * 
 * **Validates: Requirements 4.2**
 */
describe('Property 5: Milestone detection determinism', () => {
  it('same stats always produce same milestones', () => {
    fc.assert(
      fc.property(
        initialStatsStrategy,
        (stats) => {
          const milestones1 = checkMilestones(stats)
          const milestones2 = checkMilestones(stats)
          
          // Same length
          expect(milestones1.length).toBe(milestones2.length)
          
          // Same IDs in same order
          const ids1 = milestones1.map(m => m.id)
          const ids2 = milestones2.map(m => m.id)
          expect(ids1).toEqual(ids2)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('milestone detection is pure - no side effects', () => {
    fc.assert(
      fc.property(
        initialStatsStrategy,
        (stats) => {
          const statsCopy = JSON.parse(JSON.stringify(stats))
          checkMilestones(stats)
          
          // Stats should be unchanged
          expect(stats).toEqual(statsCopy)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('more matches played never decreases milestones', () => {
    fc.assert(
      fc.property(
        initialStatsStrategy,
        fc.integer({ min: 1, max: 10 }),
        (stats, extraMatches) => {
          const baseMilestones = checkMilestones(stats)
          const moreStats = {
            ...stats,
            matchesPlayed: stats.matchesPlayed + extraMatches,
          }
          const moreMilestones = checkMilestones(moreStats)
          
          // Should have at least as many milestones
          expect(moreMilestones.length).toBeGreaterThanOrEqual(baseMilestones.length)
          
          // All base milestones should still be achieved
          const baseIds = baseMilestones.map(m => m.id)
          const moreIds = moreMilestones.map(m => m.id)
          baseIds.forEach(id => {
            expect(moreIds).toContain(id)
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  it('getNewMilestones excludes already achieved', () => {
    fc.assert(
      fc.property(
        initialStatsStrategy,
        (stats) => {
          const allAchieved = checkMilestones(stats)
          const achievedIds = allAchieved.map(m => m.id)
          
          // If we pass all achieved IDs, should get empty array
          const newMilestones = getNewMilestones(stats, achievedIds)
          expect(newMilestones.length).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('getNewMilestones returns subset of checkMilestones', () => {
    fc.assert(
      fc.property(
        initialStatsStrategy,
        fc.array(fc.string({ minLength: 3, maxLength: 20 }), { maxLength: 5 }),
        (stats, alreadyAchieved) => {
          const allAchieved = checkMilestones(stats)
          const newMilestones = getNewMilestones(stats, alreadyAchieved)
          
          // All new milestones should be in the full list
          const allIds = allAchieved.map(m => m.id)
          newMilestones.forEach(m => {
            expect(allIds).toContain(m.id)
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  it('milestone XP bonus calculation is consistent', () => {
    fc.assert(
      fc.property(
        initialStatsStrategy,
        (stats) => {
          const milestones = checkMilestones(stats)
          const ids = milestones.map(m => m.id)
          
          const bonus1 = calculateMilestoneXpBonus(ids)
          const bonus2 = calculateMilestoneXpBonus(ids)
          
          expect(bonus1).toBe(bonus2)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('all milestones have positive XP bonus', () => {
    const allMilestones = getAllMilestones()
    allMilestones.forEach(m => {
      expect(m.xpBonus).toBeGreaterThan(0)
    })
  })

  it('all milestones have required fields', () => {
    const allMilestones = getAllMilestones()
    allMilestones.forEach(m => {
      expect(m.id).toBeTruthy()
      expect(m.name).toBeTruthy()
      expect(m.description).toBeTruthy()
      expect(m.icon).toBeTruthy()
      expect(typeof m.xpBonus).toBe('number')
    })
  })
})
