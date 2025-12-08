/**
 * MatchHistorySection - Section Container for Match History
 * 
 * Features:
 * - Section header with "Recent Matches" title and count badge
 * - List of MatchHistoryItems (5-10 matches)
 * - "View All" link if more matches exist
 * - Empty state with message
 * - Skeleton loading state (5 rows)
 * 
 * Props:
 * - matches: Array of MatchResult
 * - total: Total number of matches
 * - loading: Loading state
 * - onViewAll: Callback when "View All" is clicked
 * - className: Additional CSS classes
 */

import { cn } from '@/utils/helpers'
import { MatchHistoryItem, MatchHistoryItemSkeleton, type MatchResult } from './MatchHistoryItem'

interface MatchHistorySectionProps {
  matches: MatchResult[]
  total?: number
  loading?: boolean
  onViewAll?: () => void
  className?: string
}

export function MatchHistorySection({
  matches,
  total = 0,
  loading = false,
  onViewAll,
  className,
}: MatchHistorySectionProps) {
  const hasMore = total > matches.length

  // Loading state
  if (loading) {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <MatchHistoryItemSkeleton key={i} />
        ))}
      </div>
    )
  }

  // Empty state
  if (matches.length === 0) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        'bg-[var(--color-bg-card)] rounded-xl border border-white/5',
        className
      )}>
        <div className="text-4xl mb-4">🎮</div>
        <div className="text-lg font-medium text-white mb-2">No matches yet</div>
        <div className="text-sm text-[var(--color-text-muted)]">
          Play some games to see your match history here
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Match List */}
      {matches.map((match) => (
        <MatchHistoryItem key={match.id} match={match} />
      ))}

      {/* View All Link */}
      {hasMore && onViewAll && (
        <button
          onClick={onViewAll}
          className="w-full py-3 text-sm font-semibold text-[#6366f1] hover:text-[#818cf8] transition-colors text-center rounded-lg hover:bg-white/5"
        >
          View All ({total} matches)
        </button>
      )}
    </div>
  )
}
