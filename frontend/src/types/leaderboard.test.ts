import { describe, it, expect } from 'vitest'
import {
  ALL_CATEGORIES,
  CATEGORY_META,
} from './leaderboard'

describe('Leaderboard Types', () => {
  describe('ALL_CATEGORIES', () => {
    it('contains exactly 9 categories', () => {
      expect(ALL_CATEGORIES).toHaveLength(9)
    })

    it('contains all expected categories', () => {
      const expected = [
        'wins', 'win_rate', 'total_score', 'kills', 'kd_ratio',
        'accuracy', 'fastest_thinker', 'answer_rate', 'win_streak',
      ]
      expect(ALL_CATEGORIES).toEqual(expect.arrayContaining(expected))
    })

    it('has no duplicate categories', () => {
      const unique = new Set(ALL_CATEGORIES)
      expect(unique.size).toBe(ALL_CATEGORIES.length)
    })
  })

  describe('CATEGORY_META', () => {
    it('has metadata for all categories', () => {
      ALL_CATEGORIES.forEach((category) => {
        expect(CATEGORY_META[category]).toBeDefined()
      })
    })

    it('each category has required fields', () => {
      ALL_CATEGORIES.forEach((category) => {
        const meta = CATEGORY_META[category]
        expect(meta.id).toBe(category)
        expect(meta.name).toBeTruthy()
        expect(meta.icon).toBeTruthy()
        expect(meta.description).toBeTruthy()
        expect(typeof meta.format).toBe('function')
        expect(meta.gradient).toBeTruthy()
      })
    })
  })
})
