/**
 * TransitionSystem - AAA-quality transitions for Survival Mode
 * 
 * Handles:
 * - Smooth fade-ins/outs (no jarring cuts)
 * - 3-2-1-GO countdown sequence
 * - Death animation with slow-mo + camera effects
 * - Respawn effect with invincibility flash
 * 
 * STATE MACHINE CONTEXT:
 * This is 1 of 4 state machines that control game readiness. See docs/STATE_MACHINE_AUDIT.md
 * 
 * Related state machines:
 * - LoadingOrchestrator: Asset loading stages (loading-critical/ready/running)
 * - GameStateManager: Game phase (ready/running/paused/gameover)
 * - useSurvivalGame: React state (isLoading/isReadyToStart)
 * 
 * Key integration points:
 * - isGamePaused() is checked by SurvivalEngine.fixedUpdate() to pause physics during transitions
 * - startCountdown() is called by RunManager.start() after LoadingOrchestrator.isReadyForCountdown()
 * - onCountdownComplete callback triggers RunManager.onCountdownComplete() → setPhase('running')
 */

import * as THREE from 'three'

// Transition phases
export type TransitionPhase = 
  | 'none'
  | 'fade-in'
  | 'countdown'
  | 'go-flash'
  | 'death-slowmo'
  | 'death-fade'
  | 'respawn'
  | 'fade-out'

// Countdown state
export type CountdownValue = 3 | 2 | 1 | 'GO' | null

// Transition event callbacks
export interface TransitionCallbacks {
  onCountdownTick?: (value: CountdownValue) => void
  onCountdownComplete?: () => void
  onDeathStart?: () => void
  onDeathComplete?: () => void
  onRespawnStart?: () => void
  onRespawnComplete?: () => void
  onFadeComplete?: (fadeType: 'in' | 'out') => void
}

// Configuration
export interface TransitionConfig {
  fadeInDuration: number      // Seconds for initial fade-in
  fadeOutDuration: number     // Seconds for fade-out
  countdownTickDuration: number // Seconds per countdown number
  goFlashDuration: number     // Seconds for "GO!" flash
  deathSlowmoDuration: number // Seconds of slow-mo on death
  deathFadeDuration: number   // Seconds for death fade
  respawnDuration: number     // Seconds for respawn effect
  respawnFlashCount: number   // Number of invincibility flashes
}

const DEFAULT_CONFIG: TransitionConfig = {
  fadeInDuration: 0.8,
  fadeOutDuration: 0.5,
  countdownTickDuration: 0.8,
  goFlashDuration: 0.4,
  deathSlowmoDuration: 1.2,
  deathFadeDuration: 0.6,
  respawnDuration: 1.5,
  respawnFlashCount: 5,
}

/**
 * TransitionSystem - Manages all game state transitions
 */
export class TransitionSystem {
  private config: TransitionConfig
  private callbacks: TransitionCallbacks = {}
  
  // Current state
  private phase: TransitionPhase = 'none'
  private timer: number = 0
  private countdownValue: CountdownValue = null
  
  // Visual state (for UI rendering)
  private screenOpacity: number = 1 // 1 = fully black, 0 = fully visible
  private timeScale: number = 1
  private cameraShakeIntensity: number = 0
  private respawnFlashAlpha: number = 0
  
  // Death context
  private deathPosition: THREE.Vector3 | null = null
  private deathCameraZoom: number = 1
  
  // Easing functions
  private easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)
  private easeInOutQuad = (t: number): number => 
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
  // Reserved for future bounce effects
  // private easeOutElastic = (t: number): number => {
  //   const c4 = (2 * Math.PI) / 3
  //   return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
  // }

  constructor(config?: Partial<TransitionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Set callbacks for transition events
   */
  setCallbacks(callbacks: TransitionCallbacks): void {
    this.callbacks = callbacks
  }

  // ============================================
  // Transition Triggers
  // ============================================

  /**
   * Start fade-in from black (game start)
   */
  startFadeIn(): void {
    this.phase = 'fade-in'
    this.timer = 0
    this.screenOpacity = 1
    this.timeScale = 1
  }

  /**
   * Start countdown sequence (3-2-1-GO)
   * Optionally skip the countdown for quick restarts
   */
  startCountdown(skipCountdown: boolean = false): void {
    // Ensure screen is visible when starting countdown
    this.screenOpacity = 0
    
    if (skipCountdown) {
      // Skip directly to GO flash
      this.phase = 'go-flash'
      this.timer = 0
      this.countdownValue = 'GO'
      this.callbacks.onCountdownTick?.('GO')
    } else {
      this.phase = 'countdown'
      this.timer = 0
      this.countdownValue = 3
      this.callbacks.onCountdownTick?.(3)
    }
  }

  /**
   * Trigger death transition
   */
  triggerDeath(position: THREE.Vector3): void {
    this.phase = 'death-slowmo'
    this.timer = 0
    this.deathPosition = position.clone()
    this.deathCameraZoom = 1
    this.timeScale = 0.15 // Dramatic slow-mo
    this.callbacks.onDeathStart?.()
  }

  /**
   * Trigger respawn effect
   */
  triggerRespawn(): void {
    this.phase = 'respawn'
    this.timer = 0
    this.respawnFlashAlpha = 1
    this.timeScale = 1
    this.callbacks.onRespawnStart?.()
  }

  /**
   * Start fade-out to black (game over)
   */
  startFadeOut(): void {
    this.phase = 'fade-out'
    this.timer = 0
    this.screenOpacity = 0
  }

  // ============================================
  // Update Loop
  // ============================================

  /**
   * Update transitions (call every frame with real delta time)
   * Returns the time scale to apply to game logic
   */
  update(realDelta: number): number {
    if (this.phase === 'none') {
      return 1
    }

    this.timer += realDelta

    switch (this.phase) {
      case 'fade-in':
        return this.updateFadeIn()
      case 'countdown':
        return this.updateCountdown()
      case 'go-flash':
        return this.updateGoFlash()
      case 'death-slowmo':
        return this.updateDeathSlowmo()
      case 'death-fade':
        return this.updateDeathFade()
      case 'respawn':
        return this.updateRespawn()
      case 'fade-out':
        return this.updateFadeOut()
      default:
        return 1
    }
  }

  private updateFadeIn(): number {
    const progress = Math.min(1, this.timer / this.config.fadeInDuration)
    this.screenOpacity = 1 - this.easeOutCubic(progress)
    
    if (progress >= 1) {
      this.phase = 'none'
      this.screenOpacity = 0
      this.callbacks.onFadeComplete?.('in')
    }
    
    return 1 // Normal time during fade-in
  }

  private updateCountdown(): number {
    const tickDuration = this.config.countdownTickDuration
    const tickProgress = this.timer / tickDuration
    
    // Determine current countdown value
    if (tickProgress < 1) {
      if (this.countdownValue !== 3) {
        this.countdownValue = 3
        this.callbacks.onCountdownTick?.(3)
      }
    } else if (tickProgress < 2) {
      if (this.countdownValue !== 2) {
        this.countdownValue = 2
        this.callbacks.onCountdownTick?.(2)
      }
    } else if (tickProgress < 3) {
      if (this.countdownValue !== 1) {
        this.countdownValue = 1
        this.callbacks.onCountdownTick?.(1)
      }
    } else {
      // Transition to GO flash
      this.phase = 'go-flash'
      this.timer = 0
      this.countdownValue = 'GO'
      this.callbacks.onCountdownTick?.('GO')
    }
    
    return 0 // Game paused during countdown
  }

  private updateGoFlash(): number {
    const progress = Math.min(1, this.timer / this.config.goFlashDuration)
    
    if (progress >= 1) {
      this.phase = 'none'
      this.countdownValue = null
      this.callbacks.onCountdownComplete?.()
    }
    
    // Ramp up time scale during GO
    return this.easeOutCubic(progress)
  }

  private updateDeathSlowmo(): number {
    const progress = Math.min(1, this.timer / this.config.deathSlowmoDuration)
    
    // Dramatic slow-mo with camera zoom
    this.timeScale = 0.15 + progress * 0.35 // 0.15 -> 0.5
    this.deathCameraZoom = 1 + (1 - progress) * 0.3 // Zoom in then back out
    this.cameraShakeIntensity = (1 - progress) * 0.5
    
    if (progress >= 1) {
      this.phase = 'death-fade'
      this.timer = 0
    }
    
    return this.timeScale
  }

  private updateDeathFade(): number {
    const progress = Math.min(1, this.timer / this.config.deathFadeDuration)
    
    // Fade to red-tinted black
    this.screenOpacity = this.easeInOutQuad(progress) * 0.7
    this.timeScale = 0.5 + progress * 0.5 // Return to normal
    
    if (progress >= 1) {
      this.phase = 'none'
      this.screenOpacity = 0
      this.deathPosition = null
      this.callbacks.onDeathComplete?.()
    }
    
    return this.timeScale
  }

  private updateRespawn(): number {
    const progress = Math.min(1, this.timer / this.config.respawnDuration)
    
    // Invincibility flash effect
    const flashFreq = this.config.respawnFlashCount * 2 * Math.PI
    this.respawnFlashAlpha = Math.abs(Math.sin(progress * flashFreq)) * (1 - progress)
    
    if (progress >= 1) {
      this.phase = 'none'
      this.respawnFlashAlpha = 0
      this.callbacks.onRespawnComplete?.()
    }
    
    return 1 // Normal time during respawn
  }

  private updateFadeOut(): number {
    const progress = Math.min(1, this.timer / this.config.fadeOutDuration)
    this.screenOpacity = this.easeInOutQuad(progress)
    
    if (progress >= 1) {
      this.phase = 'none'
      this.screenOpacity = 1
      this.callbacks.onFadeComplete?.('out')
    }
    
    return 1 - progress * 0.5 // Slow down during fade-out
  }

  // ============================================
  // State Getters
  // ============================================

  getPhase(): TransitionPhase { return this.phase }
  getScreenOpacity(): number { return this.screenOpacity }
  getTimeScale(): number { return this.timeScale }
  getCountdownValue(): CountdownValue { return this.countdownValue }
  getCameraShakeIntensity(): number { return this.cameraShakeIntensity }
  getRespawnFlashAlpha(): number { return this.respawnFlashAlpha }
  getDeathCameraZoom(): number { return this.deathCameraZoom }
  getDeathPosition(): THREE.Vector3 | null { return this.deathPosition }
  
  /**
   * Check if game should be paused (countdown, death)
   */
  isGamePaused(): boolean {
    return this.phase === 'countdown' || this.phase === 'death-slowmo' || this.phase === 'death-fade'
  }

  /**
   * Check if currently in any transition
   */
  isTransitioning(): boolean {
    return this.phase !== 'none'
  }

  /**
   * Get countdown animation progress (0-1 within current tick)
   */
  getCountdownTickProgress(): number {
    if (this.phase !== 'countdown') return 0
    return (this.timer % this.config.countdownTickDuration) / this.config.countdownTickDuration
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.phase = 'none'
    this.timer = 0
    this.countdownValue = null
    this.screenOpacity = 0
    this.timeScale = 1
    this.cameraShakeIntensity = 0
    this.respawnFlashAlpha = 0
    this.deathPosition = null
    this.deathCameraZoom = 1
  }
}
