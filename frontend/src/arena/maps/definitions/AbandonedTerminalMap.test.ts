/**
 * Unit tests for AbandonedTerminalMap migration
 *
 * Verifies that the migrated map definition contains all values
 * from the original hardcoded implementation.
 *
 * **Feature: arena-map-registry**
 * **Validates: Requirements 8.1-8.5**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AbandonedTerminalMap, MAP_IDS, DEFAULT_MAP_ID } from './index';
import { MapRegistry } from '../MapRegistry';
import { ARENA_CONFIG } from '../../config/ArenaConfig';
import {
  ABANDONED_TERMINAL_COLLISION_MANIFEST,
  ABANDONED_TERMINAL_SPAWN_MANIFEST,
} from '../../config/AbandonedTerminalManifest';

describe('AbandonedTerminalMap Migration', () => {
  beforeEach(() => {
    MapRegistry.resetInstance();
  });

  /**
   * **Validates: Requirements 8.1**
   * Verify arenaConfig values match original ARENA_CONFIG
   */
  describe('ArenaConfig Migration', () => {
    it('should have correct main dimensions', () => {
      expect(AbandonedTerminalMap.arenaConfig.width).toBe(ARENA_CONFIG.width);
      expect(AbandonedTerminalMap.arenaConfig.depth).toBe(ARENA_CONFIG.depth);
      expect(AbandonedTerminalMap.arenaConfig.wallHeight).toBe(ARENA_CONFIG.wallHeight);
      expect(AbandonedTerminalMap.arenaConfig.wallThickness).toBe(ARENA_CONFIG.wallThickness);
      expect(AbandonedTerminalMap.arenaConfig.ceilingHeight).toBe(ARENA_CONFIG.ceilingHeight);
    });

    it('should have correct window configuration', () => {
      expect(AbandonedTerminalMap.arenaConfig.windowHeight).toBe(ARENA_CONFIG.windowHeight);
      expect(AbandonedTerminalMap.arenaConfig.windowBottom).toBe(ARENA_CONFIG.windowBottom);
      expect(AbandonedTerminalMap.arenaConfig.windowWidth).toBe(ARENA_CONFIG.windowWidth);
      expect(AbandonedTerminalMap.arenaConfig.windowSpacing).toBe(ARENA_CONFIG.windowSpacing);
    });

    it('should have correct track configuration', () => {
      const tracks = AbandonedTerminalMap.arenaConfig.tracks;
      expect(tracks.width).toBe(ARENA_CONFIG.tracks.width);
      expect(tracks.depth).toBe(ARENA_CONFIG.tracks.depth);
      expect(tracks.railWidth).toBe(ARENA_CONFIG.tracks.railWidth);
      expect(tracks.railHeight).toBe(ARENA_CONFIG.tracks.railHeight);
      expect(tracks.railSpacing).toBe(ARENA_CONFIG.tracks.railSpacing);
      expect(tracks.sleeperWidth).toBe(ARENA_CONFIG.tracks.sleeperWidth);
      expect(tracks.sleeperDepth).toBe(ARENA_CONFIG.tracks.sleeperDepth);
      expect(tracks.sleeperSpacing).toBe(ARENA_CONFIG.tracks.sleeperSpacing);
    });

    it('should have correct platform edge configuration', () => {
      expect(AbandonedTerminalMap.arenaConfig.platformEdge.width).toBe(ARENA_CONFIG.platformEdge.width);
      expect(AbandonedTerminalMap.arenaConfig.platformEdge.tactileWidth).toBe(ARENA_CONFIG.platformEdge.tactileWidth);
    });

    it('should have correct subway entrance configuration', () => {
      const entrance = AbandonedTerminalMap.arenaConfig.subwayEntrance;
      expect(entrance.width).toBe(ARENA_CONFIG.subwayEntrance.width);
      expect(entrance.depth).toBe(ARENA_CONFIG.subwayEntrance.depth);
      expect(entrance.stairDepth).toBe(ARENA_CONFIG.subwayEntrance.stairDepth);
      expect(entrance.stairSteps).toBe(ARENA_CONFIG.subwayEntrance.stairSteps);
      expect(entrance.gateHeight).toBe(ARENA_CONFIG.subwayEntrance.gateHeight);
    });

    it('should have correct spawn positions', () => {
      const spawns = AbandonedTerminalMap.arenaConfig.spawns;
      expect(spawns.player1.x).toBe(ARENA_CONFIG.spawns.player1.x);
      expect(spawns.player1.y).toBe(ARENA_CONFIG.spawns.player1.y);
      expect(spawns.player1.z).toBe(ARENA_CONFIG.spawns.player1.z);
      expect(spawns.player2.x).toBe(ARENA_CONFIG.spawns.player2.x);
      expect(spawns.player2.y).toBe(ARENA_CONFIG.spawns.player2.y);
      expect(spawns.player2.z).toBe(ARENA_CONFIG.spawns.player2.z);
    });

    it('should have correct light positions', () => {
      expect(AbandonedTerminalMap.arenaConfig.lightPositions).toHaveLength(ARENA_CONFIG.lightPositions.length);
      AbandonedTerminalMap.arenaConfig.lightPositions.forEach((pos, i) => {
        expect(pos.x).toBe(ARENA_CONFIG.lightPositions[i].x);
        expect(pos.z).toBe(ARENA_CONFIG.lightPositions[i].z);
      });
    });

    it('should have correct colors', () => {
      const colors = AbandonedTerminalMap.arenaConfig.colors;
      expect(colors.floor).toBe(ARENA_CONFIG.colors.floor);
      expect(colors.wall).toBe(ARENA_CONFIG.colors.wall);
      expect(colors.ceiling).toBe(ARENA_CONFIG.colors.ceiling);
      expect(colors.fog).toBe(ARENA_CONFIG.colors.fog);
      expect(colors.trackBed).toBe(ARENA_CONFIG.colors.trackBed);
      expect(colors.rail).toBe(ARENA_CONFIG.colors.rail);
      expect(colors.yellowLine).toBe(ARENA_CONFIG.colors.yellowLine);
    });
  });

  /**
   * **Validates: Requirements 8.2**
   * Verify all asset URLs are present
   */
  describe('Asset URLs Migration', () => {
    it('should have all texture URLs', () => {
      const textures = AbandonedTerminalMap.assets.textures;
      expect(textures.floor).toContain('floor-atlas.jpg');
      expect(textures.wall).toContain('wall-texture.jpg');
      expect(textures.ceiling).toContain('ceiling-texture.jpg');
      expect(textures.track).toContain('track-texture.jpg');
      expect(textures.tunnel).toContain('tunnel-texture.jpg');
    });

    it('should have all model URLs', () => {
      const models = AbandonedTerminalMap.assets.models;
      expect(models.train).toContain('train2-optimized.glb');
      expect(models.subwayEntrance).toContain('subway.glb');
      expect(models.cart).toContain('underground-cart-optimized.glb');
      expect(models.fareTerminal).toContain('fare-terminal-optimized.glb');
      expect(models.bench).toContain('weathered-bench.glb');
      expect(models.luggage).toContain('lost-luggage.glb');
      expect(models.wallExpression).toContain('wall-expression.glb');
    });

    it('should have 5 texture URLs', () => {
      const textures = AbandonedTerminalMap.assets.textures;
      const definedTextures = Object.values(textures).filter((url) => url !== undefined);
      expect(definedTextures.length).toBe(5);
    });

    it('should have 7 model URLs', () => {
      const models = AbandonedTerminalMap.assets.models;
      const definedModels = Object.values(models).filter((url) => url !== undefined);
      expect(definedModels.length).toBe(7);
    });
  });

  /**
   * **Validates: Requirements 8.3**
   * Verify collision manifest matches original
   */
  describe('Collision Manifest Migration', () => {
    it('should reference the same collision manifest', () => {
      expect(AbandonedTerminalMap.collisionManifest).toBe(ABANDONED_TERMINAL_COLLISION_MANIFEST);
    });

    it('should have colliders array', () => {
      expect(AbandonedTerminalMap.collisionManifest.colliders).toBeDefined();
      expect(Array.isArray(AbandonedTerminalMap.collisionManifest.colliders)).toBe(true);
      expect(AbandonedTerminalMap.collisionManifest.colliders.length).toBeGreaterThan(0);
    });
  });

  /**
   * **Validates: Requirements 8.4**
   * Verify spawn manifest matches original
   */
  describe('Spawn Manifest Migration', () => {
    it('should reference the same spawn manifest', () => {
      expect(AbandonedTerminalMap.spawnManifest).toBe(ABANDONED_TERMINAL_SPAWN_MANIFEST);
    });

    it('should have spawn points array', () => {
      expect(AbandonedTerminalMap.spawnManifest.spawnPoints).toBeDefined();
      expect(Array.isArray(AbandonedTerminalMap.spawnManifest.spawnPoints)).toBe(true);
      expect(AbandonedTerminalMap.spawnManifest.spawnPoints.length).toBeGreaterThan(0);
    });

    it('should have arena center', () => {
      expect(AbandonedTerminalMap.spawnManifest.arenaCenter).toBeDefined();
      expect(AbandonedTerminalMap.spawnManifest.arenaCenter).toHaveLength(3);
    });
  });

  /**
   * **Validates: Requirements 8.5**
   * Verify lighting config has correct number of lights
   */
  describe('Lighting Config Migration', () => {
    it('should have ambient light config', () => {
      expect(AbandonedTerminalMap.lightingConfig.ambient).toBeDefined();
      expect(AbandonedTerminalMap.lightingConfig.ambient.color).toBeDefined();
      expect(AbandonedTerminalMap.lightingConfig.ambient.intensity).toBeGreaterThan(0);
    });

    it('should have hemisphere light config', () => {
      expect(AbandonedTerminalMap.lightingConfig.hemisphere).toBeDefined();
      expect(AbandonedTerminalMap.lightingConfig.hemisphere.skyColor).toBeDefined();
      expect(AbandonedTerminalMap.lightingConfig.hemisphere.groundColor).toBeDefined();
    });

    it('should have key light config', () => {
      expect(AbandonedTerminalMap.lightingConfig.keyLight).toBeDefined();
      expect(AbandonedTerminalMap.lightingConfig.keyLight.position).toBeDefined();
      expect(AbandonedTerminalMap.lightingConfig.keyLight.castShadow).toBe(true);
    });

    it('should have fill light config', () => {
      expect(AbandonedTerminalMap.lightingConfig.fillLight).toBeDefined();
      expect(AbandonedTerminalMap.lightingConfig.fillLight.position).toBeDefined();
    });

    it('should have rim light for player silhouette separation', () => {
      expect(AbandonedTerminalMap.lightingConfig.rimLight).toBeDefined();
      expect(AbandonedTerminalMap.lightingConfig.rimLight!.color).toBeDefined();
      expect(AbandonedTerminalMap.lightingConfig.rimLight!.intensity).toBeGreaterThan(0);
      expect(AbandonedTerminalMap.lightingConfig.rimLight!.position).toBeDefined();
    });

    it('should have point lights array with expected count', () => {
      const pointLights = AbandonedTerminalMap.lightingConfig.pointLights;
      expect(pointLights).toBeDefined();
      expect(Array.isArray(pointLights)).toBe(true);
      // Optimized: 3 utility + 4 wallWash + 2 emergency + 1 trackGlow + 2 tunnelGlow = 12
      expect(pointLights.length).toBe(12);
    });

    it('should have all point light types', () => {
      const pointLights = AbandonedTerminalMap.lightingConfig.pointLights;
      const types = new Set(pointLights.map((l) => l.type));
      expect(types.has('emergency')).toBe(true);
      expect(types.has('utility')).toBe(true);
      expect(types.has('trackGlow')).toBe(true);
      expect(types.has('tunnelGlow')).toBe(true);
      expect(types.has('wallWash')).toBe(true);
    });
  });

  /**
   * Verify prop placements
   */
  describe('Prop Placements', () => {
    it('should have prop placements array', () => {
      expect(AbandonedTerminalMap.props).toBeDefined();
      expect(Array.isArray(AbandonedTerminalMap.props)).toBe(true);
    });

    it('should have wall expression placements', () => {
      const wallProps = AbandonedTerminalMap.props.find((p) => p.assetKey === 'wallExpression');
      expect(wallProps).toBeDefined();
      expect(wallProps?.positions.length).toBe(2);
    });

    it('should have bench placements', () => {
      const benchProps = AbandonedTerminalMap.props.find((p) => p.assetKey === 'bench');
      expect(benchProps).toBeDefined();
      expect(benchProps?.positions.length).toBe(4);
    });

    it('should have luggage placements', () => {
      const luggageProps = AbandonedTerminalMap.props.find((p) => p.assetKey === 'luggage');
      expect(luggageProps).toBeDefined();
      expect(luggageProps?.positions.length).toBe(6);
    });

    it('should have cart placements', () => {
      const cartProps = AbandonedTerminalMap.props.find((p) => p.assetKey === 'cart');
      expect(cartProps).toBeDefined();
      expect(cartProps?.positions.length).toBe(2);
    });

    it('should have fare terminal placements', () => {
      const terminalProps = AbandonedTerminalMap.props.find((p) => p.assetKey === 'fareTerminal');
      expect(terminalProps).toBeDefined();
      expect(terminalProps?.positions.length).toBe(2);
    });
  });

  /**
   * Verify registry integration
   */
  describe('Registry Integration', () => {
    it('should be able to register map with registry', () => {
      const registry = MapRegistry.getInstance();
      // Register if not already registered
      if (!registry.has(AbandonedTerminalMap.id)) {
        registry.register(AbandonedTerminalMap);
      }
      expect(registry.has('abandoned_terminal')).toBe(true);
      expect(registry.get('abandoned_terminal')).toBe(AbandonedTerminalMap);
    });

    it('should export correct MAP_IDS', () => {
      expect(MAP_IDS.ABANDONED_TERMINAL).toBe('abandoned_terminal');
    });

    it('should export correct DEFAULT_MAP_ID', () => {
      expect(DEFAULT_MAP_ID).toBe('abandoned_terminal');
    });
  });

  /**
   * Verify map metadata
   */
  describe('Map Metadata', () => {
    it('should have correct id', () => {
      expect(AbandonedTerminalMap.id).toBe('abandoned_terminal');
    });

    it('should have correct name', () => {
      expect(AbandonedTerminalMap.name).toBe('Abandoned Terminal');
    });

    it('should have description', () => {
      expect(AbandonedTerminalMap.description).toBeDefined();
      expect(AbandonedTerminalMap.description.length).toBeGreaterThan(0);
    });

    it('should have player count constraints', () => {
      expect(AbandonedTerminalMap.playerCount.min).toBe(2);
      expect(AbandonedTerminalMap.playerCount.max).toBe(2);
    });
  });
});
