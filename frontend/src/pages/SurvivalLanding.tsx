/**
 * SurvivalLanding - Arcade boot sequence into survival runner
 * 
 * Shows the CRT arcade boot sequence, then transitions directly
 * into the zen-garden survival runner for immediate gameplay.
 * No authentication required - guest experience.
 * 
 * @module pages/SurvivalLanding
 */

import { useEffect, useCallback, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useSurvivalGame } from '@/survival/hooks/useSurvivalGame'
import { useSurvivalAnalytics } from '@/survival/hooks/useSurvivalAnalytics'
import { useMobileDetection } from '@/survival/hooks/useMobileDetection'
import { SurvivalErrorBoundary } from '@/survival'
import {
  TransitionOverlay,
  useTransitionOverlay,
  SurvivalHUD,
  EnterpriseLoadingScreen,
  EnterpriseButton,
  ErrorDisplay,
  TRIVIA_PANEL_HEIGHT,
  PauseOverlay,
  GameOverOverlay,
  PerformanceOverlay,
  type GuestRunStats,
} from '@/survival/components'
import { useTriviaBillboards } from '@/survival/hooks/useTriviaBillboards'
import { leaderboardService } from '@/survival/services/LeaderboardService'
import { getSurvivalGuestSession, type SurvivalRunResult } from '@/survival/guest'
import type { TriviaStats } from '@/survival/hooks/useSurvivalTrivia'
import type { TriviaCategory } from '@/survival/world/TriviaQuestionProvider'
import { analytics } from '@/services/analytics'

// Arcade boot components
import { CRTMonitor } from '@/components/landing/arcade/CRTMonitor'
import { CRTEffects } from '@/components/landing/arcade/CRTEffects'
import { BootSequence } from '@/components/landing/arcade/BootSequence'
import { useBootSequence } from '@/components/landing/arcade/hooks/useBootSequence'
import { useCRTEffects } from '@/components/landing/arcade/hooks/useCRTEffects'
import { useArcadeSound } from '@/components/landing/arcade/hooks/useArcadeSound'
import { useReducedMotion } from '@/components/landing/arcade/hooks/useReducedMotion'
import '@/components/landing/arcade/styles/arcade.css'

// Default category for landing page (no picker needed)
const DEFAULT_CATEGORY: TriviaCategory = 'fortnite'

function SurvivalLandingContent() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const guestSession = useRef(getSurvivalGuestSession())
  const survivalAnalytics = useSurvivalAnalytics()
  const { isMobile, enableTriviaBillboards, isMobileBrowser } = useMobileDetection()
  const reducedMotion = useReducedMotion()
  
  // Boot sequence state
  const [bootComplete, setBootComplete] = useState(false)
  
  // Game state
  const [showGameOver, setShowGameOver] = useState(false)
  const [showReadyCard, setShowReadyCard] = useState(false) // Start false, show after boot
  const [lastRunStats, setLastRunStats] = useState<GuestRunStats | null>(null)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const maxComboRef = useRef(0)
  
  // Trivia stats ref
  const triviaStatsRef = useRef<TriviaStats>({
    questionsAnswered: 0,
    questionsCorrect: 0,
    maxStreak: 0,
    currentStreak: 0,
    triviaScore: 0,
  })
  
  // Mobile question pool
  const usedQuestionsRef = useRef<Set<string>>(new Set())

  // Sound effects
  const sound = useArcadeSound()

  // CRT effects configuration - wrap trackEvent to handle uninitialized state
  const safeTrackEvent = useCallback((event: string, payload?: Record<string, unknown>) => {
    try {
      analytics.trackEvent(event, payload)
    } catch {
      // Analytics not initialized yet, ignore
    }
  }, [])

  const { config: effectsConfig, isReducedMotion } = useCRTEffects({
    trackEvent: safeTrackEvent,
  })

  // Boot sequence
  const boot = useBootSequence({
    skipBoot: reducedMotion,
    onComplete: () => {
      setBootComplete(true)
      setShowReadyCard(true)
    },
    onPhaseChange: (phase) => {
      if (phase === 'powering-on') {
        sound.playStartupChime()
      } else if (phase === 'ready') {
        sound.playReadyFanfare?.()
      }
    },
    onLineComplete: () => {
      sound.playBootLine?.()
    },
    trackEvent: safeTrackEvent,
  })

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // Analytics tracking
  useEffect(() => {
    document.title = '1v1 Bro - Play Now'
    analytics.init()
    analytics.trackPageView('/')
    survivalAnalytics.trackSessionStart()
    
    return () => {
      document.title = '1v1 Bro'
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Leaderboard polling
  useEffect(() => {
    leaderboardService.startPolling()
    return () => leaderboardService.stopPolling()
  }, [])

  // Estimate rank
  const estimateRank = useCallback((distance: number) => {
    const data = leaderboardService.getLeaderboardData()
    if (!data || data.entries.length === 0) return { rank: null, total: 0 }

    let rank = 1
    for (const entry of data.entries) {
      if (distance >= entry.bestDistance) break
      rank++
    }

    if (rank > data.entries.length && data.totalPlayers > data.entries.length) {
      const lowestVisible = data.entries[data.entries.length - 1]?.bestDistance || 0
      if (distance < lowestVisible) {
        const ratio = distance / lowestVisible
        rank = Math.floor(data.entries.length + (data.totalPlayers - data.entries.length) * (1 - ratio))
      }
    }

    return { rank, total: data.totalPlayers }
  }, [])

  // Game over handler
  const handleGameOver = useCallback((score: number, distance: number) => {
    const stats = triviaStatsRef.current
    const runResult: SurvivalRunResult = {
      distance,
      score,
      maxCombo: maxComboRef.current,
      durationMs: 0,
      livesLost: 3,
      questionsAnswered: stats.questionsAnswered,
      questionsCorrect: stats.questionsCorrect,
      triviaStreak: stats.maxStreak,
      triviaScore: stats.triviaScore,
    }

    const { isNewPB, previewXp } = guestSession.current.recordRunResult(runResult)
    survivalAnalytics.trackRunEnd({
      distance, score, durationSeconds: 0, maxCombo: maxComboRef.current,
      obstaclesCleared: 0, nearMisses: 0, perfectDodges: 0, laneChanges: 0, jumps: 0, slides: 0,
      themeId: 'zen-garden',  // Track the theme being played
    })
    
    if (isNewPB) survivalAnalytics.trackPersonalBest(distance, guestSession.current.getSession().bestDistance)
    if (distance >= 100) survivalAnalytics.trackFunnelEvent('reached_100m', distance)
    if (distance >= 500) survivalAnalytics.trackFunnelEvent('reached_500m', distance)
    if (distance >= 1000) survivalAnalytics.trackFunnelEvent('reached_1000m', distance)
    
    const { rank, total } = estimateRank(distance)
    
    setLastRunStats({
      distance, score, maxCombo: maxComboRef.current, isNewPB, previewXp,
      estimatedRank: rank, totalPlayers: total, triviaStats: { ...stats },
    })
    setShowGameOver(true)
    
    const session = guestSession.current.getSession()
    if (session.totalRuns >= 3 || (rank !== null && rank <= 100)) {
      setShowSavePrompt(true)
    }
  }, [estimateRank, survivalAnalytics])

  // Game hook
  const {
    containerRef, engine, gameState, performanceMetrics, transitionSystem,
    loadingProgress, combo, multiplier, isLoading, error,
    start, pause, resume, reset, setMuted, isMuted,
    currentMilestone, milestoneProgress, nextMilestone,
    currentAchievement, dismissAchievement, quickRestart,
    loseLife, addScore, setTriviaStats, getMemoryStats, resize,
  } = useSurvivalGame({ onGameOver: handleGameOver })

  const phase = gameState?.phase ?? 'loading'
  const overlayState = useTransitionOverlay(transitionSystem)
  
  // TRIVIA DISABLED for landing page - pure obstacle runner experience
  const TRIVIA_ENABLED = false
  
  // Calculate if mobile trivia should show (disabled for landing)
  const showMobileTrivia = false // TRIVIA_ENABLED && isMobile && !enableTriviaBillboards && phase === 'running'
  
  // Trigger resize when trivia panel shows/hides
  useEffect(() => {
    const timer = setTimeout(() => {
      resize?.()
    }, 50)
    return () => clearTimeout(timer)
  }, [showMobileTrivia, resize])

  // Update trivia stats helper
  const updateTriviaStats = useCallback((correct: boolean, points: number = 0) => {
    triviaStatsRef.current.questionsAnswered += 1
    
    if (correct) {
      triviaStatsRef.current.questionsCorrect += 1
      triviaStatsRef.current.currentStreak += 1
      triviaStatsRef.current.triviaScore += points
      if (triviaStatsRef.current.currentStreak > triviaStatsRef.current.maxStreak) {
        triviaStatsRef.current.maxStreak = triviaStatsRef.current.currentStreak
      }
    } else {
      triviaStatsRef.current.currentStreak = 0
    }
    
    setTriviaStats?.(triviaStatsRef.current.questionsCorrect, triviaStatsRef.current.questionsAnswered)
  }, [setTriviaStats])

  // Desktop billboards - DISABLED for landing page
  const billboards = useTriviaBillboards(engine, {
    category: DEFAULT_CATEGORY,
    enabled: false, // TRIVIA_ENABLED && enableTriviaBillboards && bootComplete,
    onCorrectAnswer: (points) => {
      updateTriviaStats(true, points)
      addScore?.(points)
    },
    onWrongAnswer: () => {
      updateTriviaStats(false)
      loseLife?.()
    },
    onTimeout: () => {
      updateTriviaStats(false)
      loseLife?.()
    },
  })

  // Start/stop billboards based on game phase - DISABLED
  useEffect(() => {
    if (!TRIVIA_ENABLED || !enableTriviaBillboards) return
    
    if (phase === 'running' && !billboards.isActive) {
      billboards.start()
    } else if ((phase === 'paused' || phase === 'gameover' || phase === 'ready') && billboards.isActive) {
      billboards.stop()
    }
  }, [phase, billboards, enableTriviaBillboards])

  // Track max combo
  useEffect(() => {
    if (combo > maxComboRef.current) maxComboRef.current = combo
  }, [combo])

  // Reset handler
  const resetTracking = useCallback(() => {
    triviaStatsRef.current = {
      questionsAnswered: 0,
      questionsCorrect: 0,
      maxStreak: 0,
      currentStreak: 0,
      triviaScore: 0,
    }
    maxComboRef.current = 0
    usedQuestionsRef.current.clear()
  }, [])

  const handleReset = useCallback(() => {
    setShowGameOver(false)
    setShowReadyCard(true)
    setLastRunStats(null)
    setShowSavePrompt(false)
    resetTracking()
    reset()
  }, [reset, resetTracking])

  const handleQuickRestart = useCallback(() => {
    setShowGameOver(false)
    setShowReadyCard(false)
    setLastRunStats(null)
    setShowSavePrompt(false)
    resetTracking()
    quickRestart()
  }, [quickRestart, resetTracking])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyR' && (phase === 'gameover' || phase === 'paused')) {
        e.preventDefault()
        handleQuickRestart()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, handleQuickRestart])

  const handleStart = () => {
    sound.playClickBlip()
    setShowGameOver(false)
    setShowReadyCard(false)
    resetTracking()
    survivalAnalytics.trackRunStart()
    start()
  }

  const handleBackToHome = () => navigate('/')
  const handleCreateAccount = () => {
    sessionStorage.setItem('survival_signup_source', 'landing')
    navigate('/register')
  }
  const handleViewLeaderboard = () => navigate('/survival/leaderboard')
  const handleLogin = () => navigate('/login')

  if (isAuthenticated) return null

  // Use dvh on mobile browsers
  const containerStyle = isMobileBrowser 
    ? { height: '100dvh', minHeight: '-webkit-fill-available' } 
    : { height: '100vh' }

  return (
    <div 
      className="fixed inset-x-0 top-0 bg-[#09090b] text-white overflow-hidden"
      style={containerStyle}
    >
      {/* Arcade Boot Sequence Overlay */}
      <AnimatePresence>
        {!bootComplete && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-50"
          >
            <div className="arcade-landing">
              {/* Background layers */}
              <div className="arcade-room-bg" aria-hidden="true" />
              <div className="arcade-wall" aria-hidden="true" />
              <div className="arcade-floor" aria-hidden="true" />
              <div className="arcade-spotlight" aria-hidden="true" />

              {!reducedMotion && (
                <>
                  <div className="arcade-silhouettes" aria-hidden="true">
                    <div className="arcade-silhouette arcade-silhouette--left" />
                    <div className="arcade-silhouette arcade-silhouette--right" />
                  </div>
                  <div className="arcade-haze" aria-hidden="true" />
                  <div className="arcade-neon-accents" aria-hidden="true">
                    <div className="neon-line neon-line--top" />
                    <div className="neon-line neon-line--left" />
                    <div className="neon-line neon-line--right" />
                  </div>
                  <div className="arcade-particles" aria-hidden="true">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="arcade-particle" />
                    ))}
                  </div>
                </>
              )}

              <CRTMonitor isPoweredOn={boot.phase !== 'off'}>
                <CRTEffects config={effectsConfig} reducedMotion={isReducedMotion} />
                <BootSequence
                  onComplete={() => {}}
                  phase={boot.phase}
                  currentLine={boot.currentLine}
                  progress={boot.progress}
                  onSkip={boot.skip}
                />
              </CRTMonitor>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Content - renders behind boot sequence, visible after */}
      <div className="flex flex-col h-full">
        {/* Loading */}
        {isLoading && loadingProgress && bootComplete && (
          <EnterpriseLoadingScreen progress={loadingProgress} onRetry={() => window.location.reload()} />
        )}

        {/* Error */}
        {error && (
          <div className="absolute top-4 left-4 z-10">
            <ErrorDisplay error={error} onBack={handleBackToHome} backLabel="Reload" />
          </div>
        )}

        {/* Game Canvas Container */}
        <div 
          ref={containerRef} 
          className="relative flex-1 overflow-hidden"
        />

        {/* HUD */}
        {!isLoading && !error && gameState && bootComplete && (
          <div 
            className="absolute top-0 left-0 right-0 pointer-events-none overflow-hidden"
            style={{ bottom: showMobileTrivia ? `calc(${TRIVIA_PANEL_HEIGHT}px + env(safe-area-inset-bottom, 0px))` : '0' }}
          >
            <div className="relative w-full h-full pointer-events-auto">
              <SurvivalHUD 
                gameState={gameState} combo={combo} multiplier={multiplier} isGhostActive={false}
                currentMilestone={currentMilestone} milestoneProgress={milestoneProgress}
                nextMilestone={nextMilestone} currentAchievement={currentAchievement}
                onAchievementDismiss={dismissAchievement}
              />
            </div>
          </div>
        )}

        {/* Trivia Stats (desktop) - DISABLED for landing page */}
        {/* {TRIVIA_ENABLED && enableTriviaBillboards && !isLoading && !error && gameState && bootComplete && (phase === 'running' || phase === 'paused') && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
            <TriviaStatsBar
              timeRemaining={billboards.stats?.timeRemaining}
              totalScore={billboards.totalScore}
              correctCount={billboards.correctCount}
              wrongCount={billboards.wrongCount}
              streak={billboards.streak}
            />
          </div>
        )} */}
        
        {/* Performance Stats */}
        {!isLoading && performanceMetrics && bootComplete && (
          <div 
            className="absolute left-2 z-10" 
            style={{ bottom: showMobileTrivia ? `calc(${TRIVIA_PANEL_HEIGHT}px + env(safe-area-inset-bottom, 0px) + 8px)` : '8px' }}
          >
            <PerformanceOverlay metrics={performanceMetrics} memoryStats={getMemoryStats()} isMobile={isMobile} />
          </div>
        )}

        {/* Action Buttons */}
        {!isLoading && gameState && bootComplete && phase !== 'ready' && (
          <div 
            className="absolute right-4 z-10 flex gap-2" 
            style={{ bottom: showMobileTrivia ? `calc(${TRIVIA_PANEL_HEIGHT}px + env(safe-area-inset-bottom, 0px) + 8px)` : '16px' }}
          >
            {phase === 'running' && (
              <EnterpriseButton onClick={pause} variant="secondary" size="sm">⏸ Pause</EnterpriseButton>
            )}
            {phase === 'paused' && (
              <>
                <EnterpriseButton onClick={resume} variant="primary" size="sm">▶ Resume</EnterpriseButton>
                <EnterpriseButton onClick={handleReset} variant="secondary" size="sm">Reset</EnterpriseButton>
              </>
            )}
          </div>
        )}

        {/* Ready Overlay - Custom for landing */}
        {phase === 'ready' && !isLoading && showReadyCard && bootComplete && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center px-6 max-w-md"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                🏃 Survival Run
              </h1>
              <p className="text-neutral-400 mb-8">
                Dodge obstacles and see how far you can go!
              </p>
              
              <div className="flex flex-col gap-3">
                <EnterpriseButton 
                  onClick={handleStart} 
                  variant="primary" 
                  size="lg"
                >
                  ▶ START
                </EnterpriseButton>
                
                <div className="flex gap-2">
                  <EnterpriseButton 
                    onClick={handleLogin} 
                    variant="secondary" 
                    size="sm"
                  >
                    Login
                  </EnterpriseButton>
                  <EnterpriseButton 
                    onClick={handleCreateAccount} 
                    variant="secondary" 
                    size="sm"
                  >
                    Sign Up
                  </EnterpriseButton>
                </div>
              </div>
              
              {/* Sound toggle */}
              <button
                onClick={() => setMuted(!isMuted)}
                className="mt-6 text-neutral-500 hover:text-white text-sm transition-colors"
              >
                {isMuted ? '🔇 Sound Off' : '🔊 Sound On'}
              </button>
            </motion.div>
          </div>
        )}

        {/* Mobile Trivia Panel - DISABLED for landing page */}
        {/* {showMobileTrivia && bootComplete && (
          <div className="flex-shrink-0 z-20">
            <TriviaPanel
              isActive={phase === 'running'}
              getNextQuestion={getNextMobileQuestion}
              timeLimit={30}
              onAnswer={handleMobileTriviaAnswer}
              onTimeout={handleMobileTriviaTimeout}
            />
          </div>
        )} */}
        
        {/* Pause Overlay */}
        {phase === 'paused' && !showGameOver && bootComplete && (
          <PauseOverlay onResume={resume} onRestart={handleQuickRestart} onQuit={handleBackToHome} />
        )}

        {/* Game Over Overlay */}
        {phase === 'gameover' && showGameOver && lastRunStats && bootComplete && (
          <GameOverOverlay
            mode="guest"
            stats={lastRunStats}
            sessionStats={guestSession.current.getSession()}
            showSavePrompt={showSavePrompt}
            onPlayAgain={handleQuickRestart}
            onViewLeaderboard={handleViewLeaderboard}
            onCreateAccount={handleCreateAccount}
            onBack={handleBackToHome}
            backLabel="Back"
          />
        )}
        
        <TransitionOverlay {...overlayState} />
      </div>
    </div>
  )
}

export default function SurvivalLanding() {
  return (
    <SurvivalErrorBoundary>
      <SurvivalLandingContent />
    </SurvivalErrorBoundary>
  )
}
