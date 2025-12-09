/**
 * StatsSummaryWidget - Enterprise Stats Summary Widget
 * 
 * Key performance metrics display for the dashboard.
 * 
 * Features:
 * - Widget header with "Your Stats" title and "View Profile" link
 * - 4 stat cards in 2x2 grid: Total Wins, Win Rate, Rank Tier, ELO Rating
 * - Stat values in xl font, bold, tabular-nums
 * - Stat labels in xs font, muted, uppercase
 * - Rank tier with icon and tier-appropriate color
 * - ELO rating with numeric value
 * - Empty state with "0" and "Unranked" defaults
 * - Navigate to /profile on click
 * 
 * Props:
 * @param className - Additional CSS classes
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '@/hooks/useProfile'
import { getRankTier, RANK_TIERS, type RankTier } from '@/types/leaderboard'
import { DashboardSection } from './DashboardSection'

export interface StatsSummaryWidgetProps {
  className?: string
}

/**
 * Calculates win rate percentage
 * @param wins - Number of wins
 * @param gamesPlayed - Total games played
 * @returns Win rate as percentage (0-100)
 */
export function calculateWinRate(wins: number, gamesPlayed: number): number {
  if (gamesPlayed <= 0) return 0
  return Math.round((wins / gamesPlayed) * 100)
}

/**
 * Gets rank tier from ELO rating
 * @param elo - ELO rating (or null)
 * @returns Rank tier string
 */
export function getRankFromElo(elo: number | null): RankTier {
  if (elo === null || elo === undefined) return 'bronze'
  return getRankTier(elo)
}

/**
 * Formats rank tier name for display
 * @param tier - Rank tier
 * @returns Capitalized tier name
 */
export function formatTierName(tier: RankTier): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1)
}

export function StatsSummaryWidget({ className }: StatsSummaryWidgetProps) {
  const navigate = useNavigate()
  const { profile, loading, fetchProfile } = useProfile()

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleClick = () => {
    navigate('/profile')
  }

  const handleViewProfile = () => {
    navigate('/profile')
  }

  // Loading state
  if (loading && !profile) {
    return (
      <DashboardSection 
        title="Your Stats"
        actionLabel="View Profile"
        onAction={handleViewProfile}
        className={className}
      >
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse p-3 bg-white/[0.03] rounded-lg">
              <div className="h-6 w-12 bg-white/[0.1] rounded mb-1" />
              <div className="h-3 w-16 bg-white/[0.1] rounded" />
            </div>
          ))}
        </div>
      </DashboardSection>
    )
  }

  // Extract stats from profile
  const wins = profile?.games_won ?? 0
  const gamesPlayed = profile?.games_played ?? 0
  const winRate = calculateWinRate(wins, gamesPlayed)
  const elo = profile?.current_elo ?? null
  const tier = getRankFromElo(elo)
  const tierInfo = RANK_TIERS[tier]

  // Empty state check - Requirements 6.6
  const hasNoStats = gamesPlayed === 0

  return (
    <DashboardSection
      title="Your Stats"
      actionLabel="View Profile"
      onAction={handleViewProfile}
      onClick={handleClick}
      className={className}
    >
      {hasNoStats ? (
        // Empty state - Requirements 6.6
        <div className="text-center py-4">
          <p className="text-sm text-neutral-400 mb-1">No stats yet</p>
          <p className="text-xs text-neutral-500">Play a match to see your stats</p>
        </div>
      ) : (
        // Stats grid - Requirements 6.1, 6.2
        <div className="grid grid-cols-2 gap-3">
          {/* Total Wins */}
          <StatCard
            value={wins.toLocaleString()}
            label="WINS"
            icon={<TrophyIcon className="w-4 h-4 text-amber-400" />}
          />

          {/* Win Rate */}
          <StatCard
            value={`${winRate}%`}
            label="WIN RATE"
            valueColor={winRate >= 50 ? 'text-emerald-400' : 'text-neutral-300'}
          />

          {/* Rank Tier - Requirements 6.3 */}
          <StatCard
            value={formatTierName(tier)}
            label="RANK"
            icon={<span className="text-base">{tierInfo.icon}</span>}
            valueColor={`text-[${tierInfo.color}]`}
            style={{ color: tierInfo.color }}
          />

          {/* ELO Rating - Requirements 6.4 */}
          <StatCard
            value={elo !== null ? elo.toLocaleString() : '—'}
            label="ELO"
            icon={<EloIcon className="w-4 h-4 text-indigo-400" />}
          />
        </div>
      )}
    </DashboardSection>
  )
}

// Stat Card Component
interface StatCardProps {
  value: string
  label: string
  icon?: React.ReactNode
  valueColor?: string
  style?: React.CSSProperties
}

function StatCard({ value, label, icon, valueColor = 'text-white', style }: StatCardProps) {
  return (
    <div className="p-3 bg-white/[0.03] rounded-lg">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span 
          className={`text-xl font-bold tabular-nums ${valueColor}`}
          style={style}
        >
          {value}
        </span>
      </div>
      <span className="text-xs text-neutral-500 uppercase tracking-wide">
        {label}
      </span>
    </div>
  )
}

// Icon Components
function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-1.17a3 3 0 01-5.66 0H7.17A3 3 0 015 5zm4 1v2h2V6H9zM5 9a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2zM8 15v-1a2 2 0 114 0v1h3a1 1 0 110 2H5a1 1 0 110-2h3z" clipRule="evenodd" />
    </svg>
  )
}

function EloIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  )
}
