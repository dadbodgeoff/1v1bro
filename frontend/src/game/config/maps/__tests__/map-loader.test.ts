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
} from '../map-loader'
import { NEXUS_ARENA } from '../nexus-arena'
import { VORTEX_ARENA } from '../vortex-arena'
import { INDUSTRIAL_FACILITY } from '../industrial-facility'

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
    it('returns NEXUS_ARENA for "nexus-arena" slug', () => {
      const config = getMapConfig('nexus-arena')
      expect(config).toBe(NEXUS_ARENA)
      expect(config.metadata.name).toBe('Nexus Arena')
    })

    it('returns VORTEX_ARENA for "vortex-arena" slug', () => {
      const config = getMapConfig('vortex-arena')
      expect(config).toBe(VORTEX_ARENA)
      expect(config.metadata.name).toBe('Vortex Arena')
    })

    it('returns INDUSTRIAL_FACILITY for "industrial-facility" slug', () => {
      const config = getMapConfig('industrial-facility')
      expect(config).toBe(INDUSTRIAL_FACILITY)
      expect(config.metadata.name).toBe('Industrial Facility')
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
          fc.constantFrom('nexus-arena', 'vortex-arena', 'industrial-facility'),
          (slug) => {
            const config = getMapConfig(slug)
            // Config should have matching slug in metadata or be the expected config
            if (slug === 'nexus-arena') {
              return config === NEXUS_ARENA
            }
            if (slug === 'vortex-arena') {
              return config === VORTEX_ARENA
            }
            if (slug === 'industrial-facility') {
              return config === INDUSTRIAL_FACILITY
            }
            return false
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Property 8: Invalid map defaults to Vortex Arena
     * 
     * For any invalid or missing map slug, getMapConfig should return VORTEX_ARENA.
     * (Vortex Arena is the primary enabled map)
     * 
     * **Feature: map-selection, Property 8: Invalid map defaults to Vortex**
     * **Validates: Requirements 4.5**
     */
    it('returns VORTEX_ARENA for undefined', () => {
      expect(getMapConfig(undefined)).toBe(VORTEX_ARENA)
    })

    it('returns VORTEX_ARENA for null', () => {
      expect(getMapConfig(null)).toBe(VORTEX_ARENA)
    })

    it('returns VORTEX_ARENA for empty string', () => {
      expect(getMapConfig('')).toBe(VORTEX_ARENA)
    })

    /**
     * Property 8: For any invalid slug, returns VORTEX_ARENA
     * 
     * **Feature: map-selection, Property 8: Invalid map defaults to Vortex**
     * **Validates: Requirements 4.5**
     */
    it('property: invalid slugs default to VORTEX_ARENA', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => s !== 'nexus-arena' && s !== 'vortex-arena' && s !== 'industrial-facility'),
          (invalidSlug) => {
            const config = getMapConfig(invalidSlug)
            return config === VORTEX_ARENA
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('getAvailableMaps', () => {
    it('returns array of valid map slugs', () => {
      const maps = getAvailableMaps()
      // Registry contains all maps (nexus-arena, vortex-arena, industrial-facility)
      expect(maps).toContain('nexus-arena')
      expect(maps).toContain('vortex-arena')
      expect(maps).toContain('industrial-facility')
      expect(maps.length).toBe(3)
    })
  })

  describe('isValidMapSlug', () => {
    it('returns true for valid slugs', () => {
      expect(isValidMapSlug('nexus-arena')).toBe(true)
      expect(isValidMapSlug('vortex-arena')).toBe(true)
      expect(isValidMapSlug('industrial-facility')).toBe(true)
    })

    it('returns false for invalid slugs', () => {
      expect(isValidMapSlug('invalid')).toBe(false)
      expect(isValidMapSlug('')).toBe(false)
    })
  })

  describe('getMapInfo', () => {
    it('returns map info for enabled maps', () => {
      // Only Vortex Arena is currently enabled in AVAILABLE_MAPS
      const vortexInfo = getMapInfo('vortex-arena')
      expect(vortexInfo).toBeDefined()
      expect(vortexInfo?.name).toBe('Vortex Arena')
      expect(vortexInfo?.theme).toBe('volcanic')
    })

    it('returns undefined for disabled or invalid slugs', () => {
      // Nexus Arena is disabled via feature flag
      expect(getMapInfo('nexus-arena')).toBeUndefined()
      // Industrial Facility is disabled via feature flag
      expect(getMapInfo('industrial-facility')).toBeUndefined()
      // Invalid slug
      expect(getMapInfo('invalid')).toBeUndefined()
    })
  })

  describe('AVAILABLE_MAPS', () => {
    it('contains only enabled maps', () => {
      // Only Vortex Arena is currently enabled
      expect(AVAILABLE_MAPS.length).toBe(1)
      expect(AVAILABLE_MAPS.map(m => m.slug)).toContain('vortex-arena')
    })
  })
})
