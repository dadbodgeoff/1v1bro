/**
 * Simple Arena - 16x9 grass arena with chaos mechanics
 * @module config/maps/simple-arena
 */

import type { MapConfig, TileDefinition } from './map-schema'
import type { PropPlacement } from '../../props/PropRegistry'

const F: TileDefinition = { type: 'floor' }
const TILE = 80
const gx = (col: number) => col * TILE + TILE / 2
const gy = (row: number) => row * TILE + TILE / 2

// Generate 16x9 floor grid
const floorRow = (): TileDefinition[] => Array(16).fill(F)
const tiles = Array(9).fill(null).map(() => floorRow())

export const SIMPLE_ARENA: MapConfig = {
  metadata: {
    name: 'Runtime Ruins',
    author: 'Arena Systems Team',
    version: '1.0.0',
    description: 'Ancient ruins simulated in a high-tech arena',
    theme: 'simple',
  },
  tiles,
  // Wall barriers for collision - rows 2 and 6, cols 3-6 and 9-12
  // Each wall segment is 72x44 centered on the tile
  barriers: [
    // Top-left wall strip (row 2, cols 3-6)
    { id: 'wall_tl_0', type: 'full', position: { x: 240 - 36, y: 200 - 22 }, size: { x: 72, y: 44 } },
    { id: 'wall_tl_1', type: 'full', position: { x: 320 - 36, y: 200 - 22 }, size: { x: 72, y: 44 } },
    { id: 'wall_tl_2', type: 'full', position: { x: 400 - 36, y: 200 - 22 }, size: { x: 72, y: 44 } },
    { id: 'wall_tl_3', type: 'full', position: { x: 480 - 36, y: 200 - 22 }, size: { x: 72, y: 44 } },
    // Top-right wall strip (row 2, cols 9-12)
    { id: 'wall_tr_0', type: 'full', position: { x: 720 - 36, y: 200 - 22 }, size: { x: 72, y: 44 } },
    { id: 'wall_tr_1', type: 'full', position: { x: 800 - 36, y: 200 - 22 }, size: { x: 72, y: 44 } },
    { id: 'wall_tr_2', type: 'full', position: { x: 880 - 36, y: 200 - 22 }, size: { x: 72, y: 44 } },
    { id: 'wall_tr_3', type: 'full', position: { x: 960 - 36, y: 200 - 22 }, size: { x: 72, y: 44 } },
    // Bottom-left wall strip (row 6, cols 3-6)
    { id: 'wall_bl_0', type: 'full', position: { x: 240 - 36, y: 520 - 22 }, size: { x: 72, y: 44 } },
    { id: 'wall_bl_1', type: 'full', position: { x: 320 - 36, y: 520 - 22 }, size: { x: 72, y: 44 } },
    { id: 'wall_bl_2', type: 'full', position: { x: 400 - 36, y: 520 - 22 }, size: { x: 72, y: 44 } },
    { id: 'wall_bl_3', type: 'full', position: { x: 480 - 36, y: 520 - 22 }, size: { x: 72, y: 44 } },
    // Bottom-right wall strip (row 6, cols 9-12)
    { id: 'wall_br_0', type: 'full', position: { x: 720 - 36, y: 520 - 22 }, size: { x: 72, y: 44 } },
    { id: 'wall_br_1', type: 'full', position: { x: 800 - 36, y: 520 - 22 }, size: { x: 72, y: 44 } },
    { id: 'wall_br_2', type: 'full', position: { x: 880 - 36, y: 520 - 22 }, size: { x: 72, y: 44 } },
    { id: 'wall_br_3', type: 'full', position: { x: 960 - 36, y: 520 - 22 }, size: { x: 72, y: 44 } },
    // Center rocks (bridge crossing) - solid collision
    { id: 'rock_top', type: 'full', position: { x: 600 - 28, y: 280 - 17 }, size: { x: 56, y: 35 } },
    { id: 'rock_bot', type: 'full', position: { x: 600 - 28, y: 360 - 17 }, size: { x: 56, y: 35 } },
  ],
  hazards: [
    // Water slow zones - matches waterPond prop positions
    // The center bridge/rocks area (cols 7-8, row 4) is NOT a hazard - players can cross there
    // Left water pond at gx(6), gy(4) = (520, 360) - covers left side of water
    {
      id: 'water_left',
      type: 'slow',
      bounds: { x: 400, y: 260, width: 160, height: 160 },
      intensity: 0.5, // 50% speed in water
    },
    // Right water pond at gx(9), gy(4) = (760, 360) - covers right side of water
    {
      id: 'water_right',
      type: 'slow',
      bounds: { x: 720, y: 260, width: 160, height: 160 },
      intensity: 0.5, // 50% speed in water
    },
    // Note: Center bridge area (x: 560-720) has NO hazard - rocks provide safe crossing
    
    // EMP zones - near wall corners, disables power-ups (strategic denial)
    { id: 'emp_tl', type: 'emp', bounds: { x: gx(3) - 40, y: gy(2) - 40, width: 80, height: 80 }, intensity: 1 },
    { id: 'emp_tr', type: 'emp', bounds: { x: gx(12) - 40, y: gy(2) - 40, width: 80, height: 80 }, intensity: 1 },
    { id: 'emp_bl', type: 'emp', bounds: { x: gx(3) - 40, y: gy(6) - 40, width: 80, height: 80 }, intensity: 1 },
    { id: 'emp_br', type: 'emp', bounds: { x: gx(12) - 40, y: gy(6) - 40, width: 80, height: 80 }, intensity: 1 },
    
    // Damage zones - flanking lanes (high risk shortcuts)
    { id: 'dmg_top_left', type: 'damage', bounds: { x: gx(1) - 40, y: gy(1) - 40, width: 80, height: 80 }, intensity: 12 },
    { id: 'dmg_top_right', type: 'damage', bounds: { x: gx(14) - 40, y: gy(1) - 40, width: 80, height: 80 }, intensity: 12 },
    { id: 'dmg_bot_left', type: 'damage', bounds: { x: gx(1) - 40, y: gy(7) - 40, width: 80, height: 80 }, intensity: 12 },
    { id: 'dmg_bot_right', type: 'damage', bounds: { x: gx(14) - 40, y: gy(7) - 40, width: 80, height: 80 }, intensity: 12 },
  ],
  traps: [
    // Pressure traps - chokepoints near walls (triggers on step, 30 damage burst)
    { id: 'trap_left_upper', type: 'pressure', position: { x: gx(4), y: gy(3) }, radius: 35, effect: 'damage_burst', effectValue: 30, cooldown: 12 },
    { id: 'trap_right_upper', type: 'pressure', position: { x: gx(11), y: gy(3) }, radius: 35, effect: 'damage_burst', effectValue: 30, cooldown: 12 },
    { id: 'trap_left_lower', type: 'pressure', position: { x: gx(4), y: gy(5) }, radius: 35, effect: 'damage_burst', effectValue: 30, cooldown: 12 },
    { id: 'trap_right_lower', type: 'pressure', position: { x: gx(11), y: gy(5) }, radius: 35, effect: 'damage_burst', effectValue: 30, cooldown: 12 },
    
    // Timed traps - center bridge area (periodic danger, 25 damage, 10s interval)
    { id: 'trap_bridge_top', type: 'timed', position: { x: gx(7.5), y: gy(3) }, radius: 40, effect: 'damage_burst', effectValue: 25, cooldown: 10, interval: 10 },
    { id: 'trap_bridge_bot', type: 'timed', position: { x: gx(7.5), y: gy(5) }, radius: 40, effect: 'damage_burst', effectValue: 25, cooldown: 10, interval: 10 },
  ],
  teleporters: [
    // 2 chaos teleporters (top/bottom center) - teleport to random exit locations
    { 
      id: 'tp_top_entry', 
      pairId: 'chaos', 
      position: { x: gx(7.5), y: gy(0) + 20 }, 
      radius: 35,
      randomExits: [
        { x: gx(1), y: gy(1) },      // Top-left corner
        { x: gx(14), y: gy(1) },     // Top-right corner
        { x: gx(1), y: gy(7) },      // Bottom-left corner
        { x: gx(14), y: gy(7) },     // Bottom-right corner
        { x: gx(2), y: gy(4) },      // Left mid (near P1 spawn)
        { x: gx(13), y: gy(4) },     // Right mid (near P2 spawn)
        { x: gx(5), y: gy(1) },      // Top lane left
        { x: gx(10), y: gy(7) },     // Bottom lane right
      ],
    },
    { 
      id: 'tp_bot_entry', 
      pairId: 'chaos', 
      position: { x: gx(7.5), y: gy(8) - 20 }, 
      radius: 35,
      randomExits: [
        { x: gx(1), y: gy(1) },      // Top-left corner
        { x: gx(14), y: gy(1) },     // Top-right corner
        { x: gx(1), y: gy(7) },      // Bottom-left corner
        { x: gx(14), y: gy(7) },     // Bottom-right corner
        { x: gx(2), y: gy(4) },      // Left mid (near P1 spawn)
        { x: gx(13), y: gy(4) },     // Right mid (near P2 spawn)
        { x: gx(5), y: gy(1) },      // Top lane left
        { x: gx(10), y: gy(7) },     // Bottom lane right
      ],
    },
  ],
  jumpPads: [
    // 4 corner bounce pads - STRONG launch toward center (force 550)
    { id: 'jp_tl', position: { x: gx(0), y: gy(0) }, radius: 35, direction: 'SE', force: 550 },
    { id: 'jp_tr', position: { x: gx(15), y: gy(0) }, radius: 35, direction: 'SW', force: 550 },
    { id: 'jp_bl', position: { x: gx(0), y: gy(8) }, radius: 35, direction: 'NE', force: 550 },
    { id: 'jp_br', position: { x: gx(15), y: gy(8) }, radius: 35, direction: 'NW', force: 550 },
    // Behind spawn bounce pads - STRONG launch toward center (force 550)
    { id: 'jp_spawn_l', position: { x: gx(1), y: gy(4) }, radius: 35, direction: 'E', force: 550 },
    { id: 'jp_spawn_r', position: { x: gx(14), y: gy(4) }, radius: 35, direction: 'W', force: 550 },
  ],
  spawnPoints: [
    { id: 'player1', position: { x: gx(2), y: gy(4) } },
    { id: 'player2', position: { x: gx(13), y: gy(4) } },
  ],
  powerUpSpawns: [
    { x: 640, y: 360 }, { x: 320, y: 160 }, { x: 960, y: 160 },
    { x: 320, y: 560 }, { x: 960, y: 560 },
  ],
}

export const SIMPLE_SOURCE_TILE_SIZE = 88
export const SIMPLE_TILE_SIZE = 80
export const SIMPLE_ARENA_SIZE = { width: 1280, height: 720 }

// Helper: horizontal wall strip
const wall = (col: number, row: number, len: number): PropPlacement[] =>
  Array.from({ length: len }, (_, i) => ({ propId: 'box', x: gx(col + i), y: gy(row) }))

/**
 * Prop placements - Grid-exact coordinates (16x9 grid, 80px tiles)
 * Grid: cols 0-15, rows 0-8
 * Walls: row 2 (cols 3-6, 9-12), row 6 (cols 3-6, 9-12)
 * Spawns: P1 at [2,4], P2 at [13,4]
 */
export const SIMPLE_ARENA_PROPS: PropPlacement[] = [
  // === GROUND LAYER - Sparse dirt patches ===
  { propId: 'dirtPatch', x: gx(4), y: gy(3) },    // Left mid-upper
  { propId: 'dirtPatch', x: gx(11), y: gy(5) },   // Right mid-lower
  { propId: 'dirtPatch', x: gx(7), y: gy(1) },    // Top center lane
  { propId: 'dirtPatch', x: gx(8), y: gy(7) },    // Bottom center lane
  { propId: 'dirtPatch', x: gx(1), y: gy(3) },    // Left upper (moved inward)
  { propId: 'dirtPatch', x: gx(14), y: gy(5) },   // Right lower (moved inward)
  { propId: 'dirtPatch', x: gx(4), y: gy(1) },    // Top lane left
  { propId: 'dirtPatch', x: gx(11), y: gy(7) },   // Bottom lane right

  // Spawn platforms (shrunk ~10px more)
  { propId: 'spawnPlatform', x: gx(2), y: gy(4), scale: 0.6 },
  { propId: 'spawnPlatform', x: gx(13), y: gy(4), scale: 0.6 },

  // === WATER - Center moat ===
  { propId: 'waterPond', x: gx(6), y: gy(4) },
  { propId: 'waterPond', x: gx(9), y: gy(4), flipX: true },
  { propId: 'rock', x: gx(7.5), y: gy(3.5) },
  { propId: 'rock', x: gx(7.5), y: gy(4.5) },

  // === WALLS (rows 2 and 6, cols 3-6 and 9-12) ===
  ...wall(3, 2, 4),
  ...wall(3, 6, 4),
  ...wall(9, 2, 4),
  ...wall(9, 6, 4),

  // === WIRE DEBRIS - sparse decoration (nudged 20px from edges) ===
  { propId: 'wireDebris', x: gx(2), y: gy(1) + 20 },   // Top-left area
  { propId: 'wireDebris', x: gx(13), y: gy(7) - 20 },  // Bottom-right area
  { propId: 'wireDebris', x: gx(10), y: gy(1) + 20 },  // Top lane right
  { propId: 'wireDebris', x: gx(5), y: gy(7) - 20 },   // Bottom lane left
  { propId: 'wireDebris', x: gx(1), y: gy(5) },        // Left lower (moved inward)
  { propId: 'wireDebris', x: gx(14), y: gy(3) },       // Right upper (moved inward)

  // === HAZARD VISUALS ===
  // EMP zones at wall corners
  { propId: 'empZone', x: gx(3), y: gy(2) },
  { propId: 'empZone', x: gx(12), y: gy(2) },
  { propId: 'empZone', x: gx(3), y: gy(6) },
  { propId: 'empZone', x: gx(12), y: gy(6) },
  
  // Damage zones (minefields) in flanking lanes
  { propId: 'minefield', x: gx(1), y: gy(1) },
  { propId: 'minefield', x: gx(14), y: gy(1) },
  { propId: 'minefield', x: gx(1), y: gy(7) },
  { propId: 'minefield', x: gx(14), y: gy(7) },
  
  // Pressure traps near walls
  { propId: 'pressureTrap', x: gx(4), y: gy(3) },
  { propId: 'pressureTrap', x: gx(11), y: gy(3) },
  { propId: 'pressureTrap', x: gx(4), y: gy(5) },
  { propId: 'pressureTrap', x: gx(11), y: gy(5) },
  
  // Timed traps at bridge approaches (warning indicators)
  { propId: 'pressureTrap', x: gx(7.5), y: gy(3), scale: 1.2 },
  { propId: 'pressureTrap', x: gx(7.5), y: gy(5), scale: 1.2 },
  
  // Power-up pedestals at spawn locations
  { propId: 'powerUpPedestal', x: 640, y: 360 },       // Center
  { propId: 'powerUpPedestal', x: 320, y: 160 },       // Top-left
  { propId: 'powerUpPedestal', x: 960, y: 160 },       // Top-right
  { propId: 'powerUpPedestal', x: 320, y: 560 },       // Bottom-left
  { propId: 'powerUpPedestal', x: 960, y: 560 },       // Bottom-right

  // === BOUNCE PADS ===
  // 4 absolute corners [0,0], [15,0], [0,8], [15,8]
  { propId: 'bouncePad', x: gx(0), y: gy(0), scale: 0.6 },
  { propId: 'bouncePad', x: gx(15), y: gy(0), scale: 0.6, flipX: true },
  { propId: 'bouncePad', x: gx(0), y: gy(8), scale: 0.6 },
  { propId: 'bouncePad', x: gx(15), y: gy(8), scale: 0.6, flipX: true },
  // Behind spawns (1 tile behind P1 at col 2, P2 at col 13)
  { propId: 'bouncePad', x: gx(1), y: gy(4), scale: 0.6 },
  { propId: 'bouncePad', x: gx(14), y: gy(4), scale: 0.6, flipX: true },

  // === TELEPORTERS - 2 chaos portals (top/bottom center) ===
  { propId: 'teleporter', x: gx(7.5), y: gy(0) + 20 },   // Top center entry
  { propId: 'teleporter', x: gx(7.5), y: gy(8) - 20 },   // Bottom center entry

  // === TALL GRASS - corner stealth zones (overlapping bounce pads) ===
  // 4 main corners - positioned to overlap bounce pads
  { propId: 'tallGrass', x: gx(0), y: gy(0) },
  { propId: 'tallGrass', x: gx(15), y: gy(0) },
  { propId: 'tallGrass', x: gx(0), y: gy(8) },
  { propId: 'tallGrass', x: gx(15), y: gy(8) },
  // Anchor grass at wall corners (valuable cover) - scale 0.75 for better coverage
  { propId: 'tallGrass', x: gx(3), y: gy(2), scale: 0.75 },   // Left wall start
  { propId: 'tallGrass', x: gx(6), y: gy(2), scale: 0.75 },   // Left wall end
  { propId: 'tallGrass', x: gx(9), y: gy(2), scale: 0.75 },   // Right wall start
  { propId: 'tallGrass', x: gx(12), y: gy(2), scale: 0.75 },  // Right wall end
  { propId: 'tallGrass', x: gx(3), y: gy(6), scale: 0.75 },
  { propId: 'tallGrass', x: gx(6), y: gy(6), scale: 0.75 },
  { propId: 'tallGrass', x: gx(9), y: gy(6), scale: 0.75 },
  { propId: 'tallGrass', x: gx(12), y: gy(6), scale: 0.75 },
]
