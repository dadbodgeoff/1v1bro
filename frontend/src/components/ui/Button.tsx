/**
 * Button Component - 2025 Design System
 *
 * Mobile-optimized button with touch target enforcement.
 * Automatically applies 44px+ touch targets on touch devices.
 *
 * Requirements: 2.1, 2.3, 7.1
 */

import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/helpers'
import { useViewport } from '@/hooks/useViewport'
import { TOUCH_TARGET } from '@/utils/breakpoints'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'premium'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  /**
   * Force touch target enforcement (44px+ min dimensions)
   * Defaults to true on touch devices
   */
  touchOptimized?: boolean
  /**
   * Make button full width
   */
  fullWidth?: boolean
}

/**
 * Calculate touch target styles based on device and size
 */
export function getTouchTargetStyles(
  size: 'sm' | 'md' | 'lg',
  isTouch: boolean,
  touchOptimized?: boolean
): React.CSSProperties {
  // Apply touch optimization if explicitly enabled or on touch devices
  const shouldOptimize = touchOptimized ?? isTouch

  if (!shouldOptimize) return {}

  const minSize = TOUCH_TARGET.min // 44px per Apple HIG

  // Size-specific adjustments to ensure touch target compliance
  const sizeAdjustments: Record<string, React.CSSProperties> = {
    sm: {
      minHeight: `${minSize}px`,
      minWidth: `${minSize}px`,
      // Increase padding to reach touch target while keeping visual size
      padding: '10px 16px',
    },
    md: {
      minHeight: `${minSize}px`,
      minWidth: `${minSize}px`,
    },
    lg: {
      // lg is already 48px, no adjustment needed
    },
  }

  return sizeAdjustments[size] || {}
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading,
      disabled,
      leftIcon,
      rightIcon,
      touchOptimized,
      fullWidth,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const { isTouch, isMobile } = useViewport()

    // Calculate touch target styles
    const touchStyles = getTouchTargetStyles(size, isTouch, touchOptimized)

    const baseStyles = cn(
      'inline-flex items-center justify-center font-medium rounded-lg',
      'transition-all duration-100 ease-out',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      // Touch feedback - more pronounced on touch devices
      isTouch ? 'active:scale-95' : 'active:scale-[0.98]',
      // Touch-specific: remove hover delay for immediate feedback
      isTouch && 'touch-manipulation',
      // Full width support
      fullWidth && 'w-full'
    )

    const variants = {
      primary: cn(
        'bg-[#6366f1] text-white',
        'hover:bg-[#4f46e5]',
        'focus-visible:ring-[#6366f1]',
        // Touch active state
        isTouch && 'active:bg-[#4338ca]'
      ),
      secondary: cn(
        'bg-white/10 text-white border border-white/10',
        'hover:bg-white/20 hover:border-white/20',
        'focus-visible:ring-white/50',
        isTouch && 'active:bg-white/25'
      ),
      ghost: cn(
        'bg-transparent text-[#a3a3a3]',
        'hover:bg-white/5 hover:text-white',
        'focus-visible:ring-white/30',
        isTouch && 'active:bg-white/10'
      ),
      danger: cn(
        'bg-[#f43f5e] text-white',
        'hover:bg-[#e11d48]',
        'focus-visible:ring-[#f43f5e]',
        isTouch && 'active:bg-[#be123c]'
      ),
      premium: cn(
        'bg-gradient-to-r from-[#f59e0b] to-[#ea580c] text-black font-semibold',
        'hover:from-[#fbbf24] hover:to-[#f97316]',
        'focus-visible:ring-[#f59e0b]',
        'shadow-lg shadow-amber-500/20',
        isTouch && 'active:from-[#d97706] active:to-[#c2410c]'
      ),
    }

    const sizes = {
      sm: 'h-8 px-3 text-sm gap-1.5',
      md: 'h-10 px-4 text-base gap-2',
      lg: 'h-12 px-6 text-lg gap-2.5',
    }

    // Mobile-specific: stack buttons vertically when in a group
    const mobileStyles = isMobile
      ? {
          // Ensure minimum font size to prevent iOS zoom
          fontSize: size === 'sm' ? '14px' : undefined,
        }
      : {}

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        style={{ ...touchStyles, ...mobileStyles, ...style }}
        {...props}
      >
        {isLoading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
