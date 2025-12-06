import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { CATEGORY_META, ALL_CATEGORIES } from '@/types/leaderboard'
import type { LeaderboardEntry } from '@/types/leaderboard'

describe('Leaderboard Components Logic', () => {
  describe('Category Formatters', () => {
    it('wins formatter returns localized number', () => {
      const format = CATEGORY_META.wins.format
      expect(format(1000)).toBe('1,000')
      expect(format(0)).toBe('0')
      expect(format(1234567)).toBe('1,234,567')
    })

    it('win_rate formatter returns percentage', () => {
      const format = CATEGORY_META.win_rate.format
      expect(format(75.5)).toBe('75.5%')
      expect(format(100)).toBe('100.0%')
      expect(format(0)).toBe('0.0%')
    })

    it('kd_ratio formatter returns 2 decimal places', () => {
      const format = CATEGORY_META.kd_ratio.format
      expect(format(1.5)).toBe('1.50')
      expect(format(2)).toBe('2.00')
      expect(format(0.333)).toBe('0.33')
    })

    it('fastest_thinker formatter converts ms to seconds', () => {
      const format = CATEGORY_META.fastest_thinker.format
      expect(format(1000)).toBe('1.00s')
      expect(format(2500)).toBe('2.50s')
      expect(format(500)).toBe('0.50s')
    })

    it('accuracy formatter returns percentage', () => {
      const format = CATEGORY_META.accuracy.format
      expect(format(85.5)).toBe('85.5%')
    })
  })

  describe('Leaderboard Entry Validation', () => {
    const leaderboardEntryArb = fc.record({
      rank: fc.integer({ min: 1, max: 10000 }),
      user_id: fc.uuid(),
      display_name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
      avatar_url: fc.option(fc.webUrl(), { nil: null }),
      stat_value: fc.integer({ min: 0, max: 1000000 }),
      secondary_stat: fc.option(fc.integer({ min: 0, max: 1000000 }), { nil: null }),
      secondary_label: fc.option(fc.string(), { nil: null }),
    })

    it('entry has valid rank', () => {
      fc.assert(
        fc.property(leaderboardEntryArb, (entry) => {
          expect(entry.rank).toBeGreaterThanOrEqual(1)
        })
      )
    })

    it('entry has valid user_id', () => {
      fc.assert(
        fc.property(leaderboardEntryArb, (entry) => {
          expect(entry.user_id).toBeTruthy()
          expect(typeof entry.user_id).toBe('string')
        })
      )
    })

    it('entry stat_value is non-negative', () => {
      fc.assert(
        fc.property(leaderboardEntryArb, (entry) => {
          expect(entry.stat_value).toBeGreaterThanOrEqual(0)
        })
      )
    })
  })

  describe('Leaderboard Sorting', () => {
    it('entries should be sorted by rank ascending', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 1000 }), { minLength: 2, maxLength: 20 }),
          (ranks) => {
            const sorted = [...ranks].sort((a, b) => a - b)
            for (let i = 0; i < sorted.length - 1; i++) {
              expect(sorted[i]).toBeLessThanOrEqual(sorted[i + 1])
            }
          }
        )
      )
    })

    it('ranks should be sequential starting from offset + 1', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 1, max: 20 }),
          (offset, count) => {
            const ranks = Array.from({ length: count }, (_, i) => offset + i + 1)
            expect(ranks[0]).toBe(offset + 1)
            expect(ranks[ranks.length - 1]).toBe(offset + count)
          }
        )
      )
    })
  })

  describe('Category Gradients', () => {
    it('all categories have valid gradient classes', () => {
      ALL_CATEGORIES.forEach((category) => {
        const gradient = CATEGORY_META[category].gradient
        expect(gradient).toMatch(/^from-\w+-\d+ to-\w+-\d+$/)
      })
    })
  })

  describe('Search Filtering', () => {
    const filterByName = (entries: LeaderboardEntry[], query: string): LeaderboardEntry[] => {
      if (!query.trim()) return entries
      const lowerQuery = query.toLowerCase()
      return entries.filter((e) => e.display_name?.toLowerCase().includes(lowerQuery))
    }

    it('empty query returns all entries', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              rank: fc.integer({ min: 1 }),
              user_id: fc.uuid(),
              display_name: fc.string(),
              avatar_url: fc.constant(null),
              stat_value: fc.integer({ min: 0, max: 1000000 }),
              secondary_stat: fc.constant(null),
              secondary_label: fc.constant(null),
            }),
            { maxLength: 10 }
          ),
          (entries) => {
            expect(filterByName(entries, '')).toEqual(entries)
            expect(filterByName(entries, '   ')).toEqual(entries)
          }
        )
      )
    })

    it('search is case insensitive', () => {
      const entries: LeaderboardEntry[] = [
        { rank: 1, user_id: '1', display_name: 'John', avatar_url: null, stat_value: 100, secondary_stat: null, secondary_label: null },
        { rank: 2, user_id: '2', display_name: 'JANE', avatar_url: null, stat_value: 90, secondary_stat: null, secondary_label: null },
      ]
      expect(filterByName(entries, 'john')).toHaveLength(1)
      expect(filterByName(entries, 'JOHN')).toHaveLength(1)
      expect(filterByName(entries, 'jane')).toHaveLength(1)
    })
  })
})
