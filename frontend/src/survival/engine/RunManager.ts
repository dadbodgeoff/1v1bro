/**
 * RunManager - Handles run lifecycle (start, restart, game over, submit)
 * Extracted from SurvivalEngine for modularity
 * 
 * Responsibilities:
 * - Starting new runs with countdown
 * - Quick restart functionality
 * - Game over handling and run submission
 * - Run state coordination
 */

import type { SurvivalRunData } from '../types/survival'
import type { SurvivalRunResponse } from '../services/SurvivalApiService'
import { survivalApi } from '../services/SurvivalApiService'
import type { GameStateManager } from './GameStateManager'
import type { ObstacleManager } from './ObstacleManager'
import type { CollectibleManager } from './CollectibleManager'
import type { CollectibleOrchestrator } from '../orchestrator/CollectibleOrchestrator'
import type { TrackManager } from './TrackManager'
import type { PhysicsController } from './PhysicsController'
import type { CollisionSystem } from './CollisionSystem'
import type { InputBuffer } from './InputBuffer'
import type { PlayerController } from './PlayerController'
import type { CameraController } from './CameraController'
import type { PerformanceMonitor } from './PerformanceMonitor'
import type { ParticleSystem } from '../effects/ParticleSystem'
import type { TransitionSystem } from '../effects/TransitionSystem'
import type { ComboSystem } from '../systems/ComboSystem'
import type { InputRecorder } from '../systems/InputRecorder'
import type { MilestoneSystem } from '../systems/MilestoneSystem'
import type { AchievementSystem } from '../systems/AchievementSystem'
import type { GhostManager } from './GhostManager'
import type { LoadingOrchestrator } from '../core/LoadingOrchestrator'
import type { SurvivalRenderer } from '../renderer/SurvivalRenderer'
import type { GameLoop } from './GameLoop'
import type { FixedUpdateLoop } from './FixedUpdateLoop'
import { WorldConfig } from '../config/WorldConfig'

export interface RunManagerDeps {
  stateManager: GameStateManager
  obstacleManager: ObstacleManager
  collectibleManager: CollectibleManager
  collectibleOrchestrator: CollectibleOrchestrator
  trackManager: TrackManager
  physicsController: PhysicsController
  collisionSystem: CollisionSystem
  inputBuffer: InputBuffer
  playerController: PlayerController
  cameraController: CameraController
  performanceMonitor: PerformanceMonitor
  particleSystem: ParticleSystem
  transitionSystem: TransitionSystem
  comboSystem: ComboSystem
  inputRecorder: InputRecorder
  milestoneSystem: MilestoneSystem
  achievementSystem: AchievementSystem
  ghostManager: GhostManager
  loadingOrchestrator: LoadingOrchestrator
  renderer: SurvivalRenderer
  gameLoop: GameLoop
  fixedUpdateLoop: FixedUpdateLoop
}

export interface RunManagerCallbacks {
  onGameOver?: (score: number, distance: number) => void
}

export class RunManager {
  private deps: RunManagerDeps
  private callbacks: RunManagerCallbacks
  
  // Trivia stats for XP calculation (set externally by page component)
  private triviaCorrect: number = 0
  private triviaAnswered: number = 0

  constructor(deps: RunManagerDeps, callbacks: RunManagerCallbacks) {
    this.deps = deps
    this.callbacks = callbacks
  }
  
  /**
   * Get base speed from WorldConfig (single source of truth)
   */
  private getBaseSpeed(): number {
    return WorldConfig.getInstance().getBaseSpeed()
  }
  
  /**
   * Set trivia stats for the current run (called by page component)
   */
  setTriviaStats(correct: number, answered: number): void {
    this.triviaCorrect = correct
    this.triviaAnswered = answered
  }
  
  /**
   * Reset trivia stats (called on run start/reset)
   */
  private resetTriviaStats(): void {
    this.triviaCorrect = 0
    this.triviaAnswered = 0
  }

  /**
   * Start a new run
   */
  start(): void {
    const { stateManager, obstacleManager, inputRecorder,
            loadingOrchestrator, transitionSystem, playerController,
            cameraController, renderer, fixedUpdateLoop } = this.deps

    if (stateManager.getPhase() === 'ready') {
      const seed = stateManager.generateRunSeed()
      obstacleManager.setSeed(seed)
      inputRecorder.start(seed)
      stateManager.resetRunTracking()
      fixedUpdateLoop.setSpeed(this.getBaseSpeed())
      
      // Reset camera to proper position before starting
      renderer.resetOrbitControls()
      cameraController.reset()
      cameraController.initialize(8)
      
      // Check if loading is complete before starting countdown
      const isReady = loadingOrchestrator.isReadyForCountdown()
      
      if (isReady) {
        // Start countdown sequence
        loadingOrchestrator.startCountdown()
        transitionSystem.startCountdown()
      } else {
        // Start immediately (fallback)
        this.startImmediate()
      }
    } else if (stateManager.getPhase() === 'paused') {
      stateManager.setPhase('running')
      playerController.setVisualState({ isRunning: true })
    }
  }

  /**
   * Start immediately without countdown
   */
  startImmediate(): void {
    const { stateManager, playerController, obstacleManager, collectibleManager,
            loadingOrchestrator, ghostManager, fixedUpdateLoop } = this.deps

    if (stateManager.getPhase() === 'ready' || stateManager.getPhase() === 'paused') {
      loadingOrchestrator.startRunning()
      stateManager.setPhase('running')
      fixedUpdateLoop.setSpeed(this.getBaseSpeed())
      playerController.setVisualState({ isRunning: true })
      obstacleManager.setSpawningEnabled(true)
      collectibleManager.setSpawningEnabled(true)
      
      // Start ghost replay if loaded
      ghostManager.startGhost()
    }
  }

  /**
   * Pause the game
   */
  pause(): void {
    const { stateManager, playerController } = this.deps
    if (stateManager.isRunning()) {
      stateManager.setPhase('paused')
      playerController.setVisualState({ isRunning: false })
    }
  }

  /**
   * Resume from pause
   */
  resume(): void {
    const { stateManager, playerController } = this.deps
    if (stateManager.getPhase() === 'paused') {
      stateManager.setPhase('running')
      playerController.setVisualState({ isRunning: true })
    }
  }

  /**
   * Handle game over
   */
  gameOver(): void {
    const { stateManager, playerController, obstacleManager, inputRecorder,
            comboSystem } = this.deps

    stateManager.setPhase('gameover')
    playerController.setVisualState({ isRunning: false })
    obstacleManager.setSpawningEnabled(false)
    
    const recording = inputRecorder.stop()
    const ghostData = (inputRecorder.constructor as typeof InputRecorder).serializeRecording(recording)
    const state = stateManager.getMutableState()
    const comboState = comboSystem.getState()
    
    const runData: SurvivalRunData = {
      distance: Math.round(state.distance),
      score: state.score,
      durationSeconds: Math.round(stateManager.gameTimeMs / 1000),
      maxSpeed: Math.round(stateManager.maxSpeed),
      maxCombo: comboState.combo,
      totalNearMisses: stateManager.obstaclesCleared,
      perfectDodges: Math.floor(stateManager.obstaclesCleared * 0.3),
      obstaclesCleared: stateManager.obstaclesCleared,
      // Trivia stats for XP calculation
      triviaCorrect: this.triviaCorrect,
      triviaAnswered: this.triviaAnswered,
      deathObstacleType: stateManager.lastDeathObstacleType ?? undefined,
      deathPosition: stateManager.lastDeathPosition ?? undefined,
      deathDistance: stateManager.lastDeathPosition 
        ? Math.round(Math.abs(stateManager.lastDeathPosition.z)) 
        : undefined,
      seed: stateManager.runSeed,
      ghostData,
    }
    
    this.submitRun(runData)
    this.callbacks.onGameOver?.(state.score, Math.round(state.distance))
  }

  /**
   * Submit run to server
   */
  private async submitRun(runData: SurvivalRunData): Promise<SurvivalRunResponse | null> {
    try {
      const { response, validationError, rateLimitError } = await survivalApi.submitRun(runData)
      
      if (rateLimitError) {
        console.warn('[RunManager] Rate limited:', rateLimitError.message)
        return null
      }
      
      if (validationError) {
        console.warn('[RunManager] Run rejected:', validationError.reason, validationError.flags)
        return null
      }
      
      // Run submitted successfully
      
      return response
    } catch (error) {
      console.error('[RunManager] Failed to submit run:', error)
      return null
    }
  }

  /**
   * Reset game state
   */
  reset(): void {
    const { stateManager, obstacleManager, collectibleManager, collectibleOrchestrator,
            trackManager, physicsController, collisionSystem, inputBuffer,
            playerController, cameraController, performanceMonitor, particleSystem,
            transitionSystem, comboSystem, inputRecorder, milestoneSystem,
            achievementSystem, ghostManager, gameLoop, fixedUpdateLoop, renderer } = this.deps

    stateManager.reset()
    fixedUpdateLoop.resetSpeed()
    this.resetTriviaStats()
    
    obstacleManager.setSpawningEnabled(false)
    obstacleManager.reset()
    collectibleManager.setSpawningEnabled(false)
    collectibleManager.reset()
    collectibleOrchestrator.reset()
    trackManager.reset()
    physicsController.reset()
    collisionSystem.reset()
    inputBuffer.clear()
    playerController.reset()
    performanceMonitor.reset()
    particleSystem.reset()
    comboSystem.reset()
    inputRecorder.reset()
    ghostManager.reset()
    milestoneSystem.reset()
    achievementSystem.reset()
    cameraController.reset()
    transitionSystem.reset()
    gameLoop.setTimeScale(1)
    
    // Reset space background (fixes mobile city red tint issue)
    renderer.getSpaceBackground()?.reset()
    
    cameraController.initialize(8)
    transitionSystem.startFadeIn()
  }

  /**
   * Quick restart - reset and immediately start a new run
   */
  quickRestart(): void {
    // Reset all game state
    this.reset()
    
    const { stateManager, obstacleManager, inputRecorder, cameraController,
            renderer, loadingOrchestrator, transitionSystem, playerController,
            collectibleManager, ghostManager, fixedUpdateLoop } = this.deps
    
    // Generate new run seed and start tracking
    const seed = stateManager.generateRunSeed()
    obstacleManager.setSeed(seed)
    inputRecorder.start(seed)
    stateManager.resetRunTracking()
    fixedUpdateLoop.setSpeed(this.getBaseSpeed())
    
    // Initialize camera for new run
    cameraController.initialize(8)
    renderer.resetOrbitControls()
    
    // Reload personal best ghost
    ghostManager.reloadPersonalBestGhost()
    
    // Start countdown sequence
    const isReady = loadingOrchestrator.isReadyForCountdown()
    if (isReady) {
      loadingOrchestrator.startCountdown()
      transitionSystem.startCountdown()
    } else {
      // Fallback: start immediately
      loadingOrchestrator.startRunning()
      stateManager.setPhase('running')
      playerController.setVisualState({ isRunning: true })
      obstacleManager.setSpawningEnabled(true)
      collectibleManager.setSpawningEnabled(true)
      ghostManager.startGhost()
    }
  }

  /**
   * Enable spawning when countdown completes
   */
  onCountdownComplete(): void {
    const { stateManager, playerController, obstacleManager, collectibleManager,
            ghostManager } = this.deps
    
    stateManager.setPhase('running')
    playerController.setVisualState({ isRunning: true })
    obstacleManager.setSpawningEnabled(true)
    collectibleManager.setSpawningEnabled(true)
    ghostManager.startGhost()
  }
}
