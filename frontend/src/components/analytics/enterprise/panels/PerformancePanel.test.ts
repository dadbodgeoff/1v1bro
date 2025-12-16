/**
 * PerformancePanel Property Tests
 * 
 * Property 14: Web Vitals grading follows thresholds
 * Property 15: Percentile ordering (p75 <= p95)
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { 
  getWebVitalGrade, 
  validatePercentileOrdering, 
  WEB_VITALS_THRESHOLDS,
  type VitalGrade 
} from './PerformancePanel'

describe('PerformancePanel Properties', () => {
  describe('Property 14: Web Vitals grading follows thresholds', () => {
    it('LCP grading follows standard thresholds', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(null),
            fc.float({ min: 0, max: 10000, noNaN: true })
          ),
          (value) => {
            const grade = getWebVitalGrade('lcp', value)
            
            if (value === null) {
              expect(grade).toBe('N/A')
            } else if (value <= WEB_VITALS_THRESHOLDS.lcp.good) {
              expect(grade).toBe('Good')
            } else if (value <= WEB_VITALS_THRESHOLDS.lcp.poor) {
              expect(grade).toBe('Needs Improvement')
            } else {
              expect(grade).toBe('Poor')
            }
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('FID grading follows standard thresholds', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(null),
            fc.float({ min: 0, max: 1000, noNaN: true })
          ),
          (value) => {
            const grade = getWebVitalGrade('fid', value)
            
            if (value === null) {
              expect(grade).toBe('N/A')
            } else if (value <= WEB_VITALS_THRESHOLDS.fid.good) {
              expect(grade).toBe('Good')
            } else if (value <= WEB_VITALS_THRESHOLDS.fid.poor) {
              expect(grade).toBe('Needs Improvement')
            } else {
              expect(grade).toBe('Poor')
            }
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('CLS grading follows standard thresholds', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(null),
            fc.float({ min: 0, max: 1, noNaN: true })
          ),
          (value) => {
            const grade = getWebVitalGrade('cls', value)
            
            if (value === null) {
              expect(grade).toBe('N/A')
            } else if (value <= WEB_VITALS_THRESHOLDS.cls.good) {
              expect(grade).toBe('Good')
            } else if (value <= WEB_VITALS_THRESHOLDS.cls.poor) {
              expect(grade).toBe('Needs Improvement')
            } else {
              expect(grade).toBe('Poor')
            }
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('grade is always one of the valid values', () => {
      const validGrades: VitalGrade[] = ['Good', 'Needs Improvement', 'Poor', 'N/A']
      const metrics = ['lcp', 'fid', 'cls', 'ttfb', 'fcp'] as const
      
      fc.assert(
        fc.property(
          fc.constantFrom(...metrics),
          fc.oneof(fc.constant(null), fc.float({ min: 0, max: 10000, noNaN: true })),
          (metric, value) => {
            const grade = getWebVitalGrade(metric, value)
            expect(validGrades).toContain(grade)
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 15: Percentile ordering', () => {
    it('p75 should be less than or equal to p95', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 10000, noNaN: true }),
          fc.float({ min: 0, max: 10000, noNaN: true }),
          (a, b) => {
            // Ensure p75 <= p95 by sorting
            const p75 = Math.min(a, b)
            const p95 = Math.max(a, b)
            
            const isValid = validatePercentileOrdering(p75, p95)
            expect(isValid).toBe(true)
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('returns true when values are null', () => {
      expect(validatePercentileOrdering(null, null)).toBe(true)
      expect(validatePercentileOrdering(null, 100)).toBe(true)
      expect(validatePercentileOrdering(100, null)).toBe(true)
    })

    it('returns false when p75 > p95', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1, max: 10000, noNaN: true }),
          fc.float({ min: 0, max: 1, noNaN: true }),
          (larger, smaller) => {
            // Ensure p75 > p95 (invalid ordering)
            const p75 = larger + smaller + 1 // Guarantee p75 > p95
            const p95 = smaller
            
            const isValid = validatePercentileOrdering(p75, p95)
            expect(isValid).toBe(false)
            return true
          }
        ),
        { numRuns: 50 }
      )
    })
  })
})
