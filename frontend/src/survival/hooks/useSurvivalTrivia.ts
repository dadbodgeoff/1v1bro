/**
 * useSurvivalTrivia - Unified trivia management for survival runner
 * Handles both desktop billboards and mobile panel trivia
 */

import { useCallback, useRef, useEffect } from 'react'
import { useTriviaBillboards } from './useTriviaBillboards'
import { getRandomQuestions } from '@/data/fortnite-quiz-data'
import type { TriviaQuestion } from '@/survival/components'
import type { TriviaCategory } from '@/survival/world/TriviaQuestionProvider'
import type { SurvivalEngine } from '@/survival/engine/SurvivalEngine'

export interface TriviaStats {
  questionsAnswered: number
  questionsCorrect: number
  maxStreak: number
  currentStreak: number
  triviaScore: number
}

export interface UseSurvivalTriviaOptions {
  engine: SurvivalEngine | null
  category?: TriviaCategory
  enableBillboards: boolean
  phase: string
  onAddScore?: (points: number) => void
  onLoseLife?: () => void
  onSyncStats?: (correct: number, answered: number) => void
}

export interface UseSurvivalTriviaResult {
  // Stats
  stats: TriviaStats
  resetStats: () => void
  
  // Billboard controls (desktop)
  billboards: ReturnType<typeof useTriviaBillboards>
  
  // Mobile panel controls
  getNextQuestion: () => TriviaQuestion | null
  handleAnswer: (questionId: string, selectedIndex: number, isCorrect: boolean) => void
  handleTimeout: (questionId: string) => void
}

export function useSurvivalTrivia({
  engine,
  category = 'fortnite',
  enableBillboards,
  phase,
  onAddScore,
  onLoseLife,
  onSyncStats,
}: UseSurvivalTriviaOptions): UseSurvivalTriviaResult {
  // Track trivia stats during the run
  const statsRef = useRef<TriviaStats>({
    questionsAnswered: 0,
    questionsCorrect: 0,
    maxStreak: 0,
    currentStreak: 0,
    triviaScore: 0,
  })
  
  // Mobile question pool
  const usedQuestionsRef = useRef<Set<string>>(new Set())
  
  // Update stats helper
  const updateStats = useCallback((correct: boolean, points: number = 0) => {
    statsRef.current.questionsAnswered += 1
    
    if (correct) {
      statsRef.current.questionsCorrect += 1
      statsRef.current.currentStreak += 1
      statsRef.current.triviaScore += points
      if (statsRef.current.currentStreak > statsRef.current.maxStreak) {
        statsRef.current.maxStreak = statsRef.current.currentStreak
      }
    } else {
      statsRef.current.currentStreak = 0
    }
    
    onSyncStats?.(statsRef.current.questionsCorrect, statsRef.current.questionsAnswered)
  }, [onSyncStats])
  
  // Desktop billboards
  const billboards = useTriviaBillboards(engine, {
    category,
    enabled: enableBillboards,
    onCorrectAnswer: (points) => {
      updateStats(true, points)
      onAddScore?.(points)
    },
    onWrongAnswer: () => {
      updateStats(false)
      onLoseLife?.()
    },
    onTimeout: () => {
      updateStats(false)
      onLoseLife?.()
    },
  })
  
  // Start/stop billboards based on game phase
  useEffect(() => {
    if (!enableBillboards) return
    
    if (phase === 'running' && !billboards.isActive) {
      billboards.start()
    } else if ((phase === 'paused' || phase === 'gameover' || phase === 'ready') && billboards.isActive) {
      billboards.stop()
    }
  }, [phase, billboards, enableBillboards])
  
  // Mobile: get next question
  const getNextQuestion = useCallback((): TriviaQuestion | null => {
    const allQuestions = getRandomQuestions(50)
    const unusedQuestions = allQuestions.filter(q => !usedQuestionsRef.current.has(q.id))
    
    if (unusedQuestions.length === 0) {
      usedQuestionsRef.current.clear()
      if (allQuestions.length === 0) return null
    }
    
    const pool = unusedQuestions.length > 0 ? unusedQuestions : allQuestions
    const quizQ = pool[Math.floor(Math.random() * pool.length)]
    usedQuestionsRef.current.add(quizQ.id)
    
    return {
      id: quizQ.id,
      question: quizQ.question,
      answers: quizQ.options,
      correctIndex: quizQ.correctAnswer,
      category: quizQ.category,
      difficulty: quizQ.difficulty === 'casual' ? 'easy' : quizQ.difficulty === 'moderate' ? 'medium' : 'hard',
    }
  }, [])
  
  // Mobile: handle answer
  const handleAnswer = useCallback((_questionId: string, _selectedIndex: number, isCorrect: boolean) => {
    const points = isCorrect ? 100 + (statsRef.current.currentStreak * 25) : 0
    updateStats(isCorrect, points)
    
    if (isCorrect) {
      onAddScore?.(points)
    } else {
      onLoseLife?.()
    }
  }, [updateStats, onAddScore, onLoseLife])
  
  // Mobile: handle timeout
  const handleTimeout = useCallback((_questionId: string) => {
    updateStats(false)
    onLoseLife?.()
  }, [updateStats, onLoseLife])
  
  // Reset stats
  const resetStats = useCallback(() => {
    statsRef.current = {
      questionsAnswered: 0,
      questionsCorrect: 0,
      maxStreak: 0,
      currentStreak: 0,
      triviaScore: 0,
    }
    usedQuestionsRef.current.clear()
  }, [])
  
  return {
    stats: statsRef.current,
    resetStats,
    billboards,
    getNextQuestion,
    handleAnswer,
    handleTimeout,
  }
}
