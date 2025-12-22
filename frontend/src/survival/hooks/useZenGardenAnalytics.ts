/**
 * useZenGardenAnalytics - Focused analytics for Zen Garden survival map
 * 
 * Tracks the key metrics you care about:
 * - Landing page engagement (clicks out, starts game)
 * - Game completion and death causes
 * - Player retention (play again, sign up)
 * - Session depth (runs per session, returning players)
 */

import { useCallback, useRef, useEffect } from 'react'
import { API_BASE } from '@/utils/constants'

// ============================================
// Types
// ============================================

export interface ZenGardenRunData {
  distance: number
  score: number
  durationMs: number
  deathCause: 'highBarrier' | 'lowBarrier' | 'laneBarrier' | 'spikes' | 'quit' | 'unknown'
  deathLane?: number
  maxCombo?: number
}

export interface ZenGardenSession {
  visitorId: string
  sessionId: string
  isReturningPlayer: boolean
  totalRuns: number
  runs: ZenGardenRunData[]
  signedUp: boolean
  startedAt: number
}

// ============================================
// Helpers
// ============================================

const generateId = (): string => 
  `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

const getVisitorId = (): string => {
  const key = 'zen_garden_visitor'
  let id = localStorage.getItem(key)
  if (!id) {
    id = `zg_${generateId()}`
    localStorage.setItem(key, id)
  }
  return id
}

const getSessionId = (): string => {
  const key = 'zen_garden_session'
  let id = sessionStorage.getItem(key)
  if (!id) {
    id = `zgs_${generateId()}`
    sessionStorage.setItem(key, id)
  }
  return id
}

const getVisitCount = (): number => {
  const key = 'zen_garden_visits'
  const count = parseInt(localStorage.getItem(key) || '0', 10)
  localStorage.setItem(key, String(count + 1))
  return count
}

const isLocalhost = (): boolean => {
  const hostname = window.location.hostname
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

// Fire and forget POST
const track = (endpoint: string, data: Record<string, unknown>): void => {
  if (isLocalhost()) {
    console.log(`[ZenGardenAnalytics] ${endpoint}`, data)
    return
  }
  
  fetch(`${API_BASE}/analytics/survival${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(() => {}) // Silent fail
}

// ============================================
// Main Hook
// ============================================

export function useZenGardenAnalytics() {
  const visitorId = useRef(getVisitorId())
  const sessionId = useRef(getSessionId())
  const isReturning = useRef(getVisitCount() > 0)
  const sessionStart = useRef(Date.now())
  const runs = useRef<ZenGardenRunData[]>([])
  const currentRunStart = useRef<number>(0)
  const hasSignedUp = useRef(false)
  const hasTrackedLanding = useRef(false)

  // ============================================
  // Landing Page Events
  // ============================================

  /** Call when landing page loads */
  const trackLandingView = useCallback(() => {
    if (hasTrackedLanding.current) return
    hasTrackedLanding.current = true
    
    track('/track/zen-garden/landing', {
      visitor_id: visitorId.current,
      session_id: sessionId.current,
      is_returning: isReturning.current,
      referrer: document.referrer || null,
      device: window.innerWidth < 768 ? 'mobile' : 'desktop',
    })
  }, [])

  /** Call when user clicks away from landing (back button, external link) */
  const trackLandingExit = useCallback((exitType: 'back' | 'external' | 'close') => {
    track('/track/zen-garden/exit', {
      visitor_id: visitorId.current,
      session_id: sessionId.current,
      exit_type: exitType,
      time_on_page_ms: Date.now() - sessionStart.current,
      started_game: runs.current.length > 0,
    })
  }, [])

  // ============================================
  // Game Events
  // ============================================

  /** Call when player clicks START */
  const trackGameStart = useCallback(() => {
    currentRunStart.current = Date.now()
    
    track('/track/zen-garden/start', {
      visitor_id: visitorId.current,
      session_id: sessionId.current,
      run_number: runs.current.length + 1,
      is_returning: isReturning.current,
      is_replay: runs.current.length > 0,
    })
  }, [])

  /** Call when player dies or quits */
  const trackGameEnd = useCallback((data: Omit<ZenGardenRunData, 'durationMs'>) => {
    const runData: ZenGardenRunData = {
      ...data,
      durationMs: Date.now() - currentRunStart.current,
    }
    runs.current.push(runData)
    
    track('/track/zen-garden/end', {
      visitor_id: visitorId.current,
      session_id: sessionId.current,
      run_number: runs.current.length,
      distance: runData.distance,
      score: runData.score,
      duration_ms: runData.durationMs,
      death_cause: runData.deathCause,
      death_lane: runData.deathLane,
      max_combo: runData.maxCombo,
      is_returning: isReturning.current,
    })
  }, [])

  /** Call when player clicks Play Again */
  const trackPlayAgain = useCallback(() => {
    track('/track/zen-garden/replay', {
      visitor_id: visitorId.current,
      session_id: sessionId.current,
      previous_runs: runs.current.length,
      best_distance: Math.max(...runs.current.map(r => r.distance), 0),
      total_time_ms: Date.now() - sessionStart.current,
    })
  }, [])

  // ============================================
  // Conversion Events
  // ============================================

  /** Call when user clicks Sign Up */
  const trackSignUpClick = useCallback(() => {
    track('/track/zen-garden/signup-click', {
      visitor_id: visitorId.current,
      session_id: sessionId.current,
      runs_before_signup: runs.current.length,
      best_distance: Math.max(...runs.current.map(r => r.distance), 0),
      time_to_signup_ms: Date.now() - sessionStart.current,
    })
  }, [])

  /** Call when user completes sign up */
  const trackSignUpComplete = useCallback(() => {
    hasSignedUp.current = true
    
    track('/track/zen-garden/signup-complete', {
      visitor_id: visitorId.current,
      session_id: sessionId.current,
      runs_before_signup: runs.current.length,
      best_distance: Math.max(...runs.current.map(r => r.distance), 0),
    })
  }, [])

  /** Call when user clicks Login */
  const trackLoginClick = useCallback(() => {
    track('/track/zen-garden/login-click', {
      visitor_id: visitorId.current,
      session_id: sessionId.current,
      runs_before_login: runs.current.length,
    })
  }, [])

  // ============================================
  // Session End (on page unload)
  // ============================================

  useEffect(() => {
    const handleUnload = () => {
      // Use sendBeacon for reliable delivery on page close
      const data = {
        visitor_id: visitorId.current,
        session_id: sessionId.current,
        total_runs: runs.current.length,
        total_time_ms: Date.now() - sessionStart.current,
        best_distance: Math.max(...runs.current.map(r => r.distance), 0),
        signed_up: hasSignedUp.current,
        is_returning: isReturning.current,
        runs: runs.current.map(r => ({
          distance: r.distance,
          death_cause: r.deathCause,
          duration_ms: r.durationMs,
        })),
      }
      
      if (!isLocalhost()) {
        navigator.sendBeacon(
          `${API_BASE}/analytics/survival/track/zen-garden/session-end`,
          JSON.stringify(data)
        )
      } else {
        console.log('[ZenGardenAnalytics] session-end', data)
      }
    }

    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [])

  // ============================================
  // Getters
  // ============================================

  const getSessionStats = useCallback(() => ({
    visitorId: visitorId.current,
    sessionId: sessionId.current,
    isReturningPlayer: isReturning.current,
    totalRuns: runs.current.length,
    runs: [...runs.current],
    signedUp: hasSignedUp.current,
    startedAt: sessionStart.current,
  }), [])

  const getBestDistance = useCallback(() => 
    Math.max(...runs.current.map(r => r.distance), 0)
  , [])

  const getRunCount = useCallback(() => runs.current.length, [])

  // ============================================
  // Return API
  // ============================================

  return {
    // Landing
    trackLandingView,
    trackLandingExit,
    
    // Game
    trackGameStart,
    trackGameEnd,
    trackPlayAgain,
    
    // Conversion
    trackSignUpClick,
    trackSignUpComplete,
    trackLoginClick,
    
    // Getters
    getSessionStats,
    getBestDistance,
    getRunCount,
    
    // IDs (for debugging)
    visitorId: visitorId.current,
    sessionId: sessionId.current,
    isReturningPlayer: isReturning.current,
  }
}
