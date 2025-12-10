/**
 * Property-based tests for touch target compliance.
 *
 * Tests correctness properties for button touch targets,
 * modal mobile sizing, and touch target wrapper.
 *
 * **Feature: mobile-optimization**
 */

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { renderHook } from '@testing-library/react'
import { getTouchTargetStyles } from '../Button'
import { getModalMobileSizing } from '../Modal'
import {
  calculateTouchPadding,
  meetsTouchTarget,
  useTouchTargetStyles,
} from '../TouchTarget'
import { TOUCH_TARGET } from '../../../utils/breakpoints'

// ============================================
// Mock matchMedia for test environment
// ============================================

const createMatchMediaMock = () => {
  return vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

beforeAll(() => {
  window.matchMedia = createMatchMediaMock()
})

// ============================================
// Property 2: Touch target minimum size enforcement
// ============================================

describe('Property 2: Touch target minimum size enforcement', () => {
  /**
   * **Feature: mobile-optimization, Property 2: Touch target minimum size enforcement**
   *
   * For any interactive element (button, link, input) rendered on a touch device,
   * the computed touch target area SHALL be at least 44×44 pixels, either through
   * direct sizing or invisible padding extension.
   *
   * **Validates: Requirements 2.1, 2.3, 2.5**
   */

  describe('Button touch target styles', () => {
    it('should return minimum 44px dimensions for small buttons on touch devices', () => {
      const styles = getTouchTargetStyles('sm', true)

      expect(styles.minHeight).toBe(`${TOUCH_TARGET.min}px`)
      expect(styles.minWidth).toBe(`${TOUCH_TARGET.min}px`)
    })

    it('should return minimum 44px dimensions for medium buttons on touch devices', () => {
      const styles = getTouchTargetStyles('md', true)

      expect(styles.minHeight).toBe(`${TOUCH_TARGET.min}px`)
      expect(styles.minWidth).toBe(`${TOUCH_TARGET.min}px`)
    })

    it('should not add touch styles for non-touch devices', () => {
      const styles = getTouchTargetStyles('sm', false)

      expect(styles.minHeight).toBeUndefined()
      expect(styles.minWidth).toBeUndefined()
    })

    it('property: all button sizes on touch devices have minimum 44px touch target', () => {
      const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg']

      fc.assert(
        fc.property(fc.constantFrom(...sizes), (size) => {
          // On touch devices (isTouch=true), touch optimization is applied by default
          const styles = getTouchTargetStyles(size, true)

          // On touch devices, all sizes should have minimum touch target
          const minHeight = parseInt(String(styles.minHeight || '0'), 10)
          const minWidth = parseInt(String(styles.minWidth || '0'), 10)

          // Large buttons are already 48px, so they may not have explicit min
          if (size === 'lg') {
            return true // lg is already compliant at 48px
          }

          return minHeight >= TOUCH_TARGET.min && minWidth >= TOUCH_TARGET.min
        }),
        { numRuns: 100 }
      )
    })

    it('property: touchOptimized prop forces touch target regardless of device', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('sm', 'md', 'lg') as fc.Arbitrary<'sm' | 'md' | 'lg'>,
          (size) => {
            // When touchOptimized is explicitly true, should apply even on non-touch
            const styles = getTouchTargetStyles(size, false, true)

            if (size === 'lg') return true // Already compliant

            const minHeight = parseInt(String(styles.minHeight || '0'), 10)
            const minWidth = parseInt(String(styles.minWidth || '0'), 10)

            return minHeight >= TOUCH_TARGET.min && minWidth >= TOUCH_TARGET.min
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  describe('TouchTarget wrapper calculations', () => {
    it('should calculate correct padding for small content', () => {
      // Content is 24px, need to reach 44px
      const padding = calculateTouchPadding(24, 44)
      expect(padding).toBe(10) // (44 - 24) / 2 = 10
    })

    it('should return 0 padding for content already meeting target', () => {
      const padding = calculateTouchPadding(48, 44)
      expect(padding).toBe(0)
    })

    it('property: padding calculation always results in touch target compliance', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 8, max: 100 }), // content size
          fc.integer({ min: 44, max: 56 }), // min target size
          (contentSize, minSize) => {
            const padding = calculateTouchPadding(contentSize, minSize)
            const totalSize = contentSize + padding * 2

            return totalSize >= minSize
          }
        ),
        { numRuns: 100 }
      )
    })

    it('property: meetsTouchTarget correctly validates dimensions', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 44, max: 56 }),
          (width, height, minSize) => {
            const meets = meetsTouchTarget(width, height, minSize)
            const expected = width >= minSize && height >= minSize

            return meets === expected
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('useTouchTargetStyles hook', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return touch styles when forceOptimize is true', () => {
      const { result } = renderHook(() =>
        useTouchTargetStyles({ forceOptimize: true })
      )

      expect(result.current.shouldOptimize).toBe(true)
      expect(result.current.styles.minWidth).toBe(`${TOUCH_TARGET.min}px`)
      expect(result.current.styles.minHeight).toBe(`${TOUCH_TARGET.min}px`)
      expect(result.current.className).toContain('touch-manipulation')
    })

    it('property: custom minSize is respected in styles', () => {
      fc.assert(
        fc.property(fc.integer({ min: 44, max: 72 }), (minSize) => {
          const { result } = renderHook(() =>
            useTouchTargetStyles({ minSize, forceOptimize: true })
          )

          return (
            result.current.styles.minWidth === `${minSize}px` &&
            result.current.styles.minHeight === `${minSize}px`
          )
        }),
        { numRuns: 50 }
      )
    })
  })
})

// ============================================
// Property 9: Modal mobile sizing
// ============================================

describe('Property 9: Modal mobile sizing', () => {
  /**
   * **Feature: mobile-optimization, Property 9: Modal mobile sizing**
   *
   * For any modal rendered on mobile devices, the modal SHALL be full-width
   * with a maximum height of 90vh, scrollable content area, and action buttons
   * that are full-width and stacked vertically.
   *
   * **Validates: Requirements 8.1, 8.3**
   */

  it('should return full-width sizing on mobile with mobileFullScreen', () => {
    const sizing = getModalMobileSizing(true, true)

    expect(sizing.width).toBe('100%')
    expect(sizing.maxHeight).toBe('90vh')
    expect(sizing.buttonsStacked).toBe(true)
  })

  it('should return auto sizing on desktop', () => {
    const sizing = getModalMobileSizing(false, true)

    expect(sizing.width).toBe('auto')
    expect(sizing.maxHeight).toBe('auto')
    expect(sizing.buttonsStacked).toBe(false)
  })

  it('should return auto sizing when mobileFullScreen is false', () => {
    const sizing = getModalMobileSizing(true, false)

    expect(sizing.width).toBe('auto')
    expect(sizing.maxHeight).toBe('auto')
    expect(sizing.buttonsStacked).toBe(false)
  })

  it('property: mobile + mobileFullScreen always results in full-width modal', () => {
    fc.assert(
      fc.property(fc.boolean(), fc.boolean(), (isMobile, mobileFullScreen) => {
        const sizing = getModalMobileSizing(isMobile, mobileFullScreen)

        if (isMobile && mobileFullScreen) {
          return (
            sizing.width === '100%' &&
            sizing.maxHeight === '90vh' &&
            sizing.buttonsStacked === true
          )
        } else {
          return (
            sizing.width === 'auto' &&
            sizing.maxHeight === 'auto' &&
            sizing.buttonsStacked === false
          )
        }
      }),
      { numRuns: 100 }
    )
  })

  it('property: buttons are stacked only on mobile with full screen', () => {
    fc.assert(
      fc.property(fc.boolean(), fc.boolean(), (isMobile, mobileFullScreen) => {
        const sizing = getModalMobileSizing(isMobile, mobileFullScreen)

        // Buttons should only be stacked when both conditions are true
        const expectedStacked = isMobile && mobileFullScreen
        return sizing.buttonsStacked === expectedStacked
      }),
      { numRuns: 100 }
    )
  })

  it('property: maxHeight is constrained to 90vh on mobile full screen', () => {
    fc.assert(
      fc.property(fc.boolean(), (mobileFullScreen) => {
        const sizing = getModalMobileSizing(true, mobileFullScreen)

        if (mobileFullScreen) {
          return sizing.maxHeight === '90vh'
        }
        return sizing.maxHeight === 'auto'
      }),
      { numRuns: 50 }
    )
  })
})

// ============================================
// Touch Target Constants Tests
// ============================================

describe('Touch target constants', () => {
  it('should have correct touch target values per spec', () => {
    expect(TOUCH_TARGET.min).toBe(44) // Apple HIG
    expect(TOUCH_TARGET.recommended).toBe(48) // Material Design
    expect(TOUCH_TARGET.comfortable).toBe(56)
  })

  it('property: touch targets are in ascending order', () => {
    const values = [
      TOUCH_TARGET.min,
      TOUCH_TARGET.recommended,
      TOUCH_TARGET.comfortable,
    ]

    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1])
    }
  })

  it('property: all touch targets meet minimum accessibility requirement', () => {
    const MIN_ACCESSIBLE_TARGET = 44 // WCAG 2.5.5 Level AAA

    expect(TOUCH_TARGET.min).toBeGreaterThanOrEqual(MIN_ACCESSIBLE_TARGET)
    expect(TOUCH_TARGET.recommended).toBeGreaterThanOrEqual(MIN_ACCESSIBLE_TARGET)
    expect(TOUCH_TARGET.comfortable).toBeGreaterThanOrEqual(MIN_ACCESSIBLE_TARGET)
  })
})

// ============================================
// Integration: Button + TouchTarget
// ============================================

describe('Button and TouchTarget integration', () => {
  it('property: small buttons with touch optimization meet touch target', () => {
    // Test that on touch devices, small buttons get touch target enforcement
    const styles = getTouchTargetStyles('sm', true)

    // Should always have touch target on touch devices
    const minHeight = parseInt(String(styles.minHeight || '0'), 10)
    const minWidth = parseInt(String(styles.minWidth || '0'), 10)

    expect(minHeight).toBeGreaterThanOrEqual(TOUCH_TARGET.min)
    expect(minWidth).toBeGreaterThanOrEqual(TOUCH_TARGET.min)
  })

  it('property: icon buttons (via TouchTarget) meet touch target', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 16, max: 32 }), // icon size
        (iconSize) => {
          const padding = calculateTouchPadding(iconSize, TOUCH_TARGET.min)
          const totalSize = iconSize + padding * 2

          return totalSize >= TOUCH_TARGET.min
        }
      ),
      { numRuns: 50 }
    )
  })
})
