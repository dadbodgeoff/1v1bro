/**
 * AABB - Axis-Aligned Bounding Box
 * 
 * Fast collision primitive for static geometry.
 * Used for broad-phase collision detection and spatial queries.
 */

import type { IVector3 } from '../math/Vector3';
import { Vector3 } from '../math/Vector3';

export interface CollisionResult {
  readonly collided: boolean;
  readonly penetrationDepth: number;
  readonly normal: Vector3;
  readonly colliderId: string;
}

export interface IAABB {
  readonly id: string;
  readonly min: Vector3;
  readonly max: Vector3;
}

export class AABB implements IAABB {
  public readonly id: string;
  public readonly min: Vector3;
  public readonly max: Vector3;

  constructor(id: string, min: Vector3, max: Vector3) {
    this.id = id;
    this.min = min;
    this.max = max;
  }

  /**
   * Create AABB from center point and size
   */
  static fromCenterSize(id: string, center: IVector3, size: IVector3): AABB {
    const halfSize = new Vector3(size.x / 2, size.y / 2, size.z / 2);
    return new AABB(
      id,
      new Vector3(center.x - halfSize.x, center.y - halfSize.y, center.z - halfSize.z),
      new Vector3(center.x + halfSize.x, center.y + halfSize.y, center.z + halfSize.z)
    );
  }

  /**
   * Create AABB from min/max corners
   */
  static fromMinMax(id: string, min: IVector3, max: IVector3): AABB {
    return new AABB(id, new Vector3(min.x, min.y, min.z), new Vector3(max.x, max.y, max.z));
  }

  /**
   * Get center point of AABB
   */
  center(): Vector3 {
    return new Vector3(
      (this.min.x + this.max.x) / 2,
      (this.min.y + this.max.y) / 2,
      (this.min.z + this.max.z) / 2
    );
  }

  /**
   * Get size (dimensions) of AABB
   */
  size(): Vector3 {
    return new Vector3(
      this.max.x - this.min.x,
      this.max.y - this.min.y,
      this.max.z - this.min.z
    );
  }

  /**
   * Get half-extents (half of size)
   */
  halfExtents(): Vector3 {
    return this.size().scale(0.5);
  }

  /**
   * Check if point is inside AABB
   */
  containsPoint(point: IVector3): boolean {
    return (
      point.x >= this.min.x && point.x <= this.max.x &&
      point.y >= this.min.y && point.y <= this.max.y &&
      point.z >= this.min.z && point.z <= this.max.z
    );
  }

  /**
   * Check if this AABB intersects another AABB
   */
  intersectsAABB(other: IAABB): boolean {
    return (
      this.min.x <= other.max.x && this.max.x >= other.min.x &&
      this.min.y <= other.max.y && this.max.y >= other.min.y &&
      this.min.z <= other.max.z && this.max.z >= other.min.z
    );
  }

  /**
   * Expand AABB by amount in all directions
   */
  expand(amount: number): AABB {
    return new AABB(
      this.id,
      new Vector3(this.min.x - amount, this.min.y - amount, this.min.z - amount),
      new Vector3(this.max.x + amount, this.max.y + amount, this.max.z + amount)
    );
  }

  /**
   * Get closest point on AABB surface to given point
   */
  closestPoint(point: IVector3): Vector3 {
    return new Vector3(
      Math.max(this.min.x, Math.min(point.x, this.max.x)),
      Math.max(this.min.y, Math.min(point.y, this.max.y)),
      Math.max(this.min.z, Math.min(point.z, this.max.z))
    );
  }

  /**
   * Get distance from point to AABB surface (0 if inside)
   */
  distanceToPoint(point: IVector3): number {
    const closest = this.closestPoint(point);
    return new Vector3(point.x, point.y, point.z).distanceTo(closest);
  }

  /**
   * Merge two AABBs into one that contains both
   */
  merge(other: IAABB): AABB {
    return new AABB(
      this.id,
      new Vector3(
        Math.min(this.min.x, other.min.x),
        Math.min(this.min.y, other.min.y),
        Math.min(this.min.z, other.min.z)
      ),
      new Vector3(
        Math.max(this.max.x, other.max.x),
        Math.max(this.max.y, other.max.y),
        Math.max(this.max.z, other.max.z)
      )
    );
  }
}

export const NO_COLLISION: CollisionResult = {
  collided: false,
  penetrationDepth: 0,
  normal: Vector3.ZERO,
  colliderId: ''
};

/**
 * Test AABB vs AABB collision and return penetration info
 */
export function aabbVsAABB(a: AABB, b: AABB): CollisionResult {
  if (!a.intersectsAABB(b)) {
    return NO_COLLISION;
  }

  // Calculate overlap on each axis
  const overlapX = Math.min(a.max.x - b.min.x, b.max.x - a.min.x);
  const overlapY = Math.min(a.max.y - b.min.y, b.max.y - a.min.y);
  const overlapZ = Math.min(a.max.z - b.min.z, b.max.z - a.min.z);

  // Find minimum overlap axis (MTV direction)
  let penetration: number;
  let normal: Vector3;

  if (overlapX <= overlapY && overlapX <= overlapZ) {
    penetration = overlapX;
    normal = a.center().x < b.center().x ? new Vector3(-1, 0, 0) : new Vector3(1, 0, 0);
  } else if (overlapY <= overlapZ) {
    penetration = overlapY;
    normal = a.center().y < b.center().y ? new Vector3(0, -1, 0) : new Vector3(0, 1, 0);
  } else {
    penetration = overlapZ;
    normal = a.center().z < b.center().z ? new Vector3(0, 0, -1) : new Vector3(0, 0, 1);
  }

  return {
    collided: true,
    penetrationDepth: penetration,
    normal,
    colliderId: b.id
  };
}
