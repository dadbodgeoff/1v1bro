/**
 * SafeAreaView - Wrapper component for safe area inset handling
 *
 * Applies safe area insets based on position to prevent content
 * from being obscured by device notches, home indicators, or
 * rounded corners.
 *
 * Requirements: 3.1, 3.2, 3.3
 */

import { forwardRef, type ReactNode, type HTMLAttributes } from 'react'
import { cn } from '@/utils/helpers'
import { useViewport } from '@/hooks/useViewport'

export type SafeAreaEdge = 'top' | 'right' | 'bottom' | 'left'

export interface SafeAreaViewProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /**
   * Which edges to apply safe area padding to
   * @default ['top', 'right', 'bottom', 'left']
   */
  edges?: SafeAreaEdge[]
  /**
   * Additional padding to add beyond safe area insets (in pixels)
   * @default 0
   */
  additionalPadding?: number
  /**
   * Minimum padding to apply even when safe area is 0
   * @default 0
   */
  minPadding?: number
  /**
   * Use CSS env() directly instead of JavaScript values
   * Better for SSR and initial render
   * @default true
   */
  useCSSEnv?: boolean
}

/**
 * Get safe area styles for specified edges
 */
export function getSafeAreaStyles(
  edges: SafeAreaEdge[],
  safeAreaInsets: { top: number; right: number; bottom: number; left: number },
  additionalPadding: number = 0,
  minPadding: number = 0
): React.CSSProperties {
  const styles: React.CSSProperties = {}

  if (edges.includes('top')) {
    styles.paddingTop = Math.max(safeAreaInsets.top + additionalPadding, minPadding)
  }
  if (edges.includes('right')) {
    styles.paddingRight = Math.max(safeAreaInsets.right + additionalPadding, minPadding)
  }
  if (edges.includes('bottom')) {
    styles.paddingBottom = Math.max(safeAreaInsets.bottom + additionalPadding, minPadding)
  }
  if (edges.includes('left')) {
    styles.paddingLeft = Math.max(safeAreaInsets.left + additionalPadding, minPadding)
  }

  return styles
}

/**
 * Get CSS env() based safe area styles
 * Uses CSS custom properties with env() fallbacks
 */
export function getSafeAreaCSSStyles(
  edges: SafeAreaEdge[],
  additionalPadding: number = 0,
  minPadding: number = 0
): React.CSSProperties {
  const styles: React.CSSProperties = {}

  const createValue = (edge: string) => {
    if (additionalPadding > 0 && minPadding > 0) {
      return `max(${minPadding}px, calc(env(safe-area-inset-${edge}, 0px) + ${additionalPadding}px))`
    }
    if (additionalPadding > 0) {
      return `calc(env(safe-area-inset-${edge}, 0px) + ${additionalPadding}px)`
    }
    if (minPadding > 0) {
      return `max(${minPadding}px, env(safe-area-inset-${edge}, 0px))`
    }
    return `env(safe-area-inset-${edge}, 0px)`
  }

  if (edges.includes('top')) {
    styles.paddingTop = createValue('top')
  }
  if (edges.includes('right')) {
    styles.paddingRight = createValue('right')
  }
  if (edges.includes('bottom')) {
    styles.paddingBottom = createValue('bottom')
  }
  if (edges.includes('left')) {
    styles.paddingLeft = createValue('left')
  }

  return styles
}

export const SafeAreaView = forwardRef<HTMLDivElement, SafeAreaViewProps>(
  (
    {
      children,
      edges = ['top', 'right', 'bottom', 'left'],
      additionalPadding = 0,
      minPadding = 0,
      useCSSEnv = true,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const { safeAreaInsets } = useViewport()

    // Choose between CSS env() or JavaScript values
    const safeAreaStyles = useCSSEnv
      ? getSafeAreaCSSStyles(edges, additionalPadding, minPadding)
      : getSafeAreaStyles(edges, safeAreaInsets, additionalPadding, minPadding)

    return (
      <div
        ref={ref}
        className={cn('safe-area-view', className)}
        style={{ ...safeAreaStyles, ...style }}
        {...props}
      >
        {children}
      </div>
    )
  }
)

SafeAreaView.displayName = 'SafeAreaView'

/**
 * SafeAreaTop - Convenience component for top safe area only
 */
export const SafeAreaTop = forwardRef<
  HTMLDivElement,
  Omit<SafeAreaViewProps, 'edges'>
>((props, ref) => <SafeAreaView ref={ref} edges={['top']} {...props} />)

SafeAreaTop.displayName = 'SafeAreaTop'

/**
 * SafeAreaBottom - Convenience component for bottom safe area only
 */
export const SafeAreaBottom = forwardRef<
  HTMLDivElement,
  Omit<SafeAreaViewProps, 'edges'>
>((props, ref) => <SafeAreaView ref={ref} edges={['bottom']} {...props} />)

SafeAreaBottom.displayName = 'SafeAreaBottom'

/**
 * SafeAreaHorizontal - Convenience component for left/right safe areas
 */
export const SafeAreaHorizontal = forwardRef<
  HTMLDivElement,
  Omit<SafeAreaViewProps, 'edges'>
>((props, ref) => <SafeAreaView ref={ref} edges={['left', 'right']} {...props} />)

SafeAreaHorizontal.displayName = 'SafeAreaHorizontal'

/**
 * Hook to get safe area styles for custom implementations
 */
export function useSafeAreaStyles(
  edges: SafeAreaEdge[] = ['top', 'right', 'bottom', 'left'],
  options: {
    additionalPadding?: number
    minPadding?: number
    useCSSEnv?: boolean
  } = {}
): React.CSSProperties {
  const { safeAreaInsets } = useViewport()
  const { additionalPadding = 0, minPadding = 0, useCSSEnv = true } = options

  if (useCSSEnv) {
    return getSafeAreaCSSStyles(edges, additionalPadding, minPadding)
  }

  return getSafeAreaStyles(edges, safeAreaInsets, additionalPadding, minPadding)
}

export default SafeAreaView
