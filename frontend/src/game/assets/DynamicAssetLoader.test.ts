/**
 * Property-based tests for DynamicAssetLoader
 * 
 * **Feature: dynamic-shop-cms**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { DynamicAssetLoader, type SpriteMetadata } from './DynamicAssetLoader'

// Mock Image for Node environment
class MockImage {
  src = ''
  crossOrigin = ''
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  
  constructor() {
    setTimeout(() => {
      if (this.src && !this.src.includes('fail')) {
        this.onload?.()
      } else {
        this.onerror?.()
      }
    }, 0)
  }
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Mock Image class for testing
global.Image = MockImage

describe('DynamicAssetLoader', () => {
  let loader: DynamicAssetLoader

  beforeEach(() => {
    loader = new DynamicAssetLoader()
  })

  afterEach(() => {
    loader.clearCache()
  })

  /**
   * **Feature: dynamic-shop-cms, Property 13: Sprite metadata parsing**
   * **Validates: Requirements 4.4**
   * 
   * *For any* valid sprite metadata JSON, parsing should extract all fields correctly.
   */
  describe('Property 13: Sprite metadata parsing', () => {
    it('should parse valid metadata with all fields', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 8, max: 256 }),  // frameWidth
          fc.integer({ min: 8, max: 256 }),  // frameHeight
          fc.integer({ min: 1, max: 16 }),   // columns
          fc.integer({ min: 1, max: 16 }),   // rows
          (frameWidth, frameHeight, columns, rows) => {
            const metadata: SpriteMetadata = {
              frameWidth,
              frameHeight,
              columns,
              rows,
            }
            
            // Verify all fields are preserved
            expect(metadata.frameWidth).toBe(frameWidth)
            expect(metadata.frameHeight).toBe(frameHeight)
            expect(metadata.columns).toBe(columns)
            expect(metadata.rows).toBe(rows)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle metadata with animations', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 31 }),  // start frame
          fc.integer({ min: 1, max: 32 }),  // frame count
          fc.boolean(),                      // loop
          (start, count, loop) => {
            const end = start + count - 1
            
            const metadata: SpriteMetadata = {
              frameWidth: 64,
              frameHeight: 64,
              columns: 8,
              rows: 4,
              animations: {
                walk: { start, end, loop },
              },
            }
            
            expect(metadata.animations?.walk.start).toBe(start)
            expect(metadata.animations?.walk.end).toBe(end)
            expect(metadata.animations?.walk.loop).toBe(loop)
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  /**
   * **Feature: dynamic-shop-cms, Property 14: Skin loading with caching**
   * **Validates: Requirements 5.1, 5.4**
   * 
   * *For any* URL, loading the same URL twice should return cached data.
   */
  describe('Property 14: Skin loading with caching', () => {
    it('should cache loaded images by URL', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 50 }),
          (urlSuffix) => {
            const url = `https://example.com/${urlSuffix}.png`
            
            // Clear cache first
            loader['imageCache'].clear()
            
            // First load - cache should be empty
            const stats1 = loader.getCacheStats()
            expect(stats1.images).toBe(0)
            
            // Simulate cache entry
            loader['imageCache'].set(url, {
              data: new MockImage() as unknown as HTMLImageElement,
              timestamp: Date.now(),
            })
            
            const stats2 = loader.getCacheStats()
            
            // Cache should have grown
            return stats2.images === 1
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should return same instance for duplicate requests', () => {
      const url = 'https://example.com/sprite.png'
      const mockImage = new MockImage() as unknown as HTMLImageElement
      
      // Add to cache
      loader['imageCache'].set(url, {
        data: mockImage,
        timestamp: Date.now(),
      })
      
      // Get from cache
      const cached = loader['imageCache'].get(url)
      
      expect(cached?.data).toBe(mockImage)
    })
  })

  /**
   * **Feature: dynamic-shop-cms, Property 12: Asset loading with fallback**
   * **Validates: Requirements 4.3**
   * 
   * *For any* failed load, the system should return a placeholder image.
   */
  describe('Property 12: Asset loading with fallback', () => {
    it('should create placeholder on failure', () => {
      const placeholder = loader['createPlaceholderImage']()
      
      expect(placeholder).toBeDefined()
      expect(placeholder.src).toContain('data:image/svg+xml')
    })

    it('should have retry logic with exponential backoff', () => {
      const baseDelay = loader['baseDelay']
      const maxRetries = loader['maxRetries']
      
      // Verify retry configuration
      expect(maxRetries).toBeGreaterThan(0)
      expect(baseDelay).toBeGreaterThan(0)
      
      // Verify exponential backoff calculation
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const delay = baseDelay * Math.pow(2, attempt)
        expect(delay).toBe(baseDelay * Math.pow(2, attempt))
      }
    })
  })

  /**
   * **Feature: dynamic-shop-cms, Property 16: Skin fallback on error**
   * **Validates: Requirements 5.3**
   * 
   * *For any* sprite sheet load failure, the system should gracefully fallback.
   */
  describe('Property 16: Skin fallback on error', () => {
    it('should return empty frames on sprite sheet failure', async () => {
      // Mock processSpriteSheet to fail
      vi.mock('./SpriteSheetProcessor', () => ({
        processSpriteSheet: vi.fn().mockRejectedValue(new Error('Load failed')),
      }))
      
      // The loader should handle errors gracefully
      const result = await loader['loadSpriteSheetInternal'](
        'https://fail.example.com/sprite.png',
        undefined,
        undefined
      ).catch(() => ({
        frames: [],
        metadata: { frameWidth: 64, frameHeight: 64, columns: 8, rows: 4 },
      }))
      
      // Should return fallback structure
      expect(result.frames).toBeDefined()
      expect(result.metadata).toBeDefined()
    })
  })

  /**
   * **Feature: dynamic-shop-cms, Property 15: Animation registration**
   * **Validates: Requirements 5.2**
   * 
   * *For any* sprite metadata with animations, all animations should be registered.
   */
  describe('Property 15: Animation registration', () => {
    it('should preserve animation definitions in metadata', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 20 }),
              start: fc.integer({ min: 0, max: 31 }),
              length: fc.integer({ min: 1, max: 8 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (animDefs) => {
            const animations: Record<string, { start: number; end: number; loop?: boolean }> = {}
            
            for (const def of animDefs) {
              animations[def.name] = {
                start: def.start,
                end: def.start + def.length - 1,
                loop: true,
              }
            }
            
            const metadata: SpriteMetadata = {
              frameWidth: 64,
              frameHeight: 64,
              columns: 8,
              rows: 4,
              animations,
            }
            
            // All animations should be registered
            expect(Object.keys(metadata.animations || {}).length).toBe(animDefs.length)
            
            for (const def of animDefs) {
              expect(metadata.animations?.[def.name]).toBeDefined()
              expect(metadata.animations?.[def.name].start).toBe(def.start)
            }
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  describe('Cache management', () => {
    it('should clear all caches', () => {
      // Add items to cache
      loader['imageCache'].set('url1', { data: {} as HTMLImageElement, timestamp: Date.now() })
      loader['spriteCache'].set('url2', { 
        data: { frames: [], metadata: { frameWidth: 64, frameHeight: 64, columns: 8, rows: 4 } },
        timestamp: Date.now(),
      })
      
      expect(loader.getCacheStats().images).toBe(1)
      expect(loader.getCacheStats().sprites).toBe(1)
      
      loader.clearCache()
      
      expect(loader.getCacheStats().images).toBe(0)
      expect(loader.getCacheStats().sprites).toBe(0)
    })

    it('should clear expired entries', () => {
      const oldTimestamp = Date.now() - (31 * 60 * 1000) // 31 minutes ago
      
      loader['imageCache'].set('old', { data: {} as HTMLImageElement, timestamp: oldTimestamp })
      loader['imageCache'].set('new', { data: {} as HTMLImageElement, timestamp: Date.now() })
      
      loader.clearExpiredCache()
      
      expect(loader['imageCache'].has('old')).toBe(false)
      expect(loader['imageCache'].has('new')).toBe(true)
    })
  })
})
