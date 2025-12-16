/**
 * Property-based tests for analytics utility functions
 * 
 * **Feature: unified-analytics-dashboard**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateDevicePercentages,
  calculateFunnelConversionRate,
  calculateFunnelDropOff,
  calculateCampaignConversionRate,
} from './analyticsUtils'

describe('Analytics Utils - Property Tests', () => {
  /**
   * Property 1: Device breakdown percentages sum to 100%
   * 
   * *For any* device breakdown data (mobile, tablet, desktop), the sum of 
   * percentages SHALL equal 100% (within floating point tolerance of 0.1%).
   * 
   * **Validates: Requirements 1.2**
   */
  describe('calculateDevicePercentages', () => {
    it('Property 1: Device breakdown percentages sum to 100%', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 10000 }), // mobile
          fc.nat({ max: 10000 }), // tablet
          fc.nat({ max: 10000 }), // desktop
          (mobile, tablet, desktop) => {
            const result = calculateDevicePercentages({ mobile, tablet, desktop })
            const total = mobile + tablet + desktop
            
            if (total === 0) {
              // Edge case: all zeros should result in all 0%
              expect(result.mobile).toBe(0)
              expect(result.tablet).toBe(0)
              expect(result.desktop).toBe(0)
            } else {
              // Sum should be exactly 100%
              const sum = result.mobile + result.tablet + result.desktop
              expect(Math.abs(sum - 100)).toBeLessThanOrEqual(0.1)
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('Property 1b: Percentages are non-negative', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 10000 }),
          fc.nat({ max: 10000 }),
          fc.nat({ max: 10000 }),
          (mobile, tablet, desktop) => {
            const result = calculateDevicePercentages({ mobile, tablet, desktop })
            
            expect(result.mobile).toBeGreaterThanOrEqual(0)
            expect(result.tablet).toBeGreaterThanOrEqual(0)
            expect(result.desktop).toBeGreaterThanOrEqual(0)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('Property 1c: Percentages are bounded by 100', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 10000 }),
          fc.nat({ max: 10000 }),
          fc.nat({ max: 10000 }),
          (mobile, tablet, desktop) => {
            const result = calculateDevicePercentages({ mobile, tablet, desktop })
            
            expect(result.mobile).toBeLessThanOrEqual(100)
            expect(result.tablet).toBeLessThanOrEqual(100)
            expect(result.desktop).toBeLessThanOrEqual(100)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 4: Funnel conversion rates are correctly calculated
   * 
   * *For any* funnel step N and step N+1, the conversion rate SHALL equal 
   * (count at step N+1) / (count at step N) * 100.
   * 
   * **Validates: Requirements 3.1**
   */
  describe('calculateFunnelConversionRate', () => {
    it('Property 4: Funnel conversion rate is correctly calculated', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 10000 }), // current count
          fc.integer({ min: 1, max: 10000 }), // previous count (non-zero)
          (current, previous) => {
            const result = calculateFunnelConversionRate(current, previous)
            const expected = (current / previous) * 100
            
            expect(result).toBeCloseTo(expected, 5)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('Property 4b: Zero previous count returns 0%', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 10000 }),
          (current) => {
            const result = calculateFunnelConversionRate(current, 0)
            expect(result).toBe(0)
            return true
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  /**
   * Property 5: Funnel drop-off is inverse of conversion
   * 
   * *For any* funnel step, drop-off percentage SHALL equal 100% minus the 
   * conversion rate to the next step.
   * 
   * **Validates: Requirements 3.2**
   */
  describe('calculateFunnelDropOff', () => {
    it('Property 5: Drop-off is inverse of conversion rate', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 100, noNaN: true }),
          (conversionRate) => {
            const dropOff = calculateFunnelDropOff(conversionRate)
            
            expect(dropOff).toBeCloseTo(100 - conversionRate, 5)
            expect(dropOff + conversionRate).toBeCloseTo(100, 5)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 16: Campaign conversion rate calculation
   * 
   * *For any* UTM campaign, conversion rate SHALL equal (conversions / visitors) * 100.
   * 
   * **Validates: Requirements 14.2**
   */
  describe('calculateCampaignConversionRate', () => {
    it('Property 16: Campaign conversion rate is correctly calculated', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 10000 }), // conversions
          fc.integer({ min: 1, max: 10000 }), // visitors (non-zero)
          (conversions, visitors) => {
            const result = calculateCampaignConversionRate(conversions, visitors)
            const expected = (conversions / visitors) * 100
            
            expect(result).toBeCloseTo(expected, 5)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('Property 16b: Zero visitors returns 0%', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 10000 }),
          (conversions) => {
            const result = calculateCampaignConversionRate(conversions, 0)
            expect(result).toBe(0)
            return true
          }
        ),
        { numRuns: 50 }
      )
    })

    it('Property 16c: Conversion rate is bounded', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 10000 }),
          fc.integer({ min: 1, max: 10000 }),
          (conversions, visitors) => {
            const result = calculateCampaignConversionRate(conversions, visitors)
            
            expect(result).toBeGreaterThanOrEqual(0)
            // Conversion rate can exceed 100% if conversions > visitors (multiple conversions per visitor)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
