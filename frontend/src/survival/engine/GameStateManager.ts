/**
 * GameStateManager - Handles game state and phase transitions
 * Extracted from SurvivalEngine for modularity
 * 
 * Mobile-optimized: Uses dynamic config for initial state values
 * 
 * STATE MACHINE CONTEXT:
 * This is 1 of 4 state machines that control game readiness. See docs/STATE_MACHINE_AUDIT.md
 * 
 * Related state machines:
 * - LoadingOrchestrator: Asset loading stages (loading-critical/ready/running)
 * - TransitionSystem: Visual transitions (countdown/death/respawn)
 * - useSurvivalGame: React state (isLoading/isReadyToStart)
 * 
 * Key integration points:
 * - setPhase('running') is called by RunManager after LoadingOrchestrator.isReadyForCountdown()
 * - isRunning() is checked by SurvivalEngine.fixedUpdate() along with TransitionSystem.isGamePaused()
 */

import type { SurvivalGameState, SurvivalCallbacks } from '../types/survival'
import { getSurvivalConfig } from '../config/constants'
import { WorldConfig } from '../config/WorldConfig'

export type GamePhase = 'loading' | 'ready' | 'running' | 'paused' | 'gameover'

export interface GameStateConfig {
  initialLives: number
}

export class GameStateManager {
  private state: SurvivalGameState
  private callbacks: SurvivalCallbacks
  
  // Config values (from dynamic config)
  private initialLives: number
  
  // Run tracking
  public runSeed: number = 0
  public gameTimeMs: number = 0
  public maxSpeed: number = 0
  public obstaclesCleared: number = 0
  public lastDeathObstacleType: string | null = null
  public lastDeathPosition: { x: number; z: number } | null = null

  constructor(callbacks: SurvivalCallbacks = {}) {
    this.callbacks = callbacks
    
    // Get config values
    const config = getSurvivalConfig()
    this.initialLives = config.initialLives
    
    this.state = this.createInitialState()
  }

  /**
   * Create initial game state
   */
  createInitialState(): SurvivalGameState {
    return {
      phase: 'loading',
      distance: 0,
      speed: WorldConfig.getInstance().getBaseSpeed(),
      score: 0,
      streak: 0,
      player: {
        z: 8,
        x: 0,
        targetLane: 0,
        isJumping: false,
        isSliding: false,
        lives: this.initialLives,
      },
    }
  }

  /**
   * Get current state (copy)
   */
  getState(): SurvivalGameState {
    return { ...this.state }
  }

  /**
   * Get mutable state reference (for internal updates)
   */
  getMutableState(): SurvivalGameState {
    return this.state
  }

  /**
   * Get callbacks
   */
  getCallbacks(): SurvivalCallbacks {
    return this.callbacks
  }

  /**
   * Set phase
   */
  setPhase(phase: GamePhase): void {
    this.state.phase = phase
  }

  /**
   * Get current phase
   */
  getPhase(): GamePhase {
    return this.state.phase as GamePhase
  }

  /**
   * Check if game is in running phase
   */
  isRunning(): boolean {
    return this.state.phase === 'running'
  }

  /**
   * Update speed
   */
  setSpeed(speed: number): void {
    this.state.speed = Math.round(speed)
  }

  /**
   * Add to distance
   */
  addDistance(amount: number): void {
    this.state.distance += amount
  }

  /**
   * Add to score
   */
  addScore(amount: number): void {
    this.state.score += amount
  }

  /**
   * Lose a life
   */
  loseLife(): number {
    // Don't go below 0 lives
    if (this.state.player.lives > 0) {
      this.state.player.lives--
    }
    this.state.streak = 0
    return this.state.player.lives
  }

  /**
   * Generate new run seed
   */
  generateRunSeed(): number {
    this.runSeed = Math.floor(Math.random() * 2147483647)
    return this.runSeed
  }

  /**
   * Reset run tracking
   */
  resetRunTracking(): void {
    this.gameTimeMs = 0
    this.maxSpeed = 0
    this.obstaclesCleared = 0
    this.lastDeathObstacleType = null
    this.lastDeathPosition = null
  }

  /**
   * Track max speed
   */
  updateMaxSpeed(speed: number): void {
    if (speed > this.maxSpeed) {
      this.maxSpeed = speed
    }
  }

  /**
   * Record death info
   */
  recordDeath(obstacleType: string, position: { x: number; z: number }): void {
    this.lastDeathObstacleType = obstacleType
    this.lastDeathPosition = position
  }

  /**
   * Increment obstacles cleared
   */
  incrementObstaclesCleared(): void {
    this.obstaclesCleared++
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.state = this.createInitialState()
    this.state.phase = 'ready'
    this.resetRunTracking()
  }
}
