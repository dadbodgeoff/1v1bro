/**
 * Property-based tests for TileCollisionAdapter
 * 
 * Tests:
 * - Property 4: Solid Tile Collision
 * - Property 5: World to Grid Coordinate Conversion
 * - Property 6: Out of Bounds Non-Walkable
 * 
 * @module terrain/__tests__/TileCollisionAdapter.properties.test
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { 
  TileCollisionAdapter, 
  worldToGrid, 
  gridToWorld, 
  isInBounds 
} from '../TileCollisionAdapter'
import type { ArenaMap, MapTile } from '../IndustrialArenaMap'

// Test configuration
const PBT_CONFIG = { numRuns: 100 }

// Arbitrary generators
const tileSize = fc.integer({ min: 16, max: 128 })
const worldCoord = fc.float({ min: -1000, max: 2000, noNaN: true })
const gridCoord = fc.integer({ min: -10, max: 30 })
const mapDimension = fc.integer({ min: 1, max: 20 })

/**
 * Generate a random ArenaMap for testing
 */
function generateArenaMap(width: number, height: number, solidPattern: boolean[][]): ArenaMap {
  const tiles: MapTile[][] = []
  
  for (let y = 0; y < height; y++) {
    const row: MapTile[] = []
    for (let x = 0; x < width; x++) {
      const isSolid = solidPattern[y]?.[x] ?? false
      row.push({
        floor: 0,
        solid: isSolid,
        damaging: false,
      })
    }
    tiles.push(row)
  }
  
  return {
    name: 'Test Map',
    width,
    height,
    tiles,
    spawn1: { x: 0, y: 0 },
    spawn2: { x: width - 1, y: height - 1 },
    tilesets: [],
  }
}

describe('TileCollisionAdapter Property Tests', () => {
  /**
   * **Feature: tileset-integration, Property 5: World to Grid Coordinate Conversion**
   * **Validates: Requirements 4.2**
   * 
   * For any world position (x, y) and tile size, the grid coordinates 
   * SHALL be calculated as (floor(x / tileSize), floor(y / tileSize))
   */
  describe('Property 5: World to Grid Coordinate Conversion', () => {
    it('worldToGrid calculates grid coordinates as floor(world / tileSize)', () => {
      fc.assert(
        fc.property(
          worldCoord,
          worldCoord,
          tileSize,
          (worldX, worldY, size) => {
            const { gridX, gridY } = worldToGrid(worldX, worldY, size)
            
            // Property: grid coordinates are floor(world / tileSize)
            expect(gridX).toBe(Math.floor(worldX / size))
            expect(gridY).toBe(Math.floor(worldY / size))
          }
        ),
        PBT_CONFIG
      )
    })

    it('gridToWorld and worldToGrid are consistent (grid -> world -> grid)', () => {
      fc.assert(
        fc.property(
          gridCoord,
          gridCoord,
          tileSize,
          (gx, gy, size) => {
            // Convert grid to world (center of tile)
            const world = gridToWorld(gx, gy, size)
            
            // Convert back to grid
            const { gridX, gridY } = worldToGrid(world.x, world.y, size)
            
            // Should get back the same grid coordinates
            expect(gridX).toBe(gx)
            expect(gridY).toBe(gy)
          }
        ),
        PBT_CONFIG
      )
    })
  })

  /**
   * **Feature: tileset-integration, Property 6: Out of Bounds Non-Walkable**
   * **Validates: Requirements 4.4**
   * 
   * For any position where gridX < 0 OR gridX >= mapWidth OR gridY < 0 OR gridY >= mapHeight,
   * the collision system SHALL return non-walkable (collision = true)
   */
  describe('Property 6: Out of Bounds Non-Walkable', () => {
    it('isInBounds returns false for out of bounds coordinates', () => {
      fc.assert(
        fc.property(
          mapDimension,
          mapDimension,
          gridCoord,
          gridCoord,
          (width, height, gx, gy) => {
            const inBounds = isInBounds(gx, gy, width, height)
            const expectedInBounds = gx >= 0 && gx < width && gy >= 0 && gy < height
            
            expect(inBounds).toBe(expectedInBounds)
          }
        ),
        PBT_CONFIG
      )
    })

    it('isWalkable returns false for out of bounds world positions', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 20 }),
          fc.integer({ min: 5, max: 20 }),
          fc.integer({ min: 32, max: 128 }),
          fc.oneof(
            // Negative X
            fc.float({ min: -1000, max: -1, noNaN: true }),
            // Negative Y
            fc.float({ min: -1000, max: -1, noNaN: true }),
          ),
          (width, height, size, negativeCoord) => {
            const map = generateArenaMap(width, height, [])
            const adapter = new TileCollisionAdapter(size)
            adapter.setMap(map)
            
            // Test with negative X
            expect(adapter.isWalkable(negativeCoord, size / 2)).toBe(false)
            
            // Test with negative Y
            expect(adapter.isWalkable(size / 2, negativeCoord)).toBe(false)
            
            // Test beyond map bounds
            expect(adapter.isWalkable(width * size + 10, size / 2)).toBe(false)
            expect(adapter.isWalkable(size / 2, height * size + 10)).toBe(false)
          }
        ),
        PBT_CONFIG
      )
    })
  })

  /**
   * **Feature: tileset-integration, Property 4: Solid Tile Collision**
   * **Validates: Requirements 4.1**
   * 
   * For any tile marked as solid in an ArenaMap, the collision system 
   * SHALL return true for collision checks when a player's bounding circle 
   * overlaps that tile's bounds
   */
  describe('Property 4: Solid Tile Collision', () => {
    it('isWalkable returns false for solid tiles', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 10 }),
          fc.integer({ min: 3, max: 10 }),
          fc.integer({ min: 32, max: 128 }),
          (width, height, size) => {
            // Create a map with a solid tile in the center
            const centerX = Math.floor(width / 2)
            const centerY = Math.floor(height / 2)
            
            const solidPattern: boolean[][] = []
            for (let y = 0; y < height; y++) {
              solidPattern[y] = []
              for (let x = 0; x < width; x++) {
                solidPattern[y][x] = (x === centerX && y === centerY)
              }
            }
            
            const map = generateArenaMap(width, height, solidPattern)
            const adapter = new TileCollisionAdapter(size)
            adapter.setMap(map)
            
            // Center of solid tile should not be walkable
            const solidWorldX = centerX * size + size / 2
            const solidWorldY = centerY * size + size / 2
            expect(adapter.isWalkable(solidWorldX, solidWorldY)).toBe(false)
            
            // Adjacent non-solid tile should be walkable
            if (centerX > 0) {
              const adjacentWorldX = (centerX - 1) * size + size / 2
              expect(adapter.isWalkable(adjacentWorldX, solidWorldY)).toBe(true)
            }
          }
        ),
        PBT_CONFIG
      )
    })

    it('checkCollision returns true when circle overlaps solid tile', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 10 }),
          fc.integer({ min: 5, max: 10 }),
          fc.integer({ min: 32, max: 80 }),
          fc.integer({ min: 10, max: 30 }),
          (width, height, size, radius) => {
            // Create a map with a solid tile in the center
            const centerX = Math.floor(width / 2)
            const centerY = Math.floor(height / 2)
            
            const solidPattern: boolean[][] = []
            for (let y = 0; y < height; y++) {
              solidPattern[y] = []
              for (let x = 0; x < width; x++) {
                solidPattern[y][x] = (x === centerX && y === centerY)
              }
            }
            
            const map = generateArenaMap(width, height, solidPattern)
            const adapter = new TileCollisionAdapter(size)
            adapter.setMap(map)
            
            // Position at center of solid tile should collide
            const solidWorldX = centerX * size + size / 2
            const solidWorldY = centerY * size + size / 2
            expect(adapter.checkCollision({ x: solidWorldX, y: solidWorldY }, radius)).toBe(true)
          }
        ),
        PBT_CONFIG
      )
    })
  })
})
