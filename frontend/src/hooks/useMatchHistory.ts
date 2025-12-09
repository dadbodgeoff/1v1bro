/**
 * useMatchHistory hook - Fetches match history for the current user.
 * Requirements: Profile Enterprise - Match History Section, 7.5 - Return recap_data
 * 
 * Features:
 * - Uses same endpoint as dashboard (/api/v1/games/history) for consistency
 * - Exponential backoff retry for network failures
 * - Load more functionality
 */

import { useState, useCallback, useRef } from 'react'
import { useAuthStore } from '../stores/authStore'
import type { MatchResult } from '../components/profile/enterprise'

// API response type from /games/history
interface GameHistoryItem {
  id: string
  opponent_id: string
  opponent_name: string | null
  opponent_avatar_url: string | null
  my_score: number
  opponent_score: number
  won: boolean
  is_tie: boolean
  elo_change: number
  created_at: string
}

interface UseMatchHistoryReturn {
  matches: MatchResult[]
  total: number
  hasMore: boolean
  loading: boolean
  error: string | null
  retryCount: number
  fetchMatches: (limit?: number, offset?: number) => Promise<void>
  loadMore: () => Promise<void>
  retry: () => Promise<void>
}

const API_BASE = import.meta.env.VITE_API_URL || ''
const MAX_RETRIES = 3
const BASE_DELAY_MS = 1000

/**
 * Exponential backoff delay calculation
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
 * Transform API response to MatchResult format
 */
function transformToMatchResult(item: GameHistoryItem): MatchResult {
  return {
    id: item.id,
    opponent: {
      id: item.opponent_id,
      display_name: item.opponent_name || 'Unknown',
      avatar_url: item.opponent_avatar_url || undefined,
    },
    won: item.won,
    xp_earned: 0, // Not provided by this endpoint
    played_at: item.created_at,
  }
}

export function useMatchHistory(): UseMatchHistoryReturn {
  const token = useAuthStore((state) => state.token)
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentOffset, setCurrentOffset] = useState(0)
  const [retryCount, setRetryCount] = useState(0)
  const lastFetchParams = useRef<{ limit: number; offset: number }>({ limit: 10, offset: 0 })

  const fetchWithRetry = useCallback(async (
    limit: number,
    attempt: number = 0
  ): Promise<GameHistoryItem[]> => {
    // Use the same endpoint as dashboard for consistency
    const response = await fetch(
      `${API_BASE}/api/v1/games/history?limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (!response.ok) {
      // Retry on 5xx errors or network issues
      if (response.status >= 500 && attempt < MAX_RETRIES) {
        await sleep(getRetryDelay(attempt))
        return fetchWithRetry(limit, attempt + 1)
      }
      throw new Error(`Failed to fetch match history: ${response.status}`)
    }

    const result = await response.json()
    return result.data || []
  }, [token])

  const fetchMatches = useCallback(async (limit = 10, _offset = 0) => {
    if (!token) {
      setError('Not authenticated')
      return
    }

    setLoading(true)
    setError(null)
    lastFetchParams.current = { limit, offset: _offset }

    try {
      const data = await fetchWithRetry(limit)
      const transformedMatches = data.map(transformToMatchResult)

      setMatches(transformedMatches)
      setTotal(transformedMatches.length)
      setHasMore(false) // This endpoint doesn't support pagination
      setCurrentOffset(transformedMatches.length)
      setRetryCount(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch match history')
      setRetryCount(prev => prev + 1)
    } finally {
      setLoading(false)
    }
  }, [token, fetchWithRetry])

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return
    await fetchMatches(10, currentOffset)
  }, [fetchMatches, hasMore, loading, currentOffset])

  const retry = useCallback(async () => {
    const { limit, offset } = lastFetchParams.current
    await fetchMatches(limit, offset)
  }, [fetchMatches])

  return {
    matches,
    total,
    hasMore,
    loading,
    error,
    retryCount,
    fetchMatches,
    loadMore,
    retry,
  }
}
