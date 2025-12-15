/**
 * useTriviaGate - Hook for managing Knowledge Gate trivia flow
 *
 * Handles:
 * - Fetching random questions from quiz data
 * - Managing modal visibility state
 * - Tracking answer results
 * - Returning promise resolution for game engine
 */

import { useState, useCallback, useRef } from 'react'
import type { QuizQuestion } from '@/types/quiz'
import { getRandomQuestions } from '@/data/fortnite-quiz-data'

export interface TriviaGateState {
  isOpen: boolean
  question: QuizQuestion | null
  gateId: string | null
}

export interface TriviaResult {
  isCorrect: boolean
  timeRemaining: number
  points: number
  streak: number
}

export interface UseTriviaGateReturn {
  // State
  state: TriviaGateState
  streak: number
  lastResult: TriviaResult | null

  // Actions
  triggerGate: (gateId: string) => Promise<boolean>
  handleAnswer: (answerIndex: number, isCorrect: boolean, timeRemaining: number) => void
  handleTimeout: () => void
  closeModal: () => void
}

export function useTriviaGate(): UseTriviaGateReturn {
  const [state, setState] = useState<TriviaGateState>({
    isOpen: false,
    question: null,
    gateId: null,
  })

  const [streak, setStreak] = useState(0)
  const [lastResult, setLastResult] = useState<TriviaResult | null>(null)

  // Promise resolver for async gate handling
  const resolverRef = useRef<((value: boolean) => void) | null>(null)

  // Track used question IDs to avoid repeats in same session
  const usedQuestionsRef = useRef<Set<string>>(new Set())

  /**
   * Get a random question that hasn't been used yet
   */
  const getNextQuestion = useCallback((): QuizQuestion | null => {
    // Try to get questions we haven't used
    const allQuestions = getRandomQuestions(50) // Get a large pool
    const unusedQuestions = allQuestions.filter((q) => !usedQuestionsRef.current.has(q.id))

    if (unusedQuestions.length === 0) {
      // Reset if we've used all questions
      usedQuestionsRef.current.clear()
      return allQuestions[0] || null
    }

    // Pick a random unused question
    const question = unusedQuestions[Math.floor(Math.random() * unusedQuestions.length)]
    usedQuestionsRef.current.add(question.id)
    return question
  }, [])

  /**
   * Trigger a knowledge gate - returns promise that resolves when answered
   */
  const triggerGate = useCallback(
    (gateId: string): Promise<boolean> => {
      return new Promise((resolve) => {
        const question = getNextQuestion()

        if (!question) {
          // No questions available, auto-pass
          console.warn('[useTriviaGate] No questions available, auto-passing gate')
          resolve(true)
          return
        }

        resolverRef.current = resolve

        setState({
          isOpen: true,
          question,
          gateId,
        })
      })
    },
    [getNextQuestion]
  )

  /**
   * Handle answer submission
   */
  const handleAnswer = useCallback(
    (_answerIndex: number, isCorrect: boolean, timeRemaining: number) => {
      const question = state.question
      if (!question) return

      // Calculate points with time bonus
      const basePoints = question.points * 100
      const timeBonus = Math.round((timeRemaining / 15) * 50)
      const streakBonus = isCorrect ? streak * 25 : 0
      const points = isCorrect ? basePoints + timeBonus + streakBonus : 0

      // Update streak
      const newStreak = isCorrect ? streak + 1 : 0
      setStreak(newStreak)

      // Store result
      setLastResult({
        isCorrect,
        timeRemaining,
        points,
        streak: newStreak,
      })

      // Close modal after delay (result is shown in modal)
      setTimeout(() => {
        setState({
          isOpen: false,
          question: null,
          gateId: null,
        })

        // Resolve the promise
        resolverRef.current?.(isCorrect)
        resolverRef.current = null
      }, 100) // Small delay, modal handles its own result display
    },
    [state.question, streak]
  )

  /**
   * Handle timeout (no answer given)
   */
  const handleTimeout = useCallback(() => {
    // Treat timeout as wrong answer
    setStreak(0)
    setLastResult({
      isCorrect: false,
      timeRemaining: 0,
      points: 0,
      streak: 0,
    })

    setState({
      isOpen: false,
      question: null,
      gateId: null,
    })

    // Resolve as incorrect
    resolverRef.current?.(false)
    resolverRef.current = null
  }, [])

  /**
   * Force close modal (e.g., on game reset)
   */
  const closeModal = useCallback(() => {
    setState({
      isOpen: false,
      question: null,
      gateId: null,
    })

    // Resolve as incorrect if pending
    resolverRef.current?.(false)
    resolverRef.current = null
  }, [])

  return {
    state,
    streak,
    lastResult,
    triggerGate,
    handleAnswer,
    handleTimeout,
    closeModal,
  }
}

export default useTriviaGate
