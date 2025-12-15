/**
 * SurvivalTest - Survival Mode Test Page
 * Uses the enterprise SurvivalEngine architecture with AAA-quality HUD
 * Features holographic trivia billboards on the sides of the track
 */

import { useEffect, useRef } from 'react'
import { useSurvivalGameWithAnalytics, SurvivalErrorBoundary } from '@/survival'
import {
  TransitionOverlay,
  useTransitionOverlay,
  SurvivalHUD,
  SymphonyDebugOverlay,
} from '@/survival/components'
import { useTriviaBillboards } from '@/survival/hooks/useTriviaBillboards'
import type { PerformanceMetrics } from '@/survival/engine/PerformanceMonitor'

// Feature flag - billboard trivia system
const ENABLE_TRIVIA_BILLBOARDS = true

function SurvivalGame() {
  const {
    containerRef,
    engine,
    gameState,
    performanceMetrics,
    transitionSystem,
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
    // Ghost system
    loadPersonalBestGhost,
    isGhostActive,
    // Milestone & Achievement system
    currentMilestone,
    milestoneProgress,
    nextMilestone,
    currentAchievement,
    dismissAchievement,
    analytics: _analytics,
  } = useSurvivalGameWithAnalytics({
    onGameOver: (score, distance) => {
      console.log('[SurvivalTest] Game over! Score:', score, 'Distance:', distance)
      if (ENABLE_TRIVIA_BILLBOARDS) billboards.stop()
    },
    analyticsEnabled: true,
  })

  // Holographic trivia billboards on the sides of the track
  const billboards = useTriviaBillboards(engine, {
    category: 'fortnite',
    enabled: ENABLE_TRIVIA_BILLBOARDS,
    onCorrectAnswer: (points) => {
      console.log(`[Billboards] Correct! +${points}pts`)
      addScore?.(points)
    },
    onWrongAnswer: () => {
      console.log('[Billboards] Wrong answer, losing life')
      loseLife?.()
    },
    onTimeout: () => {
      console.log('[Billboards] Timeout, losing life')
      loseLife?.()
    },
  })

  const phase = gameState?.phase ?? 'loading'
  const overlayState = useTransitionOverlay(transitionSystem)

  // Store billboards in ref to avoid effect re-triggers
  const billboardsRef = useRef(billboards)
  billboardsRef.current = billboards

  // Sync billboard state with game phase
  useEffect(() => {
    if (!ENABLE_TRIVIA_BILLBOARDS) return
    
    const bb = billboardsRef.current
    if (phase === 'running' && !bb.isActive) {
      // Game started or resumed, start billboards
      bb.start()
    } else if ((phase === 'paused' || phase === 'gameover') && bb.isActive) {
      // Game paused or over, stop billboards
      bb.stop()
    }
  }, [phase])

  // Reset billboards when game resets
  const handleReset = () => {
    if (ENABLE_TRIVIA_BILLBOARDS) billboards.stop()
    reset()
  }

  // Load personal best ghost when game is ready
  useEffect(() => {
    if (!isLoading && gameState?.phase === 'ready') {
      loadPersonalBestGhost?.()
    }
  }, [isLoading, gameState?.phase, loadPersonalBestGhost])

  // Start game (quiz starts automatically via useEffect if enabled)
  const handleStart = () => {
    start()
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Loading/Error States */}
      {isLoading && (
        <div className="absolute top-4 left-4 z-10 bg-black/70 backdrop-blur-sm p-4 rounded-xl border border-white/10">
          <h1 className="text-xl font-bold text-orange-500">Survival Mode</h1>
          <p className="text-gray-400 mt-2">Loading assets...</p>
        </div>
      )}
      {error && (
        <div className="absolute top-4 left-4 z-10 bg-black/70 backdrop-blur-sm p-4 rounded-xl border border-red-500/30">
          <h1 className="text-xl font-bold text-red-500">Error</h1>
          <p className="text-red-400 mt-2">{error}</p>
        </div>
      )}

      {/* AAA Breathing HUD */}
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

      {/* Trivia Billboard Stats - Top center (only if ENABLE_TRIVIA_BILLBOARDS) */}
      {ENABLE_TRIVIA_BILLBOARDS && !isLoading && !error && gameState && (phase === 'running' || phase === 'paused') && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-4 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 text-sm border border-white/10">
            {/* Timer */}
            {billboards.stats && (
              <span className={`font-bold tabular-nums ${
                billboards.stats.timeRemaining <= 10 
                  ? 'text-red-400 animate-pulse' 
                  : billboards.stats.timeRemaining <= 20 
                    ? 'text-yellow-400' 
                    : 'text-green-400'
              }`}>
                {billboards.stats.timeRemaining}s
              </span>
            )}
            <span className="text-gray-500">|</span>
            <span className="text-gray-400">Score:</span>
            <span className="font-bold text-purple-400">{billboards.totalScore.toLocaleString()}</span>
            <span className="text-green-400">{billboards.correctCount}✓</span>
            <span className="text-red-400">{billboards.wrongCount}✗</span>
            {billboards.streak >= 3 && (
              <span className="text-yellow-400">🔥 {billboards.streak}</span>
            )}
          </div>
          <div className="text-center text-xs text-gray-500 mt-1">
            Press <span className="text-cyan-400">1-4</span> to answer
          </div>
        </div>
      )}
      
      {/* Performance Stats (dev mode) */}
      {!isLoading && performanceMetrics && (
        <PerformanceOverlay metrics={performanceMetrics} />
      )}

      {/* Controls */}
      <div className="absolute bottom-4 left-4 z-10 bg-black/70 backdrop-blur-sm p-4 rounded-xl border border-white/10 text-sm">
        <p className="text-gray-300 font-semibold mb-2">Controls</p>
        <ul className="text-gray-500 space-y-1">
          <li><span className="text-orange-400">SPACE/W</span> = Start / Jump</li>
          <li><span className="text-orange-400">A / ←</span> = Move Left</li>
          <li><span className="text-orange-400">D / →</span> = Move Right</li>
          <li><span className="text-orange-400">S / ↓</span> = Slide</li>
          <li><span className="text-orange-400">ESC / P</span> = Pause</li>
          <li className="pt-1 border-t border-white/10">
            <span className="text-cyan-400">1-4</span> = Answer Billboards
          </li>
          <li>
            <span className="text-purple-400">`</span> = Symphony Debug
          </li>
        </ul>
        <button
          onClick={() => setMuted(!isMuted)}
          className="mt-3 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs flex items-center gap-2"
        >
          {isMuted ? '🔇 Unmute' : '🔊 Mute'}
        </button>
      </div>

      {/* Action Buttons */}
      {!isLoading && gameState && (
        <div className="absolute bottom-4 right-4 z-10 flex gap-2">
          {phase === 'ready' && (
            <button
              onClick={handleStart}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105"
            >
              Start
            </button>
          )}
          {phase === 'running' && (
            <button
              onClick={pause}
              className="px-4 py-2 bg-yellow-500/90 hover:bg-yellow-500 text-black font-semibold rounded-lg transition-colors"
            >
              Pause
            </button>
          )}
          {phase === 'paused' && (
            <>
              <button
                onClick={resume}
                className="px-4 py-2 bg-green-500 hover:bg-green-400 text-white font-semibold rounded-lg transition-colors"
              >
                Resume
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg transition-colors"
              >
                Reset
              </button>
            </>
          )}
          {phase === 'gameover' && (
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105"
            >
              Play Again
            </button>
          )}
        </div>
      )}

      {/* Three.js Container */}
      <div ref={containerRef} className="w-full h-screen" />
      
      {/* Pause Overlay */}
      {phase === 'paused' && (
        <div className="absolute inset-0 z-20 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-2">PAUSED</h2>
            <p className="text-gray-400 text-lg">Press ESC or click Resume to continue</p>
            <div className="mt-6 flex gap-4 justify-center">
              <button
                onClick={resume}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105"
              >
                Resume
              </button>
              <button
                onClick={handleReset}
                className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all"
              >
                Restart
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Transition Overlay (fade, countdown, death effects) */}
      <TransitionOverlay {...overlayState} />
      
      {/* Symphony Debug Overlay - Toggle with ` key */}
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
 * Performance overlay for dev mode
 */
function PerformanceOverlay({ metrics }: { metrics: PerformanceMetrics }) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/5 text-xs text-gray-500 flex gap-4">
      <span>
        FPS: <span className={metrics.fps >= 55 ? 'text-green-400' : metrics.fps >= 30 ? 'text-yellow-400' : 'text-red-400'}>
          {metrics.fps}
        </span>
      </span>
      <span>Frame: {metrics.avgFrameTime.toFixed(1)}ms</span>
      {metrics.lagSpikes > 0 && (
        <span className="text-yellow-400">Lag: {metrics.lagSpikes}</span>
      )}
    </div>
  )
}

/**
 * Wrapped with Error Boundary for graceful error handling
 */
export default function SurvivalTest() {
  return (
    <SurvivalErrorBoundary
      onError={(error, errorInfo) => {
        console.error('[SurvivalTest] Error caught:', error, errorInfo)
      }}
    >
      <SurvivalGame />
    </SurvivalErrorBoundary>
  )
}
