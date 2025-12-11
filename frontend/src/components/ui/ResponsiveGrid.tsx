/**
 * ResponsiveGrid Component - Mobile Enterprise Optimization
 * 
 * A CSS Grid component with breakpoint-aware column configuration.
 * Automatically adapts from mobile to desktop layouts.
 * 
 * Features:
 * - Configurable columns per breakpoint (mobile/tablet/desktop)
 * - Responsive gap sizing
 * - Auto-fit and auto-fill modes
 * - Minimum column width support
 * 
 * Requirements: 1.2, 4.1, 5.1
 * 
 * @module components/ui/ResponsiveGrid
 */

import { type ReactNode } from 'react'
import { cn } from '@/utils/helpers'

export interface ResponsiveGridProps {
  children: ReactNode
  /**
   * Column configuration per breakpoint
   * - mobile: columns at <640px
   * - tablet: columns at 640-1023px
   * - desktop: columns at 1024px+
   */
  cols?: {
    mobile?: 1 | 2 | 3 | 4
    tablet?: 1 | 2 | 3 | 4 | 5 | 6
    desktop?: 1 | 2 | 3 | 4 | 5 | 6 | 8 | 12
  }
  /**
   * Gap size between grid items
   * - sm: 8px mobile, 12px tablet, 16px desktop
   * - md: 12px mobile, 16px tablet, 24px desktop
   * - lg: 16px mobile, 24px tablet, 32px desktop
   * @default 'md'
   */
  gap?: 'sm' | 'md' | 'lg' | 'none'
  /**
   * Minimum width for auto-fit columns (enables fluid grid)
   * When set, cols prop is ignored and grid uses auto-fit
   */
  minColWidth?: number
  /**
   * Additional CSS classes
   */
  className?: string
  /**
   * Test ID for testing
   */
  'data-testid'?: string
}

// Column class mappings for each breakpoint
const mobileColClasses: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
}

const tabletColClasses: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
  5: 'sm:grid-cols-5',
  6: 'sm:grid-cols-6',
}

const desktopColClasses: Record<number, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6',
  8: 'lg:grid-cols-8',
  12: 'lg:grid-cols-12',
}

const gapClasses: Record<NonNullable<ResponsiveGridProps['gap']>, string> = {
  none: 'gap-0',
  sm: 'gap-2 sm:gap-3 lg:gap-4',
  md: 'gap-3 sm:gap-4 lg:gap-6',
  lg: 'gap-4 sm:gap-6 lg:gap-8',
}

/**
 * ResponsiveGrid provides a mobile-first grid layout that adapts
 * to different viewport sizes.
 * 
 * @example
 * ```tsx
 * // Basic responsive grid
 * <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 4 }}>
 *   <Card />
 *   <Card />
 *   <Card />
 *   <Card />
 * </ResponsiveGrid>
 * 
 * // Auto-fit grid with minimum column width
 * <ResponsiveGrid minColWidth={280} gap="lg">
 *   {items.map(item => <Card key={item.id} />)}
 * </ResponsiveGrid>
 * 
 * // Shop-style 2-column mobile grid
 * <ResponsiveGrid cols={{ mobile: 2, tablet: 3, desktop: 4 }}>
 *   {products.map(p => <ProductCard key={p.id} />)}
 * </ResponsiveGrid>
 * ```
 */
export function ResponsiveGrid({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  minColWidth,
  className,
  'data-testid': testId,
}: ResponsiveGridProps) {
  // If minColWidth is set, use auto-fit grid
  if (minColWidth) {
    return (
      <div
        className={cn('grid', gapClasses[gap], className)}
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${minColWidth}px, 1fr))`,
        }}
        data-testid={testId}
      >
        {children}
      </div>
    )
  }

  // Build column classes from config
  const colClasses = [
    cols.mobile && mobileColClasses[cols.mobile],
    cols.tablet && tabletColClasses[cols.tablet],
    cols.desktop && desktopColClasses[cols.desktop],
  ].filter(Boolean)

  return (
    <div
      className={cn('grid', ...colClasses, gapClasses[gap], className)}
      data-testid={testId}
    >
      {children}
    </div>
  )
}

/**
 * Preset grid configurations for common use cases
 */
export const GRID_PRESETS = {
  /** Shop/inventory grid: 2 cols mobile, 3 tablet, 4 desktop */
  shop: { mobile: 2, tablet: 3, desktop: 4 } as const,
  /** Card grid: 1 col mobile, 2 tablet, 3 desktop */
  cards: { mobile: 1, tablet: 2, desktop: 3 } as const,
  /** Stats grid: 2 cols mobile, 3 tablet, 6 desktop */
  stats: { mobile: 2, tablet: 3, desktop: 6 } as const,
  /** Dashboard widgets: 1 col mobile, 2 tablet, 3 desktop */
  dashboard: { mobile: 1, tablet: 2, desktop: 3 } as const,
  /** Leaderboard cards: 1 col mobile, 2 tablet, 3 desktop */
  leaderboard: { mobile: 1, tablet: 2, desktop: 3 } as const,
  /** Friends list: 1 col mobile, 2 tablet, 3 desktop */
  friends: { mobile: 1, tablet: 2, desktop: 3 } as const,
} as const

export default ResponsiveGrid
