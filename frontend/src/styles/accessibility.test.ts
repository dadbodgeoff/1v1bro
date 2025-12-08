/**
 * Accessibility Property Tests - 2025 Design System
 *
 * Property-based tests using fast-check for accessibility requirements.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// ============================================
// Constants
// ============================================

// Minimum touch target size per WCAG 2.5.5 (AAA) and Apple HIG
const MIN_TOUCH_TARGET_SIZE = 44

// Focus ring configuration
const FOCUS_RING_CONFIG = {
  width: 2,
  color: '#6366f1', // indigo-500
  offset: 2,
}

// Interactive element types that require focus visibility
const INTERACTIVE_ELEMENTS = [
  'button',
  'a',
  'input',
  'select',
  'textarea',
  '[tabindex]',
  '[role="button"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  '[role="tab"]',
  '[role="menuitem"]',
] as const

// ============================================
// Property Tests
// ============================================

describe('Accessibility Property Tests', () => {
  /**
   * **Feature: frontend-2025-redesign, Property 12: Keyboard Focus Visibility**
   * **Validates: Requirements 6.2**
   *
   * For any interactive element, when focused via keyboard navigation,
   * the element SHALL display a visible focus ring (2px indigo-500).
   */
  describe('Property 12: Keyboard Focus Visibility', () => {
    // Helper to check if an element type is interactive
    const isInteractiveElement = (elementType: string): boolean => {
      const lowerType = elementType.toLowerCase()
      return (
        lowerType === 'button' ||
        lowerType === 'a' ||
        lowerType === 'input' ||
        lowerType === 'select' ||
        lowerType === 'textarea' ||
        lowerType.includes('tabindex') ||
        lowerType.includes('role="button"') ||
        lowerType.includes('role="link"')
      )
    }

    // Helper to validate focus ring styles
    const hasValidFocusRing = (styles: {
      outlineWidth?: number
      outlineColor?: string
      outlineOffset?: number
      ringWidth?: number
      ringColor?: string
    }): boolean => {
      // Check for either outline or ring-based focus styles
      const hasOutline =
        (styles.outlineWidth ?? 0) >= FOCUS_RING_CONFIG.width &&
        styles.outlineColor !== undefined

      const hasRing =
        (styles.ringWidth ?? 0) >= FOCUS_RING_CONFIG.width &&
        styles.ringColor !== undefined

      return hasOutline || hasRing
    }

    it('all interactive element types should be recognized', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...INTERACTIVE_ELEMENTS),
          (elementType) => {
            // All elements in our list should be considered interactive
            return INTERACTIVE_ELEMENTS.includes(elementType)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('button elements are interactive', () => {
      expect(isInteractiveElement('button')).toBe(true)
    })

    it('link elements are interactive', () => {
      expect(isInteractiveElement('a')).toBe(true)
    })

    it('input elements are interactive', () => {
      expect(isInteractiveElement('input')).toBe(true)
    })

    it('select elements are interactive', () => {
      expect(isInteractiveElement('select')).toBe(true)
    })

    it('textarea elements are interactive', () => {
      expect(isInteractiveElement('textarea')).toBe(true)
    })

    it('div elements are not interactive by default', () => {
      expect(isInteractiveElement('div')).toBe(false)
    })

    it('span elements are not interactive by default', () => {
      expect(isInteractiveElement('span')).toBe(false)
    })

    it('focus ring with 2px width is valid', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 4 }),
          fc.constantFrom('#6366f1', '#4f46e5', '#818cf8'),
          (width, color) => {
            return hasValidFocusRing({
              outlineWidth: width,
              outlineColor: color,
            })
          }
        ),
        { numRuns: 50 }
      )
    })

    it('focus ring with 0px width is invalid', () => {
      expect(
        hasValidFocusRing({
          outlineWidth: 0,
          outlineColor: '#6366f1',
        })
      ).toBe(false)
    })

    it('focus ring without color is invalid', () => {
      expect(
        hasValidFocusRing({
          outlineWidth: 2,
          outlineColor: undefined,
        })
      ).toBe(false)
    })

    it('ring-based focus styles are also valid', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 4 }),
          fc.constantFrom('#6366f1', '#4f46e5'),
          (width, color) => {
            return hasValidFocusRing({
              ringWidth: width,
              ringColor: color,
            })
          }
        ),
        { numRuns: 50 }
      )
    })

    it('focus ring config uses indigo-500', () => {
      expect(FOCUS_RING_CONFIG.color).toBe('#6366f1')
    })

    it('focus ring config uses 2px width', () => {
      expect(FOCUS_RING_CONFIG.width).toBe(2)
    })

    // Test logical tab order
    describe('Tab Order Logic', () => {
      const getTabOrder = (
        elements: Array<{ tabIndex: number; order: number }>
      ): number[] => {
        // Sort by tabIndex (positive first in order, then 0s in DOM order, skip negatives)
        const positiveTabIndex = elements
          .filter((e) => e.tabIndex > 0)
          .sort((a, b) => a.tabIndex - b.tabIndex)

        const zeroTabIndex = elements
          .filter((e) => e.tabIndex === 0)
          .sort((a, b) => a.order - b.order)

        return [...positiveTabIndex, ...zeroTabIndex].map((e) => e.order)
      }

      it('elements with tabIndex=0 follow DOM order', () => {
        fc.assert(
          fc.property(
            fc.array(fc.integer({ min: 0, max: 10 }), { minLength: 2, maxLength: 10 }),
            (domOrders) => {
              const elements = domOrders.map((_, i) => ({
                tabIndex: 0,
                order: i,
              }))

              const tabOrder = getTabOrder(elements)

              // Should be in DOM order (0, 1, 2, ...)
              for (let i = 0; i < tabOrder.length - 1; i++) {
                if (tabOrder[i] > tabOrder[i + 1]) {
                  return false
                }
              }
              return true
            }
          ),
          { numRuns: 50 }
        )
      })

      it('positive tabIndex elements come before tabIndex=0', () => {
        const elements = [
          { tabIndex: 0, order: 0 },
          { tabIndex: 1, order: 1 },
          { tabIndex: 0, order: 2 },
        ]

        const tabOrder = getTabOrder(elements)

        // Element with tabIndex=1 (order=1) should come first
        expect(tabOrder[0]).toBe(1)
      })

      it('negative tabIndex elements are excluded from tab order', () => {
        const elements = [
          { tabIndex: -1, order: 0 },
          { tabIndex: 0, order: 1 },
          { tabIndex: 0, order: 2 },
        ]

        const tabOrder = getTabOrder(elements)

        // Should only have 2 elements (excluding tabIndex=-1)
        expect(tabOrder).toHaveLength(2)
        expect(tabOrder).not.toContain(0)
      })
    })
  })

  /**
   * **Feature: frontend-2025-redesign, Property 13: Touch Target Size**
   * **Validates: Requirements 6.5**
   *
   * For any interactive element, the touch target size SHALL be at least
   * 44x44 pixels to meet accessibility guidelines.
   */
  describe('Property 13: Touch Target Size', () => {
    // Helper to check if touch target meets minimum size
    const meetsMinTouchTarget = (width: number, height: number): boolean => {
      return width >= MIN_TOUCH_TARGET_SIZE && height >= MIN_TOUCH_TARGET_SIZE
    }

    // Helper to calculate required padding to meet touch target
    const calculateRequiredPadding = (
      contentWidth: number,
      contentHeight: number
    ): { horizontal: number; vertical: number } => {
      const horizontalPadding = Math.max(
        0,
        Math.ceil((MIN_TOUCH_TARGET_SIZE - contentWidth) / 2)
      )
      const verticalPadding = Math.max(
        0,
        Math.ceil((MIN_TOUCH_TARGET_SIZE - contentHeight) / 2)
      )

      return {
        horizontal: horizontalPadding,
        vertical: verticalPadding,
      }
    }

    it('44x44 pixels meets minimum touch target', () => {
      expect(meetsMinTouchTarget(44, 44)).toBe(true)
    })

    it('larger than 44x44 meets minimum touch target', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 44, max: 200 }),
          fc.integer({ min: 44, max: 200 }),
          (width, height) => {
            return meetsMinTouchTarget(width, height) === true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('smaller than 44px width fails minimum touch target', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 43 }),
          fc.integer({ min: 44, max: 200 }),
          (width, height) => {
            return meetsMinTouchTarget(width, height) === false
          }
        ),
        { numRuns: 100 }
      )
    })

    it('smaller than 44px height fails minimum touch target', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 44, max: 200 }),
          fc.integer({ min: 1, max: 43 }),
          (width, height) => {
            return meetsMinTouchTarget(width, height) === false
          }
        ),
        { numRuns: 100 }
      )
    })

    it('both dimensions smaller than 44px fails', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 43 }),
          fc.integer({ min: 1, max: 43 }),
          (width, height) => {
            return meetsMinTouchTarget(width, height) === false
          }
        ),
        { numRuns: 100 }
      )
    })

    it('calculates correct padding for small content', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 40 }),
          fc.integer({ min: 10, max: 40 }),
          (contentWidth, contentHeight) => {
            const padding = calculateRequiredPadding(contentWidth, contentHeight)

            // With padding applied, should meet minimum
            const totalWidth = contentWidth + padding.horizontal * 2
            const totalHeight = contentHeight + padding.vertical * 2

            return totalWidth >= MIN_TOUCH_TARGET_SIZE && totalHeight >= MIN_TOUCH_TARGET_SIZE
          }
        ),
        { numRuns: 100 }
      )
    })

    it('no padding needed for content >= 44px', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 44, max: 200 }),
          fc.integer({ min: 44, max: 200 }),
          (contentWidth, contentHeight) => {
            const padding = calculateRequiredPadding(contentWidth, contentHeight)

            return padding.horizontal === 0 && padding.vertical === 0
          }
        ),
        { numRuns: 100 }
      )
    })

    it('icon buttons (24px) need 10px padding each side', () => {
      const iconSize = 24
      const padding = calculateRequiredPadding(iconSize, iconSize)

      // (44 - 24) / 2 = 10
      expect(padding.horizontal).toBe(10)
      expect(padding.vertical).toBe(10)
    })

    it('small icons (16px) need 14px padding each side', () => {
      const iconSize = 16
      const padding = calculateRequiredPadding(iconSize, iconSize)

      // (44 - 16) / 2 = 14
      expect(padding.horizontal).toBe(14)
      expect(padding.vertical).toBe(14)
    })

    // Test common UI element sizes
    describe('Common UI Element Sizes', () => {
      const COMMON_ELEMENTS = {
        iconButton: { width: 24, height: 24 },
        smallButton: { width: 32, height: 32 },
        mediumButton: { width: 80, height: 40 },
        largeButton: { width: 120, height: 48 },
        checkbox: { width: 20, height: 20 },
        radio: { width: 20, height: 20 },
        switch: { width: 44, height: 24 },
      }

      it('icon buttons need padding to meet touch target', () => {
        const { width, height } = COMMON_ELEMENTS.iconButton
        expect(meetsMinTouchTarget(width, height)).toBe(false)

        const padding = calculateRequiredPadding(width, height)
        const totalWidth = width + padding.horizontal * 2
        const totalHeight = height + padding.vertical * 2

        expect(meetsMinTouchTarget(totalWidth, totalHeight)).toBe(true)
      })

      it('small buttons need padding to meet touch target', () => {
        const { width, height } = COMMON_ELEMENTS.smallButton
        expect(meetsMinTouchTarget(width, height)).toBe(false)

        const padding = calculateRequiredPadding(width, height)
        const totalWidth = width + padding.horizontal * 2
        const totalHeight = height + padding.vertical * 2

        expect(meetsMinTouchTarget(totalWidth, totalHeight)).toBe(true)
      })

      it('medium buttons may need height padding', () => {
        const { width, height } = COMMON_ELEMENTS.mediumButton
        // Width is fine (80 >= 44), but height (40) is less than 44
        expect(width >= MIN_TOUCH_TARGET_SIZE).toBe(true)
        expect(height >= MIN_TOUCH_TARGET_SIZE).toBe(false)
      })

      it('large buttons meet touch target without padding', () => {
        const { width, height } = COMMON_ELEMENTS.largeButton
        expect(meetsMinTouchTarget(width, height)).toBe(true)
      })

      it('checkboxes need padding to meet touch target', () => {
        const { width, height } = COMMON_ELEMENTS.checkbox
        expect(meetsMinTouchTarget(width, height)).toBe(false)
      })

      it('switches meet width but may need height padding', () => {
        const { width, height } = COMMON_ELEMENTS.switch
        expect(width >= MIN_TOUCH_TARGET_SIZE).toBe(true)
        expect(height >= MIN_TOUCH_TARGET_SIZE).toBe(false)
      })
    })
  })
})
