/**
 * FixedUpdateLoop - Handles physics-rate updates at consistent 60Hz
 * Extracted from SurvivalEngine for modularity
 * 
 * Mobile-optimized: Uses dynamic config for speed settings
 */

import type { SurvivalGameState, Lane } from '../types/survival'
import { getSurvivalConfig } from '../config/constants'
import { PlayerController } from './PlayerController'
import { PhysicsController } from './PhysicsController'
import { CameraController } from './CameraController'
import { InputController } from './InputController'
import { InputBuffer } from './InputBuffer'
import { TrackManager } from './TrackManager'
import { ObstacleManager } from './ObstacleManager'
import { CollectibleManager } from './CollectibleManager'
import { CollectibleOrchestrator } from '../orchestrator/CollectibleOrchestrator'
import { ParticleSystem } from '../effects/ParticleSystem'
import { FeedbackSystem } from '../effects/FeedbackSystem'
import { ComboSystem } from '../systems/ComboSystem'
import { CollisionHandler } from './CollisionHandler'
import { GameStateManager } from './GameStateManager'
import type { InputRecorder } from '../systems/InputRecorder'

// Position snapshot interval for ghost replay (ms)
const GHOST_SNAPSHOT_INTERVAL = 100

export interface FixedUpdateDeps {
  playerController: PlayerController
  physicsController: PhysicsController
  cameraController: CameraController
  inputController: InputController
  inputBuffer: InputBuffer
  trackManager: TrackManager
  obstacleManager: ObstacleManager
  collectibleManager?: CollectibleManager
  collectibleOrchestrator?: CollectibleOrchestrator
  particleSystem: ParticleSystem
  feedbackSystem: FeedbackSystem
  comboSystem: ComboSystem
  collisionHandler: CollisionHandler
  stateManager: GameStateManager
  inputRecorder?: InputRecorder  // Optional for ghost position snapshots
}

// Slide mechanics config
const SLIDE_DURATION = 0.6
const SLIDE_HOLD_MODE = true

export class FixedUpdateLoop {
  private deps: FixedUpdateDeps
  private currentSpeed: number
  private slideTimer: number = 0
  private pendingLifeLoss: boolean = false // Guard against multiple life losses per fall
  private lastSnapshotTime: number = 0 // For ghost position snapshots

  // Config values (from dynamic config)
  private baseSpeed: number
  private maxSpeed: number
  private speedIncreaseRate: number
  private laneWidth: number

  constructor(deps: FixedUpdateDeps) {
    this.deps = deps
    
    // Get config values
    const config = getSurvivalConfig()
    this.baseSpeed = config.baseSpeed
    this.maxSpeed = config.maxSpeed
    this.speedIncreaseRate = config.speedIncreaseRate
    this.laneWidth = config.laneWidth
    this.currentSpeed = this.baseSpeed
  }

  /**
   * Get current speed
   */
  getSpeed(): number {
    return this.currentSpeed
  }

  /**
   * Set current speed
   */
  setSpeed(speed: number): void {
    this.currentSpeed = speed
  }

  /**
   * Reset speed to base
   */
  resetSpeed(): void {
    this.currentSpeed = this.baseSpeed
    this.slideTimer = 0
    this.pendingLifeLoss = false
    this.lastSnapshotTime = 0
  }

  /**
   * Process buffered inputs
   */
  private processInputs(state: SurvivalGameState): { wantsJump: boolean; wantsSlide: boolean } {
    const { inputBuffer, playerController, cameraController, feedbackSystem } = this.deps

    if (inputBuffer.consume('moveLeft')) {
      if (state.player.targetLane > -1) {
        state.player.targetLane = (state.player.targetLane - 1) as Lane
        playerController.setTargetLane(state.player.targetLane)
        cameraController.setTiltTarget(-1)
        feedbackSystem.onLaneChange(-1)
      }
    }
    
    if (inputBuffer.consume('moveRight')) {
      if (state.player.targetLane < 1) {
        state.player.targetLane = (state.player.targetLane + 1) as Lane
        playerController.setTargetLane(state.player.targetLane)
        cameraController.setTiltTarget(1)
        feedbackSystem.onLaneChange(1)
      }
    }
    
    if (!inputBuffer.has('moveLeft') && !inputBuffer.has('moveRight')) {
      if (playerController.getCurrentLane() === state.player.targetLane) {
        cameraController.setTiltTarget(0)
      }
    }
    
    const wantsJump = inputBuffer.consume('jump')
    const wantsSlide = inputBuffer.consume('slide')
    
    return { wantsJump, wantsSlide }
  }

  /**
   * Main fixed update - runs at consistent 60Hz
   */
  update(delta: number): void {
    const { stateManager, playerController, physicsController, cameraController,
            inputController, trackManager, obstacleManager, particleSystem,
            feedbackSystem, comboSystem, collisionHandler } = this.deps
    
    const state = stateManager.getMutableState()

    // Update combo system decay
    comboSystem.update(delta)

    // Store previous positions for interpolation
    playerController.storePreviousState()
    cameraController.storePreviousState()
    collisionHandler.storePreviousZ(state.player.z)

    // Process inputs
    const { wantsJump, wantsSlide } = this.processInputs(state)

    // Increase speed over time
    this.currentSpeed = Math.min(
      this.currentSpeed + this.speedIncreaseRate * delta,
      this.maxSpeed
    )
    stateManager.setSpeed(this.currentSpeed)
    stateManager.updateMaxSpeed(this.currentSpeed)

    // Move player forward
    const moveAmount = this.currentSpeed * delta
    playerController.moveForward(moveAmount)
    state.player.z = playerController.getZ()
    stateManager.addDistance(moveAmount)

    // Update player controller (lane transitions)
    // AAA: Sync run cycle speed to current game speed for natural foot movement
    playerController.syncToGameSpeed(this.currentSpeed)
    playerController.fixedUpdate(delta)
    state.player.x = playerController.getX()

    // Air control
    const airControlDir = inputController.getAirControlDirection()
    physicsController.setAirControlInput(airControlDir)

    // Update physics
    const playerPos = playerController.getPosition()
    const physicsResult = physicsController.update(
      delta,
      playerPos,
      wantsJump || inputController.isKeyHeld('jump'),
      state.player.targetLane
    )
    
    playerController.setY(physicsResult.newY)

    if (physicsResult.airControlInfluence !== 0) {
      playerController.applyAirControl(physicsResult.airControlInfluence * delta * 10)
    }
    
    // Update jumping state - FIX: Use !isGrounded for full airborne state
    const physicsState = physicsController.getState()
    state.player.isJumping = !physicsState.isGrounded
    
    if (physicsResult.didJump) {
      feedbackSystem.onJump()
    }

    // Landing effects
    if (physicsResult.justLanded && physicsResult.landingVelocity > 5) {
      playerController.triggerLandingSquash(physicsResult.landingVelocity)
      particleSystem.emitLandingDust(playerPos, physicsResult.landingVelocity)
      feedbackSystem.onLand(physicsResult.landingVelocity)
      
      if (physicsResult.landingVelocity > 15) {
        const trauma = Math.min(0.15, (physicsResult.landingVelocity - 15) / 30 * 0.15)
        cameraController.addShakeTrauma(trauma)
      }
    }

    // AAA Feature: Footstep dust particles synced to run cycle
    if (!state.player.isJumping && !state.player.isSliding) {
      particleSystem.emitFootstepDust(
        playerPos,
        playerController.getRunCycle(),
        this.currentSpeed,
        physicsState.isGrounded
      )
    }
    
    // Update visual state
    playerController.setVisualState({
      isRunning: true,
      isJumping: state.player.isJumping,
      isSliding: state.player.isSliding,
      isInvincible: collisionHandler.isInvincible(),
    })
    
    // Check if player fell off track - only lose life once per fall
    // The shouldLoseLife flag is set when player has been falling for > 0.5s
    if (physicsResult.shouldLoseLife && !this.pendingLifeLoss) {
      this.pendingLifeLoss = true
      stateManager.loseLife()
      // Reset pending flag after a delay to allow respawn
      setTimeout(() => { this.pendingLifeLoss = false }, 2000)
    }

    // Update camera
    const targetLaneX = state.player.targetLane * this.laneWidth
    cameraController.setTarget(state.player.x, state.player.z, targetLaneX)
    cameraController.fixedUpdate(delta, !state.player.isJumping, playerController.getRunCycle(), state.player.isJumping)

    // Update track and obstacles
    trackManager.update(state.player.z)
    obstacleManager.update(state.player.z, this.currentSpeed)
    
    // Update collectibles - spawn and check collection
    if (this.deps.collectibleManager && this.deps.collectibleOrchestrator) {
      // Get recent obstacle spawns to avoid placing gems in kill zones
      const recentObstacles = obstacleManager.getObstaclesInRange(state.player.z, 100)
        .map(o => ({ type: o.type, lane: o.lane, z: o.z })) as { type: string; lane: -1 | 0 | 1; z: number }[]
      
      // Get collectible spawn requests
      const collectibleSpawns = this.deps.collectibleOrchestrator.update(
        state.player.z,
        this.currentSpeed,
        recentObstacles as never[]
      )
      
      // Spawn collectibles
      this.deps.collectibleManager.spawnFromRequests(collectibleSpawns)
      
      // Update collectibles (animation, collection detection)
      this.deps.collectibleManager.update(
        delta,
        state.player.x,
        playerController.getY(),
        state.player.z
      )
    }

    // Update collision system and check collisions
    collisionHandler.update(delta)
    collisionHandler.checkCollisions(state, playerController.getY())

    // Record position snapshot for ghost replay (every GHOST_SNAPSHOT_INTERVAL ms)
    if (this.deps.inputRecorder?.isRecording()) {
      const gameTimeMs = stateManager.gameTimeMs
      if (gameTimeMs - this.lastSnapshotTime >= GHOST_SNAPSHOT_INTERVAL) {
        this.deps.inputRecorder.recordPosition(
          gameTimeMs,
          state.player.z,
          state.player.targetLane,
          playerController.getY()
        )
        this.lastSnapshotTime = gameTimeMs
      }
    }

    // Handle slide mechanics
    this.updateSlide(delta, state, wantsSlide, physicsState.isGrounded)
  }

  /**
   * Update slide state
   */
  private updateSlide(
    delta: number,
    state: SurvivalGameState,
    wantsSlide: boolean,
    isGrounded: boolean
  ): void {
    const { inputController, playerController, feedbackSystem } = this.deps
    const isSlideHeld = inputController.isKeyHeld('slide')
    
    if (wantsSlide && !state.player.isSliding && isGrounded && !state.player.isJumping) {
      state.player.isSliding = true
      this.slideTimer = SLIDE_DURATION
      playerController.setVisualState({ isSliding: true })
      feedbackSystem.onSlideStart()
    }
    
    if (state.player.isSliding) {
      this.slideTimer -= delta
      
      const shouldEndSlide = SLIDE_HOLD_MODE
        ? (!isSlideHeld && this.slideTimer <= 0)
        : (this.slideTimer <= 0)
      
      if (shouldEndSlide || state.player.isJumping) {
        state.player.isSliding = false
        playerController.setVisualState({ isSliding: false })
        feedbackSystem.onSlideEnd()
      }
    }
  }
}
