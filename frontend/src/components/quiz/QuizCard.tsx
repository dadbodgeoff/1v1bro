/**
 * QuizCard - Clean question display
 */

import { useState, useEffect } from 'react'
import type { QuizQuestion } from '@/types/quiz'

interface QuizCardProps {
  question: QuizQuestion
  selectedAnswer: number | null
  onAnswer: (index: number) => void
  showResult: boolean
  timeLimit?: number
  onTimeUp?: () => void
}

export function QuizCard({
  question,
  selectedAnswer,
  onAnswer,
  showResult,
  timeLimit,
  onTimeUp,
}: QuizCardProps) {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit || 0)

  useEffect(() => {
    if (!timeLimit) return
    setTimeRemaining(timeLimit)

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          onTimeUp?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeLimit, question.id, onTimeUp])

  const getDifficultyLabel = () => {
    const labels: Record<string, string> = {
      casual: 'Easy',
      moderate: 'Medium',
      expert: 'Hard',
      legendary: 'Expert',
      impossible: 'Master',
    }
    return labels[question.difficulty] || question.difficulty
  }

  return (
    <div>
      {/* Meta row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
            {getDifficultyLabel()}
          </span>
          <span className="w-1 h-1 rounded-full bg-neutral-700" />
          <span className="text-xs text-neutral-600 capitalize">{question.category}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-mono text-neutral-500">+{question.points}</span>
          {timeLimit !== undefined && timeLimit > 0 && (
            <span
              className={`text-sm font-mono tabular-nums ${
                timeRemaining <= 5 ? 'text-red-400' : 'text-neutral-500'
              }`}
            >
              {timeRemaining}s
            </span>
          )}
        </div>
      </div>

      {/* Question */}
      <h2 className="text-xl font-medium text-white leading-relaxed mb-8">
        {question.question}
      </h2>

      {/* Options */}
      <div className="space-y-2">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === index
          const isCorrect = index === question.correctAnswer
          const showCorrect = showResult && isCorrect
          const showWrong = showResult && isSelected && !isCorrect

          let classes = 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.04] hover:border-white/[0.12]'
          if (isSelected && !showResult) {
            classes = 'bg-white/[0.08] border-white/[0.2]'
          }
          if (showCorrect) {
            classes = 'bg-emerald-500/10 border-emerald-500/30'
          }
          if (showWrong) {
            classes = 'bg-red-500/10 border-red-500/30'
          }

          return (
            <button
              key={index}
              onClick={() => !showResult && onAnswer(index)}
              disabled={showResult}
              className={`w-full p-4 rounded-lg border text-left transition-all ${classes} ${
                showResult ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-4">
                <span
                  className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-medium ${
                    showCorrect
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : showWrong
                        ? 'bg-red-500/20 text-red-400'
                        : isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-white/[0.06] text-neutral-500'
                  }`}
                >
                  {String.fromCharCode(65 + index)}
                </span>
                <span className={showResult && !isCorrect && !isSelected ? 'text-neutral-500' : 'text-white'}>
                  {option}
                </span>
                {showCorrect && (
                  <span className="ml-auto text-emerald-400 text-sm">Correct</span>
                )}
                {showWrong && (
                  <span className="ml-auto text-red-400 text-sm">Incorrect</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Explanation */}
      {showResult && (
        <div className="mt-6 p-4 bg-white/[0.02] border border-white/[0.08] rounded-lg">
          <p className="text-sm text-neutral-400 leading-relaxed">{question.explanation}</p>
          {question.chapter && question.season && (
            <p className="text-xs text-neutral-600 mt-2 font-mono">
              Chapter {question.chapter} · Season {question.season}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
