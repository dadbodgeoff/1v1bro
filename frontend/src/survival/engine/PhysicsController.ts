/**
 * PhysicsController - Handles player physics and collision detection
 * Uses raycasting for ground detection and simple AABB for boundaries
 * 
 * Mobile Optimization:
 * - Uses device-specific coyote time from mobile config
 * - Longer grace periods on touch devices for better feel
 */

import * as THREE from 'three'
import type { Lane } from '../types/survival'
import { getSurvivalConfig } from '../config/constants'
import { getMobileConfig } from '../config/mobile'
import { WorldConfig } from '../config/WorldConfig'

export interface PhysicsState {
  isGrounded: boolean
  isFalling: boolean
  velocityY: number
  groundHeight: number
}

export interface PhysicsConfig {
  gravity: number
  jumpForce: number
  terminalVelocity: number
  groundCheckDistance: number
  playerRadius: number
  trackWidth: number
}

const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  gravity: -50, // Gravity acceleration (units/sec²)
  jumpForce: 18, // Initial jump velocity
  terminalVelocity: -40, // Max fall speed
  groundCheckDistance: 5, // How far down to raycast
  playerRadius: 0.5, // Player collision radius
  trackWidth: 7, // Track width for boundary checks
}

// AAA Feature: Gravity scaling - faster fall than rise for snappier feel
const GRAVITY_SCALE_FALLING = 1.6 // Multiplier when falling (faster descent)
const GRAVITY_SCALE_JUMP_RELEASE = 2.2 // Multiplier when jump released early (variable height)

// AAA Feature: Variable jump height
const MAX_JUMP_HOLD_TIME = 0.25 // Maximum time holding affects jump

// AAA Feature: Air control
const AIR_CONTROL_STRENGTH = 0.3 // How much lane influence while airborne (0-1)

// Small offset to prevent z-fighting between character feet and ground surface
const GROUND_SURFACE_EPSILON = 0.05

export class PhysicsController {
  private config: PhysicsConfig
  private raycaster: THREE.Raycaster
  private downDirection: THREE.Vector3
  
  // Physics state
  private velocityY: number = 0
  private isGrounded: boolean = true
  private groundHeight: number = 0
  private isFalling: boolean = false
  private fallTimer: number = 0

  // Character dimensions (set from model)
  private characterFootOffset: number = 0 // Distance from model origin to feet

  // AAA Feature: Coyote Time - allows jump briefly after leaving edge
  // Uses mobile config for device-specific timing
  private coyoteTimer: number = 0
  private coyoteTime: number // Set from mobile config
  private wasGroundedLastFrame: boolean = true
  private unsubscribeConfig: (() => void) | null = null

  // AAA Feature: Jump Buffering - queue jump before landing
  private jumpBufferTimer: number = 0
  private readonly JUMP_BUFFER_TIME: number = 0.15 // 150ms buffer window

  // AAA Feature: Landing detection for squash/stretch
  private justLanded: boolean = false
  private landingVelocity: number = 0

  // AAA Feature: Variable jump height
  private jumpHoldTimer: number = 0
  private isJumpHeld: boolean = false
  private jumpReleased: boolean = false // Track if jump was released mid-air

  // AAA Feature: Air control
  private airControlInput: number = 0 // -1 to 1 for lane influence

  // References
  private scene: THREE.Scene | null = null
  private trackMeshes: THREE.Object3D[] = []

  constructor(config: Partial<PhysicsConfig> = {}) {
    this.config = { ...DEFAULT_PHYSICS_CONFIG, ...config }
    this.raycaster = new THREE.Raycaster()
    this.downDirection = new THREE.Vector3(0, -1, 0)
    
    // Get coyote time from mobile config (device-specific)
    const mobileConfig = getMobileConfig()
    this.coyoteTime = mobileConfig.balance.coyoteTimeMs / 1000 // Convert to seconds
    
    // Get lane width from survival config
    const survivalConfig = getSurvivalConfig()
    this.laneWidth = survivalConfig.laneWidth
  }

  // Lane width from config
  private laneWidth: number = 1.5

  /**
   * Dispose and cleanup subscriptions
   */
  dispose(): void {
    if (this.unsubscribeConfig) {
      this.unsubscribeConfig()
      this.unsubscribeConfig = null
    }
  }

  /**
   * Initialize with scene reference
   */
  initialize(scene: THREE.Scene): void {
    this.scene = scene
  }

  /**
   * Update track meshes for raycasting
   */
  setTrackMeshes(meshes: THREE.Object3D[]): void {
    this.trackMeshes = meshes
  }

  /**
   * Set character dimensions for proper ground placement
   * @param _height Total character height (for reference)
   * @param footOffset Distance from model origin (0,0,0) to feet (usually negative or 0)
   */
  setCharacterDimensions(_height: number, footOffset: number = 0): void {
    this.characterFootOffset = footOffset
  }

  /**
   * Main physics update - call every frame
   * Implements AAA features: coyote time, jump buffering, landing detection,
   * variable jump height, gravity scaling, air control
   */
  update(
    delta: number,
    playerPosition: THREE.Vector3,
    isJumpPressed: boolean,
    currentLane: Lane
  ): { newY: number; isGrounded: boolean; isFalling: boolean; shouldLoseLife: boolean; justLanded: boolean; landingVelocity: number; airControlInfluence: number; didJump: boolean } {
    
    // Reset per-frame flags
    this.justLanded = false
    
    // Check ground beneath player
    const groundCheck = this.checkGround(playerPosition)
    
    // AAA Feature: Update coyote time
    if (this.wasGroundedLastFrame && !groundCheck.hit) {
      // Just left ground - start coyote timer
      this.coyoteTimer = this.coyoteTime
    } else if (groundCheck.hit) {
      this.coyoteTimer = 0
    } else {
      // Decrement coyote timer while airborne
      this.coyoteTimer = Math.max(0, this.coyoteTimer - delta)
    }
    
    // AAA Feature: Jump buffering - queue jump input
    if (isJumpPressed) {
      this.jumpBufferTimer = this.JUMP_BUFFER_TIME
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta)
    }
    
    // Determine if we can jump (grounded OR within coyote time)
    const canJump = (this.isGrounded || this.coyoteTimer > 0) && !this.isFalling
    
    // Handle jumping - check both direct press and buffered jump
    const wantsToJump = isJumpPressed || this.jumpBufferTimer > 0
    let didJump = false
    if (wantsToJump && canJump) {
      this.velocityY = this.config.jumpForce
      this.isGrounded = false
      this.coyoteTimer = 0 // Consume coyote time
      this.jumpBufferTimer = 0 // Consume buffered jump
      // AAA: Start variable jump tracking
      this.jumpHoldTimer = 0
      this.isJumpHeld = true
      this.jumpReleased = false
      didJump = true
    }
    
    // AAA Feature: Variable jump height - track hold duration
    if (this.isJumpHeld && !this.isGrounded) {
      if (isJumpPressed) {
        this.jumpHoldTimer += delta
        // Apply upward boost while holding (up to max time)
        if (this.jumpHoldTimer < MAX_JUMP_HOLD_TIME && this.velocityY > 0) {
          // Small upward boost while holding
          const holdBoost = 0.5 * (1 - this.jumpHoldTimer / MAX_JUMP_HOLD_TIME)
          this.velocityY += holdBoost
        }
      } else {
        // Jump released - mark for faster fall
        this.isJumpHeld = false
        this.jumpReleased = true
      }
    }
    
    // Apply gravity when airborne with AAA scaling
    if (!this.isGrounded) {
      let gravityScale = 1.0
      
      // AAA Feature: Gravity scaling
      if (this.velocityY < 0) {
        // Falling - apply faster gravity for snappier descent
        gravityScale = GRAVITY_SCALE_FALLING
      } else if (this.jumpReleased && this.velocityY > 0) {
        // Jump released early while still rising - cut jump short
        gravityScale = GRAVITY_SCALE_JUMP_RELEASE
      }
      
      this.velocityY += this.config.gravity * gravityScale * delta
      this.velocityY = Math.max(this.velocityY, this.config.terminalVelocity)
    }
    
    // Calculate new Y position
    let newY = playerPosition.y + this.velocityY * delta
    
    // Ground collision
    if (groundCheck.hit) {
      this.groundHeight = groundCheck.height
      
      if (newY <= this.groundHeight + 0.1) {
        // AAA Feature: Landing detection
        if (!this.isGrounded && this.velocityY < -1) {
          this.justLanded = true
          this.landingVelocity = Math.abs(this.velocityY)
        }
        
        // Land on ground
        newY = this.groundHeight
        this.velocityY = 0
        this.isGrounded = true
        this.isFalling = false
        this.fallTimer = 0
      }
    } else {
      // No ground detected - player is over a gap or off track
      this.isGrounded = false
      
      // Check if player is within track X bounds
      const laneX = currentLane * this.laneWidth
      const trackHalfWidth = this.config.trackWidth / 2
      const isWithinTrackX = Math.abs(playerPosition.x - laneX) < trackHalfWidth
      
      if (!isWithinTrackX || newY < -10) {
        // Player fell off the track
        this.isFalling = true
        this.fallTimer += delta
        
        // Give a brief moment before counting as death (for gap jumps)
        if (this.fallTimer > 0.5) {
          return {
            newY,
            isGrounded: false,
            isFalling: true,
            shouldLoseLife: true,
            justLanded: false,
            landingVelocity: 0,
            airControlInfluence: 0,
            didJump: false,
          }
        }
      }
    }
    
    // Store for next frame's coyote time check
    this.wasGroundedLastFrame = this.isGrounded
    
    // Reset air control when landing
    if (this.isGrounded) {
      this.airControlInput = 0
      this.isJumpHeld = false
      this.jumpReleased = false
    }
    
    return {
      newY: Math.max(newY, -20), // Clamp to prevent infinite fall
      isGrounded: this.isGrounded,
      isFalling: this.isFalling,
      shouldLoseLife: false,
      justLanded: this.justLanded,
      landingVelocity: this.landingVelocity,
      airControlInfluence: this.isGrounded ? 0 : this.airControlInput * AIR_CONTROL_STRENGTH,
      didJump, // AAA: Track if jump was triggered this frame
    }
  }

  /**
   * AAA Feature: Set air control input for mid-air lane adjustment
   * @param direction -1 for left, 1 for right, 0 for neutral
   */
  setAirControlInput(direction: number): void {
    if (!this.isGrounded) {
      this.airControlInput = Math.max(-1, Math.min(1, direction))
    }
  }

  // Reusable vector for raycasting (avoid GC pressure)
  private rayOrigin: THREE.Vector3 = new THREE.Vector3()
  
  // Reusable result objects
  private groundHitResult = { hit: true, height: 1.3 }
  private groundMissResult = { hit: false, height: 0 }

  /**
   * Raycast downward to find ground
   * Returns the Y position where the character's feet should be
   * 
   * Enterprise: Uses WorldConfig as single source of truth for track surface height
   */
  private checkGround(position: THREE.Vector3): { hit: boolean; height: number } {
    // Get track surface height from WorldConfig (single source of truth)
    const trackSurfaceHeight = WorldConfig.getInstance().getTrackSurfaceHeight()
    
    // Calculate the target ground height for character feet
    // = track surface + epsilon (prevent z-fighting) - character foot offset (model origin to feet)
    const targetGroundHeight = trackSurfaceHeight + GROUND_SURFACE_EPSILON - this.characterFootOffset
    
    // If no scene or track meshes, use fallback with track surface height
    if (!this.scene || this.trackMeshes.length === 0) {
      this.groundHitResult.height = targetGroundHeight
      return this.groundHitResult
    }

    // Cast ray from above player position downward (reuse vector)
    this.rayOrigin.set(
      position.x,
      position.y + 2, // Start ray above player
      position.z
    )

    this.raycaster.set(this.rayOrigin, this.downDirection)
    this.raycaster.far = this.config.groundCheckDistance + 2

    // Check intersection with track meshes
    const intersects = this.raycaster.intersectObjects(this.trackMeshes, true)

    if (intersects.length > 0) {
      const closest = intersects[0]
      // Ground height = raycast hit point + epsilon - character foot offset
      this.groundHitResult.height =
        closest.point.y + GROUND_SURFACE_EPSILON - this.characterFootOffset
      return this.groundHitResult
    }

    // No raycast hit - use fallback based on track surface height
    // Check if player is within reasonable bounds
    const expectedGroundLevel = trackSurfaceHeight + 3 // Allow some tolerance
    const isNearGroundLevel = position.y < expectedGroundLevel
    const isWithinTrackX = Math.abs(position.x) < this.config.trackWidth / 2
    
    if (isNearGroundLevel && isWithinTrackX) {
      this.groundHitResult.height = targetGroundHeight
      return this.groundHitResult
    }

    return this.groundMissResult
  }

  /**
   * Check if player is within lane boundaries
   */
  checkLaneBounds(playerX: number, targetLane: Lane): boolean {
    const targetX = targetLane * this.laneWidth
    const tolerance = this.laneWidth * 0.6
    return Math.abs(playerX - targetX) < tolerance
  }

  /**
   * Trigger a jump
   */
  jump(): boolean {
    if (this.isGrounded && !this.isFalling) {
      this.velocityY = this.config.jumpForce
      this.isGrounded = false
      return true
    }
    return false
  }

  /**
   * Get current physics state
   */
  getState(): PhysicsState {
    return {
      isGrounded: this.isGrounded,
      isFalling: this.isFalling,
      velocityY: this.velocityY,
      groundHeight: this.groundHeight,
    }
  }

  /**
   * Reset physics state
   */
  reset(): void {
    this.velocityY = 0
    this.isGrounded = true
    this.isFalling = false
    this.fallTimer = 0
    this.groundHeight = 0
    this.coyoteTimer = 0
    this.jumpBufferTimer = 0
    this.wasGroundedLastFrame = true
    this.justLanded = false
    this.landingVelocity = 0
    this.jumpHoldTimer = 0
    this.isJumpHeld = false
    this.jumpReleased = false
    this.airControlInput = 0
  }

  /**
   * Force grounded state (for respawn)
   */
  forceGrounded(height: number): void {
    this.isGrounded = true
    this.isFalling = false
    this.velocityY = 0
    this.groundHeight = height
    this.fallTimer = 0
    this.coyoteTimer = 0
    this.jumpBufferTimer = 0
    this.wasGroundedLastFrame = true
  }

  /**
   * AAA Feature: Check if coyote time is active
   * Useful for UI feedback (show jump is still available)
   */
  hasCoyoteTime(): boolean {
    return this.coyoteTimer > 0
  }

  /**
   * AAA Feature: Check if jump is buffered
   * Useful for UI feedback
   */
  hasBufferedJump(): boolean {
    return this.jumpBufferTimer > 0
  }
}
