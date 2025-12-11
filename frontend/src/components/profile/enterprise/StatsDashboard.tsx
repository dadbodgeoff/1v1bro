/**
 * StatsDashboard - Grid of Stats Cards Component
 * 
 * Features:
 * - Responsive grid (2 cols mobile, 3-4 cols desktop)
 * - Pre-configured stats from profile and Battle Pass data
 * - Win rate calculation with color coding
 * - Tier progress display (unified with Battle Pass)
 * - Format large numbers with compact notation
 * - Handle edge cases (0 games, no active season)
 * - Click handler on tier card to navigate to Battle Pass
 * 
 * UNIFIED PROGRESSION: Uses Battle Pass tier/XP as player level/XP
 * 
 * Props:
 * - profile: Profile data with games_played, games_won, etc.
 * - battlePassProgress: PlayerBattlePass for unified progression
 * - onTierClick: Optional callback when tier card is clicked
 * - className: Additional CSS classes
 */

import type { Profile } from '@/types/profile'
import type { PlayerBattlePass } from '@/types/battlepass'
import { cn } from '@/utils/helpers'
import { StatsCard, calculateWinRate } from './StatsCard'

interface StatsDashboardProps {
  profile: Profile
  battlePassProgress?: PlayerBattlePass | null
  onTierClick?: () => void
  className?: string
}

/**
 * Get ELO tier icon based on tier name
 */
function getEloTierIcon(tier: string): string {
  const tierIcons: Record<string, string> = {
    'Bronze': '🥉',
    'Silver': '🥈',
    'Gold': '🥇',
    'Platinum': '💎',
    'Diamond': '💠',
    'Master': '👑',
    'Grandmaster': '🏆',
  }
  return tierIcons[tier] || '🏅'
}

/**
 * Get the stats to display in the dashboard
 * Returns exactly 6 stats as per requirements
 * Handles missing Battle Pass data gracefully with fallbacks
 */
export function getStatsConfig(
  profile: Profile,
  battlePassProgress: PlayerBattlePass | null | undefined
): Array<{
  key: string
  value: string | number
  label: string
  icon: string
  colorCode?: 'default' | 'success' | 'warning' | 'danger'
  clickable?: boolean
  tooltip?: string
}> {
  const winRate = calculateWinRate(profile.games_played, profile.games_won)
  
  // Safely check for active season - handle undefined/null battlePassProgress
  const hasActiveSeason = Boolean(battlePassProgress?.season?.is_active)
  const currentTier = battlePassProgress?.current_tier ?? 0
  const seasonName = battlePassProgress?.season?.name

  // ELO stats from unified profile
  const currentElo = profile.current_elo ?? 1200
  const peakElo = profile.peak_elo ?? 1200
  const eloTier = profile.current_tier ?? 'Gold'

  return [
    {
      key: 'games_played',
      value: profile.games_played ?? 0,
      label: 'Games Played',
      icon: '🎮',
    },
    {
      key: 'games_won',
      value: profile.games_won ?? 0,
      label: 'Wins',
      icon: '🏆',
    },
    {
      key: 'win_rate',
      value: winRate.value,
      label: 'Win Rate',
      icon: '📊',
      colorCode: winRate.colorCode,
    },
    {
      key: 'elo_rating',
      value: currentElo,
      label: `${eloTier} Rank`,
      icon: getEloTierIcon(eloTier),
      tooltip: `Peak: ${peakElo}`,
    },
    {
      key: 'bp_tier',
      value: hasActiveSeason ? `Tier ${currentTier}` : '—',
      label: 'Battle Pass',
      icon: '⭐',
      clickable: hasActiveSeason,
      tooltip: hasActiveSeason && seasonName ? `${seasonName}` : undefined,
    },
    {
      key: 'best_streak',
      value: profile.best_win_streak ?? 0,
      label: 'Best Streak',
      icon: '🔥',
    },
  ]
}

export function StatsDashboard({
  profile,
  battlePassProgress,
  onTierClick,
  className,
}: StatsDashboardProps) {
  const stats = getStatsConfig(profile, battlePassProgress)
  const hasActiveSeason = battlePassProgress?.season?.is_active ?? false

  return (
    <div className={cn(
      // Responsive grid: 2 cols mobile, 3 tablet, 6 desktop
      'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
      // Responsive gap: smaller on mobile
      'gap-3 sm:gap-4',
      className
    )}>
      {stats.map((stat) => (
        <StatsCard
          key={stat.key}
          value={stat.value}
          label={stat.label}
          icon={<span>{stat.icon}</span>}
          colorCode={stat.colorCode}
          onClick={stat.key === 'current_tier' && stat.clickable ? onTierClick : undefined}
        />
      ))}

      {/* No Active Season Message */}
      {!hasActiveSeason && (
        <div className="col-span-full mt-2 text-center text-sm text-[var(--color-text-muted)]">
          No active Battle Pass season
        </div>
      )}
    </div>
  )
}
