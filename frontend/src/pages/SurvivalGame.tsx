/**
 * SurvivalGame - Authenticated Survival Mode Page
 * 
 * Full-featured survival runner for authenticated users with:
 * - Server-side run validation and submission
 * - Leaderboard tracking and rank display
 * - Ghost replay from personal best
 * - Achievement system integration
 * - Analytics tracking
 * - Trivia billboard integration
 * 
 * This is the production-ready version accessed from the dashboard.
 */

import { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useCosmeticsStore } from '@/stores/cosmeticsStore'
import { useSurvivalGameWithAnalytics, SurvivalErrorBoundary } from '@/survival'
import type { RunnerSkinConfig } from '@/survival'
import { survivalApi } from '@/survival/services/SurvivalApiService'
import { leaderboardService } from '@/survival/services/LeaderboardService'
import {
  TransitionOverlay,
  useTransitionOverlay,
  SurvivalHUD,
  SymphonyDebugOverlay,
  EnterpriseLoadingScreen,
  OverlayContainer,
  EnterpriseCard,
  EnterpriseTitle,
  StatBox,
  HighlightBox,
  EnterpriseButton,
  EnterpriseDivider,
  TriviaStatsBar,
  PlayerInfo,
  ErrorDisplay,
  TriviaOverlay,
  type TriviaQuestion,
} from '@/survival/components'
import { useTriviaBillboards } from '@/survival/hooks/useTriviaBillboards'
import { getRandomQuestions } from '@/data/fortnite-quiz-data'
import type { TriviaCategory } from '@/survival/world/TriviaQuestionProvider'
import { useLeaderboard } from '@/survival/hooks/useLeaderboard'
import { useMobileOptimization } from '@/survival/hooks/useMobileOptimization'
import type { PerformanceMetrics } from '@/survival/engine/PerformanceMonitor'
import type { MemoryStats } from '@/survival/debug/MemoryMonitor'

// Feature flags
const ENABLE_GHOST_REPLAY = true

function SurvivalGameContent() {
  const navigate = useNavigate()
  const { user, token, isAuthenticated } = useAuthStore()
  const { loadoutWithDetails, fetchLoadout } = useCosmeticsStore()
  const { leaderboard, refresh: refreshRank } = useLeaderboard({ autoStart: true })
  const { isTouch, deviceCapabilities } = useMobileOptimization()
  // Use multiple detection methods for reliable mobile detection
  // Check UA, touch support, and screen size as fallbacks
  const isMobileDevice = useMemo(() => {
    // Direct UA check (most reliable)
    const ua = navigator.userAgent.toLowerCase()
    const uaIsMobile = /iphone|ipad|ipod|android|mobile|webos|blackberry|opera mini|iemobile/.test(ua)
    // Touch check
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    // Screen size check (portrait phone)
    const isSmallScreen = window.innerWidth < 768
    // Combined: UA says mobile OR (has touch AND small screen)
    return uaIsMobile || deviceCapabilities.isMobile || isTouch || (hasTouch && isSmallScreen)
  }, [deviceCapabilities.isMobile, isTouch])
  const playerRank = leaderboard?.playerEntry
  const [showGameOver, setShowGameOver] = useState(false)
  const [showReadyCard, setShowReadyCard] = useState(true)
  const [lastRunStats, setLastRunStats] = useState<{
    distance: number
    score: number
    isNewPB: boolean
    newRank?: number
  } | null>(null)
  // Default trivia category - user selects from dashboard before entering
  const selectedCategory: TriviaCategory = 'fortnite'
  
  // Disable trivia billboards on mobile - too hard to interact with in 3D
  const enableTriviaBillboards = !isMobileDevice
  
  // Mobile trivia overlay state
  const [mobileTriviaQuestion, setMobileTriviaQuestion] = useState<TriviaQuestion | null>(null)
  const [isMobileTriviaOpen, setIsMobileTriviaOpen] = useState(false)
  const mobileTriviaIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const usedMobileQuestionsRef = useRef<Set<string>>(new Set())

  // Fetch loadout on mount to get equipped runner skin
  useEffect(() => {
    if (token) {
      fetchLoadout(token)
    }
  }, [token, fetchLoadout])

  // Get equipped runner skin config (if any)
  // Runner cosmetics should have model_url pointing to a base URL
  // with run/jump/down variants (e.g., base-run.glb, base-jump.glb, base-down.glb)
  const runnerSkin = useMemo((): RunnerSkinConfig | undefined => {
    const equippedRunner = loadoutWithDetails?.runner_equipped
    if (!equippedRunner?.model_url) {
      return undefined // Use default skin
    }
    
    // The model_url should be the base URL for the runner skin
    // We expect the skin to have run/jump/down variants
    const baseUrl = equippedRunner.model_url
    
    // Check if it's a single model URL or needs variant suffixes
    // Convention: if model_url ends with -run.glb, derive jump/down from it
    if (baseUrl.includes('-run')) {
      return {
        run: baseUrl,
        jump: baseUrl.replace('-run', '-jump'),
        down: baseUrl.replace('-run', '-down'),
      }
    }
    
    // Alternative: model_url is a base path, append suffixes
    const basePath = baseUrl.replace(/\.glb$/, '')
    return {
      run: `${basePath}-run.glb`,
      jump: `${basePath}-jump.glb`,
      down: `${basePath}-down.glb`,
    }
  }, [loadoutWithDetails?.runner_equipped])

  // Set auth token for API services
  useEffect(() => {
    if (token) {
      survivalApi.setAuthToken(token)
      leaderboardService.setAuthToken(token)
    }
  }, [token])

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/survival' } })
    }
  }, [isAuthenticated, navigate])

  // Track previous rank for change detection
  const previousRankRef = useRef<number | undefined>(playerRank?.rank)
  const previousBestRef = useRef<number | undefined>(playerRank?.bestDistance)

  const handleGameOver = useCallback(async (score: number, distance: number) => {
    console.log('[SurvivalGame] Game over! Score:', score, 'Distance:', distance)
    
    // Check if this is a new personal best
    const previousBest = previousBestRef.current ?? 0
    const isNewPB = distance > previousBest
    
    // Refresh rank after run submission (API submits automatically via engine)
    setTimeout(async () => {
      const oldRank = previousRankRef.current
      await refreshRank()
      const newRank = leaderboard?.playerEntry?.rank
      
      // Update refs for next run
      previousRankRef.current = newRank
      previousBestRef.current = Math.max(previousBest, distance)
      
      setLastRunStats({
        distance,
        score,
        isNewPB,
        newRank,
      })
      setShowGameOver(true)
      
      // Analytics tracking is handled by useSurvivalGameWithAnalytics
      // but we track PB and rank changes here since we have the context
      if (isNewPB && previousBest > 0) {
        console.log('[SurvivalGame] New PB! Previous:', previousBest, 'New:', distance)
      }
      if (oldRank && newRank && oldRank !== newRank) {
        console.log('[SurvivalGame] Rank changed! Old:', oldRank, 'New:', newRank)
      }
    }, 1000)
  }, [refreshRank, leaderboard?.playerEntry?.rank])

  const {
    containerRef,
    engine,
    gameState,
    performanceMetrics,
    transitionSystem,
    loadingProgress,
    combo,
    multiplier,
    isLoading,
    error,
    start,
    pause,
    resume,
    reset,
    setMuted,
    isMuted,
    loseLife,
    addScore,
    getSymphonyState,
    getOrchestratorDebug,
    getObstacleRenderStats,
    loadPersonalBestGhost,
    isGhostActive,
    currentMilestone,
    milestoneProgress,
    nextMilestone,
    currentAchievement,
    dismissAchievement,
    quickRestart,
    setTriviaStats,
    getMemoryStats,
    logMemoryBreakdown,
  } = useSurvivalGameWithAnalytics({
    onGameOver: handleGameOver,
    analyticsEnabled: true,
    runnerSkin, // Pass equipped runner skin (undefined = use default)
  })
  
  // Expose memory debug to console for dev testing
  useEffect(() => {
    // @ts-expect-error - exposing for dev console access
    window.logMemory = logMemoryBreakdown
    // @ts-expect-error - exposing for dev console access
    window.getMemory = getMemoryStats
    return () => {
      // @ts-expect-error - cleanup
      delete window.logMemory
      // @ts-expect-error - cleanup
      delete window.getMemory
    }
  }, [logMemoryBreakdown, getMemoryStats])

  // Track trivia stats for XP calculation
  const triviaStatsRef = useRef({ correct: 0, answered: 0 })
  
  // Trivia billboards - category is dynamic based on user selection
  const billboards = useTriviaBillboards(engine, {
    category: selectedCategory,
    enabled: enableTriviaBillboards,
    onCorrectAnswer: (points) => {
      console.log(`[Billboards] Correct! +${points}pts`)
      triviaStatsRef.current.correct += 1
      triviaStatsRef.current.answered += 1
      addScore?.(points)
      // Sync trivia stats to engine for XP calculation
      setTriviaStats?.(triviaStatsRef.current.correct, triviaStatsRef.current.answered)
    },
    onWrongAnswer: () => {
      console.log('[Billboards] Wrong answer, losing life')
      triviaStatsRef.current.answered += 1
      loseLife?.()
      // Sync trivia stats to engine for XP calculation
      setTriviaStats?.(triviaStatsRef.current.correct, triviaStatsRef.current.answered)
    },
    onTimeout: () => {
      console.log('[Billboards] Timeout, losing life')
      triviaStatsRef.current.answered += 1
      loseLife?.()
      // Sync trivia stats to engine for XP calculation
      setTriviaStats?.(triviaStatsRef.current.correct, triviaStatsRef.current.answered)
    },
  })
  
  const phase = gameState?.phase ?? 'loading'
  

  const overlayState = useTransitionOverlay(transitionSystem)

  // Billboard state sync
  const billboardsRef = useRef(billboards)
  billboardsRef.current = billboards

  useEffect(() => {
    if (!enableTriviaBillboards) return
    
    const bb = billboardsRef.current
    if (phase === 'running' && !bb.isActive) {
      bb.start()
    } else if ((phase === 'paused' || phase === 'gameover') && bb.isActive) {
      bb.stop()
    }
  }, [phase])
  
  // Mobile trivia: get next question
  const getNextMobileQuestion = useCallback((): TriviaQuestion | null => {
    const allQuestions = getRandomQuestions(50)
    const unusedQuestions = allQuestions.filter(q => !usedMobileQuestionsRef.current.has(q.id))
    
    if (unusedQuestions.length === 0) {
      usedMobileQuestionsRef.current.clear()
      if (allQuestions.length === 0) return null
    }
    
    const pool = unusedQuestions.length > 0 ? unusedQuestions : allQuestions
    const quizQ = pool[Math.floor(Math.random() * pool.length)]
    usedMobileQuestionsRef.current.add(quizQ.id)
    
    return {
      id: quizQ.id,
      question: quizQ.question,
      answers: quizQ.options,
      correctIndex: quizQ.correctAnswer,
      category: quizQ.category,
      difficulty: quizQ.difficulty === 'casual' ? 'easy' : quizQ.difficulty === 'moderate' ? 'medium' : 'hard',
    }
  }, [])
  
  // Mobile trivia: trigger question
  const triggerMobileTrivia = useCallback(() => {
    if (isMobileTriviaOpen || phase !== 'running') return
    
    const question = getNextMobileQuestion()
    if (question) {
      setMobileTriviaQuestion(question)
      setIsMobileTriviaOpen(true)
    }
  }, [isMobileTriviaOpen, phase, getNextMobileQuestion])
  
  // Mobile trivia: handle answer
  const handleMobileTriviaAnswer = useCallback((_questionId: string, _selectedIndex: number, isCorrect: boolean) => {
    triviaStatsRef.current.answered += 1
    if (isCorrect) {
      triviaStatsRef.current.correct += 1
      addScore?.(100)
    } else {
      loseLife?.()
    }
    // Sync trivia stats to engine for XP calculation
    setTriviaStats?.(triviaStatsRef.current.correct, triviaStatsRef.current.answered)
  }, [addScore, loseLife, setTriviaStats])
  
  // Mobile trivia: handle timeout
  const handleMobileTriviaTimeout = useCallback((_questionId: string) => {
    triviaStatsRef.current.answered += 1
    loseLife?.()
    // Sync trivia stats to engine for XP calculation
    setTriviaStats?.(triviaStatsRef.current.correct, triviaStatsRef.current.answered)
  }, [loseLife, setTriviaStats])
  
  // Mobile trivia: handle complete
  const handleMobileTriviaComplete = useCallback(() => {
    setIsMobileTriviaOpen(false)
    setMobileTriviaQuestion(null)
  }, [])
  
  // Mobile trivia: start/stop interval based on game phase
  useEffect(() => {
    if (enableTriviaBillboards || !isMobileDevice) return
    
    if (phase === 'running' && !isMobileTriviaOpen) {
      const initialDelay = setTimeout(() => {
        triggerMobileTrivia()
        
        mobileTriviaIntervalRef.current = setInterval(() => {
          triggerMobileTrivia()
        }, 20000 + Math.random() * 10000)
      }, 15000)
      
      return () => {
        clearTimeout(initialDelay)
        if (mobileTriviaIntervalRef.current) {
          clearInterval(mobileTriviaIntervalRef.current)
          mobileTriviaIntervalRef.current = null
        }
      }
    } else if (phase !== 'running') {
      if (mobileTriviaIntervalRef.current) {
        clearInterval(mobileTriviaIntervalRef.current)
        mobileTriviaIntervalRef.current = null
      }
    }
  }, [phase, enableTriviaBillboards, isMobileDevice, isMobileTriviaOpen, triggerMobileTrivia])

  // Load personal best ghost when game is ready
  useEffect(() => {
    if (!isLoading && gameState?.phase === 'ready' && ENABLE_GHOST_REPLAY) {
      loadPersonalBestGhost?.()
    }
  }, [isLoading, gameState?.phase, loadPersonalBestGhost])

  const handleReset = () => {
    if (enableTriviaBillboards) billboards.stop()
    setShowGameOver(false)
    setShowReadyCard(true) // Show ready card again on reset
    setLastRunStats(null)
    // Reset mobile trivia state
    setIsMobileTriviaOpen(false)
    setMobileTriviaQuestion(null)
    if (mobileTriviaIntervalRef.current) {
      clearInterval(mobileTriviaIntervalRef.current)
      mobileTriviaIntervalRef.current = null
    }
    // Reset trivia stats for XP calculation
    triviaStatsRef.current = { correct: 0, answered: 0 }
    reset()
  }

  // Quick restart - immediately start a new run without going back to ready screen
  const handleQuickRestart = useCallback(() => {
    if (enableTriviaBillboards) billboards.stop()
    setShowGameOver(false)
    setShowReadyCard(false) // Keep ready card hidden on quick restart
    setLastRunStats(null)
    // Reset mobile trivia state
    setIsMobileTriviaOpen(false)
    setMobileTriviaQuestion(null)
    if (mobileTriviaIntervalRef.current) {
      clearInterval(mobileTriviaIntervalRef.current)
      mobileTriviaIntervalRef.current = null
    }
    // Reset trivia stats for XP calculation
    triviaStatsRef.current = { correct: 0, answered: 0 }
    quickRestart()
  }, [billboards, quickRestart, enableTriviaBillboards])

  // Keyboard shortcut for quick restart (R key) when game over or paused
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // R key for quick restart when game over or paused
      if (e.code === 'KeyR' && (phase === 'gameover' || phase === 'paused')) {
        e.preventDefault()
        handleQuickRestart()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, handleQuickRestart])

  const handleStart = () => {
    setShowGameOver(false)
    setShowReadyCard(false) // Hide ready card when countdown starts
    start()
  }

  const handleBackToDashboard = () => {
    navigate('/dashboard')
  }

  const handleViewLeaderboard = () => {
    navigate('/survival/leaderboard')
  }

  if (!isAuthenticated) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Loading Screen - Enterprise loading UI during map/asset loading */}
      {isLoading && loadingProgress && (
        <EnterpriseLoadingScreen 
          progress={loadingProgress}
          onRetry={() => window.location.reload()}
        />
      )}

      {/* Error State */}
      {error && (
        <div className="absolute top-4 left-4 z-10">
          <ErrorDisplay 
            error={error} 
            onBack={handleBackToDashboard}
            backLabel="Back to Dashboard"
          />
        </div>
      )}

      {/* Player Info Header - positioned below the HUD lives panel */}
      {!isLoading && !error && (
        <div className="absolute top-[120px] left-4 z-10">
          <PlayerInfo 
            displayName={user?.display_name || 'Player'}
            rank={playerRank?.rank}
            personalBest={playerRank?.bestDistance}
          />
        </div>
      )}

      {/* HUD */}
      {!isLoading && !error && gameState && (
        <SurvivalHUD 
          gameState={gameState}
          combo={combo}
          multiplier={multiplier}
          isGhostActive={isGhostActive}
          currentMilestone={currentMilestone}
          milestoneProgress={milestoneProgress}
          nextMilestone={nextMilestone}
          currentAchievement={currentAchievement}
          onAchievementDismiss={dismissAchievement}
        />
      )}

      {/* Trivia Stats */}
      {enableTriviaBillboards && !isLoading && !error && gameState && (phase === 'running' || phase === 'paused') && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <TriviaStatsBar
            timeRemaining={billboards.stats?.timeRemaining}
            totalScore={billboards.totalScore}
            correctCount={billboards.correctCount}
            wrongCount={billboards.wrongCount}
            streak={billboards.streak}
          />
        </div>
      )}
      
      {/* Performance Stats */}
      {!isLoading && performanceMetrics && (
        <PerformanceOverlay 
          metrics={performanceMetrics} 
          memoryStats={getMemoryStats()} 
          isMobile={isMobileDevice} 
        />
      )}

      {/* Controls moved to Ready card - no longer shown during gameplay */}

      {/* Mobile Trivia Answer Buttons - shown during gameplay when question is active */}
      {isMobileDevice && enableTriviaBillboards && phase === 'running' && billboards.hasActiveQuestion && (
        <div className="absolute bottom-20 left-0 right-0 z-20 flex justify-center">
          <div className="flex gap-3 bg-black/80 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20">
            {[1, 2, 3, 4].map((num) => (
              <button
                key={num}
                onClick={() => billboards.answerQuestion(num - 1)}
                className="w-14 h-14 rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 
                         text-white font-bold text-2xl shadow-lg shadow-orange-500/30
                         active:scale-95 active:from-orange-600 active:to-orange-700
                         transition-all duration-100"
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons - Only during gameplay */}
      {!isLoading && gameState && phase !== 'ready' && (
        <div className="absolute bottom-4 right-4 z-10 flex gap-2">
          {phase === 'running' && (
            <EnterpriseButton onClick={pause} variant="secondary" size="sm">
              ⏸ Pause
            </EnterpriseButton>
          )}
          {phase === 'paused' && (
            <>
              <EnterpriseButton onClick={resume} variant="primary" size="sm">
                ▶ Resume
              </EnterpriseButton>
              <EnterpriseButton onClick={handleReset} variant="secondary" size="sm">
                Reset
              </EnterpriseButton>
            </>
          )}
        </div>
      )}

      {/* Ready State - Pre-game lobby with controls */}
      {phase === 'ready' && !isLoading && showReadyCard && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
          <EnterpriseCard maxWidth="md" glow="subtle">
            <EnterpriseTitle size="lg">Ready to Run</EnterpriseTitle>
            
            {/* Controls Section */}
            <div className="mb-6">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-3 font-medium">
                {isMobileDevice ? 'Touch Controls' : 'Keyboard Controls'}
              </p>
              
              {isMobileDevice ? (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { action: 'Jump', control: 'Swipe Up' },
                    { action: 'Slide', control: 'Swipe Down' },
                    { action: 'Move Left', control: 'Tap Left' },
                    { action: 'Move Right', control: 'Tap Right' },
                  ].map(({ action, control }) => (
                    <div key={action} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                      <span className="text-gray-400 text-sm">{action}</span>
                      <span className="text-orange-400 text-sm font-medium">{control}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'SPACE / W', action: 'Jump' },
                    { key: 'S / ↓', action: 'Slide' },
                    { key: 'A / ←', action: 'Move Left' },
                    { key: 'D / →', action: 'Move Right' },
                    { key: 'ESC / P', action: 'Pause' },
                    { key: 'R', action: 'Quick Restart' },
                  ].map(({ key, action }) => (
                    <div key={key} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                      <span className="text-gray-400 text-sm">{action}</span>
                      <kbd className="bg-gray-800 text-orange-400 text-xs font-mono px-2 py-1 rounded border border-gray-700">
                        {key}
                      </kbd>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => setMuted(!isMuted)}
              className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 
                       rounded-lg px-4 py-2 mb-4 text-sm text-gray-400 transition-colors"
            >
              {isMuted ? '🔇 Sound Off' : '🔊 Sound On'}
            </button>

            {/* Action Buttons */}
            <div className="space-y-3">
              <EnterpriseButton onClick={handleStart} variant="primary" fullWidth>
                Start Run
              </EnterpriseButton>
              <EnterpriseButton onClick={handleBackToDashboard} variant="ghost" fullWidth>
                ← Back to Dashboard
              </EnterpriseButton>
            </div>
          </EnterpriseCard>
        </div>
      )}

      {/* Three.js Container */}
      <div ref={containerRef} className="w-full h-screen" />
      
      {/* Pause Overlay */}
      {phase === 'paused' && !showGameOver && (
        <OverlayContainer blur="sm" darkness={50}>
          <EnterpriseCard maxWidth="sm" glow="none">
            <EnterpriseTitle size="xl">PAUSED</EnterpriseTitle>
            <p className="text-gray-400 text-center mb-6">Press ESC or click Resume to continue</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <EnterpriseButton onClick={resume} variant="primary">
                ▶ Resume
              </EnterpriseButton>
              <EnterpriseButton onClick={handleQuickRestart} variant="secondary" shortcut="R">
                Restart
              </EnterpriseButton>
              <EnterpriseButton onClick={handleBackToDashboard} variant="ghost">
                Quit
              </EnterpriseButton>
            </div>
          </EnterpriseCard>
        </OverlayContainer>
      )}

      {/* Game Over Overlay */}
      {phase === 'gameover' && showGameOver && lastRunStats && (
        <GameOverOverlay
          stats={lastRunStats}
          playerRank={playerRank}
          onPlayAgain={handleQuickRestart}
          onViewLeaderboard={handleViewLeaderboard}
          onBackToDashboard={handleBackToDashboard}
        />
      )}
      
      {/* Mobile Trivia Overlay - Portrait 2x2 grid */}
      {isMobileDevice && !enableTriviaBillboards && (
        <TriviaOverlay
          isOpen={isMobileTriviaOpen}
          question={mobileTriviaQuestion}
          timeLimit={10}
          onAnswer={handleMobileTriviaAnswer}
          onTimeout={handleMobileTriviaTimeout}
          onComplete={handleMobileTriviaComplete}
        />
      )}
      
      {/* Transition Overlay */}
      <TransitionOverlay {...overlayState} />
      
      {/* Symphony Debug Overlay */}
      <SymphonyDebugOverlay
        getSymphonyState={getSymphonyState as () => Parameters<typeof SymphonyDebugOverlay>[0]['getSymphonyState'] extends () => infer R ? R : never}
        getOrchestratorDebug={getOrchestratorDebug}
        getRenderStats={getObstacleRenderStats}
        enabled={!isLoading}
      />
    </div>
  )
}

/**
 * Game Over Overlay with stats and actions
 * Enterprise-styled with animations and consistent design patterns
 */
function GameOverOverlay({
  stats,
  playerRank,
  onPlayAgain,
  onViewLeaderboard,
  onBackToDashboard,
}: {
  stats: { distance: number; score: number; isNewPB: boolean; newRank?: number }
  playerRank?: { rank: number; bestDistance: number; bestScore: number } | null
  onPlayAgain: () => void
  onViewLeaderboard: () => void
  onBackToDashboard: () => void
}) {
  return (
    <OverlayContainer blur="md" darkness={70}>
      <EnterpriseCard maxWidth="md" glow={stats.isNewPB ? 'strong' : 'subtle'} glowColor={stats.isNewPB ? '#fbbf24' : '#f97316'}>
        <EnterpriseTitle 
          variant={stats.isNewPB ? 'success' : 'default'} 
          size="lg"
          glow={stats.isNewPB}
        >
          {stats.isNewPB ? '🎉 NEW PERSONAL BEST!' : 'GAME OVER'}
        </EnterpriseTitle>

        {/* Run Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <StatBox 
            value={`${Math.floor(stats.distance).toLocaleString()}m`}
            label="Distance"
            color="#ffffff"
            size="lg"
            delay={100}
          />
          <StatBox 
            value={stats.score.toLocaleString()}
            label="Score"
            color="#fbbf24"
            size="lg"
            delay={150}
          />
        </div>

        {/* Rank Info */}
        {playerRank && (
          <HighlightBox gradient="orange">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Your Rank</div>
                <div className="text-2xl font-bold text-orange-400">#{playerRank.rank}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Personal Best</div>
                <div className="text-lg font-semibold text-white">
                  {Math.floor(playerRank.bestDistance).toLocaleString()}m
                </div>
              </div>
            </div>
          </HighlightBox>
        )}

        <EnterpriseDivider />

        {/* Actions */}
        <div className="space-y-3">
          <EnterpriseButton onClick={onPlayAgain} variant="primary" fullWidth shortcut="R">
            Play Again
          </EnterpriseButton>
          <EnterpriseButton onClick={onViewLeaderboard} variant="secondary" fullWidth>
            View Leaderboard
          </EnterpriseButton>
          <EnterpriseButton onClick={onBackToDashboard} variant="ghost" fullWidth>
            Back to Dashboard
          </EnterpriseButton>
        </div>
      </EnterpriseCard>
    </OverlayContainer>
  )
}

/**
 * Performance overlay - Minimal text for mobile, enterprise styled for desktop
 * Shows FPS, frame time, and memory usage
 */
function PerformanceOverlay({ 
  metrics, 
  memoryStats,
  isMobile 
}: { 
  metrics: PerformanceMetrics
  memoryStats: MemoryStats | null
  isMobile: boolean 
}) {
  const fpsColor = metrics.fps >= 55 ? '#22c55e' : metrics.fps >= 30 ? '#eab308' : '#ef4444'
  const memoryColor = memoryStats 
    ? (memoryStats.budgetUsedPercent >= 90 ? '#ef4444' : memoryStats.budgetUsedPercent >= 70 ? '#eab308' : '#22c55e')
    : '#6b7280'
  
  // Mobile: minimal text on left side, no box
  if (isMobile) {
    return (
      <div className="absolute bottom-3 left-3 z-10">
        <div className="text-[10px] font-mono opacity-60 space-y-0.5">
          <div style={{ color: fpsColor }}>{metrics.fps} fps</div>
          <div className="text-gray-500">{metrics.avgFrameTime.toFixed(1)}ms</div>
          {memoryStats && (
            <div style={{ color: memoryColor }}>
              {memoryStats.totalEstimatedMB.toFixed(0)}/{memoryStats.budgetMB}MB
            </div>
          )}
        </div>
      </div>
    )
  }
  
  // Desktop: full enterprise styled overlay
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
      <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10 text-xs flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: fpsColor, boxShadow: `0 0 6px ${fpsColor}` }}
          />
          <span className="text-gray-400">FPS:</span>
          <span className="font-bold tabular-nums" style={{ color: fpsColor }}>
            {metrics.fps}
          </span>
        </div>
        <span className="text-gray-600">|</span>
        <span className="text-gray-500">
          Frame: <span className="text-gray-400 tabular-nums">{metrics.avgFrameTime.toFixed(1)}ms</span>
        </span>
        {memoryStats && (
          <>
            <span className="text-gray-600">|</span>
            <span className="text-gray-500">
              VRAM: <span className="tabular-nums" style={{ color: memoryColor }}>
                {memoryStats.totalEstimatedMB.toFixed(1)}/{memoryStats.budgetMB}MB
              </span>
              <span className="text-gray-600 ml-1">({memoryStats.budgetUsedPercent}%)</span>
            </span>
          </>
        )}
        {metrics.lagSpikes > 0 && (
          <>
            <span className="text-gray-600">|</span>
            <span className="text-yellow-400 flex items-center gap-1">
              ⚠ Lag: <span className="tabular-nums">{metrics.lagSpikes}</span>
            </span>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Main export with error boundary
 */
export default function SurvivalGame() {
  return (
    <SurvivalErrorBoundary
      onError={(error, errorInfo) => {
        console.error('[SurvivalGame] Error caught:', error, errorInfo)
      }}
    >
      <SurvivalGameContent />
    </SurvivalErrorBoundary>
  )
}
