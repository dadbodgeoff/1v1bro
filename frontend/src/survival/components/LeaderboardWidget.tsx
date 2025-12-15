/**
 * LeaderboardWidget - Enterprise-styled compact embeddable leaderboard component
 * 
 * Use cases:
 * - Game over screen
 * - Sidebar widget
 * - Landing page preview
 */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTopPlayers, usePlayerRank } from '../hooks/useLeaderboard'
import type { LeaderboardEntry } from '../services/LeaderboardService'

interface LeaderboardWidgetProps {
  count?: number
  showPlayerRank?: boolean
  compact?: boolean
  onViewFull?: () => void
}

function MiniRankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.5)]">🥇</span>
  if (rank === 2) return <span className="text-neutral-300 drop-shadow-[0_0_4px_rgba(212,212,212,0.3)]">🥈</span>
  if (rank === 3) return <span className="text-amber-600 drop-shadow-[0_0_4px_rgba(217,119,6,0.4)]">🥉</span>
  return <span className="text-neutral-500 text-sm font-bold tabular-nums">#{rank}</span>
}

function CompactRow({ entry, isYou }: { entry: LeaderboardEntry; isYou?: boolean }) {
  return (
    <div className={`
      flex items-center gap-3 py-2 px-3 rounded-xl transition-all duration-200
      ${isYou 
        ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/10 border border-orange-500/20' 
        : 'hover:bg-white/5 border border-transparent'}
    `}>
      <MiniRankBadge rank={entry.rank} />
      
      <div className="flex-1 min-w-0">
        <span className={`text-sm truncate ${isYou ? 'text-orange-400 font-semibold' : 'text-white'}`}>
          {entry.displayName}
          {isYou && <span className="text-orange-400/60 ml-1 text-xs">(You)</span>}
        </span>
      </div>
      
      <div className={`text-sm font-bold tabular-nums ${isYou ? 'text-orange-400' : 'text-neutral-300'}`}>
        {Math.floor(entry.bestDistance).toLocaleString()}m
      </div>
    </div>
  )
}

export function LeaderboardWidget({
  count = 5,
  showPlayerRank = true,
  compact = false,
  onViewFull,
}: LeaderboardWidgetProps) {
  const navigate = useNavigate()
  const { players, isLoading } = useTopPlayers(count)
  const { entry: playerEntry } = usePlayerRank()
  
  // Check if player is in top list
  const playerInTop = useMemo(() => {
    if (!playerEntry) return false
    return players.some(p => p.userId === playerEntry.userId)
  }, [players, playerEntry])
  
  const handleViewFull = () => {
    if (onViewFull) {
      onViewFull()
    } else {
      navigate('/survival/leaderboard')
    }
  }
  
  if (isLoading) {
    return (
      <div className={`bg-black/60 backdrop-blur-sm rounded-2xl border border-white/10 ${compact ? 'p-3' : 'p-4'}`}>
        <div className="animate-pulse space-y-3">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-white/10" />
              <div className="flex-1 h-4 bg-white/10 rounded" />
              <div className="w-12 h-4 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  if (players.length === 0) {
    return (
      <div className={`bg-black/60 backdrop-blur-sm rounded-2xl border border-white/10 ${compact ? 'p-3' : 'p-4'} text-center`}>
        <p className="text-neutral-400 text-sm">No leaderboard data yet</p>
        <p className="text-neutral-500 text-xs mt-1">Be the first to set a record!</p>
      </div>
    )
  }
  
  return (
    <div className={`bg-black/60 backdrop-blur-sm rounded-2xl border border-white/10 ${compact ? 'p-3' : 'p-4'} relative overflow-hidden`}>
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className={`font-bold text-white ${compact ? 'text-sm' : 'text-base'}`}>
            🏆 Top Runners
          </h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" style={{ boxShadow: '0 0 6px #22c55e' }} />
            <span className="text-xs text-neutral-500">Live</span>
          </div>
        </div>
        
        {/* Entries */}
        <div className="space-y-1">
          {players.map((entry) => (
            <CompactRow 
              key={entry.userId} 
              entry={entry}
              isYou={playerEntry?.userId === entry.userId}
            />
          ))}
        </div>
        
        {/* Player rank (if not in top) */}
        {showPlayerRank && playerEntry && !playerInTop && (
          <>
            <div className="my-3 border-t border-dashed border-white/10" />
            <CompactRow entry={playerEntry} isYou />
          </>
        )}
        
        {/* View full button */}
        <button
          onClick={handleViewFull}
          className={`
            w-full mt-3 py-2.5 text-center text-sm font-semibold text-orange-400 
            hover:text-orange-300 bg-white/5 hover:bg-orange-500/10 
            rounded-xl transition-all duration-200 border border-white/5 hover:border-orange-500/20
          `}
        >
          View Full Leaderboard →
        </button>
      </div>
    </div>
  )
}

/**
 * Mini leaderboard for game over screen - Enterprise styled
 */
export function GameOverLeaderboard({ 
  playerDistance,
}: { 
  playerDistance: number
}) {
  const { players } = useTopPlayers(3)
  const { entry: playerEntry } = usePlayerRank()
  
  // Find where player would rank
  const wouldRank = useMemo(() => {
    if (!players.length) return null
    const position = players.findIndex(p => playerDistance > p.bestDistance)
    if (position === -1) return players.length + 1
    return position + 1
  }, [players, playerDistance])
  
  return (
    <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-4 border border-white/10 relative overflow-hidden">
      {/* Subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
      
      <div className="relative">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <span>🏆</span> Leaderboard
        </h3>
        
        <div className="space-y-2">
          {players.slice(0, 3).map((entry) => (
            <div key={entry.userId} className="flex items-center gap-2 text-sm py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors">
              <MiniRankBadge rank={entry.rank} />
              <span className="flex-1 truncate text-neutral-300">{entry.displayName}</span>
              <span className="text-white font-bold tabular-nums">{Math.floor(entry.bestDistance).toLocaleString()}m</span>
            </div>
          ))}
        </div>
        
        {/* Player's position */}
        {playerEntry ? (
          <div className="mt-3 pt-3 border-t border-dashed border-white/10">
            <div className="flex items-center gap-2 text-sm bg-gradient-to-r from-orange-500/20 to-amber-500/10 rounded-xl px-3 py-2 border border-orange-500/20">
              <span className="text-orange-400 font-bold">#{playerEntry.rank}</span>
              <span className="flex-1 text-orange-400 font-medium">Your Best</span>
              <span className="text-orange-400 font-bold tabular-nums">{Math.floor(playerEntry.bestDistance).toLocaleString()}m</span>
            </div>
          </div>
        ) : wouldRank && (
          <div className="mt-3 pt-3 border-t border-dashed border-white/10">
            <div className="text-xs text-center bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-xl px-3 py-2 border border-orange-500/20">
              <span className="text-orange-400">Sign in to save your score and rank </span>
              <span className="text-orange-300 font-bold">#{wouldRank}</span>
              <span className="text-orange-400">!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LeaderboardWidget
