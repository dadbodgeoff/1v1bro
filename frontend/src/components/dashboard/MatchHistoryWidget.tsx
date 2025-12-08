/**
 * MatchHistoryWidget - Recent matches display for dashboard.
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 * 
 * 2025 Redesign Updates:
 * - Uses EmptyState component for empty state
 * - Uses design tokens for colors
 */

import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { gameAPI } from '@/services/api'
import type { RecentMatch } from '@/types/matchHistory'
import { getMatchResultText, getMatchResultColor, getEloChangeDisplay, getEloChangeColor } from '@/types/matchHistory'
import { formatDistanceToNow } from 'date-fns'
import { EmptyState, EmptyMatchesIcon } from '@/components/ui/EmptyState'

interface MatchHistoryWidgetProps {
  maxItems?: number
  className?: string
}

export function MatchHistoryWidget({ maxItems = 5, className = '' }: MatchHistoryWidgetProps) {
  const navigate = useNavigate()
  const [matches, setMatches] = useState<RecentMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMatches = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await gameAPI.getRecentMatches(maxItems)
      setMatches(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load matches')
    } finally {
      setLoading(false)
    }
  }, [maxItems])

  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])

  const handleMatchClick = (matchId: string) => {
    navigate(`/match/${matchId}`)
  }

  // Loading state
  if (loading) {
    return (
      <div className={`bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl p-5 ${className}`}>
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-4">Recent Matches</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-8 h-8 bg-white/[0.1] rounded-full" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-white/[0.1] rounded mb-1" />
                <div className="h-3 w-16 bg-white/[0.1] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl p-5 ${className}`}>
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-4">Recent Matches</h3>
        <p className="text-sm text-red-400">{error}</p>
        <button onClick={fetchMatches} className="mt-2 text-xs text-neutral-500 hover:text-white">
          Retry
        </button>
      </div>
    )
  }

  // Empty state
  if (matches.length === 0) {
    return (
      <div className={`bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl p-5 ${className}`}>
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-4">Recent Matches</h3>
        <EmptyState
          icon={<EmptyMatchesIcon className="w-12 h-12" />}
          title="No matches yet"
          description="Play your first match to see your history"
          actionLabel="Play a Match"
          onAction={() => navigate('/play')}
          className="py-4"
        />
      </div>
    )
  }

  return (
    <div className={`bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl p-5 ${className}`}>
      <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-4">Recent Matches</h3>

      <div className="space-y-2">
        {matches.slice(0, maxItems).map((match) => (
          <button
            key={match.id}
            onClick={() => handleMatchClick(match.id)}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.04] transition-colors text-left"
          >
            {/* Opponent avatar */}
            <div className="relative flex-shrink-0">
              {match.opponent_avatar_url ? (
                <img
                  src={match.opponent_avatar_url}
                  alt={match.opponent_name || 'Opponent'}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-600 to-neutral-700 flex items-center justify-center text-white text-xs font-medium">
                  {(match.opponent_name || '?').charAt(0).toUpperCase()}
                </div>
              )}
              {/* Result indicator */}
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#111111] ${
                  match.is_tie ? 'bg-yellow-500' : match.won ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
            </div>

            {/* Match info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-white truncate">{match.opponent_name || 'Unknown'}</span>
                <span className={`text-xs font-medium ${getEloChangeColor(match.elo_change)}`}>
                  {getEloChangeDisplay(match.elo_change)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs ${getMatchResultColor(match)}`}>{getMatchResultText(match)}</span>
                <span className="text-xs text-neutral-600">
                  {formatDistanceToNow(new Date(match.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
