import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { AABB, aabbVsAABB, NO_COLLISION } from './AABB';
import { Vector3 } from '../math/Vector3';

// Arbitrary for generating valid AABBs
const arbAABB = fc.tuple(
  fc.string({ minLength: 1, maxLength: 10 }),
  fc.float({ min: Math.fround(-100), max: Math.fround(100), noNaN: true }),
  fc.float({ min: Math.fround(-100), max: Math.fround(100), noNaN: true }),
  fc.float({ min: Math.fround(-100), max: Math.fround(100), noNaN: true }),
  fc.float({ min: Math.fround(0.5), max: Math.fround(20), noNaN: true }),
  fc.float({ min: Math.fround(0.5), max: Math.fround(20), noNaN: true }),
  fc.float({ min: Math.fround(0.5), max: Math.fround(20), noNaN: true })
).map(([id, cx, cy, cz, sx, sy, sz]) => 
  AABB.fromCenterSize(id, new Vector3(cx, cy, cz), new Vector3(sx, sy, sz))
);

describe('AABB', () => {
  describe('constructors', () => {
    it('fromCenterSize creates correct bounds', () => {
      const aabb = AABB.fromCenterSize('test', new Vector3(0, 0, 0), new Vector3(2, 4, 6));
      expect(aabb.min.equals(new Vector3(-1, -2, -3))).toBe(true);
      expect(aabb.max.equals(new Vector3(1, 2, 3))).toBe(true);
    });

    it('fromMinMax creates correct bounds', () => {
      const aabb = AABB.fromMinMax('test', new Vector3(-1, -2, -3), new Vector3(1, 2, 3));
      expect(aabb.min.equals(new Vector3(-1, -2, -3))).toBe(true);
      expect(aabb.max.equals(new Vector3(1, 2, 3))).toBe(true);
    });
  });

  describe('center and size', () => {
    it('center returns midpoint', () => {
      const aabb = AABB.fromMinMax('test', new Vector3(0, 0, 0), new Vector3(10, 10, 10));
      expect(aabb.center().equals(new Vector3(5, 5, 5))).toBe(true);
    });

    it('size returns dimensions', () => {
      const aabb = AABB.fromMinMax('test', new Vector3(0, 0, 0), new Vector3(10, 20, 30));
      expect(aabb.size().equals(new Vector3(10, 20, 30))).toBe(true);
    });

    it('halfExtents returns half of size', () => {
      const aabb = AABB.fromMinMax('test', new Vector3(0, 0, 0), new Vector3(10, 20, 30));
      expect(aabb.halfExtents().equals(new Vector3(5, 10, 15))).toBe(true);
    });
  });

  describe('containsPoint', () => {
    it('center point is contained', () => {
      const aabb = AABB.fromCenterSize('test', new Vector3(0, 0, 0), new Vector3(2, 2, 2));
      expect(aabb.containsPoint(new Vector3(0, 0, 0))).toBe(true);
    });

    it('corner points are contained', () => {
      const aabb = AABB.fromMinMax('test', new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      expect(aabb.containsPoint(new Vector3(0, 0, 0))).toBe(true);
      expect(aabb.containsPoint(new Vector3(1, 1, 1))).toBe(true);
    });

    it('outside point is not contained', () => {
      const aabb = AABB.fromCenterSize('test', new Vector3(0, 0, 0), new Vector3(2, 2, 2));
      expect(aabb.containsPoint(new Vector3(5, 0, 0))).toBe(false);
    });
  });

  describe('intersectsAABB', () => {
    it('overlapping AABBs intersect', () => {
      const a = AABB.fromCenterSize('a', new Vector3(0, 0, 0), new Vector3(2, 2, 2));
      const b = AABB.fromCenterSize('b', new Vector3(1, 0, 0), new Vector3(2, 2, 2));
      expect(a.intersectsAABB(b)).toBe(true);
    });

    it('touching AABBs intersect', () => {
      const a = AABB.fromCenterSize('a', new Vector3(0, 0, 0), new Vector3(2, 2, 2));
      const b = AABB.fromCenterSize('b', new Vector3(2, 0, 0), new Vector3(2, 2, 2));
      expect(a.intersectsAABB(b)).toBe(true);
    });

    it('separated AABBs do not intersect', () => {
      const a = AABB.fromCenterSize('a', new Vector3(0, 0, 0), new Vector3(2, 2, 2));
      const b = AABB.fromCenterSize('b', new Vector3(10, 0, 0), new Vector3(2, 2, 2));
      expect(a.intersectsAABB(b)).toBe(false);
    });
  });

  describe('expand', () => {
    it('expand increases size in all directions', () => {
      const aabb = AABB.fromCenterSize('test', new Vector3(0, 0, 0), new Vector3(2, 2, 2));
      const expanded = aabb.expand(1);
      expect(expanded.min.equals(new Vector3(-2, -2, -2))).toBe(true);
      expect(expanded.max.equals(new Vector3(2, 2, 2))).toBe(true);
    });
  });

  describe('closestPoint', () => {
    it('point inside returns same point', () => {
      const aabb = AABB.fromCenterSize('test', new Vector3(0, 0, 0), new Vector3(10, 10, 10));
      const point = new Vector3(1, 2, 3);
      expect(aabb.closestPoint(point).equals(point)).toBe(true);
    });

    it('point outside returns clamped point', () => {
      const aabb = AABB.fromMinMax('test', new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      const point = new Vector3(5, 5, 5);
      expect(aabb.closestPoint(point).equals(new Vector3(1, 1, 1))).toBe(true);
    });
  });

  describe('aabbVsAABB collision', () => {
    it('returns NO_COLLISION for separated AABBs', () => {
      const a = AABB.fromCenterSize('a', new Vector3(0, 0, 0), new Vector3(2, 2, 2));
      const b = AABB.fromCenterSize('b', new Vector3(10, 0, 0), new Vector3(2, 2, 2));
      expect(aabbVsAABB(a, b)).toBe(NO_COLLISION);
    });

    it('returns collision info for overlapping AABBs', () => {
      const a = AABB.fromCenterSize('a', new Vector3(0, 0, 0), new Vector3(2, 2, 2));
      const b = AABB.fromCenterSize('b', new Vector3(1.5, 0, 0), new Vector3(2, 2, 2));
      const result = aabbVsAABB(a, b);
      expect(result.collided).toBe(true);
      expect(result.penetrationDepth).toBeGreaterThan(0);
      expect(result.colliderId).toBe('b');
    });
  });

  /**
   * Property Tests for AABB
   * **Feature: arena-3d-physics-multiplayer, Property 8: Collision Normal Validity - normals have magnitude 1.0**
   * **Validates: Requirements 3.3**
   */
  describe('property tests', () => {
    it('Collision Normal Validity - normals have magnitude 1.0', () => {
      fc.assert(
        fc.property(arbAABB, arbAABB, (a, b) => {
          const result = aabbVsAABB(a, b);
          if (result.collided) {
            expect(result.normal.magnitude()).toBeCloseTo(1, 4);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: arena-3d-physics-multiplayer, Property: AABB contains its own center point**
     * **Validates: Requirements 3.3**
     */
    it('AABB contains its own center point', () => {
      fc.assert(
        fc.property(arbAABB, (aabb) => {
          expect(aabb.containsPoint(aabb.center())).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: arena-3d-physics-multiplayer, Property: intersectsAABB is symmetric**
     * **Validates: Requirements 3.3**
     */
    it('intersectsAABB is symmetric', () => {
      fc.assert(
        fc.property(arbAABB, arbAABB, (a, b) => {
          expect(a.intersectsAABB(b)).toBe(b.intersectsAABB(a));
        }),
        { numRuns: 100 }
      );
    });

    it('fromCenterSize then center() returns original center', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 5 }),
          fc.float({ min: Math.fround(-100), max: Math.fround(100), noNaN: true }),
          fc.float({ min: Math.fround(-100), max: Math.fround(100), noNaN: true }),
          fc.float({ min: Math.fround(-100), max: Math.fround(100), noNaN: true }),
          fc.float({ min: Math.fround(0.5), max: Math.fround(20), noNaN: true }),
          fc.float({ min: Math.fround(0.5), max: Math.fround(20), noNaN: true }),
          fc.float({ min: Math.fround(0.5), max: Math.fround(20), noNaN: true }),
          (id, cx, cy, cz, sx, sy, sz) => {
            const center = new Vector3(cx, cy, cz);
            const size = new Vector3(sx, sy, sz);
            const aabb = AABB.fromCenterSize(id, center, size);
            expect(aabb.center().equals(center, 0.001)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('expand preserves center', () => {
      fc.assert(
        fc.property(arbAABB, fc.float({ min: 0, max: 10, noNaN: true }), (aabb, amount) => {
          const expanded = aabb.expand(amount);
          expect(expanded.center().equals(aabb.center(), 0.001)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('AABB always intersects itself', () => {
      fc.assert(
        fc.property(arbAABB, (aabb) => {
          expect(aabb.intersectsAABB(aabb)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });
});
