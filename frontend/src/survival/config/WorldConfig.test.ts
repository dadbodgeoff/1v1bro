/**
 * Property-based tests for WorldConfig
 * Uses fast-check for property testing
 * 
 * **Feature: collision-positioning-refactor**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as fc from 'fast-check'
import { WorldConfig, WORLD_CONFIG_DEFAULTS, type PlayerDimensions } from './WorldConfig'

describe('WorldConfig', () => {
  beforeEach(() => {
    // Reset singleton before each test
    WorldConfig.resetInstance()
    vi.restoreAllMocks()
  })

  describe('Singleton pattern', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = WorldConfig.getInstance()
      const instance2 = WorldConfig.getInstance()
      expect(instance1).toBe(instance2)
    })

    it('should create new instance after resetInstance()', () => {
      const instance1 = WorldConfig.getInstance()
      instance1.setTrackSurfaceHeight(5.0)
      
      WorldConfig.resetInstance()
      
      const instance2 = WorldConfig.getInstance()
      // New instance should have default value, not 5.0
      expect(instance2.getTrackSurfaceHeight()).toBe(WORLD_CONFIG_DEFAULTS.trackSurfaceHeight)
    })
  })

  /**
   * **Feature: collision-positioning-refactor, Property 2: Default value before initialization**
   * **Validates: Requirements 1.3**
   * 
   * For any query to WorldConfig.getTrackSurfaceHeight() before track initialization,
   * the system SHALL return a safe default value (1.3) and log a warning.
   */
  describe('Property 2: Default value before initialization', () => {
    it('should return default track surface height (1.3) before initialization', () => {
      fc.assert(
        fc.property(
          // Generate any number of queries (1-10)
          fc.integer({ min: 1, max: 10 }),
          (queryCount) => {
            WorldConfig.resetInstance()
            const config = WorldConfig.getInstance()
            
            // Query multiple times before initialization
            for (let i = 0; i < queryCount; i++) {
              const height = config.getTrackSurfaceHeight()
              expect(height).toBe(WORLD_CONFIG_DEFAULTS.trackSurfaceHeight)
              expect(height).toBe(1.3)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should log warning when queried before initialization', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          (queryCount) => {
            WorldConfig.resetInstance()
            warnSpy.mockClear()
            
            const config = WorldConfig.getInstance()
            
            for (let i = 0; i < queryCount; i++) {
              config.getTrackSurfaceHeight()
            }
            
            // Warning should be logged for each query before initialization
            expect(warnSpy).toHaveBeenCalledTimes(queryCount)
            expect(warnSpy).toHaveBeenCalledWith(
              expect.stringContaining('[WorldConfig] getTrackSurfaceHeight() called before track initialization')
            )
          }
        ),
        { numRuns: 100 }
      )
      
      warnSpy.mockRestore()
    })

    it('should NOT log warning after initialization', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      fc.assert(
        fc.property(
          // Generate valid track surface heights
          fc.double({ min: 0.1, max: 10.0, noNaN: true }),
          fc.integer({ min: 1, max: 10 }),
          (height, queryCount) => {
            WorldConfig.resetInstance()
            warnSpy.mockClear()
            
            const config = WorldConfig.getInstance()
            config.setTrackSurfaceHeight(height)
            
            // Query multiple times after initialization
            for (let i = 0; i < queryCount; i++) {
              config.getTrackSurfaceHeight()
            }
            
            // No warnings should be logged after initialization
            expect(warnSpy).not.toHaveBeenCalled()
          }
        ),
        { numRuns: 100 }
      )
      
      warnSpy.mockRestore()
    })
  })

  /**
   * **Feature: collision-positioning-refactor, Property 1: Track surface height storage**
   * **Validates: Requirements 1.1**
   * 
   * For any track model with a known bounding box, after initialization,
   * WorldConfig.getTrackSurfaceHeight() SHALL return the model's max.y value (scaled).
   */
  describe('Property 1: Track surface height storage', () => {
    it('should store and retrieve track surface height correctly for any valid height', () => {
      fc.assert(
        fc.property(
          // Generate realistic track surface heights (positive values representing model max.y after scaling)
          fc.double({ min: 0.1, max: 100, noNaN: true }),
          (height) => {
            WorldConfig.resetInstance()
            const config = WorldConfig.getInstance()
            
            // Simulate TrackManager setting the height after calculating from model
            config.setTrackSurfaceHeight(height)
            
            // Verify the stored value matches exactly what was set
            expect(config.getTrackSurfaceHeight()).toBe(height)
            expect(config.isTrackSurfaceInitialized()).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve track surface height across multiple reads', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.1, max: 100, noNaN: true }),
          fc.integer({ min: 1, max: 20 }),
          (height, readCount) => {
            WorldConfig.resetInstance()
            const config = WorldConfig.getInstance()
            
            config.setTrackSurfaceHeight(height)
            
            // Multiple reads should return the same value
            for (let i = 0; i < readCount; i++) {
              expect(config.getTrackSurfaceHeight()).toBe(height)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should allow updating track surface height (for track reloading scenarios)', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.1, max: 100, noNaN: true }),
          fc.double({ min: 0.1, max: 100, noNaN: true }),
          (height1, height2) => {
            WorldConfig.resetInstance()
            const config = WorldConfig.getInstance()
            
            config.setTrackSurfaceHeight(height1)
            expect(config.getTrackSurfaceHeight()).toBe(height1)
            
            config.setTrackSurfaceHeight(height2)
            expect(config.getTrackSurfaceHeight()).toBe(height2)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Player dimensions', () => {
    it('should return default player dimensions before initialization', () => {
      const config = WorldConfig.getInstance()
      const dims = config.getPlayerDimensions()
      
      expect(dims.width).toBe(WORLD_CONFIG_DEFAULTS.playerDimensions.width)
      expect(dims.height).toBe(WORLD_CONFIG_DEFAULTS.playerDimensions.height)
      expect(dims.depth).toBe(WORLD_CONFIG_DEFAULTS.playerDimensions.depth)
      expect(dims.footOffset).toBe(WORLD_CONFIG_DEFAULTS.playerDimensions.footOffset)
    })

    it('should store and retrieve player dimensions correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            width: fc.double({ min: 0.1, max: 10, noNaN: true }),
            height: fc.double({ min: 0.1, max: 10, noNaN: true }),
            depth: fc.double({ min: 0.1, max: 10, noNaN: true }),
            footOffset: fc.double({ min: -5, max: 5, noNaN: true }),
          }),
          (dimensions: PlayerDimensions) => {
            WorldConfig.resetInstance()
            const config = WorldConfig.getInstance()
            
            config.setPlayerDimensions(dimensions)
            const retrieved = config.getPlayerDimensions()
            
            expect(retrieved.width).toBe(dimensions.width)
            expect(retrieved.height).toBe(dimensions.height)
            expect(retrieved.depth).toBe(dimensions.depth)
            expect(retrieved.footOffset).toBe(dimensions.footOffset)
            expect(config.isPlayerDimensionsInitialized()).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return a copy of player dimensions (not reference)', () => {
      const config = WorldConfig.getInstance()
      const dims1 = config.getPlayerDimensions()
      const dims2 = config.getPlayerDimensions()
      
      // Should be equal values but different objects
      expect(dims1).toEqual(dims2)
      expect(dims1).not.toBe(dims2)
      
      // Modifying returned object should not affect stored value
      dims1.width = 999
      const dims3 = config.getPlayerDimensions()
      expect(dims3.width).toBe(WORLD_CONFIG_DEFAULTS.playerDimensions.width)
    })
  })

  describe('Initialization state', () => {
    it('should report not initialized before any setters called', () => {
      const config = WorldConfig.getInstance()
      
      expect(config.isInitialized()).toBe(false)
      expect(config.isTrackSurfaceInitialized()).toBe(false)
      expect(config.isPlayerDimensionsInitialized()).toBe(false)
    })

    it('should report partially initialized after track set', () => {
      const config = WorldConfig.getInstance()
      config.setTrackSurfaceHeight(2.0)
      
      expect(config.isInitialized()).toBe(false)
      expect(config.isTrackSurfaceInitialized()).toBe(true)
      expect(config.isPlayerDimensionsInitialized()).toBe(false)
    })

    it('should report partially initialized after player set', () => {
      const config = WorldConfig.getInstance()
      config.setPlayerDimensions({ width: 1, height: 2, depth: 1, footOffset: 0 })
      
      expect(config.isInitialized()).toBe(false)
      expect(config.isTrackSurfaceInitialized()).toBe(false)
      expect(config.isPlayerDimensionsInitialized()).toBe(true)
    })

    it('should report fully initialized after both set', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.1, max: 10, noNaN: true }),
          fc.record({
            width: fc.double({ min: 0.1, max: 10, noNaN: true }),
            height: fc.double({ min: 0.1, max: 10, noNaN: true }),
            depth: fc.double({ min: 0.1, max: 10, noNaN: true }),
            footOffset: fc.double({ min: -5, max: 5, noNaN: true }),
          }),
          (height, dimensions: PlayerDimensions) => {
            WorldConfig.resetInstance()
            const config = WorldConfig.getInstance()
            
            config.setTrackSurfaceHeight(height)
            config.setPlayerDimensions(dimensions)
            
            expect(config.isInitialized()).toBe(true)
            expect(config.isTrackSurfaceInitialized()).toBe(true)
            expect(config.isPlayerDimensionsInitialized()).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Reset functionality', () => {
    it('should reset all values to defaults', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.1, max: 100, noNaN: true }),
          fc.record({
            width: fc.double({ min: 0.1, max: 10, noNaN: true }),
            height: fc.double({ min: 0.1, max: 10, noNaN: true }),
            depth: fc.double({ min: 0.1, max: 10, noNaN: true }),
            footOffset: fc.double({ min: -5, max: 5, noNaN: true }),
          }),
          (height, dimensions: PlayerDimensions) => {
            WorldConfig.resetInstance()
            const config = WorldConfig.getInstance()
            
            // Set values
            config.setTrackSurfaceHeight(height)
            config.setPlayerDimensions(dimensions)
            
            // Reset
            config.reset()
            
            // Verify defaults restored
            expect(config.getTrackSurfaceHeight()).toBe(WORLD_CONFIG_DEFAULTS.trackSurfaceHeight)
            expect(config.getPlayerDimensions()).toEqual(WORLD_CONFIG_DEFAULTS.playerDimensions)
            expect(config.isInitialized()).toBe(false)
            expect(config.isTrackSurfaceInitialized()).toBe(false)
            expect(config.isPlayerDimensionsInitialized()).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
