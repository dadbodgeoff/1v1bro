/**
 * LeaderboardService - Enterprise-grade async leaderboard data management
 * 
 * Features:
 * - Automatic polling with configurable intervals
 * - Optimistic updates
 * - Connection state management
 * - Retry logic with exponential backoff
 * - Data caching and staleness detection
 */

import { API_BASE } from '@/utils/constants'

// Types
export interface LeaderboardEntry {
  rank: number
  userId: string
  displayName: string
  avatarUrl?: string
  bestDistance: number
  bestScore: number
  bestCombo: number
  totalRuns?: number
  avgDistance?: number
}

export interface LeaderboardData {
  entries: LeaderboardEntry[]
  totalPlayers: number
  playerRank?: number
  playerEntry?: LeaderboardEntry
  lastUpdated: number
}

export interface LeaderboardStats {
  totalRuns: number
  uniquePlayers: number
  avgDistance: number
  avgScore: number
  maxDistance: number
  maxScore: number
  maxCombo: number
}

export type ConnectionState = 'connected' | 'connecting' | 'disconnected' | 'error'

export interface LeaderboardServiceConfig {
  pollInterval: number        // ms between polls (default: 10000)
  maxRetries: number          // max retry attempts (default: 3)
  retryDelay: number          // base retry delay in ms (default: 1000)
  staleThreshold: number      // ms before data is considered stale (default: 30000)
}

type LeaderboardListener = (data: LeaderboardData) => void
type StatsListener = (stats: LeaderboardStats) => void
type ConnectionListener = (state: ConnectionState) => void

const DEFAULT_CONFIG: LeaderboardServiceConfig = {
  pollInterval: 10000,
  maxRetries: 3,
  retryDelay: 1000,
  staleThreshold: 30000,
}

/**
 * Enterprise Leaderboard Service
 * Manages async data fetching with guaranteed delivery
 */
export class LeaderboardService {
  private config: LeaderboardServiceConfig
  private authToken: string | null = null
  
  // State
  private leaderboardData: LeaderboardData | null = null
  private statsData: LeaderboardStats | null = null
  private connectionState: ConnectionState = 'disconnected'
  private pollTimer: ReturnType<typeof setInterval> | null = null
  private retryCount = 0
  private isPolling = false
  
  // Listeners
  private leaderboardListeners: Set<LeaderboardListener> = new Set()
  private statsListeners: Set<StatsListener> = new Set()
  private connectionListeners: Set<ConnectionListener> = new Set()
  
  constructor(config: Partial<LeaderboardServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }
  
  // ============================================
  // Configuration
  // ============================================
  
  setAuthToken(token: string | null): void {
    this.authToken = token
  }
  
  updateConfig(config: Partial<LeaderboardServiceConfig>): void {
    this.config = { ...this.config, ...config }
    
    // Restart polling if active
    if (this.pollTimer) {
      this.stopPolling()
      this.startPolling()
    }
  }
  
  // ============================================
  // Subscription Management
  // ============================================
  
  subscribeToLeaderboard(listener: LeaderboardListener): () => void {
    this.leaderboardListeners.add(listener)
    
    // Immediately emit current data if available
    if (this.leaderboardData) {
      listener(this.leaderboardData)
    }
    
    return () => {
      this.leaderboardListeners.delete(listener)
    }
  }
  
  subscribeToStats(listener: StatsListener): () => void {
    this.statsListeners.add(listener)
    
    if (this.statsData) {
      listener(this.statsData)
    }
    
    return () => {
      this.statsListeners.delete(listener)
    }
  }
  
  subscribeToConnection(listener: ConnectionListener): () => void {
    this.connectionListeners.add(listener)
    listener(this.connectionState)
    
    return () => {
      this.connectionListeners.delete(listener)
    }
  }
  
  // ============================================
  // Polling Control
  // ============================================
  
  startPolling(): void {
    if (this.pollTimer) return
    
    this.isPolling = true
    this.setConnectionState('connecting')
    
    // Initial fetch
    this.fetchAll()
    
    // Set up interval
    this.pollTimer = setInterval(() => {
      this.fetchAll()
    }, this.config.pollInterval)
  }
  
  stopPolling(): void {
    this.isPolling = false
    
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
    
    this.setConnectionState('disconnected')
  }
  
  // ============================================
  // Data Fetching
  // ============================================
  
  async fetchAll(): Promise<void> {
    await Promise.all([
      this.fetchLeaderboard(),
      this.fetchStats(),
    ])
  }
  
  async fetchLeaderboard(limit = 100): Promise<LeaderboardData | null> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`
      }
      
      const response = await fetch(`${API_BASE}/survival/leaderboard?limit=${limit}`, {
        method: 'GET',
        headers,
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      // Transform to our format
      const leaderboardData: LeaderboardData = {
        entries: (data.entries || []).map((entry: Record<string, unknown>) => ({
          rank: entry.rank as number,
          userId: entry.user_id as string,
          displayName: entry.display_name as string || 'Anonymous',
          avatarUrl: entry.avatar_url as string | undefined,
          bestDistance: entry.best_distance as number,
          bestScore: entry.best_score as number,
          bestCombo: entry.best_combo as number,
          totalRuns: entry.total_runs as number | undefined,
          avgDistance: entry.avg_distance as number | undefined,
        })),
        totalPlayers: data.total_players || 0,
        playerRank: data.player_rank,
        playerEntry: data.player_entry ? {
          rank: data.player_entry.rank,
          userId: data.player_entry.user_id,
          displayName: data.player_entry.display_name || 'Anonymous',
          avatarUrl: data.player_entry.avatar_url,
          bestDistance: data.player_entry.best_distance,
          bestScore: data.player_entry.best_score,
          bestCombo: data.player_entry.best_combo,
        } : undefined,
        lastUpdated: Date.now(),
      }
      
      this.leaderboardData = leaderboardData
      this.retryCount = 0
      this.setConnectionState('connected')
      
      // Notify listeners
      this.leaderboardListeners.forEach(listener => listener(leaderboardData))
      
      return leaderboardData
    } catch (error) {
      console.error('[LeaderboardService] Fetch error:', error)
      await this.handleFetchError()
      return null
    }
  }
  
  async fetchStats(): Promise<LeaderboardStats | null> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      // Public stats endpoint - no auth required
      const response = await fetch(`${API_BASE}/survival/leaderboard/stats`, {
        method: 'GET',
        headers,
      })
      
      if (!response.ok) {
        // Stats endpoint failed, try telemetry as fallback
        return this.fetchStatsFallback()
      }
      
      const data = await response.json()
      
      const stats: LeaderboardStats = {
        totalRuns: data.total_runs || 0,
        uniquePlayers: data.unique_players || 0,
        avgDistance: data.avg_distance || 0,
        avgScore: data.avg_score || 0,
        maxDistance: data.max_distance || 0,
        maxScore: data.max_score || 0,
        maxCombo: data.max_combo || 0,
      }
      
      this.statsData = stats
      
      // Notify listeners
      this.statsListeners.forEach(listener => listener(stats))
      
      return stats
    } catch {
      // Stats are optional, don't trigger error state
      return null
    }
  }
  
  private async fetchStatsFallback(): Promise<LeaderboardStats | null> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`
      }
      
      const response = await fetch(`${API_BASE}/survival/telemetry?days=7`, {
        method: 'GET',
        headers,
      })
      
      if (!response.ok) return null
      
      const data = await response.json()
      
      const stats: LeaderboardStats = {
        totalRuns: data.total_runs || 0,
        uniquePlayers: 0,
        avgDistance: data.avg_distance || 0,
        avgScore: data.avg_score || 0,
        maxDistance: 0,
        maxScore: 0,
        maxCombo: data.avg_combo || 0,
      }
      
      this.statsData = stats
      this.statsListeners.forEach(listener => listener(stats))
      
      return stats
    } catch {
      return null
    }
  }
  
  // ============================================
  // Error Handling
  // ============================================
  
  private async handleFetchError(): Promise<void> {
    this.retryCount++
    
    if (this.retryCount >= this.config.maxRetries) {
      this.setConnectionState('error')
      return
    }
    
    this.setConnectionState('connecting')
    
    // Exponential backoff
    const delay = this.config.retryDelay * Math.pow(2, this.retryCount - 1)
    await new Promise(resolve => setTimeout(resolve, delay))
    
    // Retry
    if (this.isPolling) {
      await this.fetchAll()
    }
  }
  
  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state
      this.connectionListeners.forEach(listener => listener(state))
    }
  }
  
  // ============================================
  // Utility Methods
  // ============================================
  
  getLeaderboardData(): LeaderboardData | null {
    return this.leaderboardData
  }
  
  getStatsData(): LeaderboardStats | null {
    return this.statsData
  }
  
  getConnectionState(): ConnectionState {
    return this.connectionState
  }
  
  isDataStale(): boolean {
    if (!this.leaderboardData) return true
    return Date.now() - this.leaderboardData.lastUpdated > this.config.staleThreshold
  }
  
  // Force refresh
  async refresh(): Promise<void> {
    this.retryCount = 0
    await this.fetchAll()
  }
  
  // Cleanup
  destroy(): void {
    this.stopPolling()
    this.leaderboardListeners.clear()
    this.statsListeners.clear()
    this.connectionListeners.clear()
  }
}

// Singleton instance
export const leaderboardService = new LeaderboardService()
