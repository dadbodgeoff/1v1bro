/**
 * PlayerController - Handles player movement, animation state, and visual feedback
 * Provides smooth, responsive character control
 * 
 * Mobile-optimized: Uses dynamic config for movement parameters
 */

import * as THREE from 'three'
import type { Lane } from '../types/survival'
import { getSurvivalConfig } from '../config/constants'

export interface PlayerVisualState {
  isRunning: boolean
  isJumping: boolean
  isSliding: boolean
  isInvincible: boolean
  runCycle: number  // 0-1 for run animation
}

export interface PlayerPosition {
  x: number
  y: number
  z: number
  previousX: number
  previousY: number
  previousZ: number
}

export class PlayerController {
  private mesh: THREE.Group | null = null
  private height: number = 2
  
  // Position state
  private position: PlayerPosition = {
    x: 0, y: 0, z: 8,
    previousX: 0, previousY: 0, previousZ: 8,
  }
  
  // Lane state
  private currentLane: Lane = 0
  private targetLane: Lane = 0
  private laneTransition: number = 0  // 0-1 progress
  
  // Visual state
  private visualState: PlayerVisualState = {
    isRunning: false,
    isJumping: false,
    isSliding: false,
    isInvincible: false,
    runCycle: 0,
  }
  
  // Movement config (from dynamic config)
  private laneSwitchSpeed: number
  private laneWidth: number
  private runnerScale: number
  
  // Animation
  private runCycleSpeed: number = 8  // Cycles per second (dynamic based on speed)
  private bobAmount: number = 0.15   // Vertical bob while running
  private tiltAmount: number = 0.22  // Lean into turns (more dramatic for impactful feel)

  // AAA Feature: Dynamic run cycle speed sync
  private readonly BASE_RUN_CYCLE_SPEED: number = 6   // Min cycles/sec at base speed
  private readonly MAX_RUN_CYCLE_SPEED: number = 14   // Max cycles/sec at max speed

  // AAA Feature: Landing squash/stretch
  private landingSquash: number = 1.0  // Current squash factor (1 = normal)
  private landingSquashVelocity: number = 0
  private readonly SQUASH_RECOVERY_SPEED: number = 8 // How fast to recover from squash
  private readonly SQUASH_DAMPING: number = 0.85

  // AAA Feature: Landing recovery (stutter step)
  private landingRecoveryTimer: number = 0
  private readonly LANDING_RECOVERY_DURATION: number = 0.12 // Brief pause after hard landing
  private landingRecoveryIntensity: number = 0 // 0-1 based on landing velocity

  // AAA Feature: Ground settling delay
  private groundSettlingTimer: number = 0
  private readonly GROUND_SETTLING_DURATION: number = 0.05 // Brief delay before run resumes
  private wasAirborne: boolean = false

  // AAA Feature: Smooth lane transitions with easing
  private laneTransitionProgress: number = 1 // 0-1 progress through transition
  private laneTransitionStartX: number = 0
  private laneTransitionTargetX: number = 0
  
  // Mobile responsiveness boost
  private readonly MOBILE_LANE_SPEED_MULTIPLIER: number = 1.8 // Faster lane changes on mobile

  constructor() {
    // Get movement config from dynamic config
    const config = getSurvivalConfig()
    this.laneSwitchSpeed = config.laneSwitchSpeed
    this.laneWidth = config.laneWidth
    this.runnerScale = config.runnerScale
  }

  /**
   * Initialize with mesh
   */
  initialize(mesh: THREE.Group, height: number): void {
    this.mesh = mesh
    this.height = height
    
    // Set initial position - Y will be set properly by setInitialY() after track loads
    this.position.y = height / 2 + 0.5
    this.position.previousY = this.position.y
    
    this.updateMeshPosition(0)
  }

  // Track surface height for proper Y positioning
  private trackSurfaceHeight: number = 0

  /**
   * Set initial Y position based on track surface height
   * Called after track is loaded to ensure player starts at correct height
   */
  setInitialY(trackSurfaceHeight: number): void {
    this.trackSurfaceHeight = trackSurfaceHeight
    this.position.y = trackSurfaceHeight
    this.position.previousY = trackSurfaceHeight
    console.log(`[PlayerController] Initial Y set to track surface: ${trackSurfaceHeight}`)
    this.updateMeshPosition(0)
  }

  /**
   * Set target lane (from input)
   * AAA Feature: Smooth eased transitions
   */
  setTargetLane(lane: Lane): void {
    if (lane !== this.targetLane) {
      this.targetLane = lane
      this.laneTransition = 0
      // Start smooth transition
      this.laneTransitionProgress = 0
      this.laneTransitionStartX = this.position.x
      this.laneTransitionTargetX = lane * this.laneWidth
    }
  }

  /**
   * Get current lane
   */
  getCurrentLane(): Lane {
    return this.currentLane
  }

  /**
   * Get target lane
   */
  getTargetLane(): Lane {
    return this.targetLane
  }

  /**
   * Move forward
   */
  moveForward(distance: number): void {
    // Note: previousZ is stored by storePreviousState() at start of fixed update
    this.position.z -= distance
  }

  /**
   * AAA Feature: Apply air control influence to X position
   * Allows slight lane adjustment while airborne
   */
  applyAirControl(influence: number): void {
    // Clamp to lane boundaries
    const minX = -1 * this.laneWidth
    const maxX = 1 * this.laneWidth
    this.position.x = Math.max(minX, Math.min(maxX, this.position.x + influence))
  }

  /**
   * Set Y position (from physics)
   */
  setY(y: number): void {
    // Note: previousY is stored by storePreviousState() at start of fixed update
    this.position.y = y
  }

  /**
   * Get current Z position
   */
  getZ(): number {
    return this.position.z
  }

  /**
   * Get current X position
   */
  getX(): number {
    return this.position.x
  }

  /**
   * Get current Y position
   */
  getY(): number {
    return this.position.y
  }

  /**
   * Get current run cycle (0-1) for camera bob sync
   */
  getRunCycle(): number {
    return this.visualState.runCycle
  }

  /**
   * Get current landing squash factor (1 = normal, <1 = squashed)
   */
  getLandingSquash(): number {
    return this.landingSquash
  }

  /**
   * Set visual state
   */
  setVisualState(state: Partial<PlayerVisualState>): void {
    Object.assign(this.visualState, state)
  }

  /**
   * Store previous state for interpolation
   * MUST be called at the START of fixed update, before any physics
   */
  storePreviousState(): void {
    this.position.previousX = this.position.x
    this.position.previousY = this.position.y
    this.position.previousZ = this.position.z
  }

  /**
   * AAA Feature: Sync run cycle speed to game speed
   * Creates more natural foot movement at different velocities
   */
  syncToGameSpeed(gameSpeed: number): void {
    // Map game speed (15-40) to run cycle speed (6-14)
    const speedRatio = Math.max(0, Math.min(1, (gameSpeed - 15) / (40 - 15))) // 0-1 normalized, clamped
    this.runCycleSpeed = this.BASE_RUN_CYCLE_SPEED + 
      speedRatio * (this.MAX_RUN_CYCLE_SPEED - this.BASE_RUN_CYCLE_SPEED)
  }

  /**
   * Fixed update - physics-rate updates
   * AAA Feature: Smooth eased lane transitions, dynamic run cycle, landing recovery
   */
  fixedUpdate(delta: number): void {
    // Note: previousX is now stored by storePreviousState() called from engine
    
    // AAA: Smooth lane transition with easing curve
    // Mobile gets faster transitions for more responsive feel
    if (this.laneTransitionProgress < 1) {
      // Progress the transition - faster on mobile for snappier response
      const isMobile = 'ontouchstart' in window
      const speedMultiplier = isMobile ? this.MOBILE_LANE_SPEED_MULTIPLIER : 1.0
      this.laneTransitionProgress += this.laneSwitchSpeed * delta * 0.15 * speedMultiplier
      this.laneTransitionProgress = Math.min(1, this.laneTransitionProgress)
      
      // Apply easing (ease-out quart for even snappier start on mobile)
      const easedProgress = isMobile 
        ? this.easeOutQuart(this.laneTransitionProgress)
        : this.easeOutCubic(this.laneTransitionProgress)
      
      // Interpolate position
      this.position.x = this.laneTransitionStartX + 
        (this.laneTransitionTargetX - this.laneTransitionStartX) * easedProgress
      
      this.laneTransition = easedProgress
    } else {
      this.position.x = this.laneTransitionTargetX
      this.currentLane = this.targetLane
      this.laneTransition = 1
    }

    // AAA: Track airborne state for ground settling
    const isCurrentlyAirborne = this.visualState.isJumping
    if (this.wasAirborne && !isCurrentlyAirborne) {
      // Just landed - start ground settling timer
      this.groundSettlingTimer = this.GROUND_SETTLING_DURATION
    }
    this.wasAirborne = isCurrentlyAirborne

    // AAA: Update ground settling timer
    if (this.groundSettlingTimer > 0) {
      this.groundSettlingTimer -= delta
    }

    // AAA: Update landing recovery timer
    if (this.landingRecoveryTimer > 0) {
      this.landingRecoveryTimer -= delta
    }
    
    // Update run cycle with dynamic speed and recovery modulation
    if (this.visualState.isRunning && !this.visualState.isJumping) {
      // AAA: Skip run cycle update during ground settling (brief pause)
      if (this.groundSettlingTimer <= 0) {
        // AAA: Modulate run cycle speed during landing recovery
        let effectiveRunSpeed = this.runCycleSpeed
        if (this.landingRecoveryTimer > 0) {
          // Slow down run cycle based on recovery intensity (stutter step effect)
          const recoveryProgress = this.landingRecoveryTimer / this.LANDING_RECOVERY_DURATION
          const slowdownFactor = 1 - (this.landingRecoveryIntensity * recoveryProgress * 0.6)
          effectiveRunSpeed *= slowdownFactor
        }
        
        this.visualState.runCycle += effectiveRunSpeed * delta
        if (this.visualState.runCycle > 1) {
          this.visualState.runCycle -= 1
        }
      }
    }

    // AAA: Update landing squash recovery (spring physics)
    if (this.landingSquash !== 1.0) {
      const targetSquash = 1.0
      const springForce = (targetSquash - this.landingSquash) * this.SQUASH_RECOVERY_SPEED
      this.landingSquashVelocity += springForce * delta
      this.landingSquashVelocity *= this.SQUASH_DAMPING
      this.landingSquash += this.landingSquashVelocity
      
      // Snap to 1 when close enough
      if (Math.abs(this.landingSquash - 1.0) < 0.01 && Math.abs(this.landingSquashVelocity) < 0.01) {
        this.landingSquash = 1.0
        this.landingSquashVelocity = 0
      }
    }
  }

  /**
   * AAA Feature: Ease-out cubic for smooth lane transitions
   */
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3)
  }

  /**
   * AAA Feature: Ease-out quart for snappier mobile lane transitions
   * More aggressive initial movement, smoother settle
   */
  private easeOutQuart(t: number): number {
    return 1 - Math.pow(1 - t, 4)
  }

  /**
   * AAA Feature: Trigger landing squash effect with recovery stutter
   * @param velocity The landing velocity (higher = more squash)
   */
  triggerLandingSquash(velocity: number): void {
    // Calculate squash amount based on landing velocity
    const squashAmount = Math.min(0.3, velocity * 0.015) // Cap at 30% squash
    this.landingSquash = 1.0 - squashAmount
    this.landingSquashVelocity = 0

    // AAA: Trigger landing recovery (stutter step) for harder landings
    if (velocity > 10) {
      // Intensity scales with landing velocity (10-25 range maps to 0.3-1.0)
      this.landingRecoveryIntensity = Math.min(1.0, (velocity - 10) / 15 * 0.7 + 0.3)
      this.landingRecoveryTimer = this.LANDING_RECOVERY_DURATION
    }
  }

  /**
   * Check if currently in landing recovery (for external systems)
   */
  isInLandingRecovery(): boolean {
    return this.landingRecoveryTimer > 0
  }

  /**
   * Render update - interpolate for smooth visuals
   */
  update(interpolation: number): void {
    this.updateMeshPosition(interpolation)
    this.updateMeshVisuals()
  }

  /**
   * Update mesh position with interpolation
   */
  private updateMeshPosition(interpolation: number): void {
    if (!this.mesh) return
    
    // Interpolate position
    const x = this.lerp(this.position.previousX, this.position.x, interpolation)
    const y = this.lerp(this.position.previousY, this.position.y, interpolation)
    const z = this.lerp(this.position.previousZ, this.position.z, interpolation)
    
    // Add running bob
    let finalY = y
    if (this.visualState.isRunning && !this.visualState.isJumping && !this.visualState.isSliding) {
      const bob = Math.sin(this.visualState.runCycle * Math.PI * 2) * this.bobAmount
      finalY += bob
    }
    
    // Lower character when sliding (duck under obstacles)
    if (this.visualState.isSliding) {
      // Lower by half the height reduction to keep feet on ground
      finalY -= this.height * 0.25
    }
    
    this.mesh.position.set(x, finalY, z)
  }

  /**
   * Update mesh visuals (rotation, scale)
   * AAA Feature: Landing squash/stretch, enhanced tilt
   */
  private updateMeshVisuals(): void {
    if (!this.mesh) return
    
    // AAA: Enhanced lean into lane changes with momentum feel
    const laneDirection = this.targetLane - this.currentLane
    const transitionMomentum = 1 - this.laneTransition
    const targetTilt = laneDirection * this.tiltAmount * transitionMomentum
    this.mesh.rotation.z = this.lerp(this.mesh.rotation.z, targetTilt, 0.15)
    
    // Calculate base scale
    let scaleY = this.runnerScale
    let scaleX = this.runnerScale
    
    // Slide squash
    if (this.visualState.isSliding) {
      scaleY = this.runnerScale * 0.5
      scaleX = this.runnerScale * 1.1 // Slight horizontal stretch when sliding
    } else {
      // AAA: Apply landing squash/stretch
      scaleY = this.runnerScale * this.landingSquash
      // Stretch horizontally when squashed (volume preservation)
      const stretchFactor = 1 + (1 - this.landingSquash) * 0.5
      scaleX = this.runnerScale * stretchFactor
    }
    
    // Smooth scale transitions
    this.mesh.scale.y = this.lerp(this.mesh.scale.y, scaleY, 0.3)
    this.mesh.scale.x = this.lerp(this.mesh.scale.x, scaleX, 0.3)
    
    // Invincibility flash
    if (this.visualState.isInvincible) {
      const flash = Math.sin(performance.now() * 0.02) > 0
      this.mesh.visible = flash
    } else {
      this.mesh.visible = true
    }
  }

  /**
   * Linear interpolation helper
   */
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
  }

  /**
   * Get position for collision checking
   */
  getPosition(): THREE.Vector3 {
    return new THREE.Vector3(this.position.x, this.position.y, this.position.z)
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    // Use track surface height if set, otherwise fall back to old calculation
    const initialY = this.trackSurfaceHeight > 0 ? this.trackSurfaceHeight : this.height / 2 + 0.5
    this.position = {
      x: 0, y: initialY, z: 8,
      previousX: 0, previousY: initialY, previousZ: 8,
    }
    this.currentLane = 0
    this.targetLane = 0
    this.laneTransition = 1
    this.visualState = {
      isRunning: false,
      isJumping: false,
      isSliding: false,
      isInvincible: false,
      runCycle: 0,
    }
    
    // Reset AAA features
    this.landingSquash = 1.0
    this.landingSquashVelocity = 0
    this.laneTransitionProgress = 1
    this.laneTransitionStartX = 0
    this.laneTransitionTargetX = 0
    this.landingRecoveryTimer = 0
    this.landingRecoveryIntensity = 0
    this.groundSettlingTimer = 0
    this.wasAirborne = false
    this.runCycleSpeed = this.BASE_RUN_CYCLE_SPEED
    
    if (this.mesh) {
      this.mesh.position.set(0, initialY, 8)
      this.mesh.rotation.set(0, Math.PI / 2, 0)
      this.mesh.scale.set(
        this.runnerScale,
        this.runnerScale,
        this.runnerScale
      )
      this.mesh.visible = true
    }
  }
}
