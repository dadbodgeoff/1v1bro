/**
 * useQuizRunner - Hook for managing persistent quiz during survival run
 * 
 * Features:
 * - Auto-advances to next question after answer
 * - Tracks score, correct count, streak
 * - Handles timeout (lose a life)
 * - Provides question queue management
 */

import { useState, useCallback, useRef } from 'react'
import type { QuizQuestion } from '@/types/quiz'
import { getRandomQuestions } from '@/data/fortnite-quiz-data'
import { getRandomNflQuestions } from '@/data/nfl-quiz-data'
import { getRandomMovieQuestions } from '@/data/movie-quiz-data'

export type QuizCategory = 'fortnite' | 'nfl' | 'movies' | 'mixed'

// ============================================
// Types
// ============================================

export interface QuizRunnerState {
  currentQuestion: QuizQuestion | null
  questionNumber: number
  totalAnswered: number
  correctCount: number
  totalScore: number
  streak: number
  isActive: boolean
}

export interface QuizRunnerCallbacks {
  onCorrectAnswer?: (points: number, streak: number) => void
  onWrongAnswer?: () => void
  onTimeout?: () => void
  onScoreUpdate?: (totalScore: number) => void
}

export interface QuizRunnerOptions {
  category?: QuizCategory
}

export interface UseQuizRunnerReturn {
  state: QuizRunnerState
  startQuiz: () => void
  stopQuiz: () => void
  pauseQuiz: () => void
  resumeQuiz: () => void
  handleAnswer: (answerIndex: number, isCorrect: boolean, timeRemaining: number, points: number) => void
  handleTimeout: () => void
  reset: () => void
}

// ============================================
// Constants
// ============================================

const QUESTION_POOL_SIZE = 50 // Pre-fetch this many questions
const REFILL_THRESHOLD = 10 // Refill when queue drops below this

// ============================================
// Hook
// ============================================

export function useQuizRunner(
  callbacks: QuizRunnerCallbacks = {},
  options: QuizRunnerOptions = {}
): UseQuizRunnerReturn {
  const { category = 'fortnite' } = options
  
  const [state, setState] = useState<QuizRunnerState>({
    currentQuestion: null,
    questionNumber: 0,
    totalAnswered: 0,
    correctCount: 0,
    totalScore: 0,
    streak: 0,
    isActive: false,
  })

  // Question queue
  const questionQueueRef = useRef<QuizQuestion[]>([])
  const usedQuestionIdsRef = useRef<Set<string>>(new Set())

  /**
   * Get questions based on category
   */
  const getQuestionsForCategory = useCallback((count: number): QuizQuestion[] => {
    switch (category) {
      case 'nfl':
        return getRandomNflQuestions(count)
      case 'movies':
        return getRandomMovieQuestions(count)
      case 'mixed':
        // Mix all categories
        const fortniteCount = Math.ceil(count / 3)
        const nflCount = Math.ceil(count / 3)
        const movieCount = count - fortniteCount - nflCount
        return [
          ...getRandomQuestions(fortniteCount),
          ...getRandomNflQuestions(nflCount),
          ...getRandomMovieQuestions(movieCount)
        ].sort(() => Math.random() - 0.5)
      case 'fortnite':
      default:
        return getRandomQuestions(count)
    }
  }, [category])

  /**
   * Refill question queue with unused questions
   */
  const refillQueue = useCallback(() => {
    const allQuestions = getQuestionsForCategory(QUESTION_POOL_SIZE)
    const unusedQuestions = allQuestions.filter(q => !usedQuestionIdsRef.current.has(q.id))
    
    if (unusedQuestions.length === 0) {
      // Reset if we've used all questions
      usedQuestionIdsRef.current.clear()
      questionQueueRef.current = [...allQuestions]
    } else {
      questionQueueRef.current = [...questionQueueRef.current, ...unusedQuestions]
    }
  }, [getQuestionsForCategory])

  /**
   * Get next question from queue
   */
  const getNextQuestion = useCallback((): QuizQuestion | null => {
    // Refill if running low
    if (questionQueueRef.current.length < REFILL_THRESHOLD) {
      refillQueue()
    }

    const question = questionQueueRef.current.shift()
    if (question) {
      usedQuestionIdsRef.current.add(question.id)
      return question
    }
    return null
  }, [refillQueue])

  /**
   * Advance to next question
   */
  const advanceQuestion = useCallback(() => {
    const nextQuestion = getNextQuestion()
    setState(prev => ({
      ...prev,
      currentQuestion: nextQuestion,
      questionNumber: prev.questionNumber + 1,
    }))
  }, [getNextQuestion])

  /**
   * Start the quiz
   */
  const startQuiz = useCallback(() => {
    refillQueue()
    const firstQuestion = getNextQuestion()
    
    setState({
      currentQuestion: firstQuestion,
      questionNumber: 1,
      totalAnswered: 0,
      correctCount: 0,
      totalScore: 0,
      streak: 0,
      isActive: true,
    })
  }, [refillQueue, getNextQuestion])

  /**
   * Stop the quiz
   */
  const stopQuiz = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false,
    }))
  }, [])

  /**
   * Pause the quiz (timer stops but state preserved)
   */
  const pauseQuiz = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false,
    }))
  }, [])

  /**
   * Resume the quiz
   */
  const resumeQuiz = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: true,
    }))
  }, [])

  /**
   * Handle answer submission
   */
  const handleAnswer = useCallback((
    _answerIndex: number,
    isCorrect: boolean,
    _timeRemaining: number,
    points: number
  ) => {
    setState(prev => {
      const newStreak = isCorrect ? prev.streak + 1 : 0
      const newScore = prev.totalScore + points
      
      // Fire callbacks
      if (isCorrect) {
        callbacks.onCorrectAnswer?.(points, newStreak)
      } else {
        callbacks.onWrongAnswer?.()
      }
      callbacks.onScoreUpdate?.(newScore)

      return {
        ...prev,
        totalAnswered: prev.totalAnswered + 1,
        correctCount: isCorrect ? prev.correctCount + 1 : prev.correctCount,
        totalScore: newScore,
        streak: newStreak,
      }
    })

    // Advance to next question after brief delay
    setTimeout(() => {
      advanceQuestion()
    }, 100)
  }, [callbacks, advanceQuestion])

  /**
   * Handle timeout (no answer given)
   */
  const handleTimeout = useCallback(() => {
    setState(prev => ({
      ...prev,
      totalAnswered: prev.totalAnswered + 1,
      streak: 0,
    }))

    callbacks.onTimeout?.()

    // Advance to next question
    setTimeout(() => {
      advanceQuestion()
    }, 100)
  }, [callbacks, advanceQuestion])

  /**
   * Reset everything
   */
  const reset = useCallback(() => {
    questionQueueRef.current = []
    usedQuestionIdsRef.current.clear()
    
    setState({
      currentQuestion: null,
      questionNumber: 0,
      totalAnswered: 0,
      correctCount: 0,
      totalScore: 0,
      streak: 0,
      isActive: false,
    })
  }, [])

  return {
    state,
    startQuiz,
    stopQuiz,
    pauseQuiz,
    resumeQuiz,
    handleAnswer,
    handleTimeout,
    reset,
  }
}

export default useQuizRunner
