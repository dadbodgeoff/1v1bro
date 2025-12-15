/**
 * InputRecorder - Records timestamped inputs for ghost replay
 * 
 * Features:
 * - Captures input type, timestamp, and position
 * - Uses compact numeric encoding for input types
 * - Delta encoding for timestamps to reduce size
 * - Serializes to compressed JSON format
 * - Supports deterministic replay with seed storage
 */

import type { InputEvent, InputRecording, InputAction } from '../types/survival'
import { INPUT_TYPE, type InputTypeValue } from '../types/survival'

// Current schema version for forward compatibility
const RECORDING_VERSION = 1

// Map InputAction strings to compact numeric values
const ACTION_TO_TYPE: Record<InputAction, InputTypeValue | null> = {
  moveLeft: INPUT_TYPE.MOVE_LEFT,
  moveRight: INPUT_TYPE.MOVE_RIGHT,
  jump: INPUT_TYPE.JUMP,
  slide: INPUT_TYPE.SLIDE,
  pause: null,  // Not recorded
  start: null,  // Not recorded
}

export class InputRecorder {
  private recording: boolean = false
  private events: InputEvent[] = []
  private seed: number = 0
  private startTime: number = 0
  private lastTimestamp: number = 0
  
  /**
   * Start recording inputs
   * @param seed Random seed used for obstacle generation
   */
  start(seed: number): void {
    this.recording = true
    this.events = []
    this.seed = seed
    this.startTime = Date.now()
    this.lastTimestamp = 0
  }
  
  /**
   * Record an input event
   * @param action The input action type
   * @param gameTime Current game time in milliseconds
   * @param positionZ Player's Z position (optional, for validation)
   * @param lane Current lane (-1, 0, 1) for ghost replay
   * @param positionY Player's Y position for jump tracking
   */
  recordInput(
    action: InputAction, 
    gameTime: number, 
    positionZ?: number,
    lane?: number,
    positionY?: number
  ): void {
    if (!this.recording) return
    
    const inputType = ACTION_TO_TYPE[action]
    if (inputType === null) return  // Skip non-gameplay inputs
    
    const event: InputEvent = {
      t: Math.round(gameTime),  // Round to nearest ms
      i: inputType,
    }
    
    if (positionZ !== undefined) {
      event.p = Math.round(positionZ * 100) / 100  // 2 decimal precision
    }
    
    // Record lane for ghost X position
    if (lane !== undefined) {
      event.l = lane
    }
    
    // Record Y position for accurate jump rendering
    if (positionY !== undefined) {
      event.y = Math.round(positionY * 100) / 100
    }
    
    this.events.push(event)
    this.lastTimestamp = gameTime
  }
  
  /**
   * Record a position snapshot (for smooth ghost interpolation)
   * Called periodically to capture position even without input
   */
  recordPosition(gameTime: number, positionZ: number, lane: number, positionY: number): void {
    if (!this.recording) return
    
    // Use a special "position" input type (we'll add INPUT_TYPE.POSITION = 4)
    const event: InputEvent = {
      t: Math.round(gameTime),
      i: INPUT_TYPE.POSITION,
      p: Math.round(positionZ * 100) / 100,
      l: lane,
      y: Math.round(positionY * 100) / 100,
    }
    
    this.events.push(event)
    this.lastTimestamp = gameTime
  }
  
  /**
   * Stop recording and return the recording
   */
  stop(): InputRecording {
    this.recording = false
    
    return {
      version: RECORDING_VERSION,
      seed: this.seed,
      startTime: this.startTime,
      duration: this.lastTimestamp,
      events: [...this.events],
    }
  }
  
  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.recording
  }
  
  /**
   * Get current event count
   */
  getEventCount(): number {
    return this.events.length
  }
  
  /**
   * Serialize recording to compressed JSON string
   * Uses delta encoding for timestamps to reduce size
   */
  serialize(): string {
    const recording = this.stop()
    return InputRecorder.serializeRecording(recording)
  }
  
  /**
   * Static method to serialize a recording
   */
  static serializeRecording(recording: InputRecording): string {
    // Delta encode timestamps for compression
    const deltaEvents = recording.events.map((event, index) => {
      const prevTimestamp = index > 0 ? recording.events[index - 1].t : 0
      return {
        t: event.t - prevTimestamp,  // Delta from previous
        i: event.i,
        ...(event.p !== undefined ? { p: event.p } : {}),
        ...(event.l !== undefined ? { l: event.l } : {}),
        ...(event.y !== undefined ? { y: event.y } : {}),
      }
    })
    
    const compressed = {
      v: recording.version,
      s: recording.seed,
      st: recording.startTime,
      d: recording.duration,
      e: deltaEvents,
    }
    
    return JSON.stringify(compressed)
  }
  
  /**
   * Deserialize compressed JSON back to InputRecording
   */
  static deserialize(data: string): InputRecording {
    const compressed = JSON.parse(data)
    
    // Reconstruct absolute timestamps from deltas
    let absoluteTime = 0
    const events: InputEvent[] = compressed.e.map((event: { t: number; i: number; p?: number; l?: number; y?: number }) => {
      absoluteTime += event.t
      return {
        t: absoluteTime,
        i: event.i,
        ...(event.p !== undefined ? { p: event.p } : {}),
        ...(event.l !== undefined ? { l: event.l } : {}),
        ...(event.y !== undefined ? { y: event.y } : {}),
      }
    })
    
    return {
      version: compressed.v,
      seed: compressed.s,
      startTime: compressed.st,
      duration: compressed.d,
      events,
    }
  }
  
  /**
   * Estimate serialized size in bytes
   */
  static estimateSize(events: InputEvent[]): number {
    // Rough estimate: ~15 bytes per event with delta encoding
    // Base overhead: ~50 bytes for metadata
    return 50 + events.length * 15
  }
  
  /**
   * Check if recording would exceed size limit
   * @param maxSizeKB Maximum size in kilobytes
   */
  wouldExceedSize(maxSizeKB: number): boolean {
    const estimatedSize = InputRecorder.estimateSize(this.events)
    return estimatedSize > maxSizeKB * 1024
  }
  
  /**
   * Get the seed used for this recording
   */
  getSeed(): number {
    return this.seed
  }
  
  /**
   * Reset recorder to initial state
   */
  reset(): void {
    this.recording = false
    this.events = []
    this.seed = 0
    this.startTime = 0
    this.lastTimestamp = 0
  }
}
