/**
 * BattlePassWidget - Enterprise Battle Pass Progress Widget
 * 
 * Compact Battle Pass progress display for the dashboard with enhanced styling.
 * 
 * Features:
 * - Widget header with "Battle Pass" title and season name
 * - Current tier number prominently (3xl font, bold)
 * - XP progress bar with gradient fill (indigo-500 to indigo-400)
 * - "X / Y XP" text below progress bar
 * - Days remaining until season end
 * - Claimable rewards badge with emerald color and pulse animation
 * - Premium badge with star icon and amber color
 * - Empty state when no active season
 * - Hover effect with lift and background highlight
 * 
 * Props:
 * @param className - Additional CSS classes
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBattlePass } from '@/hooks/useBattlePass'
import { getXPProgress, getClaimableCount, getDaysRemaining } from '@/types/battlepass'
import { DashboardSection } from './DashboardSection'

export interface BattlePassWidgetProps {
  className?: string
}

/**
 * Calculates XP progress percentage
 * @param currentXp - Current XP amount
 * @param xpToNextTier - XP remaining to reach next tier
 * @returns Progress percentage (0-100)
 * 
 * Formula: currentXp / (currentXp + xpToNextTier) * 100
 * Example: currentXp=360, xpToNextTier=40 → 360/400 = 90%
 */
export function calculateXpProgress(currentXp: number, xpToNextTier: number): number {
  const xpPerTier = currentXp + xpToNextTier
  if (xpPerTier <= 0) return 100
  return Math.min(100, Math.round((currentXp / xpPerTier) * 100))
}

export function BattlePassWidget({ className }: BattlePassWidgetProps) {
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
      <DashboardSection className={className}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 w-24 bg-white/[0.1] rounded" />
            <div className="h-5 w-16 bg-white/[0.1] rounded-full" />
          </div>
          <div className="h-10 w-20 bg-white/[0.1] rounded mb-3" />
          <div className="h-2 w-full bg-white/[0.1] rounded mb-2" />
          <div className="h-3 w-32 bg-white/[0.1] rounded" />
        </div>
      </DashboardSection>
    )
  }

  // No battle pass data - empty state - Requirements 3.4
  if (!progress) {
    return (
      <DashboardSection 
        title="Battle Pass"
        className={className}
        onClick={handleClick}
      >
        <div className="text-center py-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/[0.05] flex items-center justify-center">
            <SeasonIcon className="w-6 h-6 text-neutral-500" />
          </div>
          <p className="text-sm text-neutral-400 mb-1">No active season</p>
          <p className="text-xs text-neutral-500">Check back soon</p>
        </div>
      </DashboardSection>
    )
  }

  const xpProgress = getXPProgress(progress)
  const claimableCount = getClaimableCount(progress)
  const daysRemaining = season ? getDaysRemaining(season) : null
  const seasonName = progress.season?.name || season?.name || 'Season'
  // Treat tier 0 as tier 1 for display (legacy users before unified progression)
  const displayTier = progress.current_tier === 0 ? 1 : progress.current_tier

  return (
    <DashboardSection
      onClick={handleClick}
      className={className}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-indigo-400/5 pointer-events-none rounded-xl" />

      <div className="relative">
        {/* Header with title and claimable badge - Requirements 3.1, 3.2 */}
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-medium text-neutral-400">Battle Pass</h3>
          {claimableCount > 0 && (
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full animate-pulse">
              {claimableCount} to claim
            </span>
          )}
        </div>

        {/* Season name */}
        <p className="text-xs text-neutral-500 mb-3">{seasonName}</p>

        {/* Current tier - 3xl bold - Requirements 3.1 */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-3xl font-bold text-white tabular-nums">
            {displayTier}
          </span>
          <span className="text-sm text-neutral-500">
            / {progress.season?.max_tier ?? 35}
          </span>
          {/* Premium badge - Requirements 3.5 */}
          {progress.is_premium && (
            <span className="ml-auto flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full">
              <StarIcon className="w-3 h-3" />
              Premium
            </span>
          )}
        </div>

        {/* XP Progress bar with indigo gradient - Requirements 3.1 */}
        <div className="mb-2">
          <div className="h-2 bg-white/[0.1] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-300"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>

        {/* XP text and days remaining - Requirements 3.1 */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-400 tabular-nums">
            {progress.current_xp.toLocaleString()} / {(progress.current_xp + progress.xp_to_next_tier).toLocaleString()} XP
          </span>
          {daysRemaining !== null && (
            <span className="text-neutral-500">
              {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left
            </span>
          )}
        </div>
      </div>
    </DashboardSection>
  )
}

// Icon Components
function SeasonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}
