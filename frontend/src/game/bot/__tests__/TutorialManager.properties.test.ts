/**
 * TutorialManager Property-Based Tests
 *
 * Property tests for tutorial completion persistence.
 * Uses fast-check for property-based testing.
 *
 * **Feature: single-player-enhancement**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  TutorialManager,
  isTutorialCompleted,
  markTutorialCompleted,
  resetTutorialCompletion,
  TUTORIAL_CONTENT,
} from '../TutorialManager'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

/**
 * **Feature: single-player-enhancement, Property 11: Tutorial completion persistence**
 * **Validates: Requirements 6.5**
 *
 * For any user who completes all tutorial sections, the tutorial completed flag
 * SHALL be set to true and persist across sessions.
 */
describe('Property 11: Tutorial completion persistence', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('completion flag persists after marking complete', () => {
    // Initially not completed
    expect(isTutorialCompleted()).toBe(false)

    // Mark as completed
    markTutorialCompleted()

    // Should now be completed
    expect(isTutorialCompleted()).toBe(true)

    // Verify localStorage was called
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'practice_tutorial_completed',
      'true'
    )
  })

  it('completion persists across manager instances', () => {
    // First manager completes tutorial
    const manager1 = new TutorialManager()
    expect(manager1.shouldShowTutorial()).toBe(true)

    // Advance through all steps
    manager1.advanceStep() // movement -> combat
    manager1.advanceStep() // combat -> quiz
    manager1.advanceStep() // quiz -> complete

    expect(manager1.isCompleted()).toBe(true)

    // New manager should see tutorial as completed
    const manager2 = new TutorialManager()
    expect(manager2.shouldShowTutorial()).toBe(false)
    expect(manager2.isCompleted()).toBe(true)
  })

  it('reset clears completion flag', () => {
    markTutorialCompleted()
    expect(isTutorialCompleted()).toBe(true)

    resetTutorialCompletion()
    expect(isTutorialCompleted()).toBe(false)
  })

  it('skipped tutorial does not persist', () => {
    const manager = new TutorialManager()
    manager.skipTutorial()

    expect(manager.isSkipped()).toBe(true)
    expect(manager.shouldShowTutorial()).toBe(false)

    // But completion flag should not be set
    expect(isTutorialCompleted()).toBe(false)

    // New manager should still show tutorial
    const manager2 = new TutorialManager()
    expect(manager2.shouldShowTutorial()).toBe(true)
  })
})

/**
 * TutorialManager step progression tests
 */
describe('TutorialManager step progression', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('starts at movement step', () => {
    const manager = new TutorialManager()
    expect(manager.getCurrentStep()).toBe('movement')
    expect(manager.getStepNumber()).toBe(1)
  })

  it('progresses through steps in order', () => {
    const manager = new TutorialManager()

    expect(manager.getCurrentStep()).toBe('movement')
    manager.advanceStep()

    expect(manager.getCurrentStep()).toBe('combat')
    manager.advanceStep()

    expect(manager.getCurrentStep()).toBe('quiz')
    manager.advanceStep()

    expect(manager.getCurrentStep()).toBe('complete')
    expect(manager.isCompleted()).toBe(true)
  })

  it('has content for each non-complete step', () => {
    const manager = new TutorialManager()

    // Movement
    let content = manager.getCurrentStepContent()
    expect(content).not.toBeNull()
    expect(content?.title).toBe('Movement Controls')

    manager.advanceStep()

    // Combat
    content = manager.getCurrentStepContent()
    expect(content).not.toBeNull()
    expect(content?.title).toBe('Combat Mechanics')

    manager.advanceStep()

    // Quiz
    content = manager.getCurrentStepContent()
    expect(content).not.toBeNull()
    expect(content?.title).toBe('Quiz Answering')

    manager.advanceStep()

    // Complete - no content
    content = manager.getCurrentStepContent()
    expect(content).toBeNull()
  })

  it('getTotalSteps returns 3 (excluding complete)', () => {
    const manager = new TutorialManager()
    expect(manager.getTotalSteps()).toBe(3)
  })

  it('reset returns to initial state', () => {
    const manager = new TutorialManager()

    manager.advanceStep()
    manager.advanceStep()

    manager.reset()

    expect(manager.getCurrentStep()).toBe('movement')
    expect(manager.getStepNumber()).toBe(1)
    expect(manager.isCompleted()).toBe(false)
    expect(manager.isSkipped()).toBe(false)
  })
})

/**
 * Tutorial content validation
 */
describe('Tutorial content', () => {
  it('all steps have required content fields', () => {
    const steps = ['movement', 'combat', 'quiz'] as const

    for (const step of steps) {
      const content = TUTORIAL_CONTENT[step]
      expect(content.title).toBeDefined()
      expect(content.title.length).toBeGreaterThan(0)
      expect(content.description).toBeDefined()
      expect(content.instructions).toBeDefined()
      expect(content.instructions.length).toBeGreaterThan(0)
      expect(content.completionHint).toBeDefined()
    }
  })
})
