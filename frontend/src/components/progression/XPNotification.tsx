/**
 * XP Notification Component - Shows XP earned after match
 * UNIFIED PROGRESSION: Real-time XP feedback
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface XPNotificationProps {
  xpAwarded: number
  previousTier: number
  newTier: number
  tierAdvanced: boolean
  calculation?: {
    base_xp: number
    kill_bonus: number
    streak_bonus: number
    duration_bonus: number
  }
  onClose?: () => void
  autoHideDuration?: number
}

export function XPNotification({
  xpAwarded,
  previousTier,
  newTier,
  tierAdvanced,
  calculation,
  onClose,
  autoHideDuration = 5000,
}: XPNotificationProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onClose?.()
    }, autoHideDuration)

    return () => clearTimeout(timer)
  }, [autoHideDuration, onClose])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-4 right-4 z-50"
        >
          <div className="bg-[#111113] border border-white/10 rounded-xl p-4 shadow-2xl min-w-[280px]">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#6366f1] flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">XP Earned!</h3>
                <p className="text-[#6366f1] text-2xl font-bold">+{xpAwarded} XP</p>
              </div>
            </div>

            {/* Calculation Breakdown */}
            {calculation && (
              <div className="bg-black/20 rounded-lg p-3 mb-3 space-y-1 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Base XP</span>
                  <span className="text-white">+{calculation.base_xp}</span>
                </div>
                {calculation.kill_bonus > 0 && (
                  <div className="flex justify-between text-gray-400">
                    <span>Kill Bonus</span>
                    <span className="text-green-400">+{calculation.kill_bonus}</span>
                  </div>
                )}
                {calculation.streak_bonus > 0 && (
                  <div className="flex justify-between text-gray-400">
                    <span>Streak Bonus</span>
                    <span className="text-orange-400">+{calculation.streak_bonus}</span>
                  </div>
                )}
                {calculation.duration_bonus > 0 && (
                  <div className="flex justify-between text-gray-400">
                    <span>Duration Bonus</span>
                    <span className="text-blue-400">+{calculation.duration_bonus}</span>
                  </div>
                )}
              </div>
            )}

            {/* Tier Progress */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Tier</span>
              <span className="text-white font-bold">{previousTier}</span>
              {tierAdvanced && (
                <>
                  <svg className="w-4 h-4 text-[#6366f1]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z" />
                  </svg>
                  <motion.span
                    initial={{ scale: 1.5, color: '#ffd700' }}
                    animate={{ scale: 1, color: '#ffffff' }}
                    transition={{ duration: 0.5 }}
                    className="font-bold"
                  >
                    {newTier}
                  </motion.span>
                  <span className="text-[#ffd700] text-xs font-semibold ml-1">TIER UP!</span>
                </>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                setVisible(false)
                onClose?.()
              }}
              className="absolute top-2 right-2 text-gray-500 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default XPNotification
