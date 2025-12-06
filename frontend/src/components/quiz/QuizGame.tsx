/**
 * QuizGame - Main gameplay interface
 */

import { useState, useCallback } from 'react'
import { QuizCard } from './QuizCard'
import { useQuizStore } from '@/stores/quizStore'

interface QuizGameProps {
  onComplete: () => void
  onBack: () => void
}

export function QuizGame({ onComplete, onBack }: QuizGameProps) {
  const {
    state,
    getCurrentQuestion,
    getProgress,
    answerQuestion,
    nextQuestion,
    skipQuestion,
    finishQuiz,
  } = useQuizStore()

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)

  const currentQuestion = getCurrentQuestion()
  const progress = getProgress()

  const handleAnswer = (index: number) => {
    if (showResult) return
    setSelectedAnswer(index)
  }

  const handleConfirm = () => {
    if (selectedAnswer === null) return
    answerQuestion(selectedAnswer)
    setShowResult(true)
  }

  const handleNext = () => {
    if (progress.current >= progress.total) {
      finishQuiz()
      onComplete()
    } else {
      nextQuestion()
      setSelectedAnswer(null)
      setShowResult(false)
    }
  }

  const handleSkip = () => {
    skipQuestion()
    setSelectedAnswer(null)
    setShowResult(false)

    if (progress.current >= progress.total) {
      finishQuiz()
      onComplete()
    }
  }

  const handleTimeUp = useCallback(() => {
    if (!showResult) {
      skipQuestion()
      setSelectedAnswer(null)
      setShowResult(false)

      if (progress.current >= progress.total) {
        finishQuiz()
        onComplete()
      }
    }
  }, [showResult, skipQuestion, progress, finishQuiz, onComplete])

  if (!state || !currentQuestion) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-500">No quiz in progress</p>
        <button
          onClick={onBack}
          className="mt-4 text-sm text-neutral-400 hover:text-white transition-colors"
        >
          Return to setup
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="text-sm text-neutral-500 hover:text-white transition-colors"
        >
          Exit
        </button>
        <div className="text-center">
          <div className="text-2xl font-semibold tabular-nums">{state.score}</div>
          <div className="text-xs text-neutral-500">Points</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-mono text-neutral-400">
            {progress.current}/{progress.total}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-white/[0.08] rounded-full mb-10 overflow-hidden">
        <div
          className="h-full bg-white/40 rounded-full transition-all duration-300"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>

      {/* Question */}
      <QuizCard
        question={currentQuestion}
        selectedAnswer={selectedAnswer}
        onAnswer={handleAnswer}
        showResult={showResult}
        timeLimit={state.config.timeLimit}
        onTimeUp={handleTimeUp}
      />

      {/* Actions */}
      <div className="flex gap-3 mt-8">
        {!showResult ? (
          <>
            <button
              onClick={handleSkip}
              className="flex-1 py-3 text-sm text-neutral-500 hover:text-white bg-white/[0.02] border border-white/[0.08] rounded-lg hover:bg-white/[0.04] transition-all"
            >
              Skip
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedAnswer === null}
              className="flex-1 py-3 text-sm font-medium bg-white text-black rounded-lg hover:bg-neutral-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Confirm
            </button>
          </>
        ) : (
          <button
            onClick={handleNext}
            className="w-full py-3 text-sm font-medium bg-white text-black rounded-lg hover:bg-neutral-200 transition-all"
          >
            {progress.current >= progress.total ? 'View Results' : 'Continue'}
          </button>
        )}
      </div>
    </div>
  )
}
