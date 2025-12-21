/**
 * PlayerManager - Handles player setup, animation sync, and respawn
 * Extracted from SurvivalEngine for modularity
 * 
 * Mobile-optimized: Uses dynamic config for runner scale
 */

import * as THREE from 'three'
import type { SurvivalGameState } from '../types/survival'
import { getSurvivalConfig } from '../config/constants'
import { WorldConfig } from '../config/WorldConfig'
import { SurvivalRenderer } from '../renderer/SurvivalRenderer'
import type { LoadedAssets } from '../renderer/AssetLoader'
import { PlayerController } from './PlayerController'
import { PhysicsController } from './PhysicsController'
import { CollisionSystem } from './CollisionSystem'
import { AnimationController, type AnimationState } from './AnimationController'
import { ParticleSystem } from '../effects/ParticleSystem'
import { TransitionSystem } from '../effects/TransitionSystem'
import { getCharacterRotationY } from '../config/themes'

export class PlayerManager {
  private renderer: SurvivalRenderer
  private playerController: PlayerController
  private physicsController: PhysicsController
  private collisionSystem: CollisionSystem
  private particleSystem: ParticleSystem
  private transitionSystem: TransitionSystem
  
  private animationController: AnimationController | null = null
  private useAnimatedCharacter: boolean = false
  private characterHeight: number = 2 // Default, updated from model

  // Config values (from dynamic config)
  private runnerScale: number

  constructor(
    renderer: SurvivalRenderer,
    playerController: PlayerController,
    physicsController: PhysicsController,
    collisionSystem: CollisionSystem,
    particleSystem: ParticleSystem,
    transitionSystem: TransitionSystem
  ) {
    this.renderer = renderer
    this.playerController = playerController
    this.physicsController = physicsController
    this.collisionSystem = collisionSystem
    this.particleSystem = particleSystem
    this.transitionSystem = transitionSystem
    
    // Get config values
    const config = getSurvivalConfig()
    this.runnerScale = config.runnerScale
  }

  /**
   * Setup the player character (uses run mesh as reference for dimensions)
   */
  setupPlayer(assets: LoadedAssets): void {
    const runMesh = assets.character.runner.run.clone()
    const scale = this.runnerScale

    runMesh.scale.set(scale, scale, scale)
    runMesh.rotation.y = getCharacterRotationY()

    const box = new THREE.Box3().setFromObject(runMesh)
    const playerHeight = box.getSize(new THREE.Vector3()).y

    const placeholder = new THREE.Group()
    this.playerController.initialize(placeholder, playerHeight)

    // Set player dimensions on WorldConfig for CollisionSystem to read
    const size = box.getSize(new THREE.Vector3())
    WorldConfig.getInstance().setPlayerDimensions({
      width: size.x,
      height: size.y,
      depth: size.z,
      footOffset: 0,
    })
  }

  /**
   * Setup animated character from loaded assets
   * Sets player dimensions on WorldConfig for other systems to read
   * 
   * NOTE: We use FIXED collision dimensions rather than bounding box from T-pose.
   * The T-pose has arms spread out which makes the collision box too wide.
   * The running pose is much narrower, so we use dimensions that match gameplay.
   */
  setupAnimatedCharacter(assets: LoadedAssets): void {
    const runner = assets.character.runner

    this.animationController = new AnimationController()
    const scene = this.renderer.getScene()
    const scale = this.runnerScale
    const characterRotation = getCharacterRotationY()

    const states: Array<{ state: AnimationState; mesh: THREE.Group }> = [
      { state: 'run', mesh: runner.run },
      { state: 'jump', mesh: runner.jump },
      { state: 'down', mesh: runner.down },
    ]

    // Get the visual height from the model for rendering purposes
    const runMesh = runner.run
    runMesh.scale.setScalar(scale)
    const box = new THREE.Box3().setFromObject(runMesh)
    const visualSize = box.getSize(new THREE.Vector3())
    const min = box.min

    // Use visual height for rendering, but FIXED width/depth for collision
    // The T-pose width is too wide (arms spread), running pose is narrow
    // These values should match the actual running character silhouette
    this.characterHeight = visualSize.y
    const footOffset = min.y * scale
    
    // FIXED collision dimensions - narrow box for running character
    // Width: ~0.6 units (narrow, arms at sides when running)
    // Depth: ~0.4 units (thin front-to-back)
    const collisionWidth = 0.6 * scale
    const collisionDepth = 0.4 * scale

    // Set player dimensions on WorldConfig for other systems to read
    WorldConfig.getInstance().setPlayerDimensions({
      width: collisionWidth,      // FIXED: narrow for running pose
      height: this.characterHeight,
      depth: collisionDepth,      // FIXED: thin front-to-back
      footOffset: footOffset,
    })
    
    console.log(`[PlayerManager] Character dimensions set:`)
    console.log(`  Visual size (T-pose): ${visualSize.x.toFixed(2)} x ${visualSize.y.toFixed(2)} x ${visualSize.z.toFixed(2)}`)
    console.log(`  Collision size (running): ${collisionWidth.toFixed(2)} x ${this.characterHeight.toFixed(2)} x ${collisionDepth.toFixed(2)}`)

    this.physicsController.setCharacterDimensions(this.characterHeight, footOffset)

    for (const { state, mesh } of states) {
      mesh.scale.setScalar(scale)
      mesh.rotation.y = characterRotation
      scene.add(mesh)
      this.animationController.registerAnimation(state, mesh, scene)
    }

    const playerPos = this.playerController.getPosition()
    this.animationController.setPosition(playerPos.x, playerPos.y, playerPos.z)

    this.useAnimatedCharacter = true
  }

  /**
   * Sync animation controller position with player controller
   * Called after track is loaded to ensure animation is at correct position
   * Also updates player Y position from WorldConfig in case track was loaded after player
   */
  syncAnimationPosition(): void {
    // Update player Y position from WorldConfig (track may have set it after player init)
    const worldConfig = WorldConfig.getInstance()
    const trackSurfaceHeight = worldConfig.getTrackSurfaceHeight()
    this.playerController.setY(trackSurfaceHeight)
    this.physicsController.forceGrounded(trackSurfaceHeight)
    
    if (this.animationController) {
      const playerPos = this.playerController.getPosition()
      this.animationController.setPosition(playerPos.x, playerPos.y, playerPos.z)
    }
    
    // Debug logging
    const playerPos = this.playerController.getPosition()
    console.log(`%c[PlayerManager] 🏃 PLAYER SPAWN POSITION`, 'color: #00ffff; font-weight: bold')
    console.log(`  Player X: ${playerPos.x.toFixed(3)}`)
    console.log(`  Player Y: ${playerPos.y.toFixed(3)} (track surface: ${trackSurfaceHeight.toFixed(3)})`)
    console.log(`  Player Z: ${playerPos.z.toFixed(3)}`)
    console.log(`  Character height: ${this.characterHeight.toFixed(3)}`)
  }

  /**
   * Respawn player after death
   */
  respawnPlayer(state: SurvivalGameState): void {
    state.player.targetLane = 0
    state.player.x = 0
    state.player.isJumping = false
    state.player.isSliding = false
    
    this.playerController.setTargetLane(0)
    this.physicsController.forceGrounded(this.playerController.getY())
    this.collisionSystem.triggerInvincibility()
    
    this.transitionSystem.triggerRespawn()
    
    const playerPos = this.playerController.getPosition()
    this.particleSystem.emitRespawnGlow(playerPos)
    
  }

  /**
   * Update animation state based on player state
   */
  updateAnimation(delta: number, speed: number, isJumping: boolean, isSliding: boolean): void {
    if (!this.useAnimatedCharacter || !this.animationController) {
      return
    }
    
    // Debug: Log that animation is being updated


    this.animationController.update(delta)
    this.animationController.setSpeed(speed)

    let targetState: AnimationState = 'run'
    if (isJumping) {
      targetState = 'jump'
    } else if (isSliding) {
      targetState = 'down'
    }
    this.animationController.setState(targetState)

    // Get interpolated position with visual effects applied
    const pos = this.playerController.getPosition()
    let finalY = pos.y
    
    // Get track surface height as absolute floor
    const trackSurface = WorldConfig.getInstance().getTrackSurfaceHeight()
    
    // Apply running bob when grounded and running (not jumping or sliding)
    if (!isJumping && !isSliding) {
      const runCycle = this.playerController.getRunCycle()
      const bobAmount = 0.15 // Match PlayerController.bobAmount
      finalY += Math.sin(runCycle * Math.PI * 2) * bobAmount
    }
    
    // Apply slide offset when crouching
    if (isSliding) {
      // Get character height from collision system dimensions
      // Lower by 25% of height to duck under obstacles
      finalY -= this.characterHeight * 0.25
    }
    
    // CRITICAL: Clamp Y to never go below track surface
    // This prevents character from rendering under the bridge/track
    finalY = Math.max(finalY, trackSurface)
    
    this.animationController.setPosition(pos.x, finalY, pos.z)
    
    // Apply squash/stretch to animated meshes
    this.updateAnimationScale(isSliding)
  }

  /**
   * Apply squash/stretch effects to animated character
   */
  private updateAnimationScale(isSliding: boolean): void {
    if (!this.animationController) return
    
    const landingSquash = this.playerController.getLandingSquash()
    const baseScale = this.runnerScale
    
    let scaleY = baseScale
    let scaleX = baseScale
    
    if (isSliding) {
      // Squash when sliding
      scaleY = baseScale * 0.5
      scaleX = baseScale * 1.1
    } else {
      // Apply landing squash/stretch
      scaleY = baseScale * landingSquash
      const stretchFactor = 1 + (1 - landingSquash) * 0.5
      scaleX = baseScale * stretchFactor
    }
    
    // Apply to all animation meshes
    const meshes = this.animationController.getAllMeshes()
    for (const mesh of meshes) {
      mesh.scale.x = this.lerp(mesh.scale.x, scaleX, 0.3)
      mesh.scale.y = this.lerp(mesh.scale.y, scaleY, 0.3)
    }
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
  }

  /**
   * Check if using animated character
   */
  isAnimated(): boolean {
    return this.useAnimatedCharacter
  }

  /**
   * Get animation controller
   */
  getAnimationController(): AnimationController | null {
    return this.animationController
  }

  /**
   * Get player controller
   */
  getPlayerController(): PlayerController {
    return this.playerController
  }
}
