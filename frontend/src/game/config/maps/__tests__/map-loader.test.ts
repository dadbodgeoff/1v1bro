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

    /**
     * Property 7: For any valid slug, returns correct config
     * 
     * **Feature: map-selection, Property 7: Map slug to config mapping**
     * **Validates: Requirements 4.2**
     */
    it('property: valid slugs return corresponding configs', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('nexus-arena', 'vortex-arena'),
          (slug) => {
            const config = getMapConfig(slug)
            // Config should have matching slug in metadata or be the expected config
            if (slug === 'nexus-arena') {
              return config === NEXUS_ARENA
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
     * Property 8: Invalid map defaults to Nexus
     * 
     * For any invalid or missing map slug, getMapConfig should return NEXUS_ARENA.
     * 
     * **Feature: map-selection, Property 8: Invalid map defaults to Nexus**
     * **Validates: Requirements 4.5**
     */
    it('returns NEXUS_ARENA for undefined', () => {
      expect(getMapConfig(undefined)).toBe(NEXUS_ARENA)
    })

    it('returns NEXUS_ARENA for null', () => {
      expect(getMapConfig(null)).toBe(NEXUS_ARENA)
    })

    it('returns NEXUS_ARENA for empty string', () => {
      expect(getMapConfig('')).toBe(NEXUS_ARENA)
    })

    /**
     * Property 8: For any invalid slug, returns NEXUS_ARENA
     * 
     * **Feature: map-selection, Property 8: Invalid map defaults to Nexus**
     * **Validates: Requirements 4.5**
     */
    it('property: invalid slugs default to NEXUS_ARENA', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => s !== 'nexus-arena' && s !== 'vortex-arena'),
          (invalidSlug) => {
            const config = getMapConfig(invalidSlug)
            return config === NEXUS_ARENA
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('getAvailableMaps', () => {
    it('returns array of valid map slugs', () => {
      const maps = getAvailableMaps()
      expect(maps).toContain('nexus-arena')
      expect(maps).toContain('vortex-arena')
      expect(maps.length).toBe(2)
    })
  })

  describe('isValidMapSlug', () => {
    it('returns true for valid slugs', () => {
      expect(isValidMapSlug('nexus-arena')).toBe(true)
      expect(isValidMapSlug('vortex-arena')).toBe(true)
    })

    it('returns false for invalid slugs', () => {
      expect(isValidMapSlug('invalid')).toBe(false)
      expect(isValidMapSlug('')).toBe(false)
    })
  })

  describe('getMapInfo', () => {
    it('returns map info for valid slugs', () => {
      const nexusInfo = getMapInfo('nexus-arena')
      expect(nexusInfo).toBeDefined()
      expect(nexusInfo?.name).toBe('Nexus Arena')
      expect(nexusInfo?.theme).toBe('space')

      const vortexInfo = getMapInfo('vortex-arena')
      expect(vortexInfo).toBeDefined()
      expect(vortexInfo?.name).toBe('Vortex Arena')
      expect(vortexInfo?.theme).toBe('volcanic')
    })

    it('returns undefined for invalid slugs', () => {
      expect(getMapInfo('invalid')).toBeUndefined()
    })
  })

  describe('AVAILABLE_MAPS', () => {
    it('contains all available maps', () => {
      expect(AVAILABLE_MAPS.length).toBe(2)
      expect(AVAILABLE_MAPS.map(m => m.slug)).toContain('nexus-arena')
      expect(AVAILABLE_MAPS.map(m => m.slug)).toContain('vortex-arena')
    })
  })
})
