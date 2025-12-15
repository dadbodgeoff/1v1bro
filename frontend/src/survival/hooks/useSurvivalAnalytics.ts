/**
 * useSurvivalAnalytics - Enterprise-grade analytics for Survival Mode
 * 
 * Tracks:
 * - Session lifecycle (start, end, duration)
 * - Run metrics (distance, score, combos, deaths)
 * - Input patterns (for game feel tuning)
 * - Performance metrics (FPS, frame drops)
 * - Funnel events (for conversion analysis)
 * - Combo analytics (for scoring balance)
 */

import { useCallback, useRef, useEffect } from 'react'
// import { useAuthStore } from '@/stores/authStore' // Reserved for future authenticated tracking
import { API_BASE } from '@/utils/constants'

// ============================================
// Types
// ============================================

export interface RunAnalytics {
  distance: number
  score: number
  durationSeconds: number
  seed?: number
  maxSpeed?: number
  avgSpeed?: number
  maxCombo?: number
  totalCombos?: number
  obstaclesCleared: number
  nearMisses: number
  perfectDodges: number
  laneChanges: number
  jumps: number
  slides: number
  deathObstacleType?: string
  deathPositionX?: number
  deathPositionZ?: number
  deathLane?: number
  deathDuringCombo?: boolean
  deathComboCount?: number
  timeSinceLastInputMs?: number
  difficultyAtDeath?: number
  speedAtDeath?: number
  patternAtDeath?: string
  avgFps?: number
  minFps?: number
  frameDrops?: number
  inputLatencyAvgMs?: number
}

export interface InputAnalytics {
  totalInputs: number
  inputsPerSecond?: number
  jumpCount: number
  slideCount: number
  laneLeftCount: number
  laneRightCount: number
  avgReactionTimeMs?: number
  minReactionTimeMs?: number
  maxReactionTimeMs?: number
  doubleTapCount: number
  inputSpamCount: number
  bufferedInputCount: number
  coyoteJumps: number
  bufferedJumps: number
}

export interface ComboAnalytics {
  comboCount: number
  multiplier: number
  scoreEarned: number
  durationMs: number
  startDistance?: number
  endDistance?: number
  obstaclesInCombo: number
  nearMissesInCombo: number
  endedByDeath?: boolean
  endedByTimeout?: boolean
  endedByHit?: boolean
}

export type FunnelEvent = 
  | 'page_visit'
  | 'game_load'
  | 'first_run_start'
  | 'first_run_complete'
  | 'second_run_start'
  | 'reached_100m'
  | 'reached_500m'
  | 'reached_1000m'
  | 'submitted_score'
  | 'viewed_leaderboard'

export interface TriviaAnalytics {
  questionId?: string
  category: string
  difficulty?: string
  answerGiven?: string
  correct: boolean
  timeToAnswerMs?: number
  timedOut?: boolean
  distanceAtQuestion?: number
  speedAtQuestion?: number
  streakBefore?: number
}

export interface MilestoneAnalytics {
  milestoneType: 'distance' | 'personal_best' | 'rank_change' | 'achievement'
  milestoneValue?: number
  previousValue?: number
  oldRank?: number
  newRank?: number
  achievementId?: string
  achievementName?: string
  metadata?: Record<string, unknown>
}

export interface ShopAnalytics {
  eventType: 'view' | 'item_view' | 'preview' | 'purchase_start' | 'purchase_complete' | 'purchase_failed'
  itemId?: string
  itemType?: string
  itemRarity?: string
  price?: number
  currency?: string
  errorType?: string
}

export interface LeaderboardAnalytics {
  eventType: 'view' | 'scroll' | 'player_click' | 'filter_change' | 'refresh'
  userRank?: number
  maxRankViewed?: number
  targetUserId?: string
  filterType?: string
  filterValue?: string
}

export interface BattlePassAnalytics {
  eventType: 'view' | 'level_up' | 'reward_claim' | 'purchase' | 'tier_skip'
  currentLevel?: number
  newLevel?: number
  xpEarned?: number
  rewardType?: string
  rewardId?: string
  tiersSkipped?: number
  cost?: number
}

export interface AuthAnalytics {
  eventType: 'login_success' | 'login_failure' | 'logout' | 'signup_complete' | 'password_reset'
  method?: string
  errorType?: string
}

// ============================================
// Helpers
// ============================================

const generateId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

const getVisitorId = (): string => {
  const key = 'survival_visitor_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = `sv_${generateId()}`
    localStorage.setItem(key, id)
  }
  return id
}

const getSessionId = (): string => {
  const key = 'survival_session_id'
  let id = sessionStorage.getItem(key)
  if (!id) {
    id = `ss_${generateId()}`
    sessionStorage.setItem(key, id)
  }
  return id
}

const getDeviceType = (): string => {
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

const getBrowser = (): string => {
  const ua = navigator.userAgent
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Edg')) return 'Edge'
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Safari')) return 'Safari'
  return 'Other'
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

// Non-blocking POST
const trackAsync = async (endpoint: string, data: Record<string, unknown>): Promise<string | null> => {
  try {
    const response = await fetch(`${API_BASE}/analytics/survival${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await response.json()
    return result?.data?.id || null
  } catch {
    // Silent fail - analytics should never break the game
    return null
  }
}

// ============================================
// Main Hook
// ============================================

export interface UseSurvivalAnalyticsOptions {
  enabled?: boolean
}

export function useSurvivalAnalytics(options: UseSurvivalAnalyticsOptions = {}) {
  const { enabled = true } = options
  
  // Disable analytics on localhost
  const isEnabled = enabled && !isLocalhost()
  
  // User ID for authenticated tracking (optional) - reserved for future use
  // const _user = useAuthStore(state => state.user)
  const sessionId = useRef(getSessionId())
  const visitorId = useRef(getVisitorId())
  const sessionStartTime = useRef(Date.now())
  const runCount = useRef(0)
  const totalPlaytime = useRef(0)
  const longestDistance = useRef(0)
  const highestScore = useRef(0)
  const highestCombo = useRef(0)
  const currentRunId = useRef<string | null>(null)
  const currentRunStartTime = useRef<number>(0)
  
  // Input tracking for current run
  const inputCounts = useRef({
    total: 0,
    jumps: 0,
    slides: 0,
    laneLeft: 0,
    laneRight: 0,
    doubleTaps: 0,
    spam: 0,
    buffered: 0,
    coyoteJumps: 0,
    bufferedJumps: 0,
  })
  const reactionTimes = useRef<number[]>([])
  const lastInputTime = useRef<number>(0)
  
  // Performance tracking
  const fpsReadings = useRef<number[]>([])
  const frameDrops = useRef(0)

  // ============================================
  // Session Tracking
  // ============================================

  const trackSessionStart = useCallback(() => {
    if (!isEnabled) return

    sessionStartTime.current = Date.now()
    runCount.current = 0
    totalPlaytime.current = 0
    longestDistance.current = 0
    highestScore.current = 0
    highestCombo.current = 0

    trackAsync('/track/session-start', {
      session_id: sessionId.current,
      visitor_id: visitorId.current,
      device_type: getDeviceType(),
      browser: getBrowser(),
    })

    // Track funnel event
    trackAsync('/track/funnel', {
      session_id: sessionId.current,
      visitor_id: visitorId.current,
      event_type: 'game_load',
    })
  }, [isEnabled])

  const trackSessionEnd = useCallback(() => {
    if (!isEnabled) return

    const avgFps = fpsReadings.current.length > 0
      ? fpsReadings.current.reduce((a, b) => a + b, 0) / fpsReadings.current.length
      : undefined
    const minFps = fpsReadings.current.length > 0
      ? Math.min(...fpsReadings.current)
      : undefined

    // Calculate performance grade
    let grade = 'A'
    if (avgFps !== undefined) {
      if (avgFps < 30) grade = 'F'
      else if (avgFps < 45) grade = 'D'
      else if (avgFps < 55) grade = 'C'
      else if (avgFps < 58) grade = 'B'
    }

    trackAsync('/track/session-end', {
      session_id: sessionId.current,
      total_runs: runCount.current,
      total_playtime_seconds: totalPlaytime.current,
      longest_run_distance: longestDistance.current,
      highest_score: highestScore.current,
      highest_combo: highestCombo.current,
      avg_fps: avgFps,
      min_fps: minFps,
      performance_grade: grade,
    })
  }, [isEnabled])

  // Track session end on page unload
  useEffect(() => {
    if (!isEnabled) return

    const handleBeforeUnload = () => trackSessionEnd()
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      trackSessionEnd()
    }
  }, [isEnabled, trackSessionEnd])

  // ============================================
  // Run Tracking
  // ============================================

  const trackRunStart = useCallback(() => {
    if (!isEnabled) return

    currentRunStartTime.current = Date.now()
    currentRunId.current = `run_${generateId()}`
    
    // Reset input tracking
    inputCounts.current = {
      total: 0,
      jumps: 0,
      slides: 0,
      laneLeft: 0,
      laneRight: 0,
      doubleTaps: 0,
      spam: 0,
      buffered: 0,
      coyoteJumps: 0,
      bufferedJumps: 0,
    }
    reactionTimes.current = []
    lastInputTime.current = 0
    fpsReadings.current = []
    frameDrops.current = 0

    // Track funnel events
    runCount.current++
    if (runCount.current === 1) {
      trackAsync('/track/funnel', {
        session_id: sessionId.current,
        visitor_id: visitorId.current,
        event_type: 'first_run_start',
      })
    } else if (runCount.current === 2) {
      trackAsync('/track/funnel', {
        session_id: sessionId.current,
        visitor_id: visitorId.current,
        event_type: 'second_run_start',
      })
    }
  }, [isEnabled])

  const trackRunEnd = useCallback(async (analytics: RunAnalytics): Promise<string | null> => {
    if (!isEnabled) return null

    const runDuration = (Date.now() - currentRunStartTime.current) / 1000
    totalPlaytime.current += runDuration

    // Update session bests
    if (analytics.distance > longestDistance.current) {
      longestDistance.current = analytics.distance
    }
    if (analytics.score > highestScore.current) {
      highestScore.current = analytics.score
    }
    if (analytics.maxCombo && analytics.maxCombo > highestCombo.current) {
      highestCombo.current = analytics.maxCombo
    }

    // Calculate FPS stats
    const avgFps = fpsReadings.current.length > 0
      ? fpsReadings.current.reduce((a, b) => a + b, 0) / fpsReadings.current.length
      : undefined
    const minFps = fpsReadings.current.length > 0
      ? Math.min(...fpsReadings.current)
      : undefined

    const runId = await trackAsync('/track/run', {
      session_id: sessionId.current,
      visitor_id: visitorId.current,
      run_id: currentRunId.current,
      distance: analytics.distance,
      score: analytics.score,
      duration_seconds: analytics.durationSeconds,
      seed: analytics.seed,
      max_speed: analytics.maxSpeed,
      avg_speed: analytics.avgSpeed,
      max_combo: analytics.maxCombo,
      total_combos: analytics.totalCombos,
      obstacles_cleared: analytics.obstaclesCleared,
      near_misses: analytics.nearMisses,
      perfect_dodges: analytics.perfectDodges,
      lane_changes: analytics.laneChanges,
      jumps: analytics.jumps,
      slides: analytics.slides,
      death_obstacle_type: analytics.deathObstacleType,
      death_position_x: analytics.deathPositionX,
      death_position_z: analytics.deathPositionZ,
      death_lane: analytics.deathLane,
      death_during_combo: analytics.deathDuringCombo,
      death_combo_count: analytics.deathComboCount,
      time_since_last_input_ms: analytics.timeSinceLastInputMs,
      difficulty_at_death: analytics.difficultyAtDeath,
      speed_at_death: analytics.speedAtDeath,
      pattern_at_death: analytics.patternAtDeath,
      avg_fps: avgFps ?? analytics.avgFps,
      min_fps: minFps ?? analytics.minFps,
      frame_drops: frameDrops.current || analytics.frameDrops,
      input_latency_avg_ms: analytics.inputLatencyAvgMs,
    })

    // Track funnel for first run complete
    if (runCount.current === 1) {
      trackAsync('/track/funnel', {
        session_id: sessionId.current,
        visitor_id: visitorId.current,
        event_type: 'first_run_complete',
      })
    }

    return runId
  }, [isEnabled])

  // ============================================
  // Input Tracking
  // ============================================

  const trackInput = useCallback((
    inputType: 'jump' | 'slide' | 'lane_left' | 'lane_right',
    options?: {
      isBuffered?: boolean
      isCoyote?: boolean
      reactionTimeMs?: number
    }
  ) => {
    if (!isEnabled) return

    const now = Date.now()
    inputCounts.current.total++

    switch (inputType) {
      case 'jump':
        inputCounts.current.jumps++
        if (options?.isCoyote) inputCounts.current.coyoteJumps++
        if (options?.isBuffered) inputCounts.current.bufferedJumps++
        break
      case 'slide':
        inputCounts.current.slides++
        break
      case 'lane_left':
        inputCounts.current.laneLeft++
        break
      case 'lane_right':
        inputCounts.current.laneRight++
        break
    }

    if (options?.isBuffered) {
      inputCounts.current.buffered++
    }

    // Detect double taps (same input within 200ms)
    if (lastInputTime.current && now - lastInputTime.current < 200) {
      inputCounts.current.doubleTaps++
    }

    // Detect spam (5+ inputs within 500ms)
    if (lastInputTime.current && now - lastInputTime.current < 100) {
      inputCounts.current.spam++
    }

    // Track reaction time
    if (options?.reactionTimeMs !== undefined) {
      reactionTimes.current.push(options.reactionTimeMs)
    }

    lastInputTime.current = now
  }, [isEnabled])

  const trackInputAnalytics = useCallback((runId: string) => {
    if (!isEnabled || !runId) return

    const runDuration = (Date.now() - currentRunStartTime.current) / 1000
    const inputsPerSecond = runDuration > 0 
      ? inputCounts.current.total / runDuration 
      : 0

    const reactions = reactionTimes.current
    const avgReaction = reactions.length > 0
      ? reactions.reduce((a, b) => a + b, 0) / reactions.length
      : undefined
    const minReaction = reactions.length > 0 ? Math.min(...reactions) : undefined
    const maxReaction = reactions.length > 0 ? Math.max(...reactions) : undefined

    trackAsync('/track/inputs', {
      run_id: runId,
      total_inputs: inputCounts.current.total,
      inputs_per_second: inputsPerSecond,
      jump_count: inputCounts.current.jumps,
      slide_count: inputCounts.current.slides,
      lane_left_count: inputCounts.current.laneLeft,
      lane_right_count: inputCounts.current.laneRight,
      avg_reaction_time_ms: avgReaction,
      min_reaction_time_ms: minReaction,
      max_reaction_time_ms: maxReaction,
      double_tap_count: inputCounts.current.doubleTaps,
      input_spam_count: inputCounts.current.spam,
      buffered_input_count: inputCounts.current.buffered,
      coyote_jumps: inputCounts.current.coyoteJumps,
      buffered_jumps: inputCounts.current.bufferedJumps,
    })
  }, [isEnabled])

  // ============================================
  // Combo Tracking
  // ============================================

  const trackCombo = useCallback((analytics: ComboAnalytics) => {
    if (!isEnabled || !currentRunId.current) return

    // Only track significant combos (5+)
    if (analytics.comboCount < 5) return

    trackAsync('/track/combo', {
      run_id: currentRunId.current,
      combo_count: analytics.comboCount,
      multiplier: analytics.multiplier,
      score_earned: analytics.scoreEarned,
      duration_ms: analytics.durationMs,
      start_distance: analytics.startDistance,
      end_distance: analytics.endDistance,
      obstacles_in_combo: analytics.obstaclesInCombo,
      near_misses_in_combo: analytics.nearMissesInCombo,
      ended_by_death: analytics.endedByDeath,
      ended_by_timeout: analytics.endedByTimeout,
      ended_by_hit: analytics.endedByHit,
    })
  }, [isEnabled])

  // ============================================
  // Performance Tracking
  // ============================================

  const trackFps = useCallback((fps: number) => {
    if (!isEnabled) return
    fpsReadings.current.push(fps)
    
    // Detect frame drops (FPS below 30)
    if (fps < 30) {
      frameDrops.current++
    }
  }, [isEnabled])

  // ============================================
  // Funnel Tracking
  // ============================================

  const trackFunnelEvent = useCallback((event: FunnelEvent, distance?: number) => {
    if (!isEnabled) return

    trackAsync('/track/funnel', {
      session_id: sessionId.current,
      visitor_id: visitorId.current,
      event_type: event,
      distance,
    })
  }, [isEnabled])

  // ============================================
  // Trivia Tracking
  // ============================================

  const trackTrivia = useCallback((analytics: TriviaAnalytics) => {
    if (!isEnabled) return

    trackAsync('/track/trivia', {
      session_id: sessionId.current,
      visitor_id: visitorId.current,
      run_id: currentRunId.current,
      question_id: analytics.questionId,
      category: analytics.category,
      difficulty: analytics.difficulty,
      answer_given: analytics.answerGiven,
      correct: analytics.correct,
      time_to_answer_ms: analytics.timeToAnswerMs,
      timed_out: analytics.timedOut,
      distance_at_question: analytics.distanceAtQuestion,
      speed_at_question: analytics.speedAtQuestion,
      streak_before: analytics.streakBefore,
    })
  }, [isEnabled])

  // ============================================
  // Milestone Tracking
  // ============================================

  const trackMilestone = useCallback((analytics: MilestoneAnalytics) => {
    if (!isEnabled) return

    trackAsync('/track/milestone', {
      session_id: sessionId.current,
      visitor_id: visitorId.current,
      run_id: currentRunId.current,
      milestone_type: analytics.milestoneType,
      milestone_value: analytics.milestoneValue,
      previous_value: analytics.previousValue,
      old_rank: analytics.oldRank,
      new_rank: analytics.newRank,
      achievement_id: analytics.achievementId,
      achievement_name: analytics.achievementName,
      metadata: analytics.metadata,
    })
  }, [isEnabled])

  const trackPersonalBest = useCallback((distance: number, previousBest: number) => {
    trackMilestone({
      milestoneType: 'personal_best',
      milestoneValue: distance,
      previousValue: previousBest,
    })
  }, [trackMilestone])

  const trackRankChange = useCallback((oldRank: number, newRank: number) => {
    trackMilestone({
      milestoneType: 'rank_change',
      oldRank,
      newRank,
    })
  }, [trackMilestone])

  const trackAchievement = useCallback((achievementId: string, achievementName: string) => {
    trackMilestone({
      milestoneType: 'achievement',
      achievementId,
      achievementName,
    })
  }, [trackMilestone])

  // ============================================
  // Shop Tracking
  // ============================================

  const trackShopEvent = useCallback((analytics: ShopAnalytics) => {
    if (!isEnabled) return

    trackAsync('/track/shop', {
      session_id: sessionId.current,
      visitor_id: visitorId.current,
      event_type: analytics.eventType,
      item_id: analytics.itemId,
      item_type: analytics.itemType,
      item_rarity: analytics.itemRarity,
      price: analytics.price,
      currency: analytics.currency,
      error_type: analytics.errorType,
    })
  }, [isEnabled])

  // ============================================
  // Leaderboard Tracking
  // ============================================

  const trackLeaderboardEvent = useCallback((analytics: LeaderboardAnalytics) => {
    if (!isEnabled) return

    trackAsync('/track/leaderboard', {
      session_id: sessionId.current,
      visitor_id: visitorId.current,
      event_type: analytics.eventType,
      user_rank: analytics.userRank,
      max_rank_viewed: analytics.maxRankViewed,
      target_user_id: analytics.targetUserId,
      filter_type: analytics.filterType,
      filter_value: analytics.filterValue,
    })
  }, [isEnabled])

  // ============================================
  // Battle Pass Tracking
  // ============================================

  const trackBattlePassEvent = useCallback((analytics: BattlePassAnalytics) => {
    if (!isEnabled) return

    trackAsync('/track/battlepass', {
      session_id: sessionId.current,
      event_type: analytics.eventType,
      current_level: analytics.currentLevel,
      new_level: analytics.newLevel,
      xp_earned: analytics.xpEarned,
      reward_type: analytics.rewardType,
      reward_id: analytics.rewardId,
      tiers_skipped: analytics.tiersSkipped,
      cost: analytics.cost,
    })
  }, [isEnabled])

  // ============================================
  // Auth Tracking
  // ============================================

  const trackAuthEvent = useCallback((analytics: AuthAnalytics) => {
    if (!isEnabled) return

    trackAsync('/track/auth', {
      session_id: sessionId.current,
      visitor_id: visitorId.current,
      event_type: analytics.eventType,
      method: analytics.method,
      error_type: analytics.errorType,
      device_type: getDeviceType(),
      browser: getBrowser(),
    })
  }, [isEnabled])

  // ============================================
  // Return API
  // ============================================

  return {
    // Session
    sessionId: sessionId.current,
    visitorId: visitorId.current,
    trackSessionStart,
    trackSessionEnd,
    
    // Runs
    trackRunStart,
    trackRunEnd,
    getCurrentRunId: () => currentRunId.current,
    
    // Inputs
    trackInput,
    trackInputAnalytics,
    
    // Combos
    trackCombo,
    
    // Performance
    trackFps,
    
    // Funnel
    trackFunnelEvent,
    
    // Trivia
    trackTrivia,
    
    // Milestones
    trackMilestone,
    trackPersonalBest,
    trackRankChange,
    trackAchievement,
    
    // Shop
    trackShopEvent,
    
    // Leaderboard
    trackLeaderboardEvent,
    
    // Battle Pass
    trackBattlePassEvent,
    
    // Auth
    trackAuthEvent,
    
    // Stats
    getSessionStats: () => ({
      runCount: runCount.current,
      totalPlaytime: totalPlaytime.current,
      longestDistance: longestDistance.current,
      highestScore: highestScore.current,
      highestCombo: highestCombo.current,
    }),
  }
}
