/**
 * Fortnite Quiz Store
 * Zustand store for managing quiz state
 */

import { create } from 'zustand'
import type { QuizConfig, QuizQuestion, QuizResult, QuizState } from '@/types/quiz'
import { getRandomQuestions, calculateRank } from '@/data/fortnite-quiz-data'

interface QuizStore {
  // State
  state: QuizState | null
  isLoading: boolean
  
  // Actions
  startQuiz: (config: QuizConfig) => void
  answerQuestion: (answerIndex: number) => void
  nextQuestion: () => void
  skipQuestion: () => void
  finishQuiz: () => QuizResult | null
  resetQuiz: () => void
  
  // Computed
  getCurrentQuestion: () => QuizQuestion | null
  getProgress: () => { current: number; total: number; percentage: number }
  getTimeRemaining: () => number | null
}

export const useQuizStore = create<QuizStore>((set, get) => ({
  state: null,
  isLoading: false,
  
  startQuiz: (config) => {
    const questions = getRandomQuestions(config.questionCount, {
      difficulty: config.difficulty,
      category: config.category,
      chapter: config.chapter,
    })
    
    if (questions.length === 0) {
      console.error('No questions available for the selected filters')
      return
    }
    
    const now = Date.now()
    set({
      state: {
        config,
        questions,
        currentIndex: 0,
        answers: new Array(questions.length).fill(null),
        score: 0,
        startTime: now,
        questionStartTime: now,
        isComplete: false,
      }
    })
  },
  
  answerQuestion: (answerIndex) => {
    const { state } = get()
    if (!state || state.isComplete) return
    
    const currentQuestion = state.questions[state.currentIndex]
    const isCorrect = answerIndex === currentQuestion.correctAnswer
    
    const newAnswers = [...state.answers]
    newAnswers[state.currentIndex] = answerIndex
    
    set({
      state: {
        ...state,
        answers: newAnswers,
        score: isCorrect ? state.score + currentQuestion.points : state.score,
      }
    })
  },
  
  nextQuestion: () => {
    const { state } = get()
    if (!state) return
    
    const nextIndex = state.currentIndex + 1
    const isComplete = nextIndex >= state.questions.length
    
    set({
      state: {
        ...state,
        currentIndex: isComplete ? state.currentIndex : nextIndex,
        questionStartTime: Date.now(),
        isComplete,
      }
    })
  },
  
  skipQuestion: () => {
    const { state } = get()
    if (!state || state.isComplete) return
    
    const newAnswers = [...state.answers]
    newAnswers[state.currentIndex] = -1 // -1 indicates skipped
    
    const nextIndex = state.currentIndex + 1
    const isComplete = nextIndex >= state.questions.length
    
    set({
      state: {
        ...state,
        answers: newAnswers,
        currentIndex: isComplete ? state.currentIndex : nextIndex,
        questionStartTime: Date.now(),
        isComplete,
      }
    })
  },
  
  finishQuiz: () => {
    const { state } = get()
    if (!state) return null
    
    const maxScore = state.questions.reduce((sum, q) => sum + q.points, 0)
    const correctCount = state.answers.filter((a, i) => 
      a === state.questions[i].correctAnswer
    ).length
    const percentage = Math.round((state.score / maxScore) * 100)
    
    // Calculate breakdown by category
    const categoryMap = new Map<string, { correct: number; total: number }>()
    state.questions.forEach((q, i) => {
      const existing = categoryMap.get(q.category) || { correct: 0, total: 0 }
      existing.total++
      if (state.answers[i] === q.correctAnswer) {
        existing.correct++
      }
      categoryMap.set(q.category, existing)
    })
    
    const breakdown = Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category: category as QuizResult['breakdown'][0]['category'],
      correct: stats.correct,
      total: stats.total,
    }))
    
    set({
      state: {
        ...state,
        isComplete: true,
      }
    })
    
    return {
      score: state.score,
      maxScore,
      percentage,
      correctCount,
      totalQuestions: state.questions.length,
      timeSpent: Math.round((Date.now() - state.startTime) / 1000),
      difficulty: state.config.difficulty || 'mixed' as any,
      rank: calculateRank(percentage),
      breakdown,
    }
  },
  
  resetQuiz: () => {
    set({ state: null })
  },
  
  getCurrentQuestion: () => {
    const { state } = get()
    if (!state || state.isComplete) return null
    return state.questions[state.currentIndex]
  },
  
  getProgress: () => {
    const { state } = get()
    if (!state) return { current: 0, total: 0, percentage: 0 }
    return {
      current: state.currentIndex + 1,
      total: state.questions.length,
      percentage: Math.round(((state.currentIndex + 1) / state.questions.length) * 100),
    }
  },
  
  getTimeRemaining: () => {
    const { state } = get()
    if (!state || !state.config.timeLimit) return null
    
    const elapsed = (Date.now() - state.questionStartTime) / 1000
    return Math.max(0, state.config.timeLimit - elapsed)
  },
}))
