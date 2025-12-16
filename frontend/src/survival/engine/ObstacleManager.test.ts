/**
 * Property-based tests for ObstacleManager
 * Uses fast-check for property testing
 * 
 * **Feature: collision-positioning-refactor**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as fc from 'fast-check'
import * as THREE from 'three'
import { ObstacleManager } from './ObstacleManager'
import { WorldConfig } from '../config/WorldConfig'
import type { CollisionBox } from './CollisionSystem'

// Mock LoadedAssets for testing
const createMockAssets = () => {
  const createMockGroup = () => {
    const group = new THREE.Group()
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshStandardMaterial()
    const mesh = new THREE.Mesh(geometry, material)
    group.add(mesh)
    return group
  }

  return {
    track: { longTile: createMockGroup() },
    obstacles: {
      highBarrier: createMockGroup(),
      lowBarrier: createMockGroup(),
      laneBarrier: createMockGroup(),
      knowledgeGate: createMockGroup(),
      spikes: createMockGroup(),
    },
    character: {
      runner: {
        run: createMockGroup(),
        jump: createMockGroup(),
        down: createMockGroup(),
      },
    },
    celestials: {},
    environment: { city: createMockGroup() },
    collectibles: { gem: createMockGroup() },
  }
}

describe('ObstacleManager', () => {
  let scene: THREE.Scene
  let obstacleManager: ObstacleManager

  beforeEach(() => {
    // Reset WorldConfig before each test
    WorldConfig.resetInstance()
    WorldConfig.getInstance().setTrackSurfaceHeight(1.3)
    
    scene = new THREE.Scene()
    obstacleManager = new ObstacleManager(scene)
    
    // Suppress console warnings during tests
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  /**
   * **Feature: collision-positioning-refactor, Property 3: Collision box Y offset**
   * **Validates: Requirements 2.4**
   * 
   * For any obstacle type and any track surface height,
   * the collision box Y coordinates SHALL be offset by the track surface height value from WorldConfig.
   */
  describe('Property 3: Collision box Y offset', () => {
    it('should offset collision box Y coordinates by track surface height', () => {
      fc.assert(
        fc.property(
          // Generate track surface heights
          fc.double({ min: 0.5, max: 10.0, noNaN: true }),
          (surfaceHeight) => {
            // Set up WorldConfig with the generated surface height
            WorldConfig.resetInstance()
            WorldConfig.getInstance().setTrackSurfaceHeight(surfaceHeight)
            
            // Create new ObstacleManager with the configured WorldConfig
            const testScene = new THREE.Scene()
            const manager = new ObstacleManager(testScene)
            
            // Initialize with mock assets
            const mockAssets = createMockAssets()
            manager.initialize(mockAssets as any)
            
            // Enable spawning and update to spawn obstacles
            manager.setSpawningEnabled(true)
            
            // Update multiple times to spawn obstacles
            for (let i = 0; i < 10; i++) {
              manager.update(-i * 20, 15) // Move player forward to trigger spawns
            }
            
            // Get obstacles and check their collision boxes
            const obstacles = manager.getObstacles()
            
            for (const obstacle of obstacles) {
              const box = obstacle.getCollisionBox()
              
              // Collision box Y values should be relative to track surface height
              // minY should be at or near surfaceHeight (with type-specific offsets)
              // The key property: collision boxes should be positioned relative to surfaceHeight
              
              // For all obstacle types, minY should be within a reasonable range of surfaceHeight
              // (accounting for type-specific offsets like -0.5 for spikes, -0.3 for lowBarrier)
              expect(box.minY).toBeGreaterThanOrEqual(surfaceHeight - 1.0)
              expect(box.minY).toBeLessThanOrEqual(surfaceHeight + 2.0)
              
              // maxY should always be above minY
              expect(box.maxY).toBeGreaterThan(box.minY)
            }
            
            // Clean up
            manager.dispose()
          }
        ),
        { numRuns: 20 } // Reduced runs due to complex setup
      )
    })

    it('should use WorldConfig track surface height for collision calculations', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 1.0, max: 5.0, noNaN: true }),
          fc.double({ min: 1.0, max: 5.0, noNaN: true }),
          (height1, height2) => {
            // Test with first height
            WorldConfig.resetInstance()
            WorldConfig.getInstance().setTrackSurfaceHeight(height1)
            
            const testScene1 = new THREE.Scene()
            const manager1 = new ObstacleManager(testScene1)
            manager1.initialize(createMockAssets() as any)
            manager1.setSpawningEnabled(true)
            manager1.update(-50, 15)
            
            const obstacles1 = manager1.getObstacles()
            const boxes1: CollisionBox[] = obstacles1.map(o => o.getCollisionBox())
            
            // Test with second height
            WorldConfig.resetInstance()
            WorldConfig.getInstance().setTrackSurfaceHeight(height2)
            
            const testScene2 = new THREE.Scene()
            const manager2 = new ObstacleManager(testScene2)
            manager2.initialize(createMockAssets() as any)
            manager2.setSpawningEnabled(true)
            manager2.update(-50, 15)
            
            const obstacles2 = manager2.getObstacles()
            const boxes2: CollisionBox[] = obstacles2.map(o => o.getCollisionBox())
            
            // If both spawned obstacles, the Y offset difference should match height difference
            if (boxes1.length > 0 && boxes2.length > 0) {
              // Find matching obstacle types
              for (let i = 0; i < Math.min(boxes1.length, boxes2.length); i++) {
                if (obstacles1[i].type === obstacles2[i].type) {
                  const yDiff = boxes2[i].minY - boxes1[i].minY
                  const heightDiff = height2 - height1
                  
                  // The Y difference should approximately match the height difference
                  expect(Math.abs(yDiff - heightDiff)).toBeLessThan(0.1)
                }
              }
            }
            
            // Clean up
            manager1.dispose()
            manager2.dispose()
          }
        ),
        { numRuns: 10 } // Reduced runs due to complex setup
      )
    })
  })

  describe('WorldConfig integration', () => {
    it('should read track surface height from WorldConfig', () => {
      const surfaceHeight = 2.5
      WorldConfig.resetInstance()
      WorldConfig.getInstance().setTrackSurfaceHeight(surfaceHeight)
      
      const manager = new ObstacleManager(scene)
      manager.initialize(createMockAssets() as any)
      manager.setSpawningEnabled(true)
      manager.update(-50, 15)
      
      const obstacles = manager.getObstacles()
      
      // All obstacles should have collision boxes relative to the configured surface height
      for (const obstacle of obstacles) {
        const box = obstacle.getCollisionBox()
        // minY should be near surfaceHeight (with type-specific offsets)
        expect(box.minY).toBeGreaterThanOrEqual(surfaceHeight - 1.0)
      }
      
      manager.dispose()
    })
  })
})
