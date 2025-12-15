/**
 * useSurvivalGameWithAnalytics - Enhanced survival game hook with enterprise analytics
 * 
 * Wraps useSurvivalGame and automatically tracks:
 * - Session lifecycle
 * - Run metrics
 * - Input patterns
 * - Performance metrics
 * - Combo analytics
 * - Funnel events
 */

import { useEffect, useRef, useCallback } from 'react'
import { useSurvivalGame } from './useSurvivalGame'
import { useSurvivalAnalytics, type RunAnalytics, type ComboAnalytics } from './useSurvivalAnalytics'
import { survivalApi } from '../services/SurvivalApiService'
import { useAuthStore } from '@/stores/authStore'

interface UseSurvivalGameWithAnalyticsOptions {
  onKnowledgeGate?: (gateId: string) => Promise<boolean>
  onGameOver?: (score: number, distance: number) => void
  ghostData?: string
  analyticsEnabled?: boolean
  runnerSkin?: { run: string; jump: string; down: string }  // Custom runner skin URLs
}

export function useSurvivalGameWithAnalytics(options: UseSurvivalGameWithAnalyticsOptions = {}) {
  const { analyticsEnabled = true, ...gameOptions } = options
  
  // Get auth token and set it for API calls
  const { token } = useAuthStore()
  
  // Set auth token for survival API service
  useEffect(() => {
    survivalApi.setAuthToken(token)
  }, [token])
  
  // Analytics hook
  const analytics = useSurvivalAnalytics({ enabled: analyticsEnabled })
  
  // Track run state
  const runStarted = useRef(false)
  const lastCombo = useRef(0)
  const comboStartDistance = useRef(0)
  const comboStartTime = useRef(0)
  const obstaclesInCombo = useRef(0)
  const nearMissesInCombo = useRef(0)
  const obstaclesCleared = useRef(0)
  const inputStats = useRef({
    jumps: 0,
    slides: 0,
    laneChanges: 0,
  })
  const lastPhase = useRef<string>('loading')
  const fpsTrackingInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  
  // Wrap onGameOver to track analytics
  const handleGameOver = useCallback((score: number, distance: number) => {
    options.onGameOver?.(score, distance)
  }, [options])
  
  // Get the base game hook
  const game = useSurvivalGame({
    ...gameOptions,
    onGameOver: handleGameOver,
  })
  
  const { gameState, performanceMetrics, combo, multiplier } = game
  
  // Track session start on mount
  useEffect(() => {
    analytics.trackSessionStart()
    
    return () => {
      analytics.trackSessionEnd()
    }
  }, [analytics])
  
  // Track phase changes
  useEffect(() => {
    if (!gameState) return
    
    const phase = gameState.phase
    const prevPhase = lastPhase.current
    lastPhase.current = phase
    
    // Run started
    if (phase === 'running' && prevPhase !== 'running' && !runStarted.current) {
      runStarted.current = true
      analytics.trackRunStart()
      
      // Start FPS tracking
      if (fpsTrackingInterval.current) {
        clearInterval(fpsTrackingInterval.current)
      }
      fpsTrackingInterval.current = setInterval(() => {
        if (performanceMetrics?.fps) {
          analytics.trackFps(performanceMetrics.fps)
        }
      }, 1000)
    }
    
    // Game over - track run end
    if (phase === 'gameover' && prevPhase !== 'gameover' && runStarted.current) {
      runStarted.current = false
      
      // Stop FPS tracking
      if (fpsTrackingInterval.current) {
        clearInterval(fpsTrackingInterval.current)
        fpsTrackingInterval.current = null
      }
      
      // Build run analytics
      const runAnalytics: RunAnalytics = {
        distance: gameState.distance,
        score: gameState.score,
        durationSeconds: gameState.distance / 10, // Approximate based on speed
        maxCombo: lastCombo.current,
        obstaclesCleared: obstaclesCleared.current,
        nearMisses: 0, // Would need to track this
        perfectDodges: 0,
        laneChanges: inputStats.current.laneChanges,
        jumps: inputStats.current.jumps,
        slides: inputStats.current.slides,
        avgFps: performanceMetrics?.fps,
        minFps: performanceMetrics?.fps ? performanceMetrics.fps - 10 : undefined, // Approximate
      }
      
      // Track run end
      analytics.trackRunEnd(runAnalytics).then((runId) => {
        if (runId) {
          analytics.trackInputAnalytics(runId)
        }
      })
      
      // Reset tracking state
      lastCombo.current = 0
      comboStartDistance.current = 0
      comboStartTime.current = 0
      obstaclesInCombo.current = 0
      nearMissesInCombo.current = 0
      obstaclesCleared.current = 0
      inputStats.current = { jumps: 0, slides: 0, laneChanges: 0 }
    }
  }, [gameState?.phase, gameState?.distance, gameState?.score, performanceMetrics, analytics])
  
  // Track combo changes
  useEffect(() => {
    if (!gameState || gameState.phase !== 'running') return
    
    const currentCombo = combo
    const prevCombo = lastCombo.current
    
    // Combo started
    if (currentCombo > 0 && prevCombo === 0) {
      comboStartDistance.current = gameState.distance
      comboStartTime.current = Date.now()
      obstaclesInCombo.current = 0
      nearMissesInCombo.current = 0
    }
    
    // Combo increased
    if (currentCombo > prevCombo) {
      obstaclesInCombo.current++
    }
    
    // Combo ended (and was significant)
    if (currentCombo === 0 && prevCombo >= 5) {
      const comboAnalytics: ComboAnalytics = {
        comboCount: prevCombo,
        multiplier: multiplier,
        scoreEarned: prevCombo * 100 * multiplier, // Approximate
        durationMs: Date.now() - comboStartTime.current,
        startDistance: comboStartDistance.current,
        endDistance: gameState.distance,
        obstaclesInCombo: obstaclesInCombo.current,
        nearMissesInCombo: nearMissesInCombo.current,
        endedByTimeout: true, // Default assumption
      }
      
      analytics.trackCombo(comboAnalytics)
    }
    
    lastCombo.current = currentCombo
  }, [combo, multiplier, gameState, analytics])
  
  // Track distance milestones for funnel
  useEffect(() => {
    if (!gameState || gameState.phase !== 'running') return
    
    const distance = gameState.distance
    
    if (distance >= 100 && distance < 110) {
      analytics.trackFunnelEvent('reached_100m', distance)
    } else if (distance >= 500 && distance < 510) {
      analytics.trackFunnelEvent('reached_500m', distance)
    } else if (distance >= 1000 && distance < 1010) {
      analytics.trackFunnelEvent('reached_1000m', distance)
    }
  }, [gameState?.distance, gameState?.phase, analytics])
  
  // Enhanced start that tracks analytics
  const start = useCallback(() => {
    game.start()
  }, [game])
  
  // Enhanced reset that resets analytics tracking
  const reset = useCallback(() => {
    runStarted.current = false
    lastCombo.current = 0
    inputStats.current = { jumps: 0, slides: 0, laneChanges: 0 }
    game.reset()
  }, [game])

  // Quick restart - reset analytics and immediately start new run
  const quickRestart = useCallback(() => {
    // Reset analytics tracking for new run
    runStarted.current = false
    lastCombo.current = 0
    comboStartDistance.current = 0
    comboStartTime.current = 0
    obstaclesInCombo.current = 0
    nearMissesInCombo.current = 0
    obstaclesCleared.current = 0
    inputStats.current = { jumps: 0, slides: 0, laneChanges: 0 }
    
    // Quick restart the game (will trigger run start tracking via phase change)
    game.quickRestart()
  }, [game])
  
  // Input tracking helpers
  const trackJump = useCallback((options?: { isBuffered?: boolean; isCoyote?: boolean }) => {
    inputStats.current.jumps++
    analytics.trackInput('jump', options)
  }, [analytics])
  
  const trackSlide = useCallback(() => {
    inputStats.current.slides++
    analytics.trackInput('slide')
  }, [analytics])
  
  const trackLaneChange = useCallback((direction: 'left' | 'right') => {
    inputStats.current.laneChanges++
    analytics.trackInput(direction === 'left' ? 'lane_left' : 'lane_right')
  }, [analytics])
  
  // Trivia tracking
  const trackTriviaAnswer = useCallback((
    category: string,
    correct: boolean,
    options?: {
      questionId?: string
      difficulty?: string
      timeToAnswerMs?: number
      timedOut?: boolean
      streakBefore?: number
    }
  ) => {
    analytics.trackTrivia({
      category,
      correct,
      questionId: options?.questionId,
      difficulty: options?.difficulty,
      timeToAnswerMs: options?.timeToAnswerMs,
      timedOut: options?.timedOut,
      streakBefore: options?.streakBefore,
      distanceAtQuestion: gameState?.distance,
      speedAtQuestion: gameState?.speed,
    })
  }, [analytics, gameState?.distance, gameState?.speed])

  // Milestone tracking
  const trackPersonalBest = useCallback((distance: number, previousBest: number) => {
    analytics.trackPersonalBest(distance, previousBest)
  }, [analytics])

  const trackRankChange = useCallback((oldRank: number, newRank: number) => {
    analytics.trackRankChange(oldRank, newRank)
  }, [analytics])

  const trackAchievement = useCallback((achievementId: string, achievementName: string) => {
    analytics.trackAchievement(achievementId, achievementName)
  }, [analytics])

  return {
    ...game,
    start,
    reset,
    quickRestart,
    
    // Analytics-specific
    analytics: {
      trackJump,
      trackSlide,
      trackLaneChange,
      trackFunnelEvent: analytics.trackFunnelEvent,
      getSessionStats: analytics.getSessionStats,
      sessionId: analytics.sessionId,
      visitorId: analytics.visitorId,
      // Trivia
      trackTriviaAnswer,
      // Milestones
      trackPersonalBest,
      trackRankChange,
      trackAchievement,
      // Shop/Leaderboard/BattlePass
      trackShopEvent: analytics.trackShopEvent,
      trackLeaderboardEvent: analytics.trackLeaderboardEvent,
      trackBattlePassEvent: analytics.trackBattlePassEvent,
    },
  }
}
