/**
 * HeatmapPanel Property Tests
 * 
 * Property 13: Scroll depth milestones are monotonically decreasing
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { 
  areScrollMilestonesMonotonicallyDecreasing, 
  calculateScrollPercentages 
} from './HeatmapPanel'

describe('HeatmapPanel Properties', () => {
  describe('Property 13: Scroll depth milestones are monotonically decreasing', () => {
    it('valid monotonically decreasing milestones pass validation', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }),
          (totalViews) => {
            // Generate monotonically decreasing milestones
            const reached_25_pct = totalViews
            const reached_50_pct = Math.floor(reached_25_pct * 0.8)
            const reached_75_pct = Math.floor(reached_50_pct * 0.7)
            const reached_100_pct = Math.floor(reached_75_pct * 0.5)

            const milestones = {
              reached_25_pct,
              reached_50_pct,
              reached_75_pct,
              reached_100_pct,
            }

            expect(areScrollMilestonesMonotonicallyDecreasing(milestones)).toBe(true)
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('milestones with increasing values fail validation', () => {
      const invalidMilestones = {
        reached_25_pct: 1000,
        reached_50_pct: 800,
        reached_75_pct: 900, // Invalid: increased from 800
        reached_100_pct: 500,
      }

      expect(areScrollMilestonesMonotonicallyDecreasing(invalidMilestones)).toBe(false)
    })

    it('equal consecutive milestones are valid', () => {
      const equalMilestones = {
        reached_25_pct: 1000,
        reached_50_pct: 1000,
        reached_75_pct: 500,
        reached_100_pct: 500,
      }

      expect(areScrollMilestonesMonotonicallyDecreasing(equalMilestones)).toBe(true)
    })

    it('all zeros is valid', () => {
      const zeroMilestones = {
        reached_25_pct: 0,
        reached_50_pct: 0,
        reached_75_pct: 0,
        reached_100_pct: 0,
      }

      expect(areScrollMilestonesMonotonicallyDecreasing(zeroMilestones)).toBe(true)
    })

    it('typical scroll depth pattern is valid', () => {
      // Real-world example: most users scroll to 25%, fewer to 100%
      const typicalMilestones = {
        reached_25_pct: 9500,
        reached_50_pct: 7200,
        reached_75_pct: 4800,
        reached_100_pct: 2100,
      }

      expect(areScrollMilestonesMonotonicallyDecreasing(typicalMilestones)).toBe(true)
    })
  })

  describe('calculateScrollPercentages', () => {
    it('calculates correct percentages', () => {
      const milestones = {
        reached_25_pct: 800,
        reached_50_pct: 600,
        reached_75_pct: 400,
        reached_100_pct: 200,
      }
      const totalViews = 1000

      const percentages = calculateScrollPercentages(milestones, totalViews)

      expect(percentages.pct_25).toBe(80)
      expect(percentages.pct_50).toBe(60)
      expect(percentages.pct_75).toBe(40)
      expect(percentages.pct_100).toBe(20)
    })

    it('returns zeros when totalViews is 0', () => {
      const milestones = {
        reached_25_pct: 100,
        reached_50_pct: 80,
        reached_75_pct: 60,
        reached_100_pct: 40,
      }

      const percentages = calculateScrollPercentages(milestones, 0)

      expect(percentages.pct_25).toBe(0)
      expect(percentages.pct_50).toBe(0)
      expect(percentages.pct_75).toBe(0)
      expect(percentages.pct_100).toBe(0)
    })

    it('returns zeros when totalViews is negative', () => {
      const milestones = {
        reached_25_pct: 100,
        reached_50_pct: 80,
        reached_75_pct: 60,
        reached_100_pct: 40,
      }

      const percentages = calculateScrollPercentages(milestones, -100)

      expect(percentages.pct_25).toBe(0)
      expect(percentages.pct_50).toBe(0)
      expect(percentages.pct_75).toBe(0)
      expect(percentages.pct_100).toBe(0)
    })

    it('property: percentages are bounded 0-100 for valid inputs', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          (totalViews) => {
            // Generate valid milestones (all <= totalViews)
            const milestones = {
              reached_25_pct: Math.floor(totalViews * 0.9),
              reached_50_pct: Math.floor(totalViews * 0.7),
              reached_75_pct: Math.floor(totalViews * 0.5),
              reached_100_pct: Math.floor(totalViews * 0.3),
            }

            const percentages = calculateScrollPercentages(milestones, totalViews)

            expect(percentages.pct_25).toBeGreaterThanOrEqual(0)
            expect(percentages.pct_25).toBeLessThanOrEqual(100)
            expect(percentages.pct_50).toBeGreaterThanOrEqual(0)
            expect(percentages.pct_50).toBeLessThanOrEqual(100)
            expect(percentages.pct_75).toBeGreaterThanOrEqual(0)
            expect(percentages.pct_75).toBeLessThanOrEqual(100)
            expect(percentages.pct_100).toBeGreaterThanOrEqual(0)
            expect(percentages.pct_100).toBeLessThanOrEqual(100)
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('property: calculated percentages maintain monotonic ordering', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          (totalViews) => {
            // Generate monotonically decreasing milestones
            const reached_25_pct = Math.floor(totalViews * 0.9)
            const reached_50_pct = Math.floor(reached_25_pct * 0.8)
            const reached_75_pct = Math.floor(reached_50_pct * 0.7)
            const reached_100_pct = Math.floor(reached_75_pct * 0.6)

            const milestones = {
              reached_25_pct,
              reached_50_pct,
              reached_75_pct,
              reached_100_pct,
            }

            const percentages = calculateScrollPercentages(milestones, totalViews)

            // Percentages should also be monotonically decreasing
            expect(percentages.pct_25).toBeGreaterThanOrEqual(percentages.pct_50)
            expect(percentages.pct_50).toBeGreaterThanOrEqual(percentages.pct_75)
            expect(percentages.pct_75).toBeGreaterThanOrEqual(percentages.pct_100)
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
