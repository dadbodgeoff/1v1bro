/**
 * useMatchHistory hook - Fetches match history for the current user.
 * Requirements: Profile Enterprise - Match History Section
 * 
 * Features:
 * - Paginated match history fetching
 * - Exponential backoff retry for network failures
 * - Load more functionality
 */

import { useState, useCallback, useRef } from 'react'
import { useAuthStore } from '../stores/authStore'
import type { MatchResult } from '../components/profile/enterprise'

interface MatchHistoryResponse {
  matches: MatchResult[]
  total: number
  has_more: boolean
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
    offset: number,
    attempt: number = 0
  ): Promise<MatchHistoryResponse> => {
    const response = await fetch(
      `${API_BASE}/api/v1/profiles/me/matches?limit=${limit}&offset=${offset}`,
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
        return fetchWithRetry(limit, offset, attempt + 1)
      }
      throw new Error(`Failed to fetch match history: ${response.status}`)
    }

    const result = await response.json()
    return result.data
  }, [token])

  const fetchMatches = useCallback(async (limit = 10, offset = 0) => {
    if (!token) {
      setError('Not authenticated')
      return
    }

    setLoading(true)
    setError(null)
    lastFetchParams.current = { limit, offset }

    try {
      const data = await fetchWithRetry(limit, offset)

      if (offset === 0) {
        setMatches(data.matches)
      } else {
        setMatches(prev => [...prev, ...data.matches])
      }
      
      setTotal(data.total)
      setHasMore(data.has_more)
      setCurrentOffset(offset + data.matches.length)
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
