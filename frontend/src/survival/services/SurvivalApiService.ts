/**
 * SurvivalApiService - Frontend API client for survival mode
 * 
 * Handles communication with backend for:
 * - Run submission
 * - Personal best retrieval
 * - Ghost data fetching
 * - Leaderboard queries
 */

import type { 
  SurvivalRunData, 
  LeaderboardEntry 
} from '../types/survival'

// API response types
export interface SurvivalRunResponse {
  id: string
  user_id: string
  distance: number           // Server-verified distance
  score: number              // Server-verified score
  duration_seconds: number
  max_speed: number
  max_combo: number
  total_near_misses: number
  perfect_dodges: number
  obstacles_cleared: number
  death_obstacle_type?: string
  death_position_x?: number
  death_position_z?: number
  has_ghost: boolean
  created_at: string
  // Validation info
  validation_status?: 'valid' | 'suspicious' | 'rejected'
  validation_confidence?: number
}

export interface RunValidationError {
  message: string
  reason?: string
  flags?: string[]
}

export interface RateLimitError {
  message: string
  max_per_day: number
  min_interval_seconds: number
}

export interface PersonalBestResponse {
  user_id: string
  run_id: string
  best_distance: number
  best_score: number
  best_combo: number
  ghost_data?: string
  achieved_at: string
}

export interface GhostDataResponse {
  user_id: string
  ghost_data: string
  distance: number
  seed?: number
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[]
  total_players: number
  player_rank?: number
  player_entry?: LeaderboardEntry
}

// API base URL
const API_BASE = '/api/v1/survival'

/**
 * Survival API Service
 */
export class SurvivalApiService {
  private authToken: string | null = null
  
  /**
   * Set authentication token for API calls
   */
  setAuthToken(token: string | null): void {
    this.authToken = token
  }
  
  /**
   * Get headers for API requests
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`
    }
    
    return headers
  }
  
  /**
   * Submit a completed run to the backend with server-side validation
   * Requirements: 6.1
   * 
   * The server will:
   * 1. Validate the run using sanity checks
   * 2. Replay using ghost data to verify score/distance
   * 3. Return server-verified values
   * 
   * @returns Object with response and any validation/rate limit errors
   */
  async submitRun(runData: SurvivalRunData): Promise<{
    response: SurvivalRunResponse | null
    validationError?: RunValidationError
    rateLimitError?: RateLimitError
  }> {
    try {
      const response = await fetch(`${API_BASE}/runs`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          distance: runData.distance,
          score: runData.score,
          duration_seconds: runData.durationSeconds,
          max_speed: runData.maxSpeed,
          max_combo: runData.maxCombo,
          total_near_misses: runData.totalNearMisses,
          perfect_dodges: runData.perfectDodges,
          obstacles_cleared: runData.obstaclesCleared,
          death_obstacle_type: runData.deathObstacleType,
          death_position_x: runData.deathPosition?.x,
          death_position_z: runData.deathPosition?.z,
          death_distance: runData.deathDistance,
          seed: runData.seed,
          ghost_data: runData.ghostData,
        }),
      })
      
      if (response.status === 429) {
        // Rate limited
        const error = await response.json()
        console.warn('Rate limited:', error)
        return { response: null, rateLimitError: error.detail }
      }
      
      if (response.status === 400) {
        // Validation failed
        const error = await response.json()
        console.warn('Run validation failed:', error)
        return { response: null, validationError: error.detail }
      }
      
      if (!response.ok) {
        console.error('Failed to submit run:', response.status)
        return { response: null }
      }
      
      const data = await response.json()
      
      // Log if server adjusted values
      if (data.distance !== runData.distance || data.score !== runData.score) {
        console.info(
          `[SurvivalApi] Server adjusted values: ` +
          `distance ${runData.distance} -> ${data.distance}, ` +
          `score ${runData.score} -> ${data.score}`
        )
      }
      
      if (data.validation_status === 'suspicious') {
        console.warn('[SurvivalApi] Run flagged as suspicious')
      }
      
      return { response: data }
    } catch (error) {
      console.error('Error submitting run:', error)
      return { response: null }
    }
  }
  
  /**
   * Get current user's personal best
   * Requirements: 5.4, 6.3
   */
  async getPersonalBest(): Promise<PersonalBestResponse | null> {
    try {
      const response = await fetch(`${API_BASE}/runs/personal-best`, {
        method: 'GET',
        headers: this.getHeaders(),
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          return null  // No PB yet
        }
        console.error('Failed to get personal best:', response.status)
        return null
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error getting personal best:', error)
      return null
    }
  }
  
  /**
   * Get ghost data for a user
   * Requirements: 5.1
   */
  async getGhostData(userId?: string): Promise<GhostDataResponse | null> {
    try {
      const url = userId 
        ? `${API_BASE}/ghost/${userId}`
        : `${API_BASE}/ghost`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          return null  // No ghost data
        }
        console.error('Failed to get ghost data:', response.status)
        return null
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error getting ghost data:', error)
      return null
    }
  }
  
  /**
   * Get survival leaderboard
   * Requirements: 6.4, 6.5
   */
  async getLeaderboard(limit: number = 100): Promise<LeaderboardResponse | null> {
    try {
      const response = await fetch(`${API_BASE}/leaderboard?limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders(),
      })
      
      if (!response.ok) {
        console.error('Failed to get leaderboard:', response.status)
        return null
      }
      
      const data = await response.json()
      
      // Transform snake_case to camelCase
      return {
        entries: data.entries.map((entry: Record<string, unknown>) => ({
          rank: entry.rank,
          userId: entry.user_id,
          displayName: entry.display_name,
          avatarUrl: entry.avatar_url,
          bestDistance: entry.best_distance,
          bestScore: entry.best_score,
          bestCombo: entry.best_combo,
        })),
        total_players: data.total_players,
        player_rank: data.player_rank,
        player_entry: data.player_entry ? {
          rank: data.player_entry.rank,
          userId: data.player_entry.user_id,
          displayName: data.player_entry.display_name,
          avatarUrl: data.player_entry.avatar_url,
          bestDistance: data.player_entry.best_distance,
          bestScore: data.player_entry.best_score,
          bestCombo: data.player_entry.best_combo,
        } : undefined,
      }
    } catch (error) {
      console.error('Error getting leaderboard:', error)
      return null
    }
  }
}

// Singleton instance
export const survivalApi = new SurvivalApiService()
