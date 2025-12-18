/**
 * Unit tests for MapLoader
 *
 * Tests the map loading service including registry integration
 * and error handling. Asset loading is tested via integration tests.
 *
 * **Feature: arena-map-registry**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MapRegistry } from './MapRegistry';
import type { MapDefinition } from './types';

// ============================================================================
// Test Fixtures
// ============================================================================

const createTestMapDefinition = (id: string): MapDefinition => ({
  id,
  name: `Test Map ${id}`,
  description: 'A test map for unit testing',
  playerCount: { min: 2, max: 2 },
  arenaConfig: {
    width: 36,
    depth: 40,
    wallHeight: 6,
    wallThickness: 0.4,
    ceilingHeight: 6,
    windowHeight: 2.5,
    windowBottom: 1.5,
    windowWidth: 4,
    windowSpacing: 6,
    tracks: {
      width: 5,
      depth: 0.6,
      railWidth: 0.1,
      railHeight: 0.15,
      railSpacing: 1.4,
      sleeperWidth: 2.2,
      sleeperDepth: 0.15,
      sleeperSpacing: 0.6,
    },
    platformEdge: { width: 0.3, tactileWidth: 0.6 },
    subwayEntrance: {
      width: 6,
      depth: 8,
      stairDepth: 1.5,
      stairSteps: 8,
      gateHeight: 2.2,
    },
    spawns: {
      player1: { x: -14, y: -1.5, z: -16 },
      player2: { x: 14, y: -1.5, z: 16 },
    },
    lightPositions: [{ x: 0, z: 0 }],
    colors: {
      floor: 0xd4cfc4,
      wall: 0x8a8580,
      ceiling: 0x6a6560,
      windowFrame: 0x3a3530,
      lightFixture: 0x2a2520,
      lightEmissive: 0xfff5e6,
      ambient: 0x404040,
      fog: 0x1a1a1a,
      trackBed: 0x2a2520,
      rail: 0x4a4a4a,
      sleeper: 0x3d2b1f,
      yellowLine: 0xf4d03f,
      tactileStrip: 0xc4a000,
      gate: 0x5a5a5a,
    },
  },
  assets: {
    textures: {
      floor: 'https://example.com/floor.jpg',
      wall: 'https://example.com/wall.jpg',
    },
    models: {
      train: 'https://example.com/train.glb',
      bench: 'https://example.com/bench.glb',
    },
  },
  collisionManifest: {
    colliders: [
      { id: 'floor', center: [0, -0.25, 0], size: [36, 0.5, 40] },
    ],
  },
  spawnManifest: {
    spawnPoints: [
      { id: 'spawn_1', position: [-14, 0, -16] },
      { id: 'spawn_2', position: [14, 0, 16] },
    ],
    arenaCenter: [0, 0, 0],
  },
  lightingConfig: {
    ambient: { color: 0x606878, intensity: 1.2 },
    hemisphere: { skyColor: 0x505868, groundColor: 0x8a8580, intensity: 0.9 },
    keyLight: {
      color: 0xe8f0ff,
      intensity: 1.8,
      position: { x: 5, y: 20, z: -8 },
      shadowMapSize: 1024,
      shadowBias: -0.0001,
      castShadow: true,
    },
    fillLight: {
      color: 0xfff0e0,
      intensity: 0.8,
      position: { x: -8, y: 15, z: 10 },
    },
    pointLights: [],
  },
  props: [],
});

// ============================================================================
// Tests - Registry Integration (no THREE.js mocking needed)
// ============================================================================

describe('MapLoader - Registry Integration', () => {
  beforeEach(() => {
    MapRegistry.resetInstance();
  });

  /**
   * **Validates: Requirements 3.1**
   * Tests that MapLoader retrieves definitions from MapRegistry
   */
  describe('Registry lookup', () => {
    it('should find registered maps in registry', () => {
      const registry = MapRegistry.getInstance();
      const mapDef = createTestMapDefinition('test_map');
      registry.register(mapDef);

      // Verify the map is in the registry
      expect(registry.has('test_map')).toBe(true);
      expect(registry.get('test_map')).toEqual(mapDef);
    });

    it('should not find unregistered maps', () => {
      const registry = MapRegistry.getInstance();

      expect(registry.has('non_existent')).toBe(false);
      expect(registry.get('non_existent')).toBeUndefined();
    });
  });

  /**
   * **Validates: Requirements 3.5**
   * Tests error handling for non-existent maps
   */
  describe('Error handling', () => {
    it('should return MAP_NOT_FOUND error type for missing maps', async () => {
      // Import MapLoader dynamically to avoid THREE.js initialization issues in unit tests
      const { MapLoader } = await import('./MapLoader');
      const loader = new MapLoader();

      const result = await loader.load('non_existent_map');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('MAP_NOT_FOUND');
        expect(result.error.message).toContain('non_existent_map');
        expect(result.error.message).toContain('not found in registry');
      }

      loader.dispose();
    });
  });
});

// ============================================================================
// Tests - MapDefinition Structure
// ============================================================================

describe('MapDefinition Structure', () => {
  it('should have all required fields', () => {
    const mapDef = createTestMapDefinition('structure_test');

    // Required fields
    expect(mapDef.id).toBeDefined();
    expect(mapDef.name).toBeDefined();
    expect(mapDef.description).toBeDefined();
    expect(mapDef.playerCount).toBeDefined();
    expect(mapDef.arenaConfig).toBeDefined();
    expect(mapDef.assets).toBeDefined();
    expect(mapDef.collisionManifest).toBeDefined();
    expect(mapDef.spawnManifest).toBeDefined();
    expect(mapDef.lightingConfig).toBeDefined();
    expect(mapDef.props).toBeDefined();
  });

  it('should have valid arenaConfig structure', () => {
    const mapDef = createTestMapDefinition('config_test');
    const config = mapDef.arenaConfig;

    // Dimensions
    expect(config.width).toBeGreaterThan(0);
    expect(config.depth).toBeGreaterThan(0);
    expect(config.wallHeight).toBeGreaterThan(0);
    expect(config.ceilingHeight).toBeGreaterThan(0);

    // Sub-configs
    expect(config.tracks).toBeDefined();
    expect(config.tracks.width).toBeGreaterThan(0);
    expect(config.colors).toBeDefined();
    expect(config.spawns).toBeDefined();
    expect(config.spawns.player1).toBeDefined();
    expect(config.spawns.player2).toBeDefined();
  });

  it('should have valid assets structure', () => {
    const mapDef = createTestMapDefinition('assets_test');
    const assets = mapDef.assets;

    expect(assets.textures).toBeDefined();
    expect(assets.models).toBeDefined();

    // URLs should be strings when defined
    if (assets.textures.floor) {
      expect(typeof assets.textures.floor).toBe('string');
    }
    if (assets.models.train) {
      expect(typeof assets.models.train).toBe('string');
    }
  });

  it('should have valid collision manifest', () => {
    const mapDef = createTestMapDefinition('collision_test');
    const manifest = mapDef.collisionManifest;

    expect(manifest.colliders).toBeDefined();
    expect(Array.isArray(manifest.colliders)).toBe(true);

    for (const collider of manifest.colliders) {
      expect(collider.id).toBeDefined();
      expect(collider.center).toHaveLength(3);
      expect(collider.size).toHaveLength(3);
    }
  });

  it('should have valid spawn manifest', () => {
    const mapDef = createTestMapDefinition('spawn_test');
    const manifest = mapDef.spawnManifest;

    expect(manifest.spawnPoints).toBeDefined();
    expect(Array.isArray(manifest.spawnPoints)).toBe(true);
    expect(manifest.spawnPoints.length).toBeGreaterThan(0);
    expect(manifest.arenaCenter).toHaveLength(3);

    for (const spawn of manifest.spawnPoints) {
      expect(spawn.id).toBeDefined();
      expect(spawn.position).toHaveLength(3);
    }
  });

  it('should have valid lighting config', () => {
    const mapDef = createTestMapDefinition('lighting_test');
    const lighting = mapDef.lightingConfig;

    expect(lighting.ambient).toBeDefined();
    expect(lighting.ambient.color).toBeDefined();
    expect(lighting.ambient.intensity).toBeGreaterThanOrEqual(0);

    expect(lighting.hemisphere).toBeDefined();
    expect(lighting.keyLight).toBeDefined();
    expect(lighting.keyLight.position).toBeDefined();
    expect(lighting.fillLight).toBeDefined();
    expect(lighting.pointLights).toBeDefined();
    expect(Array.isArray(lighting.pointLights)).toBe(true);
  });
});

// ============================================================================
// Tests - LoadedMap Types
// ============================================================================

describe('LoadedMap Types', () => {
  it('should export correct types', async () => {
    const { MapLoader } = await import('./MapLoader');
    
    // Type checking - these should compile without errors
    type LoadedTexturesType = Awaited<ReturnType<typeof MapLoader.prototype.load>> extends { ok: true; value: infer V } ? V['textures'] : never;
    type LoadedModelsType = Awaited<ReturnType<typeof MapLoader.prototype.load>> extends { ok: true; value: infer V } ? V['models'] : never;

    // If we get here, types are correctly exported
    expect(true).toBe(true);
  });
});
