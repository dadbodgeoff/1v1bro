import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { SpatialHashGrid } from './SpatialHashGrid';
import { AABB } from './AABB';
import { Vector3 } from '../math/Vector3';

// Arbitrary for generating AABBs
const arbAABB = fc.tuple(
  fc.string({ minLength: 1, maxLength: 10 }),
  fc.float({ min: -50, max: 50, noNaN: true }),
  fc.float({ min: -50, max: 50, noNaN: true }),
  fc.float({ min: -50, max: 50, noNaN: true }),
  fc.float({ min: 0.5, max: 10, noNaN: true }),
  fc.float({ min: 0.5, max: 10, noNaN: true }),
  fc.float({ min: 0.5, max: 10, noNaN: true })
).map(([id, cx, cy, cz, sx, sy, sz]) => 
  AABB.fromCenterSize(id, new Vector3(cx, cy, cz), new Vector3(sx, sy, sz))
);

// Generate unique AABBs (unique IDs)
const arbUniqueAABBs = fc.array(
  fc.tuple(
    fc.float({ min: -50, max: 50, noNaN: true }),
    fc.float({ min: -50, max: 50, noNaN: true }),
    fc.float({ min: -50, max: 50, noNaN: true }),
    fc.float({ min: 0.5, max: 10, noNaN: true }),
    fc.float({ min: 0.5, max: 10, noNaN: true }),
    fc.float({ min: 0.5, max: 10, noNaN: true })
  ),
  { minLength: 1, maxLength: 20 }
).map(arr => arr.map((tuple, i) => 
  AABB.fromCenterSize(`aabb_${i}`, new Vector3(tuple[0], tuple[1], tuple[2]), new Vector3(tuple[3], tuple[4], tuple[5]))
));

describe('SpatialHashGrid', () => {
  describe('insert and query', () => {
    it('inserted AABB can be queried', () => {
      const grid = new SpatialHashGrid(4);
      const aabb = AABB.fromCenterSize('test', new Vector3(0, 0, 0), new Vector3(2, 2, 2));
      
      grid.insert(aabb);
      
      const results = grid.query(aabb);
      expect(results).toContain(aabb);
    });

    it('query returns empty for non-intersecting bounds', () => {
      const grid = new SpatialHashGrid(4);
      const aabb = AABB.fromCenterSize('test', new Vector3(0, 0, 0), new Vector3(2, 2, 2));
      const queryBounds = AABB.fromCenterSize('query', new Vector3(100, 100, 100), new Vector3(2, 2, 2));
      
      grid.insert(aabb);
      
      const results = grid.query(queryBounds);
      expect(results).toHaveLength(0);
    });

    it('query returns multiple intersecting AABBs', () => {
      const grid = new SpatialHashGrid(4);
      const aabb1 = AABB.fromCenterSize('a', new Vector3(0, 0, 0), new Vector3(2, 2, 2));
      const aabb2 = AABB.fromCenterSize('b', new Vector3(1, 0, 0), new Vector3(2, 2, 2));
      const aabb3 = AABB.fromCenterSize('c', new Vector3(100, 0, 0), new Vector3(2, 2, 2));
      
      grid.insert(aabb1);
      grid.insert(aabb2);
      grid.insert(aabb3);
      
      const queryBounds = AABB.fromCenterSize('query', new Vector3(0.5, 0, 0), new Vector3(4, 4, 4));
      const results = grid.query(queryBounds);
      
      expect(results).toContain(aabb1);
      expect(results).toContain(aabb2);
      expect(results).not.toContain(aabb3);
    });
  });

  describe('queryPoint', () => {
    it('returns AABBs containing the point', () => {
      const grid = new SpatialHashGrid(4);
      const aabb = AABB.fromCenterSize('test', new Vector3(0, 0, 0), new Vector3(4, 4, 4));
      
      grid.insert(aabb);
      
      const results = grid.queryPoint(new Vector3(0, 0, 0));
      expect(results).toContain(aabb);
    });

    it('returns empty for point outside all AABBs', () => {
      const grid = new SpatialHashGrid(4);
      const aabb = AABB.fromCenterSize('test', new Vector3(0, 0, 0), new Vector3(2, 2, 2));
      
      grid.insert(aabb);
      
      const results = grid.queryPoint(new Vector3(100, 100, 100));
      expect(results).toHaveLength(0);
    });
  });

  describe('remove', () => {
    it('removed AABB is not returned by query', () => {
      const grid = new SpatialHashGrid(4);
      const aabb = AABB.fromCenterSize('test', new Vector3(0, 0, 0), new Vector3(2, 2, 2));
      
      grid.insert(aabb);
      grid.remove('test');
      
      const results = grid.query(aabb);
      expect(results).not.toContain(aabb);
    });

    it('remove non-existent ID does not throw', () => {
      const grid = new SpatialHashGrid(4);
      expect(() => grid.remove('nonexistent')).not.toThrow();
    });

    it('size decreases after remove', () => {
      const grid = new SpatialHashGrid(4);
      const aabb = AABB.fromCenterSize('test', new Vector3(0, 0, 0), new Vector3(2, 2, 2));
      
      grid.insert(aabb);
      expect(grid.size()).toBe(1);
      
      grid.remove('test');
      expect(grid.size()).toBe(0);
    });
  });

  describe('clear', () => {
    it('clear removes all AABBs', () => {
      const grid = new SpatialHashGrid(4);
      
      grid.insert(AABB.fromCenterSize('a', new Vector3(0, 0, 0), new Vector3(2, 2, 2)));
      grid.insert(AABB.fromCenterSize('b', new Vector3(5, 0, 0), new Vector3(2, 2, 2)));
      grid.insert(AABB.fromCenterSize('c', new Vector3(10, 0, 0), new Vector3(2, 2, 2)));
      
      expect(grid.size()).toBe(3);
      
      grid.clear();
      
      expect(grid.size()).toBe(0);
    });
  });

  describe('utility methods', () => {
    it('has returns true for inserted AABB', () => {
      const grid = new SpatialHashGrid(4);
      const aabb = AABB.fromCenterSize('test', new Vector3(0, 0, 0), new Vector3(2, 2, 2));
      
      grid.insert(aabb);
      
      expect(grid.has('test')).toBe(true);
      expect(grid.has('nonexistent')).toBe(false);
    });

    it('get returns inserted AABB', () => {
      const grid = new SpatialHashGrid(4);
      const aabb = AABB.fromCenterSize('test', new Vector3(0, 0, 0), new Vector3(2, 2, 2));
      
      grid.insert(aabb);
      
      expect(grid.get('test')).toBe(aabb);
      expect(grid.get('nonexistent')).toBeUndefined();
    });

    it('getAll returns all inserted AABBs', () => {
      const grid = new SpatialHashGrid(4);
      const aabb1 = AABB.fromCenterSize('a', new Vector3(0, 0, 0), new Vector3(2, 2, 2));
      const aabb2 = AABB.fromCenterSize('b', new Vector3(5, 0, 0), new Vector3(2, 2, 2));
      
      grid.insert(aabb1);
      grid.insert(aabb2);
      
      const all = grid.getAll();
      expect(all).toContain(aabb1);
      expect(all).toContain(aabb2);
      expect(all).toHaveLength(2);
    });
  });

  describe('update behavior', () => {
    it('inserting same ID updates the AABB', () => {
      const grid = new SpatialHashGrid(4);
      const aabb1 = AABB.fromCenterSize('test', new Vector3(0, 0, 0), new Vector3(2, 2, 2));
      const aabb2 = AABB.fromCenterSize('test', new Vector3(50, 50, 50), new Vector3(2, 2, 2));
      
      grid.insert(aabb1);
      grid.insert(aabb2);
      
      expect(grid.size()).toBe(1);
      expect(grid.get('test')).toBe(aabb2);
      
      // Old position should not return the AABB
      const oldResults = grid.query(aabb1);
      expect(oldResults).not.toContain(aabb1);
      
      // New position should return the AABB
      const newResults = grid.query(aabb2);
      expect(newResults).toContain(aabb2);
    });
  });

  /**
   * Property Tests for SpatialHashGrid
   * **Feature: arena-3d-physics-multiplayer, Property 7: Spatial Hash Correctness - inserted AABBs are returned by intersecting queries**
   * **Validates: Requirements 3.1, 3.2**
   */
  describe('property tests', () => {
    it('Spatial Hash Correctness - inserted AABBs are returned by intersecting queries', () => {
      fc.assert(
        fc.property(arbUniqueAABBs, (aabbs) => {
          const grid = new SpatialHashGrid(4);
          
          // Insert all AABBs
          for (const aabb of aabbs) {
            grid.insert(aabb);
          }
          
          // Each AABB should be found when querying its own bounds
          for (const aabb of aabbs) {
            const results = grid.query(aabb);
            const found = results.some(r => r.id === aabb.id);
            expect(found).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: arena-3d-physics-multiplayer, Property: query returns empty for non-intersecting bounds**
     * **Validates: Requirements 3.1, 3.2**
     */
    it('query returns only intersecting AABBs', () => {
      fc.assert(
        fc.property(arbUniqueAABBs, arbAABB, (aabbs, queryBounds) => {
          const grid = new SpatialHashGrid(4);
          
          for (const aabb of aabbs) {
            grid.insert(aabb);
          }
          
          const results = grid.query(queryBounds);
          
          // All returned AABBs must actually intersect the query bounds
          for (const result of results) {
            expect(result.intersectsAABB(queryBounds)).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('size equals number of unique inserted AABBs', () => {
      fc.assert(
        fc.property(arbUniqueAABBs, (aabbs) => {
          const grid = new SpatialHashGrid(4);
          
          for (const aabb of aabbs) {
            grid.insert(aabb);
          }
          
          expect(grid.size()).toBe(aabbs.length);
        }),
        { numRuns: 100 }
      );
    });

    it('remove then query does not return removed AABB', () => {
      fc.assert(
        fc.property(arbUniqueAABBs, (aabbs) => {
          if (aabbs.length === 0) return;
          
          const grid = new SpatialHashGrid(4);
          
          for (const aabb of aabbs) {
            grid.insert(aabb);
          }
          
          // Remove first AABB
          const removed = aabbs[0];
          grid.remove(removed.id);
          
          // Query should not return removed AABB
          const results = grid.query(removed);
          const found = results.some(r => r.id === removed.id);
          expect(found).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('clear then size is zero', () => {
      fc.assert(
        fc.property(arbUniqueAABBs, (aabbs) => {
          const grid = new SpatialHashGrid(4);
          
          for (const aabb of aabbs) {
            grid.insert(aabb);
          }
          
          grid.clear();
          
          expect(grid.size()).toBe(0);
        }),
        { numRuns: 100 }
      );
    });
  });
});
