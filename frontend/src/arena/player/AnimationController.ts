/**
 * Animation Controller
 * 
 * Manages animation state machine and smooth transitions between animations.
 * Handles blending, crossfading, and animation events.
 */

import * as THREE from 'three'
import type { ArenaAnimationName } from './ArenaCharacterConfig'

/**
 * Player movement state for animation selection
 */
export interface PlayerAnimationState {
  isMoving: boolean
  isRunning: boolean
  isSprinting: boolean
  isJumping: boolean
  isGrounded: boolean
  isCrouching: boolean
  isSliding: boolean
  isShooting: boolean
  isReloading: boolean
  isDead: boolean
  isHit: boolean
  moveDirection: { x: number; z: number } // -1 to 1 for each axis
}

/**
 * Animation transition configuration
 */
interface AnimationTransition {
  from: ArenaAnimationName | '*'
  to: ArenaAnimationName
  duration: number // Crossfade duration in seconds
}

/**
 * Default transition durations
 */
const DEFAULT_TRANSITIONS: AnimationTransition[] = [
  // Quick transitions for responsive feel
  { from: '*', to: 'idle', duration: 0.2 },
  { from: '*', to: 'run', duration: 0.15 },
  { from: '*', to: 'walk', duration: 0.2 },
  { from: '*', to: 'sprint', duration: 0.1 },
  
  // Instant for combat responsiveness
  { from: '*', to: 'shoot', duration: 0.05 },
  { from: '*', to: 'hitReact', duration: 0.05 },
  { from: '*', to: 'death', duration: 0.1 },
  
  // Smooth for movement transitions
  { from: 'idle', to: 'walk', duration: 0.25 },
  { from: 'walk', to: 'run', duration: 0.2 },
  { from: 'run', to: 'sprint', duration: 0.15 },
  
  // Jump transitions
  { from: '*', to: 'jump', duration: 0.1 },
  { from: 'jump', to: 'idle', duration: 0.2 },
  { from: 'jump', to: 'run', duration: 0.15 },
  
  // Crouch transitions
  { from: '*', to: 'crouch', duration: 0.2 },
  { from: '*', to: 'crouchWalk', duration: 0.2 },
  { from: 'crouch', to: 'idle', duration: 0.25 },
  
  // Tactical moves
  { from: '*', to: 'slide', duration: 0.1 },
  { from: '*', to: 'roll', duration: 0.1 },
  { from: 'slide', to: 'run', duration: 0.2 },
  { from: 'roll', to: 'idle', duration: 0.2 },
  
  // Reload
  { from: '*', to: 'reload', duration: 0.15 },
  { from: '*', to: 'reloadKneeling', duration: 0.15 },
  { from: 'reload', to: 'idle', duration: 0.2 },
]

/**
 * Controls character animations based on game state
 */
export class AnimationController {
  private mixer: THREE.AnimationMixer
  private animations: Map<ArenaAnimationName, THREE.AnimationClip>
  private actions: Map<ArenaAnimationName, THREE.AnimationAction> = new Map()
  private currentAnimation: ArenaAnimationName | null = null
  private transitions: AnimationTransition[]
  private onAnimationComplete?: (name: ArenaAnimationName) => void

  constructor(
    mixer: THREE.AnimationMixer,
    animations: Map<ArenaAnimationName, THREE.AnimationClip>,
    customTransitions?: AnimationTransition[]
  ) {
    this.mixer = mixer
    this.animations = animations
    this.transitions = customTransitions || DEFAULT_TRANSITIONS

    // Create actions for all animations
    this.initializeActions()

    // Listen for animation completion
    this.mixer.addEventListener('finished', (e) => {
      const action = e.action as THREE.AnimationAction
      const name = this.getAnimationNameForAction(action)
      if (name && this.onAnimationComplete) {
        this.onAnimationComplete(name)
      }
    })
  }

  /**
   * Initialize animation actions
   */
  private initializeActions(): void {
    for (const [name, clip] of this.animations) {
      const action = this.mixer.clipAction(clip)
      this.actions.set(name, action)
    }
  }

  /**
   * Get animation name for an action
   */
  private getAnimationNameForAction(action: THREE.AnimationAction): ArenaAnimationName | null {
    for (const [name, a] of this.actions) {
      if (a === action) return name
    }
    return null
  }

  /**
   * Get transition duration between two animations
   */
  private getTransitionDuration(from: ArenaAnimationName | null, to: ArenaAnimationName): number {
    // Look for specific transition
    const specific = this.transitions.find(
      t => t.from === from && t.to === to
    )
    if (specific) return specific.duration

    // Look for wildcard transition
    const wildcard = this.transitions.find(
      t => t.from === '*' && t.to === to
    )
    if (wildcard) return wildcard.duration

    // Default
    return 0.2
  }

  /**
   * Play an animation with crossfade
   */
  play(name: ArenaAnimationName, options?: {
    loop?: boolean
    timeScale?: number
    clampWhenFinished?: boolean
  }): void {
    const action = this.actions.get(name)
    if (!action) {
      console.warn(`[AnimationController] Animation not found: ${name}`)
      return
    }

    // Configure action
    action.loop = options?.loop !== false ? THREE.LoopRepeat : THREE.LoopOnce
    action.timeScale = options?.timeScale ?? 1
    action.clampWhenFinished = options?.clampWhenFinished ?? false

    // Get transition duration
    const duration = this.getTransitionDuration(this.currentAnimation, name)

    // Crossfade from current animation
    if (this.currentAnimation && this.currentAnimation !== name) {
      const currentAction = this.actions.get(this.currentAnimation)
      if (currentAction) {
        action.reset()
        action.setEffectiveTimeScale(options?.timeScale ?? 1)
        action.setEffectiveWeight(1)
        action.crossFadeFrom(currentAction, duration, true)
        action.play()
      }
    } else {
      action.reset()
      action.fadeIn(duration)
      action.play()
    }

    this.currentAnimation = name
  }

  /**
   * Update animation based on player state
   * Call this every frame with current player state
   */
  updateFromState(state: PlayerAnimationState): void {
    // Priority-based animation selection
    const targetAnim = this.selectAnimation(state)
    
    if (targetAnim !== this.currentAnimation) {
      const options = this.getAnimationOptions(targetAnim, state)
      this.play(targetAnim, options)
    }
  }

  /**
   * Select animation based on state priority
   */
  private selectAnimation(state: PlayerAnimationState): ArenaAnimationName {
    // Highest priority: Death
    if (state.isDead) return 'death'

    // Hit reaction (brief, then return to previous)
    if (state.isHit) return 'hitReact'

    // Reloading
    if (state.isReloading) {
      return state.isCrouching ? 'reloadKneeling' : 'reload'
    }

    // Sliding
    if (state.isSliding) return 'slide'

    // Jumping/Airborne
    if (state.isJumping || !state.isGrounded) return 'jump'

    // Crouching
    if (state.isCrouching) {
      if (state.isMoving) return 'crouchWalk'
      return 'crouch'
    }

    // Movement with shooting
    if (state.isShooting && state.isMoving) return 'shoot'

    // Movement
    if (state.isMoving) {
      // Check for backward/strafe movement
      if (state.moveDirection.z < -0.5) return 'walkBackward'
      if (Math.abs(state.moveDirection.x) > 0.7 && Math.abs(state.moveDirection.z) < 0.3) {
        return 'walkLeft' // Use for both left/right, mirror in renderer
      }

      // Forward movement
      if (state.isSprinting) return 'sprint'
      if (state.isRunning) return 'run'
      return 'walk'
    }

    // Idle
    return 'idle'
  }

  /**
   * Get animation options based on context
   */
  private getAnimationOptions(
    anim: ArenaAnimationName,
    _state: PlayerAnimationState
  ): { loop?: boolean; timeScale?: number; clampWhenFinished?: boolean } {
    switch (anim) {
      case 'death':
        return { loop: false, clampWhenFinished: true }
      case 'hitReact':
        return { loop: false, timeScale: 1.5 }
      case 'reload':
      case 'reloadKneeling':
        return { loop: false }
      case 'roll':
      case 'slide':
        return { loop: false }
      case 'jump':
        return { loop: false }
      case 'sprint':
        return { timeScale: 1.2 }
      default:
        return { loop: true }
    }
  }

  /**
   * Set callback for animation completion
   */
  setOnAnimationComplete(callback: (name: ArenaAnimationName) => void): void {
    this.onAnimationComplete = callback
  }

  /**
   * Update the mixer (call every frame)
   */
  update(deltaTime: number): void {
    this.mixer.update(deltaTime)
  }

  /**
   * Get current animation name
   */
  getCurrentAnimation(): ArenaAnimationName | null {
    return this.currentAnimation
  }

  /**
   * Stop all animations
   */
  stopAll(): void {
    this.mixer.stopAllAction()
    this.currentAnimation = null
  }

  /**
   * Add a new animation clip at runtime
   */
  addAnimation(name: ArenaAnimationName, clip: THREE.AnimationClip): void {
    this.animations.set(name, clip)
    const action = this.mixer.clipAction(clip)
    this.actions.set(name, action)
  }

  /**
   * Check if an animation is loaded
   */
  hasAnimation(name: ArenaAnimationName): boolean {
    return this.animations.has(name)
  }
}
