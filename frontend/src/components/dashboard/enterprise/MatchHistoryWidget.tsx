/**
 * MatchHistoryWidget - Enterprise Match History Widget
 * 
 * Recent matches list with enhanced styling for the dashboard.
 * 
 * Features:
 * - Widget header with "Recent Matches" title
 * - List of 5 most recent matches
 * - Opponent avatar (32px, rounded) and display name
 * - Win/Loss indicator (green/red badge)
 * - ELO change (+/- with color)
 * - Relative timestamp ("2h ago", "Yesterday")
 * - Navigate to /match/:id on click
 * - Empty state with "Play a Match" CTA
 * - Loading state with skeleton rows
 * 
 * Props:
 * @param maxItems - Maximum matches to display (default: 5)
 * @param className - Additional CSS classes
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { useEffect, useState, useCallback, useRef, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { gameAPI } from '@/services/api'
import type { RecentMatch } from '@/types/matchHistory'
import { formatDistanceToNow } from 'date-fns'
import { DashboardSection } from './DashboardSection'

export interface MatchHistoryWidgetProps {
  maxItems?: number
  className?: string
}

// Retry configuration
const MAX_RETRIES = 3
const BASE_DELAY_MS = 1000

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(attempt: number): number {
  return Math.min(BASE_DELAY_MS * Math.pow(2, attempt), 10000)
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Formats ELO change for display
 * @param change - ELO change value
 * @returns Formatted string with +/- sign
 */
export function formatEloChange(change: number | null | undefined): string {
  if (change === null || change === undefined) return '—'
  if (change === 0) return '±0'
  return change > 0 ? `+${change}` : `${change}`
}

/**
 * Gets color class for ELO change
 * @param change - ELO change value
 * @returns Tailwind color class
 */
export function getEloChangeColorClass(change: number | null | undefined): string {
  if (change === null || change === undefined || change === 0) return 'text-neutral-500'
  return change > 0 ? 'text-emerald-400' : 'text-red-400'
}

/**
 * Formats relative timestamp
 * @param date - Date string or Date object
 * @returns Human-readable relative time
 */
export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

/**
 * Gets match result display data
 * @param match - Match data
 * @returns Result text and color
 */
export function getMatchResultDisplay(match: RecentMatch): { text: string; colorClass: string } {
  if (match.is_tie) {
    return { text: 'Draw', colorClass: 'bg-amber-500/20 text-amber-400' }
  }
  if (match.won) {
    return { text: 'Victory', colorClass: 'bg-emerald-500/20 text-emerald-400' }
  }
  return { text: 'Defeat', colorClass: 'bg-red-500/20 text-red-400' }
}

export function MatchHistoryWidget({ maxItems = 5, className }: MatchHistoryWidgetProps) {
  const navigate = useNavigate()
  const [matches, setMatches] = useState<RecentMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchMatches = useCallback(async (attempt = 0) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    if (attempt === 0) {
      setLoading(true)
      setError(null)
    }

    try {
      const data = await gameAPI.getRecentMatches(maxItems)
      setMatches(data)
      setRetryCount(0)
      setError(null)
    } catch (err) {
      // Don't retry on abort
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }

      // Retry with exponential backoff
      if (attempt < MAX_RETRIES) {
        setRetryCount(attempt + 1)
        await sleep(getRetryDelay(attempt))
        return fetchMatches(attempt + 1)
      }

      setError(err instanceof Error ? err.message : 'Failed to load matches')
      setRetryCount(0)
    } finally {
      if (attempt === 0 || attempt >= MAX_RETRIES) {
        setLoading(false)
      }
    }
  }, [maxItems])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Fetch matches on mount
  useEffect(() => {
    fetchMatches()
  }, []) // Empty deps - only fetch on mount, fetchMatches handles caching

  const handleMatchClick = (matchId: string) => {
    navigate(`/match/${matchId}`)
  }

  const handlePlayMatch = () => {
    navigate('/')
  }

  // Loading state - Requirements 7.5
  if (loading) {
    return (
      <DashboardSection title="Recent Matches" className={className}>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 p-2">
              <div className="w-8 h-8 bg-white/[0.1] rounded-full" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-white/[0.1] rounded mb-1" />
                <div className="h-3 w-16 bg-white/[0.1] rounded" />
              </div>
              <div className="h-5 w-12 bg-white/[0.1] rounded" />
            </div>
          ))}
        </div>
      </DashboardSection>
    )
  }

  // Error state with retry info
  if (error) {
    return (
      <DashboardSection title="Recent Matches" className={className}>
        <div className="text-center py-4">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-red-500/10 flex items-center justify-center">
            <ErrorIcon className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-sm text-red-400 mb-1">{error}</p>
          <p className="text-xs text-neutral-500 mb-3">
            {retryCount > 0 ? `Retried ${retryCount} time${retryCount > 1 ? 's' : ''}` : 'Connection failed'}
          </p>
          <button 
            onClick={() => fetchMatches(0)} 
            className="px-4 py-2 bg-white/[0.06] text-neutral-300 text-xs font-medium rounded-lg hover:bg-white/[0.1] transition-colors"
          >
            Try Again
          </button>
        </div>
      </DashboardSection>
    )
  }

  // Empty state - Requirements 7.4
  if (matches.length === 0) {
    return (
      <DashboardSection title="Recent Matches" className={className}>
        <div className="text-center py-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/[0.05] flex items-center justify-center">
            <MatchIcon className="w-6 h-6 text-neutral-500" />
          </div>
          <p className="text-sm text-neutral-400 mb-1">No matches yet</p>
          <p className="text-xs text-neutral-500 mb-3">Play your first match to see your history</p>
          <button
            onClick={handlePlayMatch}
            className="px-4 py-2 bg-indigo-500/20 text-indigo-400 text-xs font-medium rounded-lg hover:bg-indigo-500/30 transition-colors"
          >
            Play a Match
          </button>
        </div>
      </DashboardSection>
    )
  }

  return (
    <DashboardSection title="Recent Matches" className={className}>
      {/* Match list - Requirements 7.1, 7.2 */}
      <div className="space-y-1">
        {matches.slice(0, maxItems).map((match) => (
          <MatchItem
            key={match.id}
            match={match}
            onClick={() => handleMatchClick(match.id)}
          />
        ))}
      </div>
    </DashboardSection>
  )
}

// Match Item Component - Memoized for performance (Requirements 6.3)
interface MatchItemProps {
  match: RecentMatch
  onClick: () => void
}

const MatchItem = memo(function MatchItem({ match, onClick }: MatchItemProps) {
  const result = getMatchResultDisplay(match)

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.04] transition-colors text-left"
    >
      {/* Opponent avatar - 32px, rounded - Requirements 7.2 */}
      <div className="relative flex-shrink-0">
        {match.opponent_avatar_url ? (
          <img
            src={match.opponent_avatar_url}
            alt={match.opponent_name || 'Opponent'}
            className="w-8 h-8 rounded-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-600 to-neutral-700 flex items-center justify-center text-white text-xs font-medium">
            {(match.opponent_name || '?').charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Match info */}
      <div className="flex-1 min-w-0">
        {/* Opponent name - sm font - Requirements 7.2 */}
        <p className="text-sm text-white truncate">
          {match.opponent_name || 'Unknown'}
        </p>
        {/* Relative timestamp - Requirements 7.2 */}
        <p className="text-xs text-neutral-500">
          {formatRelativeTime(match.created_at)}
        </p>
      </div>

      {/* Result and ELO change */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Win/Loss badge - green/red - Requirements 7.2 */}
        <span className={`px-2 py-0.5 text-xs font-medium rounded ${result.colorClass}`}>
          {result.text}
        </span>
        {/* ELO change - +/- with color - Requirements 7.2 */}
        <span className={`text-xs font-semibold tabular-nums ${getEloChangeColorClass(match.elo_change)}`}>
          {formatEloChange(match.elo_change)}
        </span>
      </div>
    </button>
  )
})

// Icon Components
function MatchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}
