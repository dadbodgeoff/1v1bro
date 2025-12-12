/**
 * Arena System Property-Based Tests
 * Tests for TileMap, MapLoader, and map validation
 * 
 * @module arena/arena.test
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { TileMap } from './TileMap'
import { MapLoader } from './MapLoader'
import { validateMapConfig } from '../config/maps/map-schema'
import { SIMPLE_ARENA } from '../config/maps/simple-arena'
import type { MapConfig, TileDefinition } from '../config/maps/map-schema'
import type { TileType } from './types'

// ============================================================================
// Arbitraries (Generators)
// ============================================================================

const TILE_TYPES: TileType[] = [
  'floor', 'wall', 'half_wall', 'hazard_damage', 'hazard_slow',
  'hazard_emp', 'trap_pressure', 'trap_timed', 'teleporter', 'jump_pad'
]

const tileTypeArb = fc.constantFrom(...TILE_TYPES)

const tileDefinitionArb: fc.Arbitrary<TileDefinition> = fc.record({
  type: tileTypeArb
})

// Generate valid 16x9 tile grid
const validTileGridArb = fc.array(
  fc.array(tileDefinitionArb, { minLength: 16, maxLength: 16 }),
  { minLength: 9, maxLength: 9 }
)

// Grid coordinates
const gridXArb = fc.integer({ min: 0, max: 15 })
const gridYArb = fc.integer({ min: 0, max: 8 })

// Pixel coordinates within arena bounds
const pixelXArb = fc.integer({ min: 0, max: 1279 })
const pixelYArb = fc.integer({ min: 0, max: 719 })

// Out of bounds coordinates
const outOfBoundsGridXArb = fc.oneof(
  fc.integer({ min: -100, max: -1 }),
  fc.integer({ min: 16, max: 100 })
)
const outOfBoundsGridYArb = fc.oneof(
  fc.integer({ min: -100, max: -1 }),
  fc.integer({ min: 9, max: 100 })
)

// ============================================================================
// Property 1: Tile Map Consistency
// **Validates: Requirements 1.2, 1.5, 1.6**
// ============================================================================

describe('Property 1: Tile Map Consistency', () => {
  /**
   * **Feature: arena-aaa-upgrade, Property 1: Tile Map Consistency**
   * For any loaded config, getTileAt returns correct type
   */
  it('getTileAt returns correct tile type for any valid grid position', () => {
    fc.assert(
      fc.property(
        validTileGridArb,
        gridXArb,
        gridYArb,
        (tiles, gridX, gridY) => {
          const tileMap = new TileMap()
          tileMap.load(tiles)
          
          const tile = tileMap.getTileAt(gridX, gridY)
          
          expect(tile).not.toBeNull()
          expect(tile!.type).toBe(tiles[gridY][gridX].type)
          expect(tile!.gridX).toBe(gridX)
          expect(tile!.gridY).toBe(gridY)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: arena-aaa-upgrade, Property 1: Tile Map Consistency**
   * getTileAtPixel correctly converts coordinates
   */
  it('getTileAtPixel correctly converts pixel to grid coordinates', () => {
    fc.assert(
      fc.property(
        validTileGridArb,
        pixelXArb,
        pixelYArb,
        (tiles, pixelX, pixelY) => {
          const tileMap = new TileMap()
          tileMap.load(tiles)
          
          const tile = tileMap.getTileAtPixel(pixelX, pixelY)
          const expectedGridX = Math.floor(pixelX / 80)
          const expectedGridY = Math.floor(pixelY / 80)
          
          expect(tile).not.toBeNull()
          expect(tile!.gridX).toBe(expectedGridX)
          expect(tile!.gridY).toBe(expectedGridY)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: arena-aaa-upgrade, Property 1: Tile Map Consistency**
   * Out of bounds coordinates return null
   */
  it('getTileAt returns null for out of bounds coordinates', () => {
    fc.assert(
      fc.property(
        validTileGridArb,
        fc.oneof(
          fc.tuple(outOfBoundsGridXArb, gridYArb),
          fc.tuple(gridXArb, outOfBoundsGridYArb),
          fc.tuple(outOfBoundsGridXArb, outOfBoundsGridYArb)
        ),
        (tiles, [gridX, gridY]) => {
          const tileMap = new TileMap()
          tileMap.load(tiles)
          
          const tile = tileMap.getTileAt(gridX, gridY)
          expect(tile).toBeNull()
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: arena-aaa-upgrade, Property 1: Tile Map Consistency**
   * Pixel to grid conversion is consistent with direct grid access
   */
  it('pixelToGrid and getTileAt are consistent', () => {
    fc.assert(
      fc.property(
        validTileGridArb,
        pixelXArb,
        pixelYArb,
        (tiles, pixelX, pixelY) => {
          const tileMap = new TileMap()
          tileMap.load(tiles)
          
          const { gridX, gridY } = tileMap.pixelToGrid(pixelX, pixelY)
          const tileFromPixel = tileMap.getTileAtPixel(pixelX, pixelY)
          const tileFromGrid = tileMap.getTileAt(gridX, gridY)
          
          expect(tileFromPixel).toEqual(tileFromGrid)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ============================================================================
// Property 10: Map Configuration Validation
// **Validates: Requirements 9.2, 9.3, 9.7**
// ============================================================================

describe('Property 10: Map Configuration Validation', () => {
  /**
   * **Feature: arena-aaa-upgrade, Property 10: Map Configuration Validation**
   * Valid SIMPLE_ARENA config passes validation
   */
  it('SIMPLE_ARENA passes validation', () => {
    const result = validateMapConfig(SIMPLE_ARENA)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  /**
   * **Feature: arena-aaa-upgrade, Property 10: Map Configuration Validation**
   * Unpaired teleporters are detected
   */
  it('detects unpaired teleporters', () => {
    const invalidConfig: MapConfig = {
      ...SIMPLE_ARENA,
      teleporters: [
        { id: 'tp_single', pairId: 'orphan', position: { x: 100, y: 100 }, radius: 30 }
      ]
    }
    
    const result = validateMapConfig(invalidConfig)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('teleporter') || e.includes('Teleporter'))).toBe(true)
  })

  /**
   * **Feature: arena-aaa-upgrade, Property 10: Map Configuration Validation**
   * Invalid tile grid dimensions are detected
   */
  it('detects invalid tile grid dimensions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 8 }),  // Wrong row count
        (rowCount) => {
          const invalidTiles = Array(rowCount).fill(null).map(() =>
            Array(16).fill({ type: 'floor' as TileType })
          )
          
          const invalidConfig: MapConfig = {
            ...SIMPLE_ARENA,
            tiles: invalidTiles
          }
          
          const result = validateMapConfig(invalidConfig)
          expect(result.valid).toBe(false)
          expect(result.errors.some(e => e.includes('row') || e.includes('9'))).toBe(true)
        }
      ),
      { numRuns: 8 }
    )
  })

  /**
   * **Feature: arena-aaa-upgrade, Property 10: Map Configuration Validation**
   * Invalid map name length is detected
   */
  it('detects invalid map name length', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string({ minLength: 0, maxLength: 2 }),  // Too short
          fc.string({ minLength: 51, maxLength: 100 }) // Too long
        ),
        (name) => {
          const invalidConfig: MapConfig = {
            ...SIMPLE_ARENA,
            metadata: { ...SIMPLE_ARENA.metadata, name }
          }
          
          const result = validateMapConfig(invalidConfig)
          expect(result.valid).toBe(false)
          expect(result.errors.some(e => e.toLowerCase().includes('name'))).toBe(true)
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * **Feature: arena-aaa-upgrade, Property 10: Map Configuration Validation**
   * Invalid semver version is detected
   */
  it('detects invalid semver version', () => {
    const invalidVersions = ['1.0', 'v1.0.0', '1', 'abc', '1.0.0.0', '']
    
    for (const version of invalidVersions) {
      const invalidConfig: MapConfig = {
        ...SIMPLE_ARENA,
        metadata: { ...SIMPLE_ARENA.metadata, version }
      }
      
      const result = validateMapConfig(invalidConfig)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.toLowerCase().includes('version'))).toBe(true)
    }
  })

  /**
   * **Feature: arena-aaa-upgrade, Property 10: Map Configuration Validation**
   * Spawn points not on floor tiles are detected
   */
  it('detects spawn points not on floor tiles', () => {
    // Create a config where spawn point is on a wall tile
    const tilesWithWallAtSpawn = SIMPLE_ARENA.tiles.map((row, y) =>
      row.map((tile, x) => {
        // Player 1 spawn is at grid position (2, 4) based on pixel (200, 360)
        if (x === 2 && y === 4) {
          return { type: 'wall' as TileType }
        }
        return tile
      })
    )
    
    const invalidConfig: MapConfig = {
      ...SIMPLE_ARENA,
      tiles: tilesWithWallAtSpawn
    }
    
    const result = validateMapConfig(invalidConfig)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.toLowerCase().includes('spawn') || e.toLowerCase().includes('floor'))).toBe(true)
  })
})

// ============================================================================
// TileMap Unit Tests
// ============================================================================

describe('TileMap', () => {
  let tileMap: TileMap

  beforeEach(() => {
    tileMap = new TileMap()
  })

  it('loads SIMPLE_ARENA tiles correctly', () => {
    tileMap.load(SIMPLE_ARENA.tiles)
    
    expect(tileMap.getWidth()).toBe(16)
    expect(tileMap.getHeight()).toBe(9)
    expect(tileMap.getTileSize()).toBe(80)
  })

  it('setTile updates tile type', () => {
    tileMap.load(SIMPLE_ARENA.tiles)
    
    const originalTile = tileMap.getTileAt(0, 0)
    expect(originalTile).not.toBeNull()
    
    tileMap.setTile(0, 0, 'wall')
    
    const updatedTile = tileMap.getTileAt(0, 0)
    expect(updatedTile!.type).toBe('wall')
  })

  it('getTilesByType returns all tiles of specified type', () => {
    tileMap.load(SIMPLE_ARENA.tiles)
    
    const floorTiles = tileMap.getTilesByType('floor')
    
    // Count floors in SIMPLE_ARENA (all tiles are floor)
    let expectedFloorCount = 0
    for (const row of SIMPLE_ARENA.tiles) {
      for (const tile of row) {
        if (tile.type === 'floor') expectedFloorCount++
      }
    }
    
    expect(floorTiles.length).toBe(expectedFloorCount)
    expect(floorTiles.every(t => t.type === 'floor')).toBe(true)
  })

  it('gridToPixel returns center of tile', () => {
    tileMap.load(SIMPLE_ARENA.tiles)
    
    const { pixelX, pixelY } = tileMap.gridToPixel(0, 0)
    
    expect(pixelX).toBe(40)  // 0 * 80 + 40
    expect(pixelY).toBe(40)  // 0 * 80 + 40
  })

  it('isWalkable returns true for floor tiles', () => {
    tileMap.load(SIMPLE_ARENA.tiles)
    
    // Floor should be walkable
    const floorTile = tileMap.getTilesByType('floor')[0]
    if (floorTile) {
      expect(tileMap.isWalkable(floorTile.gridX, floorTile.gridY)).toBe(true)
    }
  })
})

// ============================================================================
// MapLoader Unit Tests
// ============================================================================

describe('MapLoader', () => {
  it('loads valid map configuration', () => {
    const loader = new MapLoader()
    const tileMap = loader.load(SIMPLE_ARENA)
    
    expect(tileMap).toBeInstanceOf(TileMap)
    expect(tileMap.getWidth()).toBe(16)
    expect(tileMap.getHeight()).toBe(9)
  })

  it('throws on invalid map configuration', () => {
    const loader = new MapLoader()
    const invalidConfig: MapConfig = {
      ...SIMPLE_ARENA,
      metadata: { ...SIMPLE_ARENA.metadata, name: 'ab' }  // Too short
    }
    
    expect(() => loader.load(invalidConfig)).toThrow()
  })

  it('emits map_loaded event', () => {
    const loader = new MapLoader()
    let eventReceived = false
    let eventData: { mapName: string; version: string } | null = null
    
    loader.on('map_loaded', (event) => {
      eventReceived = true
      eventData = { mapName: event.mapName, version: event.version }
    })
    
    loader.load(SIMPLE_ARENA)
    
    expect(eventReceived).toBe(true)
    expect(eventData!.mapName).toBe('Runtime Ruins')
    expect(eventData!.version).toBe('1.0.0')
  })

  it('static validate method works', () => {
    const result = MapLoader.validate(SIMPLE_ARENA)
    expect(result.valid).toBe(true)
  })
})
