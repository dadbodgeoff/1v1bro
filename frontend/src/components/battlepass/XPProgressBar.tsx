/**
 * XPProgressBar Component - 2025 Design System
 * Requirements: 4.5
 *
 * XP progress display with:
 * - Current tier number prominently displayed
 * - Gradient progress bar (indigo → purple)
 * - "currentXP / xpToNextTier XP" text format
 * - Percentage label on bar
 * - Animated fill on XP changes (600ms ease-out)
 * 
 * **Feature: ui-polish-8-of-10**
 * **Validates: Requirements 1.4**
 */

import { cn } from '@/utils/helpers'
import { useAnimatedValue } from '@/hooks/useAnimatedValue'

interface XPProgressBarProps {
  currentTier: number
  currentXP: number
  xpToNextTier: number
  className?: string
}

export function XPProgressBar({
  currentTier,
  currentXP,
  xpToNextTier,
  className,
}: XPProgressBarProps) {
  // Calculate percentage, clamped to 0-100
  const targetPercentage = Math.min(Math.max((currentXP / xpToNextTier) * 100, 0), 100)
  
  // Animate the percentage value for smooth transitions
  const { value: percentage } = useAnimatedValue({
    from: 0,
    to: targetPercentage,
    duration: 600,
    easing: 'ease-out',
  })

  return (
    <div className={cn('space-y-3', className)}>
      {/* Tier and XP Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Tier Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border-subtle)]">
            <TierIcon className="w-4 h-4 text-[var(--color-accent-primary)]" />
            <span className="text-lg font-bold text-white">Tier {currentTier}</span>
          </div>
        </div>

        {/* XP Text - with animated numbers */}
        <div className="flex items-center gap-2">
          <XPIcon className="w-4 h-4 text-[#6366f1]" />
          <span className="text-sm text-[var(--color-text-secondary)]">
            <span className="font-semibold text-white tabular-nums">
              {currentXP.toLocaleString()}
            </span>
            {' / '}
            <span className="tabular-nums">{xpToNextTier.toLocaleString()} XP</span>
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        {/* Track */}
        <div className="h-3 bg-[var(--color-bg-elevated)] rounded-full overflow-hidden border border-[var(--color-border-subtle)]">
          {/* Fill with gradient */}
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${percentage}%`,
              background: 'var(--gradient-xp)',
            }}
          />
        </div>

        {/* Percentage Label */}
        <div
          className="absolute top-1/2 -translate-y-1/2 text-xs font-semibold text-white drop-shadow-md"
          style={{
            left: `${Math.max(percentage, 5)}%`,
            transform: `translate(-50%, -50%)`,
          }}
        >
          {Math.round(percentage)}%
        </div>
      </div>

      {/* XP to next tier hint */}
      <p className="text-xs text-[var(--color-text-muted)] text-right">
        {(xpToNextTier - currentXP).toLocaleString()} XP to Tier {currentTier + 1}
      </p>
    </div>
  )
}

function TierIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

function XPIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

/**
 * Calculate XP progress percentage.
 * Exported for property testing.
 */
export function calculateXPPercentage(currentXP: number, xpToNextTier: number): number {
  if (xpToNextTier <= 0) return 0
  return Math.min(Math.max((currentXP / xpToNextTier) * 100, 0), 100)
}
