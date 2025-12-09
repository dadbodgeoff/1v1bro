/**
 * CTAButton - Call-to-action button component
 * 
 * Provides 3 variants (primary, secondary, tertiary) and 2 sizes.
 * Includes proper hover, focus, and disabled states.
 * 
 * @module landing/enterprise/CTAButton
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */

import type { ReactNode, ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/helpers'

export type CTAButtonVariant = 'primary' | 'secondary' | 'tertiary'
export type CTAButtonSize = 'default' | 'large'

export interface CTAButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Visual variant */
  variant?: CTAButtonVariant
  /** Size variant */
  size?: CTAButtonSize
  /** Button content */
  children: ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * Base styles applied to all variants
 */
const baseStyles = [
  'inline-flex items-center justify-center',
  'font-semibold',
  'rounded-2xl',
  'transition-all duration-150 ease-out',
  'focus:outline-none focus:ring-2 focus:ring-offset-2',
  'focus:ring-[#F97316] focus:ring-offset-[#09090B]',
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none',
].join(' ')

/**
 * Variant-specific styles
 */
const variantStyles: Record<CTAButtonVariant, string> = {
  primary: [
    'bg-[#F97316]',
    'text-white',
    'hover:bg-[#FB923C]',
    'hover:translate-y-[-2px]',
    'hover:shadow-lg hover:shadow-[#F97316]/20',
    'active:translate-y-0',
  ].join(' '),
  
  secondary: [
    'bg-transparent',
    'border-[1.5px] border-white/[0.16]',
    'text-white',
    'hover:bg-white/[0.04]',
    'hover:border-white/[0.24]',
    'hover:translate-y-[-2px]',
  ].join(' '),
  
  tertiary: [
    'bg-transparent',
    'text-[#B4B4B4]',
    'hover:text-white',
    'hover:underline',
    'focus:ring-0',
  ].join(' '),
}

/**
 * Size-specific styles
 */
const sizeStyles: Record<CTAButtonSize, string> = {
  default: [
    'px-6 py-4',
    'text-base',
    'min-h-[56px]',
    'min-w-[160px]',
  ].join(' '),
  
  large: [
    'px-8 py-5',
    'text-lg',
    'min-h-[64px]',
    'min-w-[180px]',
  ].join(' '),
}

/**
 * Get variant styles for testing
 */
export function getButtonVariantStyles(variant: CTAButtonVariant): string {
  return variantStyles[variant]
}

/**
 * Get size styles for testing
 */
export function getButtonSizeStyles(size: CTAButtonSize): string {
  return sizeStyles[size]
}

export function CTAButton({
  variant = 'primary',
  size = 'default',
  children,
  className,
  disabled,
  ...props
}: CTAButtonProps) {
  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  )
}

export default CTAButton
