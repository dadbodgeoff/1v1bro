/**
 * TriviaBillboardSubsystem - Standalone trivia billboard system
 *
 * A modular subsystem that can be plugged into the survival engine
 * without bloating the main engine code. Handles:
 * - Billboard spawning and lifecycle
 * - Question fetching and display
 * - Keyboard input for answers (1-4)
 * - Score callbacks and sound feedback
 *
 * Audio Integration:
 * - Requires FeedbackSystem for centralized audio management
 * - Call setFeedbackSystem() after construction
 *
 * Usage:
 *   const trivia = new TriviaBillboardSubsystem(scene, { category: 'fortnite' })
 *   trivia.setFeedbackSystem(feedbackSystem)
 *   trivia.onScore((points, isCorrect) => { ... })
 *   trivia.start()
 *   // In game loop:
 *   trivia.update(delta, playerZ)
 */

import * as THREE from 'three'
import { TriviaBillboardManager, type BillboardCallbacks } from '../world/TriviaBillboardManager'
import { TriviaQuestionProvider, type TriviaCategory } from '../world/TriviaQuestionProvider'
import type { FeedbackSystem } from '../effects/FeedbackSystem'

export interface TriviaBillboardSubsystemConfig {
  category: TriviaCategory
  enabled: boolean
  timeLimit: number  // Seconds per question (default 30)
}

export interface TriviaScoreEvent {
  questionId: string
  isCorrect: boolean
  points: number
}

export interface TriviaTimeoutEvent {
  questionId: string
}

const DEFAULT_CONFIG: TriviaBillboardSubsystemConfig = {
  category: 'fortnite',
  enabled: true,
  timeLimit: 30,
}

export class TriviaBillboardSubsystem {
  private config: TriviaBillboardSubsystemConfig
  
  private manager: TriviaBillboardManager
  private questionProvider: TriviaQuestionProvider
  
  private isRunning: boolean = false
  private keyHandler: ((e: KeyboardEvent) => void) | null = null
  
  // Callbacks
  private scoreCallbacks: ((event: TriviaScoreEvent) => void)[] = []
  private timeoutCallbacks: ((event: TriviaTimeoutEvent) => void)[] = []
  private screenShakeCallback: ((intensity: number, duration: number) => void) | null = null

  constructor(scene: THREE.Scene, config: Partial<TriviaBillboardSubsystemConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    
    // Initialize question provider
    this.questionProvider = new TriviaQuestionProvider({
      category: this.config.category,
    })
    
    // Initialize billboard manager with callbacks
    const callbacks: BillboardCallbacks = {
      getNextQuestion: () => this.questionProvider.getNextQuestion(),
      onAnswer: (questionId, isCorrect, points) => this.handleAnswer(questionId, isCorrect, points),
      onTimeout: (questionId) => this.handleTimeout(questionId),
      onScreenShake: (intensity, duration) => this.screenShakeCallback?.(intensity, duration),
    }
    
    this.manager = new TriviaBillboardManager(scene, {
      timeLimit: this.config.timeLimit,
    }, callbacks)
  }
  
  /**
   * Set FeedbackSystem for centralized audio management
   * The manager handles all sounds through FeedbackSystem
   */
  setFeedbackSystem(feedbackSystem: FeedbackSystem): void {
    this.manager.setFeedbackSystem(feedbackSystem)
  }

  /**
   * Start the trivia system - begins spawning billboards
   */
  start(): void {
    if (this.isRunning) return
    
    this.isRunning = true
    this.manager.setEnabled(this.config.enabled)
    this.attachKeyboardInput()
  }

  /**
   * Stop the trivia system
   */
  stop(): void {
    if (!this.isRunning) return
    
    this.isRunning = false
    this.manager.setEnabled(false)
    this.detachKeyboardInput()
  }

  /**
   * Update - call each frame
   */
  update(delta: number, playerZ: number): void {
    if (!this.isRunning) return
    this.manager.update(delta, playerZ)
  }

  /**
   * Handle answer key input (1-4)
   */
  handleAnswerInput(key: string): boolean {
    if (!this.isRunning || !this.manager.hasActiveQuestion()) return false
    
    const keyMap: Record<string, number> = {
      '1': 0, '2': 1, '3': 2, '4': 3,
      'Digit1': 0, 'Digit2': 1, 'Digit3': 2, 'Digit4': 3,
    }
    
    const answerIndex = keyMap[key]
    if (answerIndex !== undefined) {
      return this.manager.handleAnswer(answerIndex)
    }
    
    return false
  }

  /**
   * Attach keyboard listener for answer input
   */
  private attachKeyboardInput(): void {
    if (this.keyHandler) return
    
    this.keyHandler = (e: KeyboardEvent) => {
      // Only handle 1-4 keys
      if (['1', '2', '3', '4'].includes(e.key)) {
        const handled = this.handleAnswerInput(e.key)
        if (handled) {
          e.preventDefault()
        }
      }
    }
    
    window.addEventListener('keydown', this.keyHandler)
  }

  /**
   * Detach keyboard listener
   */
  private detachKeyboardInput(): void {
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler)
      this.keyHandler = null
    }
  }

  /**
   * Handle answer from billboard manager
   * Note: Sounds are handled by TriviaBillboardManager via FeedbackSystem
   */
  private handleAnswer(questionId: string, isCorrect: boolean, points: number): void {
    const event: TriviaScoreEvent = { questionId, isCorrect, points }
    this.scoreCallbacks.forEach((cb) => cb(event))
  }

  /**
   * Handle timeout from billboard manager
   * Note: Sounds are handled by TriviaBillboardManager via FeedbackSystem
   */
  private handleTimeout(questionId: string): void {
    const event: TriviaTimeoutEvent = { questionId }
    this.timeoutCallbacks.forEach((cb) => cb(event))
  }

  // === Public API for callbacks ===

  /**
   * Register score callback
   */
  onScore(callback: (event: TriviaScoreEvent) => void): () => void {
    this.scoreCallbacks.push(callback)
    return () => {
      const idx = this.scoreCallbacks.indexOf(callback)
      if (idx >= 0) this.scoreCallbacks.splice(idx, 1)
    }
  }

  /**
   * Register timeout callback
   */
  onTimeout(callback: (event: TriviaTimeoutEvent) => void): () => void {
    this.timeoutCallbacks.push(callback)
    return () => {
      const idx = this.timeoutCallbacks.indexOf(callback)
      if (idx >= 0) this.timeoutCallbacks.splice(idx, 1)
    }
  }

  /**
   * Set screen shake callback (for integration with CameraController)
   */
  setScreenShakeCallback(callback: (intensity: number, duration: number) => void): void {
    this.screenShakeCallback = callback
  }

  // === Configuration ===

  /**
   * Set trivia category
   */
  setCategory(category: TriviaCategory): void {
    this.config.category = category
    this.questionProvider.setCategory(category)
  }

  /**
   * Enable/disable billboard spawning
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled
    this.manager.setEnabled(enabled)
  }

  /**
   * Check if there's an active question
   */
  hasActiveQuestion(): boolean {
    return this.manager.hasActiveQuestion()
  }

  /**
   * Get current question for UI display
   */
  getCurrentQuestion() {
    return this.manager.getCurrentQuestion()
  }

  /**
   * Get time remaining on current question
   */
  getTimeRemaining(): number {
    return this.manager.getTimeRemaining()
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      activeBillboards: this.manager.getActiveCount(),
      questionsUsed: this.questionProvider.getUsedCount(),
      questionsRemaining: this.questionProvider.getPoolSize(),
      category: this.config.category,
      isRunning: this.isRunning,
      timeRemaining: this.manager.getTimeRemaining(),
    }
  }

  /**
   * Reset for new game
   */
  reset(): void {
    this.stop()
    this.manager.reset()
    this.questionProvider.reset()
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.stop()
    this.manager.dispose()
    this.scoreCallbacks = []
    this.timeoutCallbacks = []
  }
}
