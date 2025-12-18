/**
 * Spawn System
 *
 * Layer 3: Game Logic - Manages player spawn point selection.
 * Selects optimal spawn points based on distance from enemies.
 */

import { Vector3 } from '../math/Vector3';
import type { IEventBus } from '../core/EventBus';

/**
 * A spawn point in the arena
 */
export interface SpawnPoint {
  readonly id: string;
  readonly position: Vector3;
  readonly lookDirection: Vector3;
}

/**
 * Spawn point definition from manifest
 */
export interface SpawnPointDefinition {
  readonly id: string;
  readonly position: [number, number, number];
}

/**
 * Spawn manifest loaded from map data
 */
export interface SpawnManifest {
  readonly spawnPoints: SpawnPointDefinition[];
  readonly arenaCenter: [number, number, number];
}

/**
 * Spawn system interface
 */
export interface ISpawnSystem {
  /** Load spawn points from manifest */
  loadManifest(manifest: SpawnManifest): void;
  /** Select optimal spawn point for a player */
  selectSpawnPoint(playerId: number, otherPlayerPositions: Vector3[]): SpawnPoint;
  /** Get all spawn points */
  getSpawnPoints(): SpawnPoint[];
  /** Set current time for spawn cooldown tracking */
  setCurrentTime(time: number): void;
}

/**
 * Spawn system implementation
 *
 * Spawn point selection algorithm:
 * 1. Score each spawn point based on distance from enemies
 * 2. Add bonus for spawn points not recently used
 * 3. Apply heavy penalty for blocked spawn points (within 3m of player)
 * 4. Select spawn point with highest score
 */
export class SpawnSystem implements ISpawnSystem {
  private spawnPoints: SpawnPoint[] = [];
  private arenaCenter: Vector3 = Vector3.ZERO;
  private lastUsedTimes: Map<string, number> = new Map();
  private currentTime: number = 0;
  private readonly eventBus?: IEventBus;

  /** Minimum distance from other players for spawn to be considered unblocked */
  private static readonly BLOCKED_DISTANCE = 3;
  /** Penalty applied to blocked spawn points */
  private static readonly BLOCKED_PENALTY = 1000;
  /** Bonus multiplier per ms since last use */
  private static readonly REUSE_BONUS_PER_MS = 0.001;

  constructor(eventBus?: IEventBus) {
    this.eventBus = eventBus;
  }

  loadManifest(manifest: SpawnManifest): void {
    this.arenaCenter = Vector3.fromArray(manifest.arenaCenter);

    this.spawnPoints = manifest.spawnPoints.map((def) => {
      const position = Vector3.fromArray(def.position);
      // Look direction points toward arena center
      const toCenter = this.arenaCenter.subtract(position);
      const lookDirection = new Vector3(toCenter.x, 0, toCenter.z).normalize();

      return {
        id: def.id,
        position,
        lookDirection: lookDirection.magnitudeSquared() > 0.001 ? lookDirection : Vector3.FORWARD,
      };
    });

    // Initialize last used times
    this.spawnPoints.forEach((sp) => this.lastUsedTimes.set(sp.id, 0));
  }

  selectSpawnPoint(playerId: number, otherPlayerPositions: Vector3[]): SpawnPoint {
    if (this.spawnPoints.length === 0) {
      throw new Error('No spawn points loaded');
    }

    // Score each spawn point
    let bestSpawn = this.spawnPoints[0];
    let bestScore = -Infinity;

    for (const spawn of this.spawnPoints) {
      const score = this.scoreSpawnPoint(spawn, otherPlayerPositions);

      if (score > bestScore) {
        bestScore = score;
        bestSpawn = spawn;
      }
    }

    // Mark as used
    this.lastUsedTimes.set(bestSpawn.id, this.currentTime);

    // Emit spawn event
    this.eventBus?.emit({
      type: 'player_spawned',
      timestamp: this.currentTime,
      playerId,
      positionX: bestSpawn.position.x,
      positionY: bestSpawn.position.y,
      positionZ: bestSpawn.position.z,
    });

    return bestSpawn;
  }

  getSpawnPoints(): SpawnPoint[] {
    return [...this.spawnPoints];
  }

  setCurrentTime(time: number): void {
    this.currentTime = time;
  }

  /**
   * Score a spawn point based on distance from enemies and recent usage
   */
  private scoreSpawnPoint(spawn: SpawnPoint, otherPlayerPositions: Vector3[]): number {
    let score = 0;

    // Distance from enemies (higher is better)
    for (const enemyPos of otherPlayerPositions) {
      const dist = spawn.position.distanceTo(enemyPos);
      score += dist;
    }

    // Bonus for not recently used
    const lastUsed = this.lastUsedTimes.get(spawn.id) ?? 0;
    const timeSinceUsed = this.currentTime - lastUsed;
    score += timeSinceUsed * SpawnSystem.REUSE_BONUS_PER_MS;

    // Check if blocked (within BLOCKED_DISTANCE of any player)
    const isBlocked = otherPlayerPositions.some(
      (pos) => spawn.position.distanceTo(pos) < SpawnSystem.BLOCKED_DISTANCE
    );
    if (isBlocked) {
      score -= SpawnSystem.BLOCKED_PENALTY;
    }

    return score;
  }
}
