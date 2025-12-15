/**
 * useLeaderboard - React hook for enterprise leaderboard data
 * 
 * Features:
 * - Automatic subscription management
 * - Real-time updates via polling
 * - Connection state awareness
 * - Optimistic UI support
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'
import {
  leaderboardService,
} from '../services/LeaderboardService'
import type {
  LeaderboardData,
  LeaderboardStats,
  ConnectionState,
  LeaderboardServiceConfig,
} from '../services/LeaderboardService'

export interface UseLeaderboardOptions {
  autoStart?: boolean
  pollInterval?: number
}

export interface UseLeaderboardReturn {
  // Data
  leaderboard: LeaderboardData | null
  stats: LeaderboardStats | null
  
  // State
  isLoading: boolean
  isStale: boolean
  connectionState: ConnectionState
  error: string | null
  
  // Actions
  refresh: () => Promise<void>
  startPolling: () => void
  stopPolling: () => void
}

/**
 * Hook for accessing leaderboard data with real-time updates
 */
export function useLeaderboard(options: UseLeaderboardOptions = {}): UseLeaderboardReturn {
  const { autoStart = true, pollInterval = 10000 } = options
  const { token } = useAuthStore()
  
  // State
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null)
  const [stats, setStats] = useState<LeaderboardStats | null>(null)
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Track if we've done initial load
  const initialLoadDone = useRef(false)
  
  // Update service config
  useEffect(() => {
    const config: Partial<LeaderboardServiceConfig> = {
      pollInterval,
    }
    leaderboardService.updateConfig(config)
  }, [pollInterval])
  
  // Set auth token
  useEffect(() => {
    leaderboardService.setAuthToken(token)
  }, [token])
  
  // Subscribe to data updates
  useEffect(() => {
    const unsubLeaderboard = leaderboardService.subscribeToLeaderboard((data) => {
      setLeaderboard(data)
      setIsLoading(false)
      setError(null)
      initialLoadDone.current = true
    })
    
    const unsubStats = leaderboardService.subscribeToStats((data) => {
      setStats(data)
    })
    
    const unsubConnection = leaderboardService.subscribeToConnection((state) => {
      setConnectionState(state)
      
      if (state === 'error') {
        setError('Failed to connect to leaderboard service')
        setIsLoading(false)
      } else if (state === 'connecting' && !initialLoadDone.current) {
        setIsLoading(true)
      }
    })
    
    return () => {
      unsubLeaderboard()
      unsubStats()
      unsubConnection()
    }
  }, [])
  
  // Auto-start polling
  useEffect(() => {
    if (autoStart) {
      leaderboardService.startPolling()
    }
    
    return () => {
      // Don't stop on unmount if other components might be using it
      // leaderboardService.stopPolling()
    }
  }, [autoStart])
  
  // Actions
  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    await leaderboardService.refresh()
  }, [])
  
  const startPolling = useCallback(() => {
    leaderboardService.startPolling()
  }, [])
  
  const stopPolling = useCallback(() => {
    leaderboardService.stopPolling()
  }, [])
  
  // Check staleness
  const isStale = leaderboardService.isDataStale()
  
  return {
    leaderboard,
    stats,
    isLoading,
    isStale,
    connectionState,
    error,
    refresh,
    startPolling,
    stopPolling,
  }
}

/**
 * Hook for just the player's rank (lightweight)
 */
export function usePlayerRank(): {
  rank: number | null
  entry: LeaderboardData['playerEntry'] | null
  isLoading: boolean
} {
  const { leaderboard, isLoading } = useLeaderboard({ autoStart: true })
  
  return {
    rank: leaderboard?.playerRank ?? null,
    entry: leaderboard?.playerEntry ?? null,
    isLoading,
  }
}

/**
 * Hook for top N entries only
 */
export function useTopPlayers(count = 10): {
  players: LeaderboardData['entries']
  isLoading: boolean
} {
  const { leaderboard, isLoading } = useLeaderboard({ autoStart: true })
  
  return {
    players: leaderboard?.entries.slice(0, count) ?? [],
    isLoading,
  }
}
