/**
 * Property-based tests for MapRegistry
 * Uses fast-check for property testing
 *
 * **Feature: arena-map-registry**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { MapRegistry, DuplicateMapIdError } from './MapRegistry';
import type { MapDefinition, ArenaConfig, LightingConfig } from './types';

// ============================================================================
// Test Generators
// ============================================================================

/** Generator for valid Vector3Config */
const vector3ConfigGen = fc.record({
  x: fc.double({ min: -100, max: 100, noNaN: true }),
  y: fc.double({ min: -100, max: 100, noNaN: true }),
  z: fc.double({ min: -100, max: 100, noNaN: true }),
});

/** Generator for valid TrackConfig */
const trackConfigGen = fc.record({
  width: fc.integer({ min: 3, max: 10 }),
  depth: fc.double({ min: 0.3, max: 2.0, noNaN: true }),
  railWidth: fc.double({ min: 0.05, max: 0.2, noNaN: true }),
  railHeight: fc.double({ min: 0.1, max: 0.3, noNaN: true }),
  railSpacing: fc.double({ min: 1.0, max: 2.0, noNaN: true }),
  sleeperWidth: fc.double({ min: 1.5, max: 3.0, noNaN: true }),
  sleeperDepth: fc.double({ min: 0.1, max: 0.3, noNaN: true }),
  sleeperSpacing: fc.double({ min: 0.4, max: 1.0, noNaN: true }),
});

/** Generator for valid ColorConfig */
const colorConfigGen = fc.record({
  floor: fc.integer({ min: 0, max: 0xffffff }),
  wall: fc.integer({ min: 0, max: 0xffffff }),
  ceiling: fc.integer({ min: 0, max: 0xffffff }),
  windowFrame: fc.integer({ min: 0, max: 0xffffff }),
  lightFixture: fc.integer({ min: 0, max: 0xffffff }),
  lightEmissive: fc.integer({ min: 0, max: 0xffffff }),
  ambient: fc.integer({ min: 0, max: 0xffffff }),
  fog: fc.integer({ min: 0, max: 0xffffff }),
  trackBed: fc.integer({ min: 0, max: 0xffffff }),
  rail: fc.integer({ min: 0, max: 0xffffff }),
  sleeper: fc.integer({ min: 0, max: 0xffffff }),
  yellowLine: fc.integer({ min: 0, max: 0xffffff }),
  tactileStrip: fc.integer({ min: 0, max: 0xffffff }),
  gate: fc.integer({ min: 0, max: 0xffffff }),
});

/** Generator for valid ArenaConfig */
const arenaConfigGen: fc.Arbitrary<ArenaConfig> = fc.record({
  width: fc.integer({ min: 20, max: 100 }),
  depth: fc.integer({ min: 20, max: 100 }),
  wallHeight: fc.integer({ min: 3, max: 20 }),
  wallThickness: fc.double({ min: 0.1, max: 1.0, noNaN: true }),
  ceilingHeight: fc.integer({ min: 4, max: 25 }),
  windowHeight: fc.double({ min: 1.0, max: 4.0, noNaN: true }),
  windowBottom: fc.double({ min: 0.5, max: 2.0, noNaN: true }),
  windowWidth: fc.double({ min: 2.0, max: 6.0, noNaN: true }),
  windowSpacing: fc.double({ min: 4.0, max: 10.0, noNaN: true }),
  tracks: trackConfigGen,
  platformEdge: fc.record({
    width: fc.double({ min: 0.1, max: 0.5, noNaN: true }),
    tactileWidth: fc.double({ min: 0.3, max: 1.0, noNaN: true }),
  }),
  subwayEntrance: fc.record({
    width: fc.integer({ min: 4, max: 10 }),
    depth: fc.integer({ min: 5, max: 15 }),
    stairDepth: fc.double({ min: 1.0, max: 3.0, noNaN: true }),
    stairSteps: fc.integer({ min: 4, max: 12 }),
    gateHeight: fc.double({ min: 1.8, max: 3.0, noNaN: true }),
  }),
  spawns: fc.record({
    player1: vector3ConfigGen,
    player2: vector3ConfigGen,
  }),
  lightPositions: fc.array(
    fc.record({
      x: fc.double({ min: -50, max: 50, noNaN: true }),
      z: fc.double({ min: -50, max: 50, noNaN: true }),
    }),
    { minLength: 1, maxLength: 10 }
  ),
  colors: colorConfigGen,
});

/** Generator for valid LightingConfig */
const lightingConfigGen: fc.Arbitrary<LightingConfig> = fc.record({
  ambient: fc.record({
    color: fc.integer({ min: 0, max: 0xffffff }),
    intensity: fc.double({ min: 0, max: 2, noNaN: true }),
  }),
  hemisphere: fc.record({
    skyColor: fc.integer({ min: 0, max: 0xffffff }),
    groundColor: fc.integer({ min: 0, max: 0xffffff }),
    intensity: fc.double({ min: 0, max: 2, noNaN: true }),
  }),
  keyLight: fc.record({
    color: fc.integer({ min: 0, max: 0xffffff }),
    intensity: fc.double({ min: 0, max: 3, noNaN: true }),
    position: vector3ConfigGen,
    shadowMapSize: fc.integer({ min: 512, max: 4096 }),
    shadowBias: fc.double({ min: -0.001, max: 0, noNaN: true }),
    castShadow: fc.boolean(),
  }),
  fillLight: fc.record({
    color: fc.integer({ min: 0, max: 0xffffff }),
    intensity: fc.double({ min: 0, max: 2, noNaN: true }),
    position: vector3ConfigGen,
  }),
  pointLights: fc.array(
    fc.record({
      type: fc.constantFrom('emergency', 'utility', 'trackGlow', 'tunnelGlow', 'wallWash') as fc.Arbitrary<'emergency' | 'utility' | 'trackGlow' | 'tunnelGlow' | 'wallWash'>,
      color: fc.integer({ min: 0, max: 0xffffff }),
      intensity: fc.double({ min: 0, max: 20, noNaN: true }),
      position: vector3ConfigGen,
      distance: fc.double({ min: 1, max: 30, noNaN: true }),
      decay: fc.double({ min: 1, max: 3, noNaN: true }),
    }),
    { minLength: 0, maxLength: 20 }
  ),
});

/** Generator for valid MapDefinition with unique ID */
const mapDefinitionGen = (idPrefix = ''): fc.Arbitrary<MapDefinition> =>
  fc.record({
    id: fc.string({ minLength: 1, maxLength: 50 }).map((s) => idPrefix + s.replace(/[^a-zA-Z0-9_-]/g, '_')),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.string({ minLength: 0, maxLength: 500 }),
    playerCount: fc.record({
      min: fc.integer({ min: 1, max: 4 }),
      max: fc.integer({ min: 2, max: 8 }),
    }),
    arenaConfig: arenaConfigGen,
    assets: fc.record({
      textures: fc.record({
        floor: fc.option(fc.webUrl(), { nil: undefined }),
        wall: fc.option(fc.webUrl(), { nil: undefined }),
        ceiling: fc.option(fc.webUrl(), { nil: undefined }),
        track: fc.option(fc.webUrl(), { nil: undefined }),
        tunnel: fc.option(fc.webUrl(), { nil: undefined }),
      }),
      models: fc.record({
        train: fc.option(fc.webUrl(), { nil: undefined }),
        subwayEntrance: fc.option(fc.webUrl(), { nil: undefined }),
        cart: fc.option(fc.webUrl(), { nil: undefined }),
        fareTerminal: fc.option(fc.webUrl(), { nil: undefined }),
        bench: fc.option(fc.webUrl(), { nil: undefined }),
        luggage: fc.option(fc.webUrl(), { nil: undefined }),
        wallExpression: fc.option(fc.webUrl(), { nil: undefined }),
      }),
    }),
    collisionManifest: fc.record({
      colliders: fc.array(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 30 }),
          center: fc.tuple(
            fc.double({ min: -50, max: 50, noNaN: true }),
            fc.double({ min: -10, max: 20, noNaN: true }),
            fc.double({ min: -50, max: 50, noNaN: true })
          ) as fc.Arbitrary<[number, number, number]>,
          size: fc.tuple(
            fc.double({ min: 0.1, max: 50, noNaN: true }),
            fc.double({ min: 0.1, max: 20, noNaN: true }),
            fc.double({ min: 0.1, max: 50, noNaN: true })
          ) as fc.Arbitrary<[number, number, number]>,
        }),
        { minLength: 0, maxLength: 10 }
      ),
    }),
    spawnManifest: fc.record({
      spawnPoints: fc.array(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 30 }),
          position: fc.tuple(
            fc.double({ min: -50, max: 50, noNaN: true }),
            fc.double({ min: 0, max: 10, noNaN: true }),
            fc.double({ min: -50, max: 50, noNaN: true })
          ) as fc.Arbitrary<[number, number, number]>,
        }),
        { minLength: 1, maxLength: 10 }
      ),
      arenaCenter: fc.tuple(
        fc.double({ min: -10, max: 10, noNaN: true }),
        fc.double({ min: 0, max: 5, noNaN: true }),
        fc.double({ min: -10, max: 10, noNaN: true })
      ) as fc.Arbitrary<[number, number, number]>,
    }),
    lightingConfig: lightingConfigGen,
    props: fc.array(
      fc.record({
        assetKey: fc.constantFrom('bench', 'luggage', 'wallExpression', 'cart', 'fareTerminal') as fc.Arbitrary<'bench' | 'luggage' | 'wallExpression' | 'cart' | 'fareTerminal'>,
        positions: fc.array(
          fc.record({
            x: fc.double({ min: -50, max: 50, noNaN: true }),
            y: fc.double({ min: 0, max: 10, noNaN: true }),
            z: fc.double({ min: -50, max: 50, noNaN: true }),
            rotationY: fc.double({ min: 0, max: Math.PI * 2, noNaN: true }),
            scale: fc.double({ min: 0.1, max: 3, noNaN: true }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
      }),
      { minLength: 0, maxLength: 5 }
    ),
  });

// ============================================================================
// Property Tests
// ============================================================================

describe('MapRegistry', () => {
  beforeEach(() => {
    MapRegistry.resetInstance();
  });

  /**
   * **Feature: arena-map-registry, Property 1: Registry Registration Round-Trip**
   * **Validates: Requirements 2.1, 2.2**
   *
   * For any valid MapDefinition, registering it with the MapRegistry
   * and then retrieving it by id should return an equivalent MapDefinition.
   */
  describe('Property 1: Registry Registration Round-Trip', () => {
    it('should return the same MapDefinition after register and get', () => {
      fc.assert(
        fc.property(mapDefinitionGen('test_'), (mapDef) => {
          const registry = MapRegistry.getInstance();
          registry.clear();

          registry.register(mapDef);
          const retrieved = registry.get(mapDef.id);

          expect(retrieved).toBeDefined();
          expect(retrieved).toEqual(mapDef);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: arena-map-registry, Property 2: Registry Has Consistency**
   * **Validates: Requirements 2.2, 2.5**
   *
   * For any MapRegistry state and any map id, `has(id)` should return true
   * if and only if `get(id)` returns a defined value.
   */
  describe('Property 2: Registry Has Consistency', () => {
    it('has(id) should be true iff get(id) is defined', () => {
      fc.assert(
        fc.property(
          fc.array(mapDefinitionGen('map_'), { minLength: 0, maxLength: 5 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (mapDefs, queryId) => {
            const registry = MapRegistry.getInstance();
            registry.clear();

            // Register maps with unique IDs
            const uniqueMaps = new Map<string, MapDefinition>();
            for (const def of mapDefs) {
              if (!uniqueMaps.has(def.id)) {
                uniqueMaps.set(def.id, def);
                registry.register(def);
              }
            }

            // Test consistency for query ID
            const hasResult = registry.has(queryId);
            const getResult = registry.get(queryId);

            expect(hasResult).toBe(getResult !== undefined);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('has(id) should be true for all registered maps', () => {
      fc.assert(
        fc.property(mapDefinitionGen('test_'), (mapDef) => {
          const registry = MapRegistry.getInstance();
          registry.clear();

          registry.register(mapDef);

          expect(registry.has(mapDef.id)).toBe(true);
          expect(registry.get(mapDef.id)).toBeDefined();
        }),
        { numRuns: 100 }
      );
    });

    it('has(id) should be false for unregistered maps', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (randomId) => {
            const registry = MapRegistry.getInstance();
            registry.clear();

            expect(registry.has(randomId)).toBe(false);
            expect(registry.get(randomId)).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: arena-map-registry, Property 3: Registry GetAll Completeness**
   * **Validates: Requirements 2.1, 2.3**
   *
   * For any set of MapDefinitions registered with the MapRegistry,
   * `getAll()` should return an array containing exactly those definitions.
   */
  describe('Property 3: Registry GetAll Completeness', () => {
    it('getAll() should return exactly the registered maps', () => {
      fc.assert(
        fc.property(
          fc.array(mapDefinitionGen('map_'), { minLength: 0, maxLength: 10 }),
          (mapDefs) => {
            const registry = MapRegistry.getInstance();
            registry.clear();

            // Register maps with unique IDs
            const uniqueMaps = new Map<string, MapDefinition>();
            for (const def of mapDefs) {
              if (!uniqueMaps.has(def.id)) {
                uniqueMaps.set(def.id, def);
                registry.register(def);
              }
            }

            const allMaps = registry.getAll();

            // Should have same count
            expect(allMaps.length).toBe(uniqueMaps.size);

            // Should contain all registered maps
            for (const def of uniqueMaps.values()) {
              expect(allMaps).toContainEqual(def);
            }

            // Should not contain any extra maps
            for (const map of allMaps) {
              expect(uniqueMaps.has(map.id)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('getIds() should return exactly the registered map IDs', () => {
      fc.assert(
        fc.property(
          fc.array(mapDefinitionGen('map_'), { minLength: 0, maxLength: 10 }),
          (mapDefs) => {
            const registry = MapRegistry.getInstance();
            registry.clear();

            // Register maps with unique IDs
            const uniqueIds = new Set<string>();
            for (const def of mapDefs) {
              if (!uniqueIds.has(def.id)) {
                uniqueIds.add(def.id);
                registry.register(def);
              }
            }

            const allIds = registry.getIds();

            expect(allIds.length).toBe(uniqueIds.size);
            expect(new Set(allIds)).toEqual(uniqueIds);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ============================================================================
  // Edge Case Tests
  // ============================================================================

  describe('Edge cases', () => {
    it('should throw DuplicateMapIdError when registering duplicate ID', () => {
      const registry = MapRegistry.getInstance();
      registry.clear();

      fc.assert(
        fc.property(mapDefinitionGen('dup_'), (mapDef) => {
          registry.clear();
          registry.register(mapDef);

          expect(() => registry.register(mapDef)).toThrow(DuplicateMapIdError);
          expect(() => registry.register(mapDef)).toThrow(`Map with id "${mapDef.id}" is already registered`);
        }),
        { numRuns: 50 }
      );
    });

    it('should return singleton instance', () => {
      const instance1 = MapRegistry.getInstance();
      const instance2 = MapRegistry.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should reset instance correctly', () => {
      const instance1 = MapRegistry.getInstance();
      MapRegistry.resetInstance();
      const instance2 = MapRegistry.getInstance();

      expect(instance1).not.toBe(instance2);
    });

    it('should report correct size', () => {
      fc.assert(
        fc.property(
          fc.array(mapDefinitionGen('size_'), { minLength: 0, maxLength: 10 }),
          (mapDefs) => {
            const registry = MapRegistry.getInstance();
            registry.clear();

            const uniqueIds = new Set<string>();
            for (const def of mapDefs) {
              if (!uniqueIds.has(def.id)) {
                uniqueIds.add(def.id);
                registry.register(def);
              }
            }

            expect(registry.size()).toBe(uniqueIds.size);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
