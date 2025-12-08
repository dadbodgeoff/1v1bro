/**
 * Input Component - 2025 Design System
 * Requirements: 2.2
 */

import { type InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/helpers'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, hint, id, ...props }, ref) => {
    const inputId = id || props.name

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[#a3a3a3] mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373] pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-10 px-4 bg-[#111111] border rounded-lg text-white placeholder-[#737373]',
              'transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:border-transparent',
              error
                ? 'border-[#f43f5e] focus-visible:ring-[#f43f5e]'
                : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)]',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-sm text-[#f43f5e]">{error}</p>}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-[#737373]">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
