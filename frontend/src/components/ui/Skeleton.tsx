/**
 * Skeleton Component - 2025 Design System
 * Requirements: 2.9, 5.6
 * 
 * Provides loading placeholder shapes with shimmer animation.
 * Uses 1.5s duration shimmer effect (left-to-right gradient sweep).
 */

import { cn } from '@/utils/helpers'

type SkeletonVariant = 'text' | 'circle' | 'rectangle' | 'card'

interface SkeletonProps {
  /** Shape variant */
  variant?: SkeletonVariant
  /** Width - can be number (px) or string (e.g., '100%', '8rem') */
  width?: number | string
  /** Height - can be number (px) or string */
  height?: number | string
  /** Additional CSS classes */
  className?: string
  /** Number of skeleton items to render (for lists) */
  count?: number
}

const variantStyles: Record<SkeletonVariant, string> = {
  text: 'rounded-md h-4',
  circle: 'rounded-full',
  rectangle: 'rounded-lg',
  card: 'rounded-xl',
}

export function Skeleton({
  variant = 'rectangle',
  width,
  height,
  className,
  count = 1,
}: SkeletonProps) {
  const style: React.CSSProperties = {}
  
  if (width !== undefined) {
    style.width = typeof width === 'number' ? `${width}px` : width
  }
  if (height !== undefined) {
    style.height = typeof height === 'number' ? `${height}px` : height
  }

  const skeletonElement = (
    <div
      className={cn(
        // Base shimmer animation from index.css
        'skeleton-shimmer',
        variantStyles[variant],
        className
      )}
      style={style}
      aria-hidden="true"
    />
  )

  if (count === 1) {
    return skeletonElement
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'skeleton-shimmer',
            variantStyles[variant],
            className
          )}
          style={style}
          aria-hidden="true"
        />
      ))}
    </>
  )
}

// ============================================
// Pre-built Skeleton Compositions
// ============================================

/** Skeleton for leaderboard entries */
export function LeaderboardEntrySkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl">
      <Skeleton variant="rectangle" width={48} height={32} />
      <Skeleton variant="circle" width={40} height={40} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width={128} />
        <Skeleton variant="text" width={80} />
      </div>
      <Skeleton variant="rectangle" width={80} height={32} />
    </div>
  )
}

/** Skeleton for shop item cards */
export function ShopCardSkeleton() {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl overflow-hidden">
      {/* Image placeholder */}
      <Skeleton variant="rectangle" className="aspect-square w-full" />
      {/* Content */}
      <div className="p-4 space-y-3">
        <Skeleton variant="text" width="70%" />
        <div className="flex items-center justify-between">
          <Skeleton variant="rectangle" width={60} height={24} />
          <Skeleton variant="rectangle" width={80} height={28} />
        </div>
      </div>
    </div>
  )
}

/** Skeleton for battle pass tier cards */
export function TierCardSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 w-24">
      {/* Premium reward */}
      <Skeleton variant="card" width={80} height={80} />
      {/* Tier number */}
      <Skeleton variant="circle" width={28} height={28} />
      {/* Free reward */}
      <Skeleton variant="card" width={80} height={80} />
    </div>
  )
}

/** Skeleton for dashboard widgets */
export function WidgetSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl p-5 space-y-4">
      {/* Widget title */}
      <Skeleton variant="text" width={120} height={16} />
      {/* Content rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton variant="circle" width={32} height={32} />
            <div className="flex-1 space-y-1.5">
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" height={12} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Skeleton for XP progress bar */
export function XPProgressSkeleton() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width={80} />
        <Skeleton variant="text" width={100} />
      </div>
      <Skeleton variant="rectangle" height={12} className="w-full rounded-full" />
    </div>
  )
}

/** Skeleton for featured shop item */
export function FeaturedItemSkeleton() {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-2xl p-6 flex gap-6">
      {/* Large preview */}
      <Skeleton variant="rectangle" width={400} height={400} className="rounded-xl" />
      {/* Details */}
      <div className="flex-1 flex flex-col justify-center space-y-4">
        <Skeleton variant="rectangle" width={80} height={24} />
        <Skeleton variant="text" width="80%" height={32} />
        <Skeleton variant="text" width="60%" />
        <div className="flex items-center gap-4 mt-4">
          <Skeleton variant="rectangle" width={120} height={40} />
          <Skeleton variant="rectangle" width={100} height={40} />
        </div>
      </div>
    </div>
  )
}
