/**
 * ComponentBox - Base container component for landing page
 * 
 * Provides consistent styling with 4 variants:
 * - default: Standard card background
 * - elevated: Raised with shadow
 * - interactive: Hover effects for clickable elements
 * - featured: Accent border with subtle glow
 * 
 * @module landing/enterprise/ComponentBox
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import type { ReactNode } from 'react'
import { cn } from '@/utils/helpers'

export type ComponentBoxVariant = 'default' | 'elevated' | 'interactive' | 'featured'

export interface ComponentBoxProps {
  /** Visual variant */
  variant?: ComponentBoxVariant
  /** Content */
  children: ReactNode
  /** Additional CSS classes */
  className?: string
  /** Click handler (enables interactive styles) */
  onClick?: () => void
  /** Test ID for testing */
  'data-testid'?: string
}

/**
 * Base styles applied to all variants
 */
const baseStyles = 'rounded-2xl transition-all duration-200'

/**
 * Variant-specific styles
 */
const variantStyles: Record<ComponentBoxVariant, string> = {
  default: [
    'bg-[#18181B]',
    'border border-white/[0.08]',
    'p-6',
  ].join(' '),
  
  elevated: [
    'bg-[#111113]',
    'border border-white/[0.08]',
    'shadow-[0_4px_24px_rgba(0,0,0,0.4)]',
    'p-6',
  ].join(' '),
  
  interactive: [
    'bg-[#18181B]',
    'border border-white/[0.08]',
    'p-6',
    'cursor-pointer',
    'hover:translate-y-[-2px]',
    'hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
    'hover:border-white/[0.12]',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-[#F97316]',
    'focus:ring-offset-2',
    'focus:ring-offset-[#09090B]',
  ].join(' '),
  
  featured: [
    'bg-[#18181B]',
    'border border-[#F97316]/30',
    'p-6',
    'shadow-[inset_0_0_40px_rgba(249,115,22,0.05)]',
  ].join(' '),
}

/**
 * Get variant styles for a given variant
 * Exported for testing
 */
export function getVariantStyles(variant: ComponentBoxVariant): string {
  return variantStyles[variant]
}

export function ComponentBox({
  variant = 'default',
  children,
  className,
  onClick,
  'data-testid': testId,
}: ComponentBoxProps) {
  const Component = onClick ? 'button' : 'div'
  
  return (
    <Component
      className={cn(baseStyles, variantStyles[variant], className)}
      onClick={onClick}
      data-testid={testId}
      data-variant={variant}
    >
      {children}
    </Component>
  )
}

export default ComponentBox
