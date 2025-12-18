import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { Capsule, capsuleVsAABB, capsuleVsCapsule } from './Capsule';
import { AABB, NO_COLLISION } from './AABB';
import { Vector3 } from '../math/Vector3';

// Arbitrary for generating capsules
const arbCapsule = fc.tuple(
  fc.float({ min: Math.fround(-50), max: Math.fround(50), noNaN: true }),
  fc.float({ min: Math.fround(-50), max: Math.fround(50), noNaN: true }),
  fc.float({ min: Math.fround(-50), max: Math.fround(50), noNaN: true }),
  fc.float({ min: Math.fround(0.2), max: Math.fround(2), noNaN: true }),
  fc.float({ min: Math.fround(0.5), max: Math.fround(5), noNaN: true })
).map(([x, y, z, r, h]) => new Capsule(new Vector3(x, y, z), r, Math.max(h, r * 2.1)));

// Arbitrary for generating AABBs
const arbAABB = fc.tuple(
  fc.string({ minLength: 1, maxLength: 5 }),
  fc.float({ min: Math.fround(-50), max: Math.fround(50), noNaN: true }),
  fc.float({ min: Math.fround(-50), max: Math.fround(50), noNaN: true }),
  fc.float({ min: Math.fround(-50), max: Math.fround(50), noNaN: true }),
  fc.float({ min: Math.fround(0.5), max: Math.fround(10), noNaN: true }),
  fc.float({ min: Math.fround(0.5), max: Math.fround(10), noNaN: true }),
  fc.float({ min: Math.fround(0.5), max: Math.fround(10), noNaN: true })
).map(([id, cx, cy, cz, sx, sy, sz]) => 
  AABB.fromCenterSize(id, new Vector3(cx, cy, cz), new Vector3(sx, sy, sz))
);

describe('Capsule', () => {
  describe('constructor and properties', () => {
    it('default values match player capsule spec', () => {
      const capsule = new Capsule(Vector3.ZERO);
      expect(capsule.radius).toBe(0.4);
      expect(capsule.height).toBe(1.8);
    });

    it('top is at correct height', () => {
      const capsule = new Capsule(new Vector3(0, 0, 0), 0.4, 1.8);
      expect(capsule.top.y).toBeCloseTo(1.4, 5); // height - radius = 1.8 - 0.4
    });

    it('bottom is at correct height', () => {
      const capsule = new Capsule(new Vector3(0, 0, 0), 0.4, 1.8);
      expect(capsule.bottom.y).toBeCloseTo(0.4, 5); // radius
    });

    it('center is at midpoint', () => {
      const capsule = new Capsule(new Vector3(0, 0, 0), 0.4, 1.8);
      expect(capsule.center.y).toBeCloseTo(0.9, 5); // height / 2
    });

    it('eyePosition is at 1.6m', () => {
      const capsule = new Capsule(new Vector3(0, 0, 0));
      expect(capsule.eyePosition.y).toBeCloseTo(1.6, 5);
    });
  });

  describe('toBoundingAABB', () => {
    it('creates correct bounding box', () => {
      const capsule = new Capsule(new Vector3(0, 0, 0), 0.4, 1.8);
      const aabb = capsule.toBoundingAABB();
      
      expect(aabb.min.x).toBeCloseTo(-0.4, 5);
      expect(aabb.min.y).toBeCloseTo(0, 5);
      expect(aabb.min.z).toBeCloseTo(-0.4, 5);
      expect(aabb.max.x).toBeCloseTo(0.4, 5);
      expect(aabb.max.y).toBeCloseTo(1.8, 5);
      expect(aabb.max.z).toBeCloseTo(0.4, 5);
    });
  });

  describe('withPosition', () => {
    it('creates new capsule at new position', () => {
      const original = new Capsule(new Vector3(0, 0, 0), 0.5, 2);
      const moved = original.withPosition(new Vector3(10, 5, 3));
      
      expect(moved.position.equals(new Vector3(10, 5, 3))).toBe(true);
      expect(moved.radius).toBe(0.5);
      expect(moved.height).toBe(2);
      expect(original.position.equals(Vector3.ZERO)).toBe(true); // Original unchanged
    });
  });

  describe('capsuleVsAABB', () => {
    it('returns NO_COLLISION for separated shapes', () => {
      const capsule = new Capsule(new Vector3(0, 0, 0), 0.4, 1.8);
      const aabb = AABB.fromCenterSize('wall', new Vector3(10, 0, 0), new Vector3(2, 2, 2));
      
      expect(capsuleVsAABB(capsule, aabb)).toBe(NO_COLLISION);
    });

    it('detects collision with floor', () => {
      const capsule = new Capsule(new Vector3(0, -0.1, 0), 0.4, 1.8);
      const floor = AABB.fromCenterSize('floor', new Vector3(0, -0.5, 0), new Vector3(10, 1, 10));
      
      const result = capsuleVsAABB(capsule, floor);
      expect(result.collided).toBe(true);
      expect(result.penetrationDepth).toBeGreaterThan(0);
    });

    it('detects collision with wall', () => {
      const capsule = new Capsule(new Vector3(0.9, 0, 0), 0.4, 1.8);
      const wall = AABB.fromCenterSize('wall', new Vector3(2, 1, 0), new Vector3(2, 4, 10));
      
      const result = capsuleVsAABB(capsule, wall);
      expect(result.collided).toBe(true);
    });

    it('capsule at AABB center always collides', () => {
      const aabb = AABB.fromCenterSize('box', new Vector3(0, 1, 0), new Vector3(4, 4, 4));
      const capsule = new Capsule(aabb.center().subtract(new Vector3(0, 0.9, 0)), 0.4, 1.8);
      
      const result = capsuleVsAABB(capsule, aabb);
      expect(result.collided).toBe(true);
    });
  });

  describe('capsuleVsCapsule', () => {
    it('returns NO_COLLISION for separated capsules', () => {
      const a = new Capsule(new Vector3(0, 0, 0), 0.4, 1.8);
      const b = new Capsule(new Vector3(10, 0, 0), 0.4, 1.8);
      
      expect(capsuleVsCapsule(a, b)).toBe(NO_COLLISION);
    });

    it('detects collision for overlapping capsules', () => {
      const a = new Capsule(new Vector3(0, 0, 0), 0.4, 1.8);
      const b = new Capsule(new Vector3(0.5, 0, 0), 0.4, 1.8);
      
      const result = capsuleVsCapsule(a, b);
      expect(result.collided).toBe(true);
      expect(result.penetrationDepth).toBeGreaterThan(0);
    });

    it('capsule collides with itself', () => {
      const capsule = new Capsule(new Vector3(0, 0, 0), 0.4, 1.8);
      const result = capsuleVsCapsule(capsule, capsule);
      expect(result.collided).toBe(true);
    });
  });

  /**
   * Property Tests for Capsule
   * **Feature: arena-3d-physics-multiplayer, Property 6: Collision Resolution Completeness - resolved capsule has no intersections**
   * **Validates: Requirements 3.4**
   */
  describe('property tests', () => {
    it('collision normal has magnitude 1.0 when collision occurs', () => {
      fc.assert(
        fc.property(arbCapsule, arbAABB, (capsule, aabb) => {
          const result = capsuleVsAABB(capsule, aabb);
          if (result.collided) {
            expect(result.normal.magnitude()).toBeCloseTo(1, 4);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: arena-3d-physics-multiplayer, Property: Capsule at AABB center always collides**
     * **Validates: Requirements 3.4**
     */
    it('capsule placed inside AABB always collides', () => {
      fc.assert(
        fc.property(arbAABB, (aabb) => {
          // Place capsule center at AABB center
          const center = aabb.center();
          const capsule = new Capsule(
            new Vector3(center.x, center.y - 0.9, center.z),
            0.4,
            1.8
          );
          
          // Only test if AABB is large enough to contain capsule
          const size = aabb.size();
          if (size.x > 1 && size.y > 2 && size.z > 1) {
            const result = capsuleVsAABB(capsule, aabb);
            expect(result.collided).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('bounding AABB contains capsule endpoints', () => {
      fc.assert(
        fc.property(arbCapsule, (capsule) => {
          const bounds = capsule.toBoundingAABB();
          expect(bounds.containsPoint(capsule.top)).toBe(true);
          expect(bounds.containsPoint(capsule.bottom)).toBe(true);
          expect(bounds.containsPoint(capsule.center)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('withPosition preserves radius and height', () => {
      fc.assert(
        fc.property(
          arbCapsule,
          fc.float({ min: -100, max: 100, noNaN: true }),
          fc.float({ min: -100, max: 100, noNaN: true }),
          fc.float({ min: -100, max: 100, noNaN: true }),
          (capsule, x, y, z) => {
            const moved = capsule.withPosition(new Vector3(x, y, z));
            expect(moved.radius).toBe(capsule.radius);
            expect(moved.height).toBe(capsule.height);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('capsuleVsCapsule is symmetric', () => {
      fc.assert(
        fc.property(arbCapsule, arbCapsule, (a, b) => {
          const resultAB = capsuleVsCapsule(a, b);
          const resultBA = capsuleVsCapsule(b, a);
          expect(resultAB.collided).toBe(resultBA.collided);
          if (resultAB.collided && resultBA.collided) {
            expect(resultAB.penetrationDepth).toBeCloseTo(resultBA.penetrationDepth, 3);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
