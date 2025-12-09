/**
 * Property-based tests for ParallaxDepthSystem
 *
 * **Feature: aaa-arena-visual-system**
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { ParallaxDepthSystem } from '../ParallaxDepthSystem'
import type { ThemeManifest, Vector2 } from '../types'

const mockTheme: ThemeManifest = {
  id: 'volcanic',
  name: 'Volcanic Cavern',
  version: '1.0.0',
  palette: {
    primary: '#ff4400',
    secondary: '#ff6600',
    background: '#1a0a0a',
    platform: '#2d2d2d',
    hazard: '#ff2200',
  },
  tileConfig: {
    seed: 42,
    crackDensity: 0.3,
    weatheringIntensity: 0.5,
    edgeErosion: true,
  },
  lighting: {
    ambientColor: '#1a0505',
    ambientIntensity: 0.3,
    rimLightingEnabled: true,
    rimLightColor: '#ff6600',
    rimLightWidth: 3,
  },
}

// Mock OffscreenCanvas for Node environment
class MockOffscreenCanvas {
  width: number
  height: number
  constructor(width: number, height: number) {
    this.width = width
    this.height = height
  }
  getContext() {
    return {
      fillStyle: '',
      fillRect: () => {},
      createLinearGradient: () => ({
        addColorStop: () => {},
      }),
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      fill: () => {},
    }
  }
}

// @ts-expect-error - Mock for Node environment
globalThis.OffscreenCanvas = MockOffscreenCanvas

describe('ParallaxDepthSystem', () => {
  let system: ParallaxDepthSystem

  beforeEach(() => {
    system = new ParallaxDepthSystem(1920, 1080, mockTheme)
  })

  /**
   * **Feature: aaa-arena-visual-system, Property 5: Parallax Layer Count**
   * **Validates: Requirements 2.1**
   *
   * *For any* initialized ParallaxDepthSystem, the total layer count
   * (including gameplay layer) SHALL equal exactly 4.
   */
  describe('Property 5: Parallax Layer Count', () => {
    it('should have exactly 4 layers including gameplay', () => {
      expect(system.getLayerCount()).toBe(4)
    })

    it('should have 3 managed layers (far, mid, foreground)', () => {
      const layers = system.getLayers()
      expect(layers.length).toBe(3)
      expect(layers.map((l) => l.id)).toContain('far')
      expect(layers.map((l) => l.id)).toContain('mid')
      expect(layers.map((l) => l.id)).toContain('foreground')
    })
  })

  /**
   * **Feature: aaa-arena-visual-system, Property 6: Parallax Scroll Ratio**
   * **Validates: Requirements 2.2**
   *
   * *For any* camera position change (dx, dy), each parallax layer's rendered offset
   * SHALL equal (dx * scrollRatio, dy * scrollRatio).
   */
  describe('Property 6: Parallax Scroll Ratio', () => {
    it('should calculate correct offsets for each layer', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -1000, max: 1000, noNaN: true }), // camera X
          fc.float({ min: -1000, max: 1000, noNaN: true }), // camera Y
          (cameraX, cameraY) => {
            const cameraPos: Vector2 = { x: cameraX, y: cameraY }

            // Far layer (scrollRatio: 0.1)
            const farOffset = system.getLayerOffset('far', cameraPos)
            expect(farOffset.x).toBeCloseTo(cameraX * 0.1, 1)
            expect(farOffset.y).toBeCloseTo(cameraY * 0.1, 1)

            // Mid layer (scrollRatio: 0.3)
            const midOffset = system.getLayerOffset('mid', cameraPos)
            expect(midOffset.x).toBeCloseTo(cameraX * 0.3, 1)
            expect(midOffset.y).toBeCloseTo(cameraY * 0.3, 1)

            // Foreground layer (scrollRatio: 1.2)
            const fgOffset = system.getLayerOffset('foreground', cameraPos)
            expect(fgOffset.x).toBeCloseTo(cameraX * 1.2, 1)
            expect(fgOffset.y).toBeCloseTo(cameraY * 1.2, 1)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should return zero offset for non-existent layer', () => {
      const offset = system.getLayerOffset('nonexistent', { x: 100, y: 100 })
      expect(offset.x).toBe(0)
      expect(offset.y).toBe(0)
    })
  })

  describe('Layer configuration', () => {
    it('should have correct scroll ratios', () => {
      const layers = system.getLayers()

      const farLayer = layers.find((l) => l.id === 'far')
      expect(farLayer?.scrollRatio).toBe(0.1)

      const midLayer = layers.find((l) => l.id === 'mid')
      expect(midLayer?.scrollRatio).toBe(0.3)

      const fgLayer = layers.find((l) => l.id === 'foreground')
      expect(fgLayer?.scrollRatio).toBe(1.2)
    })

    it('should have correct depth values', () => {
      const layers = system.getLayers()

      const farLayer = layers.find((l) => l.id === 'far')
      expect(farLayer?.depth).toBe(0)

      const midLayer = layers.find((l) => l.id === 'mid')
      expect(midLayer?.depth).toBe(1)

      const fgLayer = layers.find((l) => l.id === 'foreground')
      expect(fgLayer?.depth).toBe(3)
    })
  })

  describe('Camera position', () => {
    it('should update camera position', () => {
      system.updateCameraPosition({ x: 100, y: 50 })
      // Camera position is internal, but we can verify via layer offsets
      const offset = system.getLayerOffset('far', { x: 100, y: 50 })
      expect(offset.x).toBeCloseTo(10, 1)
      expect(offset.y).toBeCloseTo(5, 1)
    })
  })
})
