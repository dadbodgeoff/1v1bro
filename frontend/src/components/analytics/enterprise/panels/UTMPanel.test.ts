/**
 * UTMPanel Property Tests
 * 
 * Property 16: Campaign conversion rate calculation
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { calculateConversionRate, calculateTrendPercentage } from './UTMPanel'

describe('UTMPanel Properties', () => {
  describe('Property 16: Campaign conversion rate calculation', () => {
    it('conversion rate equals (conversions / visitors) * 100', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }),
          fc.integer({ min: 1, max: 10000 }),
          (conversions, visitors) => {
            const rate = calculateConversionRate(conversions, visitors)
            const expected = (conversions / visitors) * 100
            expect(Math.abs(rate - expected)).toBeLessThan(0.0001)
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('conversion rate is 0 when visitors is 0', () => {
      expect(calculateConversionRate(100, 0)).toBe(0)
      expect(calculateConversionRate(0, 0)).toBe(0)
    })

    it('conversion rate is 0 when visitors is negative', () => {
      expect(calculateConversionRate(100, -10)).toBe(0)
    })

    it('conversion rate is bounded between 0 and 100 for valid inputs', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 1, max: 1000 }),
          (conversions, visitors) => {
            // Ensure conversions <= visitors for realistic scenario
            const actualConversions = Math.min(conversions, visitors)
            const rate = calculateConversionRate(actualConversions, visitors)
            expect(rate).toBeGreaterThanOrEqual(0)
            expect(rate).toBeLessThanOrEqual(100)
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('100% conversion rate when all visitors convert', () => {
      expect(calculateConversionRate(100, 100)).toBe(100)
      expect(calculateConversionRate(1, 1)).toBe(100)
    })

    it('0% conversion rate when no visitors convert', () => {
      expect(calculateConversionRate(0, 100)).toBe(0)
      expect(calculateConversionRate(0, 1)).toBe(0)
    })
  })

  describe('Trend percentage calculation', () => {
    it('calculates positive trend correctly', () => {
      expect(calculateTrendPercentage(150, 100)).toBe(50)
      expect(calculateTrendPercentage(200, 100)).toBe(100)
    })

    it('calculates negative trend correctly', () => {
      expect(calculateTrendPercentage(50, 100)).toBe(-50)
      expect(calculateTrendPercentage(75, 100)).toBe(-25)
    })

    it('returns null when previous is 0 and current is 0', () => {
      expect(calculateTrendPercentage(0, 0)).toBeNull()
    })

    it('returns 100 when previous is 0 and current is positive', () => {
      expect(calculateTrendPercentage(100, 0)).toBe(100)
    })

    it('property: trend calculation is consistent', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 1, max: 10000 }),
          (current, previous) => {
            const trend = calculateTrendPercentage(current, previous)
            const expected = ((current - previous) / previous) * 100
            expect(trend).not.toBeNull()
            expect(Math.abs(trend! - expected)).toBeLessThan(0.0001)
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
