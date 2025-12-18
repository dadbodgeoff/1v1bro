/**
 * Tests for useQuizRunner hook - Category selection functionality
 */

import { describe, it, expect, vi } from 'vitest'
import { getRandomQuestions } from '@/data/fortnite-quiz-data'
import { getRandomNflQuestions } from '@/data/nfl-quiz-data'
import { getRandomMovieQuestions } from '@/data/movie-quiz-data'
import { TriviaQuestionProvider, type TriviaCategory } from '@/survival/world/TriviaQuestionProvider'

describe('Quiz Data Sources', () => {
  describe('getRandomQuestions (Fortnite)', () => {
    it('returns the requested number of questions', () => {
      const questions = getRandomQuestions(10)
      expect(questions.length).toBe(10)
    })

    it('returns questions with required fields', () => {
      const questions = getRandomQuestions(5)
      questions.forEach(q => {
        expect(q).toHaveProperty('id')
        expect(q).toHaveProperty('question')
        expect(q).toHaveProperty('options')
        expect(q).toHaveProperty('correctAnswer')
        expect(q.options.length).toBe(4)
        expect(q.correctAnswer).toBeGreaterThanOrEqual(0)
        expect(q.correctAnswer).toBeLessThan(4)
      })
    })
  })

  describe('getRandomNflQuestions', () => {
    it('returns the requested number of questions', () => {
      const questions = getRandomNflQuestions(10)
      expect(questions.length).toBe(10)
    })

    it('returns questions with required fields', () => {
      const questions = getRandomNflQuestions(5)
      questions.forEach(q => {
        expect(q).toHaveProperty('id')
        expect(q).toHaveProperty('question')
        expect(q).toHaveProperty('options')
        expect(q).toHaveProperty('correctAnswer')
        expect(q.options.length).toBe(4)
      })
    })

    it('returns NFL-related questions', () => {
      const questions = getRandomNflQuestions(10)
      // All NFL questions should have 'nfl' in their id or category
      questions.forEach(q => {
        expect(q.id.startsWith('nfl_') || q.category === 'nfl').toBe(true)
      })
    })
  })

  describe('getRandomMovieQuestions', () => {
    it('returns the requested number of questions', () => {
      const questions = getRandomMovieQuestions(10)
      expect(questions.length).toBe(10)
    })

    it('returns questions with required fields', () => {
      const questions = getRandomMovieQuestions(5)
      questions.forEach(q => {
        expect(q).toHaveProperty('id')
        expect(q).toHaveProperty('question')
        expect(q).toHaveProperty('options')
        expect(q).toHaveProperty('correctAnswer')
        expect(q.options.length).toBe(4)
      })
    })

    it('returns movie-related questions', () => {
      const questions = getRandomMovieQuestions(10)
      // All movie questions should have 'movie' in their id
      questions.forEach(q => {
        expect(q.id.startsWith('movie_')).toBe(true)
      })
    })
  })
})

describe('TriviaQuestionProvider', () => {
  describe('category selection', () => {
    it('provides fortnite questions by default', () => {
      const provider = new TriviaQuestionProvider()
      expect(provider.getCategory()).toBe('fortnite')
      
      const question = provider.getNextQuestion()
      expect(question).not.toBeNull()
    })

    it('provides NFL questions when category is nfl', () => {
      const provider = new TriviaQuestionProvider({ category: 'nfl' })
      expect(provider.getCategory()).toBe('nfl')
      
      const question = provider.getNextQuestion()
      expect(question).not.toBeNull()
      expect(question?.id.startsWith('nfl_')).toBe(true)
    })

    it('provides movie questions when category is movies', () => {
      const provider = new TriviaQuestionProvider({ category: 'movies' })
      expect(provider.getCategory()).toBe('movies')
      
      const question = provider.getNextQuestion()
      expect(question).not.toBeNull()
      expect(question?.id.startsWith('movie_')).toBe(true)
    })

    it('provides mixed questions when category is mixed', () => {
      const provider = new TriviaQuestionProvider({ category: 'mixed', poolSize: 30 })
      expect(provider.getCategory()).toBe('mixed')
      
      // Get several questions and check we have variety
      const questions = provider.getQuestions(15)
      expect(questions.length).toBe(15)
      
      const hasFortnite = questions.some(q => q.id.startsWith('fortnite_') || (!q.id.startsWith('nfl_') && !q.id.startsWith('movie_')))
      const hasNfl = questions.some(q => q.id.startsWith('nfl_'))
      const hasMovies = questions.some(q => q.id.startsWith('movie_'))
      
      // Mixed should have at least 2 different categories
      const categoryCount = [hasFortnite, hasNfl, hasMovies].filter(Boolean).length
      expect(categoryCount).toBeGreaterThanOrEqual(2)
    })

    it('can change category dynamically', () => {
      const provider = new TriviaQuestionProvider({ category: 'fortnite' })
      expect(provider.getCategory()).toBe('fortnite')
      
      provider.setCategory('movies')
      expect(provider.getCategory()).toBe('movies')
      
      const question = provider.getNextQuestion()
      expect(question?.id.startsWith('movie_')).toBe(true)
    })
  })

  describe('question pool management', () => {
    it('tracks used questions to avoid repeats', () => {
      const provider = new TriviaQuestionProvider({ category: 'movies', poolSize: 20 })
      
      const usedIds = new Set<string>()
      for (let i = 0; i < 15; i++) {
        const q = provider.getNextQuestion()
        if (q) {
          expect(usedIds.has(q.id)).toBe(false)
          usedIds.add(q.id)
        }
      }
      
      expect(provider.getUsedCount()).toBe(15)
    })

    it('resets pool when all questions used', () => {
      const provider = new TriviaQuestionProvider({ category: 'movies', poolSize: 5 })
      
      // Use more questions than pool size to trigger reset
      for (let i = 0; i < 10; i++) {
        const q = provider.getNextQuestion()
        expect(q).not.toBeNull()
      }
    })

    it('can be reset manually', () => {
      const provider = new TriviaQuestionProvider({ category: 'nfl' })
      
      provider.getQuestions(5)
      expect(provider.getUsedCount()).toBe(5)
      
      provider.reset()
      expect(provider.getUsedCount()).toBe(0)
    })
  })
})

describe('TriviaCategory type', () => {
  it('accepts all valid categories', () => {
    const categories: TriviaCategory[] = ['fortnite', 'nfl', 'movies', 'mixed']
    
    categories.forEach(cat => {
      const provider = new TriviaQuestionProvider({ category: cat })
      expect(provider.getCategory()).toBe(cat)
    })
  })
})
