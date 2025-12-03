import { useEffect, useCallback } from 'react'
import { cn } from '@/utils/helpers'
import { Timer } from './Timer'
import { useGameStore } from '@/stores/gameStore'

interface QuestionCardProps {
  onAnswer: (answer: string, timeMs: number) => void
}

export function QuestionCard({ onAnswer }: QuestionCardProps) {
  const {
    currentQuestion,
    selectedAnswer,
    answerSubmitted,
    selectAnswer,
    submitAnswer,
  } = useGameStore()

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

  const handleTimeout = useCallback(() => {
    if (!answerSubmitted) {
      submitAnswer()
      onAnswer('', 30000) // Timeout
    }
  }, [answerSubmitted, onAnswer, submitAnswer])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (answerSubmitted) return

      const keyMap: Record<string, string> = {
        '1': 'A',
        '2': 'B',
        '3': 'C',
        '4': 'D',
        a: 'A',
        b: 'B',
        c: 'C',
        d: 'D',
      }

      const answer = keyMap[e.key.toLowerCase()]
      if (answer) {
        handleSelect(answer)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [answerSubmitted, handleSelect])

  if (!currentQuestion) return null

  const options = ['A', 'B', 'C', 'D']

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <span className="text-slate-400 font-medium">
          Question {currentQuestion.qNum} of 15
        </span>
        <Timer startTime={currentQuestion.startTime} onTimeout={handleTimeout} />
      </div>

      {/* Question */}
      <h2 className="text-xl md:text-2xl font-bold text-white mb-8">
        {currentQuestion.text}
      </h2>

      {/* Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {options.map((letter, index) => {
          const isSelected = selectedAnswer === letter

          return (
            <button
              key={letter}
              onClick={() => handleSelect(letter)}
              disabled={answerSubmitted}
              className={cn(
                'p-4 rounded-xl text-left transition-all duration-200',
                'flex items-center gap-3 min-h-[60px]',
                isSelected && 'bg-indigo-600 ring-2 ring-indigo-400',
                !isSelected && 'bg-slate-800 hover:bg-slate-700',
                answerSubmitted && !isSelected && 'opacity-50'
              )}
            >
              <span
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                  isSelected ? 'bg-white text-indigo-600' : 'bg-slate-700 text-white'
                )}
              >
                {letter}
              </span>
              <span className="text-white font-medium">
                {currentQuestion.options[index]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Keyboard hint */}
      <p className="text-slate-500 text-sm text-center mt-6">
        Press 1-4 or A-D to answer quickly
      </p>
    </div>
  )
}
