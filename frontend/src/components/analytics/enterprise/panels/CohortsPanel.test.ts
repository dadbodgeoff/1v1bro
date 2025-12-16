/**
 * CohortsPanel Property Tests
 * 
 * Property 8: Cohort retention percentages are bounded (0-100%)
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { isValidRetentionPercentage, validateCohortRetention } from './CohortsPanel'

describe('CohortsPanel Properties', () => {
  describe('Property 8: Cohort retention percentages are bounded', () => {
    it('valid retention percentages are between 0 and 100', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 100, noNaN: true }),
          (value) => {
            expect(isValidRetentionPercentage(value)).toBe(true)
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('null and undefined values are considered valid', () => {
      expect(isValidRetentionPercentage(null)).toBe(true)
      expect(isValidRetentionPercentage(undefined)).toBe(true)
    })

    it('values below 0 are invalid', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(-1000), max: Math.fround(-0.01), noNaN: true }),
          (value) => {
            expect(isValidRetentionPercentage(value)).toBe(false)
            return true
          }
        ),
        { numRuns: 50 }
      )
    })

    it('values above 100 are invalid', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(100.01), max: Math.fround(1000), noNaN: true }),
          (value) => {
            expect(isValidRetentionPercentage(value)).toBe(false)
            return true
          }
        ),
        { numRuns: 50 }
      )
    })

    it('validates complete cohort objects', () => {
      fc.assert(
        fc.property(
          fc.record({
            cohort_date: fc.constantFrom('2024-01-01', '2024-06-15', '2024-12-31', '2025-03-01'),
            cohort_size: fc.integer({ min: 1, max: 10000 }),
            day_1_retention: fc.option(fc.float({ min: 0, max: 100, noNaN: true }), { nil: undefined }),
            day_3_retention: fc.option(fc.float({ min: 0, max: 100, noNaN: true }), { nil: undefined }),
            day_7_retention: fc.option(fc.float({ min: 0, max: 100, noNaN: true }), { nil: undefined }),
            day_14_retention: fc.option(fc.float({ min: 0, max: 100, noNaN: true }), { nil: undefined }),
            day_30_retention: fc.option(fc.float({ min: 0, max: 100, noNaN: true }), { nil: undefined }),
            day_60_retention: fc.option(fc.float({ min: 0, max: 100, noNaN: true }), { nil: undefined }),
            day_90_retention: fc.option(fc.float({ min: 0, max: 100, noNaN: true }), { nil: undefined }),
          }),
          (cohort) => {
            expect(validateCohortRetention(cohort)).toBe(true)
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('rejects cohorts with invalid retention values', () => {
      const invalidCohort = {
        cohort_date: '2024-01-01',
        cohort_size: 100,
        day_1_retention: 150, // Invalid: > 100
      }
      expect(validateCohortRetention(invalidCohort)).toBe(false)

      const negativeCohort = {
        cohort_date: '2024-01-01',
        cohort_size: 100,
        day_7_retention: -10, // Invalid: < 0
      }
      expect(validateCohortRetention(negativeCohort)).toBe(false)
    })
  })
})
