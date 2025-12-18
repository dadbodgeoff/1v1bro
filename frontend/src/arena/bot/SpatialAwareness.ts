/**
 * SpatialAwareness - Cover detection, LOS checking, and pathfinding
 * 
 * Provides spatial intelligence for bot decision-making including
 * cover evaluation, line-of-sight checks, and position safety.
 */

import { Vector3 } from 'three';
import type { AABB, CoverPosition } from './types';

/**
 * Position safety evaluation result
 */
export interface SafetyEvaluation {
  score: number;              // 0-1, higher = safer
  nearestCover: CoverPosition | null;
  distanceToCover: number;
  exposedToPlayer: boolean;
  nearBoundary: boolean;
}

/**
 * Simple path result
 */
export interface PathResult {
  waypoints: Vector3[];
  totalDistance: number;
  hasCover: boolean;
}

/**
 * Raycast result for LOS
 */
interface RaycastResult {
  hit: boolean;
  distance: number;
  point: Vector3 | null;
}

export class SpatialAwareness {
  private coverPositions: CoverPosition[] = [];
  private mapBounds: AABB | null = null;
  private obstacles: AABB[] = [];

  /**
   * Initialize with map data
   */
  initialize(
    coverPositions: CoverPosition[],
    mapBounds: AABB,
    obstacles?: AABB[]
  ): void {
    this.coverPositions = coverPositions;
    this.mapBounds = mapBounds;
    this.obstacles = obstacles ?? [];
  }

  /**
   * Update cover positions (can change during match)
   */
  setCoverPositions(positions: CoverPosition[]): void {
    this.coverPositions = positions;
  }

  /**
   * Check line of sight between two points
   */
  hasLineOfSight(from: Vector3, to: Vector3): boolean {
    // Simple obstacle check
    for (const obstacle of this.obstacles) {
      if (this.rayIntersectsAABB(from, to, obstacle)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Find nearest cover position
   */
  findNearestCover(position: Vector3): CoverPosition | null {
    if (this.coverPositions.length === 0) {
      return null;
    }

    let nearest: CoverPosition | null = null;
    let nearestDist = Infinity;

    for (const cover of this.coverPositions) {
      const dist = position.distanceTo(cover.position);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = cover;
      }
    }

    return nearest;
  }

  /**
   * Find best cover position relative to threat
   */
  findBestCover(
    botPosition: Vector3,
    threatPosition: Vector3,
    maxDistance: number = 15
  ): CoverPosition | null {
    const candidates = this.coverPositions.filter(cover => {
      const dist = botPosition.distanceTo(cover.position);
      return dist <= maxDistance;
    });

    if (candidates.length === 0) {
      return this.findNearestCover(botPosition);
    }

    // Score each cover position
    const scored = candidates.map(cover => {
      let score = cover.quality;

      // Prefer cover that blocks LOS to threat
      const coverToThreat = new Vector3().subVectors(threatPosition, cover.position);
      const coverNormalDot = cover.normal.dot(coverToThreat.normalize());
      if (coverNormalDot > 0) {
        // Cover faces toward threat (good)
        score += 0.3;
      }

      // Prefer closer cover
      const dist = botPosition.distanceTo(cover.position);
      score += (1 - dist / maxDistance) * 0.2;

      // Prefer full cover when available
      if (cover.height === 'full') {
        score += 0.1;
      }

      return { cover, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.cover ?? null;
  }

  /**
   * Evaluate safety of a position
   */
  evaluateSafety(
    position: Vector3,
    threatPosition: Vector3
  ): SafetyEvaluation {
    let score = 0.5; // Base score

    // Check nearest cover
    const nearestCover = this.findNearestCover(position);
    const distanceToCover = nearestCover
      ? position.distanceTo(nearestCover.position)
      : Infinity;

    // Near cover = safer
    if (distanceToCover < 2) {
      score += 0.3;
    } else if (distanceToCover < 5) {
      score += 0.15;
    }

    // Check if exposed to player
    const exposedToPlayer = this.hasLineOfSight(position, threatPosition);
    if (!exposedToPlayer) {
      score += 0.2;
    }

    // Check boundary proximity
    const nearBoundary = this.isNearBoundary(position, 2);
    if (nearBoundary) {
      score -= 0.15; // Corners are dangerous
    }

    // Distance from threat
    const threatDist = position.distanceTo(threatPosition);
    if (threatDist > 10) {
      score += 0.1; // Far from threat
    } else if (threatDist < 3) {
      score -= 0.1; // Very close to threat
    }

    return {
      score: Math.max(0, Math.min(1, score)),
      nearestCover,
      distanceToCover,
      exposedToPlayer,
      nearBoundary,
    };
  }

  /**
   * Find a safe position to retreat to
   */
  findRetreatPosition(
    botPosition: Vector3,
    threatPosition: Vector3,
    preferredDistance: number = 8
  ): Vector3 {
    // Direction away from threat
    const retreatDir = new Vector3()
      .subVectors(botPosition, threatPosition)
      .normalize();

    // Try to find cover in retreat direction
    const retreatTarget = botPosition.clone()
      .add(retreatDir.multiplyScalar(preferredDistance));

    // Clamp to map bounds
    if (this.mapBounds) {
      retreatTarget.x = Math.max(this.mapBounds.min.x + 1, 
        Math.min(this.mapBounds.max.x - 1, retreatTarget.x));
      retreatTarget.z = Math.max(this.mapBounds.min.z + 1, 
        Math.min(this.mapBounds.max.z - 1, retreatTarget.z));
    }

    // Check for cover near retreat position
    const nearCover = this.findBestCover(retreatTarget, threatPosition, 5);
    if (nearCover) {
      return nearCover.position.clone();
    }

    return retreatTarget;
  }

  /**
   * Find a flanking position
   */
  findFlankPosition(
    botPosition: Vector3,
    threatPosition: Vector3,
    preferLeft: boolean = Math.random() > 0.5
  ): Vector3 {
    // Direction to threat
    const toThreat = new Vector3()
      .subVectors(threatPosition, botPosition)
      .normalize();

    // Perpendicular direction (flank)
    const flankDir = new Vector3(
      preferLeft ? -toThreat.z : toThreat.z,
      0,
      preferLeft ? toThreat.x : -toThreat.x
    );

    // Move to side while advancing slightly
    const flankTarget = botPosition.clone()
      .add(flankDir.multiplyScalar(6))
      .add(toThreat.multiplyScalar(3));

    // Clamp to map bounds
    if (this.mapBounds) {
      flankTarget.x = Math.max(this.mapBounds.min.x + 1, 
        Math.min(this.mapBounds.max.x - 1, flankTarget.x));
      flankTarget.z = Math.max(this.mapBounds.min.z + 1, 
        Math.min(this.mapBounds.max.z - 1, flankTarget.z));
    }

    return flankTarget;
  }

  /**
   * Simple pathfinding to target (waypoint-based)
   */
  findPath(from: Vector3, to: Vector3): PathResult {
    // Simple direct path for now
    // Could be enhanced with A* or navmesh
    const waypoints: Vector3[] = [];
    
    // Check if direct path is clear
    if (this.hasLineOfSight(from, to)) {
      waypoints.push(to.clone());
      return {
        waypoints,
        totalDistance: from.distanceTo(to),
        hasCover: false,
      };
    }

    // Try to path through cover points
    const midpoint = new Vector3().lerpVectors(from, to, 0.5);
    const nearCover = this.findNearestCover(midpoint);

    if (nearCover) {
      waypoints.push(nearCover.position.clone());
      waypoints.push(to.clone());
      
      const dist1 = from.distanceTo(nearCover.position);
      const dist2 = nearCover.position.distanceTo(to);
      
      return {
        waypoints,
        totalDistance: dist1 + dist2,
        hasCover: true,
      };
    }

    // Fallback to direct path
    waypoints.push(to.clone());
    return {
      waypoints,
      totalDistance: from.distanceTo(to),
      hasCover: false,
    };
  }

  /**
   * Check if position is near map boundary
   */
  private isNearBoundary(position: Vector3, threshold: number): boolean {
    if (!this.mapBounds) return false;

    return (
      position.x - this.mapBounds.min.x < threshold ||
      this.mapBounds.max.x - position.x < threshold ||
      position.z - this.mapBounds.min.z < threshold ||
      this.mapBounds.max.z - position.z < threshold
    );
  }

  /**
   * Simple ray-AABB intersection test
   */
  private rayIntersectsAABB(from: Vector3, to: Vector3, aabb: AABB): boolean {
    const dir = new Vector3().subVectors(to, from);
    const length = dir.length();
    dir.normalize();

    // Slab method for ray-AABB intersection
    let tmin = 0;
    let tmax = length;

    for (const axis of ['x', 'y', 'z'] as const) {
      const invD = 1 / dir[axis];
      let t0 = (aabb.min[axis] - from[axis]) * invD;
      let t1 = (aabb.max[axis] - from[axis]) * invD;

      if (invD < 0) {
        [t0, t1] = [t1, t0];
      }

      tmin = Math.max(tmin, t0);
      tmax = Math.min(tmax, t1);

      if (tmax < tmin) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get all cover positions
   */
  getCoverPositions(): CoverPosition[] {
    return [...this.coverPositions];
  }

  /**
   * Check if bot is in cover relative to threat
   */
  isInCover(botPosition: Vector3, threatPosition: Vector3): boolean {
    const nearestCover = this.findNearestCover(botPosition);
    if (!nearestCover || botPosition.distanceTo(nearestCover.position) > 1.5) {
      return false;
    }

    // Check if cover blocks LOS
    return !this.hasLineOfSight(botPosition, threatPosition);
  }

  /**
   * Reset state
   */
  reset(): void {
    this.coverPositions = [];
    this.obstacles = [];
  }
}
