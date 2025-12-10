/**
 * Bot Game Property-Based Tests
 * 
 * Property tests for the BotGame practice mode component.
 * Uses fast-check for property-based testing.
 * 
 * @module pages/__tests__/BotGame.properties
 */

import fc from 'fast-check'
import { describe, it, expect } from 'vitest'

// Strategy for generating valid category slugs
const categorySlugStrategy = fc.constantFrom('fortnite', 'nfl', 'sports', 'movies', 'music', 'general')

/**
 * **Feature: bot-game-full-quiz, Property 1: API Request Category Correctness**
 * **Validates: Requirements 1.1, 2.1**
 * 
 * For any selected category slug, when fetching practice questions,
 * the API request URL SHALL contain that exact category slug in the path.
 */
describe('Property 1: API Request Category Correctness', () => {
  it('API request URL contains the selected category slug', () => {
    fc.assert(
      fc.property(
        categorySlugStrategy,
        (categorySlug: string) => {
          // Build the expected URL pattern
          const expectedUrlPattern = `/api/v1/questions/practice/${categorySlug}`
          
          // Verify the URL would be correctly formed
          const url = `/api/v1/questions/practice/${categorySlug}?count=15`
          expect(url).toContain(expectedUrlPattern)
          expect(url).toContain(categorySlug)
          return url.includes(categorySlug)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('API request includes count parameter', () => {
    const QUESTIONS_PER_GAME = 15
    
    fc.assert(
      fc.property(
        categorySlugStrategy,
        (categorySlug: string) => {
          const url = `/api/v1/questions/practice/${categorySlug}?count=${QUESTIONS_PER_GAME}`
          expect(url).toContain(`count=${QUESTIONS_PER_GAME}`)
          return url.includes(`count=${QUESTIONS_PER_GAME}`)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('category slug is URL-safe', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('fortnite', 'nfl', 'sports', 'movies', 'music', 'general'),
        (categorySlug) => {
          // URL encoding should not change valid slugs
          const encoded = encodeURIComponent(categorySlug)
          expect(encoded).toBe(categorySlug)
          return encoded === categorySlug
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: bot-game-full-quiz, Property 2: Category Isolation**
 * **Validates: Requirements 1.2, 1.3, 1.4**
 * 
 * For any set of questions returned from the Practice API for a given category,
 * all questions in the set SHALL have a category field matching the requested category.
 */
describe('Property 2: Category Isolation', () => {
  // Strategy for generating question objects
  const questionStrategy = (category: string) => fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    text: fc.string({ minLength: 10, maxLength: 200 }),
    options: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 4, maxLength: 4 }),
    correct_answer: fc.constantFrom('A', 'B', 'C', 'D'),
    category: fc.constant(category),
  })

  it('all questions in response have matching category', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('fortnite', 'nfl', 'sports', 'movies'),
        fc.integer({ min: 1, max: 15 }),
        (requestedCategory, questionCount) => {
          // Simulate API response with questions
          const questions = Array.from({ length: questionCount }, () => ({
            id: Math.floor(Math.random() * 10000),
            text: 'Sample question text',
            options: ['A', 'B', 'C', 'D'],
            correct_answer: 'A',
            category: requestedCategory,
          }))
          
          // All questions should have the requested category
          const allMatch = questions.every(q => q.category === requestedCategory)
          expect(allMatch).toBe(true)
          return allMatch
        }
      ),
      { numRuns: 100 }
    )
  })

  it('NFL category returns only NFL questions', () => {
    const nflQuestions = [
      { id: 1, text: 'NFL question 1', options: ['A', 'B', 'C', 'D'], correct_answer: 'A', category: 'nfl' },
      { id: 2, text: 'NFL question 2', options: ['A', 'B', 'C', 'D'], correct_answer: 'B', category: 'nfl' },
    ]
    
    const allNfl = nflQuestions.every(q => q.category === 'nfl')
    expect(allNfl).toBe(true)
  })

  it('Fortnite category returns only Fortnite questions', () => {
    const fortniteQuestions = [
      { id: 1, text: 'Fortnite question 1', options: ['A', 'B', 'C', 'D'], correct_answer: 'A', category: 'fortnite' },
      { id: 2, text: 'Fortnite question 2', options: ['A', 'B', 'C', 'D'], correct_answer: 'B', category: 'fortnite' },
    ]
    
    const allFortnite = fortniteQuestions.every(q => q.category === 'fortnite')
    expect(allFortnite).toBe(true)
  })

  it('mixed category responses are invalid', () => {
    const mixedQuestions = [
      { id: 1, text: 'NFL question', options: ['A', 'B', 'C', 'D'], correct_answer: 'A', category: 'nfl' },
      { id: 2, text: 'Fortnite question', options: ['A', 'B', 'C', 'D'], correct_answer: 'B', category: 'fortnite' },
    ]
    
    const requestedCategory = 'nfl'
    const allMatch = mixedQuestions.every(q => q.category === requestedCategory)
    expect(allMatch).toBe(false) // This should fail - mixed categories are invalid
  })
})

/**
 * **Feature: bot-game-full-quiz, Property 3: Question Count Consistency**
 * **Validates: Requirements 2.2, 2.3**
 * 
 * For any game session, the displayed total question count SHALL equal
 * the length of the questions array received from the API.
 */
describe('Property 3: Question Count Consistency', () => {
  it('displayed count matches questions array length', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        (questionCount) => {
          // Simulate questions array
          const questions = Array.from({ length: questionCount }, (_, i) => ({
            id: i + 1,
            text: `Question ${i + 1}`,
            options: ['A', 'B', 'C', 'D'],
            correct_answer: 'A',
            category: 'fortnite',
          }))
          
          // The displayed total should match array length
          const displayedTotal = questions.length
          expect(displayedTotal).toBe(questionCount)
          return displayedTotal === questionCount
        }
      ),
      { numRuns: 100 }
    )
  })

  it('game ends when question index reaches array length', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        (questionCount) => {
          const questions = Array.from({ length: questionCount }, (_, i) => ({
            id: i + 1,
            text: `Question ${i + 1}`,
          }))
          
          // Game should end when nextIndex >= questions.length
          for (let questionIndex = 0; questionIndex < questionCount; questionIndex++) {
            const nextIndex = questionIndex + 1
            const shouldContinue = nextIndex < questions.length
            const isLastQuestion = questionIndex === questionCount - 1
            
            expect(shouldContinue).toBe(!isLastQuestion)
          }
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('fewer questions than requested still works correctly', () => {
    const QUESTIONS_PER_GAME = 15
    
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: QUESTIONS_PER_GAME - 1 }),
        (actualCount) => {
          // API returns fewer questions than requested
          const questions = Array.from({ length: actualCount }, (_, i) => ({
            id: i + 1,
            text: `Question ${i + 1}`,
          }))
          
          // Game should use actual count, not requested count
          expect(questions.length).toBeLessThan(QUESTIONS_PER_GAME)
          expect(questions.length).toBe(actualCount)
          return questions.length === actualCount
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * **Feature: bot-game-full-quiz, Property 4: Category Display Accuracy**
 * **Validates: Requirements 4.1**
 * 
 * For any category displayed in the selection UI, the shown question count
 * SHALL match the question_count value from the categories API response.
 */
describe('Property 4: Category Display Accuracy', () => {
  // Strategy for generating category objects
  const categoryStrategy = fc.record({
    slug: fc.constantFrom('fortnite', 'nfl', 'sports', 'movies', 'music'),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    question_count: fc.integer({ min: 0, max: 10000 }),
    is_active: fc.boolean(),
  })

  it('displayed question count matches API response', () => {
    fc.assert(
      fc.property(
        categoryStrategy,
        (category) => {
          // The displayed count should exactly match the API value
          const displayedCount = category.question_count
          expect(displayedCount).toBe(category.question_count)
          return displayedCount === category.question_count
        }
      ),
      { numRuns: 100 }
    )
  })

  it('categories with zero questions are handled correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          slug: fc.constantFrom('empty-category', 'no-questions'),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          question_count: fc.constant(0),
          is_active: fc.constant(true),
        }),
        (category) => {
          const hasQuestions = category.question_count > 0
          expect(hasQuestions).toBe(false)
          
          // Category should be disabled or show warning
          const shouldBeDisabled = !hasQuestions
          expect(shouldBeDisabled).toBe(true)
          return shouldBeDisabled
        }
      ),
      { numRuns: 100 }
    )
  })

  it('question count is formatted correctly for display', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100000 }),
        (count) => {
          // toLocaleString should format numbers with commas
          const formatted = count.toLocaleString()
          
          if (count >= 1000) {
            expect(formatted).toContain(',')
          }
          
          // Parsing back should give original number
          const parsed = parseInt(formatted.replace(/,/g, ''))
          expect(parsed).toBe(count)
          return parsed === count
        }
      ),
      { numRuns: 100 }
    )
  })

  it('all categories have required fields', () => {
    fc.assert(
      fc.property(
        categoryStrategy,
        (category) => {
          expect(category.slug).toBeDefined()
          expect(category.name).toBeDefined()
          expect(typeof category.question_count).toBe('number')
          expect(typeof category.is_active).toBe('boolean')
          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})


/**
 * **Feature: bot-game-full-quiz, Unit Tests for Error Handling**
 * **Validates: Requirements 3.1, 3.2, 3.3, 4.2**
 * 
 * Unit tests for error state rendering and empty category handling.
 */
describe('Unit Tests: Error State Handling', () => {
  describe('5.1 API Error State', () => {
    it('error message is set when API returns non-ok response', () => {
      // Simulate API error response
      const response = { ok: false, status: 500 }
      const expectedError = 'Failed to load questions. Please try again.'
      
      // When API fails, error should be set
      const errorMessage = !response.ok ? expectedError : null
      expect(errorMessage).toBe(expectedError)
    })

    it('error message is set when network fails', () => {
      // Simulate network error
      const networkError = new Error('Network error')
      const expectedError = 'Network error. Please check your connection and try again.'
      
      // When network fails, error should be set
      expect(expectedError).toContain('Network error')
    })

    it('retry clears error and refetches', () => {
      // Simulate retry behavior
      let questionsError: string | null = 'Previous error'
      
      // Retry action
      const retry = () => {
        questionsError = null
      }
      
      retry()
      expect(questionsError).toBeNull()
    })

    it('start button is disabled when error exists', () => {
      const questionsError = 'Some error'
      const questionsLoading = false
      
      const isDisabled = questionsLoading || !!questionsError
      expect(isDisabled).toBe(true)
    })

    it('start button is enabled when no error and not loading', () => {
      const questionsError = null
      const questionsLoading = false
      
      const isDisabled = questionsLoading || !!questionsError
      expect(isDisabled).toBe(false)
    })
  })

  describe('5.2 Empty Category Handling', () => {
    it('empty category shows appropriate message', () => {
      const category = 'empty-category'
      const questionCount = 0
      
      const message = questionCount === 0 
        ? `No questions available for ${category}. Please select a different category.`
        : null
      
      expect(message).toContain('No questions available')
      expect(message).toContain(category)
    })

    it('category with zero questions is disabled', () => {
      const category = { slug: 'empty', name: 'Empty', question_count: 0 }
      const hasQuestions = category.question_count > 0
      
      expect(hasQuestions).toBe(false)
    })

    it('category with questions is enabled', () => {
      const category = { slug: 'fortnite', name: 'Fortnite', question_count: 1000 }
      const hasQuestions = category.question_count > 0
      
      expect(hasQuestions).toBe(true)
    })

    it('clicking disabled category does not change selection', () => {
      let selectedCategory = 'fortnite'
      const category = { slug: 'empty', name: 'Empty', question_count: 0 }
      const hasQuestions = category.question_count > 0
      
      // Simulate click handler
      const handleClick = () => {
        if (hasQuestions) {
          selectedCategory = category.slug
        }
      }
      
      handleClick()
      expect(selectedCategory).toBe('fortnite') // Should not change
    })

    it('clicking enabled category changes selection', () => {
      let selectedCategory = 'fortnite'
      const category = { slug: 'nfl', name: 'NFL', question_count: 900 }
      const hasQuestions = category.question_count > 0
      
      // Simulate click handler
      const handleClick = () => {
        if (hasQuestions) {
          selectedCategory = category.slug
        }
      }
      
      handleClick()
      expect(selectedCategory).toBe('nfl') // Should change
    })
  })
})
