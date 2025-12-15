/**
 * SurvivalRunnerCard - Survival Runner Game Mode Card
 * 
 * Clean, enterprise-grade card for starting Survival Runner sessions.
 * Features category selection and personal best display.
 * 
 * Uses brand orange (#F97316) for all accent colors.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayerRank, useTopPlayers } from '@/survival/hooks/useLeaderboard'

// Trivia categories for survival mode
const SURVIVAL_CATEGORIES = [
  { id: 'fortnite', name: 'Fortnite', icon: '🎮', questionCount: 500 },
  { id: 'nfl', name: 'NFL', icon: '🏈', questionCount: 300 },
  { id: 'mixed', name: 'Mixed', icon: '🎲', questionCount: 800 },
]

export interface SurvivalRunnerCardProps {
  className?: string
}

export function SurvivalRunnerCard({ className = '' }: SurvivalRunnerCardProps) {
  const navigate = useNavigate()
  const { entry: playerEntry } = usePlayerRank()
  const { players: topPlayers } = useTopPlayers(3)
  const [selectedCategory, setSelectedCategory] = useState('fortnite')
  const [showOptions, setShowOptions] = useState(false)

  const handlePlay = () => {
    // Navigate to survival game with selected category
    navigate('/survival', { state: { category: selectedCategory } })
  }

  const handleViewLeaderboard = () => {
    navigate('/survival/leaderboard')
  }

  return (
    <div className={`bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden ${className}`}>
      {/* Header with gradient accent */}
      <div className="relative px-5 pt-5 pb-4">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10" />
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center border border-orange-500/20">
            <span className="text-2xl">🏃</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Survival Runner</h3>
            <p className="text-xs text-neutral-400">Endless Trivia Challenge</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-5 space-y-4">
        {/* Personal Best Stats (if exists) */}
        {playerEntry && (
          <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-lg p-3 border border-orange-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-neutral-400">Your Best</span>
              <span className="text-xs font-bold text-orange-400">Rank #{playerEntry.rank}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-white tabular-nums">{Math.floor(playerEntry.bestDistance)}m</div>
                <div className="text-[9px] text-neutral-500 uppercase">Distance</div>
              </div>
              <div>
                <div className="text-lg font-bold text-amber-400 tabular-nums">{playerEntry.bestScore.toLocaleString()}</div>
                <div className="text-[9px] text-neutral-500 uppercase">Score</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-400 tabular-nums">{playerEntry.bestCombo}x</div>
                <div className="text-[9px] text-neutral-500 uppercase">Combo</div>
              </div>
            </div>
          </div>
        )}

        {/* Options Toggle */}
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="w-full flex items-center justify-between py-2 text-sm text-neutral-400 hover:text-white transition-colors"
        >
          <span>Trivia Category</span>
          <motion.span
            animate={{ rotate: showOptions ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            ▼
          </motion.span>
        </button>

        {/* Collapsible Category Selection */}
        <AnimatePresence>
          {showOptions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-3 gap-2 pb-4">
                {SURVIVAL_CATEGORIES.map((category) => {
                  const isSelected = selectedCategory === category.id
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`
                        p-3 rounded-lg border transition-all text-center
                        ${isSelected
                          ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/10'
                          : 'border-white/[0.08] bg-white/[0.04] hover:border-white/[0.15]'
                        }
                      `}
                    >
                      <span className="text-xl block mb-1">{category.icon}</span>
                      <span className={`text-xs font-medium ${isSelected ? 'text-[var(--color-brand)]' : 'text-white'}`}>
                        {category.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary Play Button */}
        <button
          onClick={handlePlay}
          className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30"
        >
          <span className="flex items-center justify-center gap-2">
            <RunnerIcon className="w-5 h-5" />
            Start Run
          </span>
        </button>

        {/* Leaderboard Link */}
        <button
          onClick={handleViewLeaderboard}
          className="w-full py-2.5 bg-white/[0.06] border border-white/[0.08] text-neutral-300 text-xs font-medium rounded-lg hover:bg-white/[0.1] hover:text-white transition-all"
        >
          View Leaderboard
        </button>

        {/* Top Runners Preview */}
        {topPlayers.length > 0 && (
          <div className="pt-2 border-t border-white/[0.06]">
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">Top Runners</div>
            <div className="space-y-1">
              {topPlayers.slice(0, 3).map((player, index) => (
                <div key={player.userId} className="flex items-center gap-2 text-xs">
                  <span className="w-4 text-center">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </span>
                  <span className="flex-1 text-neutral-300 truncate">{player.displayName}</span>
                  <span className="text-neutral-500 tabular-nums">{Math.floor(player.bestDistance)}m</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Icon Component
function RunnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

export default SurvivalRunnerCard
