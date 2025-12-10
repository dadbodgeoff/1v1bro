/**
 * Property-based tests for fluid typography.
 *
 * Tests correctness properties for typography scaling,
 * minimum sizes, and line height calculations.
 *
 * **Feature: mobile-optimization**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  fluidFontSize,
  getFluidFontSize,
  getHeadingFontSize,
  getResponsiveLineHeight,
  getHeadingLineHeight,
  meetsMinimumBodySize,
  computeFluidFontSize,
  computeHeadingFontSize,
  FONT_SIZES,
  HEADING_SIZES,
  LINE_HEIGHTS,
  MIN_BODY_TEXT_SIZE,
  type FontSizeKey,
  type HeadingLevel,
} from '../typography'
import { BREAKPOINTS } from '../breakpoints'

// ============================================
// Property 4: Typography minimum size on mobile
// ============================================

describe('Property 4: Typography minimum size on mobile', () => {
  /**
   * **Feature: mobile-optimization, Property 4: Typography minimum size on mobile**
   *
   * For any text element rendered on mobile devices, body text SHALL have
   * a minimum computed font size of 16px to ensure readability and prevent
   * iOS auto-zoom on input focus.
   *
   * **Validates: Requirements 4.2**
   */

  it('should have minimum body text size of 16px', () => {
    expect(MIN_BODY_TEXT_SIZE).toBe(16)
  })

  it('should correctly validate minimum body size', () => {
    expect(meetsMinimumBodySize(16)).toBe(true)
    expect(meetsMinimumBodySize(18)).toBe(true)
    expect(meetsMinimumBodySize(14)).toBe(false)
    expect(meetsMinimumBodySize(12)).toBe(false)
  })

  it('property: base font size is always >= 16px', () => {
    const { min, max } = FONT_SIZES.base

    expect(min).toBeGreaterThanOrEqual(MIN_BODY_TEXT_SIZE)
    expect(max).toBeGreaterThanOrEqual(MIN_BODY_TEXT_SIZE)
  })

  it('property: computed body text size is always >= 16px at any viewport', () => {
    fc.assert(
      fc.property(fc.integer({ min: 320, max: 1920 }), (viewportWidth) => {
        const { min, max } = FONT_SIZES.base
        const computedSize = computeFluidFontSize(min, max, viewportWidth)

        return computedSize >= MIN_BODY_TEXT_SIZE
      }),
      { numRuns: 100 }
    )
  })

  it('property: meetsMinimumBodySize correctly validates any font size', () => {
    fc.assert(
      fc.property(fc.integer({ min: 8, max: 72 }), (fontSize) => {
        const meets = meetsMinimumBodySize(fontSize)
        const expected = fontSize >= MIN_BODY_TEXT_SIZE

        return meets === expected
      }),
      { numRuns: 100 }
    )
  })
})

// ============================================
// Property 5: Fluid typography scaling
// ============================================

describe('Property 5: Fluid typography scaling', () => {
  /**
   * **Feature: mobile-optimization, Property 5: Fluid typography scaling**
   *
   * For any heading element, the computed font size SHALL fall within
   * the defined minimum (mobile) and maximum (desktop) bounds, scaling
   * smoothly between breakpoints using clamp().
   *
   * **Validates: Requirements 4.1**
   */

  it('should generate valid clamp() CSS for fluid font sizes', () => {
    const result = fluidFontSize(16, 24)

    expect(result).toContain('clamp(')
    expect(result).toContain('16px')
    expect(result).toContain('24px')
  })

  it('should return fixed size when min equals max', () => {
    const result = fluidFontSize(16, 16)

    expect(result).toBe('16px')
    expect(result).not.toContain('clamp')
  })

  it('property: computed font size is always within min/max bounds', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 12, max: 24 }), // minSize
        fc.integer({ min: 24, max: 72 }), // maxSize
        fc.integer({ min: 320, max: 1920 }), // viewportWidth
        (minSize, maxSize, viewportWidth) => {
          // Ensure min <= max
          const actualMin = Math.min(minSize, maxSize)
          const actualMax = Math.max(minSize, maxSize)

          const computedSize = computeFluidFontSize(
            actualMin,
            actualMax,
            viewportWidth
          )

          return computedSize >= actualMin && computedSize <= actualMax
        }
      ),
      { numRuns: 100 }
    )
  })

  it('property: font size equals min at minimum viewport', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 12, max: 24 }),
        fc.integer({ min: 24, max: 72 }),
        (minSize, maxSize) => {
          const actualMin = Math.min(minSize, maxSize)
          const actualMax = Math.max(minSize, maxSize)

          const computedSize = computeFluidFontSize(actualMin, actualMax, 320)

          return computedSize === actualMin
        }
      ),
      { numRuns: 50 }
    )
  })

  it('property: font size equals max at maximum viewport', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 12, max: 24 }),
        fc.integer({ min: 24, max: 72 }),
        (minSize, maxSize) => {
          const actualMin = Math.min(minSize, maxSize)
          const actualMax = Math.max(minSize, maxSize)

          const computedSize = computeFluidFontSize(
            actualMin,
            actualMax,
            BREAKPOINTS.desktop
          )

          return computedSize === actualMax
        }
      ),
      { numRuns: 50 }
    )
  })

  it('property: font size increases monotonically with viewport width', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 12, max: 24 }),
        fc.integer({ min: 24, max: 72 }),
        fc.integer({ min: 320, max: 1000 }),
        fc.integer({ min: 1001, max: 1440 }),
        (minSize, maxSize, smallerVw, largerVw) => {
          const actualMin = Math.min(minSize, maxSize)
          const actualMax = Math.max(minSize, maxSize)

          const smallerSize = computeFluidFontSize(actualMin, actualMax, smallerVw)
          const largerSize = computeFluidFontSize(actualMin, actualMax, largerVw)

          return largerSize >= smallerSize
        }
      ),
      { numRuns: 50 }
    )
  })
})

// ============================================
// Heading Font Size Tests
// ============================================

describe('Heading font sizes', () => {
  const headingLevels: HeadingLevel[] = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']

  it('should have all heading levels defined', () => {
    for (const level of headingLevels) {
      expect(HEADING_SIZES[level]).toBeDefined()
      expect(HEADING_SIZES[level].min).toBeGreaterThan(0)
      expect(HEADING_SIZES[level].max).toBeGreaterThan(0)
    }
  })

  it('property: heading sizes decrease from h1 to h6', () => {
    for (let i = 0; i < headingLevels.length - 1; i++) {
      const current = HEADING_SIZES[headingLevels[i]]
      const next = HEADING_SIZES[headingLevels[i + 1]]

      expect(current.max).toBeGreaterThanOrEqual(next.max)
      expect(current.min).toBeGreaterThanOrEqual(next.min)
    }
  })

  it('property: all heading computed sizes are within bounds at any viewport', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...headingLevels),
        fc.integer({ min: 320, max: 1920 }),
        (level, viewportWidth) => {
          const { min, max } = HEADING_SIZES[level]
          const computedSize = computeHeadingFontSize(level, viewportWidth)

          return computedSize >= min && computedSize <= max
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should generate valid CSS for heading font sizes', () => {
    for (const level of headingLevels) {
      const css = getHeadingFontSize(level)

      // Should be either a fixed size or clamp()
      expect(css).toMatch(/^\d+px$|^clamp\(/)
    }
  })
})

// ============================================
// Line Height Tests
// ============================================

describe('Line height calculations', () => {
  it('should have all line height values defined', () => {
    expect(LINE_HEIGHTS.none).toBe(1)
    expect(LINE_HEIGHTS.tight).toBe(1.25)
    expect(LINE_HEIGHTS.snug).toBe(1.375)
    expect(LINE_HEIGHTS.normal).toBe(1.5)
    expect(LINE_HEIGHTS.relaxed).toBe(1.625)
    expect(LINE_HEIGHTS.loose).toBe(1.75)
  })

  it('should return appropriate line height for different font sizes', () => {
    // Large text gets tighter line height
    expect(getResponsiveLineHeight(48)).toBe(LINE_HEIGHTS.tight)

    // Medium text gets snug line height
    expect(getResponsiveLineHeight(28)).toBe(LINE_HEIGHTS.snug)

    // Normal text gets normal line height
    expect(getResponsiveLineHeight(20)).toBe(LINE_HEIGHTS.normal)

    // Small text gets relaxed line height
    expect(getResponsiveLineHeight(14)).toBe(LINE_HEIGHTS.relaxed)
  })

  it('property: mobile line height is always >= desktop line height', () => {
    fc.assert(
      fc.property(fc.integer({ min: 12, max: 72 }), (fontSize) => {
        const desktopLineHeight = getResponsiveLineHeight(fontSize, false)
        const mobileLineHeight = getResponsiveLineHeight(fontSize, true)

        return mobileLineHeight >= desktopLineHeight
      }),
      { numRuns: 50 }
    )
  })

  it('property: line height is always between 1 and 2', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 12, max: 72 }),
        fc.boolean(),
        (fontSize, isMobile) => {
          const lineHeight = getResponsiveLineHeight(fontSize, isMobile)

          return lineHeight >= 1 && lineHeight <= 2
        }
      ),
      { numRuns: 100 }
    )
  })

  it('property: heading line heights are appropriate for each level', () => {
    const headingLevels: HeadingLevel[] = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']

    fc.assert(
      fc.property(
        fc.constantFrom(...headingLevels),
        fc.boolean(),
        (level, isMobile) => {
          const lineHeight = getHeadingLineHeight(level, isMobile)

          // Line height should be reasonable for headings
          return lineHeight >= 1.2 && lineHeight <= 1.9
        }
      ),
      { numRuns: 50 }
    )
  })
})

// ============================================
// Font Size Scale Tests
// ============================================

describe('Font size scale', () => {
  const fontSizeKeys: FontSizeKey[] = [
    'xs',
    'sm',
    'base',
    'lg',
    'xl',
    '2xl',
    '3xl',
    '4xl',
    '5xl',
    '6xl',
  ]

  it('should have all font size keys defined', () => {
    for (const key of fontSizeKeys) {
      expect(FONT_SIZES[key]).toBeDefined()
      expect(FONT_SIZES[key].min).toBeGreaterThan(0)
      expect(FONT_SIZES[key].max).toBeGreaterThan(0)
    }
  })

  it('property: font sizes increase from xs to 6xl', () => {
    for (let i = 0; i < fontSizeKeys.length - 1; i++) {
      const current = FONT_SIZES[fontSizeKeys[i]]
      const next = FONT_SIZES[fontSizeKeys[i + 1]]

      expect(next.max).toBeGreaterThanOrEqual(current.max)
    }
  })

  it('should generate valid CSS for all font size keys', () => {
    for (const key of fontSizeKeys) {
      const css = getFluidFontSize(key)

      // Should be either a fixed size or clamp()
      expect(css).toMatch(/^\d+px$|^clamp\(/)
    }
  })
})
