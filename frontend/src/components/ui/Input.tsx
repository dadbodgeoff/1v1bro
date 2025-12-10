/**
 * Input Component - 2025 Design System
 *
 * Mobile-optimized input with touch target enforcement.
 * - Minimum 48px height on mobile for comfortable touch
 * - 16px+ font size to prevent iOS auto-zoom
 * - Proper keyboard handling with inputMode and enterKeyHint
 *
 * Requirements: 2.2, 2.4
 */

import { type InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/helpers'
import { useViewport } from '@/hooks/useViewport'
import { TOUCH_TARGET } from '@/utils/breakpoints'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  hint?: string
  /**
   * Size variant - mobile automatically uses 'lg' for touch compliance
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Force touch-optimized sizing
   */
  touchOptimized?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      leftIcon,
      rightIcon,
      hint,
      id,
      size = 'md',
      touchOptimized,
      style,
      ...props
    },
    ref
  ) => {
    const { isTouch, isMobile } = useViewport()
    const inputId = id || props.name

    // Determine if touch optimization should be applied
    const shouldOptimize = touchOptimized ?? isTouch

    // Size classes with mobile adjustments
    const sizeClasses = {
      sm: 'h-8 text-sm',
      md: 'h-10 text-base',
      lg: 'h-12 text-base',
    }

    // On touch devices, enforce minimum height for touch targets
    const effectiveSize = shouldOptimize && size === 'sm' ? 'md' : size

    // Mobile-specific styles to prevent iOS zoom and ensure touch compliance
    const mobileStyles: React.CSSProperties = isMobile
      ? {
          // 16px minimum prevents iOS auto-zoom on focus
          fontSize: '16px',
          // Ensure touch target compliance
          minHeight: `${TOUCH_TARGET.recommended}px`,
        }
      : {}

    // Touch-optimized styles
    const touchStyles: React.CSSProperties = shouldOptimize
      ? {
          minHeight: `${TOUCH_TARGET.recommended}px`,
        }
      : {}

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block font-medium text-[#a3a3a3] mb-1.5',
              // Larger label on mobile for readability
              isMobile ? 'text-base' : 'text-sm'
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div
              className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 text-[#737373] pointer-events-none',
                // Larger icons on touch devices
                shouldOptimize && 'w-5 h-5'
              )}
            >
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full px-4 bg-[#111111] border rounded-lg text-white placeholder-[#737373]',
              'transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:border-transparent',
              error
                ? 'border-[#f43f5e] focus-visible:ring-[#f43f5e]'
                : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)]',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              sizeClasses[effectiveSize],
              // Touch-specific: remove tap highlight and improve touch response
              shouldOptimize && 'touch-manipulation',
              className
            )}
            style={{ ...touchStyles, ...mobileStyles, ...style }}
            {...props}
          />
          {rightIcon && (
            <div
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2 text-[#737373]',
                shouldOptimize && 'w-5 h-5'
              )}
            >
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p
            className={cn(
              'mt-1.5 text-[#f43f5e]',
              isMobile ? 'text-base' : 'text-sm'
            )}
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p
            className={cn(
              'mt-1.5 text-[#737373]',
              isMobile ? 'text-base' : 'text-sm'
            )}
          >
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
