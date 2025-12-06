/**
 * Client-Side Prediction System
 * 
 * Implements input prediction with server reconciliation for responsive movement.
 * Local player moves immediately; server corrections are applied smoothly.
 * 
 * Flow:
 * 1. Player presses key → Move locally immediately (prediction)
 * 2. Send input + sequence number to server
 * 3. Server validates and broadcasts authoritative position
 * 4. Client compares prediction vs server → Correct if mismatch
 */

import type { Vector2 } from '../types'

interface InputFrame {
  sequence: number
  timestamp: number
  direction: Vector2
  deltaTime: number
  predictedPosition: Vector2
}

interface ServerState {
  position: Vector2
  sequence: number
  timestamp: number
}

export class ClientPrediction {
  // Input history for reconciliation
  private inputHistory: InputFrame[] = []
  private readonly MAX_HISTORY = 120 // ~2 seconds at 60fps

  // Sequence tracking
  private inputSequence = 0
  private lastAckedSequence = 0

  // Position state
  private predictedPosition: Vector2 = { x: 0, y: 0 }
  private serverPosition: Vector2 = { x: 0, y: 0 }

  // Correction smoothing
  private correctionOffset: Vector2 = { x: 0, y: 0 }
  private readonly CORRECTION_SMOOTHING = 0.15 // Blend factor per frame

  // Mismatch tolerance (pixels)
  private readonly POSITION_TOLERANCE = 5

  // Movement config
  private moveSpeed = 300

  /**
   * Initialize with starting position
   */
  initialize(position: Vector2, moveSpeed: number): void {
    this.predictedPosition = { ...position }
    this.serverPosition = { ...position }
    this.correctionOffset = { x: 0, y: 0 }
    this.inputHistory = []
    this.inputSequence = 0
    this.lastAckedSequence = 0
    this.moveSpeed = moveSpeed
  }

  /**
   * Process local input and predict movement
   * Returns the input frame to send to server
   */
  processInput(direction: Vector2, deltaTime: number): InputFrame {
    // Increment sequence
    this.inputSequence++

    // Calculate predicted position
    const speed = this.moveSpeed * deltaTime
    const newPosition: Vector2 = {
      x: this.predictedPosition.x + direction.x * speed,
      y: this.predictedPosition.y + direction.y * speed,
    }

    // Create input frame
    const frame: InputFrame = {
      sequence: this.inputSequence,
      timestamp: Date.now(),
      direction: { ...direction },
      deltaTime,
      predictedPosition: { ...newPosition },
    }

    // Store in history
    this.inputHistory.push(frame)

    // Trim old history
    while (this.inputHistory.length > this.MAX_HISTORY) {
      this.inputHistory.shift()
    }

    // Update predicted position
    this.predictedPosition = newPosition

    return frame
  }

  /**
   * Receive authoritative state from server
   * Reconcile with local prediction
   */
  receiveServerState(state: ServerState): void {
    this.serverPosition = { ...state.position }
    this.lastAckedSequence = state.sequence

    // Remove acknowledged inputs from history
    this.inputHistory = this.inputHistory.filter(
      (frame) => frame.sequence > state.sequence
    )

    // Check if prediction matches server
    const mismatch = this.calculateMismatch(state.position)

    if (mismatch > this.POSITION_TOLERANCE) {
      // Prediction was wrong - reconcile
      this.reconcile(state)
    }
  }

  /**
   * Calculate distance between predicted and server position
   */
  private calculateMismatch(serverPos: Vector2): number {
    // Find the predicted position at the server's acknowledged sequence
    // For now, compare against current predicted position
    const dx = this.predictedPosition.x - serverPos.x
    const dy = this.predictedPosition.y - serverPos.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * Reconcile prediction with server state
   * Re-apply unacknowledged inputs on top of server position
   */
  private reconcile(state: ServerState): void {
    // Start from server position
    let reconciledPosition = { ...state.position }

    // Re-apply all unacknowledged inputs
    for (const frame of this.inputHistory) {
      const speed = this.moveSpeed * frame.deltaTime
      reconciledPosition = {
        x: reconciledPosition.x + frame.direction.x * speed,
        y: reconciledPosition.y + frame.direction.y * speed,
      }
    }

    // Calculate correction needed
    this.correctionOffset = {
      x: reconciledPosition.x - this.predictedPosition.x,
      y: reconciledPosition.y - this.predictedPosition.y,
    }

    // Update predicted position to reconciled
    this.predictedPosition = reconciledPosition
  }

  /**
   * Get the render position (with smooth correction)
   */
  getRenderPosition(): Vector2 {
    // Apply smooth correction offset
    const smoothedPosition: Vector2 = {
      x: this.predictedPosition.x - this.correctionOffset.x,
      y: this.predictedPosition.y - this.correctionOffset.y,
    }

    // Decay correction offset
    this.correctionOffset = {
      x: this.correctionOffset.x * (1 - this.CORRECTION_SMOOTHING),
      y: this.correctionOffset.y * (1 - this.CORRECTION_SMOOTHING),
    }

    // Zero out tiny corrections
    if (Math.abs(this.correctionOffset.x) < 0.1) this.correctionOffset.x = 0
    if (Math.abs(this.correctionOffset.y) < 0.1) this.correctionOffset.y = 0

    return smoothedPosition
  }

  /**
   * Get current predicted position (for collision, etc.)
   */
  getPredictedPosition(): Vector2 {
    return { ...this.predictedPosition }
  }

  /**
   * Set position directly (for teleports, respawns)
   */
  setPosition(position: Vector2): void {
    this.predictedPosition = { ...position }
    this.serverPosition = { ...position }
    this.correctionOffset = { x: 0, y: 0 }
    this.inputHistory = []
  }

  /**
   * Get current input sequence (for server messages)
   */
  getSequence(): number {
    return this.inputSequence
  }

  /**
   * Get pending (unacknowledged) input count
   */
  getPendingInputCount(): number {
    return this.inputHistory.length
  }

  /**
   * Get last acknowledged sequence from server
   */
  getLastAckedSequence(): number {
    return this.lastAckedSequence
  }

  /**
   * Check if we have significant desync
   */
  hasDesync(): boolean {
    const dx = this.predictedPosition.x - this.serverPosition.x
    const dy = this.predictedPosition.y - this.serverPosition.y
    return Math.sqrt(dx * dx + dy * dy) > this.POSITION_TOLERANCE * 3
  }
}
