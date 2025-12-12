/**
 * PracticeResultsScreen - Results screen with detailed stats after practice session
 *
 * **Feature: single-player-enhancement**
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 4.3, 5.5, 7.5**
 */

import { useNavigate } from 'react-router-dom'
import type { SessionStats } from '@/game/bot/SessionStatsCalculator'
import type { RewardBreakdown } from '@/game/bot/PracticeRewards'
import { getRewardMessage } from '@/game/bot/PracticeRewards'

interface PracticeResultsScreenProps {
  stats: SessionStats
  rewards: RewardBreakdown
  playerScore: number
  botScore: number
  onPlayAgain: () => void
  isGuest: boolean
}

export function PracticeResultsScreen({
  stats,
  rewards,
  playerScore,
  botScore,
  onPlayAgain,
  isGuest,
}: PracticeResultsScreenProps) {
  const navigate = useNavigate()

  const won = playerScore > botScore
  const tied = playerScore === botScore

  const rewardMessages = getRewardMessage(rewards)

  // Format duration as mm:ss
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Format effective difficulty as percentage
  const formatDifficulty = (difficulty: number): string => {
    return `${Math.round(difficulty * 100)}%`
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] px-4">
      {/* Result indicator */}
      <div
        className={`w-3 h-3 rounded-full mb-4 ${won ? 'bg-emerald-400' : tied ? 'bg-amber-400' : 'bg-red-400'}`}
      />
      <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">
        {won ? 'Victory' : tied ? 'Draw' : 'Defeat'}
      </h1>

      {/* Score */}
      <div className="text-4xl font-semibold text-white tabular-nums mb-6">
        {playerScore} <span className="text-neutral-600">-</span> {botScore}
      </div>

      {/* Personal Best notification */}
      {stats.isPersonalBest && (
        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl px-6 py-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <span className="text-amber-300 font-semibold">
              New Personal Best!
            </span>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="w-full max-w-md mb-6">
        {/* Quiz Stats */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 mb-4">
          <h3 className="text-xs text-neutral-500 uppercase tracking-wider mb-3">
            Quiz Performance
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-400 tabular-nums">
                {stats.accuracy.toFixed(1)}%
              </div>
              <div className="text-xs text-neutral-500">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 tabular-nums">
                {stats.averageAnswerTime.toFixed(1)}s
              </div>
              <div className="text-xs text-neutral-500">Avg Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400 tabular-nums">
                {stats.longestStreak}
              </div>
              <div className="text-xs text-neutral-500">Best Streak</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/[0.06] text-center">
            <span className="text-neutral-400 text-sm">
              {stats.correctAnswers} / {stats.totalQuestions} correct
            </span>
          </div>
        </div>

        {/* Combat Stats */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 mb-4">
          <h3 className="text-xs text-neutral-500 uppercase tracking-wider mb-3">
            Combat Performance
          </h3>
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-xl font-bold text-emerald-400 tabular-nums">
                {stats.kills}
              </div>
              <div className="text-xs text-neutral-500">Kills</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-red-400 tabular-nums">
                {stats.deaths}
              </div>
              <div className="text-xs text-neutral-500">Deaths</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-amber-400 tabular-nums">
                {stats.kdRatio.toFixed(1)}
              </div>
              <div className="text-xs text-neutral-500">K/D</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-orange-400 tabular-nums">
                {stats.damageDealt}
              </div>
              <div className="text-xs text-neutral-500">Damage</div>
            </div>
          </div>
        </div>

        {/* Session Info */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 mb-4">
          <h3 className="text-xs text-neutral-500 uppercase tracking-wider mb-3">
            Session Info
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-white tabular-nums">
                {formatDuration(stats.duration)}
              </div>
              <div className="text-xs text-neutral-500">Duration</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-400 tabular-nums">
                {formatDifficulty(stats.effectiveDifficulty)}
              </div>
              <div className="text-xs text-neutral-500">Final Difficulty</div>
            </div>
          </div>
        </div>

        {/* XP Rewards */}
        {rewards.totalXP > 0 && !isGuest && (
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4">
            <h3 className="text-xs text-indigo-400 uppercase tracking-wider mb-3">
              XP Earned
            </h3>
            <div className="space-y-2">
              {rewardMessages.map((msg, i) => (
                <div key={i} className="text-sm text-indigo-300">
                  {msg}
                </div>
              ))}
              <div className="pt-2 border-t border-indigo-500/20">
                <span className="text-lg font-bold text-white">
                  Total: {rewards.totalXP} XP
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Guest XP prompt */}
        {rewards.totalXP > 0 && isGuest && (
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4">
            <p className="text-white font-medium mb-1">
              You earned {rewards.totalXP} XP!
            </p>
            <p className="text-neutral-400 text-sm mb-3">
              Sign up to claim your rewards and track your progress.
            </p>
            <button
              onClick={() => navigate('/register')}
              className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Create Free Account
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onPlayAgain}
          className="px-6 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-neutral-200 transition-colors"
        >
          Play Again
        </button>
        <button
          onClick={() => navigate(isGuest ? '/' : '/dashboard')}
          className="px-6 py-2.5 bg-white/[0.06] text-neutral-300 text-sm font-medium rounded-lg border border-white/[0.1] hover:bg-white/[0.1] transition-colors"
        >
          {isGuest ? 'Back to Home' : 'Back to Menu'}
        </button>
      </div>
    </div>
  )
}
