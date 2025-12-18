/**
 * Property-based tests for FloorBuilder
 * Uses fast-check for property testing
 *
 * **Feature: arena-map-registry**
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import * as THREE from 'three';
import { createFloor, createCeiling } from './FloorBuilder';
import type { ArenaConfig } from '../maps/types';
import type { ArenaMaterials } from '../materials/ArenaMaterials';

// ============================================================================
// Test Generators
// ============================================================================

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

/** Generator for valid Vector3Config */
const vector3ConfigGen = fc.record({
  x: fc.double({ min: -100, max: 100, noNaN: true }),
  y: fc.double({ min: -100, max: 100, noNaN: true }),
  z: fc.double({ min: -100, max: 100, noNaN: true }),
});

/** Generator for valid ArenaConfig with constraints for floor building */
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
}).filter((config) => config.width > config.tracks.width + 2); // Ensure valid platform width

// ============================================================================
// Mock Materials
// ============================================================================

const createMockMaterials = (): ArenaMaterials => ({
  terrazzo: new THREE.MeshStandardMaterial({ color: 0xcccccc }),
  wall: new THREE.MeshStandardMaterial({ color: 0x888888 }),
  ceiling: new THREE.MeshStandardMaterial({ color: 0x666666 }),
  windowFrame: new THREE.MeshStandardMaterial({ color: 0x333333 }),
  lightFixture: new THREE.MeshStandardMaterial({ color: 0x222222 }),
  lightEmissive: new THREE.MeshStandardMaterial({ color: 0xffffff }),
});

// ============================================================================
// Property Tests
// ============================================================================

describe('FloorBuilder', () => {
  let mockMaterials: ArenaMaterials;

  beforeEach(() => {
    mockMaterials = createMockMaterials();
  });

  /**
   * **Feature: arena-map-registry, Property 4: Geometry Builder Dimension Consistency**
   * **Validates: Requirements 4.1, 4.6**
   *
   * For any valid ArenaConfig, when `createFloor` is called with that config,
   * each platform's width should equal `(config.width - config.tracks.width) / 2`
   * and depth should equal `config.depth`.
   */
  describe('Property 4: Geometry Builder Dimension Consistency', () => {
    it('floor geometry bounds should match config dimensions', () => {
      fc.assert(
        fc.property(arenaConfigGen, (config) => {
          const floorGroup = createFloor(mockMaterials, config);

          // Each platform should have width = (total width - track width) / 2
          const expectedPlatformWidth = (config.width - config.tracks.width) / 2;
          const expectedDepth = config.depth;

          // Allow small floating point tolerance
          const tolerance = 0.01;

          // Check each platform mesh individually
          for (const child of floorGroup.children) {
            if (child instanceof THREE.Mesh) {
              const geometry = child.geometry as THREE.PlaneGeometry;
              const params = geometry.parameters;

              // Each platform should have the correct dimensions
              expect(Math.abs(params.width - expectedPlatformWidth)).toBeLessThan(tolerance);
              expect(Math.abs(params.height - expectedDepth)).toBeLessThan(tolerance);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('floor should have two platform sections (west and east)', () => {
      fc.assert(
        fc.property(arenaConfigGen, (config) => {
          const floorGroup = createFloor(mockMaterials, config);

          // Should have exactly 2 children (west and east platforms)
          expect(floorGroup.children.length).toBe(2);

          // Find west and east platforms
          const westPlatform = floorGroup.children.find((c) => c.name === 'floor-west');
          const eastPlatform = floorGroup.children.find((c) => c.name === 'floor-east');

          expect(westPlatform).toBeDefined();
          expect(eastPlatform).toBeDefined();

          // Verify positions are on opposite sides of the track
          expect(westPlatform!.position.x).toBeLessThan(0);
          expect(eastPlatform!.position.x).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it('ceiling geometry should match config dimensions', () => {
      fc.assert(
        fc.property(arenaConfigGen, (config) => {
          const ceiling = createCeiling(mockMaterials, config);

          // Get the geometry from the mesh
          const geometry = ceiling.geometry as THREE.PlaneGeometry;
          const params = geometry.parameters;

          // Ceiling should span full width and depth
          expect(params.width).toBe(config.width);
          expect(params.height).toBe(config.depth);

          // Ceiling should be at the correct height
          expect(ceiling.position.y).toBe(config.ceilingHeight);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ============================================================================
  // Unit Tests
  // ============================================================================

  describe('Unit tests', () => {
    it('should create floor with correct name', () => {
      const config: ArenaConfig = {
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
      };

      const floor = createFloor(mockMaterials, config);
      expect(floor.name).toBe('floor');
    });

    it('should create ceiling with correct name', () => {
      const config: ArenaConfig = {
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
      };

      const ceiling = createCeiling(mockMaterials, config);
      expect(ceiling.name).toBe('ceiling');
    });
  });
});
