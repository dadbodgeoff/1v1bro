/**
 * Practice Store Property-Based Tests
 *
 * Property tests for personal best storage and persistence.
 * Uses fast-check for property-based testing.
 *
 * **Feature: single-player-enhancement**
 */

import fc from 'fast-check'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  checkIsNewPersonalBest,
  serializeRecord,
  deserializeRecord,
  getPersonalBestKey,
  type PersonalBestRecord,
} from '../practiceStore'
import type { DifficultyLevel, PracticeType } from '@/game/bot/BotConfigManager'

// Strategies for generating valid inputs
const difficultyStrategy = fc.constantFrom<DifficultyLevel>(
  'easy',
  'medium',
  'hard'
)
const practiceTypeStrategy = fc.constantFrom<PracticeType>(
  'quiz_only',
  'combat_only',
  'full_game'
)
const categoryStrategy = fc.constantFrom(
  'fortnite',
  'nfl',
  'sports',
  'movies',
  'music'
)

// Strategy for generating valid ISO timestamps
const isoTimestampStrategy = fc
  .integer({ min: 1577836800000, max: 1924905600000 }) // 2020-01-01 to 2030-12-31
  .map((ts) => new Date(ts).toISOString())

// Strategy for generating valid personal best records
const personalBestRecordStrategy = fc.record({
  category: categoryStrategy,
  difficulty: difficultyStrategy,
  practiceType: practiceTypeStrategy,
  score: fc.integer({ min: 0, max: 100000 }),
  accuracy: fc.double({ min: 0, max: 100, noNaN: true }),
  achievedAt: isoTimestampStrategy,
})

/**
 * **Feature: single-player-enhancement, Property 7: Personal best update condition**
 * **Validates: Requirements 4.1**
 *
 * For any new score and existing personal best, the personal best SHALL be updated
 * if and only if the new score is strictly greater than the existing best.
 */
describe('Property 7: Personal best update condition', () => {
  it('updates only when new score is strictly greater', () => {
    fc.assert(
      fc.property(
        personalBestRecordStrategy,
        fc.integer({ min: 0, max: 100000 }),
        (existingRecord, newScore) => {
          const isNewBest = checkIsNewPersonalBest(existingRecord, newScore)
          const shouldBeNewBest = newScore > existingRecord.score

          expect(isNewBest).toBe(shouldBeNewBest)
          return isNewBest === shouldBeNewBest
        }
      ),
      { numRuns: 100 }
    )
  })

  it('returns true when no existing record (first score)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100000 }), (newScore) => {
        const isNewBest = checkIsNewPersonalBest(null, newScore)
        expect(isNewBest).toBe(true)
        return isNewBest === true
      }),
      { numRuns: 100 }
    )
  })

  it('returns false when new score equals existing', () => {
    fc.assert(
      fc.property(personalBestRecordStrategy, (record) => {
        const isNewBest = checkIsNewPersonalBest(record, record.score)
        expect(isNewBest).toBe(false)
        return isNewBest === false
      }),
      { numRuns: 100 }
    )
  })

  it('returns false when new score is less than existing', () => {
    fc.assert(
      fc.property(
        personalBestRecordStrategy,
        fc.integer({ min: 1, max: 1000 }),
        (record, decrease) => {
          const lowerScore = Math.max(0, record.score - decrease)
          if (lowerScore >= record.score) return true // Skip if not actually lower

          const isNewBest = checkIsNewPersonalBest(record, lowerScore)
          expect(isNewBest).toBe(false)
          return isNewBest === false
        }
      ),
      { numRuns: 100 }
    )
  })

  it('returns true when new score is greater than existing', () => {
    fc.assert(
      fc.property(
        personalBestRecordStrategy,
        fc.integer({ min: 1, max: 1000 }),
        (record, increase) => {
          const higherScore = record.score + increase
          const isNewBest = checkIsNewPersonalBest(record, higherScore)
          expect(isNewBest).toBe(true)
          return isNewBest === true
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: single-player-enhancement, Property 8: Guest data persistence round-trip**
 * **Validates: Requirements 4.4**
 *
 * For any personal best record stored by a guest user, reading from localStorage
 * SHALL return an equivalent record.
 */
describe('Property 8: Guest data persistence round-trip', () => {
  it('serialize then deserialize returns equivalent record', () => {
    fc.assert(
      fc.property(personalBestRecordStrategy, (record) => {
        const serialized = serializeRecord(record)
        const deserialized = deserializeRecord(serialized)

        expect(deserialized).not.toBeNull()
        expect(deserialized?.category).toBe(record.category)
        expect(deserialized?.difficulty).toBe(record.difficulty)
        expect(deserialized?.practiceType).toBe(record.practiceType)
        expect(deserialized?.score).toBe(record.score)
        expect(deserialized?.accuracy).toBeCloseTo(record.accuracy, 10)
        expect(deserialized?.achievedAt).toBe(record.achievedAt)

        return (
          deserialized !== null &&
          deserialized.category === record.category &&
          deserialized.difficulty === record.difficulty &&
          deserialized.practiceType === record.practiceType &&
          deserialized.score === record.score
        )
      }),
      { numRuns: 100 }
    )
  })

  it('deserialize returns null for invalid JSON', () => {
    const invalidInputs = [
      'not json',
      '{ invalid }',
      '[]',
      'null',
      '123',
      '"string"',
    ]

    for (const input of invalidInputs) {
      const result = deserializeRecord(input)
      expect(result).toBeNull()
    }
  })

  it('deserialize returns null for missing required fields', () => {
    const incompleteRecords = [
      { category: 'fortnite' }, // missing other fields
      { category: 'fortnite', difficulty: 'easy' }, // missing more fields
      {
        category: 'fortnite',
        difficulty: 'easy',
        practiceType: 'full_game',
        score: 100,
      }, // missing accuracy, achievedAt
    ]

    for (const record of incompleteRecords) {
      const serialized = JSON.stringify(record)
      const result = deserializeRecord(serialized)
      expect(result).toBeNull()
    }
  })

  it('deserialize returns null for wrong field types', () => {
    const wrongTypes = [
      {
        category: 123,
        difficulty: 'easy',
        practiceType: 'full_game',
        score: 100,
        accuracy: 50,
        achievedAt: '2024-01-01',
      },
      {
        category: 'fortnite',
        difficulty: 'easy',
        practiceType: 'full_game',
        score: '100',
        accuracy: 50,
        achievedAt: '2024-01-01',
      },
    ]

    for (const record of wrongTypes) {
      const serialized = JSON.stringify(record)
      const result = deserializeRecord(serialized)
      expect(result).toBeNull()
    }
  })
})

/**
 * Personal best key generation tests
 */
describe('Personal best key generation', () => {
  it('generates unique keys for different combinations', () => {
    fc.assert(
      fc.property(
        categoryStrategy,
        difficultyStrategy,
        practiceTypeStrategy,
        categoryStrategy,
        difficultyStrategy,
        practiceTypeStrategy,
        (cat1, diff1, type1, cat2, diff2, type2) => {
          const key1 = getPersonalBestKey(cat1, diff1, type1)
          const key2 = getPersonalBestKey(cat2, diff2, type2)

          // Keys should be equal only if all components are equal
          const shouldBeEqual =
            cat1 === cat2 && diff1 === diff2 && type1 === type2
          const areEqual = key1 === key2

          expect(areEqual).toBe(shouldBeEqual)
          return areEqual === shouldBeEqual
        }
      ),
      { numRuns: 100 }
    )
  })

  it('key format is category:difficulty:type', () => {
    fc.assert(
      fc.property(
        categoryStrategy,
        difficultyStrategy,
        practiceTypeStrategy,
        (category, difficulty, practiceType) => {
          const key = getPersonalBestKey(category, difficulty, practiceType)
          const expected = `${category}:${difficulty}:${practiceType}`

          expect(key).toBe(expected)
          return key === expected
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * Edge case tests
 */
describe('Edge cases', () => {
  it('handles zero score correctly', () => {
    const record: PersonalBestRecord = {
      category: 'fortnite',
      difficulty: 'easy',
      practiceType: 'full_game',
      score: 0,
      accuracy: 0,
      achievedAt: new Date().toISOString(),
    }

    // Zero is not greater than zero
    expect(checkIsNewPersonalBest(record, 0)).toBe(false)
    // Any positive score beats zero
    expect(checkIsNewPersonalBest(record, 1)).toBe(true)
  })

  it('handles very large scores', () => {
    const record: PersonalBestRecord = {
      category: 'fortnite',
      difficulty: 'hard',
      practiceType: 'full_game',
      score: 999999,
      accuracy: 100,
      achievedAt: new Date().toISOString(),
    }

    expect(checkIsNewPersonalBest(record, 1000000)).toBe(true)
    expect(checkIsNewPersonalBest(record, 999999)).toBe(false)
    expect(checkIsNewPersonalBest(record, 999998)).toBe(false)
  })
})
