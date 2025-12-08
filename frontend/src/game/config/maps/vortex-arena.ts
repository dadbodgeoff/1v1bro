/**
 * Vortex Arena - Premium Esports Map Configuration
 * A radial arena with central vortex hazard pattern, teleporter networks, and orbital jump pads
 * 
 * @module config/maps/vortex-arena
 */

import type { MapConfig, TileDefinition } from './map-schema'

// ============================================================================
// Tile Type Shortcuts
// ============================================================================

const F: TileDefinition = { type: 'floor' }
const W: TileDefinition = { type: 'wall' }
const H: TileDefinition = { type: 'half_wall' }
const D: TileDefinition = { type: 'hazard_damage' }
const S: TileDefinition = { type: 'hazard_slow' }
const E: TileDefinition = { type: 'hazard_emp' }
const P: TileDefinition = { type: 'trap_pressure' }
const T: TileDefinition = { type: 'trap_timed' }
const X: TileDefinition = { type: 'teleporter' }
const J: TileDefinition = { type: 'jump_pad' }

// ============================================================================
// Vortex Arena Configuration
// ============================================================================

/**
 * Vortex Arena Map Configuration
 * 
 * Design Philosophy:
 * - Central "vortex" hazard pattern creating risk-reward gameplay
 * - Radial layout with orbital paths around the contested center
 * - 3 teleporter pairs for cross-map flanking rotations
 * - 6 jump pads with diagonal directions for orbital movement
 * - Destructible barriers for dynamic cover gameplay
 * - Horizontal symmetry for competitive fairness
 * 
 * Layout Features:
 * - Vortex Core: Damage hazards + EMP zones + timed traps at center
 * - Orbital Paths: Safe routes circling the vortex
 * - Flanking Corridors: Teleporter-connected side routes
 * - Defensive Alcoves: Spawn-adjacent areas with destructible cover
 */
export const VORTEX_ARENA: MapConfig = {
  metadata: {
    name: 'Vortex Arena',
    author: 'Arena Systems Team',
    version: '2.0.0',
    description: 'Volcanic arena with lava pools, obsidian barriers, steam vents, and a central lava vortex.',
    theme: 'volcanic',
  },

  // 16x9 tile grid (1280x720 at 80px/tile)
  // Visual pattern creates a vortex/spiral effect around center
  // Spawn points at (160, 360) = col 2, row 4 and (1120, 360) = col 14, row 4 - must be floor
  tiles: [
    // Row 0: Top lane with teleporters and damage hazards at center
    [F, F, X, F, W, F, F, D, D, F, F, W, F, X, F, F],
    // Row 1: Upper area with half-walls and slow fields
    [F, H, F, F, W, F, S, F, F, S, F, W, F, F, H, F],
    // Row 2: Jump pads and EMP at center
    [F, F, F, J, F, F, F, E, E, F, F, F, J, F, F, F],
    // Row 3: Pressure traps flanking approaches
    [F, F, F, F, F, P, F, F, F, F, P, F, F, F, F, F],
    // Row 4: Mid lane - spawn points on floor, timed traps + damage at center
    [F, F, F, F, F, F, D, T, T, D, F, F, F, F, F, F],
    // Row 5: Pressure traps flanking approaches (mirrored)
    [F, F, F, F, F, P, F, F, F, F, P, F, F, F, F, F],
    // Row 6: Jump pads and EMP at center (mirrored)
    [F, F, F, J, F, F, F, E, E, F, F, F, J, F, F, F],
    // Row 7: Lower area with half-walls and slow fields (mirrored)
    [F, H, F, F, W, F, S, F, F, S, F, W, F, F, H, F],
    // Row 8: Bottom lane with teleporters and damage hazards (mirrored)
    [F, F, X, F, W, F, F, D, D, F, F, W, F, X, F, F],
  ],

  barriers: [
    // Full walls creating structure (4 total) - vertical pillars
    { id: 'wall_tl', type: 'full', position: { x: 320, y: 0 }, size: { x: 80, y: 160 } },
    { id: 'wall_tr', type: 'full', position: { x: 880, y: 0 }, size: { x: 80, y: 160 } },
    { id: 'wall_bl', type: 'full', position: { x: 320, y: 560 }, size: { x: 80, y: 160 } },
    { id: 'wall_br', type: 'full', position: { x: 880, y: 560 }, size: { x: 80, y: 160 } },

    // Half walls for spawn protection (4 total)
    { id: 'cover_l1', type: 'half', position: { x: 80, y: 80 }, size: { x: 80, y: 80 } },
    { id: 'cover_l2', type: 'half', position: { x: 80, y: 560 }, size: { x: 80, y: 80 } },
    { id: 'cover_r1', type: 'half', position: { x: 1120, y: 80 }, size: { x: 80, y: 80 } },
    { id: 'cover_r2', type: 'half', position: { x: 1120, y: 560 }, size: { x: 80, y: 80 } },

    // Destructible barriers for dynamic gameplay (4 total)
    { id: 'destruct_l1', type: 'destructible', position: { x: 160, y: 160 }, size: { x: 80, y: 80 }, health: 100 },
    { id: 'destruct_l2', type: 'destructible', position: { x: 160, y: 480 }, size: { x: 80, y: 80 }, health: 100 },
    { id: 'destruct_r1', type: 'destructible', position: { x: 1040, y: 160 }, size: { x: 80, y: 80 }, health: 100 },
    { id: 'destruct_r2', type: 'destructible', position: { x: 1040, y: 480 }, size: { x: 80, y: 80 }, health: 100 },
  ],

  hazards: [
    // Damage zones - Vortex arms forming X pattern (4 zones, 15 DPS)
    { id: 'dmg_top', type: 'damage', bounds: { x: 560, y: 0, width: 160, height: 80 }, intensity: 15 },
    { id: 'dmg_bot', type: 'damage', bounds: { x: 560, y: 640, width: 160, height: 80 }, intensity: 15 },
    { id: 'dmg_mid_l', type: 'damage', bounds: { x: 480, y: 320, width: 80, height: 80 }, intensity: 15 },
    { id: 'dmg_mid_r', type: 'damage', bounds: { x: 720, y: 320, width: 80, height: 80 }, intensity: 15 },

    // Slow fields - Approach control (4 zones, 0.5 speed multiplier)
    { id: 'slow_tl', type: 'slow', bounds: { x: 480, y: 80, width: 80, height: 80 }, intensity: 0.5 },
    { id: 'slow_tr', type: 'slow', bounds: { x: 720, y: 80, width: 80, height: 80 }, intensity: 0.5 },
    { id: 'slow_bl', type: 'slow', bounds: { x: 480, y: 560, width: 80, height: 80 }, intensity: 0.5 },
    { id: 'slow_br', type: 'slow', bounds: { x: 720, y: 560, width: 80, height: 80 }, intensity: 0.5 },

    // EMP zones - Power-up denial at center approaches (2 zones)
    { id: 'emp_top', type: 'emp', bounds: { x: 560, y: 160, width: 160, height: 80 }, intensity: 1 },
    { id: 'emp_bot', type: 'emp', bounds: { x: 560, y: 480, width: 160, height: 80 }, intensity: 1 },
  ],

  traps: [
    // Pressure traps - Chokepoint control (4 traps, 35 damage)
    { id: 'trap_tl', type: 'pressure', position: { x: 440, y: 280 }, radius: 40, effect: 'damage_burst', effectValue: 35, cooldown: 10 },
    { id: 'trap_tr', type: 'pressure', position: { x: 840, y: 280 }, radius: 40, effect: 'damage_burst', effectValue: 35, cooldown: 10 },
    { id: 'trap_bl', type: 'pressure', position: { x: 440, y: 440 }, radius: 40, effect: 'damage_burst', effectValue: 35, cooldown: 10 },
    { id: 'trap_br', type: 'pressure', position: { x: 840, y: 440 }, radius: 40, effect: 'damage_burst', effectValue: 35, cooldown: 10 },

    // Timed traps - Vortex center danger (2 traps, 35 damage, 8s interval)
    { id: 'trap_center_l', type: 'timed', position: { x: 600, y: 360 }, radius: 40, effect: 'damage_burst', effectValue: 35, cooldown: 8, interval: 8 },
    { id: 'trap_center_r', type: 'timed', position: { x: 680, y: 360 }, radius: 40, effect: 'damage_burst', effectValue: 35, cooldown: 8, interval: 8 },
  ],

  teleporters: [
    // Pair Alpha: Top corners - Quick lane swap (row 0, col 2 and 13)
    { id: 'tp_a1', pairId: 'alpha', position: { x: 200, y: 40 }, radius: 30 },
    { id: 'tp_a2', pairId: 'alpha', position: { x: 1080, y: 40 }, radius: 30 },

    // Pair Beta: Upper mid flanks - Aggressive rotation (row 2 area, outside hazards)
    { id: 'tp_b1', pairId: 'beta', position: { x: 40, y: 360 }, radius: 30 },
    { id: 'tp_b2', pairId: 'beta', position: { x: 1240, y: 360 }, radius: 30 },

    // Pair Gamma: Bottom corners - Escape routes (row 8, col 2 and 13)
    { id: 'tp_c1', pairId: 'gamma', position: { x: 200, y: 680 }, radius: 30 },
    { id: 'tp_c2', pairId: 'gamma', position: { x: 1080, y: 680 }, radius: 30 },
  ],

  jumpPads: [
    // Orbital rotation pads - Circle the vortex (diagonal directions)
    { id: 'jp_tl', position: { x: 280, y: 200 }, radius: 40, direction: 'SE', force: 400 },
    { id: 'jp_tr', position: { x: 1000, y: 200 }, radius: 40, direction: 'SW', force: 400 },
    { id: 'jp_bl', position: { x: 280, y: 520 }, radius: 40, direction: 'NE', force: 400 },
    { id: 'jp_br', position: { x: 1000, y: 520 }, radius: 40, direction: 'NW', force: 400 },

    // Center approach pads - Into the vortex (E/W directions)
    { id: 'jp_ml', position: { x: 320, y: 360 }, radius: 40, direction: 'E', force: 400 },
    { id: 'jp_mr', position: { x: 960, y: 360 }, radius: 40, direction: 'W', force: 400 },
  ],

  spawnPoints: [
    { id: 'player1', position: { x: 160, y: 360 } },
    { id: 'player2', position: { x: 1120, y: 360 } },
  ],

  powerUpSpawns: [
    // Vortex core approaches - High risk, high reward (2)
    // Positioned just outside EMP zones (emp_top: 560-720, 160-240; emp_bot: 560-720, 480-560)
    { x: 640, y: 280 },   // Top center approach (below emp_top)
    { x: 640, y: 440 },   // Bottom center approach (above emp_bot)

    // Orbital positions - Medium risk (4)
    { x: 400, y: 120 },   // Upper left orbital
    { x: 880, y: 120 },   // Upper right orbital
    { x: 400, y: 600 },   // Lower left orbital
    { x: 880, y: 600 },   // Lower right orbital

    // Spawn adjacent - Safe access (4)
    { x: 160, y: 200 },   // P1 upper safe
    { x: 160, y: 520 },   // P1 lower safe
    { x: 1120, y: 200 },  // P2 upper safe
    { x: 1120, y: 520 },  // P2 lower safe
  ]
}
