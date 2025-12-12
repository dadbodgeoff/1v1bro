/**
 * WidgetSkeleton - Reusable skeleton loader for dashboard widgets
 * 
 * Provides consistent loading states across all dashboard widgets with:
 * - Shimmer animation effect
 * - Stagger animation support (50ms delay between widgets)
 * - Configurable layout variants for different widget types
 * - "Taking longer than expected" message after timeout
 * 
 * Props:
 * @param variant - Widget type for appropriate skeleton layout
 * @param staggerIndex - Index for stagger animation delay (index * 50ms)
 * @param showTimeout - Whether to show timeout message after 5s
 * @param onCancel - Callback when cancel is clicked (timeout state)
 * @param className - Additional CSS classes
 * 
 * Requirements: 3.1, 3.2, 3.5
 */

import { useState, useEffect } from 'react'
import { cn } from '@/utils/helpers'

export type SkeletonVariant = 
  | 'hero'        // HeroPlaySection
  | 'battlepass'  // BattlePassWidget
  | 'shop'        // ShopPreviewWidget
  | 'loadout'     // LoadoutPreviewWidget
  | 'stats'       // StatsSummaryWidget
  | 'matches'     // MatchHistoryWidget
  | 'friends'     // FriendsWidget
  | 'default'     // Generic skeleton

export interface WidgetSkeletonProps {
  variant?: SkeletonVariant
  staggerIndex?: number
  showTimeout?: boolean
  timeoutMs?: number
  onCancel?: () => void
  className?: string
}

const TIMEOUT_MS = 5000

export function WidgetSkeleton({
  variant = 'default',
  staggerIndex = 0,
  showTimeout = true,
  timeoutMs = TIMEOUT_MS,
  onCancel,
  className,
}: WidgetSkeletonProps) {
  const [isTimedOut, setIsTimedOut] = useState(false)

  // Handle timeout - Requirements 3.5
  useEffect(() => {
    if (!showTimeout) return

    const timer = setTimeout(() => {
      setIsTimedOut(true)
    }, timeoutMs)

    return () => clearTimeout(timer)
  }, [showTimeout, timeoutMs])

  // Stagger delay for animation - Requirements 3.2
  const staggerDelay = staggerIndex * 50

  if (isTimedOut) {
    return (
      <div className={cn('p-5 bg-[#111111] border border-white/[0.06] rounded-xl', className)}>
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-10 h-10 mb-3 rounded-full bg-amber-500/10 flex items-center justify-center">
            <ClockIcon className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-sm text-neutral-400 mb-1">Taking longer than expected</p>
          <p className="text-xs text-neutral-500 mb-3">Please wait or try again later</p>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-3 py-1.5 bg-white/[0.06] text-neutral-300 text-xs font-medium rounded-lg hover:bg-white/[0.1] transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div 
      className={cn('p-5 bg-[#111111] border border-white/[0.06] rounded-xl', className)}
      style={{ animationDelay: `${staggerDelay}ms` }}
    >
      <div className="animate-pulse" style={{ animationDelay: `${staggerDelay}ms` }}>
        {renderSkeletonContent(variant)}
      </div>
    </div>
  )
}

function renderSkeletonContent(variant: SkeletonVariant) {
  switch (variant) {
    case 'hero':
      return <HeroSkeleton />
    case 'battlepass':
      return <BattlePassSkeleton />
    case 'shop':
      return <ShopSkeleton />
    case 'loadout':
      return <LoadoutSkeleton />
    case 'stats':
      return <StatsSkeleton />
    case 'matches':
      return <MatchesSkeleton />
    case 'friends':
      return <FriendsSkeleton />
    default:
      return <DefaultSkeleton />
  }
}

// Skeleton variants for each widget type

function HeroSkeleton() {
  return (
    <>
      <div className="h-7 w-32 bg-white/[0.1] rounded mb-5" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="h-10 bg-white/[0.1] rounded-lg" />
        <div className="h-10 bg-white/[0.1] rounded-lg" />
      </div>
      <div className="h-14 bg-white/[0.1] rounded-xl mb-4" />
      <div className="grid grid-cols-3 gap-3">
        <div className="h-11 bg-white/[0.1] rounded-xl" />
        <div className="h-11 bg-white/[0.1] rounded-xl" />
        <div className="h-11 bg-white/[0.1] rounded-xl" />
      </div>
    </>
  )
}

function BattlePassSkeleton() {
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-24 bg-white/[0.1] rounded" />
        <div className="h-5 w-16 bg-white/[0.1] rounded-full" />
      </div>
      <div className="h-3 w-20 bg-white/[0.1] rounded mb-3" />
      <div className="h-10 w-20 bg-white/[0.1] rounded mb-4" />
      <div className="h-2 w-full bg-white/[0.1] rounded mb-2" />
      <div className="flex justify-between">
        <div className="h-3 w-24 bg-white/[0.1] rounded" />
        <div className="h-3 w-16 bg-white/[0.1] rounded" />
      </div>
    </>
  )
}

function ShopSkeleton() {
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-28 bg-white/[0.1] rounded" />
        <div className="h-4 w-16 bg-white/[0.1] rounded" />
      </div>
      <div className="h-3 w-32 bg-white/[0.1] rounded mb-3" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i}>
            <div className="aspect-square bg-white/[0.05] rounded-lg mb-2" />
            <div className="h-3 w-16 bg-white/[0.1] rounded mb-1" />
            <div className="h-3 w-12 bg-white/[0.1] rounded" />
          </div>
        ))}
      </div>
    </>
  )
}

function LoadoutSkeleton() {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-24 bg-white/[0.1] rounded" />
        <div className="h-4 w-16 bg-white/[0.1] rounded" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i}>
            <div className="aspect-square bg-white/[0.05] rounded-lg mb-2" />
            <div className="h-3 w-12 bg-white/[0.1] rounded mx-auto" />
          </div>
        ))}
      </div>
    </>
  )
}

function StatsSkeleton() {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-20 bg-white/[0.1] rounded" />
        <div className="h-4 w-20 bg-white/[0.1] rounded" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-3 bg-white/[0.03] rounded-lg">
            <div className="h-6 w-12 bg-white/[0.1] rounded mb-1" />
            <div className="h-3 w-16 bg-white/[0.1] rounded" />
          </div>
        ))}
      </div>
    </>
  )
}

function MatchesSkeleton() {
  return (
    <>
      <div className="h-4 w-28 bg-white/[0.1] rounded mb-4" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <div className="w-8 h-8 bg-white/[0.1] rounded-full" />
            <div className="flex-1">
              <div className="h-4 w-24 bg-white/[0.1] rounded mb-1" />
              <div className="h-3 w-16 bg-white/[0.1] rounded" />
            </div>
            <div className="h-5 w-12 bg-white/[0.1] rounded" />
          </div>
        ))}
      </div>
    </>
  )
}

function FriendsSkeleton() {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-24 bg-white/[0.1] rounded" />
          <div className="h-5 w-6 bg-white/[0.1] rounded-full" />
        </div>
        <div className="h-4 w-14 bg-white/[0.1] rounded" />
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <div className="w-8 h-8 bg-white/[0.1] rounded-full" />
            <div className="flex-1">
              <div className="h-4 w-20 bg-white/[0.1] rounded" />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function DefaultSkeleton() {
  return (
    <>
      <div className="h-4 w-24 bg-white/[0.1] rounded mb-4" />
      <div className="space-y-3">
        <div className="h-4 w-full bg-white/[0.1] rounded" />
        <div className="h-4 w-3/4 bg-white/[0.1] rounded" />
        <div className="h-4 w-1/2 bg-white/[0.1] rounded" />
      </div>
    </>
  )
}

// Icon component
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

export default WidgetSkeleton
