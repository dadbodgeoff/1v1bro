/**
 * Property-based tests for safe area handling.
 *
 * Tests correctness properties for safe area inset application
 * on fixed-position elements.
 *
 * **Feature: mobile-optimization**
 */

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { renderHook } from '@testing-library/react'
import {
  getSafeAreaStyles,
  getSafeAreaCSSStyles,
  useSafeAreaStyles,
  type SafeAreaEdge,
} from '../SafeAreaView'

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
// Property 3: Safe area inset application
// ============================================

describe('Property 3: Safe area inset application', () => {
  /**
   * **Feature: mobile-optimization, Property 3: Safe area inset application**
   *
   * For any fixed-position element (header, footer, modal, mobile controls),
   * the element SHALL include appropriate safe area inset padding to prevent
   * content from being obscured by device notches or home indicators.
   *
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
   */

  describe('getSafeAreaStyles', () => {
    it('should apply padding for all edges by default', () => {
      const insets = { top: 44, right: 0, bottom: 34, left: 0 }
      const edges: SafeAreaEdge[] = ['top', 'right', 'bottom', 'left']

      const styles = getSafeAreaStyles(edges, insets)

      expect(styles.paddingTop).toBe(44)
      expect(styles.paddingRight).toBe(0)
      expect(styles.paddingBottom).toBe(34)
      expect(styles.paddingLeft).toBe(0)
    })

    it('should only apply padding for specified edges', () => {
      const insets = { top: 44, right: 10, bottom: 34, left: 10 }
      const edges: SafeAreaEdge[] = ['top', 'bottom']

      const styles = getSafeAreaStyles(edges, insets)

      expect(styles.paddingTop).toBe(44)
      expect(styles.paddingBottom).toBe(34)
      expect(styles.paddingRight).toBeUndefined()
      expect(styles.paddingLeft).toBeUndefined()
    })

    it('should add additional padding to safe area insets', () => {
      const insets = { top: 44, right: 0, bottom: 34, left: 0 }
      const edges: SafeAreaEdge[] = ['top', 'bottom']
      const additionalPadding = 16

      const styles = getSafeAreaStyles(edges, insets, additionalPadding)

      expect(styles.paddingTop).toBe(60) // 44 + 16
      expect(styles.paddingBottom).toBe(50) // 34 + 16
    })

    it('should respect minimum padding', () => {
      const insets = { top: 0, right: 0, bottom: 0, left: 0 }
      const edges: SafeAreaEdge[] = ['top', 'bottom']
      const additionalPadding = 0
      const minPadding = 16

      const styles = getSafeAreaStyles(edges, insets, additionalPadding, minPadding)

      expect(styles.paddingTop).toBe(16)
      expect(styles.paddingBottom).toBe(16)
    })

    it('property: safe area styles include all specified edges', () => {
      const allEdges: SafeAreaEdge[] = ['top', 'right', 'bottom', 'left']

      fc.assert(
        fc.property(
          fc.record({
            top: fc.integer({ min: 0, max: 50 }),
            right: fc.integer({ min: 0, max: 50 }),
            bottom: fc.integer({ min: 0, max: 50 }),
            left: fc.integer({ min: 0, max: 50 }),
          }),
          fc.subarray(allEdges, { minLength: 1 }),
          (insets, edges) => {
            const styles = getSafeAreaStyles(edges, insets)

            // Each specified edge should have padding
            for (const edge of edges) {
              const paddingKey = `padding${edge.charAt(0).toUpperCase() + edge.slice(1)}` as keyof typeof styles
              expect(styles[paddingKey]).toBeDefined()
            }

            // Non-specified edges should not have padding
            for (const edge of allEdges) {
              if (!edges.includes(edge)) {
                const paddingKey = `padding${edge.charAt(0).toUpperCase() + edge.slice(1)}` as keyof typeof styles
                expect(styles[paddingKey]).toBeUndefined()
              }
            }

            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('property: padding is always >= minPadding', () => {
      fc.assert(
        fc.property(
          fc.record({
            top: fc.integer({ min: 0, max: 50 }),
            right: fc.integer({ min: 0, max: 50 }),
            bottom: fc.integer({ min: 0, max: 50 }),
            left: fc.integer({ min: 0, max: 50 }),
          }),
          fc.integer({ min: 0, max: 32 }), // additionalPadding
          fc.integer({ min: 0, max: 24 }), // minPadding
          (insets, additionalPadding, minPadding) => {
            const edges: SafeAreaEdge[] = ['top', 'right', 'bottom', 'left']
            const styles = getSafeAreaStyles(edges, insets, additionalPadding, minPadding)

            // All padding values should be >= minPadding
            return (
              (styles.paddingTop as number) >= minPadding &&
              (styles.paddingRight as number) >= minPadding &&
              (styles.paddingBottom as number) >= minPadding &&
              (styles.paddingLeft as number) >= minPadding
            )
          }
        ),
        { numRuns: 100 }
      )
    })

    it('property: padding includes both safe area and additional padding', () => {
      fc.assert(
        fc.property(
          fc.record({
            top: fc.integer({ min: 0, max: 50 }),
            right: fc.integer({ min: 0, max: 50 }),
            bottom: fc.integer({ min: 0, max: 50 }),
            left: fc.integer({ min: 0, max: 50 }),
          }),
          fc.integer({ min: 0, max: 32 }),
          (insets, additionalPadding) => {
            const edges: SafeAreaEdge[] = ['top', 'right', 'bottom', 'left']
            const styles = getSafeAreaStyles(edges, insets, additionalPadding, 0)

            // Padding should be inset + additional
            return (
              styles.paddingTop === insets.top + additionalPadding &&
              styles.paddingRight === insets.right + additionalPadding &&
              styles.paddingBottom === insets.bottom + additionalPadding &&
              styles.paddingLeft === insets.left + additionalPadding
            )
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('getSafeAreaCSSStyles', () => {
    it('should generate CSS env() values for all edges', () => {
      const edges: SafeAreaEdge[] = ['top', 'right', 'bottom', 'left']
      const styles = getSafeAreaCSSStyles(edges)

      expect(styles.paddingTop).toContain('env(safe-area-inset-top')
      expect(styles.paddingRight).toContain('env(safe-area-inset-right')
      expect(styles.paddingBottom).toContain('env(safe-area-inset-bottom')
      expect(styles.paddingLeft).toContain('env(safe-area-inset-left')
    })

    it('should include additional padding in calc()', () => {
      const edges: SafeAreaEdge[] = ['top']
      const styles = getSafeAreaCSSStyles(edges, 16)

      expect(styles.paddingTop).toContain('calc(')
      expect(styles.paddingTop).toContain('+ 16px')
    })

    it('should include max() for minPadding', () => {
      const edges: SafeAreaEdge[] = ['bottom']
      const styles = getSafeAreaCSSStyles(edges, 0, 16)

      expect(styles.paddingBottom).toContain('max(')
      expect(styles.paddingBottom).toContain('16px')
    })

    it('property: CSS styles only include specified edges', () => {
      const allEdges: SafeAreaEdge[] = ['top', 'right', 'bottom', 'left']

      fc.assert(
        fc.property(fc.subarray(allEdges, { minLength: 1 }), (edges) => {
          const styles = getSafeAreaCSSStyles(edges)

          // Specified edges should have CSS env() values
          for (const edge of edges) {
            const paddingKey = `padding${edge.charAt(0).toUpperCase() + edge.slice(1)}` as keyof typeof styles
            const value = styles[paddingKey] as string
            expect(value).toContain(`env(safe-area-inset-${edge}`)
          }

          // Non-specified edges should be undefined
          for (const edge of allEdges) {
            if (!edges.includes(edge)) {
              const paddingKey = `padding${edge.charAt(0).toUpperCase() + edge.slice(1)}` as keyof typeof styles
              expect(styles[paddingKey]).toBeUndefined()
            }
          }

          return true
        }),
        { numRuns: 50 }
      )
    })
  })

  describe('useSafeAreaStyles hook', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return CSS env() styles by default', () => {
      const { result } = renderHook(() => useSafeAreaStyles(['top', 'bottom']))

      expect(result.current.paddingTop).toContain('env(safe-area-inset-top')
      expect(result.current.paddingBottom).toContain('env(safe-area-inset-bottom')
    })

    it('should return JavaScript styles when useCSSEnv is false', () => {
      const { result } = renderHook(() =>
        useSafeAreaStyles(['top', 'bottom'], { useCSSEnv: false })
      )

      // JavaScript values are numbers, not strings
      expect(typeof result.current.paddingTop).toBe('number')
      expect(typeof result.current.paddingBottom).toBe('number')
    })

    it('property: hook respects all options', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 32 }),
          fc.integer({ min: 0, max: 24 }),
          (additionalPadding, minPadding) => {
            const { result } = renderHook(() =>
              useSafeAreaStyles(['top'], { additionalPadding, minPadding })
            )

            const value = result.current.paddingTop as string

            // Should include additional padding if > 0
            if (additionalPadding > 0) {
              expect(value).toContain(`${additionalPadding}px`)
            }

            // Should include minPadding if > 0
            if (minPadding > 0) {
              expect(value).toContain(`${minPadding}px`)
            }

            return true
          }
        ),
        { numRuns: 50 }
      )
    })
  })
})

// ============================================
// Fixed Position Element Tests
// ============================================

describe('Fixed position element safe area compliance', () => {
  it('property: header elements should have top safe area', () => {
    // Headers should always include top safe area
    const edges: SafeAreaEdge[] = ['top']
    const insets = { top: 44, right: 0, bottom: 0, left: 0 }

    const styles = getSafeAreaStyles(edges, insets)

    expect(styles.paddingTop).toBe(44)
  })

  it('property: footer elements should have bottom safe area', () => {
    // Footers should always include bottom safe area
    const edges: SafeAreaEdge[] = ['bottom']
    const insets = { top: 0, right: 0, bottom: 34, left: 0 }

    const styles = getSafeAreaStyles(edges, insets)

    expect(styles.paddingBottom).toBe(34)
  })

  it('property: landscape game controls should have horizontal safe areas', () => {
    // Game controls in landscape should include left/right safe areas
    const edges: SafeAreaEdge[] = ['left', 'right', 'bottom']
    const insets = { top: 0, right: 44, bottom: 21, left: 44 }

    const styles = getSafeAreaStyles(edges, insets)

    expect(styles.paddingLeft).toBe(44)
    expect(styles.paddingRight).toBe(44)
    expect(styles.paddingBottom).toBe(21)
  })
})
