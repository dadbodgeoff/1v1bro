/**
 * TileTypes - Type definitions and theme configurations for tile rendering
 * 
 * @module terrain/TileTypes
 */

// TileType is available from '../arena/types' if needed

// ============================================================================
// Types
// ============================================================================

/**
 * Tile map cell - defines what tile to render at each position
 */
export interface TileMapCell {
  /** Tileset ID to use */
  tilesetId: string
  /** Tile index within the tileset */
  tileIndex: number
  /** Optional rotation in degrees (0, 90, 180, 270) */
  rotation?: number
  /** Optional flip horizontal */
  flipX?: boolean
  /** Optional flip vertical */
  flipY?: boolean
}

/**
 * A complete tile map for rendering
 */
export interface TileMap {
  /** Grid of tile cells (row-major order) */
  cells: (TileMapCell | null)[][]
  /** Width in tiles */
  width: number
  /** Height in tiles */
  height: number
  /** Tile size in pixels */
  tileSize: number
}

/**
 * Theme configuration for tile rendering
 */
export interface TileTheme {
  /** Floor tileset ID */
  floor: string
  /** Wall tileset ID */
  wall: string
  /** Hazard tileset ID (optional) */
  hazard?: string
  /** Water tileset ID (optional) */
  water?: string
  /** Bush tileset ID (optional) */
  bush?: string
  /** Destructible object tileset ID */
  destructible?: string
}

// ============================================================================
// Pre-defined Themes
// ============================================================================

export const TILE_THEMES: Record<string, TileTheme> = {
  // Space/Sci-fi theme (matches current game)
  space: {
    floor: 'scifi-floor',
    wall: 'tile',
    destructible: 'box',
    bush: 'bush',
  },
  
  // Nature/Grass theme (Brawl Stars style)
  nature: {
    floor: 'grass',
    wall: 'tile',
    water: 'water',
    bush: 'bush',
    destructible: 'box',
  },
  
  // Mixed theme (sci-fi with nature elements)
  mixed: {
    floor: 'scifi-floor',
    wall: 'tile',
    water: 'water',
    bush: 'bush',
    destructible: 'box',
  },
}
