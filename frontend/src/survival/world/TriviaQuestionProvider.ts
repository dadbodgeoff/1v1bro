/**
 * TriviaQuestionProvider - Bridges quiz data sources to the billboard system
 *
 * Features:
 * - Fetches questions from fortnite/nfl quiz data
 * - Tracks used questions to avoid repeats
 * - Supports category filtering
 * - Pre-fetches question pool for performance
 */

import type { QuizQuestion } from '@/types/quiz'
import { getRandomQuestions } from '@/data/fortnite-quiz-data'
import { getRandomNflQuestions } from '@/data/nfl-quiz-data'
import type { TriviaQuestion } from './TriviaBillboard'

export type TriviaCategory = 'fortnite' | 'nfl' | 'mixed'

export interface TriviaQuestionProviderConfig {
  category: TriviaCategory
  poolSize: number
  refillThreshold: number
}

const DEFAULT_CONFIG: TriviaQuestionProviderConfig = {
  category: 'fortnite',
  poolSize: 30,
  refillThreshold: 5,
}

/**
 * Convert QuizQuestion to TriviaQuestion format for billboards
 */
function convertToTriviaQuestion(q: QuizQuestion): TriviaQuestion {
  return {
    id: q.id,
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
  }
}

export class TriviaQuestionProvider {
  private config: TriviaQuestionProviderConfig
  private questionPool: TriviaQuestion[] = []
  private usedQuestionIds: Set<string> = new Set()

  constructor(config: Partial<TriviaQuestionProviderConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.refillPool()
  }

  /**
   * Get the next question (removes from pool)
   */
  getNextQuestion(): TriviaQuestion | null {
    // Refill if running low
    if (this.questionPool.length < this.config.refillThreshold) {
      this.refillPool()
    }

    const question = this.questionPool.shift()
    if (question) {
      this.usedQuestionIds.add(question.id)
      return question
    }

    return null
  }

  /**
   * Peek at the next question without removing it
   */
  peekNextQuestion(): TriviaQuestion | null {
    if (this.questionPool.length === 0) {
      this.refillPool()
    }
    return this.questionPool[0] || null
  }

  /**
   * Get multiple questions at once
   */
  getQuestions(count: number): TriviaQuestion[] {
    const questions: TriviaQuestion[] = []
    for (let i = 0; i < count; i++) {
      const q = this.getNextQuestion()
      if (q) questions.push(q)
    }
    return questions
  }

  /**
   * Refill the question pool from data sources
   */
  private refillPool(): void {
    const { category, poolSize } = this.config

    let rawQuestions: QuizQuestion[] = []

    switch (category) {
      case 'nfl':
        rawQuestions = getRandomNflQuestions(poolSize)
        break
      case 'mixed':
        const fortniteCount = Math.ceil(poolSize / 2)
        const nflCount = Math.floor(poolSize / 2)
        rawQuestions = [
          ...getRandomQuestions(fortniteCount),
          ...getRandomNflQuestions(nflCount),
        ].sort(() => Math.random() - 0.5)
        break
      case 'fortnite':
      default:
        rawQuestions = getRandomQuestions(poolSize)
        break
    }

    // Filter out already used questions
    const unusedQuestions = rawQuestions.filter(
      (q) => !this.usedQuestionIds.has(q.id)
    )

    // If we've used all questions, reset the used set
    if (unusedQuestions.length === 0) {
      console.log('[TriviaQuestionProvider] All questions used, resetting pool')
      this.usedQuestionIds.clear()
      this.questionPool = rawQuestions.map(convertToTriviaQuestion)
    } else {
      this.questionPool = unusedQuestions.map(convertToTriviaQuestion)
    }

    console.log(
      `[TriviaQuestionProvider] Pool refilled with ${this.questionPool.length} questions`
    )
  }

  /**
   * Change the category (clears pool)
   */
  setCategory(category: TriviaCategory): void {
    if (category !== this.config.category) {
      this.config.category = category
      this.questionPool = []
      this.refillPool()
    }
  }

  /**
   * Get current category
   */
  getCategory(): TriviaCategory {
    return this.config.category
  }

  /**
   * Get pool size
   */
  getPoolSize(): number {
    return this.questionPool.length
  }

  /**
   * Get count of used questions
   */
  getUsedCount(): number {
    return this.usedQuestionIds.size
  }

  /**
   * Reset everything
   */
  reset(): void {
    this.questionPool = []
    this.usedQuestionIds.clear()
    this.refillPool()
  }
}
