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
 * - Expandable recap summary (Requirements: 7.5)
 * 
 * Props:
 * - match: MatchResult data
 * - className: Additional CSS classes
 */

import { useState } from 'react'
import { cn } from '@/utils/helpers'
import { getAvatarUrl } from '@/types/profile'
import type { RecapPayload } from '@/types/recap'

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
  recap_data?: RecapPayload | null
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
  const [expanded, setExpanded] = useState(false)
  const hasRecap = !!match.recap_data

  return (
    <div className={cn('rounded-lg overflow-hidden', className)}>
      {/* Main Row */}
      <div
        onClick={() => hasRecap && setExpanded(!expanded)}
        className={cn(
          'flex items-center gap-4 p-4',
          'bg-[var(--color-bg-card)] border-l-4',
          outcome.border,
          'hover:bg-[var(--color-bg-elevated)] transition-colors duration-150',
          hasRecap && 'cursor-pointer'
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

        {/* Expand indicator */}
        {hasRecap && (
          <span className={cn(
            'text-[var(--color-text-muted)] transition-transform',
            expanded && 'rotate-180'
          )}>
            ▼
          </span>
        )}
      </div>

      {/* Recap Summary (Requirements: 7.5) */}
      {expanded && match.recap_data && (
        <div className="bg-[var(--color-bg-elevated)] px-4 py-3 border-t border-white/5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {/* Question Stats */}
            <div>
              <div className="text-[var(--color-text-muted)] text-xs mb-1">Accuracy</div>
              <div className="text-white font-medium">
                {match.recap_data.question_stats.correct_count}/{match.recap_data.question_stats.total_questions}
                <span className="text-[var(--color-text-muted)] ml-1">
                  ({match.recap_data.question_stats.accuracy_percent.toFixed(0)}%)
                </span>
              </div>
            </div>

            {/* Combat Stats */}
            <div>
              <div className="text-[var(--color-text-muted)] text-xs mb-1">K/D</div>
              <div className="text-white font-medium">
                {match.recap_data.combat_stats.kills}/{match.recap_data.combat_stats.deaths}
                <span className="text-[var(--color-text-muted)] ml-1">
                  ({match.recap_data.combat_stats.deaths === 0 
                    ? (match.recap_data.combat_stats.kills > 0 ? '∞' : '0.00')
                    : match.recap_data.combat_stats.kd_ratio.toFixed(2)})
                </span>
              </div>
            </div>

            {/* XP Breakdown */}
            <div>
              <div className="text-[var(--color-text-muted)] text-xs mb-1">XP Breakdown</div>
              <div className="text-white font-medium">
                +{match.recap_data.xp_breakdown.total} XP
              </div>
            </div>

            {/* Shot Accuracy */}
            <div>
              <div className="text-[var(--color-text-muted)] text-xs mb-1">Shot Accuracy</div>
              <div className="text-white font-medium">
                {match.recap_data.combat_stats.shot_accuracy.toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      )}
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
