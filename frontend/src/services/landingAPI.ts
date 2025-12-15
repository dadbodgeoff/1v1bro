/**
 * Landing page API service
 * Fetches statistics and recent matches for the landing page
 * 
 * Validates: Requirements 4.1, 4.3, 4.6
 */

import type { LandingStats, RecentMatch } from '@/components/landing/types'
import { API_BASE } from '@/utils/constants'

/**
 * Fetch landing page statistics
 */
export async function fetchLandingStats(): Promise<LandingStats> {
  try {
    const response = await fetch(`${API_BASE}/stats/landing`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    return {
      totalGames: data.total_games ?? 0,
      activePlayers: data.active_players ?? 0,
      questionsAnswered: data.questions_answered ?? 0,
      avgMatchDuration: data.avg_match_duration ?? 0,
      recentMatches: (data.recent_matches ?? []).map(parseRecentMatch),
      lastUpdated: new Date(),
    }
  } catch (error) {
    // Return mock data for development/demo
    if (import.meta.env.DEV) {
      return getMockStats()
    }
    throw error
  }
}

/**
 * Fetch recent matches
 */
export async function fetchRecentMatches(limit: number = 5): Promise<RecentMatch[]> {
  try {
    const response = await fetch(`${API_BASE}/matches/recent?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return (data.matches ?? []).map(parseRecentMatch)
  } catch (error) {
    // Return mock data for development/demo
    if (import.meta.env.DEV) {
      return getMockRecentMatches()
    }
    throw error
  }
}

interface RawRecentMatch {
  id?: string
  winner?: string
  loser?: string
  winner_avatar?: string
  loser_avatar?: string
  timestamp?: string | number
}

function parseRecentMatch(data: RawRecentMatch): RecentMatch {
  return {
    id: data.id ?? crypto.randomUUID(),
    winner: data.winner ?? 'Unknown',
    loser: data.loser ?? 'Unknown',
    winnerAvatar: data.winner_avatar,
    loserAvatar: data.loser_avatar,
    timestamp: new Date(data.timestamp ?? Date.now()),
  }
}

// Mock data for development
function getMockStats(): LandingStats {
  return {
    totalGames: 15420 + Math.floor(Math.random() * 100),
    activePlayers: 35 + Math.floor(Math.random() * 20),
    questionsAnswered: 89750 + Math.floor(Math.random() * 500),
    avgMatchDuration: 180,
    recentMatches: getMockRecentMatches(),
    lastUpdated: new Date(),
  }
}

function getMockRecentMatches(): RecentMatch[] {
  const names = ['ProPlayer99', 'QuizMaster', 'ArenaKing', 'TriviaChamp', 'SpeedRunner', 'BrainBox', 'QuickDraw']
  const matches: RecentMatch[] = []
  
  for (let i = 0; i < 5; i++) {
    const winnerIdx = Math.floor(Math.random() * names.length)
    let loserIdx = Math.floor(Math.random() * names.length)
    while (loserIdx === winnerIdx) {
      loserIdx = Math.floor(Math.random() * names.length)
    }
    
    matches.push({
      id: crypto.randomUUID(),
      winner: names[winnerIdx],
      loser: names[loserIdx],
      timestamp: new Date(Date.now() - i * 120000 - Math.random() * 60000),
    })
  }
  
  return matches
}
