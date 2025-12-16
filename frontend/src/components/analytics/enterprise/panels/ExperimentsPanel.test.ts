/**
 * ExperimentsPanel Property Tests
 * 
 * Property 9: Experiment variant weights sum to 100%
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { validateVariantWeights, calculateTotalWeight } from './ExperimentsPanel'

describe('ExperimentsPanel Properties', () => {
  describe('Property 9: Experiment variant weights sum to 100%', () => {
    it('valid variants with weights summing to 100% pass validation', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          (numVariants) => {
            // Generate weights that sum to exactly 100
            const baseWeight = Math.floor(100 / numVariants)
            const remainder = 100 - (baseWeight * numVariants)
            
            const variants = Array.from({ length: numVariants }, (_, i) => ({
              name: `variant_${i}`,
              weight: i === 0 ? baseWeight + remainder : baseWeight,
            }))
            
            expect(validateVariantWeights(variants)).toBe(true)
            return true
          }
        ),
        { numRuns: 50 }
      )
    })

    it('variants with weights not summing to 100% fail validation', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              name: fc.string(),
              weight: fc.float({ min: 0, max: 50, noNaN: true }),
            }),
            { minLength: 2, maxLength: 5 }
          ),
          (variants) => {
            const total = calculateTotalWeight(variants)
            // Only test if total is significantly different from 100
            if (Math.abs(total - 100) > 0.1) {
              expect(validateVariantWeights(variants)).toBe(false)
            }
            return true
          }
        ),
        { numRuns: 50 }
      )
    })

    it('empty variants array fails validation', () => {
      expect(validateVariantWeights([])).toBe(false)
    })

    it('single variant with 100% weight passes validation', () => {
      expect(validateVariantWeights([{ name: 'control', weight: 100 }])).toBe(true)
    })

    it('two variants with 50/50 split passes validation', () => {
      expect(validateVariantWeights([
        { name: 'control', weight: 50 },
        { name: 'treatment', weight: 50 },
      ])).toBe(true)
    })

    it('respects tolerance for floating point errors', () => {
      // 33.33 + 33.33 + 33.34 = 100.00
      expect(validateVariantWeights([
        { name: 'a', weight: 33.33 },
        { name: 'b', weight: 33.33 },
        { name: 'c', weight: 33.34 },
      ])).toBe(true)

      // Slightly off but within tolerance
      expect(validateVariantWeights([
        { name: 'a', weight: 33.3 },
        { name: 'b', weight: 33.3 },
        { name: 'c', weight: 33.3 },
      ], 0.2)).toBe(true)
    })

    it('calculateTotalWeight returns correct sum', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              weight: fc.float({ min: 0, max: 100, noNaN: true }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (variants) => {
            const expected = variants.reduce((sum, v) => sum + v.weight, 0)
            const actual = calculateTotalWeight(variants)
            expect(Math.abs(actual - expected)).toBeLessThan(0.0001)
            return true
          }
        ),
        { numRuns: 50 }
      )
    })

    it('calculateTotalWeight returns 0 for empty array', () => {
      expect(calculateTotalWeight([])).toBe(0)
    })
  })
})
