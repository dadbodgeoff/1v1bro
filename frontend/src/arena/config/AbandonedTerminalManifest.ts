/**
 * Abandoned Terminal Map Manifest
 * 
 * Collision geometry and spawn points for the Abandoned Terminal arena map.
 * Based on ARENA_CONFIG dimensions.
 * 
 * @module config/AbandonedTerminalManifest
 */

import type { CollisionManifest, AABBDefinition } from '../physics/CollisionWorld';
import type { SpawnManifest, SpawnPointDefinition } from '../game/SpawnSystem';
import { ARENA_CONFIG } from './ArenaConfig';

// ============================================================================
// Collision Manifest
// ============================================================================

/**
 * Floor collision - split into west and east platforms (matching visual geometry)
 * Visual floor is at Y=0, collision box extends below
 */
const platformWidth = (ARENA_CONFIG.width - ARENA_CONFIG.tracks.width) / 2;

const floorColliders: AABBDefinition[] = [
  // West platform floor
  {
    id: 'floor_west',
    center: [-ARENA_CONFIG.tracks.width / 2 - platformWidth / 2, -0.25, 0],
    size: [platformWidth, 0.5, ARENA_CONFIG.depth]
  },
  // East platform floor
  {
    id: 'floor_east',
    center: [ARENA_CONFIG.tracks.width / 2 + platformWidth / 2, -0.25, 0],
    size: [platformWidth, 0.5, ARENA_CONFIG.depth]
  }
];

/**
 * Perimeter walls - All 4 walls (fully enclosed arena)
 * Visual walls: N/S at Z = ±depth/2, E/W at X = ±width/2
 */
const wallColliders: AABBDefinition[] = [
  // North wall (Z = -depth/2)
  {
    id: 'wall_north',
    center: [0, ARENA_CONFIG.wallHeight / 2, -ARENA_CONFIG.depth / 2],
    size: [ARENA_CONFIG.width, ARENA_CONFIG.wallHeight, ARENA_CONFIG.wallThickness]
  },
  // South wall (Z = +depth/2)
  {
    id: 'wall_south',
    center: [0, ARENA_CONFIG.wallHeight / 2, ARENA_CONFIG.depth / 2],
    size: [ARENA_CONFIG.width, ARENA_CONFIG.wallHeight, ARENA_CONFIG.wallThickness]
  },
  // East wall (X = width/2 = 18)
  {
    id: 'wall_east',
    center: [ARENA_CONFIG.width / 2, ARENA_CONFIG.wallHeight / 2, 0],
    size: [ARENA_CONFIG.wallThickness, ARENA_CONFIG.wallHeight, ARENA_CONFIG.depth]
  },
  // West wall (X = -width/2 = -18)
  {
    id: 'wall_west',
    center: [-ARENA_CONFIG.width / 2, ARENA_CONFIG.wallHeight / 2, 0],
    size: [ARENA_CONFIG.wallThickness, ARENA_CONFIG.wallHeight, ARENA_CONFIG.depth]
  }
];

/**
 * Track bed - sunken channel in the middle
 * Track bed floor is at Y = -tracks.depth = -0.6
 */
const trackColliders: AABBDefinition[] = [
  // Track bed floor (lower than main floor)
  {
    id: 'track_bed',
    center: [0, -ARENA_CONFIG.tracks.depth - 0.25, 0],
    size: [ARENA_CONFIG.tracks.width, 0.5, ARENA_CONFIG.depth - 4]
  },
  // Track bed west wall (platform edge)
  {
    id: 'track_wall_west',
    center: [-ARENA_CONFIG.tracks.width / 2, -ARENA_CONFIG.tracks.depth / 2, 0],
    size: [0.3, ARENA_CONFIG.tracks.depth + 0.1, ARENA_CONFIG.depth - 4]
  },
  // Track bed east wall (platform edge)
  {
    id: 'track_wall_east',
    center: [ARENA_CONFIG.tracks.width / 2, -ARENA_CONFIG.tracks.depth / 2, 0],
    size: [0.3, ARENA_CONFIG.tracks.depth + 0.1, ARENA_CONFIG.depth - 4]
  }
];

/**
 * Platform edges - no longer needed, floor colliders handle this
 */
const platformColliders: AABBDefinition[] = [];

/**
 * Subway entrance colliders - walkable stairs with side walls
 * Each entrance has: left wall, right wall, back wall, and stair steps
 * Stairs go from Y=0 to Y=4m (leaving 2m headroom for character ~1.8m tall)
 * 8 small steps, each 0.5m tall - walkable and climbable
 */
const STAIR_STEPS = 8;
const MAX_STAIR_HEIGHT = 4; // Only go up 4m, not full 6m (leave headroom)
const STAIR_HEIGHT = MAX_STAIR_HEIGHT / STAIR_STEPS; // 0.5m per step
const STAIR_DEPTH = 5.45 / STAIR_STEPS; // ~0.68m per step
const STAIR_WIDTH = 3; // Walkable width between walls
const WALL_THICKNESS = 0.5;

// Generate stair steps for NW entrance (stairs go toward -Z, player walks from platform into stairs)
const nwStairSteps: AABBDefinition[] = Array.from({ length: STAIR_STEPS }, (_, i) => ({
  id: `subway_nw_step_${i}`,
  center: [-12, (i + 0.5) * STAIR_HEIGHT, -14 - (i + 0.5) * STAIR_DEPTH + 2.7],
  size: [STAIR_WIDTH, STAIR_HEIGHT, STAIR_DEPTH]
}));

// Generate stair steps for SE entrance (stairs go toward +Z, rotated 180°)
const seStairSteps: AABBDefinition[] = Array.from({ length: STAIR_STEPS }, (_, i) => ({
  id: `subway_se_step_${i}`,
  center: [12, (i + 0.5) * STAIR_HEIGHT, 14 + (i + 0.5) * STAIR_DEPTH - 2.7],
  size: [STAIR_WIDTH, STAIR_HEIGHT, STAIR_DEPTH]
}));

const subwayColliders: AABBDefinition[] = [
  // NW entrance walls
  {
    id: 'subway_nw_wall_left',
    center: [-12 - STAIR_WIDTH / 2 - WALL_THICKNESS / 2, 3, -14],
    size: [WALL_THICKNESS, 6, 5.45]
  },
  {
    id: 'subway_nw_wall_right',
    center: [-12 + STAIR_WIDTH / 2 + WALL_THICKNESS / 2, 3, -14],
    size: [WALL_THICKNESS, 6, 5.45]
  },
  {
    id: 'subway_nw_wall_back',
    center: [-12, 3, -14 - 5.45 / 2 + 0.25],
    size: [STAIR_WIDTH + WALL_THICKNESS * 2, 6, WALL_THICKNESS]
  },
  // NW entrance roof - prevents jumping through
  {
    id: 'subway_nw_roof',
    center: [-12, 6, -14],
    size: [STAIR_WIDTH + WALL_THICKNESS * 2, WALL_THICKNESS, 5.45]
  },
  // NW stair steps
  ...nwStairSteps,
  
  // SE entrance walls
  {
    id: 'subway_se_wall_left',
    center: [12 - STAIR_WIDTH / 2 - WALL_THICKNESS / 2, 3, 14],
    size: [WALL_THICKNESS, 6, 5.45]
  },
  {
    id: 'subway_se_wall_right',
    center: [12 + STAIR_WIDTH / 2 + WALL_THICKNESS / 2, 3, 14],
    size: [WALL_THICKNESS, 6, 5.45]
  },
  {
    id: 'subway_se_wall_back',
    center: [12, 3, 14 + 5.45 / 2 - 0.25],
    size: [STAIR_WIDTH + WALL_THICKNESS * 2, 6, WALL_THICKNESS]
  },
  // SE entrance roof - prevents jumping through
  {
    id: 'subway_se_roof',
    center: [12, 6, 14],
    size: [STAIR_WIDTH + WALL_THICKNESS * 2, WALL_THICKNESS, 5.45]
  },
  // SE stair steps
  ...seStairSteps
];

/**
 * Train car colliders - SIMPLE approach
 * Train dimensions: 4.54m wide × 5.95m tall × 13m deep
 * 
 * 4 doors total: 2 on left side, 2 on right side
 * Door positions at Z = -3 and Z = +3
 * Players can walk through doors, blocked everywhere else
 */
const TRAIN_WIDTH = 4.54;
const TRAIN_HEIGHT = 5.95;
const TRAIN_LENGTH = 13;
const TRAIN_WALL = 0.3;
const TRAIN_Y = TRAIN_HEIGHT / 2;

// Door config
const DOOR_Z_FRONT = -3.0;
const DOOR_Z_BACK = 3.0;
const DOOR_WIDTH = 1.5; // Width of door opening along Z axis
const DOOR_HEIGHT = 3.5; // Height of door opening (player 1.8m + jump 1.6m)

// Simple train colliders - just the essential boxes
const trainColliders: AABBDefinition[] = [
  // ===== FRONT END WALL (solid) =====
  {
    id: 'train_front',
    center: [0, TRAIN_Y, -TRAIN_LENGTH / 2 + TRAIN_WALL / 2],
    size: [TRAIN_WIDTH, TRAIN_HEIGHT, TRAIN_WALL]
  },
  // ===== BACK END WALL (solid) =====
  {
    id: 'train_back',
    center: [0, TRAIN_Y, TRAIN_LENGTH / 2 - TRAIN_WALL / 2],
    size: [TRAIN_WIDTH, TRAIN_HEIGHT, TRAIN_WALL]
  },
  // ===== LEFT WALL - 3 sections with 2 door gaps =====
  // Left front section (before front door)
  {
    id: 'train_left_1',
    center: [-TRAIN_WIDTH / 2 + TRAIN_WALL / 2, TRAIN_Y, ((-TRAIN_LENGTH / 2) + (DOOR_Z_FRONT - DOOR_WIDTH / 2)) / 2],
    size: [TRAIN_WALL, TRAIN_HEIGHT, (DOOR_Z_FRONT - DOOR_WIDTH / 2) - (-TRAIN_LENGTH / 2)]
  },
  // Left middle section (between doors)
  {
    id: 'train_left_2',
    center: [-TRAIN_WIDTH / 2 + TRAIN_WALL / 2, TRAIN_Y, 0],
    size: [TRAIN_WALL, TRAIN_HEIGHT, (DOOR_Z_BACK - DOOR_WIDTH / 2) - (DOOR_Z_FRONT + DOOR_WIDTH / 2)]
  },
  // Left back section (after back door)
  {
    id: 'train_left_3',
    center: [-TRAIN_WIDTH / 2 + TRAIN_WALL / 2, TRAIN_Y, ((DOOR_Z_BACK + DOOR_WIDTH / 2) + (TRAIN_LENGTH / 2)) / 2],
    size: [TRAIN_WALL, TRAIN_HEIGHT, (TRAIN_LENGTH / 2) - (DOOR_Z_BACK + DOOR_WIDTH / 2)]
  },
  // Left front door - top section only (above door opening)
  {
    id: 'train_left_door1_top',
    center: [-TRAIN_WIDTH / 2 + TRAIN_WALL / 2, DOOR_HEIGHT + (TRAIN_HEIGHT - DOOR_HEIGHT) / 2, DOOR_Z_FRONT],
    size: [TRAIN_WALL, TRAIN_HEIGHT - DOOR_HEIGHT, DOOR_WIDTH]
  },
  // Left back door - top section only
  {
    id: 'train_left_door2_top',
    center: [-TRAIN_WIDTH / 2 + TRAIN_WALL / 2, DOOR_HEIGHT + (TRAIN_HEIGHT - DOOR_HEIGHT) / 2, DOOR_Z_BACK],
    size: [TRAIN_WALL, TRAIN_HEIGHT - DOOR_HEIGHT, DOOR_WIDTH]
  },
  // ===== RIGHT WALL - 3 sections with 2 door gaps =====
  // Right front section
  {
    id: 'train_right_1',
    center: [TRAIN_WIDTH / 2 - TRAIN_WALL / 2, TRAIN_Y, ((-TRAIN_LENGTH / 2) + (DOOR_Z_FRONT - DOOR_WIDTH / 2)) / 2],
    size: [TRAIN_WALL, TRAIN_HEIGHT, (DOOR_Z_FRONT - DOOR_WIDTH / 2) - (-TRAIN_LENGTH / 2)]
  },
  // Right middle section
  {
    id: 'train_right_2',
    center: [TRAIN_WIDTH / 2 - TRAIN_WALL / 2, TRAIN_Y, 0],
    size: [TRAIN_WALL, TRAIN_HEIGHT, (DOOR_Z_BACK - DOOR_WIDTH / 2) - (DOOR_Z_FRONT + DOOR_WIDTH / 2)]
  },
  // Right back section
  {
    id: 'train_right_3',
    center: [TRAIN_WIDTH / 2 - TRAIN_WALL / 2, TRAIN_Y, ((DOOR_Z_BACK + DOOR_WIDTH / 2) + (TRAIN_LENGTH / 2)) / 2],
    size: [TRAIN_WALL, TRAIN_HEIGHT, (TRAIN_LENGTH / 2) - (DOOR_Z_BACK + DOOR_WIDTH / 2)]
  },
  // Right front door - top section only
  {
    id: 'train_right_door1_top',
    center: [TRAIN_WIDTH / 2 - TRAIN_WALL / 2, DOOR_HEIGHT + (TRAIN_HEIGHT - DOOR_HEIGHT) / 2, DOOR_Z_FRONT],
    size: [TRAIN_WALL, TRAIN_HEIGHT - DOOR_HEIGHT, DOOR_WIDTH]
  },
  // Right back door - top section only
  {
    id: 'train_right_door2_top',
    center: [TRAIN_WIDTH / 2 - TRAIN_WALL / 2, DOOR_HEIGHT + (TRAIN_HEIGHT - DOOR_HEIGHT) / 2, DOOR_Z_BACK],
    size: [TRAIN_WALL, TRAIN_HEIGHT - DOOR_HEIGHT, DOOR_WIDTH]
  },
  // ===== FLOOR =====
  {
    id: 'train_floor',
    center: [0, -0.15, 0],
    size: [TRAIN_WIDTH - TRAIN_WALL * 2, 0.3, TRAIN_LENGTH - TRAIN_WALL * 2]
  },
  // ===== ROOF =====
  {
    id: 'train_roof',
    center: [0, TRAIN_HEIGHT - TRAIN_WALL / 2, 0],
    size: [TRAIN_WIDTH, TRAIN_WALL, TRAIN_LENGTH]
  },
  // ===== INTERIOR BLOCKERS =====
  // Block everything EXCEPT the door corridors at Z = -3 and Z = +3
  // Door corridors are DOOR_WIDTH (1.5m) wide, so gaps at Z = [-3.75 to -2.25] and [2.25 to 3.75]
  
  // Front blocker: from front wall to front door
  // Z range: -6.5 to -3.75, length = 2.75m, center at Z = -5.125
  {
    id: 'train_interior_front',
    center: [0, 1.5, (-TRAIN_LENGTH / 2 + TRAIN_WALL + (DOOR_Z_FRONT - DOOR_WIDTH / 2)) / 2],
    size: [TRAIN_WIDTH - TRAIN_WALL * 2, 3.0, (DOOR_Z_FRONT - DOOR_WIDTH / 2) - (-TRAIN_LENGTH / 2 + TRAIN_WALL)]
  },
  // Middle blocker: between the two doors
  // Z range: -2.25 to +2.25, length = 4.5m, center at Z = 0
  {
    id: 'train_interior_mid',
    center: [0, 1.5, 0],
    size: [TRAIN_WIDTH - TRAIN_WALL * 2, 3.0, (DOOR_Z_BACK - DOOR_WIDTH / 2) - (DOOR_Z_FRONT + DOOR_WIDTH / 2)]
  },
  // Back blocker: from back door to back wall
  // Z range: 3.75 to 6.5, length = 2.75m, center at Z = 5.125
  {
    id: 'train_interior_back',
    center: [0, 1.5, ((DOOR_Z_BACK + DOOR_WIDTH / 2) + (TRAIN_LENGTH / 2 - TRAIN_WALL)) / 2],
    size: [TRAIN_WIDTH - TRAIN_WALL * 2, 3.0, (TRAIN_LENGTH / 2 - TRAIN_WALL) - (DOOR_Z_BACK + DOOR_WIDTH / 2)]
  }
];

/**
 * Cover objects - pillars and obstacles
 */
const coverColliders: AABBDefinition[] = [
  // Support pillars
  {
    id: 'pillar_nw',
    center: [-10, 2, 10],
    size: [0.8, 4, 0.8]
  },
  {
    id: 'pillar_ne',
    center: [10, 2, 10],
    size: [0.8, 4, 0.8]
  },
  {
    id: 'pillar_sw',
    center: [-10, 2, -10],
    size: [0.8, 4, 0.8]
  },
  {
    id: 'pillar_se',
    center: [10, 2, -10],
    size: [0.8, 4, 0.8]
  },
  // Benches - 4 total, matching visual positions
  // Bench dimensions: 0.86 × 0.92 × 2.3
  {
    id: 'bench_west_north',
    center: [-10, 0.46, -6],
    size: [0.86, 0.92, 2.3]
  },
  {
    id: 'bench_west_south',
    center: [-10, 0.46, 6],
    size: [0.86, 0.92, 2.3]
  },
  {
    id: 'bench_east_north',
    center: [10, 0.46, -6],
    size: [0.86, 0.92, 2.3]
  },
  {
    id: 'bench_east_south',
    center: [10, 0.46, 6],
    size: [0.86, 0.92, 2.3]
  }
];

/**
 * Underground cart colliders - 2 carts on the tracks
 * Positioned centered between train and walls, centered on track (X=0)
 * Scaled 2.45x from real-life size, rotated to align with train (along Z axis)
 * Cart dimensions after scale: ~3.7m wide x 2.45m tall x 6.1m long
 */
const CART_Y = -ARENA_CONFIG.tracks.depth + 1.2; // Center Y on track bed (scaled)
const cartColliders: AABBDefinition[] = [
  // North side - centered on track
  {
    id: 'cart_north',
    center: [0, CART_Y, -13.25],
    size: [3.7, 2.45, 6.1]
  },
  // South side - centered on track
  {
    id: 'cart_south',
    center: [0, CART_Y, 13.25],
    size: [3.7, 2.45, 6.1]
  }
];

/**
 * Fare terminal colliders - 2 terminals on the platforms
 * Positioned diagonally (matching spawn layout) - west/north and east/south
 * Scaled 2.1x from real-life size
 * Terminal dimensions after scale: ~2.1m wide x 4.2m tall x 3.15m deep
 */
const terminalColliders: AABBDefinition[] = [
  // West platform terminal (near north end)
  {
    id: 'terminal_west',
    center: [-8, 2.1, -10],
    size: [3.15, 4.2, 2.1]
  },
  // East platform terminal (near south end)
  {
    id: 'terminal_east',
    center: [8, 2.1, 10],
    size: [3.15, 4.2, 2.1]
  }
];

/**
 * Wall expression colliders - decorative barricades in the track bed
 * Positioned at north and south ends of track, sitting on track bed floor (Y = -0.6)
 * Dimensions: 3.8 × 1.8 × 1.29
 * Center Y = -0.6 (track floor) + 0.9 (half height) = 0.3
 */
const wallExpressionColliders: AABBDefinition[] = [
  {
    id: 'wall_expression_north',
    center: [0, -ARENA_CONFIG.tracks.depth + 0.9, -18],
    size: [3.8, 1.8, 1.29]
  },
  {
    id: 'wall_expression_south',
    center: [0, -ARENA_CONFIG.tracks.depth + 0.9, 18],
    size: [3.8, 1.8, 1.29]
  },
  // Floor collision behind wall expressions (track ends)
  // Fills gap between track bed and walls
  {
    id: 'track_end_north',
    center: [0, -ARENA_CONFIG.tracks.depth - 0.25, -19],
    size: [ARENA_CONFIG.tracks.width, 0.5, 2]
  },
  {
    id: 'track_end_south',
    center: [0, -ARENA_CONFIG.tracks.depth - 0.25, 19],
    size: [ARENA_CONFIG.tracks.width, 0.5, 2]
  }
];

/**
 * Luggage stack colliders - strategic cover for esports gameplay
 * 6 stacks: 2 near train, 2 at spawns, 2 in corners
 * Actual dimensions from scene: 3.37-4.92m wide × 1.5m tall × 3.37-4.92m deep
 * Height 1.5m = good crouch cover (player crouched ~1m)
 */
const luggageColliders: AABBDefinition[] = [
  // Beside train - west platform (3.37 × 1.5 × 3.58)
  {
    id: 'luggage_train_west',
    center: [-4, 0.75, 0],
    size: [3.37, 1.5, 3.58]
  },
  // Beside train - east platform (3.37 × 1.5 × 3.58)
  {
    id: 'luggage_train_east',
    center: [4, 0.75, 0],
    size: [3.37, 1.5, 3.58]
  },
  // Spawn area - NW subway entrance (3.58 × 1.5 × 3.37)
  {
    id: 'luggage_spawn_nw',
    center: [-10, 0.75, -16],
    size: [3.58, 1.5, 3.37]
  },
  // Spawn area - SE subway entrance (3.58 × 1.5 × 3.37)
  {
    id: 'luggage_spawn_se',
    center: [10, 0.75, 16],
    size: [3.58, 1.5, 3.37]
  },
  // Platform corner - SW (4.92 × 1.5 × 4.92)
  {
    id: 'luggage_corner_sw',
    center: [-14, 0.75, 8],
    size: [4.92, 1.5, 4.92]
  },
  // Platform corner - NE (4.92 × 1.5 × 4.92)
  {
    id: 'luggage_corner_ne',
    center: [14, 0.75, -8],
    size: [4.92, 1.5, 4.92]
  }
];

/**
 * Complete collision manifest for Abandoned Terminal
 */
export const ABANDONED_TERMINAL_COLLISION_MANIFEST: CollisionManifest = {
  colliders: [
    ...floorColliders,
    ...wallColliders,
    ...trackColliders,
    ...platformColliders,
    ...subwayColliders,
    ...trainColliders,
    ...coverColliders,
    ...cartColliders,
    ...terminalColliders,
    ...wallExpressionColliders,
    ...luggageColliders
  ]
};

// ============================================================================
// Spawn Manifest
// ============================================================================

/**
 * Spawn points - minimum 4 as per requirements
 */
const spawnPoints: SpawnPointDefinition[] = [
  // Northwest subway (player 1 default)
  {
    id: 'spawn_nw',
    position: [ARENA_CONFIG.spawns.player1.x, 0, ARENA_CONFIG.spawns.player1.z + 4]
  },
  // Southeast subway (player 2 default)
  {
    id: 'spawn_se',
    position: [ARENA_CONFIG.spawns.player2.x, 0, ARENA_CONFIG.spawns.player2.z - 4]
  },
  // West platform center
  {
    id: 'spawn_west',
    position: [-12, 0.5, 0]
  },
  // East platform center
  {
    id: 'spawn_east',
    position: [12, 0.5, 0]
  },
  // North platform
  {
    id: 'spawn_north',
    position: [0, 0.5, 15]
  },
  // South platform
  {
    id: 'spawn_south',
    position: [0, 0.5, -15]
  }
];

/**
 * Complete spawn manifest for Abandoned Terminal
 */
export const ABANDONED_TERMINAL_SPAWN_MANIFEST: SpawnManifest = {
  spawnPoints,
  arenaCenter: [0, 0, 0]
};

// ============================================================================
// Map Info
// ============================================================================

export interface MapInfo {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly dimensions: {
    width: number;
    depth: number;
    height: number;
  };
  readonly playerCount: {
    min: number;
    max: number;
  };
}

export const ABANDONED_TERMINAL_INFO: MapInfo = {
  id: 'abandoned_terminal',
  name: 'Abandoned Terminal',
  description: 'A derelict subway station with platforms on either side of the tracks. Use the train car and pillars for cover.',
  dimensions: {
    width: ARENA_CONFIG.width,
    depth: ARENA_CONFIG.depth,
    height: ARENA_CONFIG.ceilingHeight
  },
  playerCount: {
    min: 2,
    max: 2
  }
};
