/**
 * InterpolationBuffer - Smooth rendering of remote entities
 *
 * Layer 4: Client Systems - Stores state snapshots and interpolates between them
 * for smooth rendering of remote players despite network latency.
 *
 * @example
 * const buffer = new InterpolationBuffer(config, eventBus);
 * buffer.addSnapshot(snapshot);
 * const entities = buffer.getInterpolatedEntities(renderTime, localPlayerId);
 */

import { Vector3 } from '../math/Vector3';
import type { StateSnapshot } from '../network/Serializer';
import type { IEventBus } from '../core/EventBus';

/**
 * Configuration for interpolation behavior
 */
export interface InterpolationConfig {
  /** Maximum snapshots to store (default: 32) */
  readonly bufferSize: number;
  /** Render delay behind server time in ms (default: 100) */
  readonly interpolationDelayMs: number;
  /** Maximum extrapolation time before freezing in ms (default: 100) */
  readonly maxExtrapolationMs: number;
  /** Blend duration when recovering from extrapolation in ms (default: 50) */
  readonly blendDurationMs: number;
}

export const DEFAULT_INTERPOLATION_CONFIG: InterpolationConfig = {
  bufferSize: 32,
  interpolationDelayMs: 100,
  maxExtrapolationMs: 100,
  blendDurationMs: 50,
};

/**
 * Interpolated entity state for rendering
 */
export interface InterpolatedEntity {
  readonly entityId: number;
  readonly position: Vector3;
  readonly pitch: number;
  readonly yaw: number;
  /** True if extrapolating beyond last known snapshot */
  readonly isExtrapolating: boolean;
  /** True if extrapolation exceeded max time (frozen) */
  readonly isStale: boolean;
}

/**
 * Interface for interpolation buffer
 */
export interface IInterpolationBuffer {
  /** Add a new state snapshot to the buffer */
  addSnapshot(snapshot: StateSnapshot): void;
  /** Get interpolated entities for rendering at given time */
  getInterpolatedEntities(renderTime: number, localPlayerId: number): InterpolatedEntity[];
  /** Adjust interpolation delay (e.g., based on RTT) */
  setInterpolationDelay(delayMs: number): void;
  /** Clear all stored snapshots */
  clear(): void;
  /** Get current snapshot count */
  getSnapshotCount(): number;
}

/**
 * InterpolationBuffer implementation
 *
 * Features:
 * - Ring buffer storage of state snapshots
 * - Linear interpolation between snapshots
 * - Velocity-based extrapolation when snapshots are missing
 * - Stale detection when extrapolation exceeds limit
 * - Angle interpolation with wrapping
 *
 * _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
 */
export class InterpolationBuffer implements IInterpolationBuffer {
  private snapshots: StateSnapshot[] = [];
  private interpolationDelay: number;
  private lastExtrapolationStart: Map<number, number> = new Map();
  private readonly config: InterpolationConfig;

  constructor(config: InterpolationConfig, _eventBus: IEventBus) {
    this.config = config;
    this.interpolationDelay = config.interpolationDelayMs;
  }

  /**
   * Add a new state snapshot to the buffer
   *
   * Maintains buffer size limit and sorts by tick number.
   * _Requirements: 7.1_
   */
  addSnapshot(snapshot: StateSnapshot): void {
    this.snapshots.push(snapshot);

    // Keep buffer size limited
    while (this.snapshots.length > this.config.bufferSize) {
      this.snapshots.shift();
    }

    // Sort by tick number
    this.snapshots.sort((a, b) => a.tickNumber - b.tickNumber);

    // Clear extrapolation tracking for entities in new snapshot
    snapshot.players.forEach((p) => this.lastExtrapolationStart.delete(p.entityId));
  }

  /**
   * Get interpolated entities for rendering
   *
   * Interpolates between snapshots at (renderTime - interpolationDelay).
   * Extrapolates using velocity if no future snapshot available.
   * Marks entities as stale if extrapolation exceeds limit.
   *
   * _Requirements: 7.2, 7.3, 7.4_
   */
  getInterpolatedEntities(renderTime: number, localPlayerId: number): InterpolatedEntity[] {
    const targetTime = renderTime - this.interpolationDelay;
    const results: InterpolatedEntity[] = [];

    // Find surrounding snapshots
    const { before, after } = this.findSurroundingSnapshots(targetTime);

    if (!before) {
      return results; // No data yet
    }

    // Get all unique entity IDs
    const entityIds = new Set<number>();
    this.snapshots.forEach((s) => s.players.forEach((p) => entityIds.add(p.entityId)));

    entityIds.forEach((entityId) => {
      if (entityId === localPlayerId) return; // Skip local player

      const interpolated = this.interpolateEntity(entityId, before, after, targetTime);
      if (interpolated) {
        results.push(interpolated);
      }
    });

    return results;
  }

  /**
   * Adjust interpolation delay
   *
   * Can be called when RTT changes to maintain smooth rendering.
   * _Requirements: 7.5_
   */
  setInterpolationDelay(delayMs: number): void {
    this.interpolationDelay = delayMs;
  }

  /**
   * Clear all stored snapshots
   */
  clear(): void {
    this.snapshots = [];
    this.lastExtrapolationStart.clear();
  }

  /**
   * Get current snapshot count
   */
  getSnapshotCount(): number {
    return this.snapshots.length;
  }

  /**
   * Find snapshots surrounding target time
   */
  private findSurroundingSnapshots(targetTime: number): {
    before: StateSnapshot | null;
    after: StateSnapshot | null;
  } {
    let before: StateSnapshot | null = null;
    let after: StateSnapshot | null = null;

    for (const snapshot of this.snapshots) {
      if (snapshot.serverTimestamp <= targetTime) {
        before = snapshot;
      } else if (!after) {
        after = snapshot;
        break;
      }
    }

    return { before, after };
  }

  /**
   * Interpolate or extrapolate entity state
   */
  private interpolateEntity(
    entityId: number,
    before: StateSnapshot,
    after: StateSnapshot | null,
    targetTime: number
  ): InterpolatedEntity | null {
    const stateBefore = before.players.find((p) => p.entityId === entityId);
    if (!stateBefore) return null;

    // If we have both snapshots, interpolate
    if (after) {
      const stateAfter = after.players.find((p) => p.entityId === entityId);
      if (stateAfter) {
        const t =
          (targetTime - before.serverTimestamp) / (after.serverTimestamp - before.serverTimestamp);
        const clampedT = Math.max(0, Math.min(1, t));

        return {
          entityId,
          position: stateBefore.position.lerp(stateAfter.position, clampedT),
          pitch: this.lerpAngle(stateBefore.pitch, stateAfter.pitch, clampedT),
          yaw: this.lerpAngle(stateBefore.yaw, stateAfter.yaw, clampedT),
          isExtrapolating: false,
          isStale: false,
        };
      }
    }

    // Extrapolate from last known state
    const timeSinceSnapshot = targetTime - before.serverTimestamp;

    if (timeSinceSnapshot > this.config.maxExtrapolationMs) {
      // Stale - freeze at last position
      return {
        entityId,
        position: stateBefore.position,
        pitch: stateBefore.pitch,
        yaw: stateBefore.yaw,
        isExtrapolating: false,
        isStale: true,
      };
    }

    // Extrapolate using velocity
    const extrapolatedPos = stateBefore.position.add(
      stateBefore.velocity.scale(timeSinceSnapshot / 1000)
    );

    return {
      entityId,
      position: extrapolatedPos,
      pitch: stateBefore.pitch,
      yaw: stateBefore.yaw,
      isExtrapolating: true,
      isStale: false,
    };
  }

  /**
   * Interpolate angle with wrapping
   *
   * Handles the discontinuity at ±PI correctly.
   */
  private lerpAngle(a: number, b: number, t: number): number {
    let diff = b - a;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return a + diff * t;
  }
}
