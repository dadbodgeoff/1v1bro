/**
 * Lag Compensation System - AAA Enterprise Grade
 *
 * Implements position history tracking for server-side hit detection rewinding.
 * When a player fires, the server can rewind other players' positions to where
 * they were at the shooter's view time, ensuring fair hit detection regardless
 * of network latency.
 *
 * Features:
 * - Position history buffer with timestamps
 * - Interpolation between history snapshots
 * - Configurable history window
 * - Support for multiple entities
 */

import { INTERPOLATION_CONFIG, SERVER_VALIDATION_CONFIG } from '../config'
import type { Vector2 } from '../types'

/** Position snapshot with timestamp */
export interface PositionSnapshot {
  position: Vector2
  timestamp: number
  velocity?: Vector2
}

/** Entity state at a point in time */
export interface EntitySnapshot {
  entityId: string
  position: Vector2
  velocity: Vector2
  timestamp: number
}

export class LagCompensation {
  // Position history per entity
  private positionHistory: Map<string, PositionSnapshot[]> = new Map()
  private readonly historySize = INTERPOLATION_CONFIG.positionHistorySize
  private readonly maxLagWindow = SERVER_VALIDATION_CONFIG.lagCompensationWindow

  /**
   * Record a position snapshot for an entity
   */
  recordPosition(entityId: string, position: Vector2, velocity?: Vector2): void {
    let history = this.positionHistory.get(entityId)
    if (!history) {
      history = []
      this.positionHistory.set(entityId, history)
    }

    const snapshot: PositionSnapshot = {
      position: { x: position.x, y: position.y },
      timestamp: Date.now(),
      velocity: velocity ? { x: velocity.x, y: velocity.y } : undefined,
    }

    history.push(snapshot)

    // Trim old history
    while (history.length > this.historySize) {
      history.shift()
    }
  }

  /**
   * Get interpolated position at a specific timestamp
   * Used for lag compensation - rewind to where entity was at shooter's view time
   *
   * @param entityId - The entity to look up
   * @param timestamp - The target timestamp to interpolate to
   * @returns Interpolated position or null if not enough history
   */
  getPositionAtTime(entityId: string, timestamp: number): Vector2 | null {
    const history = this.positionHistory.get(entityId)
    if (!history || history.length < 2) return null

    // Clamp timestamp to valid lag compensation window
    const now = Date.now()
    const minTime = now - this.maxLagWindow
    const clampedTimestamp = Math.max(timestamp, minTime)

    // Find surrounding snapshots
    let before: PositionSnapshot | null = null
    let after: PositionSnapshot | null = null

    for (let i = 0; i < history.length; i++) {
      if (history[i].timestamp <= clampedTimestamp) {
        before = history[i]
      }
      if (history[i].timestamp >= clampedTimestamp && !after) {
        after = history[i]
        break
      }
    }

    // If timestamp is before all history, use oldest
    if (!before && after) {
      return { x: after.position.x, y: after.position.y }
    }

    // If timestamp is after all history, extrapolate from latest
    if (before && !after) {
      return this.extrapolate(before, clampedTimestamp)
    }

    // Interpolate between snapshots
    if (before && after) {
      return this.interpolate(before, after, clampedTimestamp)
    }

    return null
  }

  /**
   * Linear interpolation between two snapshots
   */
  private interpolate(
    before: PositionSnapshot,
    after: PositionSnapshot,
    targetTime: number
  ): Vector2 {
    const totalTime = after.timestamp - before.timestamp
    if (totalTime <= 0) {
      return { x: before.position.x, y: before.position.y }
    }

    const alpha = (targetTime - before.timestamp) / totalTime

    return {
      x: before.position.x + (after.position.x - before.position.x) * alpha,
      y: before.position.y + (after.position.y - before.position.y) * alpha,
    }
  }

  /**
   * Extrapolate position forward from a snapshot using velocity
   */
  private extrapolate(snapshot: PositionSnapshot, targetTime: number): Vector2 {
    const deltaTime = (targetTime - snapshot.timestamp) / 1000 // Convert to seconds

    // Clamp extrapolation to prevent wild predictions
    const maxExtrapolation = SERVER_VALIDATION_CONFIG.maxExtrapolation / 1000
    const clampedDelta = Math.min(deltaTime, maxExtrapolation)

    if (snapshot.velocity) {
      return {
        x: snapshot.position.x + snapshot.velocity.x * clampedDelta,
        y: snapshot.position.y + snapshot.velocity.y * clampedDelta,
      }
    }

    return { x: snapshot.position.x, y: snapshot.position.y }
  }

  /**
   * Get all entity positions at a specific timestamp
   * Useful for server-side hit detection across all players
   */
  getAllPositionsAtTime(timestamp: number): Map<string, Vector2> {
    const positions = new Map<string, Vector2>()

    for (const entityId of this.positionHistory.keys()) {
      const pos = this.getPositionAtTime(entityId, timestamp)
      if (pos) {
        positions.set(entityId, pos)
      }
    }

    return positions
  }

  /**
   * Get the latest known position for an entity
   */
  getLatestPosition(entityId: string): Vector2 | null {
    const history = this.positionHistory.get(entityId)
    if (!history || history.length === 0) return null

    const latest = history[history.length - 1]
    return { x: latest.position.x, y: latest.position.y }
  }

  /**
   * Get position history for an entity (for debugging/replay)
   */
  getHistory(entityId: string): readonly PositionSnapshot[] {
    return this.positionHistory.get(entityId) ?? []
  }

  /**
   * Clear history for a specific entity
   */
  clearEntity(entityId: string): void {
    this.positionHistory.delete(entityId)
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.positionHistory.clear()
  }

  /**
   * Get statistics for debugging
   */
  getStats(): { entityCount: number; totalSnapshots: number } {
    let totalSnapshots = 0
    for (const history of this.positionHistory.values()) {
      totalSnapshots += history.length
    }
    return {
      entityCount: this.positionHistory.size,
      totalSnapshots,
    }
  }
}
