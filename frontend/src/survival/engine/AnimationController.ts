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
  private transitionDuration: number = 0.15
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
    
    // Find animation clip in the mesh
    let action: THREE.AnimationAction | null = null
    if (mesh.animations && mesh.animations.length > 0) {
      const clip = mesh.animations[0] // Use first animation
      action = mixer.clipAction(clip)
      action.setLoop(THREE.LoopRepeat, Infinity)
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

    // Hide old mesh, show new mesh
    oldClip.mesh.visible = false
    newClip.mesh.visible = true

    // Stop old animation
    if (oldClip.action) {
      oldClip.action.fadeOut(this.transitionDuration)
    }

    // Start new animation
    if (newClip.action) {
      newClip.action.reset()
      newClip.action.fadeIn(this.transitionDuration)
      newClip.action.play()
      
      // Sync speed
      newClip.action.timeScale = this.currentSpeed
    }

    // Copy position from old mesh to new mesh
    newClip.mesh.position.copy(oldClip.mesh.position)
    newClip.mesh.rotation.copy(oldClip.mesh.rotation)
    newClip.mesh.scale.copy(oldClip.mesh.scale)

    this.activeMesh = newClip.mesh
    this.currentState = newState
    this.isTransitioning = true

    // Clear transition flag after duration
    setTimeout(() => {
      this.isTransitioning = false
    }, this.transitionDuration * 1000)
  }

  /**
   * Update all mixers
   */
  update(delta: number): void {
    this.clips.forEach(clip => {
      clip.mixer.update(delta)
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
