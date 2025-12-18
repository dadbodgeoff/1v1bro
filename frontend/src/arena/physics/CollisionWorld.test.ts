import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { CollisionWorld, CollisionManifest, AABBDefinition } from './CollisionWorld';
import { AABB } from './AABB';
import { Capsule } from './Capsule';
import { Vector3 } from '../math/Vector3';
import { isOk, isErr } from '../core/Result';

// Helper to create a simple manifest
function createManifest(colliders: AABBDefinition[]): CollisionManifest {
  return { colliders };
}

// Arbitrary for generating valid collider definitions
const arbColliderDef = fc.tuple(
  fc.string({ minLength: 1, maxLength: 10 }),
  fc.float({ min: -50, max: 50, noNaN: true }),
  fc.float({ min: -50, max: 50, noNaN: true }),
  fc.float({ min: -50, max: 50, noNaN: true }),
  fc.float({ min: 0.5, max: 10, noNaN: true }),
  fc.float({ min: 0.5, max: 10, noNaN: true }),
  fc.float({ min: 0.5, max: 10, noNaN: true })
).map(([id, cx, cy, cz, sx, sy, sz]): AABBDefinition => ({
  id,
  center: [cx, cy, cz],
  size: [sx, sy, sz]
}));

// Generate unique collider definitions
const arbUniqueColliderDefs = fc.array(
  fc.tuple(
    fc.float({ min: -50, max: 50, noNaN: true }),
    fc.float({ min: -50, max: 50, noNaN: true }),
    fc.float({ min: -50, max: 50, noNaN: true }),
    fc.float({ min: 0.5, max: 10, noNaN: true }),
    fc.float({ min: 0.5, max: 10, noNaN: true }),
    fc.float({ min: 0.5, max: 10, noNaN: true })
  ),
  { minLength: 1, maxLength: 10 }
).map(arr => arr.map((tuple, i): AABBDefinition => ({
  id: `collider_${i}`,
  center: [tuple[0], tuple[1], tuple[2]],
  size: [tuple[3], tuple[4], tuple[5]]
})));

describe('CollisionWorld', () => {
  describe('loadManifest', () => {
    it('loads valid manifest successfully', () => {
      const world = new CollisionWorld();
      const manifest = createManifest([
        { id: 'floor', center: [0, -0.5, 0], size: [20, 1, 20] },
        { id: 'wall', center: [10, 2, 0], size: [1, 4, 20] }
      ]);

      const result = world.loadManifest(manifest);
      expect(isOk(result)).toBe(true);
      expect(world.getColliderCount()).toBe(2);
    });

    it('returns error for null manifest', () => {
      const world = new CollisionWorld();
      const result = world.loadManifest(null as unknown as CollisionManifest);
      expect(isErr(result)).toBe(true);
    });

    it('returns error for missing colliders array', () => {
      const world = new CollisionWorld();
      const result = world.loadManifest({} as CollisionManifest);
      expect(isErr(result)).toBe(true);
    });

    it('returns error for invalid collider definition', () => {
      const world = new CollisionWorld();
      const manifest = createManifest([
        { id: '', center: [0, 0, 0], size: [1, 1, 1] } // Empty ID
      ]);
      const result = world.loadManifest(manifest);
      expect(isErr(result)).toBe(true);
    });

    it('clears existing colliders on load', () => {
      const world = new CollisionWorld();
      
      world.loadManifest(createManifest([
        { id: 'a', center: [0, 0, 0], size: [1, 1, 1] },
        { id: 'b', center: [5, 0, 0], size: [1, 1, 1] }
      ]));
      expect(world.getColliderCount()).toBe(2);

      world.loadManifest(createManifest([
        { id: 'c', center: [10, 0, 0], size: [1, 1, 1] }
      ]));
      expect(world.getColliderCount()).toBe(1);
    });
  });

  describe('testCapsule', () => {
    it('returns empty array when no collisions', () => {
      const world = new CollisionWorld();
      world.loadManifest(createManifest([
        { id: 'floor', center: [0, -0.5, 0], size: [20, 1, 20] }
      ]));

      const capsule = new Capsule(new Vector3(0, 10, 0)); // High above floor
      const results = world.testCapsule(capsule);
      expect(results).toHaveLength(0);
    });

    it('detects collision with floor', () => {
      const world = new CollisionWorld();
      world.loadManifest(createManifest([
        { id: 'floor', center: [0, -0.5, 0], size: [20, 1, 20] }
      ]));

      const capsule = new Capsule(new Vector3(0, -0.1, 0)); // Slightly below ground
      const results = world.testCapsule(capsule);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].colliderId).toBe('floor');
    });

    it('detects multiple collisions', () => {
      const world = new CollisionWorld();
      world.loadManifest(createManifest([
        { id: 'floor', center: [0, -0.5, 0], size: [20, 1, 20] },
        { id: 'wall', center: [0.5, 1, 0], size: [1, 4, 20] }
      ]));

      const capsule = new Capsule(new Vector3(0, -0.1, 0));
      const results = world.testCapsule(capsule);
      expect(results.length).toBe(2);
    });
  });

  describe('resolveCollisions', () => {
    it('pushes capsule out of floor', () => {
      const world = new CollisionWorld();
      world.loadManifest(createManifest([
        { id: 'floor', center: [0, -0.5, 0], size: [20, 1, 20] }
      ]));

      const capsule = new Capsule(new Vector3(0, -0.2, 0));
      const velocity = new Vector3(0, -1, 0);
      
      const { position, velocity: newVel } = world.resolveCollisions(capsule, velocity);
      
      // Position should be pushed up
      expect(position.y).toBeGreaterThan(-0.2);
      // Downward velocity should be removed
      expect(newVel.y).toBeGreaterThanOrEqual(0);
    });

    it('allows sliding along walls', () => {
      const world = new CollisionWorld();
      world.loadManifest(createManifest([
        { id: 'wall', center: [1, 1, 0], size: [0.5, 4, 20] }
      ]));

      const capsule = new Capsule(new Vector3(0.5, 0, 0));
      const velocity = new Vector3(1, 0, 1); // Moving into wall and forward
      
      const { velocity: newVel } = world.resolveCollisions(capsule, velocity);
      
      // Should still have forward velocity
      expect(Math.abs(newVel.z)).toBeGreaterThan(0);
    });

    it('handles corner collisions with multiple iterations', () => {
      const world = new CollisionWorld();
      world.loadManifest(createManifest([
        { id: 'floor', center: [0, -0.5, 0], size: [20, 1, 20] },
        { id: 'wall', center: [0.5, 1, 0], size: [0.5, 4, 20] }
      ]));

      const capsule = new Capsule(new Vector3(0.3, -0.1, 0));
      const velocity = new Vector3(1, -1, 0);
      
      const { position } = world.resolveCollisions(capsule, velocity);
      
      // Should be pushed out of both floor and wall
      const testCapsule = capsule.withPosition(position);
      const remainingCollisions = world.testCapsule(testCapsule);
      expect(remainingCollisions.length).toBe(0);
    });
  });

  describe('raycast', () => {
    it('returns null when ray misses all geometry', () => {
      const world = new CollisionWorld();
      world.loadManifest(createManifest([
        { id: 'box', center: [10, 0, 0], size: [2, 2, 2] }
      ]));

      const result = world.raycast(
        new Vector3(0, 0, 0),
        new Vector3(0, 1, 0), // Shooting up
        100
      );
      expect(result).toBeNull();
    });

    it('returns hit when ray intersects geometry', () => {
      const world = new CollisionWorld();
      world.loadManifest(createManifest([
        { id: 'wall', center: [5, 0, 0], size: [1, 4, 4] }
      ]));

      const result = world.raycast(
        new Vector3(0, 0, 0),
        new Vector3(1, 0, 0), // Shooting right
        100
      );
      
      expect(result).not.toBeNull();
      expect(result!.hit).toBe(true);
      expect(result!.colliderId).toBe('wall');
      expect(result!.distance).toBeCloseTo(4.5, 1); // Wall starts at x=4.5
    });

    it('returns closest hit when multiple intersections', () => {
      const world = new CollisionWorld();
      world.loadManifest(createManifest([
        { id: 'near', center: [3, 0, 0], size: [1, 4, 4] },
        { id: 'far', center: [10, 0, 0], size: [1, 4, 4] }
      ]));

      const result = world.raycast(
        new Vector3(0, 0, 0),
        new Vector3(1, 0, 0),
        100
      );
      
      expect(result).not.toBeNull();
      expect(result!.colliderId).toBe('near');
    });

    it('respects max distance', () => {
      const world = new CollisionWorld();
      world.loadManifest(createManifest([
        { id: 'wall', center: [10, 0, 0], size: [1, 4, 4] }
      ]));

      const result = world.raycast(
        new Vector3(0, 0, 0),
        new Vector3(1, 0, 0),
        5 // Max distance less than wall distance
      );
      
      expect(result).toBeNull();
    });
  });

  describe('collider management', () => {
    it('addCollider adds a single collider', () => {
      const world = new CollisionWorld();
      const aabb = AABB.fromCenterSize('test', new Vector3(0, 0, 0), new Vector3(2, 2, 2));
      
      world.addCollider(aabb);
      
      expect(world.getColliderCount()).toBe(1);
      expect(world.hasCollider('test')).toBe(true);
    });

    it('removeCollider removes a collider', () => {
      const world = new CollisionWorld();
      const aabb = AABB.fromCenterSize('test', new Vector3(0, 0, 0), new Vector3(2, 2, 2));
      
      world.addCollider(aabb);
      world.removeCollider('test');
      
      expect(world.getColliderCount()).toBe(0);
      expect(world.hasCollider('test')).toBe(false);
    });
  });

  /**
   * Property Tests for CollisionWorld
   * **Feature: arena-3d-physics-multiplayer, Property 9: Map Manifest Loading - loaded colliders match manifest**
   * **Validates: Requirements 4.1**
   */
  describe('property tests', () => {
    it('Map Manifest Loading - loaded colliders match manifest count', () => {
      fc.assert(
        fc.property(arbUniqueColliderDefs, (colliderDefs) => {
          const world = new CollisionWorld();
          const manifest = createManifest(colliderDefs);
          
          const result = world.loadManifest(manifest);
          
          expect(isOk(result)).toBe(true);
          expect(world.getColliderCount()).toBe(colliderDefs.length);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: arena-3d-physics-multiplayer, Property: raycast returns null for rays that miss all geometry**
     * **Validates: Requirements 4.1**
     */
    it('raycast returns null for rays pointing away from geometry', () => {
      fc.assert(
        fc.property(arbUniqueColliderDefs, (colliderDefs) => {
          const world = new CollisionWorld();
          world.loadManifest(createManifest(colliderDefs));
          
          // Cast ray from far away, pointing further away
          const result = world.raycast(
            new Vector3(1000, 1000, 1000),
            new Vector3(1, 1, 1), // Pointing away
            100
          );
          
          expect(result).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('resolveCollisions produces non-colliding position for shallow penetrations', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(-10), max: Math.fround(10), noNaN: true }),
          fc.float({ min: Math.fround(-0.3), max: Math.fround(2), noNaN: true }), // Limit penetration depth
          fc.float({ min: Math.fround(-10), max: Math.fround(10), noNaN: true }),
          (x, y, z) => {
            const world = new CollisionWorld();
            world.loadManifest(createManifest([
              { id: 'floor', center: [0, -0.5, 0], size: [30, 1, 30] }
            ]));
            
            const capsule = new Capsule(new Vector3(x, y, z));
            const velocity = new Vector3(0, -1, 0);
            
            const { position } = world.resolveCollisions(capsule, velocity);
            const testCapsule = capsule.withPosition(position);
            const collisions = world.testCapsule(testCapsule);
            
            // After resolution, should have no collisions
            expect(collisions.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('clear removes all colliders', () => {
      fc.assert(
        fc.property(arbUniqueColliderDefs, (colliderDefs) => {
          const world = new CollisionWorld();
          world.loadManifest(createManifest(colliderDefs));
          
          world.clear();
          
          expect(world.getColliderCount()).toBe(0);
        }),
        { numRuns: 100 }
      );
    });
  });
});
