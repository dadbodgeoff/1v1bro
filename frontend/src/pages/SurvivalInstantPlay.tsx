/**
 * SurvivalInstantPlay - Zero-friction guest survival runner
 * 
 * Allows unauthenticated users to play survival mode with:
 * - Session progress tracking via SurvivalGuestSessionManager
 * - Leaderboard rank preview showing where their run would place
 * - Option to save run data by creating an account
 * - Conversion prompts at strategic moments
 */

import { useEffect, useCallback, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
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
  TriviaStatsBar,
  GuestIndicator,
  ErrorDisplay,
  TriviaPanel,
  TRIVIA_PANEL_HEIGHT,
  ReadyOverlay,
  PauseOverlay,
  GameOverOverlay,
  PerformanceOverlay,
  type GuestRunStats,
  type TriviaQuestion,
} from '@/survival/components'
import { useTriviaBillboards } from '@/survival/hooks/useTriviaBillboards'
import { leaderboardService } from '@/survival/services/LeaderboardService'
import { getSurvivalGuestSession, type SurvivalRunResult } from '@/survival/guest'
import { getRandomQuestions } from '@/data/fortnite-quiz-data'
import type { TriviaStats } from '@/survival/hooks/useSurvivalTrivia'

function SurvivalInstantPlayContent() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const guestSession = useRef(getSurvivalGuestSession())
  const survivalAnalytics = useSurvivalAnalytics()
  const { isMobile, enableTriviaBillboards } = useMobileDetection()
  
  const [showGameOver, setShowGameOver] = useState(false)
  const [showReadyCard, setShowReadyCard] = useState(true)
  const [lastRunStats, setLastRunStats] = useState<GuestRunStats | null>(null)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const maxComboRef = useRef(0)
  
  // Trivia stats ref - accessible before trivia hook is called
  const triviaStatsRef = useRef<TriviaStats>({
    questionsAnswered: 0,
    questionsCorrect: 0,
    maxStreak: 0,
    currentStreak: 0,
    triviaScore: 0,
  })
  
  // Mobile question pool
  const usedQuestionsRef = useRef<Set<string>>(new Set())

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/survival', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // Analytics tracking
  useEffect(() => {
    survivalAnalytics.trackSessionStart()
    survivalAnalytics.trackFunnelEvent('page_visit')
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

  // Game over handler - uses ref so it doesn't need trivia in deps
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
    loseLife, addScore, setTriviaStats, getMemoryStats,
  } = useSurvivalGame({ onGameOver: handleGameOver })

  const phase = gameState?.phase ?? 'loading'
  const overlayState = useTransitionOverlay(transitionSystem)
  
  // Calculate if mobile trivia should show
  const showMobileTrivia = isMobile && !enableTriviaBillboards && phase === 'running'
  
  // Note: Renderer uses ResizeObserver to automatically detect container size changes
  // No manual resize handling needed here - the renderer handles it

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
    setShowGameOver(false)
    setShowReadyCard(false)
    resetTracking()
    survivalAnalytics.trackRunStart()
    start()
  }

  const handleBackToHome = () => navigate('/')
  const handleCreateAccount = () => {
    sessionStorage.setItem('survival_signup_source', 'instant_play')
    navigate('/register')
  }
  const handleViewLeaderboard = () => navigate('/survival/leaderboard')

  if (isAuthenticated) return null

  // Calculate game area height for mobile with trivia panel
  const gameAreaHeight = showMobileTrivia ? `calc(100vh - ${TRIVIA_PANEL_HEIGHT}px)` : '100vh'

  return (
    <div className="fixed inset-0 bg-[#09090b] text-white overflow-hidden">
      {/* Loading */}
      {isLoading && loadingProgress && (
        <EnterpriseLoadingScreen progress={loadingProgress} onRetry={() => window.location.reload()} />
      )}

      {/* Error */}
      {error && (
        <div className="absolute top-4 left-4 z-10">
          <ErrorDisplay error={error} onBack={handleBackToHome} backLabel="Back to Home" />
        </div>
      )}

      {/* Guest Indicator */}
      {!isLoading && !error && phase !== 'running' && (
        <div className="absolute top-4 left-4 z-10">
          <GuestIndicator onSignUp={handleCreateAccount} />
        </div>
      )}

      {/* Game Canvas Container - takes remaining space above trivia */}
      <div 
        ref={containerRef} 
        className="absolute top-0 left-0 right-0"
        style={{ height: gameAreaHeight }}
      />

      {/* HUD - positioned within game area */}
      {!isLoading && !error && gameState && (
        <div 
          style={{ height: gameAreaHeight }} 
          className="absolute top-0 left-0 right-0 pointer-events-none overflow-hidden"
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

      {/* Trivia Stats (desktop only - billboards) */}
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
      
      {/* Performance Stats - position above trivia panel on mobile */}
      {!isLoading && performanceMetrics && (
        <div className="absolute left-2 z-10" style={{ bottom: showMobileTrivia ? `${TRIVIA_PANEL_HEIGHT + 8}px` : '8px' }}>
          <PerformanceOverlay metrics={performanceMetrics} memoryStats={getMemoryStats()} isMobile={isMobile} />
        </div>
      )}

      {/* Action Buttons - position above trivia panel on mobile */}
      {!isLoading && gameState && phase !== 'ready' && (
        <div className="absolute right-4 z-10 flex gap-2" style={{ bottom: showMobileTrivia ? `${TRIVIA_PANEL_HEIGHT + 8}px` : '16px' }}>
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
          subtitle="How far can you go?"
          isMobile={isMobile} 
          isMuted={isMuted} 
          onToggleMute={() => setMuted(!isMuted)}
          onStart={handleStart} 
          onBack={handleBackToHome} 
          backLabel="← Back to Home"
          sessionStats={guestSession.current.getSession()}
        />
      )}

      {/* Mobile Trivia Panel - fixed at bottom, high z-index for touch priority */}
      {showMobileTrivia && (
        <div 
          className="absolute bottom-0 left-0 right-0 z-50"
          style={{ touchAction: 'manipulation' }}
        >
          <TriviaPanel
            isActive={phase === 'running'}
            getNextQuestion={getNextMobileQuestion}
            timeLimit={30}
            onAnswer={handleMobileTriviaAnswer}
            onTimeout={handleMobileTriviaTimeout}
          />
        </div>
      )}
      
      {/* Pause Overlay */}
      {phase === 'paused' && !showGameOver && (
        <PauseOverlay onResume={resume} onRestart={handleQuickRestart} onQuit={handleBackToHome} />
      )}

      {/* Game Over Overlay */}
      {phase === 'gameover' && showGameOver && lastRunStats && (
        <GameOverOverlay
          mode="guest"
          stats={lastRunStats}
          sessionStats={guestSession.current.getSession()}
          showSavePrompt={showSavePrompt}
          onPlayAgain={handleQuickRestart}
          onViewLeaderboard={handleViewLeaderboard}
          onCreateAccount={handleCreateAccount}
          onBack={handleBackToHome}
          backLabel="Back to Home"
        />
      )}
      
      <TransitionOverlay {...overlayState} />
    </div>
  )
}

export default function SurvivalInstantPlay() {
  return (
    <SurvivalErrorBoundary>
      <SurvivalInstantPlayContent />
    </SurvivalErrorBoundary>
  )
}
