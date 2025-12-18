/**
 * CollisionWorld - Complete collision detection and resolution system
 * 
 * Manages static collision geometry and provides collision queries.
 * Uses spatial hash grid for broad-phase and capsule/AABB for narrow-phase.
 */

import type { CollisionResult } from './AABB';
import { AABB } from './AABB';
import { Capsule, capsuleVsAABB } from './Capsule';
import { SpatialHashGrid } from './SpatialHashGrid';
import { Vector3 } from '../math/Vector3';
import type { Result } from '../core/Result';
import { Ok, Err } from '../core/Result';

export interface CollisionManifest {
  readonly colliders: AABBDefinition[];
}

export interface AABBDefinition {
  readonly id: string;
  readonly center: [number, number, number];
  readonly size: [number, number, number];
}

export interface RaycastResult {
  readonly hit: boolean;
  readonly point: Vector3;
  readonly normal: Vector3;
  readonly distance: number;
  readonly colliderId: string;
}

export interface ICollisionWorld {
  loadManifest(manifest: CollisionManifest): Result<void, string>;
  testCapsule(capsule: Capsule): CollisionResult[];
  resolveCollisions(capsule: Capsule, velocity: Vector3): { position: Vector3; velocity: Vector3 };
  raycast(origin: Vector3, direction: Vector3, maxDistance: number): RaycastResult | null;
  clear(): void;
  getColliderCount(): number;
}

export class CollisionWorld implements ICollisionWorld {
  private grid: SpatialHashGrid;

  constructor(cellSize: number = 4) {
    this.grid = new SpatialHashGrid(cellSize);
  }

  /**
   * Load collision geometry from a manifest
   */
  loadManifest(manifest: CollisionManifest): Result<void, string> {
    if (!manifest || !manifest.colliders || !Array.isArray(manifest.colliders)) {
      return Err('Invalid manifest: colliders array required');
    }

    this.clear();

    for (const def of manifest.colliders) {
      if (!def.id || !def.center || !def.size) {
        return Err(`Invalid collider definition: ${JSON.stringify(def)}`);
      }

      if (def.center.length !== 3 || def.size.length !== 3) {
        return Err(`Invalid collider dimensions: ${def.id}`);
      }

      const aabb = AABB.fromCenterSize(
        def.id,
        Vector3.fromArray(def.center),
        Vector3.fromArray(def.size)
      );
      this.grid.insert(aabb);
    }

    return Ok(undefined);
  }

  /**
   * Test capsule against all colliders, return all collisions
   */
  testCapsule(capsule: Capsule): CollisionResult[] {
    const bounds = capsule.toBoundingAABB();
    const candidates = this.grid.query(bounds);
    const results: CollisionResult[] = [];

    for (const aabb of candidates) {
      const result = capsuleVsAABB(capsule, aabb);
      if (result.collided) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Resolve all collisions for a capsule, returning corrected position and velocity
   * Uses iterative resolution to handle corners (max 4 iterations)
   */
  resolveCollisions(
    capsule: Capsule,
    velocity: Vector3
  ): { position: Vector3; velocity: Vector3 } {
    const MAX_ITERATIONS = 4;
    let currentPos = capsule.position;
    let currentVel = velocity;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const testCapsule = capsule.withPosition(currentPos);
      const collisions = this.testCapsule(testCapsule);

      if (collisions.length === 0) break;

      // Find deepest penetration
      let deepest = collisions[0];
      for (const col of collisions) {
        if (col.penetrationDepth > deepest.penetrationDepth) {
          deepest = col;
        }
      }

      // Push out along normal (add small epsilon to prevent floating point issues)
      currentPos = currentPos.add(deepest.normal.scale(deepest.penetrationDepth + 0.001));

      // Project velocity onto slide plane (remove component along normal)
      const velDotNormal = currentVel.dot(deepest.normal);
      if (velDotNormal < 0) {
        currentVel = currentVel.subtract(deepest.normal.scale(velDotNormal));
      }
    }

    return { position: currentPos, velocity: currentVel };
  }

  /**
   * Cast a ray and return the closest hit
   */
  raycast(origin: Vector3, direction: Vector3, maxDistance: number): RaycastResult | null {
    const dir = direction.normalize();
    const endPoint = origin.add(dir.scale(maxDistance));

    // Create AABB encompassing ray for broad-phase
    const rayBounds = new AABB(
      'ray_bounds',
      new Vector3(
        Math.min(origin.x, endPoint.x) - 0.01,
        Math.min(origin.y, endPoint.y) - 0.01,
        Math.min(origin.z, endPoint.z) - 0.01
      ),
      new Vector3(
        Math.max(origin.x, endPoint.x) + 0.01,
        Math.max(origin.y, endPoint.y) + 0.01,
        Math.max(origin.z, endPoint.z) + 0.01
      )
    );

    const candidates = this.grid.query(rayBounds);
    let closest: RaycastResult | null = null;

    for (const aabb of candidates) {
      const result = rayVsAABB(origin, dir, aabb, maxDistance);
      if (result && (!closest || result.distance < closest.distance)) {
        closest = result;
      }
    }

    return closest;
  }

  /**
   * Remove all collision geometry
   */
  clear(): void {
    this.grid.clear();
  }

  /**
   * Get number of colliders in the world
   */
  getColliderCount(): number {
    return this.grid.size();
  }

  /**
   * Add a single collider
   */
  addCollider(aabb: AABB): void {
    this.grid.insert(aabb);
  }

  /**
   * Remove a collider by ID
   */
  removeCollider(id: string): void {
    this.grid.remove(id);
  }

  /**
   * Check if a collider exists
   */
  hasCollider(id: string): boolean {
    return this.grid.has(id);
  }
}

/**
 * Ray vs AABB intersection test using slab method
 */
function rayVsAABB(
  origin: Vector3,
  dir: Vector3,
  aabb: AABB,
  maxDist: number
): RaycastResult | null {
  let tmin = 0;
  let tmax = maxDist;
  let normal = Vector3.ZERO;

  const axes: ('x' | 'y' | 'z')[] = ['x', 'y', 'z'];
  const normals = [
    new Vector3(-1, 0, 0),
    new Vector3(0, -1, 0),
    new Vector3(0, 0, -1)
  ];

  for (let i = 0; i < 3; i++) {
    const axis = axes[i];
    
    if (Math.abs(dir[axis]) < 0.0001) {
      // Ray is parallel to slab
      if (origin[axis] < aabb.min[axis] || origin[axis] > aabb.max[axis]) {
        return null;
      }
    } else {
      let t1 = (aabb.min[axis] - origin[axis]) / dir[axis];
      let t2 = (aabb.max[axis] - origin[axis]) / dir[axis];
      let n = normals[i];

      if (t1 > t2) {
        [t1, t2] = [t2, t1];
        n = n.scale(-1);
      }

      if (t1 > tmin) {
        tmin = t1;
        normal = n;
      }
      tmax = Math.min(tmax, t2);

      if (tmin > tmax) return null;
    }
  }

  if (tmin < 0) return null;

  return {
    hit: true,
    point: origin.add(dir.scale(tmin)),
    normal,
    distance: tmin,
    colliderId: aabb.id
  };
}
