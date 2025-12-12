/**
 * Results Page - Post-match recap screen with comprehensive stats.
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '@/stores/gameStore'
import { useAuthStore } from '@/stores/authStore'
import { useLobbyStore } from '@/stores/lobbyStore'
import { Button } from '@/components/ui'
import {
  XPBreakdownCard,
  TierProgressCard,
  QuestionStatsCard,
  CombatStatsCard,
} from '@/components/recap'

// Auto-dismiss timeout in milliseconds (Requirements: 8.5)
const AUTO_DISMISS_TIMEOUT = 60000

export function Results() {
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.user?.id)
  const { finalResult, localPlayerName, opponentName, recap, reset: resetGame } = useGameStore()
  const { reset: resetLobby } = useLobbyStore()
  const timeoutRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  // Auto-dismiss after 60 seconds of inactivity (Requirements: 8.5)
  useEffect(() => {
    const checkInactivity = () => {
      const now = Date.now()
      if (now - lastActivityRef.current >= AUTO_DISMISS_TIMEOUT) {
        handleReturnHome()
      }
    }

    const resetActivity = () => {
      lastActivityRef.current = Date.now()
    }

    // Set up activity listeners
    window.addEventListener('mousemove', resetActivity)
    window.addEventListener('keydown', resetActivity)
    window.addEventListener('click', resetActivity)
    window.addEventListener('touchstart', resetActivity)

    // Check inactivity every 5 seconds
    timeoutRef.current = setInterval(checkInactivity, 5000)

    return () => {
      window.removeEventListener('mousemove', resetActivity)
      window.removeEventListener('keydown', resetActivity)
      window.removeEventListener('click', resetActivity)
      window.removeEventListener('touchstart', resetActivity)
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current)
      }
    }
  }, [])

  // Loading state
  if (!finalResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  const isWinner = finalResult.winnerId === userId
  const isTie = finalResult.isTie

  // Navigation handlers (Requirements: 8.3, 8.4)
  const handlePlayAgain = () => {
    resetGame()
    navigate('/dashboard')
  }

  const handleReturnHome = () => {
    resetGame()
    resetLobby()
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6 pb-8">
        {/* Winner Announcement (Requirements: 6.2) */}
        <div className="text-center py-6">
          {isTie ? (
            <>
              <h1 className="text-4xl font-bold text-yellow-400 mb-2">It's a Tie!</h1>
              <p className="text-slate-400">Great minds think alike</p>
              {recap?.won_by_time === false && (
                <p className="text-sm text-slate-500 mt-1">Scores and times were identical</p>
              )}
            </>
          ) : isWinner ? (
            <>
              <div className="text-6xl mb-2">👑</div>
              <h1 className="text-4xl font-bold text-green-400 mb-2">Victory!</h1>
              <p className="text-slate-400">Congratulations, champion!</p>
              {recap?.won_by_time && (
                <p className="text-sm text-slate-500 mt-1">Won by faster answer time</p>
              )}
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold text-red-400 mb-2">Defeat</h1>
              <p className="text-slate-400">Better luck next time!</p>
              {recap?.won_by_time && (
                <p className="text-sm text-slate-500 mt-1">Lost by answer time tiebreaker</p>
              )}
            </>
          )}
        </div>

        {/* Score Comparison (Requirements: 6.1, 6.4, 6.5) */}
        <div className="bg-slate-800 rounded-2xl p-6">
          <h2 className="text-slate-400 text-center mb-6 text-sm uppercase tracking-wide">Final Scores</h2>

          <div className="flex justify-between items-center">
            {/* Local Player */}
            <div className={`text-center flex-1 ${isWinner && !isTie ? 'relative' : ''}`}>
              {isWinner && !isTie && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-2xl">👑</div>
              )}
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-2 ${
                isWinner && !isTie ? 'bg-yellow-500/20 border-2 border-yellow-500' : 'bg-indigo-600'
              }`}>
                {(localPlayerName || 'Y')[0].toUpperCase()}
              </div>
              <p className="text-white font-medium mb-1">
                {localPlayerName || 'You'}
              </p>
              <p className="text-3xl font-bold text-indigo-400">
                {finalResult.localScore}
              </p>
              {/* Show accuracy if recap available */}
              {recap && (
                <p className="text-sm text-slate-400 mt-1">
                  {recap.question_stats.accuracy_percent.toFixed(0)}% accuracy
                </p>
              )}
            </div>

            <div className="text-4xl text-slate-600 px-4">vs</div>

            {/* Opponent */}
            <div className={`text-center flex-1 ${!isWinner && !isTie ? 'relative' : ''}`}>
              {!isWinner && !isTie && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-2xl">👑</div>
              )}
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-2 ${
                !isWinner && !isTie ? 'bg-yellow-500/20 border-2 border-yellow-500' : 'bg-red-600'
              }`}>
                {(recap?.opponent?.display_name || opponentName || 'O')[0].toUpperCase()}
              </div>
              <p className="text-white font-medium mb-1">
                {recap?.opponent?.display_name || opponentName || 'Opponent'}
              </p>
              <p className="text-3xl font-bold text-red-400">
                {finalResult.opponentScore}
              </p>
              {/* Show opponent accuracy if recap available */}
              {recap?.opponent && (
                <p className="text-sm text-slate-400 mt-1">
                  {recap.opponent.accuracy_percent.toFixed(0)}% accuracy
                </p>
              )}
            </div>
          </div>

          {/* K/D Comparison (Requirements: 6.5) */}
          {recap && (
            <div className="mt-6 pt-4 border-t border-slate-700 flex justify-around text-center">
              <div>
                <p className="text-xs text-slate-500 uppercase">Your K/D</p>
                <p className="text-lg font-bold text-indigo-400">
                  {recap.combat_stats.deaths === 0 
                    ? (recap.combat_stats.kills > 0 ? '∞' : '0.00')
                    : recap.combat_stats.kd_ratio.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase">Opponent K/D</p>
                <p className="text-lg font-bold text-red-400">
                  {recap.opponent.kd_ratio.toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Recap Cards - Only show if recap data available (Requirements: 11.2) */}
        {recap ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* XP Breakdown (Requirements: 2.1-2.4) */}
            {recap.xp_breakdown && (
              <XPBreakdownCard xp={recap.xp_breakdown} />
            )}

            {/* Tier Progress (Requirements: 3.1-3.4) */}
            {recap.tier_progress && (
              <TierProgressCard progress={recap.tier_progress} />
            )}

            {/* Question Stats (Requirements: 4.1-4.4) */}
            {recap.question_stats && (
              <QuestionStatsCard stats={recap.question_stats} />
            )}

            {/* Combat Stats (Requirements: 5.1-5.4) */}
            {recap.combat_stats && (
              <CombatStatsCard stats={recap.combat_stats} />
            )}
          </div>
        ) : (
          /* Graceful degradation - basic results only (Requirements: 11.2) */
          <div className="text-center text-slate-500 py-4">
            <p>Detailed stats unavailable</p>
          </div>
        )}

        {/* Navigation Actions (Requirements: 8.1, 8.2) */}
        <div className="flex gap-4 justify-center pt-4">
          <Button size="lg" onClick={handlePlayAgain}>
            Play Again
          </Button>
          <Button size="lg" variant="secondary" onClick={handleReturnHome}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
