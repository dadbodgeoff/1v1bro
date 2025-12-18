/**
 * Capsule - Player collision shape
 * 
 * A capsule is a cylinder with hemispherical caps.
 * Used for player collision (radius=0.4m, height=1.8m, eye height=1.6m).
 */

import { Vector3 } from '../math/Vector3';
import type { CollisionResult } from './AABB';
import { AABB, NO_COLLISION } from './AABB';

export interface ICapsule {
  readonly position: Vector3;  // Base center position (feet)
  readonly radius: number;
  readonly height: number;
}

export class Capsule implements ICapsule {
  public readonly position: Vector3;
  public readonly radius: number;
  public readonly height: number;

  constructor(position: Vector3, radius: number = 0.4, height: number = 1.8) {
    this.position = position;
    this.radius = radius;
    this.height = height;
  }

  /**
   * Top of capsule line segment (center of top hemisphere)
   */
  get top(): Vector3 {
    return new Vector3(
      this.position.x,
      this.position.y + this.height - this.radius,
      this.position.z
    );
  }

  /**
   * Bottom of capsule line segment (center of bottom hemisphere)
   */
  get bottom(): Vector3 {
    return new Vector3(
      this.position.x,
      this.position.y + this.radius,
      this.position.z
    );
  }

  /**
   * Center of capsule
   */
  get center(): Vector3 {
    return new Vector3(
      this.position.x,
      this.position.y + this.height / 2,
      this.position.z
    );
  }

  /**
   * Eye position for first-person camera (1.6m from base)
   */
  get eyePosition(): Vector3 {
    return new Vector3(
      this.position.x,
      this.position.y + 1.6,
      this.position.z
    );
  }

  /**
   * Create bounding AABB for broad-phase collision
   */
  toBoundingAABB(): AABB {
    return new AABB(
      'capsule_bounds',
      new Vector3(
        this.position.x - this.radius,
        this.position.y,
        this.position.z - this.radius
      ),
      new Vector3(
        this.position.x + this.radius,
        this.position.y + this.height,
        this.position.z + this.radius
      )
    );
  }

  /**
   * Create new capsule at different position
   */
  withPosition(newPosition: Vector3): Capsule {
    return new Capsule(newPosition, this.radius, this.height);
  }
}

/**
 * Find closest point on line segment to a point
 */
function closestPointOnSegment(segStart: Vector3, segEnd: Vector3, point: Vector3): Vector3 {
  const segDir = segEnd.subtract(segStart);
  const segLenSq = segDir.magnitudeSquared();
  
  if (segLenSq < 0.0001) {
    return segStart;
  }
  
  const t = Math.max(0, Math.min(1, point.subtract(segStart).dot(segDir) / segLenSq));
  return segStart.add(segDir.scale(t));
}

/**
 * Find closest point on AABB to a point
 */
function closestPointOnAABB(point: Vector3, aabb: AABB): Vector3 {
  return new Vector3(
    Math.max(aabb.min.x, Math.min(point.x, aabb.max.x)),
    Math.max(aabb.min.y, Math.min(point.y, aabb.max.y)),
    Math.max(aabb.min.z, Math.min(point.z, aabb.max.z))
  );
}

/**
 * Test capsule vs AABB collision
 */
export function capsuleVsAABB(capsule: Capsule, aabb: AABB): CollisionResult {
  // Find closest point on capsule's line segment to AABB
  const segStart = capsule.bottom;
  const segEnd = capsule.top;
  
  // Get AABB center for initial closest point estimate
  const aabbCenter = aabb.center();
  
  // Find closest point on segment to AABB center
  let closestOnSegment = closestPointOnSegment(segStart, segEnd, aabbCenter);
  
  // Find closest point on AABB to that segment point
  let closestOnAABB = closestPointOnAABB(closestOnSegment, aabb);
  
  // Refine: find closest point on segment to the AABB point
  closestOnSegment = closestPointOnSegment(segStart, segEnd, closestOnAABB);
  closestOnAABB = closestPointOnAABB(closestOnSegment, aabb);
  
  // Calculate distance
  const diff = closestOnSegment.subtract(closestOnAABB);
  const distance = diff.magnitude();
  
  if (distance >= capsule.radius) {
    return NO_COLLISION;
  }
  
  // Calculate penetration and normal
  const penetration = capsule.radius - distance;
  
  // Normal points from AABB to capsule
  let normal: Vector3;
  if (distance > 0.0001) {
    normal = diff.normalize();
  } else {
    // Capsule center is inside AABB, use AABB face normal
    const toCenter = closestOnSegment.subtract(aabb.center());
    const absX = Math.abs(toCenter.x);
    const absY = Math.abs(toCenter.y);
    const absZ = Math.abs(toCenter.z);
    
    if (absX >= absY && absX >= absZ) {
      normal = new Vector3(toCenter.x > 0 ? 1 : -1, 0, 0);
    } else if (absY >= absZ) {
      normal = new Vector3(0, toCenter.y > 0 ? 1 : -1, 0);
    } else {
      normal = new Vector3(0, 0, toCenter.z > 0 ? 1 : -1);
    }
  }
  
  return {
    collided: true,
    penetrationDepth: penetration,
    normal,
    colliderId: aabb.id
  };
}

/**
 * Test capsule vs capsule collision (for player-player collision)
 */
export function capsuleVsCapsule(a: Capsule, b: Capsule): CollisionResult {
  // Find closest points between the two line segments
  const a1 = a.bottom;
  const a2 = a.top;
  const b1 = b.bottom;
  const b2 = b.top;
  
  const d1 = a2.subtract(a1); // Direction of segment A
  const d2 = b2.subtract(b1); // Direction of segment B
  const r = a1.subtract(b1);
  
  const a_len = d1.magnitudeSquared();
  const e = d2.magnitudeSquared();
  const f = d2.dot(r);
  
  let s: number, t: number;
  
  if (a_len < 0.0001 && e < 0.0001) {
    // Both segments are points
    s = t = 0;
  } else if (a_len < 0.0001) {
    // Segment A is a point
    s = 0;
    t = Math.max(0, Math.min(1, f / e));
  } else {
    const c = d1.dot(r);
    if (e < 0.0001) {
      // Segment B is a point
      t = 0;
      s = Math.max(0, Math.min(1, -c / a_len));
    } else {
      const b_val = d1.dot(d2);
      const denom = a_len * e - b_val * b_val;
      
      if (Math.abs(denom) > 0.0001) {
        s = Math.max(0, Math.min(1, (b_val * f - c * e) / denom));
      } else {
        s = 0;
      }
      
      t = (b_val * s + f) / e;
      
      if (t < 0) {
        t = 0;
        s = Math.max(0, Math.min(1, -c / a_len));
      } else if (t > 1) {
        t = 1;
        s = Math.max(0, Math.min(1, (b_val - c) / a_len));
      }
    }
  }
  
  const closestA = a1.add(d1.scale(s));
  const closestB = b1.add(d2.scale(t));
  
  const diff = closestA.subtract(closestB);
  const distance = diff.magnitude();
  const combinedRadius = a.radius + b.radius;
  
  if (distance >= combinedRadius) {
    return NO_COLLISION;
  }
  
  const penetration = combinedRadius - distance;
  const normal = distance > 0.0001 ? diff.normalize() : Vector3.UP;
  
  return {
    collided: true,
    penetrationDepth: penetration,
    normal,
    colliderId: 'capsule'
  };
}
