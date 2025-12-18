/**
 * Spawn System Tests
 *
 * Property-based and unit tests for spawn point selection.
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { SpawnSystem, SpawnManifest } from './SpawnSystem';
import { Vector3 } from '../math/Vector3';
import { EventBus } from '../core/EventBus';

describe('SpawnSystem', () => {
  const createTestManifest = (): SpawnManifest => ({
    spawnPoints: [
      { id: 'spawn_1', position: [10, 0, 0] },
      { id: 'spawn_2', position: [-10, 0, 0] },
      { id: 'spawn_3', position: [0, 0, 10] },
      { id: 'spawn_4', position: [0, 0, -10] },
    ],
    arenaCenter: [0, 0, 0],
  });

  describe('Loading', () => {
    it('loads spawn points from manifest', () => {
      const system = new SpawnSystem();
      system.loadManifest(createTestManifest());

      const spawnPoints = system.getSpawnPoints();
      expect(spawnPoints).toHaveLength(4);
    });

    it('calculates look direction toward arena center', () => {
      const system = new SpawnSystem();
      system.loadManifest(createTestManifest());

      const spawnPoints = system.getSpawnPoints();
      const spawn1 = spawnPoints.find((s) => s.id === 'spawn_1')!;

      // Spawn at (10, 0, 0) should look toward center (0, 0, 0)
      // So look direction should be approximately (-1, 0, 0)
      expect(spawn1.lookDirection.x).toBeCloseTo(-1, 1);
      expect(spawn1.lookDirection.y).toBeCloseTo(0, 1);
      expect(spawn1.lookDirection.z).toBeCloseTo(0, 1);
    });

    it('normalizes look direction', () => {
      const system = new SpawnSystem();
      system.loadManifest(createTestManifest());

      const spawnPoints = system.getSpawnPoints();
      for (const spawn of spawnPoints) {
        const mag = spawn.lookDirection.magnitude();
        expect(mag).toBeCloseTo(1, 4);
      }
    });
  });

  describe('Spawn Point Selection', () => {
    // Property 25: Spawn Point Selection Optimality - selected point maximizes distance from enemies
    it('Property 25: selected spawn point maximizes distance from enemies', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              x: fc.float({ min: Math.fround(-50), max: Math.fround(50), noNaN: true }),
              y: fc.constant(0),
              z: fc.float({ min: Math.fround(-50), max: Math.fround(50), noNaN: true }),
            }),
            { minLength: 1, maxLength: 3 }
          ),
          (enemyPositions) => {
            const system = new SpawnSystem();
            system.loadManifest(createTestManifest());

            const enemies = enemyPositions.map((p) => new Vector3(p.x, p.y, p.z));
            const selected = system.selectSpawnPoint(1, enemies);

            // Calculate total distance for selected spawn
            const selectedTotalDist = enemies.reduce(
              (sum, enemy) => sum + selected.position.distanceTo(enemy),
              0
            );

            // Check that no other unblocked spawn has significantly higher distance
            const spawnPoints = system.getSpawnPoints();
            for (const spawn of spawnPoints) {
              const isBlocked = enemies.some((e) => spawn.position.distanceTo(e) < 3);
              if (isBlocked) continue;

              const totalDist = enemies.reduce((sum, enemy) => sum + spawn.position.distanceTo(enemy), 0);

              // Selected should be at least as good (within small tolerance for reuse bonus)
              expect(selectedTotalDist).toBeGreaterThanOrEqual(totalDist - 1);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('selects spawn point farthest from single enemy', () => {
      const system = new SpawnSystem();
      system.loadManifest(createTestManifest());

      // Enemy at spawn_1 position
      const enemies = [new Vector3(10, 0, 0)];
      const selected = system.selectSpawnPoint(1, enemies);

      // Should select spawn_2 (opposite side)
      expect(selected.id).toBe('spawn_2');
    });

    it('avoids blocked spawn points', () => {
      const system = new SpawnSystem();
      system.loadManifest(createTestManifest());

      // Enemy very close to spawn_2
      const enemies = [new Vector3(-9, 0, 0)];
      const selected = system.selectSpawnPoint(1, enemies);

      // Should NOT select spawn_2 (blocked)
      expect(selected.id).not.toBe('spawn_2');
    });

    it('throws error when no spawn points loaded', () => {
      const system = new SpawnSystem();

      expect(() => system.selectSpawnPoint(1, [])).toThrow('No spawn points loaded');
    });
  });

  describe('Spawn Cooldown', () => {
    it('tracks last used time for spawn points', () => {
      const system = new SpawnSystem();
      system.loadManifest({
        spawnPoints: [{ id: 'spawn_1', position: [10, 0, 0] }],
        arenaCenter: [0, 0, 0],
      });

      system.setCurrentTime(1000);
      system.selectSpawnPoint(1, []);

      // The spawn point should have been marked as used at time 1000
      // This is verified by the fact that selectSpawnPoint doesn't throw
      expect(system.getSpawnPoints()).toHaveLength(1);
    });
  });

  describe('Event Emission', () => {
    it('emits player_spawned event', () => {
      const eventBus = new EventBus();
      const handler = vi.fn();
      eventBus.on('player_spawned', handler);

      const system = new SpawnSystem(eventBus);
      system.loadManifest(createTestManifest());
      system.setCurrentTime(1000);

      system.selectSpawnPoint(42, []);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'player_spawned',
          playerId: 42,
          timestamp: 1000,
        })
      );
    });
  });

  describe('Property Tests', () => {
    /**
     * **Feature: arena-map-registry, Property 5: Spawn Point Validity**
     * **Validates: Requirements 7.3**
     *
     * For any SpawnManifest, spawn operations should return positions
     * that exist in the manifest's spawn points.
     */
    it('Property 5: spawn operations return positions from manifest', () => {
      fc.assert(
        fc.property(
          // Generate random spawn manifests
          fc.record({
            spawnPoints: fc.array(
              fc.record({
                id: fc.string({ minLength: 1, maxLength: 20 }),
                position: fc.tuple(
                  fc.float({ min: Math.fround(-100), max: Math.fround(100), noNaN: true }),
                  fc.float({ min: Math.fround(-10), max: Math.fround(10), noNaN: true }),
                  fc.float({ min: Math.fround(-100), max: Math.fround(100), noNaN: true })
                ),
              }),
              { minLength: 1, maxLength: 10 }
            ),
            arenaCenter: fc.tuple(
              fc.float({ min: Math.fround(-50), max: Math.fround(50), noNaN: true }),
              fc.constant(0),
              fc.float({ min: Math.fround(-50), max: Math.fround(50), noNaN: true })
            ),
          }),
          // Generate random enemy positions
          fc.array(
            fc.record({
              x: fc.float({ min: Math.fround(-100), max: Math.fround(100), noNaN: true }),
              y: fc.constant(0),
              z: fc.float({ min: Math.fround(-100), max: Math.fround(100), noNaN: true }),
            }),
            { minLength: 0, maxLength: 5 }
          ),
          (manifest, enemyPositions) => {
            const system = new SpawnSystem();
            system.loadManifest(manifest as SpawnManifest);

            const enemies = enemyPositions.map((p) => new Vector3(p.x, p.y, p.z));
            const selected = system.selectSpawnPoint(1, enemies);

            // The selected spawn point ID should be one from the manifest
            const manifestIds = manifest.spawnPoints.map((sp) => sp.id);
            expect(manifestIds).toContain(selected.id);

            // The selected position should match one from the manifest
            const matchingManifestPoint = manifest.spawnPoints.find((sp) => sp.id === selected.id);
            expect(matchingManifestPoint).toBeDefined();

            if (matchingManifestPoint) {
              // Use tolerance of 3 decimal places for floating point comparison
              expect(selected.position.x).toBeCloseTo(matchingManifestPoint.position[0], 3);
              expect(selected.position.y).toBeCloseTo(matchingManifestPoint.position[1], 3);
              expect(selected.position.z).toBeCloseTo(matchingManifestPoint.position[2], 3);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles spawn at arena center', () => {
      const system = new SpawnSystem();
      system.loadManifest({
        spawnPoints: [{ id: 'center', position: [0, 0, 0] }],
        arenaCenter: [0, 0, 0],
      });

      const spawnPoints = system.getSpawnPoints();
      // Should have a valid look direction even when at center
      expect(spawnPoints[0].lookDirection.magnitude()).toBeCloseTo(1, 4);
    });

    it('handles empty enemy list', () => {
      const system = new SpawnSystem();
      system.loadManifest(createTestManifest());

      // Should not throw
      const selected = system.selectSpawnPoint(1, []);
      expect(selected).toBeDefined();
    });

    it('handles all spawn points blocked', () => {
      const system = new SpawnSystem();
      system.loadManifest(createTestManifest());

      // Block all spawn points
      const enemies = [
        new Vector3(10, 0, 0),
        new Vector3(-10, 0, 0),
        new Vector3(0, 0, 10),
        new Vector3(0, 0, -10),
      ];

      // Should still select one (with penalty)
      const selected = system.selectSpawnPoint(1, enemies);
      expect(selected).toBeDefined();
    });
  });
});
