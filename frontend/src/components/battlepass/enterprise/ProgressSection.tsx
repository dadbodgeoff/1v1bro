/**
 * ProgressSection - Combined Progress Display
 * 
 * Features:
 * - Prominent tier badge with accent styling
 * - Gradient XP progress bar (indigo→purple)
 * - Statistics with tabular-nums
 * - Animated fill transitions (500ms ease-out)
 * - 12px height track with elevated background
 * 
 * Requirements: 4.1, 4.2
 */

import { cn } from '@/utils/helpers'

interface ProgressSectionProps {
  currentTier: number
  currentXP: number
  xpToNextTier: number
  totalTiers?: number
  className?: string
}

export function ProgressSection({
  currentTier,
  currentXP,
  xpToNextTier,
  totalTiers = 100,
  className,
}: ProgressSectionProps) {
  // Calculate percentage, clamped to 0-100
  const percentage = calculateXPPercentage(currentXP, xpToNextTier)
  const xpRemaining = Math.max(0, xpToNextTier - currentXP)

  return (
    <div
      className={cn(
        'bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl p-5',
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Tier Badge */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={cn(
                'w-16 h-16 rounded-xl flex flex-col items-center justify-center',
                'bg-gradient-to-br from-[#6366f1] to-[#8b5cf6]',
                'shadow-lg shadow-[#6366f1]/30'
              )}
            >
              <span className="text-xs font-medium text-white/80 uppercase tracking-wider">
                Tier
              </span>
              <span className="text-2xl font-extrabold text-white tabular-nums">
                {currentTier}
              </span>
            </div>
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-xl bg-[#6366f1]/20 blur-xl -z-10" />
          </div>

          {/* Tier Progress Text */}
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-[var(--color-text-muted)]">
              Progress to Tier {Math.min(currentTier + 1, totalTiers)}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {currentTier >= totalTiers ? 'Max tier reached!' : `${totalTiers - currentTier} tiers remaining`}
            </p>
          </div>
        </div>

        {/* XP Progress Bar Section */}
        <div className="flex-1 space-y-2">
          {/* XP Stats Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XPIcon className="w-4 h-4 text-[#a855f7]" />
              <span className="text-sm text-[var(--color-text-secondary)]">
                <span className="font-bold text-white tabular-nums">
                  {currentXP.toLocaleString()}
                </span>
                {' / '}
                <span className="tabular-nums">{xpToNextTier.toLocaleString()} XP</span>
              </span>
            </div>

            {/* XP to next tier hint */}
            <span className="text-xs text-[var(--color-text-muted)] tabular-nums">
              {xpRemaining.toLocaleString()} XP to Tier {Math.min(currentTier + 1, totalTiers)}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            {/* Track - 12px height with elevated background */}
            <div
              className={cn(
                'h-3 bg-[var(--color-bg-elevated)] rounded-full overflow-hidden',
                'border border-[var(--color-border-subtle)]'
              )}
            >
              {/* Fill with gradient - 500ms ease-out transition */}
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${percentage}%`,
                  background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                }}
              />
            </div>

            {/* Percentage Label - positioned at fill edge */}
            {percentage > 10 && (
              <div
                className="absolute top-1/2 -translate-y-1/2 text-xs font-semibold text-white drop-shadow-md"
                style={{
                  left: `${Math.max(percentage - 2, 5)}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {Math.round(percentage)}%
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Icons
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
 * 
 * Property 1: XP Progress Percentage Calculation
 * For any XP progress state with currentXP and xpToNextTier values,
 * the progress bar fill percentage SHALL equal (currentXP / xpToNextTier) * 100,
 * clamped to the range [0, 100].
 * 
 * Validates: Requirements 4.1, 4.2
 */
export function calculateXPPercentage(currentXP: number, xpToNextTier: number): number {
  if (xpToNextTier <= 0) return 0
  const raw = (currentXP / xpToNextTier) * 100
  return Math.min(Math.max(raw, 0), 100)
}

export default ProgressSection
