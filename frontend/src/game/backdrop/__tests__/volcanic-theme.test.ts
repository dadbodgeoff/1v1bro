/**
 * Property-based tests for Volcanic Theme
 * Tests VOLCANIC_COLORS, BackdropSystem theme creation, and map config
 * 
 * @module backdrop/__tests__/volcanic-theme.test
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { VOLCANIC_COLORS } from '../types'
import { BackdropSystem } from '../BackdropSystem'
import { VORTEX_ARENA } from '../../config/maps/vortex-arena'
import { animatedTileRenderer } from '../../terrain/AnimatedTiles'

// ============================================================================
// Property 2: Color constant validity
// Validates: Requirements 11.1
// ============================================================================

describe('Property 2: Color constant validity', () => {
  const hexColorRegex = /^#[0-9a-fA-F]{6}$/

  it('all VOLCANIC_COLORS values are valid CSS hex color strings', () => {
    const colorKeys = Object.keys(VOLCANIC_COLORS) as Array<keyof typeof VOLCANIC_COLORS>
    
    for (const key of colorKeys) {
      const color = VOLCANIC_COLORS[key]
      expect(color).toMatch(hexColorRegex)
    }
  })

  it('VOLCANIC_COLORS contains all required color keys', () => {
    const requiredKeys = [
      'lavaCore',
      'lavaGlow',
      'lavaDark',
      'fire',
      'ember',
      'obsidian',
      'stone',
      'smoke',
      'steam',
      'crack',
    ]

    for (const key of requiredKeys) {
      expect(VOLCANIC_COLORS).toHaveProperty(key)
    }
  })

  it('property: any color from VOLCANIC_COLORS is a valid hex string (100 iterations)', () => {
    const colorKeys = Object.keys(VOLCANIC_COLORS) as Array<keyof typeof VOLCANIC_COLORS>
    
    fc.assert(
      fc.property(
        fc.constantFrom(...colorKeys),
        (key) => {
          const color = VOLCANIC_COLORS[key]
          return hexColorRegex.test(color)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ============================================================================
// Property 3: Map config theme value
// Validates: Requirements 12.2
// ============================================================================

describe('Property 3: Map config theme value', () => {
  it('VORTEX_ARENA metadata.theme equals "volcanic"', () => {
    expect(VORTEX_ARENA.metadata.theme).toBe('volcanic')
  })

  it('VORTEX_ARENA has updated version for volcanic theme', () => {
    expect(VORTEX_ARENA.metadata.version).toBe('2.0.0')
  })

  it('VORTEX_ARENA description mentions volcanic features', () => {
    const description = VORTEX_ARENA.metadata.description.toLowerCase()
    expect(description).toContain('volcanic')
  })
})

// ============================================================================
// Property 4: Backdrop creation by theme
// Validates: Requirements 12.3
// ============================================================================

describe('Property 4: Backdrop creation by theme', () => {
  it('BackdropSystem with "volcanic" theme creates volcanic layers', () => {
    const backdrop = new BackdropSystem(1280, 720, 'volcanic')
    
    expect(backdrop.getTheme()).toBe('volcanic')
    expect(backdrop.layers.length).toBe(4) // Cavern, LavaGlow, Smoke, Ember
  })

  it('BackdropSystem with "space" theme creates space layers', () => {
    const backdrop = new BackdropSystem(1280, 720, 'space')
    
    expect(backdrop.getTheme()).toBe('space')
    expect(backdrop.layers.length).toBe(5) // Void, Nebula, Stars, Dust, Shooting
  })

  it('BackdropSystem defaults to "space" theme when not specified', () => {
    const backdrop = new BackdropSystem(1280, 720)
    
    expect(backdrop.getTheme()).toBe('space')
  })

  it('property: backdrop layer count matches theme (100 iterations)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('space', 'volcanic') as fc.Arbitrary<'space' | 'volcanic'>,
        (theme) => {
          const backdrop = new BackdropSystem(1280, 720, theme)
          if (theme === 'volcanic') {
            return backdrop.layers.length === 4
          } else {
            return backdrop.layers.length === 5
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ============================================================================
// Property 5: Animation time advancement
// Validates: Requirements 13.1
// ============================================================================

describe('Property 5: Animation time advancement', () => {
  it('AnimatedTileRenderer.update advances internal time', () => {
    // Update with known delta
    animatedTileRenderer.update(0.5) // 500ms
    
    // Frame should be retrievable without throwing
    const frame = animatedTileRenderer.getFrame('lava')
    expect(frame).toBeGreaterThanOrEqual(0)
    expect(frame).toBeLessThan(4) // Lava has 4 frames
  })

  it('property: update with positive deltaTime does not throw (100 iterations)', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.001), max: Math.fround(1.0), noNaN: true }),
        (deltaTime) => {
          try {
            animatedTileRenderer.update(deltaTime)
            return true
          } catch {
            return false
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('getColor returns valid color for all animated tile types', () => {
    const tileTypes = ['water', 'lava', 'fire', 'electric', 'portal'] as const
    const hexColorRegex = /^#[0-9a-fA-F]{6}$/

    for (const type of tileTypes) {
      const color = animatedTileRenderer.getColor(type)
      expect(color).toMatch(hexColorRegex)
    }
  })
})

// ============================================================================
// Property 6: Particle count limits
// Validates: Requirements 14.1
// ============================================================================

describe('Property 6: Particle count limits', () => {
  it('EmberParticleLayer respects max ember count', async () => {
    const { EmberParticleLayer } = await import('../layers/EmberParticleLayer')
    const layer = new EmberParticleLayer({ width: 1280, height: 720 })
    
    expect(layer.getEmberCount()).toBeLessThanOrEqual(50)
  })

  it('SmokeHazeLayer respects max wisp count', async () => {
    const { SmokeHazeLayer } = await import('../layers/SmokeHazeLayer')
    const layer = new SmokeHazeLayer({ width: 1280, height: 720 })
    
    expect(layer.getWispCount()).toBeLessThanOrEqual(30)
  })

  it('property: particle counts stay within limits after updates (100 iterations)', async () => {
    const { EmberParticleLayer } = await import('../layers/EmberParticleLayer')
    const { SmokeHazeLayer } = await import('../layers/SmokeHazeLayer')
    
    const emberLayer = new EmberParticleLayer({ width: 1280, height: 720 })
    const smokeLayer = new SmokeHazeLayer({ width: 1280, height: 720 })

    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.016), max: Math.fround(0.1), noNaN: true }),
        (deltaTime) => {
          emberLayer.update(deltaTime, 0)
          smokeLayer.update(deltaTime, 0)
          
          return emberLayer.getEmberCount() <= 50 && smokeLayer.getWispCount() <= 30
        }
      ),
      { numRuns: 100 }
    )
  })
})
