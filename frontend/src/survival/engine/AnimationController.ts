/**
 * AnimationController - Manages character animations
 * Handles loading multiple GLBs with different animations and blending between them
 */

import * as THREE from 'three'

export type AnimationState = 'run' | 'jump' | 'down' | 'idle'

interface AnimationClip {
  name: AnimationState
  mixer: THREE.AnimationMixer
  action: THREE.AnimationAction | null
  mesh: THREE.Group
}

export class AnimationController {
  private clips: Map<AnimationState, AnimationClip> = new Map()
  private currentState: AnimationState = 'run'
  private activeMesh: THREE.Group | null = null
  private scene: THREE.Scene | null = null
  
  // Transition settings
  private isTransitioning: boolean = false

  // Speed sync
  private currentSpeed: number = 1.0

  constructor() {}

  /**
   * Register a mesh with its animation for a specific state
   */
  registerAnimation(
    state: AnimationState,
    mesh: THREE.Group,
    scene: THREE.Scene
  ): void {
    this.scene = scene

    // Create mixer for this mesh
    const mixer = new THREE.AnimationMixer(mesh)
    
    // Debug: Log animation info
    console.log(`[AnimationController] Registering ${state}:`, {
      hasAnimations: !!mesh.animations,
      animationCount: mesh.animations?.length || 0,
      animationNames: mesh.animations?.map(a => a.name) || [],
    })
    
    // Find animation clip in the mesh
    let action: THREE.AnimationAction | null = null
    if (mesh.animations && mesh.animations.length > 0) {
      const clip = mesh.animations[0] // Use first animation
      action = mixer.clipAction(clip)
      
      // Set loop mode based on animation type
      // Run should loop forever, jump/down are one-shot but we still loop them
      // since the game controls when to switch states
      action.setLoop(THREE.LoopRepeat, Infinity)
      
      // Clamp when finished to hold the last frame (prevents snapping to T-pose)
      action.clampWhenFinished = true
      
      console.log(`[AnimationController] ${state}: Animation action created for clip "${clip.name}", duration: ${clip.duration.toFixed(2)}s`)
    } else {
      console.warn(`[AnimationController] ${state}: NO ANIMATIONS FOUND - character will be in T-pose!`)
    }

    // Store clip data
    this.clips.set(state, {
      name: state,
      mixer,
      action,
      mesh,
    })

    // Hide mesh initially (except run which is default)
    mesh.visible = state === 'run'
    
    // Set initial state
    if (state === 'run') {
      this.activeMesh = mesh
      if (action) {
        action.play()
        console.log(`[AnimationController] Started playing 'run' animation`)
      }
    }
  }

  /**
   * Transition to a new animation state
   */
  setState(newState: AnimationState): void {
    if (newState === this.currentState) return
    if (!this.clips.has(newState)) {
      console.warn(`[AnimationController] Unknown state: ${newState}`)
      return
    }

    const oldClip = this.clips.get(this.currentState)
    const newClip = this.clips.get(newState)

    if (!oldClip || !newClip) return

    // IMMEDIATELY hide old mesh and stop its animation
    // This prevents the ghost T-pose from appearing
    oldClip.mesh.visible = false
    if (oldClip.action) {
      oldClip.action.stop() // Stop completely, don't fade (prevents T-pose ghost)
    }
    
    // Show new mesh
    newClip.mesh.visible = true

    // Start new animation fresh
    if (newClip.action) {
      newClip.action.reset()
      newClip.action.enabled = true
      newClip.action.setEffectiveWeight(1)
      newClip.action.play()
      newClip.action.timeScale = this.currentSpeed
    }

    // Copy position from old mesh to new mesh
    newClip.mesh.position.copy(oldClip.mesh.position)
    newClip.mesh.rotation.copy(oldClip.mesh.rotation)
    newClip.mesh.scale.copy(oldClip.mesh.scale)

    this.activeMesh = newClip.mesh
    this.currentState = newState
    this.isTransitioning = true

    // Clear transition flag after a short delay
    setTimeout(() => {
      this.isTransitioning = false
    }, 50)
  }

  /**
   * Update all mixers
   */
  update(delta: number): void {
    // Only update the active clip's mixer to prevent ghost animations
    const activeClip = this.clips.get(this.currentState)
    if (activeClip) {
      activeClip.mixer.update(delta)
      
      // Safeguard: Ensure the active animation is always playing
      if (activeClip.action && !activeClip.action.isRunning()) {
        console.warn(`[AnimationController] Animation '${this.currentState}' stopped unexpectedly - restarting`)
        activeClip.action.reset()
        activeClip.action.play()
      }
    }
    
    // CRITICAL: Enforce visibility - only active mesh should be visible
    // This prevents ghost T-pose from appearing
    this.clips.forEach((clip, state) => {
      const shouldBeVisible = state === this.currentState
      if (clip.mesh.visible !== shouldBeVisible) {
        clip.mesh.visible = shouldBeVisible
      }
    })
  }

  /**
   * Sync animation speed to game speed
   */
  setSpeed(gameSpeed: number): void {
    // Map game speed to animation speed
    // Base speed ~15, max ~40
    // Animation should be 1x at base, faster as speed increases
    const speedRatio = gameSpeed / 15
    this.currentSpeed = Math.max(0.8, Math.min(2.0, speedRatio))

    // Update active animation
    const activeClip = this.clips.get(this.currentState)
    if (activeClip?.action) {
      activeClip.action.timeScale = this.currentSpeed
    }
  }

  /**
   * Get the currently active mesh
   */
  getActiveMesh(): THREE.Group | null {
    return this.activeMesh
  }

  /**
   * Get current animation state
   */
  getCurrentState(): AnimationState {
    return this.currentState
  }

  /**
   * Check if currently transitioning
   */
  isInTransition(): boolean {
    return this.isTransitioning
  }

  /**
   * Set position on all meshes (keeps them in sync)
   */
  setPosition(x: number, y: number, z: number): void {

    this.clips.forEach(clip => {
      clip.mesh.position.set(x, y, z)
    })
  }

  /**
   * Set rotation on all meshes
   */
  setRotation(x: number, y: number, z: number): void {
    this.clips.forEach(clip => {
      clip.mesh.rotation.set(x, y, z)
    })
  }

  /**
   * Set scale on all meshes
   */
  setScale(scale: number): void {
    this.clips.forEach(clip => {
      clip.mesh.scale.setScalar(scale)
    })
  }

  /**
   * Get all meshes (for adding to scene)
   */
  getAllMeshes(): THREE.Group[] {
    return Array.from(this.clips.values()).map(c => c.mesh)
  }

  /**
   * Reset to default state
   */
  reset(): void {
    this.setState('run')
    this.currentSpeed = 1.0
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.clips.forEach(clip => {
      clip.mixer.stopAllAction()
      if (this.scene) {
        this.scene.remove(clip.mesh)
      }
    })
    this.clips.clear()
    this.activeMesh = null
  }
}
