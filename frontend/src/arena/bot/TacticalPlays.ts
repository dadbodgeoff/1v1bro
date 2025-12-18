/**
 * TacticalPlays - Map-specific macro-goal definitions
 * 
 * These are not movement animations but strategic paths through the arena.
 * Each play represents a high-level tactical decision with waypoints.
 * 
 * Grid: 36x40 (X: 0-35, Z: 0-39)
 * World: X: -18 to +17, Z: -20 to +19
 */

// ============================================================================
// Types
// ============================================================================

export type PlayType = 'AGGRESSIVE' | 'DEFENSIVE' | 'FLANKING' | 'RETREAT';
export type StartZone = 'WEST_PLATFORM' | 'EAST_PLATFORM' | 'NW_SUBWAY' | 'SE_SUBWAY' | 'TRACK' | 'ANY';

export interface TacticalWaypoint {
  gridX: number;
  gridZ: number;
  worldX: number;
  worldZ: number;
  /** Action to perform at this waypoint */
  action: 'MOVE' | 'CHECK' | 'HOLD' | 'PREFIRE' | 'PEEK';
  /** How long to pause at this point (ms) */
  pauseMs?: number;
  /** Direction to look while at this point (world coords) */
  lookDirection?: { x: number; z: number };
  /** Should prefire through this angle? */
  prefireAngle?: { x: number; z: number };
}

export interface TacticalPlay {
  id: string;
  name: string;
  description: string;
  type: PlayType;
  /** Where this play can start from */
  startZones: StartZone[];
  /** Minimum aggression to consider this play */
  minAggression: number;
  /** Maximum aggression to consider this play */
  maxAggression: number;
  /** Waypoints defining the path */
  waypoints: TacticalWaypoint[];
  /** Is this play disabled by mercy system? */
  disabledByMercy?: boolean;
  /** Priority boost when conditions match */
  priorityBoost?: number;
}

// ============================================================================
// Helper: Grid to World conversion
// ============================================================================

function gw(gridX: number, gridZ: number): { worldX: number; worldZ: number } {
  return {
    worldX: gridX - 18 + 0.5,
    worldZ: gridZ - 20 + 0.5,
  };
}

function wp(
  gridX: number,
  gridZ: number,
  action: TacticalWaypoint['action'] = 'MOVE',
  opts?: Partial<TacticalWaypoint>
): TacticalWaypoint {
  const { worldX, worldZ } = gw(gridX, gridZ);
  return { gridX, gridZ, worldX, worldZ, action, ...opts };
}

// ============================================================================
// Tactical Plays for Abandoned Terminal
// ============================================================================

export const TACTICAL_PLAYS: TacticalPlay[] = [
  // =========================================================================
  // AGGRESSIVE PLAYS - For high aggression (> 0.6)
  // =========================================================================
  
  {
    id: 'WEST_SWEEP',
    name: 'West Platform Sweep',
    description: 'Aggressive push down west platform, checking benches',
    type: 'AGGRESSIVE',
    startZones: ['NW_SUBWAY', 'WEST_PLATFORM'],
    minAggression: 0.6,
    maxAggression: 1.0,
    disabledByMercy: true,
    waypoints: [
      wp(4, 8, 'MOVE'),                                    // Start near NW subway
      wp(6, 12, 'CHECK', { pauseMs: 300, lookDirection: { x: 1, z: 0 } }), // Check east
      wp(8, 14, 'CHECK', { pauseMs: 200, lookDirection: { x: 1, z: 1 } }), // Bench-0 area
      wp(6, 20, 'HOLD', { pauseMs: 400 }),                 // West platform center
      wp(8, 24, 'CHECK', { pauseMs: 200, lookDirection: { x: 1, z: 0 } }), // Bench-1 area
      wp(6, 30, 'MOVE'),                                   // Continue south
    ],
  },

  {
    id: 'NEEDLE_THREADER',
    name: 'Needle Threader',
    description: 'Direct assault through train doors',
    type: 'AGGRESSIVE',
    startZones: ['WEST_PLATFORM'],
    minAggression: 0.7,
    maxAggression: 1.0,
    disabledByMercy: true,
    priorityBoost: 20,
    waypoints: [
      wp(6, 20, 'MOVE'),                                   // West platform center
      wp(10, 17, 'MOVE'),                                  // Approach front door
      wp(15, 17, 'PREFIRE', { 
        pauseMs: 100, 
        prefireAngle: { x: 1, z: 0 },
        lookDirection: { x: 1, z: 0 }
      }),                                                  // West side of front door - PREFIRE
      wp(20, 17, 'MOVE'),                                  // Through door
      wp(25, 17, 'CHECK', { pauseMs: 200, lookDirection: { x: 1, z: 1 } }), // East side
      wp(30, 20, 'HOLD', { pauseMs: 300 }),                // East platform - engage
    ],
  },

  {
    id: 'BACK_DOOR_RUSH',
    name: 'Back Door Rush',
    description: 'Flank through back train door',
    type: 'AGGRESSIVE',
    startZones: ['WEST_PLATFORM'],
    minAggression: 0.65,
    maxAggression: 1.0,
    disabledByMercy: true,
    waypoints: [
      wp(6, 20, 'MOVE'),                                   // West platform center
      wp(8, 23, 'MOVE'),                                   // Move toward back door
      wp(15, 23, 'PREFIRE', { 
        pauseMs: 100, 
        prefireAngle: { x: 1, z: 0 }
      }),                                                  // West side of back door - PREFIRE
      wp(20, 23, 'MOVE'),                                  // Through door
      wp(28, 25, 'CHECK', { pauseMs: 200 }),               // East side, check bench
      wp(30, 20, 'HOLD', { pauseMs: 300 }),                // East platform - engage
    ],
  },

  {
    id: 'EAST_SWEEP',
    name: 'East Platform Sweep',
    description: 'Aggressive push down east platform',
    type: 'AGGRESSIVE',
    startZones: ['SE_SUBWAY', 'EAST_PLATFORM'],
    minAggression: 0.6,
    maxAggression: 1.0,
    disabledByMercy: true,
    waypoints: [
      wp(32, 32, 'MOVE'),                                  // Start near SE subway
      wp(30, 28, 'CHECK', { pauseMs: 300, lookDirection: { x: -1, z: 0 } }),
      wp(28, 24, 'CHECK', { pauseMs: 200, lookDirection: { x: -1, z: -1 } }),
      wp(30, 20, 'HOLD', { pauseMs: 400 }),                // East platform center
      wp(28, 14, 'CHECK', { pauseMs: 200, lookDirection: { x: -1, z: 0 } }),
      wp(30, 8, 'MOVE'),                                   // Continue north
    ],
  },

  // =========================================================================
  // DEFENSIVE PLAYS - For low aggression (< 0.4) or mercy mode
  // =========================================================================

  {
    id: 'PLATFORM_KING_WEST',
    name: 'Platform King (West)',
    description: 'Hold west platform with angle control',
    type: 'DEFENSIVE',
    startZones: ['WEST_PLATFORM', 'NW_SUBWAY'],
    minAggression: 0.0,
    maxAggression: 0.5,
    priorityBoost: 30, // Boosted when mercy active
    waypoints: [
      wp(6, 14, 'MOVE'),                                   // Near bench-0
      wp(8, 14, 'PEEK', { 
        pauseMs: 800, 
        lookDirection: { x: 1, z: 0 }
      }),                                                  // Peek from bench cover
      wp(6, 20, 'HOLD', { pauseMs: 1000 }),                // Center hold
      wp(8, 26, 'PEEK', { 
        pauseMs: 800, 
        lookDirection: { x: 1, z: 0 }
      }),                                                  // Peek from bench-1 cover
      wp(6, 14, 'MOVE'),                                   // Loop back
    ],
  },

  {
    id: 'PLATFORM_KING_EAST',
    name: 'Platform King (East)',
    description: 'Hold east platform with angle control',
    type: 'DEFENSIVE',
    startZones: ['EAST_PLATFORM', 'SE_SUBWAY'],
    minAggression: 0.0,
    maxAggression: 0.5,
    priorityBoost: 30,
    waypoints: [
      wp(30, 26, 'MOVE'),                                  // Near bench-3
      wp(28, 26, 'PEEK', { 
        pauseMs: 800, 
        lookDirection: { x: -1, z: 0 }
      }),
      wp(30, 20, 'HOLD', { pauseMs: 1000 }),               // Center hold
      wp(28, 14, 'PEEK', { 
        pauseMs: 800, 
        lookDirection: { x: -1, z: 0 }
      }),
      wp(30, 26, 'MOVE'),                                  // Loop back
    ],
  },

  {
    id: 'LUGGAGE_FORT_WEST',
    name: 'Luggage Fort (West)',
    description: 'Use luggage stack as cover, hold angles',
    type: 'DEFENSIVE',
    startZones: ['WEST_PLATFORM'],
    minAggression: 0.0,
    maxAggression: 0.4,
    waypoints: [
      wp(10, 18, 'MOVE'),                                  // Approach luggage-0
      wp(12, 20, 'HOLD', { 
        pauseMs: 1500, 
        lookDirection: { x: 1, z: 0 }
      }),                                                  // Behind luggage, watching door
      wp(10, 22, 'PEEK', { pauseMs: 500 }),                // Quick peek south
      wp(12, 20, 'HOLD', { pauseMs: 1000 }),               // Back to cover
    ],
  },

  // =========================================================================
  // FLANKING PLAYS - For medium aggression (0.4 - 0.7)
  // =========================================================================

  {
    id: 'TRACK_SNEAK_NORTH',
    name: 'Track Sneak (North)',
    description: 'Use track bed to flank via north side',
    type: 'FLANKING',
    startZones: ['WEST_PLATFORM', 'EAST_PLATFORM'],
    minAggression: 0.4,
    maxAggression: 0.7,
    waypoints: [
      wp(16, 10, 'MOVE'),                                  // Drop to track (north of carts)
      wp(18, 5, 'CHECK', { pauseMs: 300, lookDirection: { x: 0, z: -1 } }), // Check north
      wp(20, 10, 'MOVE'),                                  // Cross track
      wp(22, 14, 'MOVE'),                                  // Climb east platform
      wp(28, 14, 'CHECK', { pauseMs: 200 }),               // Check bench area
    ],
  },

  {
    id: 'TRACK_SNEAK_SOUTH',
    name: 'Track Sneak (South)',
    description: 'Use track bed to flank via south side',
    type: 'FLANKING',
    startZones: ['WEST_PLATFORM', 'EAST_PLATFORM'],
    minAggression: 0.4,
    maxAggression: 0.7,
    waypoints: [
      wp(16, 28, 'MOVE'),                                  // Drop to track (south of carts)
      wp(18, 35, 'CHECK', { pauseMs: 300, lookDirection: { x: 0, z: 1 } }), // Check south
      wp(20, 28, 'MOVE'),                                  // Cross track
      wp(22, 26, 'MOVE'),                                  // Climb east platform
      wp(28, 26, 'CHECK', { pauseMs: 200 }),               // Check bench area
    ],
  },

  {
    id: 'PIXEL_PEEK_DOOR',
    name: 'Pixel Peek (Door)',
    description: 'Hold tight angle on train door',
    type: 'FLANKING',
    startZones: ['WEST_PLATFORM', 'EAST_PLATFORM'],
    minAggression: 0.3,
    maxAggression: 0.6,
    waypoints: [
      wp(12, 17, 'MOVE'),                                  // Approach front door angle
      wp(14, 17, 'PEEK', { 
        pauseMs: 600, 
        lookDirection: { x: 1, z: 0 }
      }),                                                  // Tight peek on door
      wp(12, 17, 'MOVE'),                                  // Back off
      wp(12, 23, 'MOVE'),                                  // Reposition to back door
      wp(14, 23, 'PEEK', { 
        pauseMs: 600, 
        lookDirection: { x: 1, z: 0 }
      }),                                                  // Tight peek on back door
    ],
  },

  // =========================================================================
  // RETREAT PLAYS - For very low health or disengaging
  // =========================================================================

  {
    id: 'SUBWAY_ESCAPE_NW',
    name: 'Subway Escape (NW)',
    description: 'Retreat to NW subway entrance',
    type: 'RETREAT',
    startZones: ['ANY'],
    minAggression: 0.0,
    maxAggression: 0.3,
    priorityBoost: 50, // High priority when health low
    waypoints: [
      wp(6, 12, 'MOVE'),                                   // Head toward NW
      wp(5, 8, 'MOVE'),                                    // Approach subway
      wp(4, 6, 'HOLD', { 
        pauseMs: 2000, 
        lookDirection: { x: 1, z: 1 }
      }),                                                  // Hold in subway, watch approach
    ],
  },

  {
    id: 'SUBWAY_ESCAPE_SE',
    name: 'Subway Escape (SE)',
    description: 'Retreat to SE subway entrance',
    type: 'RETREAT',
    startZones: ['ANY'],
    minAggression: 0.0,
    maxAggression: 0.3,
    priorityBoost: 50,
    waypoints: [
      wp(30, 28, 'MOVE'),                                  // Head toward SE
      wp(31, 32, 'MOVE'),                                  // Approach subway
      wp(32, 34, 'HOLD', { 
        pauseMs: 2000, 
        lookDirection: { x: -1, z: -1 }
      }),                                                  // Hold in subway, watch approach
    ],
  },

  {
    id: 'CORNER_BAIT_SW',
    name: 'Corner Bait (SW)',
    description: 'Retreat to SW corner luggage, bait pursuit',
    type: 'RETREAT',
    startZones: ['WEST_PLATFORM'],
    minAggression: 0.0,
    maxAggression: 0.35,
    waypoints: [
      wp(4, 26, 'MOVE'),                                   // Head to SW corner
      wp(2, 28, 'HOLD', { 
        pauseMs: 1000, 
        lookDirection: { x: 1, z: -1 }
      }),                                                  // Behind luggage-4
      wp(4, 30, 'PEEK', { pauseMs: 400 }),                 // Quick peek
      wp(2, 28, 'HOLD', { pauseMs: 800 }),                 // Back to cover
    ],
  },

  {
    id: 'CORNER_BAIT_NE',
    name: 'Corner Bait (NE)',
    description: 'Retreat to NE corner luggage, bait pursuit',
    type: 'RETREAT',
    startZones: ['EAST_PLATFORM'],
    minAggression: 0.0,
    maxAggression: 0.35,
    waypoints: [
      wp(32, 12, 'MOVE'),                                  // Head to NE corner
      wp(34, 10, 'HOLD', { 
        pauseMs: 1000, 
        lookDirection: { x: -1, z: 1 }
      }),                                                  // Behind luggage-5
      wp(32, 8, 'PEEK', { pauseMs: 400 }),                 // Quick peek
      wp(34, 10, 'HOLD', { pauseMs: 800 }),                // Back to cover
    ],
  },
];

// ============================================================================
// Zone Detection
// ============================================================================

export function getStartZone(gridX: number, gridZ: number): StartZone {
  // NW Subway: grid (3-7, 3-8)
  if (gridX >= 3 && gridX <= 7 && gridZ >= 3 && gridZ <= 8) {
    return 'NW_SUBWAY';
  }
  // SE Subway: grid (28-32, 31-36)
  if (gridX >= 28 && gridX <= 32 && gridZ >= 31 && gridZ <= 36) {
    return 'SE_SUBWAY';
  }
  // Track: grid (15-20, any)
  if (gridX >= 15 && gridX <= 20) {
    return 'TRACK';
  }
  // West Platform: grid (1-14, any)
  if (gridX >= 1 && gridX <= 14) {
    return 'WEST_PLATFORM';
  }
  // East Platform: grid (21-34, any)
  if (gridX >= 21 && gridX <= 34) {
    return 'EAST_PLATFORM';
  }
  return 'ANY';
}

export function worldToGrid(worldX: number, worldZ: number): { gridX: number; gridZ: number } {
  return {
    gridX: Math.floor(worldX + 18),
    gridZ: Math.floor(worldZ + 20),
  };
}
