/**
 * Property-based tests for MetricCard
 * 
 * **Feature: unified-analytics-dashboard, Property 11: Metric card displays all required fields**
 * **Validates: Requirements 10.4**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { calculateTrendPercentage, getTrendDirection } from './MetricCard'

describe('MetricCard - Property Tests', () => {
  /**
   * Property 11: Metric card displays all required fields
   * 
   * *For any* MetricCard component, it SHALL render value, label, and trend indicator 
   * (when previousValue is provided).
   * 
   * We test the underlying calculation functions that power the trend indicator.
   * 
   * **Validates: Requirements 10.4**
   */
  describe('calculateTrendPercentage', () => {
    it('Property 11a: returns correct percentage change for valid numeric inputs', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000000 }), // current value (positive)
          fc.integer({ min: 1, max: 1000000 }), // previous value (positive, non-zero)
          (current, previous) => {
            const result = calculateTrendPercentage(current, previous)
            
            // Result should be a number
            expect(result).not.toBeNull()
            expect(typeof result).toBe('number')
            
            // Verify the calculation is correct
            const expected = ((current - previous) / Math.abs(previous)) * 100
            expect(result).toBeCloseTo(expected, 5)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('Property 11b: returns null when previousValue is undefined', () => {
      fc.assert(
        fc.property(
          fc.oneof(fc.integer(), fc.constant(null), fc.constant(undefined)),
          (current) => {
            const result = calculateTrendPercentage(current, undefined)
            expect(result).toBeNull()
            return true
          }
        ),
        { numRuns: 50 }
      )
    })

    it('Property 11c: returns null when currentValue is null or undefined', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          (previous) => {
            expect(calculateTrendPercentage(null, previous)).toBeNull()
            expect(calculateTrendPercentage(undefined, previous)).toBeNull()
            return true
          }
        ),
        { numRuns: 50 }
      )
    })

    it('Property 11d: returns null when currentValue is a string', () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.integer({ min: 1, max: 1000 }),
          (current, previous) => {
            const result = calculateTrendPercentage(current, previous)
            expect(result).toBeNull()
            return true
          }
        ),
        { numRuns: 50 }
      )
    })

    it('Property 11e: handles zero previousValue gracefully', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          (current) => {
            const result = calculateTrendPercentage(current, 0)
            
            // Should not throw, should return a bounded value
            expect(result).not.toBeNull()
            if (current > 0) {
              expect(result).toBe(100) // Capped at 100%
            } else {
              expect(result).toBe(0)
            }
            
            return true
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  describe('getTrendDirection', () => {
    it('Property 11f: returns correct direction based on change value', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -1000, max: 1000, noNaN: true }),
          (change) => {
            const result = getTrendDirection(change)
            
            // Result should be one of the valid directions
            expect(['up', 'down', 'neutral']).toContain(result)
            
            // Verify direction logic
            if (Math.abs(change) < 0.1) {
              expect(result).toBe('neutral')
            } else if (change > 0) {
              expect(result).toBe('up')
            } else {
              expect(result).toBe('down')
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('Property 11g: returns neutral for null change', () => {
      const result = getTrendDirection(null)
      expect(result).toBe('neutral')
    })

    it('Property 11h: small changes (< 0.1%) are treated as neutral', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -0.09, max: 0.09, noNaN: true }),
          (change) => {
            const result = getTrendDirection(change)
            expect(result).toBe('neutral')
            return true
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  describe('Trend calculation integration', () => {
    it('Property 11i: trend direction matches sign of calculated percentage', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 1, max: 10000 }),
          (current, previous) => {
            const percentage = calculateTrendPercentage(current, previous)
            const direction = getTrendDirection(percentage)
            
            if (percentage !== null) {
              if (current > previous && Math.abs(percentage) >= 0.1) {
                expect(direction).toBe('up')
              } else if (current < previous && Math.abs(percentage) >= 0.1) {
                expect(direction).toBe('down')
              } else if (Math.abs(percentage) < 0.1) {
                expect(direction).toBe('neutral')
              }
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
