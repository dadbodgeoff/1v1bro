/**
 * Badge Component - 2025 Design System
 * Requirements: 2.5
 */

import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/helpers'

type RarityVariant = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
type StatusVariant = 'default' | 'success' | 'warning' | 'error' | 'info'
type RankVariant = 'gold' | 'silver' | 'bronze'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: StatusVariant | RarityVariant | RankVariant
  size?: 'sm' | 'md' | 'lg'
  shimmer?: boolean // For legendary items
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', shimmer = false, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full'

    // Status variants
    const statusVariants: Record<StatusVariant, string> = {
      default: 'bg-[#1a1a1a] text-[#a3a3a3] border border-[rgba(255,255,255,0.06)]',
      success: 'bg-[#10b981]/20 text-[#10b981]',
      warning: 'bg-[#f59e0b]/20 text-[#f59e0b]',
      error: 'bg-[#f43f5e]/20 text-[#f43f5e]',
      info: 'bg-[#3b82f6]/20 text-[#3b82f6]',
    }

    // Rarity variants (Req 2.5)
    const rarityVariants: Record<RarityVariant, string> = {
      common: 'bg-[#525252]/50 text-[#a3a3a3]',
      uncommon: 'bg-[#10b981]/20 text-[#10b981]',
      rare: 'bg-[#3b82f6]/20 text-[#3b82f6]',
      epic: 'bg-[#a855f7]/20 text-[#a855f7]',
      legendary: 'bg-[#f59e0b]/20 text-[#f59e0b]',
    }

    // Rank variants (for leaderboards)
    const rankVariants: Record<RankVariant, string> = {
      gold: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-semibold',
      silver: 'bg-gradient-to-r from-slate-300 to-slate-400 text-black font-semibold',
      bronze: 'bg-gradient-to-r from-orange-400 to-amber-600 text-black font-semibold',
    }

    const sizes = {
      sm: 'px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
      md: 'px-2.5 py-1 text-xs font-bold uppercase tracking-wide',
      lg: 'px-3 py-1.5 text-sm font-bold uppercase tracking-wide',
    }

    // Determine which variant set to use
    const getVariantClass = () => {
      if (variant in statusVariants) return statusVariants[variant as StatusVariant]
      if (variant in rarityVariants) return rarityVariants[variant as RarityVariant]
      if (variant in rankVariants) return rankVariants[variant as RankVariant]
      return statusVariants.default
    }

    return (
      <span
        ref={ref}
        className={cn(
          baseStyles,
          getVariantClass(),
          sizes[size],
          shimmer && variant === 'legendary' && 'relative overflow-hidden',
          className
        )}
        {...props}
      >
        {children}
        {shimmer && variant === 'legendary' && (
          <span className="absolute inset-0 legendary-shimmer pointer-events-none" />
        )}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

// Rank badge with special styling for top 3
export function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <Badge variant="gold" size="lg">
        🥇 1st
      </Badge>
    )
  }
  if (rank === 2) {
    return (
      <Badge variant="silver" size="lg">
        🥈 2nd
      </Badge>
    )
  }
  if (rank === 3) {
    return (
      <Badge variant="bronze" size="lg">
        🥉 3rd
      </Badge>
    )
  }
  return (
    <Badge variant="default" size="lg">
      #{rank}
    </Badge>
  )
}

// Rarity badge helper
export function RarityBadge({
  rarity,
  shimmer = false,
}: {
  rarity: RarityVariant
  shimmer?: boolean
}) {
  const labels: Record<RarityVariant, string> = {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary',
  }

  return (
    <Badge variant={rarity} shimmer={shimmer && rarity === 'legendary'}>
      {labels[rarity]}
    </Badge>
  )
}

// Export rarity type for use in other components
export type { RarityVariant }
