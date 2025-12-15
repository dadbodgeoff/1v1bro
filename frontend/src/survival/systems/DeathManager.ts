/**
 * DeathManager - Handles death sequence with slow-mo effect
 * 
 * When player dies:
 * 1. Capture death context (position, obstacle, speed, etc.)
 * 2. Start slow-mo (time scale 0.2 for 1.5 seconds)
 * 3. Trigger camera zoom toward collision point
 * 4. Restore normal time and transition to game over
 */

import type { 
  DeathContext, 
  DeathPhase, 
  SlowMoConfig,
  ObstacleType,
  Lane 
} from '../types/survival'

export interface DeathManagerCallbacks {
  onSlowMoStart?: (context: DeathContext) => void
  onSlowMoEnd?: (context: DeathContext) => void
  onPhaseChange?: (phase: DeathPhase) => void
}

export class DeathManager {
  // Default slow-mo configuration
  static readonly DEFAULT_CONFIG: SlowMoConfig = {
    timeScale: 0.2,        // 20% speed
    duration: 1.5,         // 1.5 seconds
    cameraZoomFactor: 1.5, // 50% zoom in
  }
  
  private config: SlowMoConfig
  private phase: DeathPhase = 'none'
  private deathContext: DeathContext | null = null
  private slowMoTimer: number = 0
  private callbacks: DeathManagerCallbacks = {}
  
  constructor(config?: Partial<SlowMoConfig>) {
    this.config = { ...DeathManager.DEFAULT_CONFIG, ...config }
  }
  
  /**
   * Register callbacks for death events
   */
  setCallbacks(callbacks: DeathManagerCallbacks): void {
    this.callbacks = callbacks
  }
  
  /**
   * Trigger death sequence
   * Captures context and starts slow-mo
   */
  triggerDeath(context: DeathContext): void {
    if (this.phase !== 'none') {
      // Already in death sequence
      return
    }
    
    this.deathContext = context
    this.phase = 'slow_mo'
    this.slowMoTimer = 0
    
    this.callbacks.onSlowMoStart?.(context)
    this.callbacks.onPhaseChange?.('slow_mo')
  }
  
  /**
   * Update death sequence
   * @param deltaTime Real time delta (not scaled)
   * @returns Current time scale to apply to game
   */
  update(deltaTime: number): number {
    if (this.phase === 'none') {
      return 1.0
    }
    
    if (this.phase === 'slow_mo') {
      this.slowMoTimer += deltaTime
      
      if (this.slowMoTimer >= this.config.duration) {
        this.endSlowMo()
        return 1.0
      }
      
      return this.config.timeScale
    }
    
    if (this.phase === 'complete') {
      return 1.0
    }
    
    return 1.0
  }
  
  /**
   * End slow-mo and transition to complete
   */
  private endSlowMo(): void {
    this.phase = 'complete'
    
    if (this.deathContext) {
      this.callbacks.onSlowMoEnd?.(this.deathContext)
    }
    this.callbacks.onPhaseChange?.('complete')
  }
  
  /**
   * Check if currently in slow-mo
   */
  isInSlowMo(): boolean {
    return this.phase === 'slow_mo'
  }
  
  /**
   * Check if death sequence is complete
   */
  isComplete(): boolean {
    return this.phase === 'complete'
  }
  
  /**
   * Get current time scale
   */
  getTimeScale(): number {
    if (this.phase === 'slow_mo') {
      return this.config.timeScale
    }
    return 1.0
  }
  
  /**
   * Get current death phase
   */
  getPhase(): DeathPhase {
    return this.phase
  }
  
  /**
   * Get death context (null if not in death sequence)
   */
  getDeathContext(): DeathContext | null {
    return this.deathContext
  }
  
  /**
   * Get slow-mo progress (0-1, 0 = just started, 1 = ending)
   */
  getSlowMoProgress(): number {
    if (this.phase !== 'slow_mo') {
      return this.phase === 'complete' ? 1 : 0
    }
    return Math.min(1, this.slowMoTimer / this.config.duration)
  }
  
  /**
   * Get camera zoom factor based on slow-mo progress
   * Zooms in during slow-mo, returns to normal at end
   */
  getCameraZoomFactor(): number {
    if (this.phase !== 'slow_mo') {
      return 1.0
    }
    
    const progress = this.getSlowMoProgress()
    // Ease in-out for smooth zoom
    const eased = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2
    
    // Zoom in during first half, zoom out during second half
    if (progress < 0.5) {
      return 1 + (this.config.cameraZoomFactor - 1) * eased * 2
    } else {
      return this.config.cameraZoomFactor - (this.config.cameraZoomFactor - 1) * (eased - 0.5) * 2
    }
  }
  
  /**
   * Get configuration
   */
  getConfig(): Readonly<SlowMoConfig> {
    return { ...this.config }
  }
  
  /**
   * Reset death manager to initial state
   */
  reset(): void {
    this.phase = 'none'
    this.deathContext = null
    this.slowMoTimer = 0
  }
  
  /**
   * Create a death context from game state
   * Helper for creating properly typed death contexts
   */
  static createContext(params: {
    position: { x: number; z: number }
    obstacleType: ObstacleType
    obstacleId: string
    speed: number
    distance: number
    wasJumping: boolean
    wasSliding: boolean
    currentLane: Lane
    comboAtDeath: number
    patternId?: string
  }): DeathContext {
    return { ...params }
  }
}
