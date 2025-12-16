/**
 * useGameAnalytics - Game-specific analytics tracking
 * 
 * Tracks:
 * - Game session lifecycle (start, complete, abandon)
 * - Win/loss/draw outcomes
 * - Time-in-game metrics
 * - Kill/death stats
 * - Tutorial completion
 * - Category/map preferences
 */

import { useCallback, useRef, useEffect } from 'react'
import { API_BASE } from '@/utils/constants'

// ============================================
// Types
// ============================================

export type GameMode = 'pvp' | 'bot' | 'instant_play'
export type GameOutcome = 'win' | 'loss' | 'draw' | 'abandoned'

interface GameSessionData {
  game_mode: GameMode
  category?: string
  map_id?: string
  is_guest: boolean
  device_type: string
}

interface GameCompleteData {
  outcome: GameOutcome
  duration_seconds: number
  local_score: number
  opponent_score: number
  kills: number
  deaths: number
  questions_answered: number
  questions_correct: number
  rounds_played: number
}

interface TutorialData {
  step: string
  completed: boolean
  time_spent_ms: number
  skipped: boolean
}

// ============================================
// Helpers
// ============================================

const generateId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

const getSessionId = (): string => {
  // Use consistent key across all analytics systems
  const key = '1v1bro_session_id'
  let id = sessionStorage.getItem(key)
  if (!id) {
    id = `s_${generateId()}`
    sessionStorage.setItem(key, id)
  }
  return id
}

const getVisitorId = (): string => {
  // Use consistent key across all analytics systems
  const key = '1v1bro_visitor_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = `v_${generateId()}`
    localStorage.setItem(key, id)
  }
  return id
}

const getDeviceType = (): string => {
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

// Check if running on localhost - skip analytics for local testing
const isLocalhost = (): boolean => {
  const hostname = window.location.hostname
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    window.location.origin.includes('localhost:5173')
  )
}

// Non-blocking POST to analytics
const trackAsync = async (eventName: string, data: Record<string, unknown>) => {
  if (isLocalhost()) return
  
  try {
    await fetch(`${API_BASE}/analytics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: getSessionId(),
        event_name: eventName,
        page: window.location.pathname,
        metadata: {
          visitor_id: getVisitorId(),
          device_type: getDeviceType(),
          timestamp: new Date().toISOString(),
          ...data,
        },
      }),
    })
  } catch {
    // Silent fail - analytics should never break the app
  }
}

// ============================================
// Main Hook
// ============================================

export interface UseGameAnalyticsOptions {
  gameMode: GameMode
  isGuest?: boolean
  category?: string
  mapId?: string
}

export function useGameAnalytics(options: UseGameAnalyticsOptions) {
  const { gameMode, isGuest = false, category, mapId } = options
  
  const gameSessionId = useRef<string | null>(null)
  const gameStartTime = useRef<number | null>(null)
  const killCount = useRef(0)
  const deathCount = useRef(0)
  const questionsAnswered = useRef(0)
  const questionsCorrect = useRef(0)
  const roundsPlayed = useRef(0)
  const hasTrackedStart = useRef(false)
  const hasTrackedEnd = useRef(false)

  // Reset tracking state
  const resetTracking = useCallback(() => {
    gameSessionId.current = `game_${generateId()}`
    gameStartTime.current = null
    killCount.current = 0
    deathCount.current = 0
    questionsAnswered.current = 0
    questionsCorrect.current = 0
    roundsPlayed.current = 0
    hasTrackedStart.current = false
    hasTrackedEnd.current = false
  }, [])

  // Initialize on mount
  useEffect(() => {
    resetTracking()
  }, [resetTracking])

  // ============================================
  // Game Session Tracking
  // ============================================

  const trackGameStart = useCallback(() => {
    if (hasTrackedStart.current) return
    hasTrackedStart.current = true
    
    gameStartTime.current = Date.now()
    
    const data: GameSessionData = {
      game_mode: gameMode,
      category,
      map_id: mapId,
      is_guest: isGuest,
      device_type: getDeviceType(),
    }
    
    trackAsync('game_session_start', {
      game_session_id: gameSessionId.current,
      ...data,
    })
  }, [gameMode, category, mapId, isGuest])

  const trackGameComplete = useCallback((
    outcome: GameOutcome,
    localScore: number,
    opponentScore: number
  ) => {
    if (hasTrackedEnd.current) return
    hasTrackedEnd.current = true
    
    const duration = gameStartTime.current 
      ? Math.round((Date.now() - gameStartTime.current) / 1000)
      : 0
    
    const data: GameCompleteData = {
      outcome,
      duration_seconds: duration,
      local_score: localScore,
      opponent_score: opponentScore,
      kills: killCount.current,
      deaths: deathCount.current,
      questions_answered: questionsAnswered.current,
      questions_correct: questionsCorrect.current,
      rounds_played: roundsPlayed.current,
    }
    
    trackAsync('game_session_complete', {
      game_session_id: gameSessionId.current,
      game_mode: gameMode,
      category,
      map_id: mapId,
      is_guest: isGuest,
      ...data,
    })
  }, [gameMode, category, mapId, isGuest])

  const trackGameAbandon = useCallback(() => {
    if (hasTrackedEnd.current) return
    hasTrackedEnd.current = true
    
    const duration = gameStartTime.current 
      ? Math.round((Date.now() - gameStartTime.current) / 1000)
      : 0
    
    trackAsync('game_session_abandon', {
      game_session_id: gameSessionId.current,
      game_mode: gameMode,
      category,
      map_id: mapId,
      is_guest: isGuest,
      duration_seconds: duration,
      kills: killCount.current,
      deaths: deathCount.current,
      questions_answered: questionsAnswered.current,
      rounds_played: roundsPlayed.current,
    })
  }, [gameMode, category, mapId, isGuest])

  // Track abandon on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasTrackedStart.current && !hasTrackedEnd.current) {
        trackGameAbandon()
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [trackGameAbandon])

  // ============================================
  // In-Game Event Tracking
  // ============================================

  const trackKill = useCallback(() => {
    killCount.current++
    trackAsync('game_kill', {
      game_session_id: gameSessionId.current,
      game_mode: gameMode,
      total_kills: killCount.current,
    })
  }, [gameMode])

  const trackDeath = useCallback(() => {
    deathCount.current++
    trackAsync('game_death', {
      game_session_id: gameSessionId.current,
      game_mode: gameMode,
      total_deaths: deathCount.current,
    })
  }, [gameMode])

  const trackQuestionAnswered = useCallback((correct: boolean, timeToAnswer?: number) => {
    questionsAnswered.current++
    if (correct) questionsCorrect.current++
    
    trackAsync('game_question_answered', {
      game_session_id: gameSessionId.current,
      game_mode: gameMode,
      correct,
      time_to_answer_ms: timeToAnswer,
      total_answered: questionsAnswered.current,
      total_correct: questionsCorrect.current,
      accuracy: questionsAnswered.current > 0 
        ? Math.round((questionsCorrect.current / questionsAnswered.current) * 100)
        : 0,
    })
  }, [gameMode])

  const trackRoundComplete = useCallback((roundWon: boolean) => {
    roundsPlayed.current++
    trackAsync('game_round_complete', {
      game_session_id: gameSessionId.current,
      game_mode: gameMode,
      round_won: roundWon,
      round_number: roundsPlayed.current,
    })
  }, [gameMode])

  // ============================================
  // Tutorial Tracking
  // ============================================

  const trackTutorialStep = useCallback((step: string, completed: boolean, timeSpentMs: number, skipped: boolean = false) => {
    const data: TutorialData = {
      step,
      completed,
      time_spent_ms: timeSpentMs,
      skipped,
    }
    
    trackAsync('tutorial_step', {
      game_mode: gameMode,
      is_guest: isGuest,
      ...data,
    })
  }, [gameMode, isGuest])

  const trackTutorialComplete = useCallback((totalTimeMs: number, skipped: boolean = false) => {
    trackAsync('tutorial_complete', {
      game_mode: gameMode,
      is_guest: isGuest,
      total_time_ms: totalTimeMs,
      skipped,
    })
  }, [gameMode, isGuest])

  const trackTutorialDismissed = useCallback((dontShowAgain: boolean) => {
    trackAsync('tutorial_dismissed', {
      game_mode: gameMode,
      is_guest: isGuest,
      dont_show_again: dontShowAgain,
    })
  }, [gameMode, isGuest])

  // ============================================
  // Category/Map Selection Tracking
  // ============================================

  const trackCategorySelected = useCallback((categorySlug: string) => {
    trackAsync('category_selected', {
      game_mode: gameMode,
      is_guest: isGuest,
      category: categorySlug,
    })
  }, [gameMode, isGuest])

  const trackMapSelected = useCallback((selectedMapId: string) => {
    trackAsync('map_selected', {
      game_mode: gameMode,
      is_guest: isGuest,
      map_id: selectedMapId,
    })
  }, [gameMode, isGuest])

  // ============================================
  // Matchmaking Tracking
  // ============================================

  const trackMatchmakingStart = useCallback(() => {
    trackAsync('matchmaking_start', {
      game_mode: gameMode,
      category,
      map_id: mapId,
    })
  }, [gameMode, category, mapId])

  const trackMatchmakingComplete = useCallback((waitTimeMs: number, found: boolean) => {
    trackAsync('matchmaking_complete', {
      game_mode: gameMode,
      category,
      map_id: mapId,
      wait_time_ms: waitTimeMs,
      match_found: found,
    })
  }, [gameMode, category, mapId])

  const trackMatchmakingCancel = useCallback((waitTimeMs: number) => {
    trackAsync('matchmaking_cancel', {
      game_mode: gameMode,
      category,
      map_id: mapId,
      wait_time_ms: waitTimeMs,
    })
  }, [gameMode, category, mapId])

  return {
    // Session tracking
    trackGameStart,
    trackGameComplete,
    trackGameAbandon,
    resetTracking,
    
    // In-game events
    trackKill,
    trackDeath,
    trackQuestionAnswered,
    trackRoundComplete,
    
    // Tutorial
    trackTutorialStep,
    trackTutorialComplete,
    trackTutorialDismissed,
    
    // Selection
    trackCategorySelected,
    trackMapSelected,
    
    // Matchmaking
    trackMatchmakingStart,
    trackMatchmakingComplete,
    trackMatchmakingCancel,
    
    // Current stats (for debugging)
    getStats: () => ({
      kills: killCount.current,
      deaths: deathCount.current,
      questionsAnswered: questionsAnswered.current,
      questionsCorrect: questionsCorrect.current,
      roundsPlayed: roundsPlayed.current,
    }),
  }
}
