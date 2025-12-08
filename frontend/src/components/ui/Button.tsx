/**
 * Button Component - 2025 Design System
 * Requirements: 2.1, 7.1
 */

import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/helpers'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'premium'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
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
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center font-medium rounded-lg',
      'transition-all duration-100 ease-out',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'active:scale-[0.98]' // Button press effect (Req 7.1)
    )

    const variants = {
      primary: cn(
        'bg-[#6366f1] text-white',
        'hover:bg-[#4f46e5]',
        'focus-visible:ring-[#6366f1]'
      ),
      secondary: cn(
        'bg-white/10 text-white border border-white/10',
        'hover:bg-white/20 hover:border-white/20',
        'focus-visible:ring-white/50'
      ),
      ghost: cn(
        'bg-transparent text-[#a3a3a3]',
        'hover:bg-white/5 hover:text-white',
        'focus-visible:ring-white/30'
      ),
      danger: cn(
        'bg-[#f43f5e] text-white',
        'hover:bg-[#e11d48]',
        'focus-visible:ring-[#f43f5e]'
      ),
      premium: cn(
        'bg-gradient-to-r from-[#f59e0b] to-[#ea580c] text-black font-semibold',
        'hover:from-[#fbbf24] hover:to-[#f97316]',
        'focus-visible:ring-[#f59e0b]',
        'shadow-lg shadow-amber-500/20'
      ),
    }

    const sizes = {
      sm: 'h-8 px-3 text-sm gap-1.5',
      md: 'h-10 px-4 text-base gap-2',
      lg: 'h-12 px-6 text-lg gap-2.5',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
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
