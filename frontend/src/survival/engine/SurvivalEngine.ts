/**
 * SurvivalEngine - Enterprise-grade game engine facade for Survival Mode
 * Orchestrates modular subsystems for physics, rendering, and game logic
 * 
 * Features:
 * - Parallel asset loading for faster startup
 * - Subsystem readiness tracking
 * - Smart countdown that waits for critical systems
 * 
 * Architecture:
 * - InitializationManager: Asset loading and subsystem setup
 * - RunManager: Run lifecycle (start, restart, game over)
 * - GhostManager: Ghost replay functionality
 * - GameStateManager: State and phase management
 * - CollisionHandler: Collision detection/response
 * - FixedUpdateLoop: Physics at 60Hz
 * - RenderUpdateLoop: Visuals at display rate
 * - PlayerManager: Player setup/animation
 */

import * as THREE from 'three'
import type { SurvivalGameState, SurvivalCallbacks, InputAction } from '../types/survival'
import { getSurvivalConfig } from '../config/constants'
import { SurvivalRenderer } from '../renderer/SurvivalRenderer'
import { AssetLoader } from '../renderer/AssetLoader'
import { TrackManager } from './TrackManager'
import { ObstacleManager } from './ObstacleManager'
import { CollectibleManager } from './CollectibleManager'
import { CollectibleOrchestrator } from '../orchestrator/CollectibleOrchestrator'
import { InputController } from './InputController'
import { PhysicsController } from './PhysicsController'
import { CollisionSystem } from './CollisionSystem'
import { GameLoop } from './GameLoop'
import { InputBuffer } from './InputBuffer'
import { CameraController } from './CameraController'
import { PlayerController } from './PlayerController'
import { PerformanceMonitor } from './PerformanceMonitor'
import { LifecycleManager } from '../core/LifecycleManager'
import { ParticleSystem } from '../effects/ParticleSystem'
import { FeedbackSystem } from '../effects/FeedbackSystem'
import { TransitionSystem } from '../effects/TransitionSystem'
import { ComboSystem } from '../systems/ComboSystem'
import { InputRecorder } from '../systems/InputRecorder'
import { GhostReplay } from '../systems/GhostReplay'
import { GhostRenderer } from '../renderer/GhostRenderer'
import { MilestoneSystem } from '../systems/MilestoneSystem'
import { AchievementSystem } from '../systems/AchievementSystem'
import { LoadingOrchestrator, type LoadingProgress } from '../core/LoadingOrchestrator'

// Modular subsystems (enterprise pattern)
import { GameStateManager } from './GameStateManager'
import { PlayerManager } from './PlayerManager'
import { CollisionHandler } from './CollisionHandler'
import { FixedUpdateLoop } from './FixedUpdateLoop'
import { RenderUpdateLoop } from './RenderUpdateLoop'
import { InitializationManager } from './InitializationManager'
import { RunManager } from './RunManager'
import { GhostManager } from './GhostManager'

/**
 * Runner skin configuration for custom character skins
 * Contains URLs to the 3D model files for each animation state
 */
export interface RunnerSkinConfig {
  run: string   // URL to run animation GLB
  jump: string  // URL to jump animation GLB
  down: string  // URL to slide/down animation GLB
}

export class SurvivalEngine {
  // Core systems
  private renderer: SurvivalRenderer
  private assetLoader: AssetLoader
  private trackManager: TrackManager
  private obstacleManager: ObstacleManager
  private collectibleManager: CollectibleManager
  private collectibleOrchestrator: CollectibleOrchestrator
  private inputController: InputController
  private physicsController: PhysicsController
  private collisionSystem: CollisionSystem
  private lifecycleManager: LifecycleManager
  
  // Enterprise systems
  private gameLoop: GameLoop
  private inputBuffer: InputBuffer
  private cameraController: CameraController
  private playerController: PlayerController
  private performanceMonitor: PerformanceMonitor

  // Effects systems
  private particleSystem: ParticleSystem
  private feedbackSystem: FeedbackSystem
  private transitionSystem: TransitionSystem

  // Game systems
  private comboSystem: ComboSystem
  private inputRecorder: InputRecorder
  private milestoneSystem: MilestoneSystem
  private achievementSystem: AchievementSystem

  // Modular managers (enterprise pattern)
  private stateManager: GameStateManager
  private playerManager!: PlayerManager
  private collisionHandler!: CollisionHandler
  private fixedUpdateLoop!: FixedUpdateLoop
  private renderUpdateLoop!: RenderUpdateLoop
  private initializationManager!: InitializationManager
  private runManager!: RunManager
  private ghostManager: GhostManager

  // Enterprise loading orchestrator
  private loadingOrchestrator: LoadingOrchestrator
  private onLoadingProgress?: (progress: LoadingProgress) => void
  
  // Dynamic config values
  private readonly baseSpeed: number

  constructor(
    container: HTMLElement, 
    callbacks: SurvivalCallbacks = {}, 
    onLoadingProgress?: (progress: LoadingProgress) => void,
    runnerSkin?: { run: string; jump: string; down: string }
  ) {
    this.onLoadingProgress = onLoadingProgress
    
    // Load dynamic config
    const config = getSurvivalConfig()
    this.baseSpeed = config.baseSpeed
    
    // Initialize state manager
    this.stateManager = new GameStateManager(callbacks)

    // Initialize renderer first (needed for scene)
    this.renderer = new SurvivalRenderer(container)
    
    // Initialize core systems
    this.assetLoader = new AssetLoader()
    
    // Set custom runner skin if provided (from equipped cosmetic)
    if (runnerSkin) {
      this.assetLoader.setCustomRunnerSkin(runnerSkin)
    }
    
    this.trackManager = new TrackManager(this.renderer.getScene())
    this.obstacleManager = new ObstacleManager(this.renderer.getScene())
    this.collectibleManager = new CollectibleManager(this.renderer.getScene(), {
      onCollect: (collectible: { mesh: { position: THREE.Vector3 } }) => {
        this.particleSystem.emitCollectBurst(collectible.mesh.position)
        this.feedbackSystem.emitSound('collect', { intensity: 0.6 })
      },
      onScoreAdd: (points: number) => {
        this.stateManager.addScore(points)
      },
    })
    this.collectibleOrchestrator = new CollectibleOrchestrator()
    this.inputController = new InputController()
    this.physicsController = new PhysicsController()
    this.collisionSystem = new CollisionSystem()
    
    // Initialize enterprise systems
    this.inputBuffer = new InputBuffer()
    this.cameraController = new CameraController(this.renderer.getCamera())
    this.playerController = new PlayerController()
    this.performanceMonitor = new PerformanceMonitor({}, () => {
      // Performance issues tracked silently
    })

    // Effects systems
    this.particleSystem = new ParticleSystem(this.renderer.getScene())
    this.feedbackSystem = new FeedbackSystem()
    this.transitionSystem = new TransitionSystem()

    // Game systems
    this.comboSystem = new ComboSystem()
    this.inputRecorder = new InputRecorder()
    const ghostReplay = new GhostReplay()
    const ghostRenderer = new GhostRenderer(this.renderer.getScene())
    this.milestoneSystem = new MilestoneSystem({ interval: 500, majorInterval: 1000 })
    this.achievementSystem = new AchievementSystem()
    
    // Initialize ghost manager (enterprise pattern)
    this.ghostManager = new GhostManager({
      ghostReplay,
      ghostRenderer,
    })
    
    // Wire milestone/achievement feedback
    this.milestoneSystem.onMilestone((event) => {
      this.feedbackSystem.emitSound('milestone', { intensity: event.isMajor ? 1 : 0.7 })
      this.feedbackSystem.emitHaptic(event.isMajor ? 'success' : 'medium', event.isMajor ? 1 : 0.6)
    })
    
    this.achievementSystem.onAchievement(() => {
      this.feedbackSystem.emitSound('milestone', { intensity: 1, pitch: 1.2 })
      this.feedbackSystem.emitHaptic('success', 0.8)
    })

    // Setup transition callbacks
    this.setupTransitionCallbacks()
    
    // Initialize lifecycle manager
    this.lifecycleManager = new LifecycleManager({
      onVisibilityChange: (visible) => {
        if (!visible && this.stateManager.isRunning()) this.pause()
      },
      onFocusChange: (focused) => {
        if (!focused && this.stateManager.isRunning()) this.pause()
      },
      onContextLost: () => {
        console.error('[SurvivalEngine] WebGL context lost - pausing')
        this.pause()
      },
    })

    // Initialize game loop BEFORE modular subsystems (CollisionHandler needs it)
    this.gameLoop = new GameLoop({
      onFixedUpdate: this.fixedUpdate,
      onUpdate: this.renderUpdate,
      onLagSpike: () => { /* Lag spikes tracked silently */ },
    })

    // Initialize modular subsystems (after gameLoop is ready)
    this.initializeModularSystems(callbacks)

    // Setup input handling
    this.inputController.onInput(this.handleInput)
    this.inputController.attach()

    // Initialize loading orchestrator
    this.loadingOrchestrator = new LoadingOrchestrator({
      onProgress: (progress) => {
        this.onLoadingProgress?.(progress)
      },
      onReady: () => {
        // Loading complete
      },
      onError: (error) => {
        console.error('[SurvivalEngine] Loading failed:', error)
      },
    })

    // Initialize initialization manager (enterprise pattern)
    this.initializationManager = new InitializationManager(
      {
        renderer: this.renderer,
        assetLoader: this.assetLoader,
        trackManager: this.trackManager,
        obstacleManager: this.obstacleManager,
        collectibleManager: this.collectibleManager,
        physicsController: this.physicsController,
        cameraController: this.cameraController,
        lifecycleManager: this.lifecycleManager,
        loadingOrchestrator: this.loadingOrchestrator,
      },
      {
        onPlayerManagerReady: (assets) => {
          this.playerManager = new PlayerManager(
            this.renderer,
            this.playerController,
            this.physicsController,
            this.collisionSystem,
            this.particleSystem,
            this.transitionSystem
          )
          this.playerManager.setupPlayer(assets)
          return this.playerManager
        },
        onGhostRendererReady: (assets) => {
          // Setup animated character
          this.playerManager.setupAnimatedCharacter(assets)
          
          // Initialize ghost renderer with character meshes
          this.ghostManager.initializeRenderer({
            run: assets.character.runner.run,
            jump: assets.character.runner.jump,
            down: assets.character.runner.down,
          })
        },
        onUpdateLoopsReady: () => {
          // Initialize update loops
          this.fixedUpdateLoop = new FixedUpdateLoop({
            playerController: this.playerController,
            physicsController: this.physicsController,
            cameraController: this.cameraController,
            inputController: this.inputController,
            inputBuffer: this.inputBuffer,
            trackManager: this.trackManager,
            obstacleManager: this.obstacleManager,
            collectibleManager: this.collectibleManager,
            collectibleOrchestrator: this.collectibleOrchestrator,
            particleSystem: this.particleSystem,
            feedbackSystem: this.feedbackSystem,
            comboSystem: this.comboSystem,
            collisionHandler: this.collisionHandler,
            stateManager: this.stateManager,
            inputRecorder: this.inputRecorder,  // For ghost position snapshots
          })

          this.renderUpdateLoop = new RenderUpdateLoop({
            renderer: this.renderer,
            playerController: this.playerController,
            cameraController: this.cameraController,
            gameLoop: this.gameLoop,
            inputBuffer: this.inputBuffer,
            performanceMonitor: this.performanceMonitor,
            particleSystem: this.particleSystem,
            feedbackSystem: this.feedbackSystem,
            transitionSystem: this.transitionSystem,
            comboSystem: this.comboSystem,
            playerManager: this.playerManager,
            ghostReplay: ghostReplay,
            ghostRenderer: ghostRenderer,
          })

          // Initialize run manager (enterprise pattern)
          this.runManager = new RunManager(
            {
              stateManager: this.stateManager,
              obstacleManager: this.obstacleManager,
              collectibleManager: this.collectibleManager,
              collectibleOrchestrator: this.collectibleOrchestrator,
              trackManager: this.trackManager,
              physicsController: this.physicsController,
              collisionSystem: this.collisionSystem,
              inputBuffer: this.inputBuffer,
              playerController: this.playerController,
              cameraController: this.cameraController,
              performanceMonitor: this.performanceMonitor,
              particleSystem: this.particleSystem,
              transitionSystem: this.transitionSystem,
              comboSystem: this.comboSystem,
              inputRecorder: this.inputRecorder,
              milestoneSystem: this.milestoneSystem,
              achievementSystem: this.achievementSystem,
              ghostManager: this.ghostManager,
              loadingOrchestrator: this.loadingOrchestrator,
              renderer: this.renderer,
              gameLoop: this.gameLoop,
              fixedUpdateLoop: this.fixedUpdateLoop,
            },
            {
              onGameOver: (score, distance) => {
                this.stateManager.getCallbacks().onGameOver?.(score, distance)
              },
            },
            this.baseSpeed
          )
        },
        onLoadingProgress: this.onLoadingProgress,
      }
    )
  }

  /**
   * Setup transition system callbacks
   */
  private setupTransitionCallbacks(): void {
    this.transitionSystem.setCallbacks({
      onCountdownTick: (value) => {
        if (value !== null && value !== 'GO') {
          this.feedbackSystem.emitSound('countdown', { intensity: 0.8 })
        } else if (value === 'GO') {
          this.feedbackSystem.emitSound('boost', { intensity: 1 })
        }
      },
      onCountdownComplete: () => {
        // Delegate to run manager
        this.runManager?.onCountdownComplete()
      },
      onDeathComplete: () => {
        if (this.stateManager.getMutableState().player.lives <= 0) {
          this.runManager?.gameOver()
        }
      },
      onRespawnComplete: () => {
        // Respawn animation complete
      },
    })
  }

  /**
   * Initialize modular subsystems
   */
  private initializeModularSystems(callbacks: SurvivalCallbacks): void {
    // Collision handler
    this.collisionHandler = new CollisionHandler({
      collisionSystem: this.collisionSystem,
      obstacleManager: this.obstacleManager,
      playerController: this.playerController,
      cameraController: this.cameraController,
      gameLoop: this.gameLoop!,
      particleSystem: this.particleSystem,
      feedbackSystem: this.feedbackSystem,
      transitionSystem: this.transitionSystem,
      comboSystem: this.comboSystem,
      renderer: this.renderer,
    }, callbacks)

    // Wire collision handler callbacks
    this.collisionHandler.setHandlers({
      onLifeLost: () => {
        const lives = this.stateManager.loseLife()
        this.achievementSystem.recordHit()
        if (lives > 0) {
          setTimeout(() => this.playerManager.respawnPlayer(this.stateManager.getMutableState()), 1200)
        }
      },
      onObstacleCleared: () => this.stateManager.incrementObstaclesCleared(),
      onScoreUpdate: (score) => this.stateManager.addScore(score),
      onDeathRecord: (type, pos) => this.stateManager.recordDeath(type, pos),
    })
    
    // Wire near-miss tracking for achievements
    this.feedbackSystem.onVisualIndicator((data) => {
      if (data.type === 'close') {
        this.achievementSystem.recordCloseCall()
      } else if (data.type === 'perfect') {
        this.achievementSystem.recordPerfectDodge()
      }
    })
  }

  /**
   * Initialize the game - load assets and setup scene
   * Delegates to InitializationManager
   */
  async initialize(): Promise<void> {
    await this.initializationManager.initialize()
    this.stateManager.setPhase('ready')
    this.gameLoop.start()
  }

  /**
   * Handle input actions
   */
  private handleInput = (action: InputAction): void => {
    this.inputBuffer.push(action)
    
    if (this.stateManager.isRunning() && this.inputRecorder.isRecording()) {
      const state = this.stateManager.getMutableState()
      const playerY = this.playerController.getY()
      this.inputRecorder.recordInput(
        action, 
        this.stateManager.gameTimeMs, 
        state.player.z,
        state.player.targetLane,
        playerY
      )
    }
    
    switch (action) {
      case 'pause':
        if (this.stateManager.isRunning()) this.pause()
        else if (this.stateManager.getPhase() === 'paused') this.resume()
        break
      case 'start':
      case 'jump':
        if (this.stateManager.getPhase() === 'ready') this.start()
        break
    }
  }

  /**
   * Fixed update callback
   */
  private fixedUpdate = (delta: number): void => {
    const isRunning = this.stateManager.isRunning()
    const isGamePaused = this.transitionSystem.isGamePaused()
    
    if (!isRunning || isGamePaused) return
    
    this.stateManager.gameTimeMs += delta * 1000
    this.fixedUpdateLoop.update(delta)
    
    // Update milestone and achievement tracking
    const state = this.stateManager.getMutableState()
    this.milestoneSystem.update(state.distance)
    this.achievementSystem.updateDistance(state.distance)
    this.achievementSystem.updateCombo(this.comboSystem.getCombo())
    this.achievementSystem.updateSpeed(state.speed)
  }

  /**
   * Render update callback
   */
  private renderUpdate = (delta: number, interpolation: number): void => {
    this.renderUpdateLoop.update(
      delta,
      interpolation,
      this.stateManager.getMutableState(),
      this.fixedUpdateLoop.getSpeed(),
      this.stateManager.gameTimeMs
    )
  }

  // === Public API (delegates to managers) ===

  start(): void {
    this.runManager.start()
  }

  startImmediate(): void {
    this.runManager.startImmediate()
  }

  pause(): void {
    this.runManager.pause()
  }

  resume(): void {
    this.runManager.resume()
  }

  reset(): void {
    this.runManager.reset()
  }

  quickRestart(): void {
    this.runManager.quickRestart()
  }

  getState(): SurvivalGameState {
    return this.stateManager.getState()
  }

  getPerformanceMetrics() {
    return this.performanceMonitor.getMetrics()
  }

  getMemoryStats() {
    return this.renderer.getMemoryStats()
  }

  logMemoryBreakdown() {
    this.renderer.logMemoryBreakdown()
  }

  dispose(): void {
    this.gameLoop.stop()
    this.inputController.detach()
    this.lifecycleManager.dispose()
    this.trackManager.dispose()
    this.obstacleManager.dispose()
    this.collectibleManager.dispose()
    this.physicsController.reset()
    this.particleSystem.dispose()
    this.feedbackSystem.dispose()
    this.transitionSystem.reset()
    this.ghostManager.dispose()
    this.renderer.dispose()
    this.assetLoader.clearCache()
  }

  // === System accessors (backward compatibility) ===
  
  getFeedbackSystem(): FeedbackSystem { return this.feedbackSystem }
  getTransitionSystem(): TransitionSystem { return this.transitionSystem }
  getComboSystem(): ComboSystem { return this.comboSystem }
  getMilestoneSystem(): MilestoneSystem { return this.milestoneSystem }
  getAchievementSystem(): AchievementSystem { return this.achievementSystem }
  getCombo(): number { return this.comboSystem.getCombo() }
  getMultiplier(): number { return this.comboSystem.getMultiplier() }
  getRunSeed(): number { return this.stateManager.runSeed }
  
  // Screen shake for trivia billboards and other effects
  triggerScreenShake(intensity: number, _duration?: number): void {
    this.cameraController.addShakeTrauma(intensity)
  }
  
  // Loading orchestrator
  getLoadingProgress(): LoadingProgress { return this.loadingOrchestrator.getProgress() }
  getLoadingOrchestrator(): LoadingOrchestrator { return this.loadingOrchestrator }
  isReadyToStart(): boolean { return this.loadingOrchestrator.isReadyForCountdown() }
  
  // Symphony monitoring
  getSymphonyState() { return this.obstacleManager.getDebugInfo() as ReturnType<typeof this.obstacleManager.getDebugInfo> & { symphony?: unknown } }
  getOrchestratorDebug() { return this.obstacleManager.getDebugInfo() }
  getObstacleRenderStats() { return this.obstacleManager.getRenderStats() }
  getTrackRenderStats() { return this.trackManager.getRenderStats() }

  // Quiz integration methods
  loseLife(): void {
    const lives = this.stateManager.loseLife()
    this.stateManager.getCallbacks().onLifeLost?.(lives)
    
    if (lives <= 0) {
      this.runManager.gameOver()
    } else {
      // Trigger damage feedback
      this.feedbackSystem.emitSound('collision', { intensity: 0.8 })
      this.collisionSystem.triggerInvincibility()
    }
  }

  addScore(points: number): void {
    this.stateManager.addScore(points)
  }
  
  /**
   * Set trivia stats for XP calculation (called by page component)
   */
  setTriviaStats(correct: number, answered: number): void {
    this.runManager.setTriviaStats(correct, answered)
  }

  // Ghost methods (delegate to GhostManager)
  loadGhost(data: string): void {
    this.ghostManager.loadGhost(data)
  }

  startGhost(): void {
    this.ghostManager.startGhost()
  }

  getGhostState() {
    return this.ghostManager.getGhostState(this.stateManager.gameTimeMs)
  }

  isGhostActive(): boolean {
    return this.ghostManager.isGhostActive()
  }

  // Billboard subsystem integration
  getScene(): THREE.Scene {
    return this.renderer.getScene()
  }

  getPlayerZ(): number {
    return this.stateManager.getMutableState().player.z
  }

  /**
   * Resize the renderer - call when container size changes
   * (e.g., when mobile trivia panel shows/hides)
   */
  resize(): void {
    this.renderer.resize()
  }
}
