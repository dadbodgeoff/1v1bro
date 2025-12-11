/**
 * GuestMatchSummary - Match completion screen for guest players
 * 
 * Shows match stats, preview XP earned, milestone unlocks, and CTAs
 * for playing again or signing up to save progress.
 * 
 * @module components/game/GuestMatchSummary
 * Requirements: 2.4, 5.1
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/utils/helpers'
import { type MatchResult } from '@/game/guest/GuestSessionManager'
import { type GuestMilestone } from '@/game/guest/MilestoneSystem'

export interface GuestMatchSummaryProps {
  /** Whether the summary is visible */
  visible: boolean
  /** Match result data */
  result: MatchResult
  /** Preview XP earned this match */
  previewXp: number
  /** Total preview XP accumulated in session */
  totalSessionXp: number
  /** Newly unlocked milestones */
  newMilestones: GuestMilestone[]
  /** Callback when Play Again is clicked */
  onPlayAgain: () => void
  /** Callback when dismissed */
  onDismiss?: () => void
  /** Additional CSS classes */
  className?: string
}

/**
 * Stat display component
 */
function StatItem({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="text-center">
      <div className={cn(
        'text-2xl font-bold tabular-nums',
        highlight ? 'text-emerald-400' : 'text-white'
      )}>
        {value}
      </div>
      <div className="text-xs text-neutral-500 uppercase tracking-wider">
        {label}
      </div>
    </div>
  )
}

/**
 * Milestone badge component
 */
function MilestoneBadge({ milestone }: { milestone: GuestMilestone }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        'bg-gradient-to-r from-amber-500/20 to-orange-500/20',
        'border border-amber-500/30'
      )}
    >
      <span className="text-lg">🏆</span>
      <div>
        <div className="text-amber-400 font-semibold text-sm">{milestone.name}</div>
        <div className="text-amber-400/60 text-xs">+{milestone.xpBonus} XP</div>
      </div>
    </motion.div>
  )
}

/**
 * GuestMatchSummary component
 */
export function GuestMatchSummary({
  visible,
  result,
  previewXp,
  totalSessionXp,
  newMilestones,
  onPlayAgain,
  onDismiss,
  className,
}: GuestMatchSummaryProps) {
  const navigate = useNavigate()
  const [showMilestones, setShowMilestones] = useState(false)

  // Stagger milestone animations
  useEffect(() => {
    if (visible && newMilestones.length > 0) {
      const timer = setTimeout(() => setShowMilestones(true), 800)
      return () => clearTimeout(timer)
    } else {
      setShowMilestones(false)
    }
  }, [visible, newMilestones.length])

  // Handle signup click
  const handleSignup = useCallback(() => {
    navigate('/register')
  }, [navigate])

  // Calculate K/D ratio
  const kdRatio = result.deaths > 0 
    ? (result.kills / result.deaths).toFixed(1) 
    : result.kills.toFixed(1)

  // Calculate accuracy
  const accuracy = result.questionsAnswered > 0
    ? Math.round((result.questionsCorrect / result.questionsAnswered) * 100)
    : 0

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center',
            'bg-black/90 backdrop-blur-sm',
            className
          )}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="w-full max-w-md mx-4"
          >
            {/* Result header */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
                className={cn(
                  'w-4 h-4 rounded-full mx-auto mb-3',
                  result.won ? 'bg-emerald-400' : 'bg-red-400'
                )}
              />
              <h2 className="text-3xl font-bold text-white mb-1">
                {result.won ? 'Victory!' : 'Defeat'}
              </h2>
              <div className="text-4xl font-bold text-white tabular-nums">
                {result.playerScore} <span className="text-neutral-600">-</span> {result.botScore}
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <StatItem label="Kills" value={result.kills} highlight={result.kills > 0} />
              <StatItem label="Deaths" value={result.deaths} />
              <StatItem label="K/D" value={kdRatio} />
              <StatItem label="Accuracy" value={`${accuracy}%`} />
            </div>

            {/* XP Preview */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6 p-4 bg-gradient-to-r from-purple-500/20 to-orange-500/20 rounded-xl border border-purple-500/30"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-neutral-400 text-sm">Match XP</span>
                <span className="text-white font-bold text-lg">+{previewXp}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 text-sm">Session Total</span>
                <span className="text-purple-400 font-bold text-lg">{totalSessionXp} XP</span>
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                Sign up to keep your XP and unlock rewards!
              </p>
            </motion.div>

            {/* New milestones */}
            {showMilestones && newMilestones.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6 space-y-2"
              >
                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">
                  Achievements Unlocked
                </p>
                {newMilestones.map((milestone, index) => (
                  <motion.div
                    key={milestone.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.15 }}
                  >
                    <MilestoneBadge milestone={milestone} />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* CTAs */}
            <div className="space-y-3">
              <button
                onClick={onPlayAgain}
                className={cn(
                  'w-full px-6 py-3 rounded-xl font-semibold text-sm',
                  'bg-white text-black',
                  'hover:bg-neutral-200 transition-colors',
                  'min-h-[48px]' // Touch target compliance
                )}
              >
                Play Again
              </button>
              
              <button
                onClick={handleSignup}
                className={cn(
                  'w-full px-6 py-3 rounded-xl font-semibold text-sm',
                  'bg-gradient-to-r from-purple-500 to-orange-500 text-white',
                  'hover:opacity-90 transition-opacity',
                  'min-h-[48px]' // Touch target compliance
                )}
              >
                Sign Up & Keep Progress
              </button>

              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className={cn(
                    'w-full px-6 py-3 rounded-xl font-medium text-sm',
                    'text-neutral-500 hover:text-neutral-300 transition-colors',
                    'min-h-[48px]' // Touch target compliance
                  )}
                >
                  Back to Home
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default GuestMatchSummary
