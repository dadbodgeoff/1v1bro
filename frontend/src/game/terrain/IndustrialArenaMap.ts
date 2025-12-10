/**
 * IndustrialArenaMap - A hand-crafted arena map using the new industrial tilesets
 * 
 * This defines a military facility arena with:
 * - Varied floor textures (concrete, metal, tile)
 * - Strategic cover positions (crates, barrels, sandbags)
 * - Hazard zones (toxic waste, fire)
 * - Chain-link fence border
 * - Spawn points for 2 players
 * 
 * @module terrain/IndustrialArenaMap
 */

import { 
  FLOOR_TILES, 
  COVER_TILES, 
  HAZARD_TILES,
} from './TilesetLoader'

// ============================================================================
// Types
// ============================================================================

export interface MapTile {
  /** Floor tile index from floor-tiles tileset */
  floor: number
  /** Optional obstacle tile (from cover-tiles) - blocks movement */
  obstacle?: number
  /** Optional hazard tile (from hazard-tiles) - deals damage */
  hazard?: number
  /** Optional prop tile (from prop-tiles) - decorative only */
  prop?: number
  /** Whether this tile blocks movement */
  solid: boolean
  /** Whether this tile deals damage */
  damaging: boolean
  /** Damage per second if damaging */
  damage?: number
}

export interface ArenaMap {
  /** Map name */
  name: string
  /** Map width in tiles */
  width: number
  /** Map height in tiles */
  height: number
  /** 2D array of map tiles [y][x] */
  tiles: MapTile[][]
  /** Player 1 spawn position */
  spawn1: { x: number; y: number }
  /** Player 2 spawn position */
  spawn2: { x: number; y: number }
  /** Tilesets required for this map */
  tilesets: string[]
}

// ============================================================================
// Helper Functions
// ============================================================================

const F = FLOOR_TILES
const C = COVER_TILES
const H = HAZARD_TILES

/** Create a basic floor tile */
const floor = (floorType: number): MapTile => ({
  floor: floorType,
  solid: false,
  damaging: false,
})

/** Create a floor tile with an obstacle */
const obstacle = (floorType: number, obstacleType: number): MapTile => ({
  floor: floorType,
  obstacle: obstacleType,
  solid: true,
  damaging: false,
})

/** Create a floor tile with a hazard */
const hazard = (floorType: number, hazardType: number, damage: number): MapTile => ({
  floor: floorType,
  hazard: hazardType,
  solid: false,
  damaging: true,
  damage,
})

// ============================================================================
// Industrial Arena Map Definition
// ============================================================================

/**
 * 16x9 Industrial Military Arena - Enterprise Quality Design
 * 
 * Grid: 16 columns × 9 rows = 144 tiles total
 * 
 * Floor Tiles Available (floor-tiles.jpg 4x4 = 16 tiles):
 * Index 0: Concrete Plain (gray)      Index 1: Concrete Cracked
 * Index 2: Concrete Stained           Index 3: Concrete Tire Marks  
 * Index 4: Metal Diamond (shiny)      Index 5: Metal Rusted (brown)
 * Index 6: Metal Grate (dark grid)    Index 7: Metal Riveted
 * Index 8: Tile White (cream)         Index 9: Tile Dirty (beige)
 * Index 10: Tile Broken               Index 11: Tile Blood (red stain)
 * Index 12: Drain                     Index 13: Vent
 * Index 14: Manhole                   Index 15: Arrow Marking
 * 
 * NOTE: The TilesetLoader now fixes checkered transparency patterns that were
 * baked into the JPG image. All concrete tiles (0-3) should now render properly.
 * 
 * Design Pattern:
 * - CONCRETE_STAINED (2) for border frame
 * - CONCRETE_PLAIN (0) for main play area
 * - CONCRETE_CRACKED (1) for texture variation
 * - CONCRETE_TIRE_MARKS (3) for center lane markings
 */
export const INDUSTRIAL_ARENA: ArenaMap = {
  name: 'Industrial Facility',
  width: 16,
  height: 9,
  tilesets: ['floor-tiles', 'cover-tiles', 'hazard-tiles', 'prop-tiles'],
  spawn1: { x: 1, y: 4 },
  spawn2: { x: 14, y: 4 },
  tiles: [
    // ═══════════════════════════════════════════════════════════════════════
    // ROW 0 (y=0): Top border - Stained concrete (darker)
    // ═══════════════════════════════════════════════════════════════════════
    [
      floor(F.CONCRETE_STAINED), floor(F.CONCRETE_STAINED), floor(F.CONCRETE_STAINED), floor(F.CONCRETE_STAINED), floor(F.CONCRETE_STAINED),
      floor(F.CONCRETE_STAINED), floor(F.CONCRETE_STAINED), floor(F.CONCRETE_STAINED), floor(F.CONCRETE_STAINED), floor(F.CONCRETE_STAINED),
      floor(F.CONCRETE_STAINED), floor(F.CONCRETE_STAINED), floor(F.CONCRETE_STAINED), floor(F.CONCRETE_STAINED), floor(F.CONCRETE_STAINED),
      floor(F.CONCRETE_STAINED),
    ],
    // ═══════════════════════════════════════════════════════════════════════
    // ROW 1 (y=1): Upper lane - plain concrete with corner sandbags
    // ═══════════════════════════════════════════════════════════════════════
    [
      floor(F.CONCRETE_STAINED), obstacle(F.CONCRETE_PLAIN, C.SANDBAGS), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_CRACKED), floor(F.CONCRETE_PLAIN),
      floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_TIRE_MARKS), floor(F.CONCRETE_TIRE_MARKS), floor(F.CONCRETE_PLAIN),
      floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_CRACKED), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), obstacle(F.CONCRETE_PLAIN, C.SANDBAGS),
      floor(F.CONCRETE_STAINED),
    ],
    // ═══════════════════════════════════════════════════════════════════════
    // ROW 2 (y=2): Upper play area - crates and hazard zone
    // ═══════════════════════════════════════════════════════════════════════
    [
      floor(F.CONCRETE_STAINED), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_CRACKED), obstacle(F.CONCRETE_PLAIN, C.WOODEN_CRATE), floor(F.CONCRETE_PLAIN),
      floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_TIRE_MARKS), hazard(F.CONCRETE_STAINED, H.TOXIC_WASTE, 10), hazard(F.CONCRETE_STAINED, H.TOXIC_WASTE, 10), floor(F.CONCRETE_TIRE_MARKS),
      floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), obstacle(F.CONCRETE_PLAIN, C.WOODEN_CRATE), floor(F.CONCRETE_CRACKED), floor(F.CONCRETE_PLAIN),
      floor(F.CONCRETE_STAINED),
    ],
    // ═══════════════════════════════════════════════════════════════════════
    // ROW 3 (y=3): Upper mid - barrel cover positions
    // ═══════════════════════════════════════════════════════════════════════
    [
      floor(F.CONCRETE_STAINED), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_CRACKED), floor(F.CONCRETE_PLAIN),
      obstacle(F.CONCRETE_PLAIN, C.OIL_BARREL), floor(F.CONCRETE_TIRE_MARKS), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_TIRE_MARKS),
      obstacle(F.CONCRETE_PLAIN, C.OIL_BARREL), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_CRACKED), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN),
      floor(F.CONCRETE_STAINED),
    ],
    // ═══════════════════════════════════════════════════════════════════════
    // ROW 4 (y=4): CENTER ROW - Spawn level, tire marks for lane
    // ═══════════════════════════════════════════════════════════════════════
    [
      floor(F.CONCRETE_STAINED), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN),
      floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_TIRE_MARKS), floor(F.CONCRETE_CRACKED), floor(F.CONCRETE_CRACKED), floor(F.CONCRETE_TIRE_MARKS),
      floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN),
      floor(F.CONCRETE_STAINED),
    ],
    // ═══════════════════════════════════════════════════════════════════════
    // ROW 5 (y=5): Lower mid - barrel cover positions (mirror of row 3)
    // ═══════════════════════════════════════════════════════════════════════
    [
      floor(F.CONCRETE_STAINED), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_CRACKED), floor(F.CONCRETE_PLAIN),
      obstacle(F.CONCRETE_PLAIN, C.OIL_BARREL), floor(F.CONCRETE_TIRE_MARKS), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_TIRE_MARKS),
      obstacle(F.CONCRETE_PLAIN, C.OIL_BARREL), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_CRACKED), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN),
      floor(F.CONCRETE_STAINED),
    ],
    // ═══════════════════════════════════════════════════════════════════════
    // ROW 6 (y=6): Lower play area - crates and fire hazard (mirror of row 2)
    // ═══════════════════════════════════════════════════════════════════════
    [
      floor(F.CONCRETE_STAINED), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_CRACKED), obstacle(F.CONCRETE_PLAIN, C.WOODEN_CRATE), floor(F.CONCRETE_PLAIN),
      floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_TIRE_MARKS), hazard(F.CONCRETE_STAINED, H.FIRE, 15), hazard(F.CONCRETE_STAINED, H.FIRE, 15), floor(F.CONCRETE_TIRE_MARKS),
      floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), obstacle(F.CONCRETE_PLAIN, C.WOODEN_CRATE), floor(F.CONCRETE_CRACKED), floor(F.CONCRETE_PLAIN),
      floor(F.CONCRETE_STAINED),
    ],
    // ═══════════════════════════════════════════════════════════════════════
    // ROW 7 (y=7): Lower lane - plain concrete with corner sandbags (mirror of row 1)
    // ═══════════════════════════════════════════════════════════════════════
    [
      floor(F.CONCRETE_STAINED), obstacle(F.CONCRETE_PLAIN, C.SANDBAGS), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_CRACKED), floor(F.CONCRETE_PLAIN),
      floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_TIRE_MARKS), floor(F.CONCRETE_TIRE_MARKS), floor(F.CONCRETE_PLAIN),
      floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_CRACKED), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), obstacle(F.CONCRETE_PLAIN, C.SANDBAGS),
      floor(F.CONCRETE_STAINED),
    ],
    // ═══════════════════════════════════════════════════════════════════════
    // ROW 8 (y=8): Bottom border - Stained concrete (mirror of row 0)
    // ═══════════════════════════════════════════════════════════════════════
    [
      floor(F.CONCRETE_STAINED), floor(F.CONCRETE_STAINED), floor(F.CONCRETE_STAINED), floor(F.CONCRETE_STAINED), floor(F.CONCRETE_STAINED),
      floor(F.CONCRETE_STAINED), floor(F.CONCRETE_STAINED), floor(F.CONCRETE_STAINED), floor(F.CONCRETE_STAINED), floor(F.CONCRETE_STAINED),
      floor(F.CONCRETE_STAINED), floor(F.CONCRETE_STAINED), floor(F.CONCRETE_STAINED), floor(F.CONCRETE_STAINED), floor(F.CONCRETE_STAINED),
      floor(F.CONCRETE_STAINED),
    ],
  ],
}

/**
 * Get the industrial arena map
 */
export function getIndustrialArena(): ArenaMap {
  return INDUSTRIAL_ARENA
}

/**
 * Check if a position is walkable
 */
export function isWalkable(map: ArenaMap, x: number, y: number): boolean {
  if (x < 0 || x >= map.width || y < 0 || y >= map.height) return false
  return !map.tiles[y][x].solid
}

/**
 * Get damage at a position (0 if none)
 */
export function getDamageAt(map: ArenaMap, x: number, y: number): number {
  if (x < 0 || x >= map.width || y < 0 || y >= map.height) return 0
  const tile = map.tiles[y][x]
  return tile.damaging ? (tile.damage || 0) : 0
}
