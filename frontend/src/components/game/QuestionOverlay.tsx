/**
 * QuestionOverlay - HUD-style question display overlaid on arena
 * Positioned at top center, semi-transparent, doesn't block gameplay
 */

import { useEffect, useCallback, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'

interface QuestionOverlayProps {
  onAnswer: (answer: string, timeMs: number) => void
  visible: boolean
}

export function QuestionOverlay({ onAnswer, visible }: QuestionOverlayProps) {
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

  if (!visible || !currentQuestion) return null

  const options = ['A', 'B', 'C', 'D']
  const timerPercent = (timeRemaining / 30) * 100

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <div className="pointer-events-auto">
        {/* Compact card */}
        <div className="bg-black/70 backdrop-blur-sm border border-white/[0.08] rounded-lg overflow-hidden shadow-lg">
          {/* Timer bar - thin */}
          <div className="h-0.5 bg-white/[0.06]">
            <div
              className={`h-full transition-all duration-100 ${
                timeRemaining <= 5 ? 'bg-red-500' : 'bg-white/20'
              }`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>

          {/* Content - tight padding */}
          <div className="px-3 py-2">
            {/* Question with timer inline */}
            <div className="flex items-start gap-3 mb-2">
              <p className="text-white/90 text-xs leading-snug flex-1">
                {currentQuestion.text}
              </p>
              <span
                className={`text-xs font-mono tabular-nums shrink-0 ${
                  timeRemaining <= 5 ? 'text-red-400' : 'text-white/40'
                }`}
              >
                {timeRemaining}s
              </span>
            </div>

            {/* Options - single row, compact */}
            <div className="flex gap-1.5">
              {options.map((letter, index) => {
                const isSelected = selectedAnswer === letter
                const keyNumber = index + 1

                return (
                  <button
                    key={letter}
                    onClick={() => handleSelect(letter)}
                    disabled={answerSubmitted}
                    className={`flex-1 px-2 py-1.5 rounded text-left transition-all flex items-center gap-1.5 min-w-0 ${
                      isSelected
                        ? 'bg-white/20 border border-white/30'
                        : 'bg-white/[0.05] border border-white/[0.06] hover:bg-white/[0.1]'
                    } ${answerSubmitted && !isSelected ? 'opacity-30' : ''}`}
                  >
                    <span
                      className={`w-4 h-4 rounded text-[9px] font-medium flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-white text-black'
                          : 'bg-white/10 text-white/50'
                      }`}
                    >
                      {keyNumber}
                    </span>
                    <span className="text-[10px] text-white/80 truncate">
                      {currentQuestion.options[index]}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Waiting state - inline */}
            {answerSubmitted && (
              <div className="mt-1.5 flex items-center justify-center gap-1.5">
                <div className="flex gap-0.5">
                  <div className="w-1 h-1 rounded-full bg-white/30 animate-pulse" />
                  <div className="w-1 h-1 rounded-full bg-white/30 animate-pulse" style={{ animationDelay: '150ms' }} />
                  <div className="w-1 h-1 rounded-full bg-white/30 animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[10px] text-white/40">waiting</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
