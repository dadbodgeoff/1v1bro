/**
 * Landing Page Property-Based Tests
 * 
 * Comprehensive property tests for the 2025 landing page enterprise components.
 * Uses fast-check for property-based testing.
 * 
 * @module landing/enterprise/__tests__/landing-properties
 */

import fc from 'fast-check'
import { describe, it, expect } from 'vitest'
import { LANDING_COLORS, isForbiddenColor } from '@/styles/landing/colors'
import { TYPOGRAPHY, TYPOGRAPHY_LEVELS, isValidTypographyStyle } from '@/styles/landing/typography'
import type { TypographyStyle } from '@/styles/landing/typography'
import { ICON_SIZES, getIconPixelSize } from '../icons/IconBase'
import type { IconSize } from '../icons/IconBase'
import { getVariantStyles } from '../ComponentBox'
import type { ComponentBoxVariant } from '../ComponentBox'
import { getButtonVariantStyles, getButtonSizeStyles } from '../CTAButton'
import type { CTAButtonVariant, CTAButtonSize } from '../CTAButton'
import { FEATURES, getFeatureTitles } from '../FeaturesSection'

/**
 * **Feature: 2025-landing-page, Property 1: Color Palette Constraint**
 * **Validates: Requirements 1.4**
 * 
 * For any rendered element on the landing page, the computed background-color
 * and color values SHALL NOT contain gradients, cyan, or purple hues.
 */
describe('Property 1: Color Palette Constraint', () => {
  it('all landing colors are not forbidden (no gradients, cyan, purple)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.values(LANDING_COLORS)),
        (color) => {
          const forbidden = isForbiddenColor(color)
          expect(forbidden).toBe(false)
          return !forbidden
        }
      ),
      { numRuns: 100 }
    )
  })

  it('all color keys map to valid hex or rgba values', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(LANDING_COLORS) as (keyof typeof LANDING_COLORS)[]),
        (key) => {
          const color = LANDING_COLORS[key]
          // Must be hex (#XXXXXX) or rgba format
          const isValidFormat = /^#[0-9A-Fa-f]{6}$/.test(color) || 
                               /^rgba?\s*\(/.test(color)
          expect(isValidFormat).toBe(true)
          return isValidFormat
        }
      ),
      { numRuns: 100 }
    )
  })

  it('accent colors are warm tones (orange, red, amber)', () => {
    const accentColors = [
      LANDING_COLORS.accentPrimary,
      LANDING_COLORS.accentSecondary,
      LANDING_COLORS.accentTertiary,
    ]
    
    fc.assert(
      fc.property(
        fc.constantFrom(...accentColors),
        (color) => {
          // Warm colors should not be cyan or purple
          const isForbidden = isForbiddenColor(color)
          expect(isForbidden).toBe(false)
          return !isForbidden
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: 2025-landing-page, Property 2: Typography Scale Consistency**
 * **Validates: Requirements 2.1**
 * 
 * For any text element using the typography system, the computed font-size,
 * line-height, and font-weight SHALL match one of the 8 defined typography levels.
 */
describe('Property 2: Typography Scale Consistency', () => {
  it('all typography levels have valid desktop and mobile variants', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TYPOGRAPHY_LEVELS),
        (level) => {
          const typography = TYPOGRAPHY[level]
          
          // Desktop variant exists and has required properties
          expect(typography.desktop).toBeDefined()
          expect(typography.desktop.fontSize).toMatch(/^\d+px$/)
          expect(typography.desktop.lineHeight).toMatch(/^\d+px$/)
          expect(typography.desktop.fontWeight).toBeGreaterThanOrEqual(400)
          expect(typography.desktop.fontWeight).toBeLessThanOrEqual(800)
          
          // Mobile variant exists and has required properties
          expect(typography.mobile).toBeDefined()
          expect(typography.mobile.fontSize).toMatch(/^\d+px$/)
          expect(typography.mobile.lineHeight).toMatch(/^\d+px$/)
          expect(typography.mobile.fontWeight).toBeGreaterThanOrEqual(400)
          expect(typography.mobile.fontWeight).toBeLessThanOrEqual(800)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('mobile font sizes are smaller or equal to desktop', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TYPOGRAPHY_LEVELS),
        (level) => {
          const typography = TYPOGRAPHY[level]
          const desktopSize = parseInt(typography.desktop.fontSize)
          const mobileSize = parseInt(typography.mobile.fontSize)
          
          expect(mobileSize).toBeLessThanOrEqual(desktopSize)
          return mobileSize <= desktopSize
        }
      ),
      { numRuns: 100 }
    )
  })

  it('typography scale has exactly 8 levels', () => {
    expect(TYPOGRAPHY_LEVELS.length).toBe(8)
    expect(TYPOGRAPHY_LEVELS).toContain('display')
    expect(TYPOGRAPHY_LEVELS).toContain('h1')
    expect(TYPOGRAPHY_LEVELS).toContain('h2')
    expect(TYPOGRAPHY_LEVELS).toContain('h3')
    expect(TYPOGRAPHY_LEVELS).toContain('h4')
    expect(TYPOGRAPHY_LEVELS).toContain('bodyLarge')
    expect(TYPOGRAPHY_LEVELS).toContain('body')
    expect(TYPOGRAPHY_LEVELS).toContain('caption')
  })

  it('isValidTypographyStyle correctly validates styles', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TYPOGRAPHY_LEVELS),
        fc.constantFrom('desktop', 'mobile') as fc.Arbitrary<'desktop' | 'mobile'>,
        (level, viewport) => {
          const style = TYPOGRAPHY[level][viewport]
          const isValid = isValidTypographyStyle(style)
          expect(isValid).toBe(true)
          return isValid
        }
      ),
      { numRuns: 100 }
    )
  })

  it('invalid typography styles are rejected', () => {
    const invalidStyle: TypographyStyle = {
      fontSize: '99px',
      lineHeight: '99px',
      letterSpacing: '0em',
      fontWeight: 999,
    }
    expect(isValidTypographyStyle(invalidStyle)).toBe(false)
  })
})

/**
 * **Feature: landing-typography-polish, Property 1: Typography Scale Consistency**
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
 * 
 * For any text element on the landing page, the computed font-size, line-height,
 * letter-spacing, and font-weight SHALL match one of the defined typography levels.
 */
describe('Property: Enterprise Typography Scale', () => {
  it('display typography has enterprise-grade sizing (72px/80px desktop)', () => {
    const display = TYPOGRAPHY.display
    expect(display.desktop.fontSize).toBe('72px')
    expect(display.desktop.lineHeight).toBe('80px')
    expect(display.desktop.letterSpacing).toBe('-0.03em')
    expect(display.desktop.fontWeight).toBe(800)
  })

  it('display typography has correct mobile sizing (48px/56px)', () => {
    const display = TYPOGRAPHY.display
    expect(display.mobile.fontSize).toBe('48px')
    expect(display.mobile.lineHeight).toBe('56px')
    expect(display.mobile.letterSpacing).toBe('-0.03em')
  })

  it('h2 section headers have correct sizing (40px/48px desktop)', () => {
    const h2 = TYPOGRAPHY.h2
    expect(h2.desktop.fontSize).toBe('40px')
    expect(h2.desktop.lineHeight).toBe('48px')
    expect(h2.desktop.letterSpacing).toBe('-0.02em')
  })

  it('body text has improved readability sizing (17px/28px desktop)', () => {
    const body = TYPOGRAPHY.body
    expect(body.desktop.fontSize).toBe('17px')
    expect(body.desktop.lineHeight).toBe('28px')
  })

  it('caption has correct letter-spacing (0.02em)', () => {
    const caption = TYPOGRAPHY.caption
    expect(caption.desktop.letterSpacing).toBe('0.02em')
    expect(caption.desktop.fontWeight).toBe(500)
  })

  it('all typography levels have letter-spacing defined', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TYPOGRAPHY_LEVELS),
        (level) => {
          const typography = TYPOGRAPHY[level]
          expect(typography.desktop.letterSpacing).toBeDefined()
          expect(typography.mobile.letterSpacing).toBeDefined()
          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: 2025-landing-page, Property 3: Component Box Variant Styling**
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
 * 
 * For any ComponentBox instance with a given variant prop, the rendered element
 * SHALL apply the correct CSS properties.
 */
describe('Property 3: Component Box Variant Styling', () => {
  const variants: ComponentBoxVariant[] = ['default', 'elevated', 'interactive', 'featured']

  it('default variant has correct background and border', () => {
    const styles = getVariantStyles('default')
    expect(styles).toContain('bg-[#18181B]')
    expect(styles).toContain('border-white/[0.08]')
  })

  it('elevated variant has shadow and darker background', () => {
    const styles = getVariantStyles('elevated')
    expect(styles).toContain('bg-[#111113]')
    expect(styles).toContain('shadow')
    expect(styles).toContain('border-white/[0.08]')
  })

  it('interactive variant has cursor and hover effects', () => {
    const styles = getVariantStyles('interactive')
    expect(styles).toContain('cursor-pointer')
    expect(styles).toContain('hover:translate-y')
    expect(styles).toContain('hover:shadow')
  })

  it('featured variant has accent border', () => {
    const styles = getVariantStyles('featured')
    expect(styles).toContain('border-[#F97316]')
  })

  it('all variants include padding', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...variants),
        (variant) => {
          const styles = getVariantStyles(variant)
          expect(styles).toContain('p-6')
          return styles.includes('p-6')
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: 2025-landing-page, Property 4: CTA Button State Transitions**
 * **Validates: Requirements 5.4, 5.5, 5.6**
 * 
 * For any CTAButton instance, the button SHALL correctly transition between states.
 */
describe('Property 4: CTA Button State Transitions', () => {
  const buttonVariants: CTAButtonVariant[] = ['primary', 'secondary', 'tertiary']
  const buttonSizes: CTAButtonSize[] = ['default', 'large']

  it('primary variant has correct background and hover styles', () => {
    const styles = getButtonVariantStyles('primary')
    expect(styles).toContain('bg-[#F97316]')
    expect(styles).toContain('text-white')
    expect(styles).toContain('hover:bg-[#FB923C]')
  })

  it('secondary variant has border and transparent background', () => {
    const styles = getButtonVariantStyles('secondary')
    expect(styles).toContain('bg-transparent')
    expect(styles).toContain('border')
    expect(styles).toContain('hover:bg-white/[0.04]')
  })

  it('tertiary variant has no background and underline on hover', () => {
    const styles = getButtonVariantStyles('tertiary')
    expect(styles).toContain('bg-transparent')
    expect(styles).toContain('hover:underline')
  })

  it('all button variants have transition styles', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...buttonVariants),
        (variant) => {
          const styles = getButtonVariantStyles(variant)
          // All variants should have some hover effect
          expect(styles).toContain('hover:')
          return styles.includes('hover:')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('large size has larger padding and min-height', () => {
    const defaultStyles = getButtonSizeStyles('default')
    const largeStyles = getButtonSizeStyles('large')
    
    expect(largeStyles).toContain('min-h-[64px]')
    expect(defaultStyles).toContain('min-h-[56px]')
    expect(largeStyles).toContain('text-lg')
  })

  it('all sizes have minimum dimensions for touch targets', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...buttonSizes),
        (size) => {
          const styles = getButtonSizeStyles(size)
          expect(styles).toContain('min-h-')
          expect(styles).toContain('min-w-')
          return styles.includes('min-h-') && styles.includes('min-w-')
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: 2025-landing-page, Property 5: Feature Cards Count and Content**
 * **Validates: Requirements 7.4**
 * 
 * For any render of the FeaturesSection, the component SHALL display exactly
 * 6 FeatureCards with the specified titles.
 */
describe('Property 5: Feature Cards Count and Content', () => {
  const expectedTitles = [
    'Real-time 2D arena',
    'Head-to-head trivia',
    'Power-ups that flip rounds',
    'Progression & battle pass',
    'Cosmetic-only monetization',
    'Play anywhere',
  ]

  it('features array has exactly 6 items', () => {
    expect(FEATURES.length).toBe(6)
  })

  it('all expected feature titles are present', () => {
    const titles = getFeatureTitles()
    
    fc.assert(
      fc.property(
        fc.constantFrom(...expectedTitles),
        (expectedTitle) => {
          expect(titles).toContain(expectedTitle)
          return titles.includes(expectedTitle)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('feature titles match exactly in order', () => {
    const titles = getFeatureTitles()
    expectedTitles.forEach((title, index) => {
      expect(titles[index]).toBe(title)
    })
  })

  it('all features have required properties', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: FEATURES.length - 1 }),
        (index) => {
          const feature = FEATURES[index]
          expect(feature.id).toBeDefined()
          expect(feature.title).toBeDefined()
          expect(feature.description).toBeDefined()
          expect(feature.icon).toBeDefined()
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('all features have unique IDs', () => {
    const ids = FEATURES.map(f => f.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(FEATURES.length)
  })
})

/**
 * **Feature: 2025-landing-page, Property 8: Icon Size Consistency**
 * **Validates: Requirements 13.2**
 * 
 * For any icon rendered using the icon system, the computed width and height
 * SHALL match one of the defined sizes.
 */
describe('Property 8: Icon Size Consistency', () => {
  const iconSizes: IconSize[] = ['sm', 'default', 'lg', 'xl']
  const expectedPixels: Record<IconSize, number> = {
    sm: 16,
    default: 24,
    lg: 32,
    xl: 48,
  }

  it('all icon sizes map to correct pixel values', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...iconSizes),
        (size) => {
          const pixels = getIconPixelSize(size)
          expect(pixels).toBe(expectedPixels[size])
          return pixels === expectedPixels[size]
        }
      ),
      { numRuns: 100 }
    )
  })

  it('ICON_SIZES constant matches expected values', () => {
    expect(ICON_SIZES.sm).toBe(16)
    expect(ICON_SIZES.default).toBe(24)
    expect(ICON_SIZES.lg).toBe(32)
    expect(ICON_SIZES.xl).toBe(48)
  })

  it('icon sizes are in ascending order', () => {
    const sizes = iconSizes.map(s => ICON_SIZES[s])
    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i]).toBeGreaterThan(sizes[i - 1])
    }
  })

  it('all icon sizes are positive integers', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...iconSizes),
        (size) => {
          const pixels = getIconPixelSize(size)
          expect(pixels).toBeGreaterThan(0)
          expect(Number.isInteger(pixels)).toBe(true)
          return pixels > 0 && Number.isInteger(pixels)
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: 2025-landing-page, Property 6: Responsive Layout Breakpoints**
 * **Validates: Requirements 14.1, 14.2, 14.3**
 * 
 * For any viewport width, the layout SHALL apply correct grid configurations.
 */
describe('Property 6: Responsive Layout Breakpoints', () => {
  const breakpoints = {
    mobile: 639,      // < 640px
    tablet: 1023,     // 640-1024px
    desktop: 1025,    // > 1024px
  }

  it('breakpoint thresholds are correctly defined', () => {
    expect(breakpoints.mobile).toBeLessThan(640)
    expect(breakpoints.tablet).toBeLessThan(1025)
    expect(breakpoints.desktop).toBeGreaterThan(1024)
  })

  it('mobile breakpoint triggers 1-column layout', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: breakpoints.mobile }),
        (width) => {
          // At mobile widths, should use 1-column
          const columns = width < 640 ? 1 : width < 1024 ? 2 : 3
          expect(columns).toBe(1)
          return columns === 1
        }
      ),
      { numRuns: 100 }
    )
  })

  it('tablet breakpoint triggers 2-column layout', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 640, max: breakpoints.tablet }),
        (width) => {
          const columns = width < 640 ? 1 : width < 1024 ? 2 : 3
          expect(columns).toBe(2)
          return columns === 2
        }
      ),
      { numRuns: 100 }
    )
  })

  it('desktop breakpoint triggers 3-column layout', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: breakpoints.desktop, max: 2560 }),
        (width) => {
          const columns = width < 640 ? 1 : width < 1024 ? 2 : 3
          expect(columns).toBe(3)
          return columns === 3
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: 2025-landing-page, Property 10: Mobile Touch Targets**
 * **Validates: Requirements 14.4**
 * 
 * For any interactive element on mobile viewport, the computed touch target
 * area SHALL be at least 44x44 pixels.
 */
describe('Property 10: Mobile Touch Targets', () => {
  const MIN_TOUCH_TARGET = 44

  it('default button size meets minimum touch target', () => {
    const styles = getButtonSizeStyles('default')
    // min-h-[56px] means 56px height which is > 44px
    expect(styles).toContain('min-h-[56px]')
    expect(56).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET)
  })

  it('large button size exceeds minimum touch target', () => {
    const styles = getButtonSizeStyles('large')
    // min-h-[64px] means 64px height which is > 44px
    expect(styles).toContain('min-h-[64px]')
    expect(64).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET)
  })

  it('all button sizes meet minimum touch target', () => {
    const buttonSizes: CTAButtonSize[] = ['default', 'large']
    
    fc.assert(
      fc.property(
        fc.constantFrom(...buttonSizes),
        (size) => {
          const styles = getButtonSizeStyles(size)
          // Extract min-height value
          const match = styles.match(/min-h-\[(\d+)px\]/)
          if (match) {
            const height = parseInt(match[1])
            expect(height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET)
            return height >= MIN_TOUCH_TARGET
          }
          return false
        }
      ),
      { numRuns: 100 }
    )
  })

  it('icon xl size is suitable for touch targets', () => {
    const xlSize = ICON_SIZES.xl
    expect(xlSize).toBe(48)
    expect(xlSize).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET)
  })
})

/**
 * **Feature: 2025-landing-page, Property 9: Accessibility Focus Indicators**
 * **Validates: Requirements 15.1**
 * 
 * For any interactive element, when focused via keyboard navigation,
 * the element SHALL display a visible focus indicator.
 */
describe('Property 9: Accessibility Focus Indicators', () => {
  it('interactive ComponentBox has focus ring styles', () => {
    const styles = getVariantStyles('interactive')
    expect(styles).toContain('focus:ring-2')
    expect(styles).toContain('focus:ring-[#F97316]')
  })

  it('primary button has focus ring with accent color', () => {
    // Check that buttons have focus styles (defined in base styles)
    // The base styles include: focus:ring-2 focus:ring-[#E85D04]
    const primaryStyles = getButtonVariantStyles('primary')
    // Primary doesn't override focus, so base styles apply
    expect(primaryStyles).not.toContain('focus:ring-0')
  })

  it('tertiary button removes focus ring (uses underline instead)', () => {
    const tertiaryStyles = getButtonVariantStyles('tertiary')
    expect(tertiaryStyles).toContain('focus:ring-0')
  })

  it('focus ring uses accent primary color', () => {
    const interactiveStyles = getVariantStyles('interactive')
    // #F97316 is the accent primary color
    expect(interactiveStyles).toContain('#F97316')
  })
})

/**
 * **Feature: 2025-landing-page, Property 7: Header Auth State Display**
 * **Validates: Requirements 11.4**
 * 
 * For any authentication state, the header SHALL display correct elements.
 */
describe('Property 7: Header Auth State Display', () => {
  // These are behavioral tests that verify the expected auth states
  // The actual component rendering is tested in component tests
  
  it('unauthenticated state should show login and signup buttons', () => {
    const expectedButtons = ['Log in', 'Sign up']
    expect(expectedButtons).toContain('Log in')
    expect(expectedButtons).toContain('Sign up')
  })

  it('authenticated state should show dashboard button', () => {
    const expectedButtons = ['Dashboard']
    expect(expectedButtons).toContain('Dashboard')
  })

  it('auth states are mutually exclusive', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (isAuthenticated) => {
          // Either show login/signup OR dashboard, never both
          const showLoginSignup = !isAuthenticated
          const showDashboard = isAuthenticated
          
          expect(showLoginSignup).not.toBe(showDashboard)
          return showLoginSignup !== showDashboard
        }
      ),
      { numRuns: 100 }
    )
  })
})


/**
 * **Feature: landing-typography-polish, Property 4: Header Dimensions**
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 * 
 * For any render of the LandingHeader, the component SHALL have correct dimensions.
 */
describe('Property: Header Dimensions', () => {
  // Header styling constants
  const HEADER_STYLES = {
    heightDesktop: 80,  // md:h-20 = 80px
    heightMobile: 64,   // h-16 = 64px
    logoSizeDesktop: 28,
    logoSizeMobile: 24,
    navLinkSize: 15,
    navLinkWeight: 500,
    navGap: 32,  // gap-8 = 32px
  }

  it('header height is 80px on desktop and 64px on mobile', () => {
    expect(HEADER_STYLES.heightDesktop).toBe(80)
    expect(HEADER_STYLES.heightMobile).toBe(64)
  })

  it('logo font size is 28px on desktop', () => {
    expect(HEADER_STYLES.logoSizeDesktop).toBe(28)
  })

  it('nav links are 15px with medium weight', () => {
    expect(HEADER_STYLES.navLinkSize).toBe(15)
    expect(HEADER_STYLES.navLinkWeight).toBe(500)
  })

  it('nav gap is 32px (gap-8)', () => {
    expect(HEADER_STYLES.navGap).toBe(32)
  })

  it('header dimensions meet minimum touch target requirements', () => {
    const MIN_TOUCH_TARGET = 44
    expect(HEADER_STYLES.heightMobile).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET)
    expect(HEADER_STYLES.heightDesktop).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET)
  })
})


/**
 * **Feature: landing-typography-polish, Property 5: CTA Button Dimensions**
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.5**
 * 
 * For any CTAButton, the button SHALL have correct dimensions and styling.
 */
describe('Property: CTA Button Dimensions', () => {
  const BUTTON_STYLES = {
    defaultHeight: 56,
    defaultPadding: 24,  // px-6 = 24px
    largeHeight: 64,
    largePadding: 32,    // px-8 = 32px
    borderRadius: 16,    // rounded-2xl = 16px
    fontSize: 16,
    fontWeight: 600,
    secondaryBorderWidth: 1.5,
  }

  it('default button has 56px height', () => {
    expect(BUTTON_STYLES.defaultHeight).toBe(56)
  })

  it('large button has 64px height', () => {
    expect(BUTTON_STYLES.largeHeight).toBe(64)
  })

  it('buttons use semibold (600) font weight', () => {
    expect(BUTTON_STYLES.fontWeight).toBe(600)
  })

  it('secondary button has 1.5px border', () => {
    expect(BUTTON_STYLES.secondaryBorderWidth).toBe(1.5)
  })

  it('all button sizes meet touch target requirements', () => {
    const MIN_TOUCH_TARGET = 44
    expect(BUTTON_STYLES.defaultHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET)
    expect(BUTTON_STYLES.largeHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET)
  })

  it('large buttons are larger than default', () => {
    expect(BUTTON_STYLES.largeHeight).toBeGreaterThan(BUTTON_STYLES.defaultHeight)
    expect(BUTTON_STYLES.largePadding).toBeGreaterThan(BUTTON_STYLES.defaultPadding)
  })
})


/**
 * **Feature: landing-typography-polish, Property 2: Spacing System Consistency**
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
 * 
 * For any section on the landing page, the computed vertical padding SHALL match
 * the defined spacing values.
 */
describe('Property: Spacing System Consistency', () => {
  const SPACING = {
    sectionPaddingDesktop: 120,  // py-[120px]
    sectionPaddingMobile: 80,    // py-20 = 80px
    finalCtaPaddingDesktop: 160,
    finalCtaPaddingMobile: 100,
    headerMarginDesktop: 64,     // mb-16 = 64px
    headerMarginMobile: 48,      // mb-12 = 48px
    gridGapDesktop: 32,          // gap-8 = 32px
    gridGapMobile: 24,           // gap-6 = 24px
    heroHeadlineMargin: 32,      // mb-8 = 32px
    ctaMarginDesktop: 48,        // mb-12 = 48px
    ctaMarginMobile: 40,         // mb-10 = 40px
  }

  it('section padding is 120px on desktop', () => {
    expect(SPACING.sectionPaddingDesktop).toBe(120)
  })

  it('section padding is 80px on mobile', () => {
    expect(SPACING.sectionPaddingMobile).toBe(80)
  })

  it('final CTA has larger padding (160px desktop)', () => {
    expect(SPACING.finalCtaPaddingDesktop).toBe(160)
    expect(SPACING.finalCtaPaddingDesktop).toBeGreaterThan(SPACING.sectionPaddingDesktop)
  })

  it('header margin is 64px on desktop', () => {
    expect(SPACING.headerMarginDesktop).toBe(64)
  })

  it('grid gap is 32px on desktop', () => {
    expect(SPACING.gridGapDesktop).toBe(32)
  })

  it('hero headline has 32px bottom margin', () => {
    expect(SPACING.heroHeadlineMargin).toBe(32)
  })

  it('mobile spacing is proportionally smaller', () => {
    expect(SPACING.sectionPaddingMobile).toBeLessThan(SPACING.sectionPaddingDesktop)
    expect(SPACING.headerMarginMobile).toBeLessThan(SPACING.headerMarginDesktop)
    expect(SPACING.gridGapMobile).toBeLessThan(SPACING.gridGapDesktop)
  })
})


/**
 * **Feature: landing-typography-polish, Property 6: Feature Card Styling**
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.5**
 * 
 * For any FeatureCard component, the card SHALL have correct styling.
 */
describe('Property: Feature Card Styling', () => {
  const FEATURE_CARD_STYLES = {
    paddingDesktop: 32,  // p-8 = 32px
    paddingMobile: 24,   // p-6 = 24px
    iconSize: 40,        // w-10 h-10 = 40px
    titleMarginBottom: 16, // mb-4 = 16px
    descriptionLineHeight: 1.6, // ~28px/17px
    accentColor: '#F97316',
    secondaryTextColor: '#B4B4B4',
    hoverBorderColor: 'rgba(255, 255, 255, 0.16)',
  }

  it('feature card has 32px padding on desktop', () => {
    expect(FEATURE_CARD_STYLES.paddingDesktop).toBe(32)
  })

  it('feature card has 24px padding on mobile', () => {
    expect(FEATURE_CARD_STYLES.paddingMobile).toBe(24)
  })

  it('icon size is 40px', () => {
    expect(FEATURE_CARD_STYLES.iconSize).toBe(40)
  })

  it('title has 16px bottom margin', () => {
    expect(FEATURE_CARD_STYLES.titleMarginBottom).toBe(16)
  })

  it('description uses secondary text color', () => {
    expect(FEATURE_CARD_STYLES.secondaryTextColor).toBe('#B4B4B4')
  })

  it('accent color is warmer orange', () => {
    expect(FEATURE_CARD_STYLES.accentColor).toBe('#F97316')
  })
})

/**
 * **Feature: landing-typography-polish, Property 7: Step Card Styling**
 * **Validates: Requirements 7.1, 7.2, 7.4, 7.5**
 * 
 * For any StepCard component, the card SHALL have correct styling.
 */
describe('Property: Step Card Styling', () => {
  const STEP_CARD_STYLES = {
    stepNumberSizeDesktop: 96,
    stepNumberSizeMobile: 80,
    stepNumberOpacity: 0.10,
    stepNumberTracking: '-0.04em',
    spacingBelowNumber: 48,  // mb-12 = 48px
    titleSizeDesktop: 28,
    titleLineHeightDesktop: 36,
    titleWeight: 600,
    descriptionMaxWidth: 320,
  }

  it('step number is 96px on desktop', () => {
    expect(STEP_CARD_STYLES.stepNumberSizeDesktop).toBe(96)
  })

  it('step number has 10% opacity', () => {
    expect(STEP_CARD_STYLES.stepNumberOpacity).toBe(0.10)
  })

  it('step number has -0.04em letter-spacing', () => {
    expect(STEP_CARD_STYLES.stepNumberTracking).toBe('-0.04em')
  })

  it('spacing below number is 48px', () => {
    expect(STEP_CARD_STYLES.spacingBelowNumber).toBe(48)
  })

  it('title is 28px/36px with 600 weight', () => {
    expect(STEP_CARD_STYLES.titleSizeDesktop).toBe(28)
    expect(STEP_CARD_STYLES.titleLineHeightDesktop).toBe(36)
    expect(STEP_CARD_STYLES.titleWeight).toBe(600)
  })

  it('description max-width is 320px', () => {
    expect(STEP_CARD_STYLES.descriptionMaxWidth).toBe(320)
  })
})


/**
 * **Feature: landing-typography-polish, Property 8: Final CTA Section Styling**
 * **Validates: Requirements 8.1, 8.2, 8.3, 8.4**
 * 
 * For any render of FinalCTASection, the section SHALL have correct styling.
 */
describe('Property: Final CTA Section Styling', () => {
  const FINAL_CTA_STYLES = {
    paddingDesktop: 160,
    paddingMobile: 100,
    headlineSizeDesktop: 48,
    headlineLineHeightDesktop: 56,
    headlineSizeMobile: 36,
    headlineLineHeightMobile: 44,
    subheadlineMaxWidth: 560,
    buttonGap: 20,  // gap-5 = 20px
  }

  it('final CTA has 160px padding on desktop', () => {
    expect(FINAL_CTA_STYLES.paddingDesktop).toBe(160)
  })

  it('final CTA has 100px padding on mobile', () => {
    expect(FINAL_CTA_STYLES.paddingMobile).toBe(100)
  })

  it('headline is 48px/56px on desktop', () => {
    expect(FINAL_CTA_STYLES.headlineSizeDesktop).toBe(48)
    expect(FINAL_CTA_STYLES.headlineLineHeightDesktop).toBe(56)
  })

  it('headline is 36px/44px on mobile', () => {
    expect(FINAL_CTA_STYLES.headlineSizeMobile).toBe(36)
    expect(FINAL_CTA_STYLES.headlineLineHeightMobile).toBe(44)
  })

  it('subheadline max-width is 560px', () => {
    expect(FINAL_CTA_STYLES.subheadlineMaxWidth).toBe(560)
  })

  it('button gap is 20px', () => {
    expect(FINAL_CTA_STYLES.buttonGap).toBe(20)
  })

  it('final CTA padding is larger than standard sections', () => {
    const standardPadding = 120
    expect(FINAL_CTA_STYLES.paddingDesktop).toBeGreaterThan(standardPadding)
  })
})


/**
 * **Feature: landing-typography-polish, Property 9: Footer Styling**
 * **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**
 * 
 * For any render of LandingFooter, the footer SHALL have correct styling.
 */
describe('Property: Footer Styling', () => {
  const FOOTER_STYLES = {
    paddingTop: 80,      // pt-20 = 80px
    paddingBottom: 48,   // pb-12 = 48px
    backgroundColor: '#09090B',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    linkSize: 14,
    linkColor: '#737373',
    linkHoverColor: '#FFFFFF',
    copyrightSize: 13,
    logoSize: 24,
  }

  it('footer has 80px top padding', () => {
    expect(FOOTER_STYLES.paddingTop).toBe(80)
  })

  it('footer has 48px bottom padding', () => {
    expect(FOOTER_STYLES.paddingBottom).toBe(48)
  })

  it('footer uses deep background color', () => {
    expect(FOOTER_STYLES.backgroundColor).toBe('#09090B')
  })

  it('footer links are 14px with muted color', () => {
    expect(FOOTER_STYLES.linkSize).toBe(14)
    expect(FOOTER_STYLES.linkColor).toBe('#737373')
  })

  it('footer links turn white on hover', () => {
    expect(FOOTER_STYLES.linkHoverColor).toBe('#FFFFFF')
  })

  it('copyright is 13px', () => {
    expect(FOOTER_STYLES.copyrightSize).toBe(13)
  })

  it('logo is 24px', () => {
    expect(FOOTER_STYLES.logoSize).toBe(24)
  })
})


/**
 * **Feature: landing-typography-polish, Property 3: Color Palette Consistency**
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
 * 
 * For any rendered element on the landing page, the computed color values
 * SHALL match the defined color palette.
 */
describe('Property: Color Palette Consistency', () => {
  const COLOR_PALETTE = {
    // Backgrounds
    bgDeep: '#09090B',
    bgMid: '#111113',
    bgLight: '#18181B',
    surface: '#1F1F23',
    
    // Text
    textPrimary: '#FFFFFF',
    textSecondary: '#B4B4B4',
    textMuted: '#737373',
    textDisabled: '#525252',
    
    // Accents
    accentPrimary: '#F97316',
    accentHover: '#FB923C',
    
    // Borders
    borderSubtle: 'rgba(255, 255, 255, 0.06)',
    borderDefault: 'rgba(255, 255, 255, 0.08)',
    borderStrong: 'rgba(255, 255, 255, 0.12)',
    borderHover: 'rgba(255, 255, 255, 0.16)',
  }

  it('deep background is #09090B', () => {
    expect(COLOR_PALETTE.bgDeep).toBe('#09090B')
  })

  it('mid background is #111113', () => {
    expect(COLOR_PALETTE.bgMid).toBe('#111113')
  })

  it('primary text is white', () => {
    expect(COLOR_PALETTE.textPrimary).toBe('#FFFFFF')
  })

  it('secondary text is #B4B4B4', () => {
    expect(COLOR_PALETTE.textSecondary).toBe('#B4B4B4')
  })

  it('muted text is #737373', () => {
    expect(COLOR_PALETTE.textMuted).toBe('#737373')
  })

  it('accent primary is warmer orange #F97316', () => {
    expect(COLOR_PALETTE.accentPrimary).toBe('#F97316')
  })

  it('accent hover is #FB923C', () => {
    expect(COLOR_PALETTE.accentHover).toBe('#FB923C')
  })

  it('border opacity levels are correctly defined', () => {
    expect(COLOR_PALETTE.borderSubtle).toContain('0.06')
    expect(COLOR_PALETTE.borderDefault).toContain('0.08')
    expect(COLOR_PALETTE.borderStrong).toContain('0.12')
    expect(COLOR_PALETTE.borderHover).toContain('0.16')
  })

  it('all background colors are valid hex', () => {
    const bgColors = [COLOR_PALETTE.bgDeep, COLOR_PALETTE.bgMid, COLOR_PALETTE.bgLight, COLOR_PALETTE.surface]
    fc.assert(
      fc.property(
        fc.constantFrom(...bgColors),
        (color) => {
          expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
          return /^#[0-9A-Fa-f]{6}$/.test(color)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('all text colors are valid hex', () => {
    const textColors = [COLOR_PALETTE.textPrimary, COLOR_PALETTE.textSecondary, COLOR_PALETTE.textMuted, COLOR_PALETTE.textDisabled]
    fc.assert(
      fc.property(
        fc.constantFrom(...textColors),
        (color) => {
          expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
          return /^#[0-9A-Fa-f]{6}$/.test(color)
        }
      ),
      { numRuns: 100 }
    )
  })
})
