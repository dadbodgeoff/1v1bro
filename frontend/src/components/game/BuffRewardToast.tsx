/**
 * BuffRewardToast - Shows quiz reward feedback as a toast notification
 * Displays what buff the player earned from answering a question
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface QuizReward {
  buff_type: 'damage_boost' | 'speed_boost' | 'vulnerability' | 'shield' | 'invulnerable'
  value: number
  duration: number
  is_correct: boolean
}

interface BuffRewardToastProps {
  reward: QuizReward | undefined
  onDismiss?: () => void
}

const BUFF_CONFIG: Record<string, { icon: string; label: string; color: string; bgColor: string }> = {
  damage_boost: {
    icon: '⚔️',
    label: 'Damage Boost',
    color: 'text-orange-400',
    bgColor: 'from-orange-500/20 to-orange-600/10',
  },
  speed_boost: {
    icon: '⚡',
    label: 'Speed Boost',
    color: 'text-cyan-400',
    bgColor: 'from-cyan-500/20 to-cyan-600/10',
  },
  vulnerability: {
    icon: '💔',
    label: 'Vulnerable',
    color: 'text-red-400',
    bgColor: 'from-red-500/20 to-red-600/10',
  },
  shield: {
    icon: '🛡️',
    label: 'Shield',
    color: 'text-blue-400',
    bgColor: 'from-blue-500/20 to-blue-600/10',
  },
  invulnerable: {
    icon: '✨',
    label: 'Invulnerable',
    color: 'text-yellow-400',
    bgColor: 'from-yellow-500/20 to-yellow-600/10',
  },
}

export function BuffRewardToast({ reward, onDismiss }: BuffRewardToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (reward) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        onDismiss?.()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [reward, onDismiss])

  if (!reward) return null

  const config = BUFF_CONFIG[reward.buff_type]
  if (!config) return null

  const valuePercent = Math.round(reward.value * 100)
  const isPositive = reward.is_correct

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div
            className={`
              px-4 py-3 rounded-lg border backdrop-blur-sm
              bg-gradient-to-r ${config.bgColor}
              border-white/10 shadow-lg
            `}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{config.icon}</span>
              <div className="flex flex-col">
                <span className={`font-semibold ${config.color}`}>
                  {isPositive ? '+' : ''}{valuePercent}% {config.label}
                </span>
                <span className="text-xs text-white/60">
                  {reward.duration}s duration
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
