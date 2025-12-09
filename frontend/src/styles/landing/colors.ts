/**
 * Landing Page Brand Color Palette
 * 
 * Enterprise-grade color system for the 2025 landing page.
 * No gradients, no cyan, no purple - intentional brand-specific palette.
 * 
 * @module styles/landing/colors
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

export const LANDING_COLORS = {
  // Backgrounds - Slightly darker for more contrast
  bgDeep: '#09090B',      // Deepest background - page base
  bgMid: '#111113',       // Elevated surfaces, alternate sections
  bgLight: '#18181B',     // Cards, containers
  surface: '#1F1F23',     // Interactive elements, hover states

  // Borders - Refined opacity levels for subtle layering
  borderSubtle: 'rgba(255, 255, 255, 0.06)',   // Dividers, footer border
  borderDefault: 'rgba(255, 255, 255, 0.08)', // Default card borders
  borderStrong: 'rgba(255, 255, 255, 0.12)',  // Emphasized borders
  borderHover: 'rgba(255, 255, 255, 0.16)',   // Hover state borders

  // Text - Better contrast hierarchy
  textPrimary: '#FFFFFF',    // Headings, important content
  textSecondary: '#B4B4B4',  // Body text, descriptions (improved contrast)
  textMuted: '#737373',      // Captions, metadata (improved contrast)
  textDisabled: '#525252',   // Inactive states

  // Accents - Warmer orange for enterprise feel
  accentPrimary: '#F97316',    // Warmer orange - CTAs, highlights
  accentHover: '#FB923C',      // Lighter orange for hover states
  accentSecondary: '#DC2626',  // Deep red - arena theme
  accentTertiary: '#F59E0B',   // Amber - rewards, premium
  accentMuted: 'rgba(249, 115, 22, 0.10)', // Subtle accent backgrounds

  // Semantic - Feedback colors
  success: '#22C55E',
  warning: '#EAB308',
  error: '#EF4444',
} as const

export type LandingColor = keyof typeof LANDING_COLORS
export type LandingColorValue = typeof LANDING_COLORS[LandingColor]

/**
 * Get a landing color value by key
 */
export function getLandingColor(key: LandingColor): string {
  return LANDING_COLORS[key]
}

/**
 * Check if a color is in the forbidden list (cyan, purple, gradients)
 * Used for testing compliance with Requirements 1.4
 */
export function isForbiddenColor(color: string): boolean {
  const lowerColor = color.toLowerCase()
  
  // Check for gradients
  if (lowerColor.includes('gradient')) {
    return true
  }
  
  // Check for cyan hues (approximate)
  const cyanPatterns = [
    /^#00[f-f]{2}[f-f]{2}$/i,  // #00FFFF and similar
    /^#0[0-9a-f][f-f]{2}[f-f]{2}$/i,
    /rgb\s*\(\s*0\s*,\s*[2-9]\d{2}\s*,\s*[2-9]\d{2}\s*\)/i,
    /cyan/i,
  ]
  
  // Check for purple hues (approximate)
  const purplePatterns = [
    /^#[8-9a-f][0-9a-f]5[c-f][f-f][0-9a-f]$/i,  // #8B5CF6 and similar
    /purple/i,
    /violet/i,
    /indigo/i,
  ]
  
  for (const pattern of [...cyanPatterns, ...purplePatterns]) {
    if (pattern.test(lowerColor)) {
      return true
    }
  }
  
  return false
}
