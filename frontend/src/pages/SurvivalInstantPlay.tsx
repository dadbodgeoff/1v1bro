/**
 * SurvivalInstantPlay - Zero-friction guest survival runner
 * 
 * Allows unauthenticated users to play survival mode with:
 * - Session progress tracking via SurvivalGuestSessionManager
 * - Leaderboard rank preview showing where their run would place
 * - Option to save run data by creating an account
 * - Conversion prompts at strategic moments
 * 
 * @module pages/SurvivalInstantPlay
 */

import { useEffect, useCallback, useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useSurvivalGame } from '@/survival/hooks/useSurvivalGame'
import { useTriviaBillboards } from '@/survival/hooks/useTriviaBillboards'
import { useSurvivalAnalytics } from '@/survival/hooks/useSurvivalAnalytics'
import { SurvivalErrorBoundary } from '@/survival'
import {
  TransitionOverlay,
  useTransitionOverlay,
  SurvivalHUD,
  EnterpriseLoadingScreen,
  OverlayContainer,
  EnterpriseCard,
  EnterpriseTitle,
  StatBox,
  StatRow,
  HighlightBox,
  EnterpriseButton,
  RankDisplay,
  XPDisplay,
  EnterpriseDivider,
  TriviaStatsBar,
  GuestIndicator,
  ErrorDisplay,
} from '@/survival/components'
import { useMobileOptimization } from '@/survival/hooks/useMobileOptimization'
import { leaderboardService } from '@/survival/services/LeaderboardService'
import { getSurvivalGuestSession, type SurvivalRunResult } from '@/survival/guest'
import type { PerformanceMetrics } from '@/survival/engine/PerformanceMonitor'
import type { MemoryStats } from '@/survival/debug/MemoryMonitor'
import type { TriviaCategory } from '@/survival/world/TriviaQuestionProvider'


function SurvivalInstantPlayContent() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const guestSession = useRef(getSurvivalGuestSession())
  const survivalAnalytics = useSurvivalAnalytics()
  const { isTouch, deviceCapabilities } = useMobileOptimization()
  
  // Use multiple detection methods for reliable mobile detection
  const isMobileDevice = useMemo(() => {
    const ua = navigator.userAgent.toLowerCase()
    const uaIsMobile = /iphone|ipad|ipod|android|mobile|webos|blackberry|opera mini|iemobile/.test(ua)
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const isSmallScreen = window.innerWidth < 768
    return uaIsMobile || deviceCapabilities.isMobile || isTouch || (hasTouch && isSmallScreen)
  }, [deviceCapabilities.isMobile, isTouch])
  
  // Disable trivia billboards on mobile - too hard to interact with in 3D
  const enableTriviaBillboards = !isMobileDevice
  
  const [showGameOver, setShowGameOver] = useState(false)
  const [lastRunStats, setLastRunStats] = useState<{
    distance: number
    score: number
    maxCombo: number
    isNewPB: boolean
    previewXp: number
    estimatedRank: number | null
    totalPlayers: number
    // Trivia stats
    questionsAnswered: number
    questionsCorrect: number
    triviaStreak: number
    triviaScore: number
  } | null>(null)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  
  // Track trivia stats during the run
  const runTriviaStatsRef = useRef({
    questionsAnswered: 0,
    questionsCorrect: 0,
    maxStreak: 0,
    currentStreak: 0,
    triviaScore: 0,
  })
  
  // Track max combo during the run
  const maxComboRef = useRef(0)

  // Redirect if already authenticated - they should use the full version
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/survival', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // Track session start on mount
  useEffect(() => {
    survivalAnalytics.trackSessionStart()
    survivalAnalytics.trackFunnelEvent('page_visit')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch leaderboard data for rank estimation
  useEffect(() => {
    leaderboardService.startPolling()
    return () => leaderboardService.stopPolling()
  }, [])

  // Estimate rank based on distance
  const estimateRank = useCallback((distance: number): { rank: number | null; total: number } => {
    const data = leaderboardService.getLeaderboardData()
    if (!data || data.entries.length === 0) {
      return { rank: null, total: 0 }
    }

    // Find where this distance would rank
    const entries = data.entries
    let rank = 1
    for (const entry of entries) {
      if (distance >= entry.bestDistance) {
        break
      }
      rank++
    }

    // If beyond the visible leaderboard, estimate based on total players
    if (rank > entries.length) {
      // Rough estimate: assume linear distribution
      const lowestVisible = entries[entries.length - 1]?.bestDistance || 0
      if (distance < lowestVisible && data.totalPlayers > entries.length) {
        const ratio = distance / lowestVisible
        rank = Math.floor(entries.length + (data.totalPlayers - entries.length) * (1 - ratio))
      }
    }

    return { rank, total: data.totalPlayers }
  }, [])

  const handleGameOver = useCallback((score: number, distance: number) => {
    console.log('[SurvivalInstantPlay] Game over! Score:', score, 'Distance:', distance)
    
    // Get tracked stats
    const triviaStats = runTriviaStatsRef.current
    const maxCombo = maxComboRef.current
    
    const runResult: SurvivalRunResult = {
      distance,
      score,
      maxCombo,
      durationMs: 0,
      livesLost: 3,
      questionsAnswered: triviaStats.questionsAnswered,
      questionsCorrect: triviaStats.questionsCorrect,
      triviaStreak: triviaStats.maxStreak,
      triviaScore: triviaStats.triviaScore,
    }

    // Record the run
    const { isNewPB, previewXp } = guestSession.current.recordRunResult(runResult)
    
    // Track run end analytics
    survivalAnalytics.trackRunEnd({
      distance,
      score,
      durationSeconds: 0,
      maxCombo,
      obstaclesCleared: 0,
      nearMisses: 0,
      perfectDodges: 0,
      laneChanges: 0,
      jumps: 0,
      slides: 0,
    })
    
    // Track milestone if new PB
    if (isNewPB) {
      survivalAnalytics.trackPersonalBest(distance, guestSession.current.getSession().bestDistance)
    }
    
    // Track funnel events based on distance
    if (distance >= 100) survivalAnalytics.trackFunnelEvent('reached_100m', distance)
    if (distance >= 500) survivalAnalytics.trackFunnelEvent('reached_500m', distance)
    if (distance >= 1000) survivalAnalytics.trackFunnelEvent('reached_1000m', distance)
    
    // Estimate leaderboard rank
    const { rank, total } = estimateRank(distance)
    
    setLastRunStats({
      distance,
      score,
      maxCombo,
      isNewPB,
      previewXp,
      estimatedRank: rank,
      totalPlayers: total,
      questionsAnswered: triviaStats.questionsAnswered,
      questionsCorrect: triviaStats.questionsCorrect,
      triviaStreak: triviaStats.maxStreak,
      triviaScore: triviaStats.triviaScore,
    })
    setShowGameOver(true)
    
    // Show save prompt after 3rd run or if it's a good run
    const session = guestSession.current.getSession()
    if (session.totalRuns >= 3 || (rank !== null && rank <= 100)) {
      setShowSavePrompt(true)
    }
  }, [estimateRank, survivalAnalytics])

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
    currentMilestone,
    milestoneProgress,
    nextMilestone,
    currentAchievement,
    dismissAchievement,
    quickRestart,
    loseLife,
    addScore,
    getMemoryStats,
    logMemoryBreakdown,
  } = useSurvivalGame({
    onGameOver: handleGameOver,
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

  const phase = gameState?.phase ?? 'loading'
  const overlayState = useTransitionOverlay(transitionSystem)

  // Trivia category - default to fortnite for guest play
  const selectedCategory: TriviaCategory = 'fortnite'

  // Trivia billboards integration - disabled on mobile
  const billboards = useTriviaBillboards(engine, {
    category: selectedCategory,
    enabled: enableTriviaBillboards,
    onCorrectAnswer: (points) => {
      console.log(`[SurvivalInstantPlay] Correct! +${points}pts`)
      // Track trivia stats
      runTriviaStatsRef.current.questionsAnswered += 1
      runTriviaStatsRef.current.questionsCorrect += 1
      runTriviaStatsRef.current.currentStreak += 1
      runTriviaStatsRef.current.triviaScore += points
      if (runTriviaStatsRef.current.currentStreak > runTriviaStatsRef.current.maxStreak) {
        runTriviaStatsRef.current.maxStreak = runTriviaStatsRef.current.currentStreak
      }
      addScore?.(points)
    },
    onWrongAnswer: () => {
      console.log('[SurvivalInstantPlay] Wrong answer')
      runTriviaStatsRef.current.questionsAnswered += 1
      runTriviaStatsRef.current.currentStreak = 0
      loseLife?.()
    },
    onTimeout: () => {
      console.log('[SurvivalInstantPlay] Timeout')
      runTriviaStatsRef.current.questionsAnswered += 1
      runTriviaStatsRef.current.currentStreak = 0
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

  // Track max combo during the run
  useEffect(() => {
    if (combo > maxComboRef.current) {
      maxComboRef.current = combo
    }
  }, [combo])

  // Reset tracking refs for new run
  const resetRunTracking = useCallback(() => {
    runTriviaStatsRef.current = {
      questionsAnswered: 0,
      questionsCorrect: 0,
      maxStreak: 0,
      currentStreak: 0,
      triviaScore: 0,
    }
    maxComboRef.current = 0
  }, [])

  const handleReset = () => {
    setShowGameOver(false)
    setLastRunStats(null)
    setShowSavePrompt(false)
    resetRunTracking()
    reset()
  }

  const handleQuickRestart = useCallback(() => {
    setShowGameOver(false)
    setLastRunStats(null)
    setShowSavePrompt(false)
    resetRunTracking()
    quickRestart()
  }, [quickRestart, resetRunTracking])

  // Keyboard shortcut for quick restart
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
    resetRunTracking()
    survivalAnalytics.trackRunStart()
    start()
  }

  const handleBackToHome = () => {
    navigate('/')
  }

  const handleCreateAccount = () => {
    // Store that we came from survival instant play for session transfer
    sessionStorage.setItem('survival_signup_source', 'instant_play')
    navigate('/register')
  }

  const handleViewLeaderboard = () => {
    navigate('/survival/leaderboard')
  }

  if (isAuthenticated) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Loading Screen */}
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
            onBack={handleBackToHome}
            backLabel="Back to Home"
          />
        </div>
      )}

      {/* Guest Mode Indicator - Only show before/after gameplay, not during */}
      {!isLoading && !error && phase !== 'running' && (
        <div className="absolute top-4 left-4 z-10">
          <GuestIndicator onSignUp={handleCreateAccount} />
        </div>
      )}

      {/* HUD */}
      {!isLoading && !error && gameState && (
        <SurvivalHUD 
          gameState={gameState}
          combo={combo}
          multiplier={multiplier}
          isGhostActive={false}
          currentMilestone={currentMilestone}
          milestoneProgress={milestoneProgress}
          nextMilestone={nextMilestone}
          currentAchievement={currentAchievement}
          onAchievementDismiss={dismissAchievement}
        />
      )}

      {/* Trivia Stats - shown during gameplay (desktop only) */}
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
      {phase === 'ready' && !isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
          <EnterpriseCard maxWidth="md" glow="subtle">
            <EnterpriseTitle size="lg">Survival Runner</EnterpriseTitle>
            <p className="text-gray-400 text-sm text-center mb-4">
              How far can you go?
            </p>
            
            {/* Session Stats */}
            {guestSession.current.getSession().totalRuns > 0 && (
              <div className="mb-4">
                <StatRow 
                  items={[
                    { 
                      value: `${Math.floor(guestSession.current.getSession().bestDistance)}m`, 
                      label: 'Your Best', 
                      color: '#f97316' 
                    },
                    { 
                      value: guestSession.current.getSession().totalRuns, 
                      label: 'Total Runs', 
                      color: '#ffffff' 
                    },
                  ]}
                  size="sm"
                />
              </div>
            )}

            {/* Controls Section */}
            <div className="mb-4">
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
            
            <div className="space-y-3">
              <EnterpriseButton onClick={handleStart} variant="primary" fullWidth>
                Start Run
              </EnterpriseButton>
              <EnterpriseButton onClick={handleBackToHome} variant="ghost" fullWidth>
                ← Back to Home
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
              <EnterpriseButton onClick={handleBackToHome} variant="ghost">
                Quit
              </EnterpriseButton>
            </div>
          </EnterpriseCard>
        </OverlayContainer>
      )}

      {/* Game Over Overlay */}
      {phase === 'gameover' && showGameOver && lastRunStats && (
        <GuestGameOverOverlay
          stats={lastRunStats}
          sessionStats={guestSession.current.getSession()}
          showSavePrompt={showSavePrompt}
          onPlayAgain={handleQuickRestart}
          onViewLeaderboard={handleViewLeaderboard}
          onCreateAccount={handleCreateAccount}
          onBackToHome={handleBackToHome}
        />
      )}
      
      {/* Transition Overlay */}
      <TransitionOverlay {...overlayState} />
    </div>
  )
}

/**
 * Guest Game Over Overlay with rank preview and save prompt
 * Enterprise-styled with animations and consistent design patterns
 */
function GuestGameOverOverlay({
  stats,
  sessionStats,
  showSavePrompt,
  onPlayAgain,
  onViewLeaderboard,
  onCreateAccount,
  onBackToHome,
}: {
  stats: {
    distance: number
    score: number
    maxCombo: number
    isNewPB: boolean
    previewXp: number
    estimatedRank: number | null
    totalPlayers: number
    questionsAnswered: number
    questionsCorrect: number
    triviaStreak: number
    triviaScore: number
  }
  sessionStats: { bestDistance: number; totalRuns: number; previewXpEarned: number }
  showSavePrompt: boolean
  onPlayAgain: () => void
  onViewLeaderboard: () => void
  onCreateAccount: () => void
  onBackToHome: () => void
}) {
  const triviaAccuracy = stats.questionsAnswered > 0 
    ? Math.round((stats.questionsCorrect / stats.questionsAnswered) * 100) 
    : 0

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

        {/* Run Stats - Distance & Score */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <StatBox 
            value={`${Math.floor(stats.distance).toLocaleString()}m`}
            label="Distance"
            color="#ffffff"
            size="md"
            delay={100}
          />
          <StatBox 
            value={stats.score.toLocaleString()}
            label="Score"
            color="#fbbf24"
            size="md"
            delay={150}
          />
        </div>

        {/* Combo & Trivia Stats */}
        <StatRow 
          items={[
            { value: `${stats.maxCombo}x`, label: 'Max Combo', color: '#f97316' },
            { value: `${stats.questionsCorrect}/${stats.questionsAnswered}`, label: 'Trivia', color: '#22c55e' },
            { value: `${triviaAccuracy}%`, label: 'Accuracy', color: '#22d3ee' },
          ]}
          size="sm"
        />

        {/* Trivia Streak & Score */}
        {stats.questionsAnswered > 0 && (
          <div className="flex gap-2 mt-3">
            <HighlightBox gradient="purple">
              <div className="text-sm font-bold text-purple-400 text-center">
                🔥 {stats.triviaStreak} streak
              </div>
            </HighlightBox>
            <HighlightBox gradient="cyan">
              <div className="text-sm font-bold text-cyan-400 text-center">
                +{stats.triviaScore} trivia pts
              </div>
            </HighlightBox>
          </div>
        )}

        {/* Leaderboard Rank Preview */}
        {stats.estimatedRank !== null && (
          <div className="mt-3">
            <RankDisplay 
              rank={stats.estimatedRank}
              totalPlayers={stats.totalPlayers}
              label="This run would rank"
              size="md"
            />
          </div>
        )}

        {/* Preview XP Earned */}
        <div className="mt-3">
          <XPDisplay 
            xp={stats.previewXp}
            label="Preview XP Earned"
            totalXp={sessionStats.previewXpEarned}
          />
        </div>

        <EnterpriseDivider />

        {/* Save Prompt */}
        {showSavePrompt && (
          <HighlightBox gradient="orange" animate>
            <p className="text-white font-medium text-center mb-2">
              Want to save this run?
            </p>
            <p className="text-gray-400 text-sm text-center mb-3">
              Create an account to save your progress, compete on leaderboards, and unlock rewards!
            </p>
            <EnterpriseButton onClick={onCreateAccount} variant="primary" fullWidth size="sm">
              Create Account & Save Run
            </EnterpriseButton>
          </HighlightBox>
        )}

        {/* Actions */}
        <div className={`space-y-3 ${showSavePrompt ? 'mt-4' : ''}`}>
          <EnterpriseButton onClick={onPlayAgain} variant="primary" fullWidth shortcut="R">
            Play Again
          </EnterpriseButton>
          <EnterpriseButton onClick={onViewLeaderboard} variant="secondary" fullWidth>
            View Leaderboard
          </EnterpriseButton>
          {!showSavePrompt && (
            <EnterpriseButton onClick={onCreateAccount} variant="ghost" fullWidth>
              Create Account to Save Progress
            </EnterpriseButton>
          )}
          <EnterpriseButton onClick={onBackToHome} variant="ghost" fullWidth>
            Back to Home
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
export default function SurvivalInstantPlay() {
  return (
    <SurvivalErrorBoundary
      onError={(error, errorInfo) => {
        console.error('[SurvivalInstantPlay] Error caught:', error, errorInfo)
      }}
    >
      <SurvivalInstantPlayContent />
    </SurvivalErrorBoundary>
  )
}
