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
  EnterpriseButton,
  TriviaStatsBar,
  PlayerInfo,
  ErrorDisplay,
  TriviaPanel,
  TRIVIA_PANEL_HEIGHT,
  ReadyOverlay,
  PauseOverlay,
  GameOverOverlay,
  PerformanceOverlay,
  type AuthRunStats,
  type TriviaQuestion,
} from '@/survival/components'
import { useMobileDetection } from '@/survival/hooks/useMobileDetection'
import { useTriviaBillboards } from '@/survival/hooks/useTriviaBillboards'
import { useLeaderboard } from '@/survival/hooks/useLeaderboard'
import { getRandomQuestions } from '@/data/fortnite-quiz-data'
import type { TriviaStats } from '@/survival/hooks/useSurvivalTrivia'

const ENABLE_GHOST_REPLAY = true

function SurvivalGameContent() {
  const navigate = useNavigate()
  const { user, token, isAuthenticated } = useAuthStore()
  const { loadoutWithDetails, fetchLoadout } = useCosmeticsStore()
  const { leaderboard, refresh: refreshRank } = useLeaderboard({ autoStart: true })
  const { isMobile, enableTriviaBillboards } = useMobileDetection()
  
  const playerRank = leaderboard?.playerEntry
  const [showGameOver, setShowGameOver] = useState(false)
  const [showReadyCard, setShowReadyCard] = useState(true)
  const [lastRunStats, setLastRunStats] = useState<AuthRunStats | null>(null)
  const maxComboRef = useRef(0)
  
  // Trivia stats ref - accessible before game hook is called (fixes stale closure)
  const triviaStatsRef = useRef<TriviaStats>({
    questionsAnswered: 0,
    questionsCorrect: 0,
    maxStreak: 0,
    currentStreak: 0,
    triviaScore: 0,
  })
  
  // Mobile question pool
  const usedQuestionsRef = useRef<Set<string>>(new Set())

  // Fetch loadout on mount
  useEffect(() => {
    if (token) fetchLoadout(token)
  }, [token, fetchLoadout])

  // Get equipped runner skin
  const runnerSkin = useMemo((): RunnerSkinConfig | undefined => {
    const equippedRunner = loadoutWithDetails?.runner_equipped
    if (!equippedRunner?.model_url) return undefined
    
    const baseUrl = equippedRunner.model_url
    if (baseUrl.includes('-run')) {
      return {
        run: baseUrl,
        jump: baseUrl.replace('-run', '-jump'),
        down: baseUrl.replace('-run', '-down'),
      }
    }
    
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

  // Game over handler - uses ref so it doesn't need trivia in deps
  const handleGameOver = useCallback(async (score: number, distance: number) => {
    const stats = triviaStatsRef.current
    const previousBest = previousBestRef.current ?? 0
    const isNewPB = distance > previousBest
    
    setTimeout(async () => {
      await refreshRank()
      const newRank = leaderboard?.playerEntry?.rank
      
      previousRankRef.current = newRank
      previousBestRef.current = Math.max(previousBest, distance)
      
      setLastRunStats({
        distance, score, maxCombo: maxComboRef.current, isNewPB, newRank,
        triviaStats: { ...stats },
      })
      setShowGameOver(true)
    }, 1000)
  }, [refreshRank, leaderboard?.playerEntry?.rank])

  // Game hook
  const {
    containerRef, engine, gameState, performanceMetrics, transitionSystem,
    loadingProgress, combo, multiplier, isLoading, error,
    start, pause, resume, reset, setMuted, isMuted,
    loseLife, addScore, getSymphonyState, getOrchestratorDebug, getObstacleRenderStats,
    loadPersonalBestGhost, isGhostActive,
    currentMilestone, milestoneProgress, nextMilestone,
    currentAchievement, dismissAchievement, quickRestart,
    setTriviaStats, getMemoryStats,
  } = useSurvivalGameWithAnalytics({
    onGameOver: handleGameOver,
    analyticsEnabled: true,
    runnerSkin,
  })

  const phase = gameState?.phase ?? 'loading'
  const overlayState = useTransitionOverlay(transitionSystem)

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

  // Desktop billboards (only when enableTriviaBillboards is true)
  const billboards = useTriviaBillboards(engine, {
    category: 'fortnite',
    enabled: enableTriviaBillboards,
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

  // Start/stop billboards based on game phase
  useEffect(() => {
    if (!enableTriviaBillboards) return
    
    if (phase === 'running' && !billboards.isActive) {
      billboards.start()
    } else if ((phase === 'paused' || phase === 'gameover' || phase === 'ready') && billboards.isActive) {
      billboards.stop()
    }
  }, [phase, billboards, enableTriviaBillboards])

  // Mobile: get next question
  const getNextMobileQuestion = useCallback((): TriviaQuestion | null => {
    const allQuestions = getRandomQuestions(50)
    const unusedQuestions = allQuestions.filter(q => !usedQuestionsRef.current.has(q.id))
    
    if (unusedQuestions.length === 0) {
      usedQuestionsRef.current.clear()
      if (allQuestions.length === 0) return null
    }
    
    const pool = unusedQuestions.length > 0 ? unusedQuestions : allQuestions
    const quizQ = pool[Math.floor(Math.random() * pool.length)]
    usedQuestionsRef.current.add(quizQ.id)
    
    return {
      id: quizQ.id,
      question: quizQ.question,
      answers: quizQ.options,
      correctIndex: quizQ.correctAnswer,
      category: quizQ.category,
      difficulty: quizQ.difficulty === 'casual' ? 'easy' : quizQ.difficulty === 'moderate' ? 'medium' : 'hard',
    }
  }, [])

  // Mobile: handle answer
  const handleMobileTriviaAnswer = useCallback((_questionId: string, _selectedIndex: number, isCorrect: boolean) => {
    const points = isCorrect ? 100 + (triviaStatsRef.current.currentStreak * 25) : 0
    updateTriviaStats(isCorrect, points)
    
    if (isCorrect) {
      addScore?.(points)
    } else {
      loseLife?.()
    }
  }, [updateTriviaStats, addScore, loseLife])

  // Mobile: handle timeout
  const handleMobileTriviaTimeout = useCallback((_questionId: string) => {
    updateTriviaStats(false)
    loseLife?.()
  }, [updateTriviaStats, loseLife])

  // Track max combo
  useEffect(() => {
    if (combo > maxComboRef.current) maxComboRef.current = combo
  }, [combo])

  // Load personal best ghost when ready
  useEffect(() => {
    if (!isLoading && gameState?.phase === 'ready' && ENABLE_GHOST_REPLAY) {
      loadPersonalBestGhost?.()
    }
  }, [isLoading, gameState?.phase, loadPersonalBestGhost])

  // Reset tracking helper
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

  // Reset handler
  const handleReset = useCallback(() => {
    if (enableTriviaBillboards) billboards.stop()
    setShowGameOver(false)
    setShowReadyCard(true)
    setLastRunStats(null)
    resetTracking()
    reset()
  }, [reset, billboards, enableTriviaBillboards, resetTracking])

  // Quick restart handler
  const handleQuickRestart = useCallback(() => {
    if (enableTriviaBillboards) billboards.stop()
    setShowGameOver(false)
    setShowReadyCard(false)
    setLastRunStats(null)
    resetTracking()
    quickRestart()
  }, [quickRestart, billboards, enableTriviaBillboards, resetTracking])

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
    setShowGameOver(false)
    setShowReadyCard(false)
    start()
  }

  const handleBackToDashboard = () => navigate('/dashboard')
  const handleViewLeaderboard = () => navigate('/survival/leaderboard')

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Loading */}
      {isLoading && loadingProgress && (
        <EnterpriseLoadingScreen progress={loadingProgress} onRetry={() => window.location.reload()} />
      )}

      {/* Error */}
      {error && (
        <div className="absolute top-4 left-4 z-10">
          <ErrorDisplay error={error} onBack={handleBackToDashboard} backLabel="Back to Dashboard" />
        </div>
      )}

      {/* Player Info */}
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
          gameState={gameState} combo={combo} multiplier={multiplier} isGhostActive={isGhostActive}
          currentMilestone={currentMilestone} milestoneProgress={milestoneProgress}
          nextMilestone={nextMilestone} currentAchievement={currentAchievement}
          onAchievementDismiss={dismissAchievement}
        />
      )}

      {/* Trivia Stats (desktop) */}
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
        <PerformanceOverlay metrics={performanceMetrics} memoryStats={getMemoryStats()} isMobile={isMobile} />
      )}

      {/* Mobile Trivia Answer Buttons (desktop billboards - legacy, shouldn't show on mobile now) */}
      {isMobile && enableTriviaBillboards && phase === 'running' && billboards.hasActiveQuestion && (
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

      {/* Action Buttons */}
      {!isLoading && gameState && phase !== 'ready' && (
        <div className="absolute bottom-4 right-4 z-10 flex gap-2">
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

      {/* Ready Overlay */}
      {phase === 'ready' && !isLoading && showReadyCard && (
        <ReadyOverlay
          title="Ready to Run"
          isMobile={isMobile} isMuted={isMuted} onToggleMute={() => setMuted(!isMuted)}
          onStart={handleStart} onBack={handleBackToDashboard} backLabel="← Back to Dashboard"
        />
      )}

      {/* Game Layout */}
      <div className="flex flex-col h-screen">
        <div 
          ref={containerRef} 
          className="w-full flex-1"
          style={{ height: isMobile && phase === 'running' ? `calc(100vh - ${TRIVIA_PANEL_HEIGHT}px)` : '100vh' }}
        />
        
        {isMobile && !enableTriviaBillboards && phase === 'running' && (
          <TriviaPanel
            isActive={phase === 'running'}
            getNextQuestion={getNextMobileQuestion}
            timeLimit={30}
            onAnswer={handleMobileTriviaAnswer}
            onTimeout={handleMobileTriviaTimeout}
          />
        )}
      </div>
      
      {/* Pause Overlay */}
      {phase === 'paused' && !showGameOver && (
        <PauseOverlay onResume={resume} onRestart={handleQuickRestart} onQuit={handleBackToDashboard} />
      )}

      {/* Game Over Overlay */}
      {phase === 'gameover' && showGameOver && lastRunStats && (
        <GameOverOverlay
          mode="auth"
          stats={lastRunStats}
          playerRank={playerRank}
          onPlayAgain={handleQuickRestart}
          onViewLeaderboard={handleViewLeaderboard}
          onBack={handleBackToDashboard}
          backLabel="Back to Dashboard"
        />
      )}
      
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

export default function SurvivalGame() {
  return (
    <SurvivalErrorBoundary>
      <SurvivalGameContent />
    </SurvivalErrorBoundary>
  )
}
