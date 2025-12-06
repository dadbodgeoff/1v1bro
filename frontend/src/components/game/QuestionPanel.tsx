/**
 * QuestionPanel - Clean, minimal quiz UI for arena integration
 * Enterprise-grade design that doesn't distract from gameplay
 */

import { useEffect, useCallback, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'

interface QuestionPanelProps {
  onAnswer: (answer: string, timeMs: number) => void
  compact?: boolean
}

export function QuestionPanel({ onAnswer }: QuestionPanelProps) {
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (answerSubmitted) return

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
  }, [answerSubmitted, handleSelect])

  if (!currentQuestion) return null

  const options = ['A', 'B', 'C', 'D']
  const timerPercent = (timeRemaining / 30) * 100

  return (
    <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-500">
          Question {currentQuestion.qNum}
        </span>
        <div className="flex items-center gap-3">
          <span
            className={`text-sm font-mono tabular-nums ${
              timeRemaining <= 5 ? 'text-red-400' : 'text-neutral-400'
            }`}
          >
            {timeRemaining}s
          </span>
        </div>
      </div>

      {/* Timer bar */}
      <div className="h-0.5 bg-white/[0.04]">
        <div
          className={`h-full transition-all duration-100 ${
            timeRemaining <= 5 ? 'bg-red-500/60' : 'bg-white/20'
          }`}
          style={{ width: `${timerPercent}%` }}
        />
      </div>

      {/* Question */}
      <div className="p-4">
        <p className="text-white text-sm leading-relaxed mb-4">
          {currentQuestion.text}
        </p>

        {/* Options */}
        <div className="space-y-2">
          {options.map((letter, index) => {
            const isSelected = selectedAnswer === letter
            const keyNumber = index + 1

            return (
              <button
                key={letter}
                onClick={() => handleSelect(letter)}
                disabled={answerSubmitted}
                className={`w-full p-3 rounded-md text-left transition-all flex items-center gap-3 ${
                  isSelected
                    ? 'bg-white/[0.12] border border-white/[0.2]'
                    : 'bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1]'
                } ${answerSubmitted && !isSelected ? 'opacity-40' : ''}`}
              >
                <span
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium ${
                    isSelected
                      ? 'bg-white text-black'
                      : 'bg-white/[0.08] text-neutral-400'
                  }`}
                >
                  {keyNumber}
                </span>
                <span className="text-sm text-neutral-200 truncate">
                  {currentQuestion.options[index]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-white/[0.06]">
        <p className="text-[10px] text-neutral-600 text-center">
          Press 1-4 to answer
        </p>
      </div>
    </div>
  )
}
