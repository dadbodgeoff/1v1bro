/**
 * Breakpoint constants and utility functions
 *
 * Centralized responsive breakpoint system for consistent
 * device detection across the application.
 *
 * Breakpoints:
 * - mobile: < 640px
 * - tablet: 640-1024px
 * - desktop: 1024-1440px
 * - wide: > 1440px
 *
 * @module utils/breakpoints
 * Requirements: 1.5
 */

// ============================================
// Breakpoint Constants
// ============================================

/**
 * Screen width breakpoints in pixels
 *
 * Usage:
 * - mobile: < BREAKPOINTS.mobile (< 640px)
 * - tablet: >= BREAKPOINTS.mobile && < BREAKPOINTS.tablet (640-1023px)
 * - desktop: >= BREAKPOINTS.tablet && < BREAKPOINTS.desktop (1024-1439px)
 * - wide: >= BREAKPOINTS.desktop (>= 1440px)
 */
export const BREAKPOINTS = {
  /** Mobile breakpoint - screens below this are mobile */
  mobile: 640,
  /** Tablet breakpoint - screens below this are tablet */
  tablet: 1024,
  /** Desktop breakpoint - screens below this are desktop */
  desktop: 1440,
  /** Wide breakpoint - screens at or above this are wide */
  wide: 1920,
} as const

export type BreakpointKey = keyof typeof BREAKPOINTS

// ============================================
// Touch Target Constants
// ============================================

/**
 * Touch target size constants in pixels
 *
 * Based on platform guidelines:
 * - Apple HIG: 44×44pt minimum
 * - Material Design: 48×48dp recommended
 */
export const TOUCH_TARGET = {
  /** Minimum touch target (Apple HIG) */
  min: 44,
  /** Recommended touch target (Material Design) */
  recommended: 48,
  /** Comfortable touch target for all users */
  comfortable: 56,
} as const

// ============================================
// Spacing Constants
// ============================================

/**
 * Spacing constants for responsive layouts
 */
export const SPACING = {
  /** Minimum gap between touch targets to prevent mis-taps */
  touchGap: 8,
  /** Additional padding for safe area content */
  safeArea: 16,
  /** Base spacing unit */
  base: 16,
  /** Extra small spacing */
  xs: 4,
  /** Small spacing */
  sm: 8,
  /** Medium spacing */
  md: 16,
  /** Large spacing */
  lg: 24,
  /** Extra large spacing */
  xl: 32,
} as const

// ============================================
// Device Type
// ============================================

export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'wide'

// ============================================
// Breakpoint Utility Functions
// ============================================

/**
 * Get device type from screen width
 *
 * @param width - Screen width in pixels
 * @returns Device type string
 *
 * @example
 * ```ts
 * getDeviceType(375)  // 'mobile'
 * getDeviceType(768)  // 'tablet'
 * getDeviceType(1200) // 'desktop'
 * getDeviceType(1920) // 'wide'
 * ```
 */
export function getDeviceType(width: number): DeviceType {
  if (width < BREAKPOINTS.mobile) return 'mobile'
  if (width < BREAKPOINTS.tablet) return 'tablet'
  if (width < BREAKPOINTS.desktop) return 'desktop'
  return 'wide'
}

/**
 * Check if width is mobile breakpoint
 */
export function isMobileBreakpoint(width: number): boolean {
  return width < BREAKPOINTS.mobile
}

/**
 * Check if width is tablet breakpoint
 */
export function isTabletBreakpoint(width: number): boolean {
  return width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet
}

/**
 * Check if width is desktop breakpoint
 */
export function isDesktopBreakpoint(width: number): boolean {
  return width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop
}

/**
 * Check if width is wide breakpoint
 */
export function isWideBreakpoint(width: number): boolean {
  return width >= BREAKPOINTS.desktop
}

/**
 * Check if width is at or above a specific breakpoint
 *
 * @param width - Screen width in pixels
 * @param breakpoint - Breakpoint key to check against
 * @returns True if width is at or above the breakpoint
 *
 * @example
 * ```ts
 * isAtLeast(800, 'mobile')  // true (800 >= 640)
 * isAtLeast(500, 'tablet')  // false (500 < 1024)
 * ```
 */
export function isAtLeast(width: number, breakpoint: BreakpointKey): boolean {
  return width >= BREAKPOINTS[breakpoint]
}

/**
 * Check if width is below a specific breakpoint
 *
 * @param width - Screen width in pixels
 * @param breakpoint - Breakpoint key to check against
 * @returns True if width is below the breakpoint
 */
export function isBelow(width: number, breakpoint: BreakpointKey): boolean {
  return width < BREAKPOINTS[breakpoint]
}

/**
 * Check if width is between two breakpoints (inclusive of min, exclusive of max)
 *
 * @param width - Screen width in pixels
 * @param minBreakpoint - Minimum breakpoint (inclusive)
 * @param maxBreakpoint - Maximum breakpoint (exclusive)
 * @returns True if width is between the breakpoints
 */
export function isBetween(
  width: number,
  minBreakpoint: BreakpointKey,
  maxBreakpoint: BreakpointKey
): boolean {
  return width >= BREAKPOINTS[minBreakpoint] && width < BREAKPOINTS[maxBreakpoint]
}

// ============================================
// Media Query Helpers
// ============================================

/**
 * Generate media query string for minimum width
 *
 * @param breakpoint - Breakpoint key
 * @returns Media query string
 *
 * @example
 * ```ts
 * minWidth('tablet') // '(min-width: 1024px)'
 * ```
 */
export function minWidth(breakpoint: BreakpointKey): string {
  return `(min-width: ${BREAKPOINTS[breakpoint]}px)`
}

/**
 * Generate media query string for maximum width
 *
 * @param breakpoint - Breakpoint key
 * @returns Media query string
 *
 * @example
 * ```ts
 * maxWidth('mobile') // '(max-width: 639px)'
 * ```
 */
export function maxWidth(breakpoint: BreakpointKey): string {
  return `(max-width: ${BREAKPOINTS[breakpoint] - 1}px)`
}

/**
 * Generate media query string for width range
 *
 * @param minBreakpoint - Minimum breakpoint
 * @param maxBreakpoint - Maximum breakpoint
 * @returns Media query string
 */
export function betweenWidths(
  minBreakpoint: BreakpointKey,
  maxBreakpoint: BreakpointKey
): string {
  return `(min-width: ${BREAKPOINTS[minBreakpoint]}px) and (max-width: ${BREAKPOINTS[maxBreakpoint] - 1}px)`
}

// ============================================
// Tailwind-compatible Class Helpers
// ============================================

/**
 * Get Tailwind breakpoint prefix for a device type
 *
 * @param deviceType - Device type
 * @returns Tailwind prefix or empty string for mobile
 *
 * @example
 * ```ts
 * getTailwindPrefix('mobile')  // ''
 * getTailwindPrefix('tablet')  // 'sm:'
 * getTailwindPrefix('desktop') // 'lg:'
 * ```
 */
export function getTailwindPrefix(deviceType: DeviceType): string {
  switch (deviceType) {
    case 'mobile':
      return ''
    case 'tablet':
      return 'sm:'
    case 'desktop':
      return 'lg:'
    case 'wide':
      return 'xl:'
  }
}

export default BREAKPOINTS
