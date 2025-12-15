/**
 * PlayerManager - Handles player setup, animation sync, and respawn
 * Extracted from SurvivalEngine for modularity
 * 
 * Mobile-optimized: Uses dynamic config for runner scale
 */

import * as THREE from 'three'
import type { SurvivalGameState } from '../types/survival'
import { getSurvivalConfig } from '../config/constants'
import { SurvivalRenderer } from '../renderer/SurvivalRenderer'
import type { LoadedAssets } from '../renderer/AssetLoader'
import { PlayerController } from './PlayerController'
import { PhysicsController } from './PhysicsController'
import { CollisionSystem } from './CollisionSystem'
import { AnimationController, type AnimationState } from './AnimationController'
import { ParticleSystem } from '../effects/ParticleSystem'
import { TransitionSystem } from '../effects/TransitionSystem'

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
    runMesh.rotation.y = Math.PI / 2

    const box = new THREE.Box3().setFromObject(runMesh)
    const playerHeight = box.getSize(new THREE.Vector3()).y

    const placeholder = new THREE.Group()
    this.playerController.initialize(placeholder, playerHeight)
    
    const size = box.getSize(new THREE.Vector3())
    this.collisionSystem.setPlayerDimensions(size.x, size.y, size.z)
  }

  /**
   * Setup animated character from loaded assets
   */
  setupAnimatedCharacter(assets: LoadedAssets): void {
    const runner = assets.character.runner

    this.animationController = new AnimationController()
    const scene = this.renderer.getScene()
    const scale = this.runnerScale

    const states: Array<{ state: AnimationState; mesh: THREE.Group }> = [
      { state: 'run', mesh: runner.run },
      { state: 'jump', mesh: runner.jump },
      { state: 'down', mesh: runner.down },
    ]

    const runMesh = runner.run
    runMesh.scale.setScalar(scale)
    const box = new THREE.Box3().setFromObject(runMesh)
    const size = box.getSize(new THREE.Vector3())
    const min = box.min

    this.characterHeight = size.y
    const footOffset = min.y * scale

    console.log(
      `[PlayerManager] Runner dimensions: height=${this.characterHeight.toFixed(2)}, footOffset=${footOffset.toFixed(2)}`
    )

    this.physicsController.setCharacterDimensions(this.characterHeight, footOffset)
    this.collisionSystem.setPlayerDimensions(size.x, this.characterHeight, size.z)

    for (const { state, mesh } of states) {
      mesh.scale.setScalar(scale)
      mesh.rotation.y = Math.PI / 2
      scene.add(mesh)
      this.animationController.registerAnimation(state, mesh, scene)
    }

    const playerPos = this.playerController.getPosition()
    this.animationController.setPosition(playerPos.x, playerPos.y, playerPos.z)

    this.useAnimatedCharacter = true
    console.log('[PlayerManager] Animated runner loaded')
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
    
    console.log('[PlayerManager] Player respawned with transition')
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
