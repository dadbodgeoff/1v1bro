/**
 * useLandingStats - Fetches and manages landing page statistics
 * Polls for updates and handles caching/fallback
 * 
 * Validates: Requirements 4.1, 4.3, 4.4, 4.6
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchLandingStats } from '@/services/landingAPI'
import type { LandingStats } from '@/components/landing/types'

interface UseLandingStatsResult {
  stats: LandingStats | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

const POLL_INTERVAL = 30000 // 30 seconds
const CACHE_KEY = 'landing_stats_cache'

// Fallback stats when API is unavailable
const FALLBACK_STATS: LandingStats = {
  totalGames: 15420,
  activePlayers: 42,
  questionsAnswered: 89750,
  avgMatchDuration: 180,
  recentMatches: [],
  lastUpdated: new Date(),
}

function getCachedStats(): LandingStats | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const parsed = JSON.parse(cached)
      return {
        ...parsed,
        lastUpdated: new Date(parsed.lastUpdated),
        recentMatches: parsed.recentMatches.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        })),
      }
    }
  } catch {
    // Ignore cache errors
  }
  return null
}

function setCachedStats(stats: LandingStats): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(stats))
  } catch {
    // Ignore cache errors
  }
}

export function useLandingStats(): UseLandingStatsResult {
  const [stats, setStats] = useState<LandingStats | null>(() => getCachedStats())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isVisibleRef = useRef(true)

  const fetchStats = useCallback(async () => {
    try {
      const data = await fetchLandingStats()
      setStats(data)
      setCachedStats(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch stats'))
      // Use cached or fallback stats
      if (!stats) {
        const cached = getCachedStats()
        setStats(cached || FALLBACK_STATS)
      }
    } finally {
      setIsLoading(false)
    }
  }, [stats])

  // Initial fetch
  useEffect(() => {
    fetchStats()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Polling when visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === 'visible'
      
      if (isVisibleRef.current && !intervalRef.current) {
        // Resume polling
        intervalRef.current = setInterval(() => {
          if (isVisibleRef.current) {
            fetchStats()
          }
        }, POLL_INTERVAL)
      } else if (!isVisibleRef.current && intervalRef.current) {
        // Pause polling
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    // Start polling
    intervalRef.current = setInterval(() => {
      if (isVisibleRef.current) {
        fetchStats()
      }
    }, POLL_INTERVAL)

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchStats])

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  }
}
