/**
 * Dashboard data hook combining profile, battlepass, rating, and friends data.
 * Requirements: 1.1-1.4, 4.1-4.3, 5.1, 6.1
 */

import { useState, useCallback, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import type { Profile } from '../types/profile'
import type { PlayerBattlePass, Season } from '../types/battlepass'
import type { RecentMatch } from '../types/matchHistory'
import type { Friend } from '../types/friend'
import { getRankTier, type RankTier } from '../types/leaderboard'

const API_BASE = import.meta.env.VITE_API_URL || ''

interface DashboardLoading {
  profile: boolean
  rating: boolean
  battlePass: boolean
  matches: boolean
  friends: boolean
}

interface DashboardErrors {
  profile: string | null
  rating: string | null
  battlePass: string | null
  matches: string | null
  friends: string | null
}

interface PlayerRating {
  elo: number
  tier: RankTier
  rank: number | null
}

interface UseDashboardReturn {
  // Data
  profile: Profile | null
  rating: PlayerRating | null
  battlePassProgress: PlayerBattlePass | null
  season: Season | null
  recentMatches: RecentMatch[]
  onlineFriends: Friend[]

  // Loading states
  loading: DashboardLoading

  // Error states
  errors: DashboardErrors

  // Actions
  refresh: () => Promise<void>
  refreshProfile: () => Promise<void>
  refreshRating: () => Promise<void>
  refreshBattlePass: () => Promise<void>
  refreshMatches: () => Promise<void>
  refreshFriends: () => Promise<void>
}

export function useDashboard(): UseDashboardReturn {
  // Data state
  const [profile, setProfile] = useState<Profile | null>(null)
  const [rating, setRating] = useState<PlayerRating | null>(null)
  const [battlePassProgress, setBattlePassProgress] = useState<PlayerBattlePass | null>(null)
  const [season, setSeason] = useState<Season | null>(null)
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([])
  const [onlineFriends, setOnlineFriends] = useState<Friend[]>([])

  // Loading states
  const [loading, setLoading] = useState<DashboardLoading>({
    profile: false,
    rating: false,
    battlePass: false,
    matches: false,
    friends: false,
  })

  // Error states
  const [errors, setErrors] = useState<DashboardErrors>({
    profile: null,
    rating: null,
    battlePass: null,
    matches: null,
    friends: null,
  })

  // Get token from auth store
  const token = useAuthStore((s) => s.token)

  const getAuthHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }, [token])

  // Fetch profile - handles 404/500 gracefully
  const refreshProfile = useCallback(async () => {
    setLoading((prev) => ({ ...prev, profile: true }))
    setErrors((prev) => ({ ...prev, profile: null }))
    try {
      const response = await fetch(`${API_BASE}/api/v1/profiles/me`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        // Extract from API response wrapper if present
        setProfile(data.data || data)
      } else {
        // Profile not found or error - set to null (UI will show default state)
        setProfile(null)
      }
    } catch {
      // Network error - set profile to null
      setProfile(null)
    } finally {
      setLoading((prev) => ({ ...prev, profile: false }))
    }
  }, [getAuthHeaders])

  // Fetch ELO rating - handles 404 gracefully
  const refreshRating = useCallback(async () => {
    setLoading((prev) => ({ ...prev, rating: true }))
    setErrors((prev) => ({ ...prev, rating: null }))
    try {
      // Use the ELO-specific endpoint /leaderboards/elo/me (NOT /elo/rank/me)
      const response = await fetch(`${API_BASE}/api/v1/leaderboards/elo/me`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      })
      if (!response.ok) {
        // 404 is expected for users with no ELO rating
        setRating(null)
        return
      }
      const data = await response.json()
      const ratingData = data.data || data
      if (ratingData?.rating) {
        setRating({
          elo: ratingData.rating.current_elo,
          tier: getRankTier(ratingData.rating.current_elo),
          rank: ratingData.rank || null,
        })
      } else {
        setRating(null)
      }
    } catch {
      // 404 is expected for users with no ELO rating
      setRating(null)
    } finally {
      setLoading((prev) => ({ ...prev, rating: false }))
    }
  }, [getAuthHeaders])

  // Fetch battle pass progress
  const refreshBattlePass = useCallback(async () => {
    setLoading((prev) => ({ ...prev, battlePass: true }))
    setErrors((prev) => ({ ...prev, battlePass: null }))
    try {
      // Fetch season info (404 is expected if no active season)
      const seasonResponse = await fetch(`${API_BASE}/api/v1/battlepass/current`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      })
      if (seasonResponse.ok) {
        const seasonData = await seasonResponse.json()
        setSeason(seasonData.data || seasonData)
      } else {
        // No active season - this is okay
        setSeason(null)
      }

      // Fetch progress (404 is expected if no active season)
      const progressResponse = await fetch(`${API_BASE}/api/v1/battlepass/me`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      })
      if (progressResponse.ok) {
        const progressData = await progressResponse.json()
        setBattlePassProgress(progressData.data || progressData)
      } else {
        // No progress yet - this is okay
        setBattlePassProgress(null)
      }
    } catch (err) {
      // Network errors are real errors
      setErrors((prev) => ({
        ...prev,
        battlePass: err instanceof Error ? err.message : 'Unknown error',
      }))
    } finally {
      setLoading((prev) => ({ ...prev, battlePass: false }))
    }
  }, [getAuthHeaders])

  // Fetch recent matches
  const refreshMatches = useCallback(async () => {
    setLoading((prev) => ({ ...prev, matches: true }))
    setErrors((prev) => ({ ...prev, matches: null }))
    try {
      const response = await fetch(`${API_BASE}/api/v1/games/history?limit=5`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        // Handle API response wrapper
        const matches = data.data || data || []
        setRecentMatches(Array.isArray(matches) ? matches : [])
      } else {
        // No matches yet - this is okay
        setRecentMatches([])
      }
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        matches: err instanceof Error ? err.message : 'Unknown error',
      }))
    } finally {
      setLoading((prev) => ({ ...prev, matches: false }))
    }
  }, [getAuthHeaders])

  // Fetch friends and filter online - handles errors gracefully
  const refreshFriends = useCallback(async () => {
    setLoading((prev) => ({ ...prev, friends: true }))
    setErrors((prev) => ({ ...prev, friends: null }))
    try {
      const response = await fetch(`${API_BASE}/api/v1/friends`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        // Handle API response wrapper and various response formats
        const friendsData = data.data || data
        const friends = friendsData.friends || friendsData || []
        // Filter to online friends only (handle missing fields gracefully)
        const online = Array.isArray(friends) 
          ? friends.filter((f: Friend) => f.is_online && f.show_online_status !== false)
          : []
        setOnlineFriends(online)
      } else {
        // No friends or error - set empty array
        setOnlineFriends([])
      }
    } catch {
      // Network error - set empty array
      setOnlineFriends([])
    } finally {
      setLoading((prev) => ({ ...prev, friends: false }))
    }
  }, [getAuthHeaders])

  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([
      refreshProfile(),
      refreshRating(),
      refreshBattlePass(),
      refreshMatches(),
      refreshFriends(),
    ])
  }, [refreshProfile, refreshRating, refreshBattlePass, refreshMatches, refreshFriends])

  // Initial fetch
  useEffect(() => {
    refresh()
  }, [refresh])

  // Refresh on window focus
  useEffect(() => {
    const handleFocus = () => {
      refresh()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refresh])

  return {
    profile,
    rating,
    battlePassProgress,
    season,
    recentMatches,
    onlineFriends,
    loading,
    errors,
    refresh,
    refreshProfile,
    refreshRating,
    refreshBattlePass,
    refreshMatches,
    refreshFriends,
  }
}
