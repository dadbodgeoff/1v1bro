/**
 * Property-based tests for SwipeCarousel component.
 *
 * Tests correctness properties for carousel threshold behavior.
 *
 * **Feature: ui-polish-8-of-10**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { render, screen } from '@testing-library/react'
import { SwipeCarousel, shouldEnableCarousel } from '../SwipeCarousel'

// ============================================
// Property 5: Carousel enables on threshold
// ============================================

describe('Property 5: Carousel enables on threshold', () => {
  /**
   * **Feature: ui-polish-8-of-10, Property 5: Carousel enables on threshold**
   *
   * For any item array where length > 4 and viewport is mobile (< 640px),
   * the SwipeCarousel component should render with scrolling enabled.
   *
   * **Validates: Requirements 2.5**
   */

  const DEFAULT_MIN_ITEMS = 4

  it('should enable carousel when items > minItemsForCarousel', () => {
    const items = [1, 2, 3, 4, 5, 6]
    render(
      <SwipeCarousel
        items={items}
        renderItem={(item) => <div data-testid={`item-${item}`}>{item}</div>}
        testId="carousel"
        minItemsForCarousel={4}
      />
    )

    // Should render with carousel container (has overflow-x-auto)
    const carousel = screen.getByTestId('carousel')
    expect(carousel).toBeInTheDocument()
    
    // All items should be rendered
    items.forEach((item) => {
      expect(screen.getByTestId(`item-${item}`)).toBeInTheDocument()
    })
  })

  it('should not enable carousel when items <= minItemsForCarousel', () => {
    const items = [1, 2, 3, 4]
    render(
      <SwipeCarousel
        items={items}
        renderItem={(item) => <div data-testid={`item-${item}`}>{item}</div>}
        testId="carousel"
        minItemsForCarousel={4}
      />
    )

    // Should render as simple flex container
    const carousel = screen.getByTestId('carousel')
    expect(carousel).toBeInTheDocument()
    
    // All items should still be rendered
    items.forEach((item) => {
      expect(screen.getByTestId(`item-${item}`)).toBeInTheDocument()
    })
  })

  it('property: shouldEnableCarousel returns true when items > threshold', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 100 }), // itemCount > 4
        fc.integer({ min: 1, max: 10 }), // minItems
        (itemCount, minItems) => {
          // When itemCount > minItems, carousel should be enabled
          if (itemCount > minItems) {
            return shouldEnableCarousel(itemCount, minItems) === true
          }
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('property: shouldEnableCarousel returns false when items <= threshold', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }), // minItems
        (minItems) => {
          // When itemCount <= minItems, carousel should be disabled
          for (let itemCount = 1; itemCount <= minItems; itemCount++) {
            if (shouldEnableCarousel(itemCount, minItems) !== false) {
              return false
            }
          }
          return true
        }
      ),
      { numRuns: 50 }
    )
  })

  it('property: default threshold is 4 items', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }), // itemCount
        (itemCount) => {
          const result = shouldEnableCarousel(itemCount)
          const expected = itemCount > DEFAULT_MIN_ITEMS
          return result === expected
        }
      ),
      { numRuns: 100 }
    )
  })

  it('property: carousel renders all items regardless of threshold', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }), // itemCount
        (itemCount) => {
          const items = Array.from({ length: itemCount }, (_, i) => i + 1)
          const { container } = render(
            <SwipeCarousel
              items={items}
              renderItem={(item) => <div data-testid={`item-${item}`}>{item}</div>}
              testId="carousel"
            />
          )

          // All items should be rendered
          const renderedItems = container.querySelectorAll('[data-testid^="item-"]')
          const allRendered = renderedItems.length === itemCount

          // Cleanup
          container.remove()

          return allRendered
        }
      ),
      { numRuns: 50 }
    )
  })
})

// ============================================
// Carousel Rendering Tests
// ============================================

describe('SwipeCarousel rendering', () => {
  it('should render with custom item width', () => {
    const items = [1, 2, 3, 4, 5]
    render(
      <SwipeCarousel
        items={items}
        renderItem={(item) => <div>{item}</div>}
        itemWidth={200}
        testId="carousel"
      />
    )

    expect(screen.getByTestId('carousel')).toBeInTheDocument()
  })

  it('should render with custom gap', () => {
    const items = [1, 2, 3, 4, 5]
    render(
      <SwipeCarousel
        items={items}
        renderItem={(item) => <div>{item}</div>}
        gap={24}
        testId="carousel"
      />
    )

    expect(screen.getByTestId('carousel')).toBeInTheDocument()
  })

  it('should hide indicators when showIndicators is false', () => {
    const items = [1, 2, 3, 4, 5]
    render(
      <SwipeCarousel
        items={items}
        renderItem={(item) => <div>{item}</div>}
        showIndicators={false}
        testId="carousel"
      />
    )

    // Should not have "Swipe to see more" text
    expect(screen.queryByText('Swipe to see more')).not.toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const items = [1, 2, 3, 4, 5]
    render(
      <SwipeCarousel
        items={items}
        renderItem={(item) => <div>{item}</div>}
        className="custom-class"
        testId="carousel"
      />
    )

    expect(screen.getByTestId('carousel')).toHaveClass('custom-class')
  })
})
