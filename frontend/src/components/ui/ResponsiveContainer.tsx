/**
 * ResponsiveContainer Component - Mobile Enterprise Optimization
 * 
 * A fluid container component that provides consistent max-width constraints
 * and responsive padding across all viewport sizes.
 * 
 * Features:
 * - Fluid max-width variants (sm, md, lg, xl, 2xl, full)
 * - Responsive padding that scales with viewport
 * - Safe area inset support
 * - Centered content with auto margins
 * 
 * Requirements: 1.1, 2.1, 9.1
 * 
 * @module components/ui/ResponsiveContainer
 */

import { type ReactNode } from 'react'
import { cn } from '@/utils/helpers'

export interface ResponsiveContainerProps {
  children: ReactNode
  /**
   * Maximum width constraint for the container
   * - sm: 640px
   * - md: 768px
   * - lg: 1024px
   * - xl: 1280px
   * - 2xl: 1536px
   * - full: 100% (no max-width)
   * @default 'xl'
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  /**
   * Padding size that scales responsively
   * - none: No padding
   * - sm: 12px mobile, 16px tablet, 24px desktop
   * - md: 16px mobile, 24px tablet, 32px desktop
   * - lg: 24px mobile, 32px tablet, 48px desktop
   * @default 'md'
   */
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /**
   * Whether to include safe area insets for notched devices
   * @default false
   */
  safeArea?: boolean
  /**
   * Additional CSS classes
   */
  className?: string
  /**
   * HTML element to render as
   * @default 'div'
   */
  as?: 'div' | 'section' | 'main' | 'article'
}

const maxWidthClasses: Record<NonNullable<ResponsiveContainerProps['maxWidth']>, string> = {
  sm: 'max-w-[640px]',
  md: 'max-w-[768px]',
  lg: 'max-w-[1024px]',
  xl: 'max-w-[1280px]',
  '2xl': 'max-w-[1536px]',
  full: 'max-w-full',
}

const paddingClasses: Record<NonNullable<ResponsiveContainerProps['padding']>, string> = {
  none: '',
  sm: 'px-3 sm:px-4 lg:px-6',
  md: 'px-4 sm:px-6 lg:px-8',
  lg: 'px-6 sm:px-8 lg:px-12',
}

/**
 * ResponsiveContainer provides a consistent, mobile-first container
 * with fluid max-width and responsive padding.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <ResponsiveContainer>
 *   <h1>Page Content</h1>
 * </ResponsiveContainer>
 * 
 * // With custom max-width and padding
 * <ResponsiveContainer maxWidth="lg" padding="lg">
 *   <h1>Wide Content</h1>
 * </ResponsiveContainer>
 * 
 * // Full width with safe area
 * <ResponsiveContainer maxWidth="full" safeArea>
 *   <nav>Navigation</nav>
 * </ResponsiveContainer>
 * ```
 */
export function ResponsiveContainer({
  children,
  maxWidth = 'xl',
  padding = 'md',
  safeArea = false,
  className,
  as: Component = 'div',
}: ResponsiveContainerProps) {
  return (
    <Component
      className={cn(
        'w-full mx-auto',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        safeArea && 'safe-area-x',
        className
      )}
    >
      {children}
    </Component>
  )
}

export default ResponsiveContainer
