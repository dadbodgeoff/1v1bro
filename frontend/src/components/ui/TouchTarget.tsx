/**
 * TouchTarget - Wrapper component for touch target compliance
 *
 * Ensures minimum 44px touch area for interactive elements.
 * Extends touch area with invisible padding when visual size is smaller.
 *
 * Use for:
 * - Icon buttons
 * - Small interactive elements
 * - Links with small text
 * - Any element that needs touch target enforcement
 *
 * Requirements: 2.3, 2.5
 */

import { forwardRef, type ReactNode, type HTMLAttributes } from 'react'
import { cn } from '@/utils/helpers'
import { useViewport } from '@/hooks/useViewport'
import { TOUCH_TARGET, SPACING } from '@/utils/breakpoints'

export interface TouchTargetProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /**
   * Minimum touch target size in pixels
   * @default 44 (Apple HIG minimum)
   */
  minSize?: number
  /**
   * Whether to center the child content
   * @default true
   */
  centered?: boolean
  /**
   * Force touch optimization even on non-touch devices
   * @default false (auto-detects)
   */
  forceOptimize?: boolean
  /**
   * Disable touch target enforcement
   * @default false
   */
  disabled?: boolean
}

/**
 * Calculate the padding needed to reach minimum touch target
 */
export function calculateTouchPadding(
  contentSize: number,
  minSize: number = TOUCH_TARGET.min
): number {
  if (contentSize >= minSize) return 0
  return Math.ceil((minSize - contentSize) / 2)
}

/**
 * Check if touch target meets minimum requirements
 */
export function meetsTouchTarget(
  width: number,
  height: number,
  minSize: number = TOUCH_TARGET.min
): boolean {
  return width >= minSize && height >= minSize
}

export const TouchTarget = forwardRef<HTMLDivElement, TouchTargetProps>(
  (
    {
      children,
      minSize = TOUCH_TARGET.min,
      centered = true,
      forceOptimize = false,
      disabled = false,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const { isTouch } = useViewport()

    // Determine if touch optimization should be applied
    const shouldOptimize = !disabled && (forceOptimize || isTouch)

    if (!shouldOptimize) {
      // On non-touch devices, render children without wrapper overhead
      return (
        <div ref={ref} className={className} style={style} {...props}>
          {children}
        </div>
      )
    }

    // Touch-optimized wrapper
    return (
      <div
        ref={ref}
        className={cn(
          'relative',
          // Ensure minimum touch target
          'touch-manipulation',
          // Center content if requested
          centered && 'inline-flex items-center justify-center',
          className
        )}
        style={{
          minWidth: `${minSize}px`,
          minHeight: `${minSize}px`,
          // Ensure touch area extends beyond visual bounds
          margin: `-${SPACING.touchGap / 2}px`,
          padding: `${SPACING.touchGap / 2}px`,
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)

TouchTarget.displayName = 'TouchTarget'

/**
 * Hook to get touch target styles for custom implementations
 */
export function useTouchTargetStyles(
  options: {
    minSize?: number
    forceOptimize?: boolean
  } = {}
): {
  shouldOptimize: boolean
  styles: React.CSSProperties
  className: string
} {
  const { isTouch } = useViewport()
  const { minSize = TOUCH_TARGET.min, forceOptimize = false } = options

  const shouldOptimize = forceOptimize || isTouch

  if (!shouldOptimize) {
    return {
      shouldOptimize: false,
      styles: {},
      className: '',
    }
  }

  return {
    shouldOptimize: true,
    styles: {
      minWidth: `${minSize}px`,
      minHeight: `${minSize}px`,
    },
    className: 'touch-manipulation',
  }
}

/**
 * IconButton - Pre-configured TouchTarget for icon buttons
 *
 * Convenience component for icon-only buttons with proper touch targets.
 */
export interface IconButtonProps {
  /**
   * Icon element to render
   */
  icon: ReactNode
  /**
   * Accessible label for the button
   */
  'aria-label': string
  /**
   * Click handler
   */
  onClick?: () => void
  /**
   * Visual size of the icon button
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Button variant
   * @default 'ghost'
   */
  variant?: 'ghost' | 'filled'
  /**
   * Additional class names
   */
  className?: string
  /**
   * Disabled state
   */
  disabled?: boolean
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      'aria-label': ariaLabel,
      onClick,
      size = 'md',
      variant = 'ghost',
      className,
      disabled,
    },
    ref
  ) => {
    const { isTouch } = useViewport()

    // Size configurations
    const sizeConfig = {
      sm: { visual: 32, icon: 16 },
      md: { visual: 40, icon: 20 },
      lg: { visual: 48, icon: 24 },
    }

    const config = sizeConfig[size]

    // Variant styles
    const variantStyles = {
      ghost: 'bg-transparent hover:bg-white/5 active:bg-white/10',
      filled: 'bg-white/10 hover:bg-white/15 active:bg-white/20',
    }

    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(
          'inline-flex items-center justify-center rounded-lg',
          'text-[#a3a3a3] hover:text-white',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          // Touch-specific
          isTouch && 'touch-manipulation active:scale-95',
          className
        )}
        style={{
          width: `${config.visual}px`,
          height: `${config.visual}px`,
          // Ensure touch target compliance
          minWidth: isTouch ? `${TOUCH_TARGET.min}px` : undefined,
          minHeight: isTouch ? `${TOUCH_TARGET.min}px` : undefined,
        }}
      >
        <span
          style={{
            width: `${config.icon}px`,
            height: `${config.icon}px`,
          }}
        >
          {icon}
        </span>
      </button>
    )
  }
)

IconButton.displayName = 'IconButton'

export default TouchTarget
