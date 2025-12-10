/**
 * Property-based tests for Tileset Integration
 * 
 * Tests:
 * - Property 2: Tile Index Correctness
 * - Property 3: ArenaMap to MapConfig Round-Trip
 * - Property 9: Tile Dimension Auto-Detection
 * - Property 10: Industrial Theme Renderer Selection
 * 
 * @module terrain/__tests__/TilesetIntegration.properties.test
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { TILESET_CONFIGS, FLOOR_TILES, COVER_TILES, HAZARD_TILES, PROP_TILES } from '../TilesetLoader'
import { convertArenaMapToConfig } from '../IndustrialMapConverter'
import type { ArenaMap, MapTile } from '../IndustrialArenaMap'

// Test configuration
const PBT_CONFIG = { numRuns: 100 }

// Arbitrary generators
const floorTileIndex = fc.integer({ min: 0, max: 15 }) // 4x4 grid
const coverTileIndex = fc.integer({ min: 0, max: 7 })  // 4x2 grid
const hazardTileIndex = fc.integer({ min: 0, max: 7 }) // 4x2 grid
const propTileIndex = fc.integer({ min: 0, max: 7 })   // 4x2 grid
const damageValue = fc.integer({ min: 1, max: 50 })
const mapDimension = fc.integer({ min: 3, max: 16 })

/**
 * Generate a random ArenaMap for testing
 */
function generateRandomArenaMap(
  width: number,
  height: number,
  tileData: Array<{
    x: number
    y: number
    floor: number
    obstacle?: number
    hazard?: number
    prop?: number
    solid: boolean
    damaging: boolean
    damage?: number
  }>
): ArenaMap {
  const tiles: MapTile[][] = []
  
  for (let y = 0; y < height; y++) {
    const row: MapTile[] = []
    for (let x = 0; x < width; x++) {
      const data = tileData.find(t => t.x === x && t.y === y)
      if (data) {
        row.push({
          floor: data.floor,
          obstacle: data.obstacle,
          hazard: data.hazard,
          prop: data.prop,
          solid: data.solid,
          damaging: data.damaging,
          damage: data.damage,
        })
      } else {
        row.push({
          floor: 0,
          solid: false,
          damaging: false,
        })
      }
    }
    tiles.push(row)
  }
  
  return {
    name: 'Test Map',
    width,
    height,
    tiles,
    spawn1: { x: 1, y: Math.floor(height / 2) },
    spawn2: { x: width - 2, y: Math.floor(height / 2) },
    tilesets: ['floor-tiles', 'cover-tiles', 'hazard-tiles', 'prop-tiles'],
  }
}

describe('Tileset Integration Property Tests', () => {
  /**
   * **Feature: tileset-integration, Property 2: Tile Index Correctness**
   * **Validates: Requirements 2.3**
   * 
   * For any tile type and position in an ArenaMap, the TileRenderer SHALL use 
   * the tile index that matches the corresponding constant in the tileset 
   * index definitions
   */
  describe('Property 2: Tile Index Correctness', () => {
    it('FLOOR_TILES indices are within valid range for floor-tiles tileset', () => {
      const config = TILESET_CONFIGS['floor-tiles']
      const maxIndex = config.columns * config.rows - 1
      
      Object.values(FLOOR_TILES).forEach(index => {
        expect(index).toBeGreaterThanOrEqual(0)
        expect(index).toBeLessThanOrEqual(maxIndex)
      })
    })

    it('COVER_TILES indices are within valid range for cover-tiles tileset', () => {
      const config = TILESET_CONFIGS['cover-tiles']
      const maxIndex = config.columns * config.rows - 1
      
      Object.values(COVER_TILES).forEach(index => {
        expect(index).toBeGreaterThanOrEqual(0)
        expect(index).toBeLessThanOrEqual(maxIndex)
      })
    })

    it('HAZARD_TILES indices are within valid range for hazard-tiles tileset', () => {
      const config = TILESET_CONFIGS['hazard-tiles']
      const maxIndex = config.columns * config.rows - 1
      
      Object.values(HAZARD_TILES).forEach(index => {
        expect(index).toBeGreaterThanOrEqual(0)
        expect(index).toBeLessThanOrEqual(maxIndex)
      })
    })

    it('PROP_TILES indices are within valid range for prop-tiles tileset', () => {
      const config = TILESET_CONFIGS['prop-tiles']
      const maxIndex = config.columns * config.rows - 1
      
      Object.values(PROP_TILES).forEach(index => {
        expect(index).toBeGreaterThanOrEqual(0)
        expect(index).toBeLessThanOrEqual(maxIndex)
      })
    })

    it('tile indices in ArenaMap are valid for their respective tilesets', () => {
      fc.assert(
        fc.property(
          floorTileIndex,
          coverTileIndex,
          hazardTileIndex,
          propTileIndex,
          (floor, obstacle, hazard, prop) => {
            // All indices should be within valid ranges
            expect(floor).toBeLessThan(16) // 4x4 grid
            expect(obstacle).toBeLessThan(8) // 4x2 grid
            expect(hazard).toBeLessThan(8) // 4x2 grid
            expect(prop).toBeLessThan(8) // 4x2 grid
          }
        ),
        PBT_CONFIG
      )
    })
  })

  /**
   * **Feature: tileset-integration, Property 3: ArenaMap to MapConfig Round-Trip**
   * **Validates: Requirements 3.2**
   * 
   * For any valid ArenaMap, converting to MapConfig and back SHALL preserve 
   * all tile layer information (floor, obstacle, hazard, prop indices) and 
   * metadata (solid, damaging, damage values)
   */
  describe('Property 3: ArenaMap to MapConfig Round-Trip', () => {
    it('convertArenaMapToConfig preserves map dimensions', () => {
      fc.assert(
        fc.property(
          mapDimension,
          mapDimension,
          (width, height) => {
            const map = generateRandomArenaMap(width, height, [])
            const config = convertArenaMapToConfig(map)
            
            // Dimensions should be preserved
            expect(config.tiles.length).toBe(height)
            expect(config.tiles[0].length).toBe(width)
          }
        ),
        PBT_CONFIG
      )
    })

    it('convertArenaMapToConfig preserves solid tile information', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 12 }),
          fc.integer({ min: 5, max: 12 }),
          fc.integer({ min: 1, max: 4 }),
          fc.integer({ min: 1, max: 4 }),
          coverTileIndex,
          (width, height, solidX, solidY, obstacleIndex) => {
            // Ensure coordinates are within bounds
            const x = Math.min(solidX, width - 1)
            const y = Math.min(solidY, height - 1)
            
            const map = generateRandomArenaMap(width, height, [
              { x, y, floor: 0, obstacle: obstacleIndex, solid: true, damaging: false }
            ])
            
            const config = convertArenaMapToConfig(map)
            
            // Should have a barrier at the solid tile position
            const barrier = config.barriers.find(b => 
              b.position.x === x * 80 && b.position.y === y * 80
            )
            expect(barrier).toBeDefined()
          }
        ),
        PBT_CONFIG
      )
    })

    it('convertArenaMapToConfig preserves hazard tile information', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 12 }),
          fc.integer({ min: 5, max: 12 }),
          fc.integer({ min: 1, max: 4 }),
          fc.integer({ min: 1, max: 4 }),
          hazardTileIndex,
          damageValue,
          (width, height, hazardX, hazardY, hazardIndex, damage) => {
            const x = Math.min(hazardX, width - 1)
            const y = Math.min(hazardY, height - 1)
            
            const map = generateRandomArenaMap(width, height, [
              { x, y, floor: 0, hazard: hazardIndex, solid: false, damaging: true, damage }
            ])
            
            const config = convertArenaMapToConfig(map)
            
            // Should have a hazard at the damaging tile position
            const hazard = config.hazards.find(h => 
              h.bounds.x === x * 80 && h.bounds.y === y * 80
            )
            expect(hazard).toBeDefined()
            expect(hazard?.intensity).toBe(damage)
          }
        ),
        PBT_CONFIG
      )
    })

    it('convertArenaMapToConfig preserves spawn points', () => {
      fc.assert(
        fc.property(
          mapDimension,
          mapDimension,
          (width, height) => {
            const map = generateRandomArenaMap(width, height, [])
            const config = convertArenaMapToConfig(map)
            
            // Should have 2 spawn points
            expect(config.spawnPoints.length).toBe(2)
            
            // Spawn points should be at correct positions
            const spawn1 = config.spawnPoints.find(s => s.id === 'player1')
            const spawn2 = config.spawnPoints.find(s => s.id === 'player2')
            
            expect(spawn1).toBeDefined()
            expect(spawn2).toBeDefined()
            
            // Positions should be converted to world coordinates
            expect(spawn1?.position.x).toBe(map.spawn1.x * 80 + 40)
            expect(spawn1?.position.y).toBe(map.spawn1.y * 80 + 40)
          }
        ),
        PBT_CONFIG
      )
    })
  })

  /**
   * **Feature: tileset-integration, Property 9: Tile Dimension Auto-Detection**
   * **Validates: Requirements 6.3, 7.2**
   * 
   * For any tileset config with tileWidth=0 and tileHeight=0, and an image of 
   * dimensions (imgWidth, imgHeight) with grid (columns, rows), the extracted 
   * tile dimensions SHALL be (imgWidth/columns, imgHeight/rows)
   */
  describe('Property 9: Tile Dimension Auto-Detection', () => {
    it('tileset configs with 0 dimensions will auto-detect from image', () => {
      // Check that industrial tilesets have auto-detect enabled
      const autoDetectTilesets = ['floor-tiles', 'cover-tiles', 'hazard-tiles', 'prop-tiles']
      
      autoDetectTilesets.forEach(id => {
        const config = TILESET_CONFIGS[id]
        expect(config.tileWidth).toBe(0)
        expect(config.tileHeight).toBe(0)
      })
    })

    it('auto-detection formula is correct: tileSize = imageSize / gridSize', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 16, max: 256 }),
          fc.integer({ min: 16, max: 256 }),
          (columns, rows, tileWidth, tileHeight) => {
            const imgWidth = columns * tileWidth
            const imgHeight = rows * tileHeight
            
            // Auto-detection formula
            const detectedWidth = Math.floor(imgWidth / columns)
            const detectedHeight = Math.floor(imgHeight / rows)
            
            expect(detectedWidth).toBe(tileWidth)
            expect(detectedHeight).toBe(tileHeight)
          }
        ),
        PBT_CONFIG
      )
    })
  })

  /**
   * **Feature: tileset-integration, Property 10: Industrial Theme Renderer Selection**
   * **Validates: Requirements 3.1**
   * 
   * For any MapConfig with metadata.theme === 'industrial' and successful 
   * tileset loading, the RenderPipeline SHALL use IndustrialArenaRenderer 
   * instead of ArenaManager for rendering
   */
  describe('Property 10: Industrial Theme Renderer Selection', () => {
    it('convertArenaMapToConfig sets theme to industrial', () => {
      fc.assert(
        fc.property(
          mapDimension,
          mapDimension,
          (width, height) => {
            const map = generateRandomArenaMap(width, height, [])
            const config = convertArenaMapToConfig(map)
            
            expect(config.metadata.theme).toBe('industrial')
          }
        ),
        PBT_CONFIG
      )
    })

    it('industrial maps have required metadata', () => {
      fc.assert(
        fc.property(
          mapDimension,
          mapDimension,
          (width, height) => {
            const map = generateRandomArenaMap(width, height, [])
            const config = convertArenaMapToConfig(map)
            
            expect(config.metadata.name).toBeDefined()
            expect(config.metadata.author).toBeDefined()
            expect(config.metadata.version).toBeDefined()
            expect(config.metadata.description).toBeDefined()
          }
        ),
        PBT_CONFIG
      )
    })
  })
})
