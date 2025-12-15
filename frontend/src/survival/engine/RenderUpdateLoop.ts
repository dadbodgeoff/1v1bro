/**
 * RenderUpdateLoop - Handles visual updates at display refresh rate
 * Extracted from SurvivalEngine for modularity
 */

import type { SurvivalGameState } from '../types/survival'
import { SurvivalRenderer } from '../renderer/SurvivalRenderer'
import { PlayerController } from './PlayerController'
import { CameraController } from './CameraController'
import { GameLoop } from './GameLoop'
import { InputBuffer } from './InputBuffer'
import { PerformanceMonitor } from './PerformanceMonitor'
import { ParticleSystem } from '../effects/ParticleSystem'
import { FeedbackSystem } from '../effects/FeedbackSystem'
import { TransitionSystem } from '../effects/TransitionSystem'
import { ComboSystem } from '../systems/ComboSystem'
import { GhostReplay } from '../systems/GhostReplay'
import { GhostRenderer } from '../renderer/GhostRenderer'
import { PlayerManager } from './PlayerManager'

export interface RenderUpdateDeps {
  renderer: SurvivalRenderer
  playerController: PlayerController
  cameraController: CameraController
  gameLoop: GameLoop
  inputBuffer: InputBuffer
  performanceMonitor: PerformanceMonitor
  particleSystem: ParticleSystem
  feedbackSystem: FeedbackSystem
  transitionSystem: TransitionSystem
  comboSystem: ComboSystem
  playerManager: PlayerManager
  ghostReplay: GhostReplay
  ghostRenderer: GhostRenderer
}

export class RenderUpdateLoop {
  private deps: RenderUpdateDeps

  constructor(deps: RenderUpdateDeps) {
    this.deps = deps
  }

  /**
   * Main render update - runs at display refresh rate
   */
  update(delta: number, interpolation: number, state: SurvivalGameState, currentSpeed: number, gameTimeMs: number): void {
    const { renderer, playerController, cameraController, gameLoop, inputBuffer,
            performanceMonitor, particleSystem, transitionSystem,
            comboSystem, playerManager, ghostReplay, ghostRenderer } = this.deps

    // Update input buffer (clean expired)
    inputBuffer.update()
    
    // Update transition system and apply time scale
    const transitionTimeScale = transitionSystem.update(delta)
    gameLoop.setTimeScale(transitionTimeScale)
    
    // Record performance
    const stats = gameLoop.getStats()
    performanceMonitor.recordFrame(
      delta * 1000,
      stats.physicsTime,
      stats.renderTime
    )

    // Enable/disable orbit controls based on game state
    const isInTransition = transitionSystem.isTransitioning()
    const isCountdown = transitionSystem.getPhase() === 'countdown' || transitionSystem.getPhase() === 'go-flash'
    renderer.setOrbitControlsEnabled(state.phase !== 'running' && !isInTransition && !isCountdown)

    // Interpolate visuals for smooth rendering
    const isRunning = state.phase === 'running'
    const isPaused = state.phase === 'paused'
    const isReady = state.phase === 'ready'
    
    // Always update camera and player visuals when running, paused, ready, OR during countdown
    // This keeps the scene visible and properly positioned at all times
    // The player should always be visible - only skip updates during loading/gameover
    const shouldUpdateVisuals = isRunning || isPaused || isReady
    

    
    if (shouldUpdateVisuals) {
      // Update player and camera positions (use interpolation=1 when paused for static view)
      const interpValue = isPaused ? 1 : interpolation
      playerController.update(interpValue)
      cameraController.update(
        interpValue,
        !state.player.isSliding,
        state.player.isJumping
      )

      // Update animation (keep character visible, but don't animate when paused)
      if (isRunning) {
        playerManager.updateAnimation(delta, currentSpeed, state.player.isJumping, state.player.isSliding)
      } else {
        // When paused or countdown, just sync position without animation updates
        playerManager.updateAnimation(0, currentSpeed, state.player.isJumping, state.player.isSliding)
      }
      
      // Update ghost replay and renderer (personal best ghost)
      if (isRunning && ghostReplay.isActive()) {
        const ghostState = ghostReplay.update(gameTimeMs)
        ghostRenderer.update(ghostState, state.player.z)
      } else if (!isRunning) {
        ghostRenderer.hide()
      }
      
      // Update player light position
      renderer.updatePlayerLight(state.player.z)

      // Only do dynamic effects when running
      if (isRunning) {
        // Update particle system
        particleSystem.update(delta)

        // Emit particles
        const playerPos = playerController.getPosition()
        
        // Combo trail at high combo
        const currentCombo = comboSystem.getCombo()
        if (currentCombo >= 5) {
          particleSystem.updateComboTrail(playerPos, currentCombo)
        }
        
        if (!state.player.isJumping && !state.player.isSliding) {
          particleSystem.emitRunningDust(playerPos, currentSpeed)
        }
        particleSystem.emitSpeedTrail(playerPos, currentSpeed)
        particleSystem.emitEngineTrail(playerPos, currentSpeed)

        // Wind sound disabled - was causing audio static over time
        // feedbackSystem.updateSpeedWind(currentSpeed)

        // Update space background with motion
        renderer.updateSpaceBackground(delta, state.player.z, currentSpeed)

        // Update speed lines and dynamic FOV
        renderer.updateSpeedLines(currentSpeed, delta)
        renderer.updateDynamicFOV(currentSpeed, delta)
      } else {
        // When paused or in countdown, still render space background but without motion
        renderer.updateSpaceBackground(0, state.player.z, 0)
        // Fade out speed lines when paused/countdown
        renderer.updateSpeedLines(0, delta)
      }
    } else {
      // Even when not updating visuals, still render space background for ready state
      renderer.updateSpaceBackground(0, state.player.z, 0)
    }

    // Render the scene
    renderer.render()
  }
}
