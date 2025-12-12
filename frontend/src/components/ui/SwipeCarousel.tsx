/**
 * SwipeCarousel - Touch-friendly horizontal carousel with snap scrolling
 * 
 * **Feature: ui-polish-8-of-10, Property 5: Carousel enables on threshold**
 * **Validates: Requirements 2.5, 2.6**
 */

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import clsx from 'clsx'

export interface SwipeCarouselProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  /** Whether to snap to items */
  snapToItem?: boolean
  /** Whether to show scroll indicators */
  showIndicators?: boolean
  /** Item width in pixels, or 'auto' for natural width */
  itemWidth?: number | 'auto'
  /** Gap between items in pixels */
  gap?: number
  /** Minimum items to enable carousel (default: 4) */
  minItemsForCarousel?: number
  /** Class name for the container */
  className?: string
  /** Test ID for testing */
  testId?: string
}

const DEFAULT_MIN_ITEMS = 4
const DEFAULT_GAP = 16

export function SwipeCarousel<T>({
  items,
  renderItem,
  snapToItem = true,
  showIndicators = true,
  itemWidth = 'auto',
  gap = DEFAULT_GAP,
  minItemsForCarousel = DEFAULT_MIN_ITEMS,
  className,
  testId,
}: SwipeCarouselProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Determine if carousel should be enabled
  const isCarouselEnabled = items.length > minItemsForCarousel

  // Update scroll state
  const updateScrollState = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const { scrollLeft, scrollWidth, clientWidth } = container
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1)

    // Calculate active index based on scroll position
    if (itemWidth !== 'auto') {
      const itemTotalWidth = itemWidth + gap
      const newIndex = Math.round(scrollLeft / itemTotalWidth)
      setActiveIndex(Math.min(newIndex, items.length - 1))
    }
  }, [itemWidth, gap, items.length])

  // Set up scroll listener
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    updateScrollState()
    container.addEventListener('scroll', updateScrollState, { passive: true })
    return () => container.removeEventListener('scroll', updateScrollState)
  }, [updateScrollState])

  // Handle resize
  useEffect(() => {
    const handleResize = () => updateScrollState()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [updateScrollState])

  // Scroll to specific index
  const scrollToIndex = useCallback(
    (index: number) => {
      const container = containerRef.current
      if (!container || itemWidth === 'auto') return

      const itemTotalWidth = itemWidth + gap
      container.scrollTo({
        left: index * itemTotalWidth,
        behavior: 'smooth',
      })
    },
    [itemWidth, gap]
  )

  // Scroll by one item
  const scrollByItem = useCallback(
    (direction: 'left' | 'right') => {
      const container = containerRef.current
      if (!container) return

      const scrollAmount = itemWidth === 'auto' ? container.clientWidth * 0.8 : itemWidth + gap
      const newScrollLeft =
        direction === 'left'
          ? container.scrollLeft - scrollAmount
          : container.scrollLeft + scrollAmount

      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      })
    },
    [itemWidth, gap]
  )

  // If not enough items, render as simple flex container
  if (!isCarouselEnabled) {
    return (
      <div
        className={clsx('flex', className)}
        style={{ gap: `${gap}px` }}
        data-testid={testId}
      >
        {items.map((item, index) => (
          <div key={index}>{renderItem(item, index)}</div>
        ))}
      </div>
    )
  }

  return (
    <div className={clsx('relative', className)} data-testid={testId}>
      {/* Scroll container */}
      <div
        ref={containerRef}
        className={clsx(
          'flex overflow-x-auto scrollbar-hide',
          snapToItem && 'snap-x snap-mandatory'
        )}
        style={{ gap: `${gap}px` }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className={clsx(snapToItem && 'snap-start')}
            style={{
              flexShrink: 0,
              width: itemWidth === 'auto' ? undefined : `${itemWidth}px`,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {/* Navigation arrows (desktop) */}
      <button
        type="button"
        onClick={() => scrollByItem('left')}
        disabled={!canScrollLeft}
        className={clsx(
          'absolute left-0 top-1/2 -translate-y-1/2 z-10',
          'hidden md:flex items-center justify-center',
          'w-10 h-10 rounded-full',
          'bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]',
          'text-[var(--color-text-primary)]',
          'focus-ring press-feedback touch-target',
          'transition-opacity duration-200',
          !canScrollLeft && 'opacity-0 pointer-events-none'
        )}
        aria-label="Scroll left"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => scrollByItem('right')}
        disabled={!canScrollRight}
        className={clsx(
          'absolute right-0 top-1/2 -translate-y-1/2 z-10',
          'hidden md:flex items-center justify-center',
          'w-10 h-10 rounded-full',
          'bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]',
          'text-[var(--color-text-primary)]',
          'focus-ring press-feedback touch-target',
          'transition-opacity duration-200',
          !canScrollRight && 'opacity-0 pointer-events-none'
        )}
        aria-label="Scroll right"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* Indicators (mobile) */}
      {showIndicators && itemWidth !== 'auto' && (
        <div className="flex justify-center gap-1.5 mt-3 md:hidden">
          {items.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => scrollToIndex(index)}
              className={clsx(
                'w-2 h-2 rounded-full transition-all duration-200',
                index === activeIndex
                  ? 'bg-[var(--color-accent-primary)] w-4'
                  : 'bg-[var(--color-border-visible)]'
              )}
              aria-label={`Go to item ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Swipe hint (mobile, first time) */}
      {showIndicators && (
        <div className="flex justify-center mt-2 md:hidden">
          <span className="text-xs text-[var(--color-text-muted)]">
            Swipe to see more
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * Helper function to check if carousel should be enabled
 * Used for property testing
 */
export function shouldEnableCarousel(
  itemCount: number,
  minItems: number = DEFAULT_MIN_ITEMS
): boolean {
  return itemCount > minItems
}

export default SwipeCarousel
