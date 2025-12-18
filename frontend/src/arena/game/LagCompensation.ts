/**
 * Lag Compensation System
 *
 * Layer 3: Game Logic - Stores world snapshots for server-side hit detection rewind.
 * Allows the server to evaluate hits at the time the client fired.
 */

import { Vector3 } from '../math/Vector3';
import { Capsule } from '../physics/Capsule';
import type { Result } from '../core/Result';
import { Ok, Err } from '../core/Result';

/**
 * Lag compensation configuration
 */
export interface LagCompensationConfig {
  /** Maximum rewind time in ms */
  readonly maxRewindMs: number;
  /** How long to keep snapshots in ms */
  readonly historyDurationMs: number;
  /** Duration of a single tick in ms */
  readonly tickDurationMs: number;
}

/**
 * Default lag compensation configuration
 */
export const DEFAULT_LAG_COMPENSATION_CONFIG: LagCompensationConfig = {
  maxRewindMs: 250,
  historyDurationMs: 1000,
  tickDurationMs: 16.67,
};

/**
 * A snapshot of the world state at a point in time
 */
export interface WorldSnapshot {
  readonly tickNumber: number;
  readonly timestamp: number;
  readonly playerPositions: Map<number, Vector3>;
  readonly playerCapsules: Map<number, Capsule>;
}

/**
 * Lag compensation interface
 */
export interface ILagCompensation {
  /** Record a new world snapshot */
  recordSnapshot(snapshot: WorldSnapshot): void;
  /** Get snapshot closest to target time */
  getSnapshotAtTime(targetTime: number): Result<WorldSnapshot, string>;
  /** Get snapshot at specific tick */
  getSnapshotAtTick(tickNumber: number): Result<WorldSnapshot, string>;
  /** Get interpolated player capsules at target time */
  getPlayerCapsulesAtTime(targetTime: number): Result<Map<number, Capsule>, string>;
  /** Remove old snapshots */
  pruneOldSnapshots(currentTime: number): void;
  /** Clear all snapshots */
  clear(): void;
  /** Get number of stored snapshots */
  getSnapshotCount(): number;
}


/**
 * Lag compensation implementation
 *
 * Stores a history of world snapshots and provides methods to retrieve
 * historical state for server-side hit detection.
 */
export class LagCompensation implements ILagCompensation {
  private snapshots: WorldSnapshot[] = [];
  private readonly config: LagCompensationConfig;

  constructor(config: LagCompensationConfig = DEFAULT_LAG_COMPENSATION_CONFIG) {
    this.config = config;
  }

  recordSnapshot(snapshot: WorldSnapshot): void {
    this.snapshots.push(snapshot);

    // Keep sorted by tick number
    this.snapshots.sort((a, b) => a.tickNumber - b.tickNumber);
  }

  getSnapshotAtTime(targetTime: number): Result<WorldSnapshot, string> {
    if (this.snapshots.length === 0) {
      return Err('No snapshots available');
    }

    const currentTime = this.snapshots[this.snapshots.length - 1].timestamp;
    const rewindAmount = currentTime - targetTime;

    // Cap rewind to max allowed
    if (rewindAmount > this.config.maxRewindMs) {
      const cappedTime = currentTime - this.config.maxRewindMs;
      return this.findSnapshotNearTime(cappedTime);
    }

    return this.findSnapshotNearTime(targetTime);
  }

  getSnapshotAtTick(tickNumber: number): Result<WorldSnapshot, string> {
    const snapshot = this.snapshots.find((s) => s.tickNumber === tickNumber);
    if (!snapshot) {
      return Err(`Snapshot for tick ${tickNumber} not found`);
    }
    return Ok(snapshot);
  }

  getPlayerCapsulesAtTime(targetTime: number): Result<Map<number, Capsule>, string> {
    const snapshotResult = this.getSnapshotAtTime(targetTime);
    if (!snapshotResult.ok) {
      return snapshotResult;
    }

    // Find surrounding snapshots for interpolation
    const before = this.findSnapshotBefore(targetTime);
    const after = this.findSnapshotAfter(targetTime);

    if (!before || !after || before === after) {
      return Ok(snapshotResult.value.playerCapsules);
    }

    // Interpolate between snapshots
    const t = (targetTime - before.timestamp) / (after.timestamp - before.timestamp);
    const interpolatedCapsules = new Map<number, Capsule>();

    before.playerCapsules.forEach((capsuleBefore, playerId) => {
      const capsuleAfter = after.playerCapsules.get(playerId);
      if (capsuleAfter) {
        const interpolatedPos = capsuleBefore.position.lerp(capsuleAfter.position, t);
        interpolatedCapsules.set(playerId, new Capsule(interpolatedPos));
      } else {
        interpolatedCapsules.set(playerId, capsuleBefore);
      }
    });

    return Ok(interpolatedCapsules);
  }

  pruneOldSnapshots(currentTime: number): void {
    const cutoffTime = currentTime - this.config.historyDurationMs;
    this.snapshots = this.snapshots.filter((s) => s.timestamp >= cutoffTime);
  }

  clear(): void {
    this.snapshots = [];
  }

  getSnapshotCount(): number {
    return this.snapshots.length;
  }

  private findSnapshotNearTime(targetTime: number): Result<WorldSnapshot, string> {
    if (this.snapshots.length === 0) {
      return Err('No snapshots available');
    }

    // Binary search for closest snapshot
    let left = 0;
    let right = this.snapshots.length - 1;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (this.snapshots[mid].timestamp < targetTime) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    // Return closest of left and left-1
    if (left > 0) {
      const diffLeft = Math.abs(this.snapshots[left].timestamp - targetTime);
      const diffPrev = Math.abs(this.snapshots[left - 1].timestamp - targetTime);
      if (diffPrev < diffLeft) {
        return Ok(this.snapshots[left - 1]);
      }
    }

    return Ok(this.snapshots[left]);
  }

  private findSnapshotBefore(targetTime: number): WorldSnapshot | null {
    for (let i = this.snapshots.length - 1; i >= 0; i--) {
      if (this.snapshots[i].timestamp <= targetTime) {
        return this.snapshots[i];
      }
    }
    return null;
  }

  private findSnapshotAfter(targetTime: number): WorldSnapshot | null {
    for (const snapshot of this.snapshots) {
      if (snapshot.timestamp >= targetTime) {
        return snapshot;
      }
    }
    return null;
  }
}
