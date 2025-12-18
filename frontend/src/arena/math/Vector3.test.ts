import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { Vector3 } from './Vector3';

// Arbitrary for generating Vector3 instances
const arbVector3 = fc.tuple(
  fc.float({ min: -1000, max: 1000, noNaN: true }),
  fc.float({ min: -1000, max: 1000, noNaN: true }),
  fc.float({ min: -1000, max: 1000, noNaN: true })
).map(([x, y, z]) => new Vector3(x, y, z));

// Non-zero vector for normalization tests
const arbNonZeroVector3 = arbVector3.filter(v => v.magnitudeSquared() > 0.001);

describe('Vector3', () => {
  describe('constructors and constants', () => {
    it('default constructor creates zero vector', () => {
      const v = new Vector3();
      expect(v.x).toBe(0);
      expect(v.y).toBe(0);
      expect(v.z).toBe(0);
    });

    it('static ZERO is (0, 0, 0)', () => {
      expect(Vector3.ZERO.equals(new Vector3(0, 0, 0))).toBe(true);
    });

    it('static UP is (0, 1, 0)', () => {
      expect(Vector3.UP.equals(new Vector3(0, 1, 0))).toBe(true);
    });

    it('static DOWN is (0, -1, 0)', () => {
      expect(Vector3.DOWN.equals(new Vector3(0, -1, 0))).toBe(true);
    });

    it('static FORWARD is (0, 0, 1)', () => {
      expect(Vector3.FORWARD.equals(new Vector3(0, 0, 1))).toBe(true);
    });
  });

  describe('basic operations', () => {
    it('add combines components', () => {
      const a = new Vector3(1, 2, 3);
      const b = new Vector3(4, 5, 6);
      const result = a.add(b);
      expect(result.x).toBe(5);
      expect(result.y).toBe(7);
      expect(result.z).toBe(9);
    });

    it('subtract finds difference', () => {
      const a = new Vector3(5, 7, 9);
      const b = new Vector3(1, 2, 3);
      const result = a.subtract(b);
      expect(result.x).toBe(4);
      expect(result.y).toBe(5);
      expect(result.z).toBe(6);
    });

    it('scale multiplies by scalar', () => {
      const v = new Vector3(1, 2, 3);
      const result = v.scale(2);
      expect(result.x).toBe(2);
      expect(result.y).toBe(4);
      expect(result.z).toBe(6);
    });

    it('dot product is correct', () => {
      const a = new Vector3(1, 2, 3);
      const b = new Vector3(4, 5, 6);
      expect(a.dot(b)).toBe(32); // 1*4 + 2*5 + 3*6 = 32
    });

    it('cross product is correct', () => {
      const a = new Vector3(1, 0, 0);
      const b = new Vector3(0, 1, 0);
      const result = a.cross(b);
      expect(result.equals(new Vector3(0, 0, 1))).toBe(true);
    });
  });

  describe('magnitude and normalization', () => {
    it('magnitude of unit vectors is 1', () => {
      expect(Vector3.UP.magnitude()).toBeCloseTo(1, 5);
      expect(Vector3.FORWARD.magnitude()).toBeCloseTo(1, 5);
    });

    it('magnitude of (3, 4, 0) is 5', () => {
      const v = new Vector3(3, 4, 0);
      expect(v.magnitude()).toBeCloseTo(5, 5);
    });

    it('normalize of zero vector returns ZERO', () => {
      const result = Vector3.ZERO.normalize();
      expect(result.equals(Vector3.ZERO)).toBe(true);
    });

    it('normalize of non-zero vector has magnitude 1', () => {
      const v = new Vector3(3, 4, 5);
      const normalized = v.normalize();
      expect(normalized.magnitude()).toBeCloseTo(1, 5);
    });
  });

  describe('lerp', () => {
    it('lerp at t=0 returns start', () => {
      const a = new Vector3(0, 0, 0);
      const b = new Vector3(10, 10, 10);
      expect(a.lerp(b, 0).equals(a)).toBe(true);
    });

    it('lerp at t=1 returns end', () => {
      const a = new Vector3(0, 0, 0);
      const b = new Vector3(10, 10, 10);
      expect(a.lerp(b, 1).equals(b)).toBe(true);
    });

    it('lerp at t=0.5 returns midpoint', () => {
      const a = new Vector3(0, 0, 0);
      const b = new Vector3(10, 10, 10);
      const mid = a.lerp(b, 0.5);
      expect(mid.equals(new Vector3(5, 5, 5))).toBe(true);
    });

    it('lerp clamps t to [0, 1]', () => {
      const a = new Vector3(0, 0, 0);
      const b = new Vector3(10, 10, 10);
      expect(a.lerp(b, -1).equals(a)).toBe(true);
      expect(a.lerp(b, 2).equals(b)).toBe(true);
    });
  });

  describe('utility methods', () => {
    it('toArray and fromArray round-trip', () => {
      const v = new Vector3(1, 2, 3);
      const arr = v.toArray();
      const restored = Vector3.fromArray(arr);
      expect(restored.equals(v)).toBe(true);
    });

    it('clone creates equal but distinct instance', () => {
      const v = new Vector3(1, 2, 3);
      const cloned = v.clone();
      expect(cloned.equals(v)).toBe(true);
      expect(cloned).not.toBe(v);
    });

    it('horizontal removes y component', () => {
      const v = new Vector3(1, 5, 3);
      const h = v.horizontal();
      expect(h.x).toBe(1);
      expect(h.y).toBe(0);
      expect(h.z).toBe(3);
    });

    it('negate inverts all components', () => {
      const v = new Vector3(1, -2, 3);
      const neg = v.negate();
      expect(neg.x).toBe(-1);
      expect(neg.y).toBe(2);
      expect(neg.z).toBe(-3);
    });
  });

  /**
   * Property Tests for Vector3
   * **Feature: arena-3d-physics-multiplayer, Property 1: Physics Determinism - identical inputs produce identical outputs**
   * **Validates: Requirements 2.1**
   */
  describe('property tests', () => {
    it('Physics Determinism - identical inputs produce identical outputs', () => {
      fc.assert(
        fc.property(arbVector3, arbVector3, fc.float({ min: -100, max: 100, noNaN: true }), (a, b, scalar) => {
          // Same operations on same inputs should produce same results
          const result1 = a.add(b).scale(scalar);
          const result2 = a.add(b).scale(scalar);
          expect(result1.equals(result2)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: arena-3d-physics-multiplayer, Property: normalize().magnitude() === 1 for non-zero vectors**
     * **Validates: Requirements 2.1**
     */
    it('normalize().magnitude() === 1 for non-zero vectors', () => {
      fc.assert(
        fc.property(arbNonZeroVector3, (v) => {
          const normalized = v.normalize();
          expect(normalized.magnitude()).toBeCloseTo(1, 4);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: arena-3d-physics-multiplayer, Property: a.dot(b) === b.dot(a) (commutativity)**
     * **Validates: Requirements 2.1**
     */
    it('a.dot(b) === b.dot(a) (commutativity)', () => {
      fc.assert(
        fc.property(arbVector3, arbVector3, (a, b) => {
          expect(a.dot(b)).toBeCloseTo(b.dot(a), 5);
        }),
        { numRuns: 100 }
      );
    });

    it('add is commutative: a + b === b + a', () => {
      fc.assert(
        fc.property(arbVector3, arbVector3, (a, b) => {
          expect(a.add(b).equals(b.add(a), 0.0001)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('add is associative: (a + b) + c === a + (b + c)', () => {
      fc.assert(
        fc.property(arbVector3, arbVector3, arbVector3, (a, b, c) => {
          const left = a.add(b).add(c);
          const right = a.add(b.add(c));
          expect(left.equals(right, 0.001)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('ZERO is additive identity: a + ZERO === a', () => {
      fc.assert(
        fc.property(arbVector3, (a) => {
          expect(a.add(Vector3.ZERO).equals(a)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('scale by 1 is identity: a * 1 === a', () => {
      fc.assert(
        fc.property(arbVector3, (a) => {
          expect(a.scale(1).equals(a)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('scale by 0 gives ZERO: a * 0 === ZERO', () => {
      fc.assert(
        fc.property(arbVector3, (a) => {
          expect(a.scale(0).equals(Vector3.ZERO)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('toArray/fromArray round-trip preserves vector', () => {
      fc.assert(
        fc.property(arbVector3, (v) => {
          const restored = Vector3.fromArray(v.toArray());
          expect(restored.equals(v)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('distanceTo is symmetric: a.distanceTo(b) === b.distanceTo(a)', () => {
      fc.assert(
        fc.property(arbVector3, arbVector3, (a, b) => {
          expect(a.distanceTo(b)).toBeCloseTo(b.distanceTo(a), 5);
        }),
        { numRuns: 100 }
      );
    });

    it('cross product is anti-commutative: a × b === -(b × a)', () => {
      fc.assert(
        fc.property(arbVector3, arbVector3, (a, b) => {
          const ab = a.cross(b);
          const ba = b.cross(a).negate();
          expect(ab.equals(ba, 0.001)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });
});
