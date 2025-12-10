/**
 * useViewport - Responsive viewport detection hook
 *
 * Provides device type, dimensions, orientation, touch capability,
 * and safe area insets for responsive component rendering.
 *
 * Features:
 * - Debounced resize events (100ms) to prevent excessive re-renders
 * - matchMedia for efficient breakpoint detection
 * - Cached touch detection (doesn't change during session)
 * - Safe area inset detection for notched devices
 *
 * @module hooks/useViewport
 * Requirements: 1.1, 1.2, 1.3
 */

import { useState, useEffect, useCallback, useMemo } from 'react'

// Breakpoint constants matching design spec
export const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
  desktop: 1440,
  wide: 1920,
} as const

export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'wide'
export type Orientation = 'portrait' | 'landscape'

export interface SafeAreaInsets {
  top: number
  right: number
  bottom: number
  left: number
}

export interface ViewportState {
  /** Current viewport width in pixels */
  width: number
  /** Current viewport height in pixels */
  height: number
  /** Device type based on breakpoints */
  deviceType: DeviceType
  /** Current orientation */
  orientation: Orientation
  /** Whether device supports touch input */
  isTouch: boolean
  /** Convenience: deviceType === 'mobile' */
  isMobile: boolean
  /** Convenience: deviceType === 'tablet' */
  isTablet: boolean
  /** Convenience: deviceType === 'desktop' || deviceType === 'wide' */
  isDesktop: boolean
  /** Safe area insets for notched devices */
  safeAreaInsets: SafeAreaInsets
}

// Debounce utility
function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  return ((...args: unknown[]) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }) as T
}

// Detect touch capability (cached - doesn't change during session)
const detectTouchCapability = (): boolean => {
  if (typeof window === 'undefined') return false
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - msMaxTouchPoints is IE-specific
    navigator.msMaxTouchPoints > 0
  )
}

// Get device type from width
const getDeviceType = (width: number): DeviceType => {
  if (width < BREAKPOINTS.mobile) return 'mobile'
  if (width < BREAKPOINTS.tablet) return 'tablet'
  if (width < BREAKPOINTS.desktop) return 'desktop'
  return 'wide'
}

// Get orientation from dimensions
const getOrientation = (width: number, height: number): Orientation => {
  return width >= height ? 'landscape' : 'portrait'
}

// Parse CSS env() safe area values
const getSafeAreaInsets = (): SafeAreaInsets => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 }
  }

  const computedStyle = getComputedStyle(document.documentElement)

  const parseEnvValue = (property: string): number => {
    const value = computedStyle.getPropertyValue(property).trim()
    if (!value) return 0
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : parsed
  }

  // Try to get values from CSS custom properties that mirror env()
  // These are set in responsive.css
  return {
    top: parseEnvValue('--safe-area-inset-top') || 0,
    right: parseEnvValue('--safe-area-inset-right') || 0,
    bottom: parseEnvValue('--safe-area-inset-bottom') || 0,
    left: parseEnvValue('--safe-area-inset-left') || 0,
  }
}

// Create initial state
const createInitialState = (): ViewportState => {
  if (typeof window === 'undefined') {
    // SSR fallback - assume mobile-first
    return {
      width: 375,
      height: 667,
      deviceType: 'mobile',
      orientation: 'portrait',
      isTouch: true,
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 },
    }
  }

  const width = window.innerWidth
  const height = window.innerHeight
  const deviceType = getDeviceType(width)

  return {
    width,
    height,
    deviceType,
    orientation: getOrientation(width, height),
    isTouch: detectTouchCapability(),
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop' || deviceType === 'wide',
    safeAreaInsets: getSafeAreaInsets(),
  }
}

/**
 * Hook for responsive viewport detection
 *
 * @returns ViewportState with device info, dimensions, and safe areas
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isMobile, isTouch, safeAreaInsets } = useViewport()
 *
 *   return (
 *     <div style={{ paddingBottom: safeAreaInsets.bottom }}>
 *       {isMobile ? <MobileLayout /> : <DesktopLayout />}
 *     </div>
 *   )
 * }
 * ```
 */
export function useViewport(): ViewportState {
  const [state, setState] = useState<ViewportState>(createInitialState)

  // Memoize touch detection (doesn't change during session)
  const isTouch = useMemo(() => detectTouchCapability(), [])

  // Handle resize with debouncing
  const handleResize = useCallback(() => {
    const width = window.innerWidth
    const height = window.innerHeight
    const deviceType = getDeviceType(width)

    setState((prev) => {
      // Only update if values actually changed
      if (
        prev.width === width &&
        prev.height === height &&
        prev.deviceType === deviceType
      ) {
        return prev
      }

      return {
        width,
        height,
        deviceType,
        orientation: getOrientation(width, height),
        isTouch,
        isMobile: deviceType === 'mobile',
        isTablet: deviceType === 'tablet',
        isDesktop: deviceType === 'desktop' || deviceType === 'wide',
        safeAreaInsets: getSafeAreaInsets(),
      }
    })
  }, [isTouch])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Debounce resize events at 100ms per design spec
    const debouncedResize = debounce(handleResize, 100)

    // Use matchMedia for more efficient breakpoint detection
    const mediaQueries = {
      mobile: window.matchMedia(`(max-width: ${BREAKPOINTS.mobile - 1}px)`),
      tablet: window.matchMedia(
        `(min-width: ${BREAKPOINTS.mobile}px) and (max-width: ${BREAKPOINTS.tablet - 1}px)`
      ),
      desktop: window.matchMedia(
        `(min-width: ${BREAKPOINTS.tablet}px) and (max-width: ${BREAKPOINTS.desktop - 1}px)`
      ),
      wide: window.matchMedia(`(min-width: ${BREAKPOINTS.desktop}px)`),
    }

    // Handle media query changes (more efficient than resize for breakpoints)
    const handleMediaChange = () => {
      handleResize()
    }

    // Add listeners
    window.addEventListener('resize', debouncedResize)
    window.addEventListener('orientationchange', handleResize)

    // Add matchMedia listeners for breakpoint changes
    Object.values(mediaQueries).forEach((mq) => {
      if (mq.addEventListener) {
        mq.addEventListener('change', handleMediaChange)
      } else {
        // Fallback for older browsers
        mq.addListener(handleMediaChange)
      }
    })

    // Initial measurement
    handleResize()

    return () => {
      window.removeEventListener('resize', debouncedResize)
      window.removeEventListener('orientationchange', handleResize)

      Object.values(mediaQueries).forEach((mq) => {
        if (mq.removeEventListener) {
          mq.removeEventListener('change', handleMediaChange)
        } else {
          mq.removeListener(handleMediaChange)
        }
      })
    }
  }, [handleResize])

  return state
}

/**
 * Get current device type without hook (for non-React contexts)
 */
export function getCurrentDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'mobile'
  return getDeviceType(window.innerWidth)
}

/**
 * Check if current device is touch-capable (for non-React contexts)
 */
export function isTouchDevice(): boolean {
  return detectTouchCapability()
}

export default useViewport
