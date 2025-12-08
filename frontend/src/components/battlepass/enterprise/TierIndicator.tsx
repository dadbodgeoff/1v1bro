/**
 * TierIndicator - Tier Number Display
 * 
 * States:
 * - Current: Accent bg, white text, scale(1.1), glow effect
 * - Unlocked: Elevated bg, white text
 * - Locked: Subtle bg, muted text, reduced opacity (50%)
 * 
 * Size variants: sm, md, lg
 * 
 * Requirements: 2.4
 */

import { cn } from '@/utils/helpers'

export type TierIndicatorSize = 'sm' | 'md' | 'lg'
export type TierState = 'current' | 'unlocked' | 'locked'

interface TierIndicatorProps {
  tier: number
  currentTier: number
  size?: TierIndicatorSize
  className?: string
}

const sizeStyles: Record<TierIndicatorSize, { container: string; text: string }> = {
  sm: {
    container: 'w-6 h-6',
    text: 'text-xs',
  },
  md: {
    container: 'w-8 h-8',
    text: 'text-sm',
  },
  lg: {
    container: 'w-10 h-10',
    text: 'text-lg',
  },
}

export function TierIndicator({
  tier,
  currentTier,
  size = 'md',
  className,
}: TierIndicatorProps) {
  const state = getTierState(tier, currentTier)
  const sizeConfig = sizeStyles[size]

  return (
    <div
      className={cn(
        'relative rounded-full flex items-center justify-center border-2 transition-all duration-200',
        sizeConfig.container,
        // Current tier: accent bg, scale 1.1, glow
        state === 'current' && [
          'bg-[var(--color-accent-primary)] border-[var(--color-accent-primary)]',
          'text-white scale-110',
          'shadow-[0_0_20px_rgba(99,102,241,0.5)]',
        ],
        // Unlocked: elevated bg, white text
        state === 'unlocked' && [
          'bg-[var(--color-bg-elevated)] border-[var(--color-border-visible)]',
          'text-white',
        ],
        // Locked: subtle bg, muted text, opacity 50%
        state === 'locked' && [
          'bg-[var(--color-bg-card)] border-[var(--color-border-subtle)]',
          'text-[var(--color-text-muted)] opacity-50',
        ],
        className
      )}
    >
      <span
        className={cn(
          'tabular-nums',
          sizeConfig.text,
          state === 'current' ? 'font-extrabold' : state === 'unlocked' ? 'font-bold' : 'font-semibold'
        )}
      >
        {tier}
      </span>
    </div>
  )
}

/**
 * Determine the state of a tier based on current progress.
 * Exported for property testing.
 */
export function getTierState(tier: number, currentTier: number): TierState {
  if (tier === currentTier) return 'current'
  if (tier < currentTier) return 'unlocked'
  return 'locked'
}

export default TierIndicator
