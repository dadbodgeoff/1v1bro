/**
 * Landing Page Typography Scale
 * 
 * Enterprise-grade 8-level typography system with desktop and mobile variants.
 * Uses Inter font family with system fallbacks.
 * 
 * @module styles/landing/typography
 * Requirements: 2.1, 2.4
 */

export interface TypographyStyle {
  fontSize: string
  lineHeight: string
  letterSpacing: string
  fontWeight: number
}

export interface TypographyLevel {
  desktop: TypographyStyle
  mobile: TypographyStyle
}

export const TYPOGRAPHY: Record<string, TypographyLevel> = {
  // Hero headline - larger, tighter tracking for enterprise feel
  display: {
    desktop: {
      fontSize: '72px',
      lineHeight: '80px',
      letterSpacing: '-0.03em',
      fontWeight: 800,
    },
    mobile: {
      fontSize: '48px',
      lineHeight: '56px',
      letterSpacing: '-0.03em',
      fontWeight: 800,
    },
  },
  // Section headers - refined
  h1: {
    desktop: {
      fontSize: '48px',
      lineHeight: '56px',
      letterSpacing: '-0.02em',
      fontWeight: 700,
    },
    mobile: {
      fontSize: '36px',
      lineHeight: '44px',
      letterSpacing: '-0.02em',
      fontWeight: 700,
    },
  },
  // Section titles - larger for better hierarchy
  h2: {
    desktop: {
      fontSize: '40px',
      lineHeight: '48px',
      letterSpacing: '-0.02em',
      fontWeight: 700,
    },
    mobile: {
      fontSize: '32px',
      lineHeight: '40px',
      letterSpacing: '-0.02em',
      fontWeight: 700,
    },
  },
  // Card titles, step titles
  h3: {
    desktop: {
      fontSize: '28px',
      lineHeight: '36px',
      letterSpacing: '-0.01em',
      fontWeight: 600,
    },
    mobile: {
      fontSize: '24px',
      lineHeight: '32px',
      letterSpacing: '-0.01em',
      fontWeight: 600,
    },
  },
  // Feature card titles
  h4: {
    desktop: {
      fontSize: '24px',
      lineHeight: '32px',
      letterSpacing: '-0.01em',
      fontWeight: 600,
    },
    mobile: {
      fontSize: '20px',
      lineHeight: '28px',
      letterSpacing: '-0.01em',
      fontWeight: 600,
    },
  },
  // Subheadlines, descriptions
  bodyLarge: {
    desktop: {
      fontSize: '18px',
      lineHeight: '28px',
      letterSpacing: '0em',
      fontWeight: 400,
    },
    mobile: {
      fontSize: '17px',
      lineHeight: '26px',
      letterSpacing: '0em',
      fontWeight: 400,
    },
  },
  // Body text - slightly larger for better readability
  body: {
    desktop: {
      fontSize: '17px',
      lineHeight: '28px',
      letterSpacing: '0em',
      fontWeight: 400,
    },
    mobile: {
      fontSize: '16px',
      lineHeight: '26px',
      letterSpacing: '0em',
      fontWeight: 400,
    },
  },
  // Captions, trust lines
  caption: {
    desktop: {
      fontSize: '14px',
      lineHeight: '20px',
      letterSpacing: '0.02em',
      fontWeight: 500,
    },
    mobile: {
      fontSize: '13px',
      lineHeight: '18px',
      letterSpacing: '0.02em',
      fontWeight: 500,
    },
  },
} as const

export type TypographyLevelName = keyof typeof TYPOGRAPHY

/**
 * All valid typography level names
 */
export const TYPOGRAPHY_LEVELS: TypographyLevelName[] = [
  'display',
  'h1',
  'h2',
  'h3',
  'h4',
  'bodyLarge',
  'body',
  'caption',
]

/**
 * Get typography styles for a given level and viewport
 */
export function getTypographyStyle(
  level: TypographyLevelName,
  viewport: 'desktop' | 'mobile' = 'desktop'
): TypographyStyle {
  return TYPOGRAPHY[level][viewport]
}

/**
 * Generate Tailwind-compatible class string for typography level
 */
export function getTypographyClasses(level: TypographyLevelName): string {
  const style = TYPOGRAPHY[level].desktop
  
  // Map font weights to Tailwind classes
  const weightMap: Record<number, string> = {
    400: 'font-normal',
    500: 'font-medium',
    600: 'font-semibold',
    700: 'font-bold',
    800: 'font-extrabold',
  }
  
  return `${weightMap[style.fontWeight] || 'font-normal'}`
}

/**
 * Check if a typography style matches one of the defined levels
 */
export function isValidTypographyStyle(style: TypographyStyle): boolean {
  for (const level of TYPOGRAPHY_LEVELS) {
    const desktopStyle = TYPOGRAPHY[level].desktop
    const mobileStyle = TYPOGRAPHY[level].mobile
    
    if (
      (style.fontSize === desktopStyle.fontSize &&
        style.lineHeight === desktopStyle.lineHeight &&
        style.fontWeight === desktopStyle.fontWeight) ||
      (style.fontSize === mobileStyle.fontSize &&
        style.lineHeight === mobileStyle.lineHeight &&
        style.fontWeight === mobileStyle.fontWeight)
    ) {
      return true
    }
  }
  return false
}
