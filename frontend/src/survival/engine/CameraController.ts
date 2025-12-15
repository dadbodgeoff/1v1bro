/**
 * CameraController - Smooth camera following with interpolation
 * Prevents jerky camera movement and adds polish
 * 
 * Mobile-optimized: Uses dynamic config for camera positioning
 */

import * as THREE from 'three'
import { getRendererConfig } from '../config/constants'
import { ScreenShakeSystem } from '../effects/ScreenShakeSystem'

export interface CameraState {
  position: THREE.Vector3
  lookAt: THREE.Vector3
}

export class CameraController {
  private camera: THREE.PerspectiveCamera
  
  // Target state (where we want to be)
  private targetPosition: THREE.Vector3 = new THREE.Vector3()
  private targetLookAt: THREE.Vector3 = new THREE.Vector3()
  
  // Current state (smoothed)
  private currentPosition: THREE.Vector3 = new THREE.Vector3()
  private currentLookAt: THREE.Vector3 = new THREE.Vector3()
  
  // Previous state (for interpolation)
  private previousPosition: THREE.Vector3 = new THREE.Vector3()
  private previousLookAt: THREE.Vector3 = new THREE.Vector3()
  
  // Smoothing
  private readonly POSITION_SMOOTHING: number = 8  // Higher = faster follow
  private readonly LOOKAT_SMOOTHING: number = 10
  
  // Offset from player (from dynamic config)
  private heightOffset: number
  private distanceOffset: number
  private readonly LOOKAT_DISTANCE: number = 50  // How far ahead to look

  // AAA Feature: Camera lead (anticipate lane changes)
  private cameraLeadX: number = 0
  private readonly CAMERA_LEAD_AMOUNT: number = 1.5 // How far to lead
  // @ts-expect-error Reserved for future dynamic lead speed
  private readonly _CAMERA_LEAD_SPEED: number = 4 // How fast to lead

  // AAA Feature: Camera bob synced to run cycle
  private cameraBobPhase: number = 0
  private readonly CAMERA_BOB_AMOUNT: number = 0.08 // Subtle vertical bob
  // @ts-expect-error Reserved for future dynamic bob speed
  private readonly _CAMERA_BOB_SPEED: number = 8 // Cycles per second

  // AAA Feature: Impact zoom
  private impactZoomAmount: number = 0
  private impactZoomVelocity: number = 0
  private readonly IMPACT_ZOOM_RECOVERY: number = 8
  private readonly IMPACT_ZOOM_DAMPING: number = 0.85

  // AAA Feature: Screen shake system
  private shakeSystem: ScreenShakeSystem = new ScreenShakeSystem()

  // AAA Feature: Camera tilt on lane changes
  private currentTilt: number = 0
  private targetTilt: number = 0
  private tiltVelocity: number = 0
  private readonly MAX_TILT: number = 0.052  // 3 degrees in radians
  private readonly TILT_SPEED: number = 12
  private readonly TILT_DAMPING: number = 0.85
  private isAirborne: boolean = false

  // AAA Feature: Vertical lag on landing (camera catches up after player)
  private verticalLagOffset: number = 0
  private verticalLagVelocity: number = 0
  private readonly VERTICAL_LAG_RECOVERY: number = 15 // How fast camera catches up
  private readonly VERTICAL_LAG_DAMPING: number = 0.9
  private wasAirborneLastFrame: boolean = false

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera
    
    // Get camera offsets from dynamic config
    const config = getRendererConfig()
    this.heightOffset = config.cameraHeight
    this.distanceOffset = config.cameraDistance
  }

  /**
   * Initialize camera position
   */
  initialize(playerZ: number): void {
    const pos = new THREE.Vector3(0, this.heightOffset, playerZ + this.distanceOffset)
    const lookAt = new THREE.Vector3(0, 0, playerZ - this.LOOKAT_DISTANCE)
    
    this.targetPosition.copy(pos)
    this.targetLookAt.copy(lookAt)
    this.currentPosition.copy(pos)
    this.currentLookAt.copy(lookAt)
    this.previousPosition.copy(pos)
    this.previousLookAt.copy(lookAt)
    
    this.camera.position.copy(pos)
    this.camera.lookAt(lookAt)
  }

  /**
   * Store previous state for interpolation
   * MUST be called at the START of fixed update, before any physics
   */
  storePreviousState(): void {
    this.previousPosition.copy(this.currentPosition)
    this.previousLookAt.copy(this.currentLookAt)
  }

  /**
   * Set target position based on player
   * AAA Feature: Camera lead anticipates lane changes
   */
  setTarget(playerX: number, playerZ: number, targetLaneX: number = playerX): void {
    // Note: previous state is now stored by storePreviousState() called from engine
    
    // AAA: Camera lead - anticipate where player is going
    const leadTarget = (targetLaneX - playerX) * this.CAMERA_LEAD_AMOUNT
    
    // Calculate new target with lead
    this.targetPosition.set(
      playerX * 0.3 + this.cameraLeadX, // Include camera lead
      this.heightOffset,
      playerZ + this.distanceOffset
    )
    
    this.targetLookAt.set(
      playerX * 0.5 + leadTarget * 0.5, // Look toward where player is going
      0,
      playerZ - this.LOOKAT_DISTANCE
    )
    
    // Store lead target for smooth transition
    this.cameraLeadX += (leadTarget - this.cameraLeadX) * 0.1
  }

  /**
   * AAA Feature: Set tilt target based on lane change direction
   * @param direction -1 for left, 0 for neutral, 1 for right
   */
  setTiltTarget(direction: -1 | 0 | 1): void {
    // Tilt in opposite direction of movement for "leaning into turn" feel
    this.targetTilt = -direction * this.MAX_TILT
  }

  /**
   * AAA Feature: Add trauma for screen shake
   * @param amount Trauma amount (0-1), will be capped
   */
  addShakeTrauma(amount: number): void {
    this.shakeSystem.addTrauma(amount)
  }

  /**
   * Get the screen shake system for direct access
   */
  getShakeSystem(): ScreenShakeSystem {
    return this.shakeSystem
  }

  /**
   * Fixed update - move toward target
   * AAA Feature: Camera bob synced to run cycle, vertical lag on landing
   */
  fixedUpdate(delta: number, isRunning: boolean = true, runCycle: number = 0, isAirborne: boolean = false): void {
    // Smooth position
    this.currentPosition.lerp(this.targetPosition, this.POSITION_SMOOTHING * delta)
    this.currentLookAt.lerp(this.targetLookAt, this.LOOKAT_SMOOTHING * delta)
    
    // AAA: Update camera bob phase
    if (isRunning) {
      this.cameraBobPhase = runCycle
    }

    // AAA: Detect landing and trigger vertical lag
    if (this.wasAirborneLastFrame && !isAirborne) {
      // Just landed - camera should lag behind briefly for "weight" feel
      // The offset pushes camera up slightly, then it settles down
      this.verticalLagOffset = 0.3 // Camera stays slightly higher momentarily
      this.verticalLagVelocity = 0
    }
    this.wasAirborneLastFrame = isAirborne

    // AAA: Update vertical lag recovery (spring physics)
    if (this.verticalLagOffset !== 0) {
      const springForce = -this.verticalLagOffset * this.VERTICAL_LAG_RECOVERY
      this.verticalLagVelocity += springForce * delta
      this.verticalLagVelocity *= this.VERTICAL_LAG_DAMPING
      this.verticalLagOffset += this.verticalLagVelocity
      
      // Snap to 0 when close
      if (Math.abs(this.verticalLagOffset) < 0.01 && Math.abs(this.verticalLagVelocity) < 0.01) {
        this.verticalLagOffset = 0
        this.verticalLagVelocity = 0
      }
    }
    
    // AAA: Update impact zoom recovery (spring physics)
    if (this.impactZoomAmount !== 0) {
      const springForce = -this.impactZoomAmount * this.IMPACT_ZOOM_RECOVERY
      this.impactZoomVelocity += springForce * delta
      this.impactZoomVelocity *= this.IMPACT_ZOOM_DAMPING
      this.impactZoomAmount += this.impactZoomVelocity
      
      // Snap to 0 when close
      if (Math.abs(this.impactZoomAmount) < 0.01 && Math.abs(this.impactZoomVelocity) < 0.01) {
        this.impactZoomAmount = 0
        this.impactZoomVelocity = 0
      }
    }

    // AAA: Update screen shake
    this.shakeSystem.update(delta)

    // AAA: Update camera tilt (spring physics)
    this.isAirborne = isAirborne
    const effectiveTargetTilt = isAirborne ? this.targetTilt * 0.5 : this.targetTilt
    
    const tiltSpringForce = (effectiveTargetTilt - this.currentTilt) * this.TILT_SPEED
    this.tiltVelocity += tiltSpringForce * delta
    this.tiltVelocity *= this.TILT_DAMPING
    this.currentTilt += this.tiltVelocity
    
    // Clamp tilt to max
    this.currentTilt = Math.max(-this.MAX_TILT, Math.min(this.MAX_TILT, this.currentTilt))
    
    // Snap to 0 when close and target is 0
    if (this.targetTilt === 0 && Math.abs(this.currentTilt) < 0.001 && Math.abs(this.tiltVelocity) < 0.001) {
      this.currentTilt = 0
      this.tiltVelocity = 0
    }
  }

  /**
   * Get current tilt value (for testing)
   */
  getTilt(): number {
    return this.currentTilt
  }

  /**
   * Check if tilt is reduced due to airborne state
   */
  isAirborneReduced(): boolean {
    return this.isAirborne
  }

  // Reusable vectors for interpolation (avoid GC pressure)
  private interpPosition: THREE.Vector3 = new THREE.Vector3()
  private interpLookAt: THREE.Vector3 = new THREE.Vector3()

  /**
   * Render update - interpolate for smooth visuals
   * AAA Feature: Apply camera bob, impact zoom, shake, and tilt
   */
  update(interpolation: number, isRunning: boolean = true, isJumping: boolean = false): void {
    // Interpolate between previous and current state (reuse vectors)
    this.interpPosition.lerpVectors(
      this.previousPosition,
      this.currentPosition,
      interpolation
    )
    
    this.interpLookAt.lerpVectors(
      this.previousLookAt,
      this.currentLookAt,
      interpolation
    )
    
    // AAA: Apply subtle camera bob while running (not jumping)
    if (isRunning && !isJumping) {
      const bobOffset = Math.sin(this.cameraBobPhase * Math.PI * 2) * this.CAMERA_BOB_AMOUNT
      this.interpPosition.y += bobOffset
    }

    // AAA: Apply vertical lag offset (camera catches up after landing)
    if (this.verticalLagOffset !== 0) {
      this.interpPosition.y += this.verticalLagOffset
    }
    
    // AAA: Apply impact zoom (push camera back on hit)
    if (this.impactZoomAmount !== 0) {
      this.interpPosition.z += this.impactZoomAmount
    }

    // AAA: Apply screen shake offset
    if (this.shakeSystem.isActive()) {
      const shakeOffset = this.shakeSystem.getOffset()
      this.interpPosition.x += shakeOffset.x
      this.interpPosition.y += shakeOffset.y
      // Rotation shake applied after lookAt
    }
    
    this.camera.position.copy(this.interpPosition)
    this.camera.lookAt(this.interpLookAt)

    // AAA: Apply camera tilt (roll) and shake rotation
    let totalRoll = this.currentTilt
    if (this.shakeSystem.isActive()) {
      totalRoll += this.shakeSystem.getOffset().rotation
    }
    if (totalRoll !== 0) {
      this.camera.rotation.z = totalRoll
    }
  }

  /**
   * AAA Feature: Trigger impact zoom (camera pushes back on collision)
   */
  triggerImpactZoom(intensity: number = 1): void {
    this.impactZoomAmount = intensity * 2 // Push back 2 units at full intensity
    this.impactZoomVelocity = 0
  }

  /**
   * Apply camera shake (for impacts)
   * Now uses trauma-based shake system for better feel
   * @param intensity Trauma amount (0-1)
   * @param _duration Deprecated, decay is automatic
   */
  shake(intensity: number = 0.5, _duration: number = 0.2): void {
    // Use the new trauma-based shake system
    this.shakeSystem.addTrauma(intensity)
  }

  /**
   * Get current camera state
   */
  getState(): CameraState {
    return {
      position: this.camera.position.clone(),
      lookAt: this.currentLookAt.clone(),
    }
  }

  /**
   * Reset camera controller state
   */
  reset(): void {
    this.cameraLeadX = 0
    this.cameraBobPhase = 0
    this.impactZoomAmount = 0
    this.impactZoomVelocity = 0
    this.currentTilt = 0
    this.targetTilt = 0
    this.tiltVelocity = 0
    this.isAirborne = false
    this.verticalLagOffset = 0
    this.verticalLagVelocity = 0
    this.wasAirborneLastFrame = false
    this.shakeSystem.reset()
    
    // Reset position vectors to default
    const defaultPos = new THREE.Vector3(0, this.heightOffset, this.distanceOffset + 8)
    const defaultLookAt = new THREE.Vector3(0, 0, 8 - this.LOOKAT_DISTANCE)
    
    this.targetPosition.copy(defaultPos)
    this.targetLookAt.copy(defaultLookAt)
    this.currentPosition.copy(defaultPos)
    this.currentLookAt.copy(defaultLookAt)
    this.previousPosition.copy(defaultPos)
    this.previousLookAt.copy(defaultLookAt)
    
    // Also reset the actual camera
    this.camera.position.copy(defaultPos)
    this.camera.lookAt(defaultLookAt)
    this.camera.rotation.z = 0
  }
}
