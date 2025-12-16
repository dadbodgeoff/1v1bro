/**
 * SurvivalPanel Property Tests
 * 
 * Property 10: Survival funnel is monotonically decreasing
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { isFunnelMonotonicallyDecreasing, findFunnelViolation } from './SurvivalPanel'

describe('SurvivalPanel Properties', () => {
  describe('Property 10: Survival funnel is monotonically decreasing', () => {
    it('valid monotonically decreasing funnels pass validation', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          fc.integer({ min: 100, max: 10000 }),
          (numSteps, startCount) => {
            // Generate a monotonically decreasing funnel
            const steps = Array.from({ length: numSteps }, (_, i) => ({
              step: `step_${i}`,
              count: Math.floor(startCount * Math.pow(0.7, i)), // Each step is ~70% of previous
            }))
            
            expect(isFunnelMonotonicallyDecreasing(steps)).toBe(true)
            return true
          }
        ),
        { numRuns: 50 }
      )
    })

    it('funnels with increasing steps fail validation', () => {
      const invalidFunnel = [
        { step: 'visit', count: 1000 },
        { step: 'load', count: 800 },
        { step: 'play', count: 900 }, // Invalid: increased from 800
        { step: 'complete', count: 500 },
      ]
      
      expect(isFunnelMonotonicallyDecreasing(invalidFunnel)).toBe(false)
    })

    it('empty funnel is valid', () => {
      expect(isFunnelMonotonicallyDecreasing([])).toBe(true)
    })

    it('single step funnel is valid', () => {
      expect(isFunnelMonotonicallyDecreasing([{ count: 100 }])).toBe(true)
    })

    it('funnel with equal consecutive steps is valid', () => {
      const equalSteps = [
        { count: 100 },
        { count: 100 },
        { count: 50 },
        { count: 50 },
      ]
      expect(isFunnelMonotonicallyDecreasing(equalSteps)).toBe(true)
    })

    it('findFunnelViolation returns null for valid funnels', () => {
      const validFunnel = [
        { step: 'visit', count: 1000 },
        { step: 'load', count: 800 },
        { step: 'play', count: 600 },
        { step: 'complete', count: 400 },
      ]
      
      expect(findFunnelViolation(validFunnel)).toBeNull()
    })

    it('findFunnelViolation identifies the violating step', () => {
      const invalidFunnel = [
        { step: 'visit', count: 1000 },
        { step: 'load', count: 800 },
        { step: 'play', count: 900 }, // Violation here
        { step: 'complete', count: 500 },
      ]
      
      const violation = findFunnelViolation(invalidFunnel)
      expect(violation).not.toBeNull()
      expect(violation?.step).toBe('play')
      expect(violation?.previousCount).toBe(800)
      expect(violation?.currentCount).toBe(900)
    })

    it('typical player progression funnel is monotonically decreasing', () => {
      // Real-world example: page visit → game load → first run → milestones
      const typicalFunnel = [
        { step: 'page_visit', count: 10000 },
        { step: 'game_load', count: 7500 },
        { step: 'first_run', count: 5000 },
        { step: 'reach_100m', count: 3000 },
        { step: 'reach_500m', count: 1500 },
        { step: 'reach_1000m', count: 500 },
      ]
      
      expect(isFunnelMonotonicallyDecreasing(typicalFunnel)).toBe(true)
    })

    it('property: any valid funnel has no violations', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.integer({ min: 0, max: 10000 }),
            { minLength: 2, maxLength: 10 }
          ),
          (counts) => {
            // Sort descending to create valid funnel
            const sortedCounts = [...counts].sort((a, b) => b - a)
            const steps = sortedCounts.map((count, i) => ({
              step: `step_${i}`,
              count,
            }))
            
            expect(isFunnelMonotonicallyDecreasing(steps)).toBe(true)
            expect(findFunnelViolation(steps)).toBeNull()
            return true
          }
        ),
        { numRuns: 50 }
      )
    })
  })
})
