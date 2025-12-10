/**
 * Fluid Typography Utility Functions
 *
 * Implements fluid typography using CSS clamp() for smooth scaling
 * between mobile and desktop breakpoints.
 *
 * Key principles:
 * - Body text minimum 16px on mobile (prevents iOS auto-zoom)
 * - Headings scale fluidly between min/max sizes
 * - Line height adjusts for mobile readability (1.6-1.8)
 *
 * Requirements: 4.1, 4.2, 4.3
 */

import { BREAKPOINTS } from './breakpoints'

// ============================================
// Typography Scale Constants
// ============================================

/**
 * Font size scale in pixels
 * Each level has min (mobile) and max (desktop) sizes
 */
export const FONT_SIZES = {
  xs: { min: 12, max: 12 },
  sm: { min: 14, max: 14 },
  base: { min: 16, max: 16 }, // Body text - 16px minimum for iOS
  lg: { min: 18, max: 18 },
  xl: { min: 18, max: 20 },
  '2xl': { min: 20, max: 24 },
  '3xl': { min: 24, max: 30 },
  '4xl': { min: 28, max: 36 },
  '5xl': { min: 32, max: 48 },
  '6xl': { min: 36, max: 60 },
} as const

export type FontSizeKey = keyof typeof FONT_SIZES

/**
 * Heading-specific font sizes
 */
export const HEADING_SIZES = {
  h1: { min: 32, max: 48 },
  h2: { min: 28, max: 36 },
  h3: { min: 24, max: 30 },
  h4: { min: 20, max: 24 },
  h5: { min: 18, max: 20 },
  h6: { min: 16, max: 18 },
} as const

export type HeadingLevel = keyof typeof HEADING_SIZES

/**
 * Line height scale
 * Tighter for headings, looser for body text
 */
export const LINE_HEIGHTS = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 1.75,
  // Mobile-optimized line heights
  mobileBody: 1.7,
  mobileHeading: 1.3,
} as const

export type LineHeightKey = keyof typeof LINE_HEIGHTS

// ============================================
// Fluid Typography Functions
// ============================================

/**
 * Generate a CSS clamp() value for fluid font sizing
 *
 * Uses the formula: clamp(min, preferred, max)
 * where preferred = min + (max - min) * ((100vw - minVw) / (maxVw - minVw))
 *
 * @param minSize - Minimum font size in pixels
 * @param maxSize - Maximum font size in pixels
 * @param minVw - Minimum viewport width (default: mobile breakpoint)
 * @param maxVw - Maximum viewport width (default: desktop breakpoint)
 * @returns CSS clamp() string
 *
 * @example
 * ```ts
 * fluidFontSize(16, 24) // 'clamp(16px, calc(16px + (24 - 16) * ((100vw - 320px) / (1440 - 320))), 24px)'
 * ```
 */
export function fluidFontSize(
  minSize: number,
  maxSize: number,
  minVw: number = 320,
  maxVw: number = BREAKPOINTS.desktop
): string {
  // If min equals max, no need for fluid sizing
  if (minSize === maxSize) {
    return `${minSize}px`
  }

  // Calculate the slope and intercept for linear interpolation
  const slope = (maxSize - minSize) / (maxVw - minVw)
  const intercept = minSize - slope * minVw

  // Convert to vw units for the preferred value
  const preferredVw = slope * 100
  const preferredPx = intercept

  // Format the preferred value
  const preferred =
    preferredPx >= 0
      ? `${preferredVw.toFixed(4)}vw + ${preferredPx.toFixed(2)}px`
      : `${preferredVw.toFixed(4)}vw - ${Math.abs(preferredPx).toFixed(2)}px`

  return `clamp(${minSize}px, calc(${preferred}), ${maxSize}px)`
}

/**
 * Get fluid font size for a predefined scale key
 *
 * @param key - Font size scale key
 * @returns CSS clamp() string
 */
export function getFluidFontSize(key: FontSizeKey): string {
  const { min, max } = FONT_SIZES[key]
  return fluidFontSize(min, max)
}

/**
 * Get fluid font size for a heading level
 *
 * @param level - Heading level (h1-h6)
 * @returns CSS clamp() string
 */
export function getHeadingFontSize(level: HeadingLevel): string {
  const { min, max } = HEADING_SIZES[level]
  return fluidFontSize(min, max)
}

/**
 * Calculate responsive line height based on font size and device
 *
 * Larger text can have tighter line height
 * Smaller text needs more line height for readability
 *
 * @param fontSize - Font size in pixels
 * @param isMobile - Whether on mobile device
 * @returns Line height value
 */
export function getResponsiveLineHeight(
  fontSize: number,
  isMobile: boolean = false
): number {
  // Mobile gets slightly more line height for readability
  const mobileBoost = isMobile ? 0.1 : 0

  if (fontSize >= 36) {
    return LINE_HEIGHTS.tight + mobileBoost
  }
  if (fontSize >= 24) {
    return LINE_HEIGHTS.snug + mobileBoost
  }
  if (fontSize >= 18) {
    return LINE_HEIGHTS.normal + mobileBoost
  }
  // Body text and smaller
  return LINE_HEIGHTS.relaxed + mobileBoost
}

/**
 * Get line height for a heading level
 *
 * @param level - Heading level
 * @param isMobile - Whether on mobile device
 * @returns Line height value
 */
export function getHeadingLineHeight(
  level: HeadingLevel,
  isMobile: boolean = false
): number {
  const { max } = HEADING_SIZES[level]
  return getResponsiveLineHeight(max, isMobile)
}

// ============================================
// Typography Validation Functions
// ============================================

/**
 * Minimum body text size for accessibility and iOS zoom prevention
 */
export const MIN_BODY_TEXT_SIZE = 16

/**
 * Check if a font size meets minimum body text requirements
 *
 * @param fontSize - Font size in pixels
 * @returns True if meets minimum
 */
export function meetsMinimumBodySize(fontSize: number): boolean {
  return fontSize >= MIN_BODY_TEXT_SIZE
}

/**
 * Compute the actual font size at a given viewport width
 * for a fluid font size configuration
 *
 * @param minSize - Minimum font size
 * @param maxSize - Maximum font size
 * @param viewportWidth - Current viewport width
 * @param minVw - Minimum viewport for scaling
 * @param maxVw - Maximum viewport for scaling
 * @returns Computed font size in pixels
 */
export function computeFluidFontSize(
  minSize: number,
  maxSize: number,
  viewportWidth: number,
  minVw: number = 320,
  maxVw: number = BREAKPOINTS.desktop
): number {
  // Below minimum viewport, use minimum size
  if (viewportWidth <= minVw) {
    return minSize
  }

  // Above maximum viewport, use maximum size
  if (viewportWidth >= maxVw) {
    return maxSize
  }

  // Linear interpolation between min and max
  const progress = (viewportWidth - minVw) / (maxVw - minVw)
  return minSize + (maxSize - minSize) * progress
}

/**
 * Compute heading font size at a given viewport width
 *
 * @param level - Heading level
 * @param viewportWidth - Current viewport width
 * @returns Computed font size in pixels
 */
export function computeHeadingFontSize(
  level: HeadingLevel,
  viewportWidth: number
): number {
  const { min, max } = HEADING_SIZES[level]
  return computeFluidFontSize(min, max, viewportWidth)
}

// ============================================
// CSS Variable Generation
// ============================================

/**
 * Generate CSS custom properties for fluid typography
 *
 * @returns Object with CSS variable names and values
 */
export function generateTypographyVariables(): Record<string, string> {
  const variables: Record<string, string> = {}

  // Font sizes
  for (const [key, { min, max }] of Object.entries(FONT_SIZES)) {
    variables[`--font-size-${key}`] = fluidFontSize(min, max)
  }

  // Heading sizes
  for (const [level, { min, max }] of Object.entries(HEADING_SIZES)) {
    variables[`--font-size-${level}`] = fluidFontSize(min, max)
  }

  // Line heights
  for (const [key, value] of Object.entries(LINE_HEIGHTS)) {
    variables[`--line-height-${key}`] = String(value)
  }

  return variables
}

export default {
  FONT_SIZES,
  HEADING_SIZES,
  LINE_HEIGHTS,
  MIN_BODY_TEXT_SIZE,
  fluidFontSize,
  getFluidFontSize,
  getHeadingFontSize,
  getResponsiveLineHeight,
  getHeadingLineHeight,
  meetsMinimumBodySize,
  computeFluidFontSize,
  computeHeadingFontSize,
  generateTypographyVariables,
}
