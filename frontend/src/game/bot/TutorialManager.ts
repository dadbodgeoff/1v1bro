/**
 * TutorialManager - Controls the first-time tutorial flow
 *
 * **Feature: single-player-enhancement**
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**
 */

// Tutorial steps in order
export type TutorialStep = 'movement' | 'combat' | 'quiz' | 'complete'

const TUTORIAL_STEPS: TutorialStep[] = ['movement', 'combat', 'quiz', 'complete']

// LocalStorage key for tutorial completion
const TUTORIAL_STORAGE_KEY = 'practice_tutorial_completed'

// Step content for display
export interface TutorialStepContent {
  title: string
  description: string
  instructions: string[]
  completionHint: string
}

export const TUTORIAL_CONTENT: Record<
  Exclude<TutorialStep, 'complete'>,
  TutorialStepContent
> = {
  movement: {
    title: 'Movement Controls',
    description: 'Learn how to move your character around the arena.',
    instructions: [
      'Use WASD or Arrow keys to move',
      'Move in all four directions',
      'Practice dodging by moving quickly',
    ],
    completionHint: 'Move around the arena to continue',
  },
  combat: {
    title: 'Combat Mechanics',
    description: 'Learn how to aim and shoot at your opponent.',
    instructions: [
      'Move your mouse to aim',
      'Click to shoot projectiles',
      'Hit the bot to deal damage',
    ],
    completionHint: 'Hit the bot once to continue',
  },
  quiz: {
    title: 'Quiz Answering',
    description: 'Learn how to answer trivia questions.',
    instructions: [
      'Questions appear at the top of the screen',
      'Click an answer or press 1-4 keys',
      'Answer quickly for more points',
    ],
    completionHint: 'Answer the practice question to continue',
  },
}

/**
 * Check if tutorial is completed (from localStorage)
 * **Property 11: Tutorial completion persistence**
 * **Validates: Requirements 6.5**
 */
export function isTutorialCompleted(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(TUTORIAL_STORAGE_KEY) === 'true'
}

/**
 * Mark tutorial as completed (in localStorage)
 * **Property 11: Tutorial completion persistence**
 * **Validates: Requirements 6.5**
 */
export function markTutorialCompleted(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true')
}

/**
 * Reset tutorial completion (for testing)
 */
export function resetTutorialCompletion(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TUTORIAL_STORAGE_KEY)
}

/**
 * TutorialManager class
 */
export class TutorialManager {
  private currentStepIndex = 0
  private completed = false
  private skipped = false

  constructor() {
    // Check if already completed
    this.completed = isTutorialCompleted()
  }

  /**
   * Check if tutorial should be shown
   * **Validates: Requirements 6.1**
   */
  shouldShowTutorial(): boolean {
    return !this.completed && !this.skipped
  }

  /**
   * Get the current tutorial step
   */
  getCurrentStep(): TutorialStep {
    if (this.completed || this.skipped) {
      return 'complete'
    }
    return TUTORIAL_STEPS[this.currentStepIndex]
  }

  /**
   * Get content for the current step
   */
  getCurrentStepContent(): TutorialStepContent | null {
    const step = this.getCurrentStep()
    if (step === 'complete') return null
    return TUTORIAL_CONTENT[step]
  }

  /**
   * Get the step number (1-based)
   */
  getStepNumber(): number {
    return this.currentStepIndex + 1
  }

  /**
   * Get total number of steps (excluding 'complete')
   */
  getTotalSteps(): number {
    return TUTORIAL_STEPS.length - 1 // Exclude 'complete'
  }

  /**
   * Advance to the next step
   * **Validates: Requirements 6.2, 6.3, 6.4**
   */
  advanceStep(): void {
    if (this.currentStepIndex < TUTORIAL_STEPS.length - 1) {
      this.currentStepIndex++

      // Check if we've reached 'complete'
      if (this.getCurrentStep() === 'complete') {
        this.completeTutorial()
      }
    }
  }

  /**
   * Skip the tutorial
   * **Validates: Requirements 6.6**
   */
  skipTutorial(): void {
    this.skipped = true
  }

  /**
   * Complete the tutorial and persist
   * **Validates: Requirements 6.5**
   */
  completeTutorial(): void {
    this.completed = true
    markTutorialCompleted()
  }

  /**
   * Check if tutorial is completed
   */
  isCompleted(): boolean {
    return this.completed
  }

  /**
   * Check if tutorial was skipped
   */
  isSkipped(): boolean {
    return this.skipped
  }

  /**
   * Reset the tutorial (for testing or replay)
   */
  reset(): void {
    this.currentStepIndex = 0
    this.completed = false
    this.skipped = false
  }
}
