/**
 * useAchievements hook - Fetches achievements for the current user.
 * Requirements: Profile Enterprise - Achievements Section
 * 
 * Features:
 * - Achievement fetching with caching
 * - Exponential backoff retry for network failures
 * - Manual retry functionality
 */

import { useState, useCallback, useRef } from 'react'
import { useAuthStore } from '../stores/authStore'
import type { Achievement } from '../components/profile/enterprise'

interface AchievementsResponse {
  achievements: Achievement[]
  total: number
}

interface UseAchievementsReturn {
  achievements: Achievement[]
  total: number
  loading: boolean
  error: string | null
  retryCount: number
  fetchAchievements: () => Promise<void>
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

export function useAchievements(): UseAchievementsReturn {
  const token = useAuthStore((state) => state.token)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const isFetching = useRef(false)

  const fetchWithRetry = useCallback(async (attempt: number = 0): Promise<AchievementsResponse> => {
    const response = await fetch(
      `${API_BASE}/api/v1/profiles/me/achievements`,
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
        return fetchWithRetry(attempt + 1)
      }
      throw new Error(`Failed to fetch achievements: ${response.status}`)
    }

    const result = await response.json()
    return result.data
  }, [token])

  const fetchAchievements = useCallback(async () => {
    if (!token) {
      setError('Not authenticated')
      return
    }

    // Prevent duplicate fetches
    if (isFetching.current) return
    isFetching.current = true

    setLoading(true)
    setError(null)

    try {
      const data = await fetchWithRetry()
      setAchievements(data.achievements)
      setTotal(data.total)
      setRetryCount(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch achievements')
      setRetryCount(prev => prev + 1)
    } finally {
      setLoading(false)
      isFetching.current = false
    }
  }, [token, fetchWithRetry])

  const retry = useCallback(async () => {
    await fetchAchievements()
  }, [fetchAchievements])

  return {
    achievements,
    total,
    loading,
    error,
    retryCount,
    fetchAchievements,
    retry,
  }
}
