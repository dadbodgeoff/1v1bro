/**
 * MatchHistoryItem - Single Match Result Row Component
 * 
 * Features:
 * - Opponent avatar (40px) and display name
 * - WIN/LOSS badge with color coding (green/red)
 * - XP earned display with icon
 * - Relative timestamp ("2 hours ago", "Yesterday")
 * - Left border accent based on outcome
 * - Hover effect with background highlight
 * 
 * Props:
 * - match: MatchResult data
 * - className: Additional CSS classes
 */

import { cn } from '@/utils/helpers'
import { getAvatarUrl } from '@/types/profile'

export interface MatchResult {
  id: string
  opponent: {
    id: string
    display_name: string
    avatar_url?: string
  }
  won: boolean
  xp_earned: number
  played_at: string
}

interface MatchHistoryItemProps {
  match: MatchResult
  className?: string
}

/**
 * Outcome styling configuration
 */
export const outcomeStyles = {
  win: {
    badge: 'bg-[#10b981] text-white',
    border: 'border-l-[#10b981]',
    text: 'WIN',
    xpPrefix: '+',
  },
  loss: {
    badge: 'bg-[#ef4444] text-white',
    border: 'border-l-[#ef4444]',
    text: 'LOSS',
    xpPrefix: '',
  },
}

/**
 * Get outcome style based on match result
 */
export function getOutcomeStyle(won: boolean) {
  return won ? outcomeStyles.win : outcomeStyles.loss
}

/**
 * Format relative timestamp
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) {
    return 'Just now'
  }
  if (diffMins < 60) {
    return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  }
  if (diffDays === 1) {
    return 'Yesterday'
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`
  }
  
  return date.toLocaleDateString()
}

export function MatchHistoryItem({
  match,
  className,
}: MatchHistoryItemProps) {
  const outcome = getOutcomeStyle(match.won)

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-lg',
        'bg-[var(--color-bg-card)] border-l-4',
        outcome.border,
        'hover:bg-[var(--color-bg-elevated)] transition-colors duration-150',
        className
      )}
    >
      {/* Opponent Avatar */}
      <img
        src={getAvatarUrl(match.opponent.avatar_url, 'small')}
        alt={match.opponent.display_name}
        className="w-10 h-10 rounded-full bg-[var(--color-bg-elevated)]"
      />

      {/* Opponent Name */}
      <div className="flex-1 min-w-0">
        <div className="text-base font-medium text-white truncate">
          {match.opponent.display_name}
        </div>
        <div className="text-xs text-[var(--color-text-muted)]">
          {formatRelativeTime(match.played_at)}
        </div>
      </div>

      {/* XP Earned */}
      <div className="flex items-center gap-1 text-sm font-medium text-[#818cf8]">
        <span>✨</span>
        <span>{outcome.xpPrefix}{match.xp_earned} XP</span>
      </div>

      {/* Outcome Badge */}
      <span className={cn(
        'px-3 py-1 text-sm font-bold rounded-full',
        outcome.badge
      )}>
        {outcome.text}
      </span>
    </div>
  )
}

/**
 * Skeleton loading state for MatchHistoryItem
 */
export function MatchHistoryItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-[var(--color-bg-card)] border-l-4 border-l-gray-700 animate-pulse">
      {/* Avatar Skeleton */}
      <div className="w-10 h-10 rounded-full bg-[var(--color-bg-elevated)]" />
      
      {/* Name Skeleton */}
      <div className="flex-1">
        <div className="h-4 w-32 bg-[var(--color-bg-elevated)] rounded mb-2" />
        <div className="h-3 w-20 bg-[var(--color-bg-elevated)] rounded" />
      </div>
      
      {/* XP Skeleton */}
      <div className="h-4 w-16 bg-[var(--color-bg-elevated)] rounded" />
      
      {/* Badge Skeleton */}
      <div className="h-6 w-14 bg-[var(--color-bg-elevated)] rounded-full" />
    </div>
  )
}
