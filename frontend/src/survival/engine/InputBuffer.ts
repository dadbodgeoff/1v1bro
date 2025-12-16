/**
 * InputBuffer - Buffers inputs to prevent missed actions
 * Stores inputs for a few frames to ensure responsiveness
 * 
 * Mobile Optimization:
 * - Uses device-specific buffer duration from mobile config
 * - Longer buffer on touch devices for better responsiveness
 */

import type { InputAction } from '../types/survival'
import { getMobileConfig, onMobileConfigChange } from '../config/mobile'

interface BufferedInput {
  action: InputAction
  timestamp: number
  consumed: boolean
}

export class InputBuffer {
  private buffer: BufferedInput[] = []
  private bufferDuration: number // ms - how long to keep inputs
  private readonly MAX_BUFFER_SIZE: number = 10
  private unsubscribeConfig: (() => void) | null = null
  
  // Held keys (for continuous actions)
  private heldActions: Set<InputAction> = new Set()

  constructor() {
    // Get initial buffer duration from mobile config
    const config = getMobileConfig()
    this.bufferDuration = config.balance.inputBufferMs
    
    // Subscribe to config changes
    this.unsubscribeConfig = onMobileConfigChange((newConfig) => {
      this.bufferDuration = newConfig.balance.inputBufferMs
    })
  }

  /**
   * Get current buffer duration (for testing/debugging)
   */
  getBufferDuration(): number {
    return this.bufferDuration
  }

  /**
   * Dispose and cleanup subscriptions
   */
  dispose(): void {
    if (this.unsubscribeConfig) {
      this.unsubscribeConfig()
      this.unsubscribeConfig = null
    }
  }

  /**
   * Add an input to the buffer
   * For jump actions, we allow refreshing the timestamp to support mashing
   */
  push(action: InputAction): void {
    const now = performance.now()
    
    // For jump/slide, refresh timestamp if already buffered (supports mashing)
    // This makes repeated taps feel more responsive
    if (action === 'jump' || action === 'slide') {
      const existing = this.buffer.find(b => b.action === action && !b.consumed)
      if (existing) {
        existing.timestamp = now // Refresh the buffer time
        return
      }
    } else {
      // For other actions, don't buffer if already present (prevent spam)
      const existing = this.buffer.find(b => b.action === action && !b.consumed)
      if (existing) return
    }
    
    this.buffer.push({
      action,
      timestamp: now,
      consumed: false,
    })
    
    // Trim buffer if too large
    if (this.buffer.length > this.MAX_BUFFER_SIZE) {
      this.buffer.shift()
    }
  }

  /**
   * Mark an action as held (for continuous input)
   */
  setHeld(action: InputAction, held: boolean): void {
    if (held) {
      this.heldActions.add(action)
    } else {
      this.heldActions.delete(action)
    }
  }

  /**
   * Check if an action is currently held
   */
  isHeld(action: InputAction): boolean {
    return this.heldActions.has(action)
  }

  /**
   * Try to consume a buffered input
   * Returns true if the action was in the buffer and is now consumed
   */
  consume(action: InputAction): boolean {
    const now = performance.now()
    
    // Find and consume the action (skip expired ones)
    for (let i = 0; i < this.buffer.length; i++) {
      const b = this.buffer[i]
      if (b.action === action && !b.consumed && now - b.timestamp < this.bufferDuration) {
        b.consumed = true
        return true
      }
    }
    
    return false
  }

  /**
   * Check if an action is buffered (without consuming)
   */
  has(action: InputAction): boolean {
    const now = performance.now()
    return this.buffer.some(b => 
      b.action === action && 
      !b.consumed && 
      now - b.timestamp < this.bufferDuration
    )
  }

  /**
   * Get all unconsumed actions
   */
  getBuffered(): InputAction[] {
    const now = performance.now()
    return this.buffer
      .filter(b => !b.consumed && now - b.timestamp < this.bufferDuration)
      .map(b => b.action)
  }

  /**
   * Clear all buffered inputs
   */
  clear(): void {
    this.buffer = []
    this.heldActions.clear()
  }

  /**
   * Update - call each frame to clean expired inputs
   * Optimized to avoid array allocation when possible
   */
  update(): void {
    if (this.buffer.length === 0) return
    
    const now = performance.now()
    let writeIndex = 0
    
    // In-place filter to avoid allocation
    for (let i = 0; i < this.buffer.length; i++) {
      if (now - this.buffer[i].timestamp < this.bufferDuration) {
        if (writeIndex !== i) {
          this.buffer[writeIndex] = this.buffer[i]
        }
        writeIndex++
      }
    }
    
    this.buffer.length = writeIndex
  }
}
