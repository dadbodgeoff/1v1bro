/**
 * Property tests for map-loader utility.
 * 
 * **Feature: map-selection, Property 7 & 8**
 * **Validates: Requirements 4.2, 4.5**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  getMapConfig,
  getAvailableMaps,
  isValidMapSlug,
  getMapInfo,
  AVAILABLE_MAPS,
  DEFAULT_MAP_SLUG,
} from '../map-loader'
import { VORTEX_ARENA } from '../vortex-arena'
import { SIMPLE_ARENA } from '../simple-arena'

describe('map-loader', () => {
  describe('getMapConfig', () => {
    /**
     * Property 7: Map slug to config mapping
     * 
     * For any valid map slug, getMapConfig should return the corresponding MapConfig.
     * 
     * **Feature: map-selection, Property 7: Map slug to config mapping**
     * **Validates: Requirements 4.2**
     */
    it('returns SIMPLE_ARENA for "simple-arena" slug', () => {
      const config = getMapConfig('simple-arena')
      expect(config).toBe(SIMPLE_ARENA)
      expect(config.metadata.name).toBe('Runtime Ruins')
    })

    it('returns VORTEX_ARENA for "vortex-arena" slug', () => {
      const config = getMapConfig('vortex-arena')
      expect(config).toBe(VORTEX_ARENA)
      expect(config.metadata.name).toBe('Vortex Arena')
    })

    /**
     * Property 7: For any valid slug, returns correct config
     * 
     * **Feature: map-selection, Property 7: Map slug to config mapping**
     * **Validates: Requirements 4.2**
     */
    it('property: valid slugs return corresponding configs', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('simple-arena', 'vortex-arena'),
          (slug) => {
            const config = getMapConfig(slug)
            if (slug === 'simple-arena') {
              return config === SIMPLE_ARENA
            }
            if (slug === 'vortex-arena') {
              return config === VORTEX_ARENA
            }
            return false
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Property 8: Invalid map defaults to Simple Arena (Runtime Ruins)
     * 
     * For any invalid or missing map slug, getMapConfig should return SIMPLE_ARENA.
     * (Simple Arena / Runtime Ruins is the default quick play map)
     * 
     * **Feature: map-selection, Property 8: Invalid map defaults to Runtime Ruins**
     * **Validates: Requirements 4.5**
     */
    it('returns SIMPLE_ARENA for undefined', () => {
      expect(getMapConfig(undefined)).toBe(SIMPLE_ARENA)
    })

    it('returns SIMPLE_ARENA for null', () => {
      expect(getMapConfig(null)).toBe(SIMPLE_ARENA)
    })

    it('returns SIMPLE_ARENA for empty string', () => {
      expect(getMapConfig('')).toBe(SIMPLE_ARENA)
    })

    /**
     * Property 8: For any invalid slug, returns SIMPLE_ARENA
     * 
     * **Feature: map-selection, Property 8: Invalid map defaults to Runtime Ruins**
     * **Validates: Requirements 4.5**
     */
    it('property: invalid slugs default to SIMPLE_ARENA', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => s !== 'vortex-arena' && s !== 'simple-arena'),
          (invalidSlug) => {
            const config = getMapConfig(invalidSlug)
            return config === SIMPLE_ARENA
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('getAvailableMaps', () => {
    it('returns array of valid map slugs', () => {
      const maps = getAvailableMaps()
      // Registry contains: simple-arena, vortex-arena
      expect(maps).toContain('simple-arena')
      expect(maps).toContain('vortex-arena')
      expect(maps.length).toBe(2)
    })
  })

  describe('isValidMapSlug', () => {
    it('returns true for valid slugs', () => {
      expect(isValidMapSlug('simple-arena')).toBe(true)
      expect(isValidMapSlug('vortex-arena')).toBe(true)
    })

    it('returns false for invalid slugs', () => {
      expect(isValidMapSlug('invalid')).toBe(false)
      expect(isValidMapSlug('')).toBe(false)
      expect(isValidMapSlug('nexus-arena')).toBe(false) // Removed
    })
  })

  describe('getMapInfo', () => {
    it('returns map info for available maps', () => {
      // Runtime Ruins (simple-arena) is the default/primary map
      const simpleInfo = getMapInfo('simple-arena')
      expect(simpleInfo).toBeDefined()
      expect(simpleInfo?.name).toBe('Runtime Ruins')
      expect(simpleInfo?.theme).toBe('simple')

      // Vortex Arena is the secondary map
      const vortexInfo = getMapInfo('vortex-arena')
      expect(vortexInfo).toBeDefined()
      expect(vortexInfo?.name).toBe('Vortex Arena')
      expect(vortexInfo?.theme).toBe('volcanic')
    })

    it('returns undefined for invalid slugs', () => {
      expect(getMapInfo('invalid')).toBeUndefined()
      expect(getMapInfo('nexus-arena')).toBeUndefined() // Removed
    })
  })

  describe('AVAILABLE_MAPS', () => {
    it('contains both enabled maps with Runtime Ruins first', () => {
      expect(AVAILABLE_MAPS.length).toBe(2)
      // Runtime Ruins should be first (default quick play map)
      expect(AVAILABLE_MAPS[0].slug).toBe('simple-arena')
      expect(AVAILABLE_MAPS[0].name).toBe('Runtime Ruins')
      // Vortex Arena is secondary
      expect(AVAILABLE_MAPS[1].slug).toBe('vortex-arena')
    })
  })

  describe('DEFAULT_MAP_SLUG', () => {
    it('is simple-arena (Runtime Ruins)', () => {
      expect(DEFAULT_MAP_SLUG).toBe('simple-arena')
    })
  })
})
