/**
 * ArenaScene Unit Tests
 *
 * Tests for ArenaScene with LoadedMap integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { ArenaScene } from './ArenaScene';
import type { LoadedMap } from './maps/MapLoader';
import type { MapDefinition } from './maps/types';

// Mock the geometry module
vi.mock('./geometry', () => ({
  createFloor: vi.fn(() => {
    const group = new THREE.Group();
    group.name = 'floor';
    return group;
  }),
  createCeiling: vi.fn(() => {
    const group = new THREE.Group();
    group.name = 'ceiling';
    return group;
  }),
  createWalls: vi.fn(() => {
    const group = new THREE.Group();
    group.name = 'walls';
    return group;
  }),
  createHangingLights: vi.fn(() => new THREE.Group()),
  createAmbientLighting: vi.fn(() => new THREE.Group()),
  createTrackChannel: vi.fn(() => new THREE.Group()),
  createPlatformEdges: vi.fn(() => new THREE.Group()),
  createSubwayTrain: vi.fn(() => new THREE.Group()),
  placeSubwayTrain: vi.fn(() => new THREE.Group()),
  placeSubwayEntrances: vi.fn(() => []),
  placeCarts: vi.fn(() => []),
  placeFareTerminals: vi.fn(() => []),
  placeWallExpressions: vi.fn(() => []),
  placeBenches: vi.fn(() => []),
  placeLuggageStacks: vi.fn(() => []),
  applyPreloadedFloorMaterial: vi.fn(),
  applyPreloadedWallMaterial: vi.fn(),
  applyPreloadedCeilingMaterial: vi.fn(),
  applyPreloadedTrackTextures: vi.fn(),
}));

// Mock the materials module
vi.mock('./materials/ArenaMaterials', () => ({
  createArenaMaterials: vi.fn(() => ({
    terrazzo: new THREE.MeshStandardMaterial(),
    lightFixture: new THREE.MeshStandardMaterial(),
  })),
  disposeMaterials: vi.fn(),
}));


// Mock the rendering module
vi.mock('./rendering/GeometryBatcher', () => ({
  GeometryBatcher: class MockGeometryBatcher {
    addGroup = vi.fn();
    build = vi.fn(() => new THREE.Mesh());
    getStats = vi.fn(() => ({ meshes: 0, triangles: 0 }));
  },
}));

// Mock MapLoader
vi.mock('./maps/MapLoader', () => ({
  MapLoader: {
    disposeLoadedMap: vi.fn(),
  },
}));

/**
 * Create a minimal mock LoadedMap for testing
 */
function createMockLoadedMap(): LoadedMap {
  const mockDefinition: MapDefinition = {
    id: 'test_map',
    name: 'Test Map',
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
      lightPositions: [
        { x: -10, z: -10 },
        { x: 10, z: 10 },
      ],
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
      textures: {},
      models: {},
    },
    collisionManifest: { aabbs: [] },
    spawnManifest: { spawnPoints: [] },
    lightingConfig: {
      ambient: { color: 0x606878, intensity: 1.2 },
      hemisphere: { skyColor: 0x505868, groundColor: 0x8a8580, intensity: 0.9 },
      keyLight: {
        color: 0xe8f0ff,
        intensity: 1.8,
        position: { x: 5, y: 20, z: -8 },
      },
      fillLight: {
        color: 0xfff0e0,
        intensity: 0.8,
        position: { x: -8, y: 15, z: 10 },
      },
      pointLights: [],
    },
    props: [],
  };

  return {
    definition: mockDefinition,
    textures: {},
    models: {},
  };
}

describe('ArenaScene', () => {
  let mockLoadedMap: LoadedMap;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadedMap = createMockLoadedMap();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should accept LoadedMap parameter', () => {
      const arenaScene = new ArenaScene(mockLoadedMap);
      expect(arenaScene).toBeDefined();
      expect(arenaScene.scene).toBeInstanceOf(THREE.Scene);
      arenaScene.dispose();
    });

    it('should create scene with correct background color', () => {
      const arenaScene = new ArenaScene(mockLoadedMap);
      expect(arenaScene.scene.background).toBeInstanceOf(THREE.Color);
      arenaScene.dispose();
    });

    it('should create scene with fog using config fog color', () => {
      const arenaScene = new ArenaScene(mockLoadedMap);
      expect(arenaScene.scene.fog).toBeInstanceOf(THREE.FogExp2);
      arenaScene.dispose();
    });
  });

  describe('getMapDefinition', () => {
    it('should return the loaded map definition', () => {
      const arenaScene = new ArenaScene(mockLoadedMap);
      const definition = arenaScene.getMapDefinition();
      expect(definition.id).toBe('test_map');
      expect(definition.name).toBe('Test Map');
      arenaScene.dispose();
    });
  });

  describe('getBounds', () => {
    it('should return a Box3 representing arena bounds', () => {
      const arenaScene = new ArenaScene(mockLoadedMap);
      const bounds = arenaScene.getBounds();
      expect(bounds).toBeInstanceOf(THREE.Box3);
      arenaScene.dispose();
    });
  });

  describe('dispose', () => {
    it('should call MapLoader.disposeLoadedMap', async () => {
      const { MapLoader } = await import('./maps/MapLoader');
      const arenaScene = new ArenaScene(mockLoadedMap);
      arenaScene.dispose();
      expect(MapLoader.disposeLoadedMap).toHaveBeenCalledWith(mockLoadedMap);
    });

    it('should clear the scene', () => {
      const arenaScene = new ArenaScene(mockLoadedMap);
      const clearSpy = vi.spyOn(arenaScene.scene, 'clear');
      arenaScene.dispose();
      expect(clearSpy).toHaveBeenCalled();
    });
  });

  describe('scene uses config dimensions', () => {
    it('should pass arenaConfig to geometry builders', async () => {
      const geometry = await import('./geometry');
      const arenaScene = new ArenaScene(mockLoadedMap);

      expect(geometry.createFloor).toHaveBeenCalledWith(
        expect.anything(),
        mockLoadedMap.definition.arenaConfig
      );
      expect(geometry.createCeiling).toHaveBeenCalledWith(
        expect.anything(),
        mockLoadedMap.definition.arenaConfig
      );
      expect(geometry.createWalls).toHaveBeenCalledWith(
        expect.anything(),
        mockLoadedMap.definition.arenaConfig
      );

      arenaScene.dispose();
    });

    it('should pass lightingConfig and maxLights to createAmbientLighting', async () => {
      const geometry = await import('./geometry');
      const arenaScene = new ArenaScene(mockLoadedMap);

      // Should be called with lightingConfig and maxLights from quality profile
      expect(geometry.createAmbientLighting).toHaveBeenCalledWith(
        mockLoadedMap.definition.lightingConfig,
        expect.any(Number) // maxLights from quality profile
      );

      arenaScene.dispose();
    });

    it('should use custom maxLights when provided in options', async () => {
      const geometry = await import('./geometry');
      const arenaScene = new ArenaScene(mockLoadedMap, { maxLights: 4 });

      expect(geometry.createAmbientLighting).toHaveBeenCalledWith(
        mockLoadedMap.definition.lightingConfig,
        4
      );

      arenaScene.dispose();
    });
  });
});
