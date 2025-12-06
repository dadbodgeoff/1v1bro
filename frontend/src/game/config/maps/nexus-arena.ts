/**
 * Nexus Arena - Default AAA Map Configuration
 * The primary competitive arena with teleporters, jump pads, and hazard zones
 * 
 * @module config/maps/nexus-arena
 */

import type { MapConfig, TileDefinition } from './map-schema'

// ============================================================================
// Tile Type Shortcuts
// ============================================================================

const F: TileDefinition = { type: 'floor' }
const W: TileDefinition = { type: 'wall' }
const H: TileDefinition = { type: 'half_wall' }
const S: TileDefinition = { type: 'hazard_slow' }
const P: TileDefinition = { type: 'trap_pressure' }
const T: TileDefinition = { type: 'teleporter' }
const J: TileDefinition = { type: 'jump_pad' }

// ============================================================================
// Nexus Arena Configuration
// ============================================================================

/**
 * Nexus Arena Map Configuration
 * 
 * Layout:
 * - 4 Full Walls creating lane structure
 * - 8 Half Covers flanking spawn areas
 * - 4 Slow Fields controlling mid approaches
 * - 2 Pressure Traps guarding hub
 * - 2 Teleporter Pairs (top and bottom corners)
 * - 2 Jump Pads (side lanes launching toward center)
 * - 8 Power-up Spawns distributed around hub and lanes
 */
export const NEXUS_ARENA: MapConfig = {
  metadata: {
    name: 'Nexus Arena',
    author: 'Arena Systems Team',
    version: '1.0.0',
    description: 'The default competitive arena with teleporters, jump pads, and hazard zones.'
  },

  // 16x9 tile grid (1280x720 at 80px/tile)
  tiles: [
    // Row 0: Top lane with teleporters
    [F, T, F, F, W, F, F, F, F, F, W, F, F, T, F, F],
    // Row 1: Upper area
    [F, F, F, F, W, F, F, F, F, F, W, F, F, F, F, F],
    // Row 2: Player spawns with half cover
    [F, F, F, H, H, F, F, F, F, F, H, H, F, F, F, F],
    // Row 3: Slow fields and pressure trap
    [F, F, F, F, F, S, F, P, F, S, F, F, F, F, F, F],
    // Row 4: Mid lane with jump pads
    [J, F, F, F, F, F, F, F, F, F, F, F, F, F, F, J],
    // Row 5: Slow fields and pressure trap
    [F, F, F, F, F, S, F, P, F, S, F, F, F, F, F, F],
    // Row 6: Lower half cover
    [F, F, F, H, H, F, F, F, F, F, H, H, F, F, F, F],
    // Row 7: Lower area
    [F, F, F, F, W, F, F, F, F, F, W, F, F, F, F, F],
    // Row 8: Bottom lane with teleporters
    [F, T, F, F, W, F, F, F, F, F, W, F, F, T, F, F],
  ],

  barriers: [
    // Full walls creating lane structure (top)
    { id: 'wall_tl', type: 'full', position: { x: 320, y: 0 }, size: { x: 80, y: 160 } },
    { id: 'wall_tr', type: 'full', position: { x: 800, y: 0 }, size: { x: 80, y: 160 } },
    // Full walls creating lane structure (bottom)
    { id: 'wall_bl', type: 'full', position: { x: 320, y: 560 }, size: { x: 80, y: 160 } },
    { id: 'wall_br', type: 'full', position: { x: 800, y: 560 }, size: { x: 80, y: 160 } },

    // Half covers near left spawn
    { id: 'cover_l1', type: 'half', position: { x: 240, y: 160 }, size: { x: 80, y: 80 } },
    { id: 'cover_l2', type: 'half', position: { x: 320, y: 160 }, size: { x: 80, y: 80 } },
    { id: 'cover_l3', type: 'half', position: { x: 240, y: 480 }, size: { x: 80, y: 80 } },
    { id: 'cover_l4', type: 'half', position: { x: 320, y: 480 }, size: { x: 80, y: 80 } },

    // Half covers near right spawn
    { id: 'cover_r1', type: 'half', position: { x: 800, y: 160 }, size: { x: 80, y: 80 } },
    { id: 'cover_r2', type: 'half', position: { x: 880, y: 160 }, size: { x: 80, y: 80 } },
    { id: 'cover_r3', type: 'half', position: { x: 800, y: 480 }, size: { x: 80, y: 80 } },
    { id: 'cover_r4', type: 'half', position: { x: 880, y: 480 }, size: { x: 80, y: 80 } },
  ],

  hazards: [
    // Slow fields flanking mid approaches (top)
    { id: 'slow_tl', type: 'slow', bounds: { x: 400, y: 240, width: 80, height: 80 }, intensity: 0.5 },
    { id: 'slow_tr', type: 'slow', bounds: { x: 720, y: 240, width: 80, height: 80 }, intensity: 0.5 },
    // Slow fields flanking mid approaches (bottom)
    { id: 'slow_bl', type: 'slow', bounds: { x: 400, y: 400, width: 80, height: 80 }, intensity: 0.5 },
    { id: 'slow_br', type: 'slow', bounds: { x: 720, y: 400, width: 80, height: 80 }, intensity: 0.5 },
  ],

  traps: [
    // Pressure traps guarding hub approaches (35 damage = not instant kill with 1 shot)
    {
      id: 'trap_top',
      type: 'pressure',
      position: { x: 600, y: 280 },
      radius: 40,
      effect: 'damage_burst',
      effectValue: 35,
      cooldown: 10
    },
    {
      id: 'trap_bot',
      type: 'pressure',
      position: { x: 600, y: 440 },
      radius: 40,
      effect: 'damage_burst',
      effectValue: 35,
      cooldown: 10
    },
  ],

  teleporters: [
    // Top teleporter pair
    { id: 'tp_tl', pairId: 'top', position: { x: 120, y: 40 }, radius: 30 },
    { id: 'tp_tr', pairId: 'top', position: { x: 1080, y: 40 }, radius: 30 },
    // Bottom teleporter pair
    { id: 'tp_bl', pairId: 'bottom', position: { x: 120, y: 680 }, radius: 30 },
    { id: 'tp_br', pairId: 'bottom', position: { x: 1080, y: 680 }, radius: 30 },
  ],

  jumpPads: [
    // Side jump pads launching toward center
    { id: 'jp_left', position: { x: 40, y: 360 }, radius: 40, direction: 'E', force: 400 },
    { id: 'jp_right', position: { x: 1240, y: 360 }, radius: 40, direction: 'W', force: 400 },
  ],

  spawnPoints: [
    { id: 'player1', position: { x: 160, y: 360 } },
    { id: 'player2', position: { x: 1120, y: 360 } },
  ],

  powerUpSpawns: [
    { x: 640, y: 40 },    // Top center
    { x: 640, y: 680 },   // Bottom center
    { x: 480, y: 120 },   // Upper left
    { x: 800, y: 120 },   // Upper right
    { x: 480, y: 360 },   // Mid left (hub)
    { x: 800, y: 360 },   // Mid right (hub)
    { x: 480, y: 600 },   // Lower left
    { x: 800, y: 600 },   // Lower right
  ]
} 