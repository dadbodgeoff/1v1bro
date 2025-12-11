/**
 * BattlePassWidget - Compact battle pass progress display for dashboard.
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.5
 * 
 * 2025 Redesign Updates:
 * - Uses design tokens for colors
 * - Improved empty state with EmptyState component
 * - Replaced purple/blue with indigo gradient
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBattlePass } from '@/hooks/useBattlePass'
import { getXPProgress, getClaimableCount, getDaysRemaining } from '@/types/battlepass'
import { EmptyState, EmptySeasonIcon } from '@/components/ui/EmptyState'

interface BattlePassWidgetProps {
  className?: string
}

export function BattlePassWidget({ className = '' }: BattlePassWidgetProps) {
  const navigate = useNavigate()
  const { season, progress, loading, fetchSeason, fetchProgress } = useBattlePass()

  useEffect(() => {
    fetchSeason()
    fetchProgress()
  }, [fetchSeason, fetchProgress])

  const handleClick = () => {
    navigate('/battlepass')
  }

  // Loading state
  if (loading && !progress) {
    return (
      <div className={`bg-[#111111] border border-white/[0.06] rounded-xl p-5 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 w-24 bg-white/[0.1] rounded mb-4" />
          <div className="h-8 w-16 bg-white/[0.1] rounded mb-3" />
          <div className="h-2 w-full bg-white/[0.1] rounded" />
        </div>
      </div>
    )
  }

  // No battle pass data - empty state
  if (!progress) {
    return (
      <div className={`bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl p-5 ${className}`}>
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">Battle Pass</h3>
        <EmptyState
          icon={<EmptySeasonIcon className="w-12 h-12" />}
          title="No active season"
          description="Check back soon for the next battle pass season"
          actionLabel="View Battle Pass"
          onAction={handleClick}
          className="py-4"
        />
      </div>
    )
  }

  const xpProgress = getXPProgress(progress)
  const claimableCount = getClaimableCount(progress)
  const daysRemaining = season ? getDaysRemaining(season) : null
  const seasonName = progress.season?.name || season?.name || 'Season'

  return (
    <button
      onClick={handleClick}
      className={`bg-[#111111] border border-white/[0.06] rounded-xl p-5 text-left hover:bg-white/[0.02] transition-colors relative overflow-hidden ${className}`}
    >
      {/* Background gradient - using indigo instead of purple/blue */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-indigo-400/5 pointer-events-none" />

      <div className="relative">
        {/* Header with season name and claimable badge */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-neutral-400">Battle Pass</h3>
          {claimableCount > 0 && (
            <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs font-medium rounded-full">
              {claimableCount} reward{claimableCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Season name */}
        <p className="text-xs text-neutral-500 mb-2">{seasonName}</p>

        {/* Current tier */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-3xl font-bold text-white">{progress.current_tier}</span>
          <span className="text-sm text-neutral-500">/ {progress.season?.max_tier ?? 35}</span>
        </div>

        {/* XP Progress bar - using indigo gradient */}
        <div className="mb-2">
          <div className="h-2 bg-white/[0.1] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-300"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>

        {/* XP text */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-500">
            {progress.current_xp} / {progress.xp_to_next_tier} XP
          </span>
          {daysRemaining !== null && (
            <span className="text-neutral-500">
              {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left
            </span>
          )}
        </div>

        {/* Premium badge */}
        {progress.is_premium && (
          <div className="mt-3 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs text-yellow-500 font-medium">Premium</span>
          </div>
        )}
      </div>
    </button>
  )
}
