/**
 * ComboSystem - Tracks near-misses and perfect dodges for score multipliers
 * 
 * Thresholds:
 * - Near-miss: 0.2 < distance <= 0.5 units (+1 combo)
 * - Perfect dodge: distance <= 0.2 units (+3 combo)
 * - Collision: distance = 0 (reset combo)
 * 
 * Decay: After 3 seconds without events, combo decays by 1 per second
 * Multiplier: 1 + (combo * 0.1)
 */

import type { ComboState, ComboEvent, ComboEventType } from '../types/survival'

export interface Vector3Like {
  x: number
  y: number
  z: number
}

export interface ObstacleBounds {
  position: Vector3Like
  size: Vector3Like  // Half-extents
}

export class ComboSystem {
  // Thresholds (in world units)
  static readonly NEAR_MISS_THRESHOLD = 0.5
  static readonly PERFECT_DODGE_THRESHOLD = 0.2
  
  // Decay settings
  static readonly DECAY_START_TIME = 3.0  // seconds before decay starts
  static readonly DECAY_RATE = 1          // combo lost per second
  
  // Milestone intervals
  static readonly MILESTONE_INTERVAL = 5  // Emit milestone at 5, 10, 15...
  
  private state: ComboState = {
    combo: 0,
    multiplier: 1.0,
    lastEventTime: 0,
    decayTimer: 0,
  }
  
  private onComboChangeCallback?: (event: ComboEvent) => void
  private onPerfectDodgeCallback?: (position: { x: number; z: number }) => void
  
  /**
   * Register callback for combo changes
   */
  onComboChange(callback: (event: ComboEvent) => void): void {
    this.onComboChangeCallback = callback
  }
  
  /**
   * Register callback for perfect dodge (for hitstop trigger)
   */
  onPerfectDodge(callback: (position: { x: number; z: number }) => void): void {
    this.onPerfectDodgeCallback = callback
  }
  
  /**
   * Check proximity to an obstacle and update combo accordingly
   * Returns the event if a near-miss or perfect dodge occurred, null otherwise
   */
  checkProximity(
    playerPos: Vector3Like,
    obstacle: ObstacleBounds
  ): ComboEvent | null {
    const distance = this.calculateDistance(playerPos, obstacle)
    
    // No event if too far
    if (distance > ComboSystem.NEAR_MISS_THRESHOLD) {
      return null
    }
    
    // Collision handled separately via onCollision()
    if (distance <= 0) {
      return null
    }
    
    const position = { x: obstacle.position.x, z: obstacle.position.z }
    
    // Perfect dodge: within 0.2 units
    if (distance <= ComboSystem.PERFECT_DODGE_THRESHOLD) {
      // Trigger hitstop callback for perfect dodge
      this.onPerfectDodgeCallback?.(position)
      return this.incrementCombo(3, 'perfect_dodge', position)
    }
    
    // Near-miss: within 0.5 units but > 0.2
    return this.incrementCombo(1, 'near_miss', position)
  }
  
  /**
   * Handle collision - resets combo to 0
   */
  onCollision(): ComboEvent {
    const previousCombo = this.state.combo
    this.state.combo = 0
    this.state.multiplier = 1.0
    this.state.decayTimer = 0
    
    const event: ComboEvent = {
      type: 'collision',
      combo: 0,
      multiplier: 1.0,
    }
    
    if (previousCombo > 0) {
      this.emitEvent(event)
    }
    
    return event
  }
  
  /**
   * Update decay timer - call every frame
   * @param deltaTime Time since last update in seconds
   */
  update(deltaTime: number): void {
    if (this.state.combo <= 0) {
      return
    }
    
    this.state.decayTimer += deltaTime
    
    // Start decay after DECAY_START_TIME seconds
    if (this.state.decayTimer >= ComboSystem.DECAY_START_TIME) {
      const decayAmount = Math.floor(
        (this.state.decayTimer - ComboSystem.DECAY_START_TIME) * ComboSystem.DECAY_RATE
      )
      
      if (decayAmount > 0) {
        const newCombo = Math.max(0, this.state.combo - decayAmount)
        
        if (newCombo !== this.state.combo) {
          this.state.combo = newCombo
          this.state.multiplier = this.calculateMultiplier(newCombo)
          // Reset decay timer to only track excess time
          this.state.decayTimer = ComboSystem.DECAY_START_TIME
          
          this.emitEvent({
            type: 'decay',
            combo: this.state.combo,
            multiplier: this.state.multiplier,
          })
        }
      }
    }
  }
  
  /**
   * Get current score multiplier
   */
  getMultiplier(): number {
    return this.state.multiplier
  }
  
  /**
   * Get current combo count
   */
  getCombo(): number {
    return this.state.combo
  }
  
  /**
   * Get full combo state (for serialization/debugging)
   */
  getState(): Readonly<ComboState> {
    return { ...this.state }
  }
  
  /**
   * Reset combo system to initial state
   */
  reset(): void {
    this.state = {
      combo: 0,
      multiplier: 1.0,
      lastEventTime: 0,
      decayTimer: 0,
    }
  }
  
  /**
   * Calculate multiplier from combo value
   * Formula: 1 + (combo * 0.1)
   */
  calculateMultiplier(combo: number): number {
    return 1 + combo * 0.1
  }
  
  /**
   * Calculate minimum distance from player to obstacle bounds
   */
  private calculateDistance(
    playerPos: Vector3Like,
    obstacle: ObstacleBounds
  ): number {
    // Calculate closest point on obstacle AABB to player
    const closestX = Math.max(
      obstacle.position.x - obstacle.size.x,
      Math.min(playerPos.x, obstacle.position.x + obstacle.size.x)
    )
    const closestZ = Math.max(
      obstacle.position.z - obstacle.size.z,
      Math.min(playerPos.z, obstacle.position.z + obstacle.size.z)
    )
    
    // Calculate distance from player to closest point
    const dx = playerPos.x - closestX
    const dz = playerPos.z - closestZ
    
    return Math.sqrt(dx * dx + dz * dz)
  }
  
  /**
   * Increment combo and emit appropriate events
   */
  private incrementCombo(
    amount: number,
    type: ComboEventType,
    position: { x: number; z: number }
  ): ComboEvent {
    const previousCombo = this.state.combo
    this.state.combo += amount
    this.state.multiplier = this.calculateMultiplier(this.state.combo)
    this.state.decayTimer = 0  // Reset decay timer on successful dodge
    
    const event: ComboEvent = {
      type,
      combo: this.state.combo,
      multiplier: this.state.multiplier,
      position,
    }
    
    this.emitEvent(event)
    
    // Check for milestone
    const previousMilestone = Math.floor(previousCombo / ComboSystem.MILESTONE_INTERVAL)
    const currentMilestone = Math.floor(this.state.combo / ComboSystem.MILESTONE_INTERVAL)
    
    if (currentMilestone > previousMilestone) {
      const milestoneEvent: ComboEvent = {
        type: 'milestone',
        combo: this.state.combo,
        multiplier: this.state.multiplier,
        milestone: currentMilestone * ComboSystem.MILESTONE_INTERVAL,
      }
      this.emitEvent(milestoneEvent)
    }
    
    return event
  }
  
  /**
   * Emit combo event to registered callback
   */
  private emitEvent(event: ComboEvent): void {
    this.onComboChangeCallback?.(event)
  }
}
