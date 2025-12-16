/**
 * TriviaBillboardManager - Single persistent trivia billboard that follows the player
 *
 * Features:
 * - Single billboard that stays in view (fixed relative to player)
 * - 30 second timer per question with countdown sounds
 * - Shows next question immediately after answering
 * - Always visible and in focus
 * - Screen shake on question appear
 * - Correct/wrong answer feedback
 *
 * Audio Integration:
 * - Requires FeedbackSystem for centralized sound management
 * - Call setFeedbackSystem() before use
 */

import * as THREE from 'three'
import { TriviaBillboard, type TriviaQuestion } from './TriviaBillboard'
import type { FeedbackSystem } from '../effects/FeedbackSystem'

export interface TriviaBillboardManagerConfig {
  sideOffset: number         // How far to the side (left side of track)
  heightOffset: number       // Height above track
  forwardOffset: number      // How far ahead of player
  timeLimit: number          // Seconds to answer (default 30)
}

const DEFAULT_CONFIG: TriviaBillboardManagerConfig = {
  sideOffset: 6,             // Left side of track
  heightOffset: 2.5,         // Eye level-ish
  forwardOffset: 12,         // Ahead of player so it's visible
  timeLimit: 30,             // 30 seconds per question
}

export interface BillboardCallbacks {
  onAnswer?: (questionId: string, isCorrect: boolean, points: number) => void
  onTimeout?: (questionId: string) => void
  getNextQuestion?: () => TriviaQuestion | null
  onScreenShake?: (intensity: number, duration: number) => void
}

export class TriviaBillboardManager {
  private scene: THREE.Scene
  private config: TriviaBillboardManagerConfig
  private callbacks: BillboardCallbacks
  
  // Single billboard
  private billboard: TriviaBillboard
  private enabled: boolean = false
  
  // Timer state
  private answerTimeout: ReturnType<typeof setTimeout> | null = null
  private timeRemaining: number = 0
  private timerInterval: ReturnType<typeof setInterval> | null = null
  
  // Track player position for billboard following
  private lastPlayerZ: number = 0
  
  // Audio integration - use FeedbackSystem when available for centralized sound management
  private feedbackSystem: FeedbackSystem | null = null

  constructor(
    scene: THREE.Scene,
    config: Partial<TriviaBillboardManagerConfig> = {},
    callbacks: BillboardCallbacks = {},
    feedbackSystem?: FeedbackSystem
  ) {
    this.scene = scene
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.callbacks = callbacks
    this.feedbackSystem = feedbackSystem ?? null
    
    // Create single billboard
    this.billboard = new TriviaBillboard({
      width: 5,
      height: 3.5,
    })
    this.scene.add(this.billboard.getObject())
    
    console.log('[TriviaBillboardManager] Initialized with single persistent billboard')
  }
  
  /**
   * Set FeedbackSystem for centralized audio management
   * Can be called after construction for late binding
   */
  setFeedbackSystem(feedbackSystem: FeedbackSystem): void {
    this.feedbackSystem = feedbackSystem
  }

  /**
   * Show the first/next question with sound and screen shake
   */
  showNextQuestion(): void {
    const question = this.callbacks.getNextQuestion?.()
    if (!question) {
      console.warn('[TriviaBillboardManager] No question available')
      return
    }
    
    // Position billboard relative to current player position
    const position = new THREE.Vector3(
      -this.config.sideOffset,  // Left side
      this.config.heightOffset,
      this.lastPlayerZ - this.config.forwardOffset  // Ahead of player
    )
    
    this.billboard.spawn(question, position, 'left')
    this.startTimer()
    
    // Play popup sound via FeedbackSystem
    this.feedbackSystem?.onQuizPopup()
    
    // Trigger screen shake for attention
    this.callbacks.onScreenShake?.(0.3, 200)
  }

  /**
   * Start the answer timer with countdown sounds
   */
  private startTimer(): void {
    this.clearTimer()
    
    this.timeRemaining = this.config.timeLimit
    
    // Update timer every second with countdown sounds
    this.timerInterval = setInterval(() => {
      this.timeRemaining--
      
      // Play countdown sounds via FeedbackSystem
      if (this.timeRemaining > 0) {
        if (this.timeRemaining <= 5) {
          // Urgent ticks for last 5 seconds
          this.feedbackSystem?.onQuizTickUrgent()
        } else if (this.timeRemaining <= 10) {
          // Normal ticks for 6-10 seconds
          this.feedbackSystem?.onQuizTick()
        }
      }
      
      if (this.timeRemaining <= 0) {
        this.handleTimeout()
      }
    }, 1000)
    
    // Backup timeout
    this.answerTimeout = setTimeout(() => {
      this.handleTimeout()
    }, this.config.timeLimit * 1000)
  }

  /**
   * Clear all timers
   */
  private clearTimer(): void {
    if (this.answerTimeout) {
      clearTimeout(this.answerTimeout)
      this.answerTimeout = null
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }
  }

  /**
   * Handle answer timeout with failure feedback
   */
  private handleTimeout(): void {
    this.clearTimer()
    
    const question = this.billboard.getQuestion()
    if (question) {
      this.billboard.reveal()
      
      // Play timeout/wrong sound via FeedbackSystem
      this.feedbackSystem?.onQuizWrong()
      
      // Negative feedback shake
      this.callbacks.onScreenShake?.(0.4, 250)
      
      this.callbacks.onTimeout?.(question.id)
      
      // Show next question after brief delay
      setTimeout(() => {
        if (this.enabled) {
          this.showNextQuestion()
        }
      }, 2000)
    }
  }

  /**
   * Handle player answer input with sound and visual feedback
   */
  handleAnswer(answerIndex: number): boolean {
    if (!this.billboard.getIsActive()) return false
    
    const question = this.billboard.getQuestion()
    if (!question) return false
    
    this.clearTimer()
    
    // Select and reveal
    this.billboard.selectAnswer(answerIndex)
    const result = this.billboard.reveal()
    
    if (result) {
      // Calculate points based on time remaining (faster = more points)
      const timeBonus = Math.floor((this.timeRemaining / this.config.timeLimit) * 300)
      const points = result.isCorrect ? 200 + timeBonus : 0
      
      // Play appropriate sound and trigger feedback via FeedbackSystem
      if (result.isCorrect) {
        this.feedbackSystem?.onQuizCorrect()
        // Celebratory screen shake
        this.callbacks.onScreenShake?.(0.2, 150)
      } else {
        this.feedbackSystem?.onQuizWrong()
        // Negative feedback shake
        this.callbacks.onScreenShake?.(0.5, 300)
      }
      
      this.callbacks.onAnswer?.(question.id, result.isCorrect, points)
    }
    
    // Show next question after brief delay
    setTimeout(() => {
      if (this.enabled) {
        this.showNextQuestion()
      }
    }, 1500)
    
    return true
  }

  /**
   * Main update - call each frame
   */
  update(delta: number, playerZ: number): void {
    this.lastPlayerZ = playerZ
    
    if (!this.enabled || !this.billboard.getIsActive()) return
    
    // Keep billboard in fixed position relative to player
    const targetX = -this.config.sideOffset
    const targetY = this.config.heightOffset
    const targetZ = playerZ - this.config.forwardOffset
    
    const obj = this.billboard.getObject()
    
    // Smooth follow
    obj.position.x += (targetX - obj.position.x) * delta * 3
    obj.position.y += (targetY - obj.position.y) * delta * 3
    obj.position.z += (targetZ - obj.position.z) * delta * 5  // Faster Z follow
    
    // Update billboard animation
    this.billboard.update(delta, playerZ)
  }

  /**
   * Enable and show first question
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    
    if (enabled && !this.billboard.getIsActive()) {
      this.showNextQuestion()
    } else if (!enabled) {
      this.clearTimer()
      this.billboard.despawn()
    }
  }

  /**
   * Check if there's an active question to answer
   */
  hasActiveQuestion(): boolean {
    return this.billboard.getIsActive()
  }

  /**
   * Get current question (for UI display)
   */
  getCurrentQuestion(): TriviaQuestion | null {
    return this.billboard.getQuestion()
  }

  /**
   * Get time remaining
   */
  getTimeRemaining(): number {
    return this.timeRemaining
  }

  /**
   * Get active billboard count (always 0 or 1)
   */
  getActiveCount(): number {
    return this.billboard.getIsActive() ? 1 : 0
  }

  /**
   * Reset for new game
   */
  reset(): void {
    this.clearTimer()
    this.billboard.despawn()
    this.lastPlayerZ = 0
    this.timeRemaining = 0
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.reset()
    this.scene.remove(this.billboard.getObject())
    this.billboard.dispose()
  }
}
