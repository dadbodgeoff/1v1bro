/**
 * useSurvivalGame - React hook for Survival Mode
 * Manages engine lifecycle and exposes game state to React components
 * 
 * Enterprise features:
 * - Loading progress tracking
 * - Subsystem readiness monitoring
 * - Smart countdown integration
 * - Mobile optimization (fullscreen, orientation lock, wake lock)
 * 
 * STATE MACHINE CONTEXT:
 * This is 1 of 4 state machines that control game readiness. See docs/STATE_MACHINE_AUDIT.md
 * 
 * Related state machines:
 * - LoadingOrchestrator: Asset loading stages (loading-critical/ready/running)
 * - GameStateManager: Game phase (ready/running/paused/gameover)
 * - TransitionSystem: Visual transitions (countdown/death/respawn)
 * 
 * Key integration points:
 * - isLoading: Set false after engine.initialize() completes
 * - isReadyToStart: Derived from engine.isReadyToStart() (LoadingOrchestrator.isReadyForCountdown())
 * - getStateDebug(): Returns unified view of all 4 state machines for debugging
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { SurvivalEngine } from '../engine/SurvivalEngine'
import type { SurvivalGameState, SurvivalCallbacks } from '../types/survival'
import type { PerformanceMetrics } from '../engine/PerformanceMonitor'
import type { MemoryStats } from '../debug/MemoryMonitor'
import type { TransitionSystem } from '../effects/TransitionSystem'
import type { LoadingProgress } from '../core/LoadingOrchestrator'
import type { MilestoneEvent } from '../systems/MilestoneSystem'
import type { UnlockedAchievement } from '../systems/AchievementSystem'
import { getSoundManager } from '../audio'
import { useMobileOptimization } from './useMobileOptimization'
import { useAuthStore } from '@/stores/authStore'

/**
 * Runner skin configuration for survival mode
 * Contains URLs to the 3D model files for each animation state
 */
export interface RunnerSkinConfig {
  run: string   // URL to run animation GLB
  jump: string  // URL to jump animation GLB
  down: string  // URL to slide/down animation GLB
}

interface UseSurvivalGameOptions {
  onKnowledgeGate?: (gateId: string) => Promise<boolean>
  onGameOver?: (score: number, distance: number) => void
  ghostData?: string  // Serialized ghost recording to play back
  runnerSkin?: RunnerSkinConfig  // Custom runner skin URLs (from equipped cosmetic)
}

interface UseSurvivalGameReturn {
  containerRef: React.RefObject<HTMLDivElement>
  engine: SurvivalEngine | null
  gameState: SurvivalGameState | null
  performanceMetrics: PerformanceMetrics | null
  transitionSystem: TransitionSystem | null
  loadingProgress: LoadingProgress | null
  combo: number
  multiplier: number
  isLoading: boolean
  isReadyToStart: boolean
  error: string | null
  start: () => void
  pause: () => void
  resume: () => void
  reset: () => void
  quickRestart: () => void
  setMuted: (muted: boolean) => void
  isMuted: boolean
  loadGhost: (data: string) => void
  loadPersonalBestGhost: () => Promise<boolean>
  isGhostActive: boolean
  // Quiz integration
  loseLife: () => void
  addScore: (points: number) => void
  setTriviaStats: (correct: number, answered: number) => void
  // Symphony monitoring
  getSymphonyState: () => unknown
  getOrchestratorDebug: () => object | null
  getObstacleRenderStats: () => { totalObstacles: number; instancedObstacles: number; clonedObstacles: number; drawCalls: number; poolUtilization: Record<string, string> } | null
  // State machine debugging (see docs/STATE_MACHINE_AUDIT.md)
  getStateDebug: () => { loading: { stage: string; criticalReady: boolean; fullyReady: boolean }; game: { phase: string; isRunning: boolean }; transition: { phase: string; isPaused: boolean; isTransitioning: boolean }; canStart: boolean; diagnosis: string } | null
  // Milestone & Achievement system
  currentMilestone: MilestoneEvent | null
  milestoneProgress: number
  nextMilestone: number
  currentAchievement: UnlockedAchievement | null
  dismissAchievement: () => void
  // Memory monitoring
  getMemoryStats: () => MemoryStats | null
  logMemoryBreakdown: () => void
  // Renderer control
  resize: () => void
}

export function useSurvivalGame(
  options: UseSurvivalGameOptions = {}
): UseSurvivalGameReturn {
  const containerRef = useRef<HTMLDivElement>(null!)
  const engineRef = useRef<SurvivalEngine | null>(null)
  
  // Mobile optimization
  const { 
    isMobile, 
    isTablet, 
    mobileConfig,
    requestFullscreen, 
    requestWakeLock, 
    releaseWakeLock,
  } = useMobileOptimization()
  
  // Engine state for external access (triggers re-render when engine is ready)
  const [engine, setEngine] = useState<SurvivalEngine | null>(null)
  const [gameState, setGameState] = useState<SurvivalGameState | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)
  const [transitionSystem, setTransitionSystem] = useState<TransitionSystem | null>(null)
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress | null>(null)
  const [combo, setCombo] = useState(0)
  const [multiplier, setMultiplier] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isReadyToStart, setIsReadyToStart] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMutedState] = useState(false)
  const [isGhostActive, setIsGhostActive] = useState(false)
  const audioInitializedRef = useRef(false)
  const mobileSetupDoneRef = useRef(false)
  
  // Milestone & Achievement state
  const [currentMilestone, setCurrentMilestone] = useState<MilestoneEvent | null>(null)
  const [milestoneProgress, setMilestoneProgress] = useState(0)
  const [nextMilestone, setNextMilestone] = useState(500)
  const [currentAchievement, setCurrentAchievement] = useState<UnlockedAchievement | null>(null)

  // Global error handler for unhandled errors (iOS Safari crashes)
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('[useSurvivalGame] Unhandled error:', event.error)
      setError(`Unhandled error: ${event.message}`)
    }
    
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('[useSurvivalGame] Unhandled rejection:', event.reason)
      setError(`Unhandled rejection: ${event.reason}`)
    }
    
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)
    
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  // Initialize engine with loading progress callback
  useEffect(() => {
    if (!containerRef.current) return

    // Only use callbacks for important events, NOT per-frame updates
    const callbacks: SurvivalCallbacks = {
      onLifeLost: (lives) => {
        setGameState(prev => prev ? { 
          ...prev, 
          player: { ...prev.player, lives } 
        } : null)
      },
      onGameOver: (score, distance) => {
        setGameState(prev => prev ? { ...prev, phase: 'gameover' } : null)
        options.onGameOver?.(score, distance)
      },
      onKnowledgeGate: options.onKnowledgeGate,
    }

    // Loading progress callback for enterprise loading screen
    const onLoadingProgress = (progress: LoadingProgress) => {
      setLoadingProgress(progress)
      if (progress.stage === 'ready' || progress.stage === 'running') {
        setIsReadyToStart(true)
      }
    }

    const engine = new SurvivalEngine(containerRef.current, callbacks, onLoadingProgress, options.runnerSkin)
    engineRef.current = engine

    // Initialize async
    engine.initialize()
      .then(() => {
        setGameState(engine.getState())
        setTransitionSystem(engine.getTransitionSystem())
        setEngine(engine) // Expose engine for external subsystems
        setIsLoading(false)
        setIsReadyToStart(engine.isReadyToStart())
        
        // Connect audio system to FeedbackSystem
        const feedbackSystem = engine.getFeedbackSystem()
        const soundManager = getSoundManager()
        
        // Subscribe to sound events
        feedbackSystem.onSound((data) => {
          soundManager.play(data)
        })
        
        // Start with fade-in transition
        engine.getTransitionSystem().startFadeIn()
      })
      .catch((err) => {
        setError(err.message || 'Failed to initialize game')
        setIsLoading(false)
      })

    // Cleanup
    return () => {
      engine.dispose()
      engineRef.current = null
      setEngine(null)
    }
  }, []) // Only run once on mount

  // Cleanup mobile features on unmount
  useEffect(() => {
    return () => {
      // Release wake lock when component unmounts
      releaseWakeLock()
    }
  }, [releaseWakeLock])

  // Update game state periodically - use requestAnimationFrame throttled to ~10fps
  // This decouples React rendering from the game loop
  useEffect(() => {
    if (!engineRef.current || isLoading) return

    let lastUpdate = 0
    let rafId: number
    
    const updateUI = (timestamp: number) => {
      // Throttle to ~10fps (100ms) to avoid React re-render overhead
      if (timestamp - lastUpdate >= 100) {
        lastUpdate = timestamp
        if (engineRef.current) {
          setGameState(engineRef.current.getState())
          setPerformanceMetrics(engineRef.current.getPerformanceMetrics())
          setCombo(engineRef.current.getCombo())
          setMultiplier(engineRef.current.getMultiplier())
          setIsGhostActive(engineRef.current.isGhostActive())
          
          // Update milestone state
          const milestoneSystem = engineRef.current.getMilestoneSystem()
          const state = engineRef.current.getState()
          setCurrentMilestone(milestoneSystem.getCurrentCelebration())
          setMilestoneProgress(milestoneSystem.getProgressToNext(state.distance))
          setNextMilestone(milestoneSystem.getNextMilestone())
          
          // Check for new achievements
          const achievementSystem = engineRef.current.getAchievementSystem()
          if (achievementSystem.hasPendingNotifications()) {
            const notification = achievementSystem.popNotification()
            if (notification) {
              setCurrentAchievement(notification)
            }
          }
        }
      }
      rafId = requestAnimationFrame(updateUI)
    }
    
    rafId = requestAnimationFrame(updateUI)

    return () => cancelAnimationFrame(rafId)
  }, [isLoading])

  // Initialize audio on first user interaction (browser autoplay policy)
  const initAudio = useCallback(async () => {
    if (audioInitializedRef.current) return
    audioInitializedRef.current = true
    
    const soundManager = getSoundManager()
    await soundManager.initialize()
    await soundManager.resume()
  }, [])

  // Setup mobile-specific features (fullscreen, wake lock, orientation)
  const setupMobile = useCallback(async () => {
    if (mobileSetupDoneRef.current) return
    mobileSetupDoneRef.current = true
    
    // Only apply on mobile/tablet devices
    if (!isMobile && !isTablet) return
    
    // Request fullscreen for immersive experience (if enabled in config)
    if (mobileConfig.enableFullscreen) {
      try {
        await requestFullscreen()
      } catch {
        // Fullscreen may be blocked - that's OK
      }
    }
    
    // Request wake lock to prevent screen sleep during gameplay
    if (mobileConfig.enableWakeLock) {
      try {
        await requestWakeLock()
      } catch {
        // Wake lock may not be supported - that's OK
      }
    }
    
    // Portrait is optimal for runner games - don't force landscape
    // Users can play in either orientation
  }, [isMobile, isTablet, mobileConfig, requestFullscreen, requestWakeLock])

  // Game controls
  const start = useCallback(async () => {
    try {
      await initAudio() // Initialize audio on first start
      await setupMobile() // Setup mobile features on first start
      engineRef.current?.start()
    } catch (err) {
      console.error('[useSurvivalGame] Start failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to start game')
    }
  }, [initAudio, setupMobile])

  const pause = useCallback(() => {
    engineRef.current?.pause()
  }, [])

  const resume = useCallback(() => {
    engineRef.current?.resume()
  }, [])

  const reset = useCallback(async () => {
    await initAudio() // Ensure audio is ready for new game
    engineRef.current?.reset()
    if (engineRef.current) {
      setGameState(engineRef.current.getState())
    }
  }, [initAudio])

  // Quick restart - reset and immediately start new run (preserves assets)
  const quickRestart = useCallback(async () => {
    await initAudio() // Ensure audio is ready
    await setupMobile() // Ensure mobile features are active
    engineRef.current?.quickRestart()
    if (engineRef.current) {
      setGameState(engineRef.current.getState())
    }
  }, [initAudio, setupMobile])

  // Mute control
  const setMuted = useCallback((muted: boolean) => {
    getSoundManager().setMuted(muted)
    setIsMutedState(muted)
  }, [])

  // Load ghost for playback
  const loadGhost = useCallback((data: string) => {
    engineRef.current?.loadGhost(data)
  }, [])

  // Quiz integration - lose a life
  const loseLife = useCallback(() => {
    engineRef.current?.loseLife()
  }, [])

  // Quiz integration - add score
  const addScore = useCallback((points: number) => {
    engineRef.current?.addScore(points)
  }, [])
  
  // Quiz integration - set trivia stats for XP calculation
  const setTriviaStats = useCallback((correct: number, answered: number) => {
    engineRef.current?.setTriviaStats(correct, answered)
  }, [])

  // Load ghost from options if provided
  useEffect(() => {
    if (options.ghostData && engineRef.current && !isLoading) {
      engineRef.current.loadGhost(options.ghostData)
    }
  }, [options.ghostData, isLoading])

  // Get auth token for API calls
  const { token } = useAuthStore()

  // Load personal best ghost automatically on game ready
  const loadPersonalBestGhost = useCallback(async () => {
    if (!engineRef.current || isLoading) return false
    
    try {
      const { survivalApi } = await import('../services/SurvivalApiService')
      // Set auth token before making API call
      survivalApi.setAuthToken(token)
      const pbData = await survivalApi.getPersonalBest()
      
      if (pbData?.ghost_data) {
        engineRef.current.loadGhost(pbData.ghost_data)
        return true
      }
      return false
    } catch {
      return false
    }
  }, [isLoading, token])

  // Symphony monitoring callbacks
  const getSymphonyState = useCallback(() => {
    const debug = engineRef.current?.getOrchestratorDebug()
    if (debug && typeof debug === 'object' && 'symphony' in debug) {
      const symphonyDebug = (debug as { symphony: { symphony?: unknown } }).symphony
      // The symphony state is nested: debug.symphony.symphony
      if (symphonyDebug && typeof symphonyDebug === 'object' && 'symphony' in symphonyDebug) {
        return symphonyDebug.symphony
      }
    }
    return null
  }, [])

  const getOrchestratorDebug = useCallback(() => {
    return engineRef.current?.getOrchestratorDebug() ?? null
  }, [])

  const getObstacleRenderStats = useCallback(() => {
    return engineRef.current?.getObstacleRenderStats() ?? null
  }, [])

  // State machine debugging (see docs/STATE_MACHINE_AUDIT.md)
  const getStateDebug = useCallback(() => {
    return engineRef.current?.getStateDebug() ?? null
  }, [])

  // Dismiss current achievement notification
  const dismissAchievement = useCallback(() => {
    setCurrentAchievement(null)
  }, [])

  return {
    containerRef,
    engine,
    gameState,
    performanceMetrics,
    transitionSystem,
    loadingProgress,
    combo,
    multiplier,
    isLoading,
    isReadyToStart,
    error,
    start,
    pause,
    resume,
    reset,
    quickRestart,
    setMuted,
    isMuted,
    loadGhost,
    loadPersonalBestGhost,
    isGhostActive,
    loseLife,
    addScore,
    setTriviaStats,
    getSymphonyState,
    getOrchestratorDebug,
    getObstacleRenderStats,
    getStateDebug,
    // Milestone & Achievement system
    currentMilestone,
    milestoneProgress,
    nextMilestone,
    currentAchievement,
    dismissAchievement,
    // Memory monitoring
    getMemoryStats: useCallback(() => engineRef.current?.getMemoryStats() ?? null, []),
    logMemoryBreakdown: useCallback(() => engineRef.current?.logMemoryBreakdown(), []),
    // Renderer control
    resize: useCallback(() => engineRef.current?.resize(), []),
  }
}
