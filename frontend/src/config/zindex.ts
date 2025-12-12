/**
 * Z-Index Configuration
 * 
 * Centralized z-index values matching tokens.css.
 * Use these constants instead of hardcoded z-index values.
 * 
 * @module config/zindex
 */

/**
 * Z-index scale matching tokens.css
 * Use these for consistent layering across the app
 */
export const Z_INDEX = {
  /** Base level (0) */
  base: 0,
  /** Dropdowns, popovers (100) */
  dropdown: 100,
  /** Sticky headers, sidebars (200) */
  sticky: 200,
  /** Modal backdrop (300) */
  modalBackdrop: 300,
  /** Modal content (400) */
  modal: 400,
  /** Tooltips (500) */
  tooltip: 500,
  /** Toast notifications (600) */
  toast: 600,
  /** Confetti, celebrations (700) */
  confetti: 700,
} as const

/**
 * Tailwind class mappings for z-index
 * Use these in className strings
 */
export const Z_CLASS = {
  base: 'z-0',
  dropdown: 'z-[100]',
  sticky: 'z-[200]',
  modalBackdrop: 'z-[300]',
  modal: 'z-[400]',
  tooltip: 'z-[500]',
  toast: 'z-[600]',
  confetti: 'z-[700]',
} as const

/**
 * Get z-index value by name
 */
export function getZIndex(level: keyof typeof Z_INDEX): number {
  return Z_INDEX[level]
}

/**
 * Get z-index class by name
 */
export function getZClass(level: keyof typeof Z_CLASS): string {
  return Z_CLASS[level]
}
