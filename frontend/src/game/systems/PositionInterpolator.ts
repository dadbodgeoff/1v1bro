/**
 * Position Interpolator - Smooth opponent movement with client-side prediction
 * 
 * Handles network latency by interpolating between received positions
 * and extrapolating when packets are delayed.
 */

import type { Vector2 } from '../types'

interface PositionSnapshot {
  position: Vector2
  timestamp: number
  velocity: Vector2
}

export class PositionInterpolator {
  private snapshots: PositionSnapshot[] = []
  private readonly MAX_SNAPSHOTS = 10
  private readonly INTERPOLATION_DELAY_MS = 100 // Render 100ms behind for smooth interpolation
  private readonly EXTRAPOLATION_LIMIT_MS = 200 // Max time to extrapolate before snapping

  private currentPosition: Vector2 = { x: 0, y: 0 }
  private lastUpdateTime = 0

  /**
   * Add a new position snapshot from the network
   */
  addSnapshot(position: Vector2, serverTime?: number): void {
    const now = Date.now()
    const timestamp = serverTime ?? now

    // Calculate velocity from previous snapshot
    let velocity: Vector2 = { x: 0, y: 0 }
    if (this.snapshots.length > 0) {
      const prev = this.snapshots[this.snapshots.length - 1]
      const dt = (timestamp - prev.timestamp) / 1000
      if (dt > 0 && dt < 1) {
        velocity = {
          x: (position.x - prev.position.x) / dt,
          y: (position.y - prev.position.y) / dt,
        }
      }
    }

    this.snapshots.push({ position, timestamp, velocity })

    // Keep only recent snapshots
    while (this.snapshots.length > this.MAX_SNAPSHOTS) {
      this.snapshots.shift()
    }

    this.lastUpdateTime = now
  }

  /**
   * Get interpolated position for current render time
   */
  getPosition(): Vector2 {
    if (this.snapshots.length === 0) {
      return this.currentPosition
    }

    const now = Date.now()
    const renderTime = now - this.INTERPOLATION_DELAY_MS

    // Find two snapshots to interpolate between
    let before: PositionSnapshot | null = null
    let after: PositionSnapshot | null = null

    for (let i = 0; i < this.snapshots.length; i++) {
      const snapshot = this.snapshots[i]
      if (snapshot.timestamp <= renderTime) {
        before = snapshot
      } else {
        after = snapshot
        break
      }
    }

    // Case 1: We have both before and after - interpolate
    if (before && after) {
      const t = (renderTime - before.timestamp) / (after.timestamp - before.timestamp)
      this.currentPosition = this.lerp(before.position, after.position, t)
    }
    // Case 2: Only have before - extrapolate using velocity
    else if (before) {
      const timeSinceSnapshot = (renderTime - before.timestamp) / 1000

      // Limit extrapolation to prevent wild predictions
      if (timeSinceSnapshot * 1000 < this.EXTRAPOLATION_LIMIT_MS) {
        this.currentPosition = {
          x: before.position.x + before.velocity.x * timeSinceSnapshot,
          y: before.position.y + before.velocity.y * timeSinceSnapshot,
        }
      } else {
        // Too long without update - just use last known position
        this.currentPosition = before.position
      }
    }
    // Case 3: Only have after (shouldn't happen often) - use it directly
    else if (after) {
      this.currentPosition = after.position
    }

    return this.currentPosition
  }

  /**
   * Linear interpolation between two positions
   */
  private lerp(a: Vector2, b: Vector2, t: number): Vector2 {
    // Clamp t to [0, 1]
    t = Math.max(0, Math.min(1, t))
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
    }
  }

  /**
   * Check if we have recent data (for detecting disconnection)
   */
  hasRecentData(): boolean {
    return Date.now() - this.lastUpdateTime < 1000
  }

  /**
   * Check if we have any position data at all
   */
  hasData(): boolean {
    return this.snapshots.length > 0
  }

  /**
   * Reset interpolator state
   */
  reset(): void {
    this.snapshots = []
    this.currentPosition = { x: 0, y: 0 }
    this.lastUpdateTime = 0
  }

  /**
   * Set initial position (e.g., on spawn)
   */
  setPosition(position: Vector2): void {
    this.currentPosition = { ...position }
    this.snapshots = [{
      position: { ...position },
      timestamp: Date.now(),
      velocity: { x: 0, y: 0 },
    }]
    this.lastUpdateTime = Date.now()
  }
}
