/**
 * Property-based tests for PlayerController
 * Uses fast-check for property testing
 * 
 * **Feature: collision-positioning-refactor**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as fc from 'fast-check'
import * as THREE from 'three'
import { PlayerController } from './PlayerController'
import { WorldConfig, WORLD_CONFIG_DEFAULTS } from '../config/WorldConfig'

describe('PlayerController', () => {
  beforeEach(() => {
    // Reset WorldConfig singleton before each test
    WorldConfig.resetInstance()
    vi.restoreAllMocks()
  })

  /**
   * **Feature: collision-positioning-refactor, Property 5: Player Y positioning consistency**
   * **Validates: Requirements 4.1, 4.2, 4.3**
   * 
   * For any track surface height value, after initialization, track load, or reset,
   * the player's Y position SHALL equal WorldConfig.getTrackSurfaceHeight().
   */
  describe('Property 5: Player Y positioning consistency', () => {
    /**
     * Helper to create a mock THREE.Group for testing
     */
    function createMockMesh(): THREE.Group {
      const group = new THREE.Group()
      return group
    }

    it('should set player Y to WorldConfig track surface height on initialize when WorldConfig is initialized', () => {
      fc.assert(
        fc.property(
          // Generate valid track surface heights
          fc.double({ min: 0.1, max: 10.0, noNaN: true }),
          // Generate valid player heights
          fc.double({ min: 0.5, max: 5.0, noNaN: true }),
          (trackSurfaceHeight, playerHeight) => {
            WorldConfig.resetInstance()
            const config = WorldConfig.getInstance()
            
            // Set track surface height BEFORE initializing player (simulates TrackManager loading first)
            config.setTrackSurfaceHeight(trackSurfaceHeight)
            
            const controller = new PlayerController()
            const mesh = createMockMesh()
            
            controller.initialize(mesh, playerHeight)
            
            // Player Y should equal the track surface height from WorldConfig
            expect(controller.getY()).toBe(trackSurfaceHeight)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should use default track surface height (1.3) when WorldConfig not yet initialized', () => {
      // Suppress the warning log during this test
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      fc.assert(
        fc.property(
          // Generate valid player heights
          fc.double({ min: 0.5, max: 5.0, noNaN: true }),
          (playerHeight) => {
            WorldConfig.resetInstance()
            // Do NOT set track surface height - simulates PlayerController initializing before TrackManager
            
            const controller = new PlayerController()
            const mesh = createMockMesh()
            
            controller.initialize(mesh, playerHeight)
            
            // Player Y should equal the default track surface height (1.3)
            expect(controller.getY()).toBe(WORLD_CONFIG_DEFAULTS.trackSurfaceHeight)
            expect(controller.getY()).toBe(1.3)
          }
        ),
        { numRuns: 100 }
      )
      
      warnSpy.mockRestore()
    })

    it('should set player Y to WorldConfig track surface height on reset', () => {
      fc.assert(
        fc.property(
          // Generate valid track surface heights
          fc.double({ min: 0.1, max: 10.0, noNaN: true }),
          // Generate valid player heights
          fc.double({ min: 0.5, max: 5.0, noNaN: true }),
          (trackSurfaceHeight, playerHeight) => {
            WorldConfig.resetInstance()
            const config = WorldConfig.getInstance()
            
            // Initialize player first (may use default)
            const controller = new PlayerController()
            const mesh = createMockMesh()
            controller.initialize(mesh, playerHeight)
            
            // Now set track surface height (simulates TrackManager loading)
            config.setTrackSurfaceHeight(trackSurfaceHeight)
            
            // Reset should use the new WorldConfig value
            controller.reset()
            
            // Player Y should equal the track surface height from WorldConfig
            expect(controller.getY()).toBe(trackSurfaceHeight)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain Y position consistency across multiple resets with same WorldConfig', () => {
      fc.assert(
        fc.property(
          // Generate valid track surface heights
          fc.double({ min: 0.1, max: 10.0, noNaN: true }),
          // Generate number of resets
          fc.integer({ min: 1, max: 10 }),
          (trackSurfaceHeight, resetCount) => {
            WorldConfig.resetInstance()
            const config = WorldConfig.getInstance()
            config.setTrackSurfaceHeight(trackSurfaceHeight)
            
            const controller = new PlayerController()
            const mesh = createMockMesh()
            controller.initialize(mesh, 2.0)
            
            // Multiple resets should all result in same Y position
            for (let i = 0; i < resetCount; i++) {
              controller.reset()
              expect(controller.getY()).toBe(trackSurfaceHeight)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should update Y position when WorldConfig changes and reset is called', () => {
      fc.assert(
        fc.property(
          // Generate two different track surface heights
          fc.double({ min: 0.1, max: 10.0, noNaN: true }),
          fc.double({ min: 0.1, max: 10.0, noNaN: true }),
          (height1, height2) => {
            WorldConfig.resetInstance()
            const config = WorldConfig.getInstance()
            
            // Set initial height
            config.setTrackSurfaceHeight(height1)
            
            const controller = new PlayerController()
            const mesh = createMockMesh()
            controller.initialize(mesh, 2.0)
            
            expect(controller.getY()).toBe(height1)
            
            // Change WorldConfig (simulates track reload)
            config.setTrackSurfaceHeight(height2)
            
            // Reset should pick up new value
            controller.reset()
            expect(controller.getY()).toBe(height2)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should set mesh position Y to track surface height on reset', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.1, max: 10.0, noNaN: true }),
          (trackSurfaceHeight) => {
            WorldConfig.resetInstance()
            const config = WorldConfig.getInstance()
            config.setTrackSurfaceHeight(trackSurfaceHeight)
            
            const controller = new PlayerController()
            const mesh = createMockMesh()
            controller.initialize(mesh, 2.0)
            
            controller.reset()
            
            // Mesh position should also be set to track surface height
            expect(mesh.position.y).toBe(trackSurfaceHeight)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
