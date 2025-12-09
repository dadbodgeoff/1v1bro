/**
 * IconBase - Base icon wrapper component
 * 
 * Provides consistent sizing and styling for all landing page icons.
 * Uses currentColor for stroke inheritance.
 * 
 * @module landing/enterprise/icons/IconBase
 * Requirements: 13.1, 13.2
 */

import type { ReactNode } from 'react'
import { cn } from '@/utils/helpers'

export type IconSize = 'sm' | 'default' | 'lg' | 'xl'

export interface IconBaseProps {
  /** Icon size */
  size?: IconSize
  /** Additional CSS classes */
  className?: string
  /** SVG content */
  children: ReactNode
  /** Accessible label */
  'aria-label'?: string
}

/**
 * Size to pixel mapping
 */
export const ICON_SIZES: Record<IconSize, number> = {
  sm: 16,
  default: 24,
  lg: 32,
  xl: 48,
}

/**
 * Get pixel size for an icon size variant
 */
export function getIconPixelSize(size: IconSize): number {
  return ICON_SIZES[size]
}

export function IconBase({
  size = 'default',
  className,
  children,
  'aria-label': ariaLabel,
}: IconBaseProps) {
  const pixelSize = ICON_SIZES[size]

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : 'presentation'}
      data-size={size}
    >
      {children}
    </svg>
  )
}

export default IconBase
