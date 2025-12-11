/**
 * TileIndices - Named tile index constants for all tilesets
 * 
 * @module terrain/TileIndices
 */

/**
 * Named tile indices for grass tileset (4x4)
 */
export const GRASS_TILES = {
  // Row 0: Plain grass variants
  PLAIN_1: 0,
  PLAIN_2: 1,
  PLAIN_3: 2,
  PLAIN_4: 3,
  // Row 1: Grass with flowers
  FLOWERS_YELLOW: 4,
  FLOWERS_BLUE: 5,
  FLOWERS_WHITE: 6,
  FLOWERS_MIXED: 7,
  // Row 2: Grass with dirt patches
  DIRT_1: 8,
  DIRT_2: 9,
  DIRT_3: 10,
  DIRT_4: 11,
  // Row 3: Grass with stones/pebbles
  STONES_1: 12,
  STONES_2: 13,
  STONES_3: 14,
  STONES_4: 15,
}

/**
 * Named tile indices for sci-fi floor tileset (4x4)
 */
export const SCIFI_TILES = {
  // Row 0: Plain metal and circuit panels
  METAL_PLAIN: 0,
  CIRCUIT_PURPLE: 1,
  CIRCUIT_CYAN: 2,
  TECH_PANEL: 3,
  // Row 1: Grate and vent tiles
  GRATE_PURPLE: 4,
  GRATE_DARK: 5,
  VENT_CYAN: 6,
  ENERGY_CORE: 7,
  // Row 2: Hazard stripe tiles
  HAZARD_FULL: 8,
  HAZARD_CENTER: 9,
  HAZARD_BORDER: 10,
  METAL_ACCENT: 11,
  // Row 3: Special tiles
  DAMAGED: 12,
  POWER_BUTTON: 13,
  TELEPORTER: 14,
  FRAMED: 15,
}


/**
 * Named tile indices for water tileset (3x3 9-slice)
 */
export const WATER_TILES = {
  TOP_LEFT: 0,
  TOP: 1,
  TOP_RIGHT: 2,
  LEFT: 3,
  CENTER: 4,
  RIGHT: 5,
  BOTTOM_LEFT: 6,
  BOTTOM: 7,
  BOTTOM_RIGHT: 8,
}

/**
 * Named tile indices for stone wall tileset (3x3 9-slice)
 */
export const WALL_TILES = {
  TOP_LEFT: 0,
  TOP: 1,
  TOP_RIGHT: 2,
  LEFT: 3,
  CENTER: 4,
  RIGHT: 5,
  BOTTOM_LEFT: 6,
  BOTTOM: 7,
  BOTTOM_RIGHT: 8,
}

/**
 * Named tile indices for bush tileset (4x1)
 */
export const BUSH_TILES = {
  SMALL: 0,
  MEDIUM: 1,
  LARGE: 2,
  EXTRA_LARGE: 3,
}

/**
 * Named tile indices for box destruction sequence (4x1)
 */
export const BOX_TILES = {
  INTACT: 0,
  DAMAGED: 1,
  BREAKING: 2,
  DEBRIS: 3,
}

/**
 * Named tile indices for industrial floor tileset (4x4)
 */
export const FLOOR_TILES = {
  // Row 0: Concrete
  CONCRETE_PLAIN: 0,
  CONCRETE_CRACKED: 1,
  CONCRETE_STAINED: 2,
  CONCRETE_TIRE_MARKS: 3,
  // Row 1: Metal
  METAL_DIAMOND: 4,
  METAL_RUSTED: 5,
  METAL_GRATE: 6,
  METAL_RIVETED: 7,
  // Row 2: Tile
  TILE_WHITE: 8,
  TILE_DIRTY: 9,
  TILE_BROKEN: 10,
  TILE_BLOOD: 11,
  // Row 3: Special
  DRAIN: 12,
  VENT: 13,
  MANHOLE: 14,
  ARROW_MARKING: 15,
}

/**
 * Named tile indices for industrial wall tileset (3x3 9-slice)
 */
export const INDUSTRIAL_WALL_TILES = {
  TOP_LEFT: 0,
  TOP: 1,
  TOP_RIGHT: 2,
  LEFT: 3,
  CENTER: 4,
  RIGHT: 5,
  BOTTOM_LEFT: 6,
  BOTTOM: 7,
  BOTTOM_RIGHT: 8,
}

/**
 * Named tile indices for cover/obstacle tileset (4x2)
 */
export const COVER_TILES = {
  // Row 0: Large cover
  WOODEN_CRATE: 0,
  SHIPPING_CONTAINER: 1,
  SANDBAGS: 2,
  JERSEY_BARRIER: 3,
  // Row 1: Small cover
  OIL_BARREL: 4,
  TIRES: 5,
  VEHICLE_WRECK: 6,
  SUPPLY_PALLET: 7,
}

/**
 * Named tile indices for hazard tileset (4x2)
 */
export const HAZARD_TILES = {
  // Row 0: Hazards
  TOXIC_WASTE: 0,
  OIL_SLICK: 1,
  FIRE: 2,
  ELECTRIC: 3,
  // Row 1: Interactables
  PRESSURE_PLATE: 4,
  AMMO_CRATE: 5,
  HEALTH_KIT: 6,
  LADDER_HATCH: 7,
}

/**
 * Named tile indices for prop/debris tileset (4x2)
 */
export const PROP_TILES = {
  // Row 0: Debris
  RUBBLE: 0,
  BRICKS: 1,
  PIPES: 2,
  JUNK_PILE: 3,
  // Row 1: Props
  CONCRETE_SLAB: 4,
  METAL_GRATE_PROP: 5,
  BARREL_FALLEN: 6,
  TIRE_SINGLE: 7,
}

/**
 * Named tile indices for arena border tileset (3x3 9-slice)
 */
export const BORDER_TILES = {
  TOP_LEFT: 0,
  TOP: 1,
  TOP_RIGHT: 2,
  LEFT: 3,
  CENTER: 4,
  RIGHT: 5,
  BOTTOM_LEFT: 6,
  BOTTOM: 7,
  BOTTOM_RIGHT: 8,
}
