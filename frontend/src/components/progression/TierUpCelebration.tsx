/**
 * Tier Up Celebration Component - Shows when player advances a tier
 * UNIFIED PROGRESSION: Tier advancement celebration
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TierUpCelebrationProps {
  previousTier: number
  newTier: number
  tiersGained: number
  newClaimableRewards: number[]
  onClose?: () => void
  autoHideDuration?: number
}

export function TierUpCelebration({
  previousTier,
  newTier,
  tiersGained,
  newClaimableRewards,
  onClose,
  autoHideDuration = 6000,
}: TierUpCelebrationProps) {
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => {
            setVisible(false)
            onClose?.()
          }}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] border-2 border-[#ffd700]/50 rounded-2xl p-8 shadow-2xl text-center max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Crown Icon */}
            <motion.div
              initial={{ y: -20, rotate: -10 }}
              animate={{ y: 0, rotate: 0 }}
              transition={{ type: 'spring', damping: 10, delay: 0.2 }}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#ffd700] to-[#ff8c00] flex items-center justify-center"
            >
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z" />
              </svg>
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-[#ffd700] text-3xl font-bold mb-2"
            >
              TIER UP!
            </motion.h2>

            {/* Tier Display */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-4 mb-6"
            >
              <span className="text-gray-400 text-4xl font-bold">{previousTier}</span>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <svg className="w-8 h-8 text-[#ffd700]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z" />
                </svg>
              </motion.div>
              <motion.span
                initial={{ scale: 1.5 }}
                animate={{ scale: [1.5, 1.2, 1.3, 1] }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="text-white text-5xl font-bold"
              >
                {newTier}
              </motion.span>
            </motion.div>

            {/* Tiers Gained */}
            {tiersGained > 1 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-[#00d9ff] text-lg mb-4"
              >
                +{tiersGained} Tiers Gained!
              </motion.p>
            )}

            {/* New Rewards */}
            {newClaimableRewards.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-black/30 rounded-lg p-4 mb-4"
              >
                <p className="text-gray-400 text-sm mb-2">New Rewards Available!</p>
                <div className="flex justify-center gap-2 flex-wrap">
                  {newClaimableRewards.slice(0, 5).map((tier) => (
                    <span
                      key={tier}
                      className="bg-[#ffd700]/20 text-[#ffd700] px-3 py-1 rounded-full text-sm font-semibold"
                    >
                      Tier {tier}
                    </span>
                  ))}
                  {newClaimableRewards.length > 5 && (
                    <span className="text-gray-400 text-sm">
                      +{newClaimableRewards.length - 5} more
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {/* CTA Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              onClick={() => {
                setVisible(false)
                onClose?.()
              }}
              className="bg-gradient-to-r from-[#ffd700] to-[#ff8c00] text-black font-bold px-8 py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              Awesome!
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default TierUpCelebration
