/**
 * Property-based tests for TileHazardAdapter
 * 
 * Tests:
 * - Property 7: Hazard Damage Application
 * - Property 8: Maximum Hazard Damage
 * 
 * @module terrain/__tests__/TileHazardAdapter.properties.test
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { TileHazardAdapter } from '../TileHazardAdapter'
import type { ArenaMap, MapTile } from '../IndustrialArenaMap'

// Test configuration
const PBT_CONFIG = { numRuns: 100 }

// Arbitrary generators
const damageValue = fc.integer({ min: 1, max: 50 })
const duration = fc.float({ min: Math.fround(0.1), max: Math.fround(10), noNaN: true })
const tileSize = fc.integer({ min: 32, max: 128 })

/**
 * Generate a random ArenaMap with hazard tiles for testing
 */
function generateHazardMap(
  width: number, 
  height: number, 
  hazardTiles: Array<{ x: number; y: number; damage: number }>
): ArenaMap {
  const tiles: MapTile[][] = []
  
  for (let y = 0; y < height; y++) {
    const row: MapTile[] = []
    for (let x = 0; x < width; x++) {
      const hazard = hazardTiles.find(h => h.x === x && h.y === y)
      row.push({
        floor: 0,
        solid: false,
        damaging: !!hazard,
        damage: hazard?.damage,
      })
    }
    tiles.push(row)
  }
  
  return {
    name: 'Test Hazard Map',
    width,
    height,
    tiles,
    spawn1: { x: 0, y: 0 },
    spawn2: { x: width - 1, y: height - 1 },
    tilesets: [],
  }
}

describe('TileHazardAdapter Property Tests', () => {
  /**
   * **Feature: tileset-integration, Property 7: Hazard Damage Application**
   * **Validates: Requirements 5.1**
   * 
   * For any tile marked as damaging with a damage value D, when a player 
   * stands on that tile for T seconds, the total damage applied SHALL be 
   * D * T (within floating point tolerance)
   */
  describe('Property 7: Hazard Damage Application', () => {
    it('getDamageAtPosition returns correct damage value for hazard tiles', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 15 }),
          fc.integer({ min: 5, max: 15 }),
          tileSize,
          damageValue,
          (width, height, size, damage) => {
            // Place a hazard tile in the center
            const centerX = Math.floor(width / 2)
            const centerY = Math.floor(height / 2)
            
            const map = generateHazardMap(width, height, [
              { x: centerX, y: centerY, damage }
            ])
            
            const adapter = new TileHazardAdapter(size)
            adapter.setMap(map)
            
            // Center of hazard tile should return the damage value
            const worldX = centerX * size + size / 2
            const worldY = centerY * size + size / 2
            
            expect(adapter.getDamageAtPosition(worldX, worldY)).toBe(damage)
          }
        ),
        PBT_CONFIG
      )
    })

    it('calculateDamageForDuration returns damage * duration', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 15 }),
          fc.integer({ min: 5, max: 15 }),
          tileSize,
          damageValue,
          duration,
          (width, height, size, damage, time) => {
            const centerX = Math.floor(width / 2)
            const centerY = Math.floor(height / 2)
            
            const map = generateHazardMap(width, height, [
              { x: centerX, y: centerY, damage }
            ])
            
            const adapter = new TileHazardAdapter(size)
            adapter.setMap(map)
            
            const worldX = centerX * size + size / 2
            const worldY = centerY * size + size / 2
            
            const totalDamage = adapter.calculateDamageForDuration(worldX, worldY, time)
            const expectedDamage = damage * time
            
            // Allow small floating point tolerance
            expect(Math.abs(totalDamage - expectedDamage)).toBeLessThan(0.001)
          }
        ),
        PBT_CONFIG
      )
    })

    it('getDamageAtPosition returns 0 for non-hazard tiles', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 15 }),
          fc.integer({ min: 5, max: 15 }),
          tileSize,
          (width, height, size) => {
            // Create map with no hazards
            const map = generateHazardMap(width, height, [])
            
            const adapter = new TileHazardAdapter(size)
            adapter.setMap(map)
            
            // Any position should return 0 damage
            const worldX = size / 2
            const worldY = size / 2
            
            expect(adapter.getDamageAtPosition(worldX, worldY)).toBe(0)
          }
        ),
        PBT_CONFIG
      )
    })

    it('getDamageAtPosition uses default damage of 10 when not specified', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 15 }),
          fc.integer({ min: 5, max: 15 }),
          tileSize,
          (width, height, size) => {
            const centerX = Math.floor(width / 2)
            const centerY = Math.floor(height / 2)
            
            // Create map with hazard but no damage value
            const tiles: MapTile[][] = []
            for (let y = 0; y < height; y++) {
              const row: MapTile[] = []
              for (let x = 0; x < width; x++) {
                row.push({
                  floor: 0,
                  solid: false,
                  damaging: x === centerX && y === centerY,
                  // No damage value specified
                })
              }
              tiles.push(row)
            }
            
            const map: ArenaMap = {
              name: 'Test',
              width,
              height,
              tiles,
              spawn1: { x: 0, y: 0 },
              spawn2: { x: width - 1, y: height - 1 },
              tilesets: [],
            }
            
            const adapter = new TileHazardAdapter(size)
            adapter.setMap(map)
            
            const worldX = centerX * size + size / 2
            const worldY = centerY * size + size / 2
            
            // Should use default damage of 10
            expect(adapter.getDamageAtPosition(worldX, worldY)).toBe(10)
          }
        ),
        PBT_CONFIG
      )
    })
  })

  /**
   * **Feature: tileset-integration, Property 8: Maximum Hazard Damage**
   * **Validates: Requirements 5.4**
   * 
   * For any set of overlapping hazard tiles with damage values [D1, D2, ..., Dn],
   * the damage applied per second SHALL equal max(D1, D2, ..., Dn)
   */
  describe('Property 8: Maximum Hazard Damage', () => {
    it('getMaxDamageAtPosition returns maximum damage from overlapping hazards', () => {
      fc.assert(
        fc.property(
          tileSize,
          fc.array(damageValue, { minLength: 2, maxLength: 5 }),
          (size, damages) => {
            // Create a 3x3 map with multiple adjacent hazard tiles
            const width = 3
            const height = 3
            
            // Place hazards in a cross pattern around center
            const hazardTiles = [
              { x: 1, y: 1, damage: damages[0] },
              { x: 0, y: 1, damage: damages[1] ?? damages[0] },
              { x: 2, y: 1, damage: damages[2] ?? damages[0] },
            ]
            
            const map = generateHazardMap(width, height, hazardTiles)
            const adapter = new TileHazardAdapter(size)
            adapter.setMap(map)
            
            // Position at center with radius that overlaps multiple tiles
            const worldX = 1 * size + size / 2
            const worldY = 1 * size + size / 2
            const radius = size // Large enough to overlap adjacent tiles
            
            const maxDamage = adapter.getMaxDamageAtPosition(worldX, worldY, radius)
            const expectedMax = Math.max(...hazardTiles.map(h => h.damage))
            
            expect(maxDamage).toBe(expectedMax)
          }
        ),
        PBT_CONFIG
      )
    })

    it('getMaxDamageAtPosition returns 0 when no hazards overlap', () => {
      fc.assert(
        fc.property(
          tileSize,
          damageValue,
          (size, damage) => {
            // Create a map with hazard in corner
            const width = 5
            const height = 5
            
            const map = generateHazardMap(width, height, [
              { x: 0, y: 0, damage }
            ])
            
            const adapter = new TileHazardAdapter(size)
            adapter.setMap(map)
            
            // Position far from hazard
            const worldX = 4 * size + size / 2
            const worldY = 4 * size + size / 2
            const radius = 10 // Small radius
            
            expect(adapter.getMaxDamageAtPosition(worldX, worldY, radius)).toBe(0)
          }
        ),
        PBT_CONFIG
      )
    })
  })
})
