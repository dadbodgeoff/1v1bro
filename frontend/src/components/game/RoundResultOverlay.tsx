/**
 * RoundResultOverlay - Minimal, non-intrusive result notification
 * Small toast at top of screen instead of blocking center overlay
 */

import { useEffect, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'

interface RoundResultOverlayProps {
  visible: boolean
}

// Convert letter answer (A, B, C, D) to number (1, 2, 3, 4)
function letterToNumber(letter: string | null): string {
  if (!letter) return '?'
  const index = letter.toUpperCase().charCodeAt(0) - 65 // A=0, B=1, C=2, D=3
  if (index >= 0 && index <= 3) {
    return String(index + 1)
  }
  return letter
}

export function RoundResultOverlay({ visible }: RoundResultOverlayProps) {
  const { roundResult, currentQuestion } = useGameStore()
  const [show, setShow] = useState(false)
  // Store the question options when result comes in (before question changes)
  const [savedOptions, setSavedOptions] = useState<string[] | null>(null)

  // Save options when round result arrives
  useEffect(() => {
    if (roundResult && currentQuestion?.options) {
      setSavedOptions(currentQuestion.options)
    }
  }, [roundResult, currentQuestion?.options])

  // Animate in/out
  useEffect(() => {
    if (visible && roundResult) {
      setShow(true)
    } else {
      const timer = setTimeout(() => setShow(false), 300)
      return () => clearTimeout(timer)
    }
  }, [visible, roundResult])

  if (!show || !roundResult) return null

  // Get the correct answer text from options, or fall back to number
  const getCorrectAnswerDisplay = (): string => {
    const letter = roundResult.correctAnswer
    const index = letter.toUpperCase().charCodeAt(0) - 65
    const options = savedOptions || currentQuestion?.options
    if (options && index >= 0 && index < options.length) {
      return options[index]
    }
    return letterToNumber(letter)
  }

  const localCorrect = roundResult.localAnswer === roundResult.correctAnswer
  const opponentCorrect = roundResult.opponentAnswer === roundResult.correctAnswer
  const localWon = roundResult.localScore > roundResult.opponentScore

  return (
    <div
      className={`absolute top-4 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className="bg-[#0a0a0a]/95 backdrop-blur-sm border border-white/[0.1] rounded-lg px-5 py-3 shadow-2xl">
        <div className="flex items-center gap-6">
          {/* Your result */}
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                localCorrect ? 'bg-emerald-400' : 'bg-red-400'
              }`}
            />
            <span className="text-xs text-neutral-500">You</span>
            <span
              className={`text-sm font-semibold tabular-nums ${
                localWon ? 'text-white' : 'text-neutral-400'
              }`}
            >
              +{roundResult.localScore}
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-white/[0.1]" />

          {/* Opponent result */}
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                opponentCorrect ? 'bg-emerald-400' : 'bg-red-400'
              }`}
            />
            <span className="text-xs text-neutral-500">Opp</span>
            <span
              className={`text-sm font-semibold tabular-nums ${
                !localWon && roundResult.opponentScore > 0
                  ? 'text-white'
                  : 'text-neutral-400'
              }`}
            >
              +{roundResult.opponentScore}
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-white/[0.1]" />

          {/* Correct answer */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">Answer:</span>
            <span className="text-sm text-emerald-400 font-medium truncate max-w-[120px]">
              {getCorrectAnswerDisplay()}
            </span>
          </div>

          {/* Buff reward indicator */}
          {roundResult.localReward && (
            <>
              <div className="w-px h-4 bg-white/[0.1]" />
              <BuffIndicator reward={roundResult.localReward} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Compact buff indicator for the result overlay
function BuffIndicator({ reward }: { reward: { buff_type: string; value: number; duration: number } }) {
  const config: Record<string, { icon: string; color: string }> = {
    damage_boost: { icon: '⚔️', color: 'text-orange-400' },
    speed_boost: { icon: '⚡', color: 'text-cyan-400' },
    vulnerability: { icon: '💔', color: 'text-red-400' },
    shield: { icon: '🛡️', color: 'text-blue-400' },
    invulnerable: { icon: '✨', color: 'text-yellow-400' },
  }
  
  const c = config[reward.buff_type]
  if (!c) return null
  
  const percent = Math.round(reward.value * 100)
  
  return (
    <div className="flex items-center gap-1">
      <span>{c.icon}</span>
      <span className={`text-xs font-medium ${c.color}`}>
        +{percent}% {reward.duration}s
      </span>
    </div>
  )
}
