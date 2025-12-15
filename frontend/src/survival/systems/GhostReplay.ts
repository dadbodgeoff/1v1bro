/**
 * GhostReplay - Plays back recorded inputs as a ghost character
 * 
 * Features:
 * - Loads and parses InputRecording
 * - Advances through events by game time
 * - Returns inputs at correct timestamps
 * - Supports fade-out at recording end
 */

import type { InputRecording, InputEvent, GhostState, InputAction } from '../types/survival'
import { INPUT_TYPE } from '../types/survival'
import { InputRecorder } from './InputRecorder'

// Map numeric input types back to actions
const TYPE_TO_ACTION: Record<number, InputAction | null> = {
  [INPUT_TYPE.MOVE_LEFT]: 'moveLeft',
  [INPUT_TYPE.MOVE_RIGHT]: 'moveRight',
  [INPUT_TYPE.JUMP]: 'jump',
  [INPUT_TYPE.SLIDE]: 'slide',
  [INPUT_TYPE.POSITION]: null, // Position snapshots don't map to actions
}

// Timing tolerance for input matching (in ms)
const INPUT_TIMING_TOLERANCE = 17 // ~1 frame at 60fps

// Position snapshot interval for smooth interpolation
const POSITION_SNAPSHOT_INTERVAL = 100 // ms
void POSITION_SNAPSHOT_INTERVAL // Suppress unused warning

export class GhostReplay {
  // Visual constants
  static readonly GHOST_OPACITY = 0.5
  static readonly GHOST_TINT = 0x00ffff  // Cyan
  static readonly FADE_OUT_DURATION = 1000  // 1 second fade out at end
  
  private recording: InputRecording | null = null
  private currentEventIndex: number = 0
  private active: boolean = false
  private complete: boolean = false
  private currentGameTime: number = 0
  
  // Ghost state - now tracks lane and Y properly
  private lane: number = 0  // Current lane (-1, 0, 1)
  private positionZ: number = 0
  private positionY: number = 1.0  // Ground height
  private targetY: number = 1.0
  private isJumping: boolean = false
  private isSliding: boolean = false
  
  // Interpolation state for smooth Z position
  private lastSnapshotTime: number = 0
  private lastSnapshotZ: number = 0
  private nextSnapshotTime: number = 0
  private nextSnapshotZ: number = 0
  
  /**
   * Load a recording for playback
   * @param data Serialized recording string or InputRecording object
   */
  load(data: string | InputRecording): void {
    if (typeof data === 'string') {
      this.recording = InputRecorder.deserialize(data)
    } else {
      this.recording = data
    }
    
    this.currentEventIndex = 0
    this.active = false
    this.complete = false
    this.currentGameTime = 0
    this.lane = 0
    this.positionZ = 0
    this.positionY = 1.0
    this.targetY = 1.0
    this.isJumping = false
    this.isSliding = false
    this.lastSnapshotTime = 0
    this.lastSnapshotZ = 0
    this.nextSnapshotTime = 0
    this.nextSnapshotZ = 0
  }
  
  /**
   * Start playback
   */
  start(): void {
    if (!this.recording) return
    this.active = true
    this.complete = false
    this.currentEventIndex = 0
    this.currentGameTime = 0
  }
  
  /**
   * Update ghost state based on game time
   * @param gameTime Current game time in milliseconds
   * @returns Current ghost state
   */
  update(gameTime: number): GhostState {
    this.currentGameTime = gameTime
    
    if (!this.recording || !this.active) {
      return this.getInactiveState()
    }
    
    // Process all events up to current time
    this.processEventsUpToTime(gameTime)
    
    // Interpolate positions for smooth movement
    this.interpolateY()
    this.interpolateZ(gameTime)
    
    // Check if recording is complete
    if (gameTime >= this.recording.duration) {
      this.complete = true
    }
    
    // Calculate opacity (fade out at end)
    let opacity = GhostReplay.GHOST_OPACITY
    if (this.complete) {
      const fadeProgress = Math.min(1, 
        (gameTime - this.recording.duration) / GhostReplay.FADE_OUT_DURATION
      )
      opacity = GhostReplay.GHOST_OPACITY * (1 - fadeProgress)
      
      if (opacity <= 0) {
        this.active = false
      }
    }
    
    return {
      active: this.active,
      currentEventIndex: this.currentEventIndex,
      position: { x: this.lane, z: this.positionZ },
      opacity,
      tint: GhostReplay.GHOST_TINT,
      isJumping: this.isJumping,
      isSliding: this.isSliding,
      y: this.positionY,
    }
  }
  
  /**
   * Process all events up to the given time
   */
  private processEventsUpToTime(gameTime: number): void {
    if (!this.recording) return
    
    while (this.currentEventIndex < this.recording.events.length) {
      const event = this.recording.events[this.currentEventIndex]
      
      if (gameTime >= event.t - INPUT_TIMING_TOLERANCE) {
        this.currentEventIndex++
        this.applyEvent(event)
      } else {
        break
      }
    }
  }
  
  /**
   * Apply an event to update ghost state
   */
  private applyEvent(event: InputEvent): void {
    // Update snapshot targets for Z interpolation
    this.updateSnapshotTargets(event)
    
    // Update position from event if available
    if (event.p !== undefined) {
      this.positionZ = event.p
    }
    if (event.l !== undefined) {
      this.lane = event.l
    }
    if (event.y !== undefined) {
      this.targetY = event.y
    }
    
    // Handle input type
    const action = TYPE_TO_ACTION[event.i]
    if (action) {
      this.applyAction(action)
    }
  }
  
  /**
   * Interpolate Y position for smooth movement
   */
  private interpolateY(): void {
    // Smooth interpolation toward target Y
    const lerpSpeed = 0.15
    this.positionY += (this.targetY - this.positionY) * lerpSpeed
  }
  
  /**
   * Interpolate Z position between snapshots for smooth movement
   */
  private interpolateZ(gameTime: number): void {
    // If we have valid snapshot data, interpolate between them
    if (this.nextSnapshotTime > this.lastSnapshotTime) {
      const t = Math.min(1, Math.max(0, 
        (gameTime - this.lastSnapshotTime) / (this.nextSnapshotTime - this.lastSnapshotTime)
      ))
      this.positionZ = this.lastSnapshotZ + (this.nextSnapshotZ - this.lastSnapshotZ) * t
    }
  }
  
  /**
   * Update snapshot interpolation targets when processing position events
   */
  private updateSnapshotTargets(event: InputEvent): void {
    if (event.p !== undefined) {
      // Store current as last, new as next for interpolation
      this.lastSnapshotTime = this.currentGameTime
      this.lastSnapshotZ = this.positionZ
      this.nextSnapshotTime = event.t + POSITION_SNAPSHOT_INTERVAL
      this.nextSnapshotZ = event.p
    }
  }
  
  /**
   * Get the next input that should be applied at the current game time
   * Returns null if no input is due
   * @param gameTime Current game time in milliseconds
   * @deprecated Use update() instead - this is kept for backward compatibility
   */
  getNextInput(gameTime: number): { action: InputAction; event: InputEvent } | null {
    if (!this.recording || !this.active || this.complete) {
      return null
    }
    
    // Check if there's an event at or before current time
    while (this.currentEventIndex < this.recording.events.length) {
      const event = this.recording.events[this.currentEventIndex]
      
      if (gameTime >= event.t - INPUT_TIMING_TOLERANCE) {
        this.currentEventIndex++
        
        const action = TYPE_TO_ACTION[event.i]
        if (action) {
          this.applyAction(action)
          this.applyEvent(event)
          return { action, event }
        }
      } else {
        break
      }
    }
    
    return null
  }
  
  /**
   * Get all inputs that should be applied at the current game time
   * Useful when multiple inputs occur in the same frame
   */
  getAllInputsAtTime(gameTime: number): Array<{ action: InputAction; event: InputEvent }> {
    const inputs: Array<{ action: InputAction; event: InputEvent }> = []
    
    let input = this.getNextInput(gameTime)
    while (input !== null) {
      inputs.push(input)
      input = this.getNextInput(gameTime)
    }
    
    return inputs
  }
  
  /**
   * Apply an action to update ghost state
   */
  private applyAction(action: InputAction): void {
    switch (action) {
      case 'jump':
        this.isJumping = true
        this.isSliding = false
        this.targetY = 2.5 // Jump height
        break
      case 'slide':
        this.isSliding = true
        this.isJumping = false
        this.targetY = 0.5 // Slide height
        break
      case 'moveLeft':
        this.lane = Math.max(-1, this.lane - 1)
        break
      case 'moveRight':
        this.lane = Math.min(1, this.lane + 1)
        break
    }
    
    // Reset to ground when not jumping/sliding
    if (!this.isJumping && !this.isSliding) {
      this.targetY = 1.0
    }
  }
  
  /**
   * Check if playback is complete
   */
  isComplete(): boolean {
    return this.complete
  }
  
  /**
   * Check if ghost is active
   */
  isActive(): boolean {
    return this.active
  }
  
  /**
   * Despawn the ghost
   */
  despawn(): void {
    this.active = false
    this.complete = true
  }
  
  /**
   * Get the seed from the loaded recording
   */
  getSeed(): number | null {
    return this.recording?.seed ?? null
  }
  
  /**
   * Get the recording duration
   */
  getDuration(): number {
    return this.recording?.duration ?? 0
  }
  
  /**
   * Get current playback progress (0-1)
   */
  getProgress(): number {
    if (!this.recording || this.recording.duration === 0) {
      return 0
    }
    return Math.min(1, this.currentGameTime / this.recording.duration)
  }
  
  /**
   * Reset ghost state
   */
  reset(): void {
    this.recording = null
    this.currentEventIndex = 0
    this.active = false
    this.complete = false
    this.currentGameTime = 0
    this.lane = 0
    this.positionZ = 0
    this.positionY = 1.0
    this.targetY = 1.0
    this.isJumping = false
    this.isSliding = false
    this.lastSnapshotTime = 0
    this.lastSnapshotZ = 0
    this.nextSnapshotTime = 0
    this.nextSnapshotZ = 0
  }
  
  /**
   * Get inactive ghost state
   */
  private getInactiveState(): GhostState {
    return {
      active: false,
      currentEventIndex: 0,
      position: { x: 0, z: 0 },
      y: 1.0,
      opacity: 0,
      tint: GhostReplay.GHOST_TINT,
      isJumping: false,
      isSliding: false,
    }
  }
}
