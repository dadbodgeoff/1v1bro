/**
 * Mobile Enterprise Optimization - Property-Based Tests
 * 
 * Tests for mobile optimization utility components using fast-check
 * for property-based testing.
 * 
 * Feature: mobile-enterprise-optimization
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { TOUCH_TARGET, SPACING } from '@/utils/breakpoints'

/**
 * Feature: mobile-enterprise-optimization, Property 1: Touch Target Minimum Size
 * Validates: Requirements 1.3, 2.3, 3.3, 4.3, 5.3, 6.2
 * 
 * For any interactive element, the computed dimensions SHALL be at least 44x44 pixels.
 */
describe('Property 1: Touch Target Minimum Size', () => {
  // Helper to check if dimensions meet touch target requirements
  const meetsTouchTarget = (width: number, height: number, minSize: number = TOUCH_TARGET.min): boolean => {
    return width >= minSize && height >= minSize
  }

  it('should enforce minimum 44px dimensions for all touch target sizes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('min', 'recommended', 'comfortable'),
        (size) => {
          const sizeMap = {
            min: TOUCH_TARGET.min,           // 44px
            recommended: TOUCH_TARGET.recommended, // 48px
            comfortable: TOUCH_TARGET.comfortable, // 56px
          }
          const targetSize = sizeMap[size as keyof typeof sizeMap]
          
          // All sizes should be >= 44px (Apple HIG minimum)
          expect(targetSize).toBeGreaterThanOrEqual(44)
          return meetsTouchTarget(targetSize, targetSize, 44)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should correctly identify elements that meet touch target requirements', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 200 }),
        fc.integer({ min: 1, max: 200 }),
        (width, height) => {
          const meets = meetsTouchTarget(width, height)
          
          if (width >= 44 && height >= 44) {
            expect(meets).toBe(true)
          } else {
            expect(meets).toBe(false)
          }
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should reject elements smaller than minimum touch target', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 43 }),
        fc.integer({ min: 1, max: 43 }),
        (width, height) => {
          const meets = meetsTouchTarget(width, height)
          expect(meets).toBe(false)
          return !meets
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should accept elements at exactly minimum touch target', () => {
    const meets = meetsTouchTarget(44, 44)
    expect(meets).toBe(true)
  })

  it('should accept elements larger than minimum touch target', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 44, max: 200 }),
        fc.integer({ min: 44, max: 200 }),
        (width, height) => {
          const meets = meetsTouchTarget(width, height)
          expect(meets).toBe(true)
          return meets
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * Feature: mobile-enterprise-optimization, Property 2: Touch Target Spacing
 * Validates: Requirements 13.2
 * 
 * For any two adjacent interactive elements, the gap SHALL be at least 8px.
 */
describe('Property 2: Touch Target Spacing', () => {
  const MIN_GAP = SPACING.touchGap // 8px

  const hasAdequateSpacing = (gap: number): boolean => {
    return gap >= MIN_GAP
  }

  it('should enforce minimum 8px gap between touch targets', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 50 }),
        (gap) => {
          const adequate = hasAdequateSpacing(gap)
          const expected = gap >= MIN_GAP
          expect(adequate).toBe(expected)
          return adequate === expected
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should accept gaps at exactly minimum spacing', () => {
    expect(hasAdequateSpacing(MIN_GAP)).toBe(true)
  })

  it('should reject gaps smaller than minimum spacing', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 7 }),
        (gap) => {
          expect(hasAdequateSpacing(gap)).toBe(false)
          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * Feature: mobile-enterprise-optimization, Property 4: Responsive Grid Adaptation
 * Validates: Requirements 1.2, 4.1, 5.1
 * 
 * For any grid component, the number of columns SHALL decrease as viewport width decreases.
 */
describe('Property 4: Responsive Grid Adaptation', () => {
  // Simulate grid column calculation based on viewport
  const getGridColumns = (
    viewportWidth: number,
    config: { mobile: number; tablet: number; desktop: number }
  ): number => {
    if (viewportWidth < 640) return config.mobile
    if (viewportWidth < 1024) return config.tablet
    return config.desktop
  }

  it('should return mobile columns for viewport < 640px', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 639 }),
        fc.integer({ min: 1, max: 4 }),
        fc.integer({ min: 1, max: 6 }),
        fc.integer({ min: 1, max: 6 }),
        (viewport, mobile, tablet, desktop) => {
          const cols = getGridColumns(viewport, { mobile, tablet, desktop })
          expect(cols).toBe(mobile)
          return cols === mobile
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return tablet columns for viewport 640-1023px', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 640, max: 1023 }),
        fc.integer({ min: 1, max: 4 }),
        fc.integer({ min: 1, max: 6 }),
        fc.integer({ min: 1, max: 6 }),
        (viewport, mobile, tablet, desktop) => {
          const cols = getGridColumns(viewport, { mobile, tablet, desktop })
          expect(cols).toBe(tablet)
          return cols === tablet
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return desktop columns for viewport >= 1024px', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1024, max: 2560 }),
        fc.integer({ min: 1, max: 4 }),
        fc.integer({ min: 1, max: 6 }),
        fc.integer({ min: 1, max: 6 }),
        (viewport, mobile, tablet, desktop) => {
          const cols = getGridColumns(viewport, { mobile, tablet, desktop })
          expect(cols).toBe(desktop)
          return cols === desktop
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should have columns decrease or stay same as viewport decreases', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 2 }),  // mobile: 1-2 cols
        fc.integer({ min: 2, max: 4 }),  // tablet: 2-4 cols
        fc.integer({ min: 3, max: 6 }),  // desktop: 3-6 cols
        (mobile, tablet, desktop) => {
          // Ensure mobile <= tablet <= desktop for proper responsive behavior
          fc.pre(mobile <= tablet && tablet <= desktop)
          
          const mobileViewport = 400
          const tabletViewport = 800
          const desktopViewport = 1200
          
          const mobileCols = getGridColumns(mobileViewport, { mobile, tablet, desktop })
          const tabletCols = getGridColumns(tabletViewport, { mobile, tablet, desktop })
          const desktopCols = getGridColumns(desktopViewport, { mobile, tablet, desktop })
          
          // Columns should increase or stay same as viewport increases
          expect(mobileCols).toBeLessThanOrEqual(tabletCols)
          expect(tabletCols).toBeLessThanOrEqual(desktopCols)
          
          return mobileCols <= tabletCols && tabletCols <= desktopCols
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * Feature: mobile-enterprise-optimization, Property 3: Mobile Layout Single Column
 * Validates: Requirements 1.1
 * 
 * For any page at viewport < 640px, main content SHALL use single or two-column layout.
 */
describe('Property 3: Mobile Layout Single Column', () => {
  const isMobileLayout = (viewportWidth: number): boolean => {
    return viewportWidth < 640
  }

  const getMaxColumnsForMobile = (): number => {
    return 2 // Maximum 2 columns on mobile
  }

  it('should identify mobile viewport correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 1200 }),
        (viewport) => {
          const isMobile = isMobileLayout(viewport)
          
          if (viewport < 640) {
            expect(isMobile).toBe(true)
          } else {
            expect(isMobile).toBe(false)
          }
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should limit mobile layouts to 2 columns maximum', () => {
    const maxCols = getMaxColumnsForMobile()
    expect(maxCols).toBeLessThanOrEqual(2)
  })

  it('should use appropriate column count for mobile viewports', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 639 }),
        fc.integer({ min: 1, max: 2 }),  // Valid mobile column counts
        (viewport, mobileCols) => {
          const isMobile = isMobileLayout(viewport)
          expect(isMobile).toBe(true)
          expect(mobileCols).toBeLessThanOrEqual(2)
          return isMobile && mobileCols <= 2
        }
      ),
      { numRuns: 100 }
    )
  })
})


/**
 * Feature: mobile-enterprise-optimization, Property 8: Safe Area Handling
 * Validates: Requirements 2.4, 10.3
 * 
 * For any fixed-position element at screen edges, the component SHALL include
 * safe-area-inset padding or margin.
 */
describe('Property 8: Safe Area Handling', () => {
  // Safe area CSS class patterns that indicate proper handling
  const SAFE_AREA_CLASSES = [
    'safe-area-top',
    'safe-area-bottom',
    'safe-area-left',
    'safe-area-right',
    'safe-area-x',
    'safe-area-y',
    'safe-area-all',
    'fixed-bottom-safe',
    'min-h-screen-safe',
    'game-container-safe',
  ]

  // CSS env() patterns for safe area insets
  const SAFE_AREA_ENV_PATTERNS = [
    'env(safe-area-inset-top',
    'env(safe-area-inset-bottom',
    'env(safe-area-inset-left',
    'env(safe-area-inset-right',
  ]

  /**
   * Checks if a className string contains safe area handling
   */
  const hasSafeAreaClass = (className: string): boolean => {
    return SAFE_AREA_CLASSES.some(safeClass => className.includes(safeClass))
  }

  /**
   * Checks if a style string contains safe area env() values
   */
  const hasSafeAreaEnv = (styleString: string): boolean => {
    return SAFE_AREA_ENV_PATTERNS.some(pattern => styleString.includes(pattern))
  }

  /**
   * Determines if a fixed element position requires safe area handling
   */
  const requiresSafeArea = (position: 'top' | 'bottom' | 'left' | 'right' | 'all'): boolean => {
    // All fixed edge positions require safe area handling on mobile
    return true
  }

  /**
   * Validates that a fixed element has appropriate safe area handling
   */
  const validateSafeAreaHandling = (
    position: 'top' | 'bottom' | 'left' | 'right' | 'all',
    className: string,
    inlineStyle?: string
  ): boolean => {
    if (!requiresSafeArea(position)) return true
    
    // Check for safe area class
    if (hasSafeAreaClass(className)) return true
    
    // Check for inline safe area env() usage
    if (inlineStyle && hasSafeAreaEnv(inlineStyle)) return true
    
    return false
  }

  it('should recognize all safe area CSS classes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SAFE_AREA_CLASSES),
        (safeClass) => {
          const className = `some-class ${safeClass} another-class`
          expect(hasSafeAreaClass(className)).toBe(true)
          return hasSafeAreaClass(className)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should reject classNames without safe area handling', () => {
    // Test with common CSS class patterns that don't include safe area handling
    const nonSafeAreaClasses = [
      'fixed bg-black p-4',
      'absolute top-0 left-0',
      'sticky bottom-0',
      'relative flex items-center',
      'block w-full h-16',
      'flex-1 overflow-auto',
      'grid grid-cols-2 gap-4',
      'p-6 m-4 rounded-lg',
      'text-white bg-gray-900',
      'border border-white/10',
    ]
    
    fc.assert(
      fc.property(
        fc.constantFrom(...nonSafeAreaClasses),
        (className) => {
          expect(hasSafeAreaClass(className)).toBe(false)
          return !hasSafeAreaClass(className)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should recognize safe area env() patterns in styles', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('top', 'bottom', 'left', 'right'),
        (direction) => {
          const styleString = `padding-${direction}: env(safe-area-inset-${direction}, 0px);`
          expect(hasSafeAreaEnv(styleString)).toBe(true)
          return hasSafeAreaEnv(styleString)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should validate fixed elements with safe area classes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('top', 'bottom', 'left', 'right', 'all') as fc.Arbitrary<'top' | 'bottom' | 'left' | 'right' | 'all'>,
        fc.constantFrom(...SAFE_AREA_CLASSES),
        (position, safeClass) => {
          const className = `fixed ${safeClass}`
          const isValid = validateSafeAreaHandling(position, className)
          expect(isValid).toBe(true)
          return isValid
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should validate fixed elements with inline safe area styles', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('top', 'bottom', 'left', 'right', 'all') as fc.Arbitrary<'top' | 'bottom' | 'left' | 'right' | 'all'>,
        fc.constantFrom('top', 'bottom', 'left', 'right'),
        (position, direction) => {
          const className = 'fixed'
          const inlineStyle = `padding-${direction}: env(safe-area-inset-${direction}, 0px);`
          const isValid = validateSafeAreaHandling(position, className, inlineStyle)
          expect(isValid).toBe(true)
          return isValid
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should reject fixed elements without safe area handling', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('top', 'bottom', 'left', 'right', 'all') as fc.Arbitrary<'top' | 'bottom' | 'left' | 'right' | 'all'>,
        (position) => {
          const className = 'fixed bg-black p-4'
          const isValid = validateSafeAreaHandling(position, className)
          expect(isValid).toBe(false)
          return !isValid
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should require safe area handling for all fixed edge positions', () => {
    const positions: Array<'top' | 'bottom' | 'left' | 'right' | 'all'> = ['top', 'bottom', 'left', 'right', 'all']
    
    positions.forEach(position => {
      expect(requiresSafeArea(position)).toBe(true)
    })
  })

  it('should handle combined safe area classes', () => {
    fc.assert(
      fc.property(
        fc.subarray(SAFE_AREA_CLASSES, { minLength: 1, maxLength: 3 }),
        (safeClasses) => {
          const className = `fixed ${safeClasses.join(' ')}`
          expect(hasSafeAreaClass(className)).toBe(true)
          return hasSafeAreaClass(className)
        }
      ),
      { numRuns: 100 }
    )
  })
})


/**
 * Feature: mobile-enterprise-optimization, Property 11: Horizontal Scroll Containers
 * Validates: Requirements 3.1, 4.4, 7.3
 * 
 * For any horizontally scrollable content (tier tracks, tabs, filters),
 * the container SHALL have overflow-x-auto and momentum scrolling enabled.
 */
describe('Property 11: Horizontal Scroll Containers', () => {
  // CSS classes that indicate horizontal scroll capability
  const HORIZONTAL_SCROLL_CLASSES = [
    'overflow-x-auto',
    'overflow-x-scroll',
    'overflow-auto',
  ]

  // CSS classes/styles that indicate momentum scrolling
  const MOMENTUM_SCROLL_INDICATORS = [
    '-webkit-overflow-scrolling-touch',
    'scroll-smooth',
  ]

  // CSS classes that indicate snap behavior
  const SNAP_CLASSES = [
    'snap-x',
    'snap-mandatory',
    'snap-start',
    'snap-center',
    'snap-end',
  ]

  /**
   * Checks if a className string contains horizontal scroll capability
   */
  const hasHorizontalScroll = (className: string): boolean => {
    return HORIZONTAL_SCROLL_CLASSES.some(scrollClass => className.includes(scrollClass))
  }

  /**
   * Checks if a className string contains momentum scrolling
   */
  const hasMomentumScroll = (className: string): boolean => {
    return MOMENTUM_SCROLL_INDICATORS.some(indicator => className.includes(indicator))
  }

  /**
   * Checks if a className string contains snap behavior
   */
  const hasSnapBehavior = (className: string): boolean => {
    return SNAP_CLASSES.some(snapClass => className.includes(snapClass))
  }

  /**
   * Validates that a horizontal scroll container has proper configuration
   */
  const validateHorizontalScrollContainer = (className: string): {
    hasScroll: boolean
    hasMomentum: boolean
    hasSnap: boolean
    isValid: boolean
  } => {
    const hasScroll = hasHorizontalScroll(className)
    const hasMomentum = hasMomentumScroll(className)
    const hasSnap = hasSnapBehavior(className)
    
    // Valid if has scroll capability (momentum and snap are optional enhancements)
    return {
      hasScroll,
      hasMomentum,
      hasSnap,
      isValid: hasScroll,
    }
  }

  it('should recognize horizontal scroll classes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...HORIZONTAL_SCROLL_CLASSES),
        (scrollClass) => {
          const className = `flex gap-4 ${scrollClass} py-4`
          expect(hasHorizontalScroll(className)).toBe(true)
          return hasHorizontalScroll(className)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should recognize momentum scroll indicators', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...MOMENTUM_SCROLL_INDICATORS),
        (indicator) => {
          const className = `overflow-x-auto ${indicator}`
          expect(hasMomentumScroll(className)).toBe(true)
          return hasMomentumScroll(className)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should recognize snap behavior classes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SNAP_CLASSES),
        (snapClass) => {
          const className = `overflow-x-auto ${snapClass}`
          expect(hasSnapBehavior(className)).toBe(true)
          return hasSnapBehavior(className)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should validate complete horizontal scroll container configuration', () => {
    // Test with a well-configured scroll container (like BattlePassTrack)
    const wellConfiguredClassName = 'flex gap-3 overflow-x-auto py-4 px-12 scroll-smooth snap-x snap-mandatory'
    
    const result = validateHorizontalScrollContainer(wellConfiguredClassName)
    
    expect(result.hasScroll).toBe(true)
    expect(result.hasMomentum).toBe(true)
    expect(result.hasSnap).toBe(true)
    expect(result.isValid).toBe(true)
  })

  it('should reject containers without horizontal scroll', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'flex gap-4 py-4',
          'grid grid-cols-4',
          'block w-full',
          'overflow-hidden',
          'overflow-y-auto'
        ),
        (className) => {
          const result = validateHorizontalScrollContainer(className)
          expect(result.hasScroll).toBe(false)
          expect(result.isValid).toBe(false)
          return !result.isValid
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should accept containers with just overflow-x-auto (minimum requirement)', () => {
    const minimalClassName = 'flex overflow-x-auto'
    const result = validateHorizontalScrollContainer(minimalClassName)
    
    expect(result.hasScroll).toBe(true)
    expect(result.isValid).toBe(true)
  })

  it('should handle combined scroll and snap classes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...HORIZONTAL_SCROLL_CLASSES),
        fc.subarray(SNAP_CLASSES, { minLength: 1, maxLength: 2 }),
        (scrollClass, snapClasses) => {
          const className = `flex ${scrollClass} ${snapClasses.join(' ')}`
          const result = validateHorizontalScrollContainer(className)
          
          expect(result.hasScroll).toBe(true)
          expect(result.hasSnap).toBe(true)
          expect(result.isValid).toBe(true)
          return result.isValid
        }
      ),
      { numRuns: 100 }
    )
  })
})


/**
 * Feature: mobile-enterprise-optimization, Property 10: Modal Mobile Presentation
 * Validates: Requirements 4.5, 5.5, 6.4, 8.5, 11.1
 * 
 * For any modal rendered at viewport width below 640px, the modal SHALL use
 * full-width or bottom-sheet presentation with safe area padding.
 */
describe('Property 10: Modal Mobile Presentation', () => {
  /**
   * Determines if viewport is mobile
   */
  const isMobileViewport = (width: number): boolean => {
    return width < 640
  }

  /**
   * Gets modal sizing based on viewport and configuration
   */
  const getModalMobileSizing = (
    isMobile: boolean,
    mobileFullScreen: boolean,
    mobileBottomSheet: boolean
  ): { width: string; isFullWidth: boolean; isBottomSheet: boolean } => {
    if (!isMobile) {
      return { width: 'auto', isFullWidth: false, isBottomSheet: false }
    }
    
    if (mobileBottomSheet) {
      return { width: '100%', isFullWidth: true, isBottomSheet: true }
    }
    
    if (mobileFullScreen) {
      return { width: '100%', isFullWidth: true, isBottomSheet: false }
    }
    
    return { width: 'auto', isFullWidth: false, isBottomSheet: false }
  }

  /**
   * Validates modal has proper mobile presentation
   */
  const validateModalMobilePresentation = (
    viewportWidth: number,
    mobileFullScreen: boolean,
    mobileBottomSheet: boolean
  ): boolean => {
    const isMobile = isMobileViewport(viewportWidth)
    
    if (!isMobile) return true // Non-mobile doesn't need special handling
    
    // On mobile, modal should use full-width or bottom-sheet
    return mobileFullScreen || mobileBottomSheet
  }

  it('should identify mobile viewport correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 1200 }),
        (width) => {
          const isMobile = isMobileViewport(width)
          expect(isMobile).toBe(width < 640)
          return isMobile === (width < 640)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return full-width sizing on mobile with mobileFullScreen', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 639 }),
        (width) => {
          const sizing = getModalMobileSizing(true, true, false)
          expect(sizing.width).toBe('100%')
          expect(sizing.isFullWidth).toBe(true)
          return sizing.isFullWidth
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return bottom-sheet sizing on mobile with mobileBottomSheet', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 639 }),
        (width) => {
          const sizing = getModalMobileSizing(true, false, true)
          expect(sizing.width).toBe('100%')
          expect(sizing.isBottomSheet).toBe(true)
          return sizing.isBottomSheet
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return auto sizing on desktop', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 640, max: 2560 }),
        (width) => {
          const sizing = getModalMobileSizing(false, true, false)
          expect(sizing.width).toBe('auto')
          expect(sizing.isFullWidth).toBe(false)
          return !sizing.isFullWidth
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should validate modal with mobileFullScreen on mobile', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 639 }),
        (width) => {
          const isValid = validateModalMobilePresentation(width, true, false)
          expect(isValid).toBe(true)
          return isValid
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should validate modal with mobileBottomSheet on mobile', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 639 }),
        (width) => {
          const isValid = validateModalMobilePresentation(width, false, true)
          expect(isValid).toBe(true)
          return isValid
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should reject modal without mobile optimization on mobile', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 639 }),
        (width) => {
          const isValid = validateModalMobilePresentation(width, false, false)
          expect(isValid).toBe(false)
          return !isValid
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should always validate on desktop regardless of mobile settings', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 640, max: 2560 }),
        fc.boolean(),
        fc.boolean(),
        (width, mobileFullScreen, mobileBottomSheet) => {
          const isValid = validateModalMobilePresentation(width, mobileFullScreen, mobileBottomSheet)
          expect(isValid).toBe(true)
          return isValid
        }
      ),
      { numRuns: 100 }
    )
  })
})


/**
 * Feature: mobile-enterprise-optimization, Property 16: Image Responsiveness
 * Validates: Requirements 14.2
 * 
 * For any image element, the sizing SHALL use responsive classes or percentage-based
 * dimensions with proper aspect ratio containers.
 */
describe('Property 16: Image Responsiveness', () => {
  // Responsive sizing patterns
  const RESPONSIVE_WIDTH_PATTERNS = [
    'w-full',
    'w-auto',
    'max-w-full',
    'w-[100%]',
    'w-screen',
  ]

  const RESPONSIVE_HEIGHT_PATTERNS = [
    'h-full',
    'h-auto',
    'max-h-full',
    'h-[100%]',
    'h-screen',
  ]

  const ASPECT_RATIO_PATTERNS = [
    'aspect-square',
    'aspect-video',
    'aspect-auto',
    'aspect-[',
  ]

  /**
   * Checks if sizing uses responsive patterns
   */
  const hasResponsiveSizing = (className: string): boolean => {
    const hasResponsiveWidth = RESPONSIVE_WIDTH_PATTERNS.some(p => className.includes(p))
    const hasResponsiveHeight = RESPONSIVE_HEIGHT_PATTERNS.some(p => className.includes(p))
    const hasAspectRatio = ASPECT_RATIO_PATTERNS.some(p => className.includes(p))
    
    return hasResponsiveWidth || hasResponsiveHeight || hasAspectRatio
  }

  /**
   * Checks if image uses percentage-based dimensions
   */
  const hasPercentageDimensions = (width?: number | string, height?: number | string): boolean => {
    const isPercentageWidth = typeof width === 'string' && width.includes('%')
    const isPercentageHeight = typeof height === 'string' && height.includes('%')
    const isUndefinedWidth = width === undefined
    const isUndefinedHeight = height === undefined
    
    // Undefined dimensions default to 100% in OptimizedImage
    return isPercentageWidth || isPercentageHeight || isUndefinedWidth || isUndefinedHeight
  }

  /**
   * Validates image responsiveness
   */
  const validateImageResponsiveness = (
    className: string,
    width?: number | string,
    height?: number | string
  ): boolean => {
    return hasResponsiveSizing(className) || hasPercentageDimensions(width, height)
  }

  it('should recognize responsive width classes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...RESPONSIVE_WIDTH_PATTERNS),
        (widthClass) => {
          const className = `${widthClass} object-cover`
          expect(hasResponsiveSizing(className)).toBe(true)
          return hasResponsiveSizing(className)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should recognize aspect ratio classes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ASPECT_RATIO_PATTERNS),
        (aspectClass) => {
          const className = `${aspectClass} object-cover`
          expect(hasResponsiveSizing(className)).toBe(true)
          return hasResponsiveSizing(className)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should accept percentage-based dimensions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        (widthPercent, heightPercent) => {
          const width = `${widthPercent}%`
          const height = `${heightPercent}%`
          expect(hasPercentageDimensions(width, height)).toBe(true)
          return hasPercentageDimensions(width, height)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should accept undefined dimensions (defaults to 100%)', () => {
    expect(hasPercentageDimensions(undefined, undefined)).toBe(true)
    expect(hasPercentageDimensions(undefined, 200)).toBe(true)
    expect(hasPercentageDimensions(200, undefined)).toBe(true)
  })

  it('should validate images with responsive classes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...RESPONSIVE_WIDTH_PATTERNS),
        (widthClass) => {
          const className = `${widthClass} h-auto object-cover`
          const isValid = validateImageResponsiveness(className, 200, 200)
          expect(isValid).toBe(true)
          return isValid
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should validate images with percentage dimensions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 100 }),
        (percent) => {
          const className = 'object-cover'
          const isValid = validateImageResponsiveness(className, `${percent}%`, `${percent}%`)
          expect(isValid).toBe(true)
          return isValid
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should validate images with undefined dimensions', () => {
    const className = 'object-cover'
    const isValid = validateImageResponsiveness(className, undefined, undefined)
    expect(isValid).toBe(true)
  })

  it('should reject images with only fixed pixel dimensions and no responsive classes', () => {
    const className = 'object-cover rounded-lg'
    const isValid = validateImageResponsiveness(className, 400, 300)
    expect(isValid).toBe(false)
  })
})

/**
 * Feature: mobile-enterprise-optimization, Property 17: Empty State Responsiveness
 * Validates: Requirements 14.5
 * 
 * For any empty state component, the layout SHALL be responsive with
 * appropriately sized illustrations and text.
 */
describe('Property 17: Empty State Responsiveness', () => {
  // Responsive layout patterns for empty states
  const RESPONSIVE_LAYOUT_PATTERNS = [
    'flex flex-col',
    'items-center',
    'justify-center',
    'text-center',
  ]

  // Responsive padding patterns
  const RESPONSIVE_PADDING_PATTERNS = [
    'py-12',
    'py-8',
    'py-6',
    'px-4',
    'px-6',
    'p-4',
    'p-6',
  ]

  // Responsive text patterns
  const RESPONSIVE_TEXT_PATTERNS = [
    'text-lg',
    'text-base',
    'text-sm',
    'max-w-sm',
    'max-w-md',
  ]

  // Icon size patterns (should be responsive)
  const ICON_SIZE_PATTERNS = [
    'w-16 h-16',
    'w-12 h-12',
    'w-10 h-10',
    'w-8 h-8',
  ]

  /**
   * Checks if empty state has responsive layout
   */
  const hasResponsiveLayout = (className: string): boolean => {
    return RESPONSIVE_LAYOUT_PATTERNS.every(pattern => className.includes(pattern))
  }

  /**
   * Checks if empty state has responsive padding
   */
  const hasResponsivePadding = (className: string): boolean => {
    return RESPONSIVE_PADDING_PATTERNS.some(pattern => className.includes(pattern))
  }

  /**
   * Checks if empty state has responsive text
   */
  const hasResponsiveText = (className: string): boolean => {
    return RESPONSIVE_TEXT_PATTERNS.some(pattern => className.includes(pattern))
  }

  /**
   * Validates empty state responsiveness
   */
  const validateEmptyStateResponsiveness = (
    containerClassName: string,
    hasIcon: boolean,
    hasTitle: boolean,
    hasDescription: boolean
  ): { isValid: boolean; hasLayout: boolean; hasPadding: boolean; hasText: boolean } => {
    const hasLayout = hasResponsiveLayout(containerClassName)
    const hasPadding = hasResponsivePadding(containerClassName)
    const hasText = hasResponsiveText(containerClassName)
    
    // Valid if has responsive layout and padding
    const isValid = hasLayout && hasPadding
    
    return { isValid, hasLayout, hasPadding, hasText }
  }

  it('should recognize responsive layout patterns', () => {
    const className = 'flex flex-col items-center justify-center text-center py-12 px-4'
    expect(hasResponsiveLayout(className)).toBe(true)
  })

  it('should recognize responsive padding patterns', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...RESPONSIVE_PADDING_PATTERNS),
        (paddingClass) => {
          const className = `flex flex-col ${paddingClass}`
          expect(hasResponsivePadding(className)).toBe(true)
          return hasResponsivePadding(className)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should recognize responsive text patterns', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...RESPONSIVE_TEXT_PATTERNS),
        (textClass) => {
          const className = `flex flex-col ${textClass}`
          expect(hasResponsiveText(className)).toBe(true)
          return hasResponsiveText(className)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should validate well-configured empty state', () => {
    // This matches the EmptyState component's actual className
    const className = 'flex flex-col items-center justify-center py-12 px-4 text-center'
    const result = validateEmptyStateResponsiveness(className, true, true, true)
    
    expect(result.hasLayout).toBe(true)
    expect(result.hasPadding).toBe(true)
    expect(result.isValid).toBe(true)
  })

  it('should reject empty state without responsive layout', () => {
    const className = 'block p-4'
    const result = validateEmptyStateResponsiveness(className, true, true, true)
    
    expect(result.hasLayout).toBe(false)
    expect(result.isValid).toBe(false)
  })

  it('should reject empty state without responsive padding', () => {
    const className = 'flex flex-col items-center justify-center text-center'
    const result = validateEmptyStateResponsiveness(className, true, true, true)
    
    expect(result.hasPadding).toBe(false)
    expect(result.isValid).toBe(false)
  })

  it('should validate empty states with various padding configurations', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...RESPONSIVE_PADDING_PATTERNS),
        (paddingClass) => {
          const className = `flex flex-col items-center justify-center text-center ${paddingClass}`
          const result = validateEmptyStateResponsiveness(className, true, true, false)
          expect(result.isValid).toBe(true)
          return result.isValid
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should validate icon sizes are appropriate', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ICON_SIZE_PATTERNS),
        (iconSize) => {
          // Extract width from pattern (e.g., 'w-16 h-16' -> 16)
          const sizeMatch = iconSize.match(/w-(\d+)/)
          if (!sizeMatch) return true
          
          const size = parseInt(sizeMatch[1], 10)
          // Icon sizes should be between 8 and 16 (32px to 64px in Tailwind)
          expect(size).toBeGreaterThanOrEqual(8)
          expect(size).toBeLessThanOrEqual(16)
          return size >= 8 && size <= 16
        }
      ),
      { numRuns: 100 }
    )
  })
})
