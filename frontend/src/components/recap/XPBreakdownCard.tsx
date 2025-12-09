/**
 * XPBreakdownCard - Displays XP earned with animated counter and breakdown.
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import { useState, useEffect } from 'react'
import type { XPBreakdown } from '@/types/recap'

interface XPBreakdownCardProps {
  xp: XPBreakdown
}

export function XPBreakdownCard({ xp }: XPBreakdownCardProps) {
  const [displayTotal, setDisplayTotal] = useState(0)

  // Animate XP counter (Requirements: 2.3)
  useEffect(() => {
    const duration = 1500 // 1.5 seconds
    const steps = 60
    const increment = xp.total / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= xp.total) {
        setDisplayTotal(xp.total)
        clearInterval(timer)
      } else {
        setDisplayTotal(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [xp.total])

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">XP Earned</h3>

      <div className="text-4xl font-bold text-yellow-400 mb-4">
        +{displayTotal} XP
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">Base XP</span>
          <span className="text-white">+{xp.base_xp}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Kill Bonus</span>
          <span className="text-white">+{xp.kill_bonus}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Streak Bonus</span>
          <span className="text-white">+{xp.streak_bonus}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Duration Bonus</span>
          <span className="text-white">+{xp.duration_bonus}</span>
        </div>
      </div>
    </div>
  )
}
