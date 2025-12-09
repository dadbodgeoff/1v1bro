/**
 * ArenaQuizPanel - Quiz panel rendered OUTSIDE the canvas as HTML/CSS
 * Positioned below the arena canvas for clear separation
 * Responsive, accessible, touch-friendly
 */

import { useEffect, useCallback, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'

interface ArenaQuizPanelProps {
  onAnswer: (answer: string, timeMs: number) => void
  visible: boolean
}

export function ArenaQuizPanel({ onAnswer, visible }: ArenaQuizPanelProps) {
  const {
    currentQuestion,
    selectedAnswer,
    answerSubmitted,
    selectAnswer,
    submitAnswer,
  } = useGameStore()

  const [timeRemaining, setTimeRemaining] = useState(30)

  // Timer countdown
  useEffect(() => {
    if (!currentQuestion || answerSubmitted) return

    const updateTimer = () => {
      const elapsed = Date.now() - currentQuestion.startTime
      const remaining = Math.max(0, Math.ceil((30000 - elapsed) / 1000))
      setTimeRemaining(remaining)

      if (remaining <= 0) {
        submitAnswer()
        onAnswer('', 30000)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 100)
    return () => clearInterval(interval)
  }, [currentQuestion, answerSubmitted, submitAnswer, onAnswer])

  const handleSelect = useCallback(
    (answer: string) => {
      if (answerSubmitted || !currentQuestion) return

      selectAnswer(answer)
      submitAnswer()

      const timeMs = Date.now() - currentQuestion.startTime
      onAnswer(answer, timeMs)
    },
    [answerSubmitted, currentQuestion, onAnswer, selectAnswer, submitAnswer]
  )

  // Keyboard shortcuts (1-4)
  useEffect(() => {
    if (answerSubmitted || !visible) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: Record<string, string> = {
        '1': 'A',
        '2': 'B',
        '3': 'C',
        '4': 'D',
      }

      const answer = keyMap[e.key]
      if (answer) handleSelect(answer)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [answerSubmitted, visible, handleSelect])

  if (!visible || !currentQuestion) {
    // Return empty placeholder to maintain layout
    return (
      <div className="w-full h-[100px] bg-[#0a0a0a] border-t border-white/[0.06]" />
    )
  }

  const options = ['A', 'B', 'C', 'D']
  const timerPercent = (timeRemaining / 30) * 100
  const isUrgent = timeRemaining <= 5
  const isWarning = timeRemaining <= 10 && timeRemaining > 5

  return (
    <div className="w-full bg-gradient-to-b from-[#12101a] to-[#0a0a0a] border-t border-purple-500/20 safe-area-bottom">
      {/* Timer bar - full width */}
      <div className="h-1 bg-white/[0.04]">
        <div
          className={`h-full transition-all duration-100 ${
            isUrgent 
              ? 'bg-red-500 animate-pulse' 
              : isWarning 
                ? 'bg-amber-500' 
                : 'bg-purple-500/70'
          }`}
          style={{ width: `${timerPercent}%` }}
        />
      </div>

      {/* Content */}
      <div className="px-4 py-3 flex flex-col lg:flex-row gap-3 lg:gap-6 items-start lg:items-center max-w-[1280px] mx-auto">
        {/* Question section */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-purple-400/70 uppercase tracking-wider">
              Q{currentQuestion.qNum}
            </span>
            <span
              className={`text-xs font-mono tabular-nums ${
                isUrgent ? 'text-red-400 animate-pulse' : isWarning ? 'text-amber-400' : 'text-white/40'
              }`}
            >
              {timeRemaining}s
            </span>
          </div>
          <p className="text-white/90 text-sm lg:text-base leading-snug">
            {currentQuestion.text}
          </p>
        </div>

        {/* Options - 2x2 grid on mobile, row on desktop */}
        <div className="w-full lg:w-auto grid grid-cols-2 lg:flex gap-2">
          {options.map((letter, index) => {
            const isSelected = selectedAnswer === letter
            const keyNumber = index + 1

            return (
              <button
                key={letter}
                onClick={() => handleSelect(letter)}
                disabled={answerSubmitted}
                className={`
                  flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all
                  min-h-[44px] lg:min-w-[160px] lg:max-w-[200px]
                  ${isSelected
                    ? 'bg-purple-600/40 border-2 border-purple-400/60 shadow-lg shadow-purple-500/20'
                    : 'bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.12]'
                  }
                  ${answerSubmitted && !isSelected ? 'opacity-40' : ''}
                  disabled:cursor-default
                `}
              >
                {/* Key badge */}
                <span
                  className={`
                    w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center shrink-0
                    ${isSelected
                      ? 'bg-white text-purple-900'
                      : 'bg-white/10 text-white/60'
                    }
                  `}
                >
                  {keyNumber}
                </span>
                {/* Option text */}
                <span className="text-sm text-white/85 truncate">
                  {currentQuestion.options[index]}
                </span>
              </button>
            )
          })}
        </div>

        {/* Waiting indicator */}
        {answerSubmitted && (
          <div className="flex items-center gap-2 text-white/40">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400/50 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400/50 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400/50 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs">waiting</span>
          </div>
        )}
      </div>
    </div>
  )
}
