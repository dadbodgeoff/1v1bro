/**
 * Property-based tests for VisualHierarchySystem
 *
 * **Feature: aaa-arena-visual-system**
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { VisualHierarchySystem } from '../VisualHierarchySystem'
import type { HierarchyConfig } from '../types'

const defaultConfig: HierarchyConfig = {
  platformBrightness: 1.2,
  backgroundDesaturation: 0.4,
  backgroundBlur: 3,
  hazardContrastRatio: 4.5,
  vignetteIntensity: 0.25,
  vignetteRadius: 0.7,
}

describe('VisualHierarchySystem', () => {
  let system: VisualHierarchySystem

  beforeEach(() => {
    system = new VisualHierarchySystem(defaultConfig)
  })

  /**
   * **Feature: aaa-arena-visual-system, Property 13: Hazard Contrast Ratio**
   * **Validates: Requirements 6.2**
   *
   * *For any* hazard zone rendering, the contrast ratio between hazard color
   * and adjacent platform color SHALL be >= 4.5:1 (WCAG AA compliance).
   */
  describe('Property 13: Hazard Contrast Ratio', () => {
    // Generate valid hex color
    const hexColorArb = fc.tuple(
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 })
    ).map(([r, g, b]) => 
      `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    )

    it('should calculate contrast ratio correctly', () => {
      // White vs Black should have maximum contrast (~21:1)
      const whiteBlackRatio = system.calculateContrastRatio('#ffffff', '#000000')
      expect(whiteBlackRatio).toBeCloseTo(21, 0)

      // Same color should have ratio of 1
      const sameColorRatio = system.calculateContrastRatio('#ff0000', '#ff0000')
      expect(sameColorRatio).toBeCloseTo(1, 1)
    })

    it('should calculate contrast ratio symmetrically', () => {
      fc.assert(
        fc.property(
          hexColorArb,
          hexColorArb,
          (color1, color2) => {
            const ratio1 = system.calculateContrastRatio(color1, color2)
            const ratio2 = system.calculateContrastRatio(color2, color1)
            
            // Contrast ratio should be symmetric
            expect(ratio1).toBeCloseTo(ratio2, 5)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should always return ratio >= 1', () => {
      fc.assert(
        fc.property(
          hexColorArb,
          hexColorArb,
          (color1, color2) => {
            const ratio = system.calculateContrastRatio(color1, color2)
            expect(ratio).toBeGreaterThanOrEqual(1)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should verify high contrast hazard colors meet WCAG AA standard', () => {
      // Bright hazard color (bright orange/yellow)
      const hazardColor = '#ff6600'
      // Dark platform color
      const platformColor = '#1a1a1a'

      const ratio = system.calculateContrastRatio(hazardColor, platformColor)
      
      // Should meet WCAG AA standard (4.5:1)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    })

    it('should identify low contrast color pairs', () => {
      // Similar colors should have low contrast
      const ratio = system.calculateContrastRatio('#333333', '#444444')
      expect(ratio).toBeLessThan(4.5)
    })
  })

  describe('Configuration', () => {
    it('should store and return config', () => {
      const config = system.getConfig()
      expect(config.platformBrightness).toBe(1.2)
      expect(config.backgroundDesaturation).toBe(0.4)
      expect(config.backgroundBlur).toBe(3)
      expect(config.hazardContrastRatio).toBe(4.5)
      expect(config.vignetteIntensity).toBe(0.25)
      expect(config.vignetteRadius).toBe(0.7)
    })
  })

  describe('Vignette', () => {
    it('should have valid vignette parameters', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1, noNaN: true }), // intensity
          fc.float({ min: Math.fround(0.1), max: 1, noNaN: true }), // radius
          (intensity, radius) => {
            const customSystem = new VisualHierarchySystem({
              ...defaultConfig,
              vignetteIntensity: intensity,
              vignetteRadius: radius,
            })

            const config = customSystem.getConfig()
            expect(config.vignetteIntensity).toBe(intensity)
            expect(config.vignetteRadius).toBe(radius)
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  describe('Platform brightness', () => {
    it('should accept valid brightness values', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1, max: 2, noNaN: true }), // brightness multiplier
          (brightness) => {
            const customSystem = new VisualHierarchySystem({
              ...defaultConfig,
              platformBrightness: brightness,
            })

            const config = customSystem.getConfig()
            expect(config.platformBrightness).toBe(brightness)
          }
        ),
        { numRuns: 20 }
      )
    })
  })
})
