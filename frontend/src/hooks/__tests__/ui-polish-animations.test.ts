/**
 * Property-based tests for UI Polish animation hooks.
 *
 * Tests correctness properties for useReducedMotion, useStaggerAnimation,
 * and useAnimatedValue hooks.
 *
 * **Feature: ui-polish-8-of-10**
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'
import * as fc from 'fast-check'
import { renderHook, act } from '@testing-library/react'
import { useReducedMotion } from '../useReducedMotion'
import {
  useStaggerAnimation,
  calculateStaggerDelay,
  calculateVisibleItems,
} from '../useStaggerAnimation'
import {
  useAnimatedValue,
  interpolateValue,
  easingFunctions,
} from '../useAnimatedValue'

// ============================================
// Mock matchMedia for test environment
// ============================================

let mockReducedMotion = false

const createMatchMediaMock = () => {
  return vi.fn().mockImplementation((query: string) => {
    const isReducedMotionQuery = query === '(prefers-reduced-motion: reduce)'
    return {
      matches: isReducedMotionQuery ? mockReducedMotion : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }
  })
}

beforeAll(() => {
  window.matchMedia = createMatchMediaMock()
})

beforeEach(() => {
  mockReducedMotion = false
  window.matchMedia = createMatchMediaMock()
})

// ============================================
// Property 9: Reduced motion disables animations
// ============================================

describe('Property 9: Reduced motion disables animations', () => {
  /**
   * **Feature: ui-polish-8-of-10, Property 9: Reduced motion disables animations**
   *
   * For any component using animations, when prefersReducedMotion is true,
   * animation durations should be 0ms or animations should be conditionally skipped.
   *
   * **Validates: Requirements 3.4, 5.4**
   */

  it('should return false when reduced motion is not preferred', () => {
    mockReducedMotion = false
    window.matchMedia = createMatchMediaMock()

    const { result } = renderHook(() => useReducedMotion())
    expect(result.current.prefersReducedMotion).toBe(false)
  })

  it('should return true when reduced motion is preferred', () => {
    mockReducedMotion = true
    window.matchMedia = createMatchMediaMock()

    const { result } = renderHook(() => useReducedMotion())
    expect(result.current.prefersReducedMotion).toBe(true)
  })

  it('property: useStaggerAnimation returns 0 delay when reduced motion enabled', () => {
    mockReducedMotion = true
    window.matchMedia = createMatchMediaMock()

    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // itemCount
        fc.integer({ min: 10, max: 200 }), // baseDelay
        fc.integer({ min: 0, max: 99 }), // index
        (itemCount, baseDelay, index) => {
          const validIndex = index % itemCount
          const { result } = renderHook(() =>
            useStaggerAnimation({ itemCount, baseDelay })
          )
          
          // When reduced motion is enabled, delay should be 0
          return result.current.getDelay(validIndex) === 0
        }
      ),
      { numRuns: 100 }
    )
  })

  it('property: useStaggerAnimation shows all items immediately when reduced motion enabled', () => {
    mockReducedMotion = true
    window.matchMedia = createMatchMediaMock()

    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }), // itemCount
        (itemCount) => {
          const { result } = renderHook(() =>
            useStaggerAnimation({ itemCount })
          )
          
          // All items should be visible immediately
          for (let i = 0; i < itemCount; i++) {
            if (!result.current.isVisible(i)) return false
          }
          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ============================================
// Property 2: Stagger delay calculation is linear
// ============================================

describe('Property 2: Stagger delay calculation is linear', () => {
  /**
   * **Feature: ui-polish-8-of-10, Property 2: Stagger delay calculation is linear**
   *
   * For any array of N items and a base delay D, the delay for item at index i
   * should equal i * D milliseconds.
   *
   * **Validates: Requirements 1.2**
   */

  it('property: delay equals index * baseDelay', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }), // index
        fc.integer({ min: 1, max: 500 }), // baseDelay
        (index, baseDelay) => {
          const delay = calculateStaggerDelay(index, baseDelay)
          return delay === index * baseDelay
        }
      ),
      { numRuns: 100 }
    )
  })

  it('property: delay at index 0 is always 0', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 500 }), // baseDelay
        (baseDelay) => {
          return calculateStaggerDelay(0, baseDelay) === 0
        }
      ),
      { numRuns: 100 }
    )
  })

  it('property: delays are monotonically increasing', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // itemCount
        fc.integer({ min: 1, max: 200 }), // baseDelay
        (itemCount, baseDelay) => {
          for (let i = 1; i < itemCount; i++) {
            const prevDelay = calculateStaggerDelay(i - 1, baseDelay)
            const currDelay = calculateStaggerDelay(i, baseDelay)
            if (currDelay <= prevDelay) return false
          }
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('property: hook getDelay matches pure function when animations enabled', () => {
    mockReducedMotion = false
    window.matchMedia = createMatchMediaMock()

    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }), // itemCount
        fc.integer({ min: 10, max: 200 }), // baseDelay
        fc.integer({ min: 0, max: 49 }), // index
        (itemCount, baseDelay, index) => {
          const validIndex = index % itemCount
          const { result } = renderHook(() =>
            useStaggerAnimation({ itemCount, baseDelay })
          )
          
          const hookDelay = result.current.getDelay(validIndex)
          const pureDelay = calculateStaggerDelay(validIndex, baseDelay)
          
          return hookDelay === pureDelay
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ============================================
// Property 12: Stagger limits concurrent animations
// ============================================

describe('Property 12: Stagger limits concurrent animations', () => {
  /**
   * **Feature: ui-polish-8-of-10, Property 12: Stagger limits concurrent animations**
   *
   * For any stagger animation with N items and maxConcurrent M, at most M items
   * should have isVisible=true simultaneously during the stagger sequence.
   *
   * **Validates: Requirements 4.3**
   */

  it('property: visible items never exceed maxConcurrent', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 100 }), // itemCount (more than maxConcurrent)
        fc.integer({ min: 1, max: 20 }), // maxConcurrent
        fc.integer({ min: 10, max: 200 }), // baseDelay
        fc.integer({ min: 0, max: 5000 }), // elapsedMs
        (itemCount, maxConcurrent, baseDelay, elapsedMs) => {
          const visible = calculateVisibleItems(
            itemCount,
            elapsedMs,
            baseDelay,
            maxConcurrent
          )
          
          return visible.size <= maxConcurrent
        }
      ),
      { numRuns: 100 }
    )
  })

  it('property: with maxConcurrent=1, at most 1 item visible at any time', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 50 }), // itemCount
        fc.integer({ min: 10, max: 200 }), // baseDelay
        fc.integer({ min: 0, max: 2000 }), // elapsedMs
        (itemCount, baseDelay, elapsedMs) => {
          const visible = calculateVisibleItems(itemCount, elapsedMs, baseDelay, 1)
          return visible.size <= 1
        }
      ),
      { numRuns: 100 }
    )
  })

  it('property: visible items are contiguous starting from index 0', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 50 }), // itemCount
        fc.integer({ min: 1, max: 10 }), // maxConcurrent
        fc.integer({ min: 10, max: 100 }), // baseDelay
        fc.integer({ min: 0, max: 2000 }), // elapsedMs
        (itemCount, maxConcurrent, baseDelay, elapsedMs) => {
          const visible = calculateVisibleItems(
            itemCount,
            elapsedMs,
            baseDelay,
            maxConcurrent
          )
          
          // Convert to sorted array
          const visibleArray = Array.from(visible).sort((a, b) => a - b)
          
          // Check contiguity starting from 0
          for (let i = 0; i < visibleArray.length; i++) {
            if (visibleArray[i] !== i) return false
          }
          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ============================================
// Property 3: Animated value stays within bounds
// ============================================

describe('Property 3: Animated value stays within bounds', () => {
  /**
   * **Feature: ui-polish-8-of-10, Property 3: Animated value stays within bounds**
   *
   * For any animation from value A to value B, all intermediate values returned
   * by useAnimatedValue should be between min(A,B) and max(A,B) inclusive.
   *
   * **Validates: Requirements 1.4**
   */

  it('property: interpolateValue always returns value within bounds', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -1000, max: 1000, noNaN: true }), // from
        fc.float({ min: -1000, max: 1000, noNaN: true }), // to
        fc.float({ min: 0, max: 1, noNaN: true }), // progress
        (from, to, progress) => {
          const result = interpolateValue(from, to, progress)
          const minVal = Math.min(from, to)
          const maxVal = Math.max(from, to)
          
          return result >= minVal && result <= maxVal
        }
      ),
      { numRuns: 100 }
    )
  })

  it('property: interpolateValue at progress=0 equals from', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -1000, max: 1000, noNaN: true }), // from
        fc.float({ min: -1000, max: 1000, noNaN: true }), // to
        (from, to) => {
          const result = interpolateValue(from, to, 0)
          return Math.abs(result - from) < 0.0001
        }
      ),
      { numRuns: 100 }
    )
  })

  it('property: interpolateValue at progress=1 equals to', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -1000, max: 1000, noNaN: true }), // from
        fc.float({ min: -1000, max: 1000, noNaN: true }), // to
        (from, to) => {
          const result = interpolateValue(from, to, 1)
          return Math.abs(result - to) < 0.0001
        }
      ),
      { numRuns: 100 }
    )
  })

  it('property: interpolateValue handles out-of-bounds progress by clamping', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -1000, max: 1000, noNaN: true }), // from
        fc.float({ min: -1000, max: 1000, noNaN: true }), // to
        fc.float({ min: -10, max: 10, noNaN: true }), // progress (can be out of bounds)
        (from, to, progress) => {
          const result = interpolateValue(from, to, progress)
          const minVal = Math.min(from, to)
          const maxVal = Math.max(from, to)
          
          // Result should always be within bounds even with out-of-bounds progress
          return result >= minVal && result <= maxVal
        }
      ),
      { numRuns: 100 }
    )
  })

  it('property: easing functions return values in [0, 1] for input in [0, 1]', () => {
    const easingNames = Object.keys(easingFunctions) as Array<keyof typeof easingFunctions>
    
    fc.assert(
      fc.property(
        fc.constantFrom(...easingNames),
        fc.float({ min: 0, max: 1, noNaN: true }),
        (easingName, t) => {
          const easingFn = easingFunctions[easingName]
          const result = easingFn(t)
          
          // Allow small floating point errors
          return result >= -0.0001 && result <= 1.0001
        }
      ),
      { numRuns: 100 }
    )
  })

  it('property: easing functions are monotonically increasing', () => {
    const easingNames = Object.keys(easingFunctions) as Array<keyof typeof easingFunctions>
    
    fc.assert(
      fc.property(
        fc.constantFrom(...easingNames),
        fc.integer({ min: 0, max: 99 }),
        (easingName, t1Int) => {
          const t1 = t1Int / 100
          const t2 = (t1Int + 1) / 100
          const easingFn = easingFunctions[easingName]
          
          return easingFn(t2) >= easingFn(t1)
        }
      ),
      { numRuns: 100 }
    )
  })
})
