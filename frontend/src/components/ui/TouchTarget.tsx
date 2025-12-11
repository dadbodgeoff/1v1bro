/**
 * TouchTarget Component - Mobile Enterprise Optimization
 * 
 * A wrapper component that enforces minimum touch target sizes
 * per Apple HIG (44px) and Material Design (48px) guidelines.
 * 
 * Features:
 * - Enforces minimum 44px dimensions on touch devices
 * - Visual debug mode for development
 * - Flexible sizing options
 * - Preserves child element styling
 * 
 * Requirements: 1.3, 2.3, 3.3
 * 
 * @module components/ui/TouchTarget
 */

import { type ReactNode, type CSSProperties } from 'react'
import { cn } from '@/utils/helpers'
import { useViewport } from '@/hooks/useViewport'
import { TOUCH_TARGET } from '@/utils/breakpoints'

export interface TouchTargetProps {
  children: ReactNode
  /**
   * Minimum size for the touch target
   * - min: 44px (Apple HIG minimum)
   * - recommended: 48px (Material Design)
   * - comfortable: 56px (Accessible)
   * @default 'min'
   */
  size?: 'min' | 'recommended' | 'comfortable'
  /**
   * Custom minimum size in pixels (overrides size prop)
   */
  minSize?: number
  /**
   * Whether to show visual debug outline
   * @default false
   */
  debug?: boolean
  /**
   * Whether to center the child content
   * @default true
   */
  centered?: boolean
  /**
   * Whether to apply touch target only on touch devices
   * @default true
   */
  touchOnly?: boolean
  /**
   * Additional CSS classes
   */
  className?: string
  /**
   * Additional inline styles
   */
  style?: CSSProperties
  /**
   * Click handler
   */
  onClick?: () => void
  /**
   * Accessibility label
   */
  'aria-label'?: string
}

const sizeMap: Record<NonNullable<TouchTargetProps['size']>, number> = {
  min: TOUCH_TARGET.min,           // 44px
  recommended: TOUCH_TARGET.recommended, // 48px
  comfortable: TOUCH_TARGET.comfortable, // 56px
}

/**
 * TouchTarget ensures interactive elements meet minimum touch target
 * requirements for mobile accessibility.
 * 
 * @example
 * ```tsx
 * // Wrap an icon button
 * <TouchTarget>
 *   <button onClick={handleClick}>
 *     <Icon />
 *   </button>
 * </TouchTarget>
 * 
 * // With debug mode
 * <TouchTarget debug>
 *   <SmallButton />
 * </TouchTarget>
 * 
 * // Custom size
 * <TouchTarget minSize={56}>
 *   <IconButton />
 * </TouchTarget>
 * ```
 */
export function TouchTarget({
  children,
  size = 'min',
  minSize,
  debug = false,
  centered = true,
  touchOnly = true,
  className,
  style,
  onClick,
  'aria-label': ariaLabel,
}: TouchTargetProps) {
  const { isTouch } = useViewport()
  
  // Determine if we should apply touch target sizing
  const shouldApply = !touchOnly || isTouch
  
  // Calculate the minimum size
  const targetSize = minSize ?? sizeMap[size]
  
  // Build styles
  const touchStyles: CSSProperties = shouldApply
    ? {
        minWidth: `${targetSize}px`,
        minHeight: `${targetSize}px`,
      }
    : {}

  return (
    <div
      className={cn(
        'inline-flex',
        centered && 'items-center justify-center',
        debug && 'outline outline-2 outline-dashed outline-red-500/50',
        className
      )}
      style={{
        ...touchStyles,
        ...style,
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  )
}

/**
 * Calculate padding needed to reach touch target size
 */
export function calculateTouchPadding(
  contentSize: number,
  minSize: number = TOUCH_TARGET.min
): number {
  if (contentSize >= minSize) return 0
  return Math.ceil((minSize - contentSize) / 2)
}

/**
 * Utility to check if an element meets touch target requirements
 */
export function meetsTouchTarget(
  width: number,
  height: number,
  minSize: number = TOUCH_TARGET.min
): boolean {
  return width >= minSize && height >= minSize
}

/**
 * Get the touch target gap requirement
 */
export function getTouchTargetGap(): number {
  return 8 // Minimum gap between touch targets
}

export interface UseTouchTargetStylesOptions {
  size?: TouchTargetProps['size']
  minSize?: number
  forceOptimize?: boolean
}

export interface UseTouchTargetStylesResult {
  shouldOptimize: boolean
  styles: CSSProperties
  className: string
}

/**
 * Hook to get touch target styles for custom implementations
 */
export function useTouchTargetStyles(
  options: UseTouchTargetStylesOptions = {}
): UseTouchTargetStylesResult {
  const { size = 'min', minSize, forceOptimize = false } = options
  const { isTouch } = useViewport()
  const targetSize = minSize ?? sizeMap[size]
  
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
      minWidth: `${targetSize}px`,
      minHeight: `${targetSize}px`,
    },
    className: 'touch-manipulation',
  }
}

export default TouchTarget
