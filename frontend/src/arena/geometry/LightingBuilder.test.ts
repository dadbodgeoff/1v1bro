/**
 * Property-based tests for LightingBuilder
 * Uses fast-check for property testing
 *
 * **Feature: arena-map-registry**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import * as THREE from 'three';
import { createAmbientLighting, getLightingStats } from './LightingBuilder';
import type { LightingConfig, PointLightType } from '../maps/types';

// ============================================================================
// Test Generators
// ============================================================================

/** Generator for valid Vector3Config */
const vector3ConfigGen = fc.record({
  x: fc.double({ min: -100, max: 100, noNaN: true }),
  y: fc.double({ min: -100, max: 100, noNaN: true }),
  z: fc.double({ min: -100, max: 100, noNaN: true }),
});

/** Generator for valid PointLightConfig */
const pointLightConfigGen = fc.record({
  type: fc.constantFrom('emergency', 'utility', 'trackGlow', 'tunnelGlow', 'wallWash') as fc.Arbitrary<PointLightType>,
  color: fc.integer({ min: 0, max: 0xffffff }),
  intensity: fc.double({ min: 0, max: 20, noNaN: true }),
  position: vector3ConfigGen,
  distance: fc.double({ min: 1, max: 30, noNaN: true }),
  decay: fc.double({ min: 1, max: 3, noNaN: true }),
  name: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
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
    shadowMapSize: fc.option(fc.integer({ min: 512, max: 4096 }), { nil: undefined }),
    shadowBias: fc.option(fc.double({ min: -0.001, max: 0, noNaN: true }), { nil: undefined }),
    castShadow: fc.option(fc.boolean(), { nil: undefined }),
  }),
  fillLight: fc.record({
    color: fc.integer({ min: 0, max: 0xffffff }),
    intensity: fc.double({ min: 0, max: 2, noNaN: true }),
    position: vector3ConfigGen,
  }),
  // Optional rim light
  rimLight: fc.option(
    fc.record({
      color: fc.integer({ min: 0, max: 0xffffff }),
      intensity: fc.double({ min: 0, max: 2, noNaN: true }),
      position: vector3ConfigGen,
      castShadow: fc.option(fc.boolean(), { nil: undefined }),
    }),
    { nil: undefined }
  ),
  pointLights: fc.array(pointLightConfigGen, { minLength: 0, maxLength: 20 }),
});

// ============================================================================
// Property Tests
// ============================================================================

describe('LightingBuilder', () => {
  /**
   * **Feature: arena-map-registry, Property 6: Lighting Config Point Light Count**
   * **Validates: Requirements 4.5**
   *
   * For any LightingConfig passed to `createAmbientLighting`, the resulting
   * THREE.Group should contain exactly `config.pointLights.length` PointLight
   * objects plus the ambient, hemisphere, key, and fill lights.
   */
  describe('Property 6: Lighting Config Point Light Count', () => {
    it('should create correct number of point lights from config', () => {
      fc.assert(
        fc.property(lightingConfigGen, (config) => {
          const lightGroup = createAmbientLighting(config);

          // Count point lights in the group
          let pointLightCount = 0;
          lightGroup.traverse((obj) => {
            if (obj instanceof THREE.PointLight) {
              pointLightCount++;
            }
          });

          // Should have exactly the number of point lights specified in config
          expect(pointLightCount).toBe(config.pointLights.length);
        }),
        { numRuns: 100 }
      );
    });

    it('should create exactly 4 base lights (ambient, hemisphere, key, fill) without rim light', () => {
      fc.assert(
        fc.property(lightingConfigGen, (config) => {
          // Remove rim light for this test
          const configWithoutRim = { ...config, rimLight: undefined };
          const lightGroup = createAmbientLighting(configWithoutRim);

          // Count each type of base light
          let ambientCount = 0;
          let hemisphereCount = 0;
          let directionalCount = 0;

          lightGroup.traverse((obj) => {
            if (obj instanceof THREE.AmbientLight) ambientCount++;
            if (obj instanceof THREE.HemisphereLight) hemisphereCount++;
            if (obj instanceof THREE.DirectionalLight) directionalCount++;
          });

          // Should have exactly 1 ambient, 1 hemisphere, and 2 directional (key + fill)
          expect(ambientCount).toBe(1);
          expect(hemisphereCount).toBe(1);
          expect(directionalCount).toBe(2);
        }),
        { numRuns: 100 }
      );
    });

    it('should create 5 base lights when rim light is present', () => {
      fc.assert(
        fc.property(lightingConfigGen, (config) => {
          // Ensure rim light is present
          const configWithRim = {
            ...config,
            rimLight: {
              color: 0xc8d8ff,
              intensity: 0.7,
              position: { x: 0, y: 12, z: 15 },
              castShadow: false,
            },
          };
          const lightGroup = createAmbientLighting(configWithRim);

          // Count each type of base light
          let ambientCount = 0;
          let hemisphereCount = 0;
          let directionalCount = 0;

          lightGroup.traverse((obj) => {
            if (obj instanceof THREE.AmbientLight) ambientCount++;
            if (obj instanceof THREE.HemisphereLight) hemisphereCount++;
            if (obj instanceof THREE.DirectionalLight) directionalCount++;
          });

          // Should have exactly 1 ambient, 1 hemisphere, and 3 directional (key + fill + rim)
          expect(ambientCount).toBe(1);
          expect(hemisphereCount).toBe(1);
          expect(directionalCount).toBe(3);
        }),
        { numRuns: 100 }
      );
    });

    it('should set correct properties on ambient light', () => {
      fc.assert(
        fc.property(lightingConfigGen, (config) => {
          const lightGroup = createAmbientLighting(config);

          let ambientLight: THREE.AmbientLight | null = null;
          lightGroup.traverse((obj) => {
            if (obj instanceof THREE.AmbientLight) {
              ambientLight = obj;
            }
          });

          expect(ambientLight).not.toBeNull();
          expect(ambientLight!.color.getHex()).toBe(config.ambient.color);
          expect(ambientLight!.intensity).toBe(config.ambient.intensity);
        }),
        { numRuns: 100 }
      );
    });

    it('should set correct properties on hemisphere light', () => {
      fc.assert(
        fc.property(lightingConfigGen, (config) => {
          const lightGroup = createAmbientLighting(config);

          let hemiLight: THREE.HemisphereLight | null = null;
          lightGroup.traverse((obj) => {
            if (obj instanceof THREE.HemisphereLight) {
              hemiLight = obj;
            }
          });

          expect(hemiLight).not.toBeNull();
          expect(hemiLight!.color.getHex()).toBe(config.hemisphere.skyColor);
          expect(hemiLight!.groundColor.getHex()).toBe(config.hemisphere.groundColor);
          expect(hemiLight!.intensity).toBe(config.hemisphere.intensity);
        }),
        { numRuns: 100 }
      );
    });

    it('should set correct positions on point lights', () => {
      fc.assert(
        fc.property(lightingConfigGen, (config) => {
          const lightGroup = createAmbientLighting(config);

          const pointLights: THREE.PointLight[] = [];
          lightGroup.traverse((obj) => {
            if (obj instanceof THREE.PointLight) {
              pointLights.push(obj);
            }
          });

          // Each point light should have the correct position from config
          expect(pointLights.length).toBe(config.pointLights.length);

          for (let i = 0; i < config.pointLights.length; i++) {
            const configLight = config.pointLights[i];
            const actualLight = pointLights[i];

            expect(actualLight.position.x).toBe(configLight.position.x);
            expect(actualLight.position.y).toBe(configLight.position.y);
            expect(actualLight.position.z).toBe(configLight.position.z);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should set correct properties on point lights', () => {
      fc.assert(
        fc.property(lightingConfigGen, (config) => {
          const lightGroup = createAmbientLighting(config);

          const pointLights: THREE.PointLight[] = [];
          lightGroup.traverse((obj) => {
            if (obj instanceof THREE.PointLight) {
              pointLights.push(obj);
            }
          });

          for (let i = 0; i < config.pointLights.length; i++) {
            const configLight = config.pointLights[i];
            const actualLight = pointLights[i];

            expect(actualLight.color.getHex()).toBe(configLight.color);
            expect(actualLight.intensity).toBe(configLight.intensity);
            expect(actualLight.distance).toBe(configLight.distance);
            expect(actualLight.decay).toBe(configLight.decay);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // ============================================================================
  // Unit Tests
  // ============================================================================

  describe('Unit tests', () => {
    it('should create lighting group with correct name', () => {
      const config: LightingConfig = {
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
      };

      const lightGroup = createAmbientLighting(config);
      expect(lightGroup.name).toBe('ambient-lighting');
    });

    it('should handle empty pointLights array', () => {
      const config: LightingConfig = {
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
      };

      const lightGroup = createAmbientLighting(config);

      let pointLightCount = 0;
      lightGroup.traverse((obj) => {
        if (obj instanceof THREE.PointLight) pointLightCount++;
      });

      expect(pointLightCount).toBe(0);
    });

    it('should set key light shadow properties correctly', () => {
      const config: LightingConfig = {
        ambient: { color: 0x606878, intensity: 1.2 },
        hemisphere: { skyColor: 0x505868, groundColor: 0x8a8580, intensity: 0.9 },
        keyLight: {
          color: 0xe8f0ff,
          intensity: 1.8,
          position: { x: 5, y: 20, z: -8 },
          shadowMapSize: 2048,
          shadowBias: -0.0002,
          castShadow: true,
        },
        fillLight: {
          color: 0xfff0e0,
          intensity: 0.8,
          position: { x: -8, y: 15, z: 10 },
        },
        pointLights: [],
      };

      const lightGroup = createAmbientLighting(config);

      let keyLight: THREE.DirectionalLight | null = null;
      lightGroup.traverse((obj) => {
        if (obj instanceof THREE.DirectionalLight && obj.name === 'key-light') {
          keyLight = obj;
        }
      });

      expect(keyLight).not.toBeNull();
      expect(keyLight!.castShadow).toBe(true);
      expect(keyLight!.shadow.mapSize.width).toBe(2048);
      expect(keyLight!.shadow.mapSize.height).toBe(2048);
      expect(keyLight!.shadow.bias).toBe(-0.0002);
    });

    it('should use default shadow values when not specified', () => {
      const config: LightingConfig = {
        ambient: { color: 0x606878, intensity: 1.2 },
        hemisphere: { skyColor: 0x505868, groundColor: 0x8a8580, intensity: 0.9 },
        keyLight: {
          color: 0xe8f0ff,
          intensity: 1.8,
          position: { x: 5, y: 20, z: -8 },
          // No shadow properties specified
        },
        fillLight: {
          color: 0xfff0e0,
          intensity: 0.8,
          position: { x: -8, y: 15, z: 10 },
        },
        pointLights: [],
      };

      const lightGroup = createAmbientLighting(config);

      let keyLight: THREE.DirectionalLight | null = null;
      lightGroup.traverse((obj) => {
        if (obj instanceof THREE.DirectionalLight && obj.name === 'key-light') {
          keyLight = obj;
        }
      });

      expect(keyLight).not.toBeNull();
      expect(keyLight!.castShadow).toBe(true); // Default
      expect(keyLight!.shadow.mapSize.width).toBe(2048); // Updated default
      expect(keyLight!.shadow.bias).toBe(-0.00025); // Updated default
    });

    it('should cull point lights when maxLights is specified', () => {
      const config: LightingConfig = {
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
        pointLights: [
          { type: 'utility', color: 0xffffff, intensity: 10, position: { x: 0, y: 2, z: 0 }, distance: 15, decay: 1.5, name: 'utility-1' },
          { type: 'utility', color: 0xffffff, intensity: 10, position: { x: 5, y: 2, z: 0 }, distance: 15, decay: 1.5, name: 'utility-2' },
          { type: 'wallWash', color: 0xffffff, intensity: 6, position: { x: 0, y: 2, z: 10 }, distance: 15, decay: 1.5, name: 'wall-1' },
          { type: 'emergency', color: 0xff0000, intensity: 3, position: { x: 10, y: 2, z: 0 }, distance: 10, decay: 2.0, name: 'emergency-1' },
          { type: 'trackGlow', color: 0x66aacc, intensity: 3, position: { x: 0, y: -1, z: 0 }, distance: 12, decay: 1.8, name: 'track-1' },
          { type: 'tunnelGlow', color: 0x445566, intensity: 3, position: { x: 0, y: 1, z: 20 }, distance: 12, decay: 1.6, name: 'tunnel-1' },
        ],
      };

      // maxLights: 6 means 6 - 4 (base lights) = 2 point lights allowed
      const lightGroup = createAmbientLighting(config, 6);

      let pointLightCount = 0;
      lightGroup.traverse((obj) => {
        if (obj instanceof THREE.PointLight) pointLightCount++;
      });

      // Should only have 2 point lights (utility lights have highest priority)
      expect(pointLightCount).toBe(2);
    });

    it('should create rim light when specified', () => {
      const config: LightingConfig = {
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
        rimLight: {
          color: 0xc8d8ff,
          intensity: 0.7,
          position: { x: 0, y: 12, z: 15 },
          castShadow: false,
        },
        pointLights: [],
      };

      const lightGroup = createAmbientLighting(config);

      let rimLight: THREE.DirectionalLight | null = null;
      lightGroup.traverse((obj) => {
        if (obj instanceof THREE.DirectionalLight && obj.name === 'rim-light') {
          rimLight = obj;
        }
      });

      expect(rimLight).not.toBeNull();
      expect(rimLight!.color.getHex()).toBe(0xc8d8ff);
      expect(rimLight!.intensity).toBe(0.7);
      expect(rimLight!.castShadow).toBe(false);
    });
  });
});
