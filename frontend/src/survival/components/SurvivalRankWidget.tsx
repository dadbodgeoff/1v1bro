/**
 * SurvivalRankWidget - Dashboard widget showing player's survival rank
 * 
 * Enterprise-grade widget for the /dashboard page showing:
 * - Current rank with live updates
 * - Personal best stats (distance, score, combo)
 * - Top 3 players preview
 * - Link to full leaderboard
 * 
 * Uses DashboardSection for consistent enterprise styling.
 */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardSection } from '@/components/dashboard/enterprise/DashboardSection'
import { useLeaderboard, usePlayerRank, useTopPlayers } from '../hooks/useLeaderboard'
import type { LeaderboardEntry } from '../services/LeaderboardService'

// ============================================
// Sub-components
// ============================================

function MiniRankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-yellow-400 text-sm">🥇</span>
  if (rank === 2) return <span className="text-neutral-300 text-sm">🥈</span>
  if (rank === 3) return <span className="text-amber-600 text-sm">🥉</span>
  return <span className="text-neutral-500 text-xs font-medium tabular-nums">#{rank}</span>
}

function TopPlayerRow({ entry, isYou }: { entry: LeaderboardEntry; isYou: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 py-1.5 ${isYou ? 'text-orange-400' : ''}`}>
      <MiniRankBadge rank={entry.rank} />
      <span className={`flex-1 text-sm truncate ${isYou ? 'font-medium' : 'text-neutral-300'}`}>
        {entry.displayName}
        {isYou && <span className="text-orange-400/60 ml-1 text-xs">(You)</span>}
      </span>
      <span className="text-sm font-medium text-neutral-400 tabular-nums">
        {Math.floor(entry.bestDistance).toLocaleString()}m
      </span>
    </div>
  )
}

function StatPill({ label, value, color = 'text-white' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="text-center">
      <div className={`text-lg font-bold tabular-nums ${color}`}>{value}</div>
      <div className="text-[10px] text-neutral-500 uppercase tracking-wider">{label}</div>
    </div>
  )
}


// ============================================
// Main Widget
// ============================================

export interface SurvivalRankWidgetProps {
  className?: string
  maxTopPlayers?: number
}

export function SurvivalRankWidget({ className = '', maxTopPlayers = 3 }: SurvivalRankWidgetProps) {
  const navigate = useNavigate()
  const { connectionState, isLoading } = useLeaderboard({ autoStart: true, pollInterval: 15000 })
  const { entry: playerEntry } = usePlayerRank()
  const { players: topPlayers } = useTopPlayers(maxTopPlayers)

  // Check if player is in top list
  const playerInTop = useMemo(() => {
    if (!playerEntry) return false
    return topPlayers.some(p => p.userId === playerEntry.userId)
  }, [topPlayers, playerEntry])

  const handleClick = () => navigate('/survival/leaderboard')
  const handleViewLeaderboard = () => navigate('/survival/leaderboard')
  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate('/survival')  // Navigate to authenticated survival game
  }

  // Loading state
  if (isLoading && !playerEntry && topPlayers.length === 0) {
    return (
      <DashboardSection 
        title="Survival Runner"
        actionLabel="View Leaderboard"
        onAction={handleViewLeaderboard}
        className={className}
      >
        <div className="animate-pulse space-y-3">
          <div className="h-16 bg-white/[0.06] rounded-lg" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-5 h-5 bg-white/[0.06] rounded-full" />
                <div className="flex-1 h-4 bg-white/[0.06] rounded" />
                <div className="w-12 h-4 bg-white/[0.06] rounded" />
              </div>
            ))}
          </div>
        </div>
      </DashboardSection>
    )
  }

  // Build badge for live indicator
  const liveBadge = connectionState === 'connected' ? (
    <span className="flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      <span className="text-[10px] text-neutral-500">Live</span>
    </span>
  ) : undefined

  return (
    <DashboardSection
      title="Survival Runner"
      badge={liveBadge as unknown as string}
      actionLabel="View Leaderboard"
      onAction={handleViewLeaderboard}
      onClick={handleClick}
      className={className}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 pointer-events-none rounded-xl" />

      <div className="relative">
        {/* Player rank card (if has rank) */}
        {playerEntry ? (
          <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-lg p-3 mb-3 border border-orange-500/20">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-black text-orange-400 tabular-nums">#{playerEntry.rank}</div>
                <div className="text-[9px] text-orange-400/60 uppercase tracking-wider">Your Rank</div>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-2">
                <StatPill label="Distance" value={`${Math.floor(playerEntry.bestDistance)}m`} />
                <StatPill label="Score" value={playerEntry.bestScore.toLocaleString()} color="text-amber-400" />
                <StatPill label="Combo" value={`${playerEntry.bestCombo}x`} color="text-purple-400" />
              </div>
            </div>
            {/* Play button for users with existing rank */}
            <button
              onClick={handlePlayClick}
              className="w-full mt-3 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30"
            >
              🎮 Play Survival
            </button>
          </div>
        ) : (
          <div className="bg-white/[0.04] rounded-lg p-4 mb-3 text-center">
            <p className="text-sm text-neutral-400 mb-2">No runs yet</p>
            <button
              onClick={handlePlayClick}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-orange-500/20"
            >
              🎮 Start Playing
            </button>
          </div>
        )}

        {/* Top players */}
        {topPlayers.length > 0 && (
          <div className="space-y-0.5">
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">Top Runners</div>
            {topPlayers.map(player => (
              <TopPlayerRow 
                key={player.userId} 
                entry={player} 
                isYou={playerEntry?.userId === player.userId}
              />
            ))}
            
            {/* Show player if not in top */}
            {playerEntry && !playerInTop && (
              <>
                <div className="border-t border-dashed border-white/[0.08] my-2" />
                <TopPlayerRow entry={playerEntry} isYou />
              </>
            )}
          </div>
        )}

        {/* Empty state when no data */}
        {topPlayers.length === 0 && !playerEntry && (
          <div className="text-center py-4">
            <p className="text-sm text-neutral-400 mb-1">No leaderboard data yet</p>
            <p className="text-xs text-neutral-500">Be the first to set a record!</p>
          </div>
        )}
      </div>
    </DashboardSection>
  )
}

/**
 * Compact version for smaller spaces
 */
export function SurvivalRankWidgetCompact({ className = '' }: { className?: string }) {
  const navigate = useNavigate()
  const { entry: playerEntry } = usePlayerRank()
  const { players: topPlayers } = useTopPlayers(1)

  const handleClick = () => navigate('/survival/leaderboard')
  const leader = topPlayers[0]

  return (
    <DashboardSection onClick={handleClick} className={className}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>🏃</span>
          <span className="text-sm font-medium text-white">Survival</span>
        </div>
        {playerEntry ? (
          <div className="text-right">
            <div className="text-sm font-bold text-orange-400 tabular-nums">#{playerEntry.rank}</div>
            <div className="text-[10px] text-neutral-500">{Math.floor(playerEntry.bestDistance)}m</div>
          </div>
        ) : leader ? (
          <div className="text-right">
            <div className="text-xs text-neutral-400">Leader: {Math.floor(leader.bestDistance)}m</div>
          </div>
        ) : null}
      </div>
    </DashboardSection>
  )
}

export default SurvivalRankWidget
