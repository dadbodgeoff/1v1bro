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
  INDUSTRIAL_WALL_TILES, 
  COVER_TILES, 
  HAZARD_TILES, 
  PROP_TILES, 
  BORDER_TILES 
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
const P = PROP_TILES

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

/** Create a floor tile with a prop (decorative) */
const prop = (floorType: number, propType: number): MapTile => ({
  floor: floorType,
  prop: propType,
  solid: false,
  damaging: false,
})

/** Create a pickup tile */
const pickup = (floorType: number, pickupType: number): MapTile => ({
  floor: floorType,
  hazard: pickupType, // Pickups use hazard layer
  solid: false,
  damaging: false,
})

// ============================================================================
// Industrial Arena Map Definition
// ============================================================================

/**
 * 20x12 Industrial Military Arena
 * 
 * Layout concept:
 * - Concrete floor base with metal walkways
 * - Cover positions in strategic locations
 * - Hazard zones in center and corners
 * - Spawn points on opposite sides
 */
export const INDUSTRIAL_ARENA: ArenaMap = {
  name: 'Industrial Facility',
  width: 20,
  height: 12,
  tilesets: ['floor-tiles', 'wall-tiles', 'cover-tiles', 'hazard-tiles', 'prop-tiles', 'arena-border'],
  spawn1: { x: 2, y: 6 },
  spawn2: { x: 17, y: 6 },
  tiles: [
    // Row 0 - Top edge
    [
      floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_CRACKED), floor(F.CONCRETE_PLAIN), floor(F.METAL_DIAMOND),
      floor(F.METAL_DIAMOND), floor(F.METAL_DIAMOND), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_STAINED), floor(F.CONCRETE_PLAIN),
      floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_STAINED), floor(F.CONCRETE_PLAIN), floor(F.METAL_DIAMOND), floor(F.METAL_DIAMOND),
      floor(F.METAL_DIAMOND), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_CRACKED), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN),
    ],
    // Row 1
    [
      floor(F.CONCRETE_PLAIN), obstacle(F.CONCRETE_PLAIN, C.SANDBAGS), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.METAL_DIAMOND),
      floor(F.METAL_GRATE), floor(F.METAL_DIAMOND), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), prop(F.CONCRETE_PLAIN, P.RUBBLE),
      prop(F.CONCRETE_PLAIN, P.BRICKS), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.METAL_DIAMOND), floor(F.METAL_GRATE),
      floor(F.METAL_DIAMOND), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), obstacle(F.CONCRETE_PLAIN, C.SANDBAGS), floor(F.CONCRETE_PLAIN),
    ],
    // Row 2
    [
      floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), obstacle(F.CONCRETE_PLAIN, C.WOODEN_CRATE), floor(F.CONCRETE_PLAIN),
      floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.TILE_WHITE), floor(F.TILE_WHITE), floor(F.TILE_DIRTY),
      floor(F.TILE_DIRTY), floor(F.TILE_WHITE), floor(F.TILE_WHITE), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN),
      floor(F.CONCRETE_PLAIN), obstacle(F.CONCRETE_PLAIN, C.WOODEN_CRATE), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN),
    ],
    // Row 3
    [
      floor(F.CONCRETE_TIRE_MARKS), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN),
      obstacle(F.CONCRETE_PLAIN, C.OIL_BARREL), floor(F.CONCRETE_PLAIN), floor(F.TILE_WHITE), hazard(F.TILE_BROKEN, H.TOXIC_WASTE, 10), hazard(F.TILE_BROKEN, H.TOXIC_WASTE, 10),
      hazard(F.TILE_BROKEN, H.TOXIC_WASTE, 10), hazard(F.TILE_BROKEN, H.TOXIC_WASTE, 10), floor(F.TILE_WHITE), floor(F.CONCRETE_PLAIN), obstacle(F.CONCRETE_PLAIN, C.OIL_BARREL),
      floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_TIRE_MARKS),
    ],
    // Row 4
    [
      floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), obstacle(F.CONCRETE_PLAIN, C.JERSEY_BARRIER), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN),
      floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.TILE_WHITE), floor(F.TILE_DIRTY), floor(F.DRAIN),
      floor(F.DRAIN), floor(F.TILE_DIRTY), floor(F.TILE_WHITE), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN),
      floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), obstacle(F.CONCRETE_PLAIN, C.JERSEY_BARRIER), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN),
    ],
    // Row 5 - Center row (spawn level)
    [
      floor(F.METAL_DIAMOND), floor(F.METAL_DIAMOND), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN),
      floor(F.CONCRETE_PLAIN), pickup(F.CONCRETE_PLAIN, H.AMMO_CRATE), floor(F.TILE_WHITE), floor(F.TILE_WHITE), floor(F.METAL_GRATE),
      floor(F.METAL_GRATE), floor(F.TILE_WHITE), floor(F.TILE_WHITE), pickup(F.CONCRETE_PLAIN, H.AMMO_CRATE), floor(F.CONCRETE_PLAIN),
      floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.METAL_DIAMOND), floor(F.METAL_DIAMOND),
    ],
    // Row 6 - Center row (spawn level)
    [
      floor(F.METAL_DIAMOND), floor(F.METAL_DIAMOND), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN),
      floor(F.CONCRETE_PLAIN), pickup(F.CONCRETE_PLAIN, H.HEALTH_KIT), floor(F.TILE_WHITE), floor(F.TILE_WHITE), floor(F.METAL_GRATE),
      floor(F.METAL_GRATE), floor(F.TILE_WHITE), floor(F.TILE_WHITE), pickup(F.CONCRETE_PLAIN, H.HEALTH_KIT), floor(F.CONCRETE_PLAIN),
      floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.METAL_DIAMOND), floor(F.METAL_DIAMOND),
    ],
    // Row 7
    [
      floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), obstacle(F.CONCRETE_PLAIN, C.JERSEY_BARRIER), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN),
      floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.TILE_WHITE), floor(F.TILE_DIRTY), floor(F.VENT),
      floor(F.VENT), floor(F.TILE_DIRTY), floor(F.TILE_WHITE), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN),
      floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), obstacle(F.CONCRETE_PLAIN, C.JERSEY_BARRIER), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN),
    ],
    // Row 8
    [
      floor(F.CONCRETE_TIRE_MARKS), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN),
      obstacle(F.CONCRETE_PLAIN, C.TIRES), floor(F.CONCRETE_PLAIN), floor(F.TILE_WHITE), hazard(F.TILE_BLOOD, H.FIRE, 15), hazard(F.TILE_BLOOD, H.FIRE, 15),
      hazard(F.TILE_BLOOD, H.FIRE, 15), hazard(F.TILE_BLOOD, H.FIRE, 15), floor(F.TILE_WHITE), floor(F.CONCRETE_PLAIN), obstacle(F.CONCRETE_PLAIN, C.TIRES),
      floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_TIRE_MARKS),
    ],
    // Row 9
    [
      floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), obstacle(F.CONCRETE_PLAIN, C.SHIPPING_CONTAINER), floor(F.CONCRETE_PLAIN),
      floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.TILE_WHITE), floor(F.TILE_WHITE), floor(F.TILE_DIRTY),
      floor(F.TILE_DIRTY), floor(F.TILE_WHITE), floor(F.TILE_WHITE), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN),
      floor(F.CONCRETE_PLAIN), obstacle(F.CONCRETE_PLAIN, C.SHIPPING_CONTAINER), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN),
    ],
    // Row 10
    [
      floor(F.CONCRETE_PLAIN), obstacle(F.CONCRETE_PLAIN, C.SUPPLY_PALLET), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.METAL_RUSTED),
      floor(F.METAL_GRATE), floor(F.METAL_RUSTED), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), prop(F.CONCRETE_PLAIN, P.PIPES),
      prop(F.CONCRETE_PLAIN, P.JUNK_PILE), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.METAL_RUSTED), floor(F.METAL_GRATE),
      floor(F.METAL_RUSTED), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), obstacle(F.CONCRETE_PLAIN, C.SUPPLY_PALLET), floor(F.CONCRETE_PLAIN),
    ],
    // Row 11 - Bottom edge
    [
      floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_STAINED), floor(F.CONCRETE_PLAIN), floor(F.METAL_RUSTED),
      floor(F.METAL_RUSTED), floor(F.METAL_RUSTED), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_CRACKED), floor(F.CONCRETE_PLAIN),
      floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_CRACKED), floor(F.CONCRETE_PLAIN), floor(F.METAL_RUSTED), floor(F.METAL_RUSTED),
      floor(F.METAL_RUSTED), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_STAINED), floor(F.CONCRETE_PLAIN), floor(F.CONCRETE_PLAIN),
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
