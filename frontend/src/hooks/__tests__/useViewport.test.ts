/**
 * Property-based tests for useViewport hook.
 *
 * Tests correctness properties for viewport detection, device type,
 * and resize event handling.
 *
 * **Feature: mobile-optimization**
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'
import * as fc from 'fast-check'
import { renderHook, act } from '@testing-library/react'
import {
  useViewport,
  BREAKPOINTS,
  type DeviceType,
  type ViewportState,
} from '../useViewport'

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
// Test Utilities
// ============================================

/**
 * Get expected device type for a given width
 */
function getExpectedDeviceType(width: number): DeviceType {
  if (width < BREAKPOINTS.mobile) return 'mobile'
  if (width < BREAKPOINTS.tablet) return 'tablet'
  if (width < BREAKPOINTS.desktop) return 'desktop'
  return 'wide'
}

/**
 * Get expected orientation for given dimensions
 */
function getExpectedOrientation(
  width: number,
  height: number
): 'portrait' | 'landscape' {
  return width >= height ? 'landscape' : 'portrait'
}

/**
 * Mock window dimensions
 */
function mockWindowDimensions(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  })
}

// ============================================
// Property 1: Viewport hook returns complete state
// ============================================

describe('Property 1: Viewport hook returns complete state', () => {
  /**
   * **Feature: mobile-optimization, Property 1: Viewport hook returns complete state**
   *
   * For any viewport configuration (width, height, touch capability),
   * the useViewport hook SHALL return a complete ViewportState object
   * with all required fields.
   *
   * **Validates: Requirements 1.1**
   */

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return all required fields in ViewportState', () => {
    mockWindowDimensions(1024, 768)

    const { result } = renderHook(() => useViewport())

    // Verify all required fields exist
    expect(result.current).toHaveProperty('width')
    expect(result.current).toHaveProperty('height')
    expect(result.current).toHaveProperty('deviceType')
    expect(result.current).toHaveProperty('orientation')
    expect(result.current).toHaveProperty('isTouch')
    expect(result.current).toHaveProperty('isMobile')
    expect(result.current).toHaveProperty('isTablet')
    expect(result.current).toHaveProperty('isDesktop')
    expect(result.current).toHaveProperty('safeAreaInsets')
  })

  it('should return correct types for all fields', () => {
    mockWindowDimensions(1024, 768)

    const { result } = renderHook(() => useViewport())

    expect(typeof result.current.width).toBe('number')
    expect(typeof result.current.height).toBe('number')
    expect(['mobile', 'tablet', 'desktop', 'wide']).toContain(
      result.current.deviceType
    )
    expect(['portrait', 'landscape']).toContain(result.current.orientation)
    expect(typeof result.current.isTouch).toBe('boolean')
    expect(typeof result.current.isMobile).toBe('boolean')
    expect(typeof result.current.isTablet).toBe('boolean')
    expect(typeof result.current.isDesktop).toBe('boolean')
    expect(typeof result.current.safeAreaInsets).toBe('object')
    expect(typeof result.current.safeAreaInsets.top).toBe('number')
    expect(typeof result.current.safeAreaInsets.right).toBe('number')
    expect(typeof result.current.safeAreaInsets.bottom).toBe('number')
    expect(typeof result.current.safeAreaInsets.left).toBe('number')
  })

  it('property: for any valid viewport dimensions, all fields are present', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 3840 }), // width
        fc.integer({ min: 480, max: 2160 }), // height
        (width, height) => {
          mockWindowDimensions(width, height)

          const { result } = renderHook(() => useViewport())

          // All required fields must be present
          const state = result.current
          return (
            typeof state.width === 'number' &&
            typeof state.height === 'number' &&
            ['mobile', 'tablet', 'desktop', 'wide'].includes(state.deviceType) &&
            ['portrait', 'landscape'].includes(state.orientation) &&
            typeof state.isTouch === 'boolean' &&
            typeof state.isMobile === 'boolean' &&
            typeof state.isTablet === 'boolean' &&
            typeof state.isDesktop === 'boolean' &&
            typeof state.safeAreaInsets === 'object'
          )
        }
      ),
      { numRuns: 100 }
    )
  })

  it('property: deviceType correctly maps to breakpoints', () => {
    fc.assert(
      fc.property(fc.integer({ min: 320, max: 3840 }), (width) => {
        mockWindowDimensions(width, 768)

        const { result } = renderHook(() => useViewport())
        const expectedType = getExpectedDeviceType(width)

        return result.current.deviceType === expectedType
      }),
      { numRuns: 100 }
    )
  })

  it('property: orientation correctly maps to dimensions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 3840 }),
        fc.integer({ min: 480, max: 2160 }),
        (width, height) => {
          mockWindowDimensions(width, height)

          const { result } = renderHook(() => useViewport())
          const expectedOrientation = getExpectedOrientation(width, height)

          return result.current.orientation === expectedOrientation
        }
      ),
      { numRuns: 100 }
    )
  })

  it('property: boolean helpers are consistent with deviceType', () => {
    fc.assert(
      fc.property(fc.integer({ min: 320, max: 3840 }), (width) => {
        mockWindowDimensions(width, 768)

        const { result } = renderHook(() => useViewport())
        const { deviceType, isMobile, isTablet, isDesktop } = result.current

        // Verify boolean helpers match deviceType
        const mobileMatch = isMobile === (deviceType === 'mobile')
        const tabletMatch = isTablet === (deviceType === 'tablet')
        const desktopMatch =
          isDesktop === (deviceType === 'desktop' || deviceType === 'wide')

        return mobileMatch && tabletMatch && desktopMatch
      }),
      { numRuns: 100 }
    )
  })
})

// ============================================
// Property 12: Resize event debouncing
// ============================================

describe('Property 12: Resize event debouncing', () => {
  /**
   * **Feature: mobile-optimization, Property 12: Resize event debouncing**
   *
   * For any sequence of rapid viewport resize events, the useViewport hook
   * SHALL debounce updates and notify subscribers no more frequently than
   * once per 100ms.
   *
   * **Validates: Requirements 1.2**
   */

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should debounce resize events at 100ms', async () => {
    mockWindowDimensions(1024, 768)

    const { result } = renderHook(() => useViewport())
    const initialWidth = result.current.width

    // Trigger multiple rapid resize events
    mockWindowDimensions(800, 600)
    window.dispatchEvent(new Event('resize'))

    mockWindowDimensions(600, 400)
    window.dispatchEvent(new Event('resize'))

    mockWindowDimensions(400, 300)
    window.dispatchEvent(new Event('resize'))

    // State should not have updated yet (debounced)
    expect(result.current.width).toBe(initialWidth)

    // Advance timers past debounce threshold
    await act(async () => {
      vi.advanceTimersByTime(100)
    })

    // Now state should reflect the final resize
    expect(result.current.width).toBe(400)
  })

  it('property: rapid resize events result in single update after debounce', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 320, max: 1920 }), { minLength: 2, maxLength: 10 }),
        (widths) => {
          mockWindowDimensions(1024, 768)

          const { result } = renderHook(() => useViewport())

          // Trigger rapid resize events
          widths.forEach((width) => {
            mockWindowDimensions(width, 768)
            window.dispatchEvent(new Event('resize'))
          })

          // Advance past debounce
          act(() => {
            vi.advanceTimersByTime(100)
          })

          // Final state should match last width
          const finalWidth = widths[widths.length - 1]
          return result.current.width === finalWidth
        }
      ),
      { numRuns: 50 }
    )
  })

  it('property: updates within 100ms window are coalesced', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 99 }), // time within debounce window
        fc.integer({ min: 320, max: 1920 }),
        fc.integer({ min: 320, max: 1920 }),
        (timeWithinWindow, width1, width2) => {
          mockWindowDimensions(1024, 768)

          const { result } = renderHook(() => useViewport())
          const initialWidth = result.current.width

          // First resize
          mockWindowDimensions(width1, 768)
          window.dispatchEvent(new Event('resize'))

          // Advance less than debounce threshold
          act(() => {
            vi.advanceTimersByTime(timeWithinWindow)
          })

          // Second resize before debounce completes
          mockWindowDimensions(width2, 768)
          window.dispatchEvent(new Event('resize'))

          // State should still be initial (debounce restarted)
          const stateBeforeDebounce = result.current.width

          // Complete debounce
          act(() => {
            vi.advanceTimersByTime(100)
          })

          // Final state should be width2
          return (
            stateBeforeDebounce === initialWidth &&
            result.current.width === width2
          )
        }
      ),
      { numRuns: 50 }
    )
  })
})

// ============================================
// Breakpoint Constants Tests
// ============================================

describe('Breakpoint constants', () => {
  it('should have correct breakpoint values per spec', () => {
    expect(BREAKPOINTS.mobile).toBe(640)
    expect(BREAKPOINTS.tablet).toBe(1024)
    expect(BREAKPOINTS.desktop).toBe(1440)
    expect(BREAKPOINTS.wide).toBe(1920)
  })

  it('property: breakpoints are in ascending order', () => {
    const values = [
      BREAKPOINTS.mobile,
      BREAKPOINTS.tablet,
      BREAKPOINTS.desktop,
      BREAKPOINTS.wide,
    ]

    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1])
    }
  })

  it('property: any width maps to exactly one device type', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 5000 }), (width) => {
        const deviceType = getExpectedDeviceType(width)
        const validTypes: DeviceType[] = ['mobile', 'tablet', 'desktop', 'wide']
        return validTypes.includes(deviceType)
      }),
      { numRuns: 100 }
    )
  })
})

// ============================================
// Safe Area Insets Tests
// ============================================

describe('Safe area insets', () => {
  it('should return numeric values for all insets', () => {
    mockWindowDimensions(1024, 768)

    const { result } = renderHook(() => useViewport())

    expect(typeof result.current.safeAreaInsets.top).toBe('number')
    expect(typeof result.current.safeAreaInsets.right).toBe('number')
    expect(typeof result.current.safeAreaInsets.bottom).toBe('number')
    expect(typeof result.current.safeAreaInsets.left).toBe('number')
  })

  it('property: safe area insets are non-negative', () => {
    mockWindowDimensions(1024, 768)

    const { result } = renderHook(() => useViewport())
    const { safeAreaInsets } = result.current

    expect(safeAreaInsets.top).toBeGreaterThanOrEqual(0)
    expect(safeAreaInsets.right).toBeGreaterThanOrEqual(0)
    expect(safeAreaInsets.bottom).toBeGreaterThanOrEqual(0)
    expect(safeAreaInsets.left).toBeGreaterThanOrEqual(0)
  })
})
