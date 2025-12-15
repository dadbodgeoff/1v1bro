/**
 * Property-based tests for ScreenShakeSystem
 * Feature: enterprise-juice-feedback
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { ScreenShakeSystem } from './ScreenShakeSystem'

describe('ScreenShakeSystem', () => {
  let shakeSystem: ScreenShakeSystem

  beforeEach(() => {
    shakeSystem = new ScreenShakeSystem()
  })

  /**
   * **Feature: enterprise-juice-feedback, Property 1: Trauma decay is exponential**
   * For any trauma value T > 0, after time t seconds, trauma decreases exponentially.
   */
  it('Property 1: Trauma decay is exponential', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 100 }).map(n => n / 100),  // Initial trauma 0.1-1.0
        fc.integer({ min: 10, max: 200 }).map(n => n / 100),  // Time delta 0.1-2.0
        (initialTrauma, timeDelta) => {
          shakeSystem.reset()
          shakeSystem.setTrauma(initialTrauma)
          
          const traumaBefore = shakeSystem.getTrauma()
          shakeSystem.update(timeDelta)
          const traumaAfter = shakeSystem.getTrauma()
          
          // Trauma should decrease
          expect(traumaAfter).toBeLessThan(traumaBefore)
          
          // Verify exponential decay: T_after ≈ T_before * e^(-decay * delta)
          // With decay = 2.0
          const expectedTrauma = traumaBefore * Math.exp(-2.0 * timeDelta)
          
          // Allow small tolerance for floating point
          if (expectedTrauma > 0.001) {
            expect(traumaAfter).toBeCloseTo(expectedTrauma, 3)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: enterprise-juice-feedback, Property 2: Shake intensity uses quadratic falloff**
   * For any trauma value T, the shake intensity equals T².
   */
  it('Property 2: Shake intensity uses quadratic falloff', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }).map(n => n / 100),  // Trauma value 0.01-1.0
        (trauma) => {
          shakeSystem.reset()
          shakeSystem.setTrauma(trauma)
          
          // Update to get noise values
          shakeSystem.update(0.016)
          
          const offset = shakeSystem.getOffset()
          const maxOffset = 0.5  // Default config
          const maxRotation = 0.03
          
          // The offset magnitude should be bounded by trauma² * maxOffset
          const expectedMaxMagnitude = trauma * trauma * maxOffset
          const expectedMaxRotation = trauma * trauma * maxRotation
          
          expect(Math.abs(offset.x)).toBeLessThanOrEqual(expectedMaxMagnitude + 0.001)
          expect(Math.abs(offset.y)).toBeLessThanOrEqual(expectedMaxMagnitude + 0.001)
          expect(Math.abs(offset.rotation)).toBeLessThanOrEqual(expectedMaxRotation + 0.001)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: enterprise-juice-feedback, Property 3: Trauma is capped at 1.0**
   * For any sequence of addTrauma() calls, the resulting trauma never exceeds 1.0.
   */
  it('Property 3: Trauma is capped at 1.0', () => {
    fc.assert(
      fc.property(
        fc.array(fc.float({ min: 0, max: 2.0, noNaN: true }), { minLength: 1, maxLength: 20 }),
        (traumaValues) => {
          shakeSystem.reset()
          
          for (const trauma of traumaValues) {
            shakeSystem.addTrauma(trauma)
            expect(shakeSystem.getTrauma()).toBeLessThanOrEqual(1.0)
          }
          
          // Final trauma should still be capped
          expect(shakeSystem.getTrauma()).toBeLessThanOrEqual(1.0)
        }
      ),
      { numRuns: 100 }
    )
  })

  // Unit tests for basic functionality
  describe('Unit Tests', () => {
    it('should start with zero trauma', () => {
      expect(shakeSystem.getTrauma()).toBe(0)
    })

    it('should return zero offset when no trauma', () => {
      const offset = shakeSystem.getOffset()
      expect(offset.x).toBe(0)
      expect(offset.y).toBe(0)
      expect(offset.rotation).toBe(0)
    })

    it('should add trauma correctly', () => {
      shakeSystem.addTrauma(0.5)
      expect(shakeSystem.getTrauma()).toBe(0.5)
    })

    it('should cap trauma at 1.0', () => {
      shakeSystem.addTrauma(0.8)
      shakeSystem.addTrauma(0.5)
      expect(shakeSystem.getTrauma()).toBe(1.0)
    })

    it('should decay trauma over time', () => {
      shakeSystem.addTrauma(1.0)
      shakeSystem.update(0.5)
      expect(shakeSystem.getTrauma()).toBeLessThan(1.0)
    })

    it('should snap to zero when trauma is very small', () => {
      shakeSystem.addTrauma(0.01)
      shakeSystem.update(5.0)  // Long time to ensure decay
      expect(shakeSystem.getTrauma()).toBe(0)
    })

    it('should reset correctly', () => {
      shakeSystem.addTrauma(0.8)
      shakeSystem.update(0.1)
      shakeSystem.reset()
      expect(shakeSystem.getTrauma()).toBe(0)
      expect(shakeSystem.isActive()).toBe(false)
    })

    it('should report active state correctly', () => {
      expect(shakeSystem.isActive()).toBe(false)
      shakeSystem.addTrauma(0.5)
      expect(shakeSystem.isActive()).toBe(true)
    })
  })
})
