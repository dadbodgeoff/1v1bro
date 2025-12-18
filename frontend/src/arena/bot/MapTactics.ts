/**
 * MapTactics - Map-specific tactical knowledge for Abandoned Terminal
 * 
 * Encodes the "Lane & Cross" dynamic:
 * - 3 Pushing Lanes (attack patterns)
 * - 3 Retreat Lanes (defense patterns)
 * - Smart Angles (pixel peeks, ambush spots, flanking coords)
 * 
 * All coordinates are in GRID space (0-35 X, 0-39 Z)
 * Convert to world: worldX = gridX - 18, worldZ = gridZ - 20
 */

import { Vector3 } from 'three';

// ============================================================================
// Types
// ============================================================================

export interface TacticalWaypoint {
  gridX: number;
  gridZ: number;
  /** Pause duration in ms (0 = no pause) */
  pauseMs: number;
  /** Action to perform at this waypoint */
  action: 'move' | 'check' | 'prefire' | 'scan' | 'hold' | 'crouch';
  /** Optional aim direction override */
  aimDirection?: 'east' | 'west' | 'north' | 'south' | 'player';
}

export interface TacticalLane {
  id: string;
  name: string;
  type: 'push' | 'retreat';
  /** When to use this lane */
  trigger: {
    /** Bot must be on this side of map (X < 18 = west, X > 18 = east) */
    botSide?: 'west' | 'east';
    /** Player must be on this side */
    playerSide?: 'west' | 'east';
    /** Minimum aggression level (0-1) */
    minAggression?: number;
    /** Maximum aggression level */
    maxAggression?: number;
    /** Health threshold (retreat if below) */
    healthBelow?: number;
    /** Near spawn point */
    nearSpawn?: boolean;
    /** Player is rushing (close range) */
    playerRushing?: boolean;
    /** Critical health (< 20%) */
    criticalHealth?: boolean;
  };
  /** Waypoints to follow */
  waypoints: TacticalWaypoint[];
  /** Combat style during this lane */
  combatStyle: 'aggressive' | 'cautious' | 'defensive' | 'ambush';
}

export interface SmartAngle {
  id: string;
  name: string;
  gridX: number;
  gridZ: number;
  /** What this angle covers */
  covers: 'front_door' | 'back_door' | 'west_platform' | 'east_platform' | 'spawn';
  /** How long to hold this angle (ms) */
  holdDuration: number;
  /** Aim direction */
  aimDirection: 'east' | 'west' | 'north' | 'south';
  /** Type of angle */
  type: 'sniper' | 'ambush' | 'flank';
}

export interface MapTacticsData {
  pushingLanes: TacticalLane[];
  retreatLanes: TacticalLane[];
  smartAngles: SmartAngle[];
  /** Key chokepoints (train doors) */
  chokepoints: { gridX: number; gridZ: number; name: string }[];
}

// ============================================================================
// Grid/World Conversion
// ============================================================================

export function gridToWorld(gridX: number, gridZ: number): Vector3 {
  return new Vector3(gridX - 18 + 0.5, 0, gridZ - 20 + 0.5);
}

export function worldToGrid(worldX: number, worldZ: number): { gridX: number; gridZ: number } {
  return {
    gridX: Math.floor(worldX + 18),
    gridZ: Math.floor(worldZ + 20)
  };
}

// ============================================================================
// Pushing Lanes (Attack Patterns)
// ============================================================================

const PUSHING_LANES: TacticalLane[] = [
  // Lane 1: West Side Sweep - Map control from NW spawn
  {
    id: 'west_side_sweep',
    name: 'West Side Sweep',
    type: 'push',
    trigger: {
      botSide: 'west',
      minAggression: 0.5,
    },
    waypoints: [
      // Start: NW Spawn area
      { gridX: 4, gridZ: 8, pauseMs: 0, action: 'move' },
      // Waypoint A: The Check - Bench cover
      { gridX: 6, gridZ: 12, pauseMs: 500, action: 'check', aimDirection: 'east' },
      // Waypoint B: The Pivot - Central luggage (strong cover)
      { gridX: 5, gridZ: 20, pauseMs: 300, action: 'move' },
      // Waypoint C: The Breach - Back train door
      { gridX: 12, gridZ: 22, pauseMs: 0, action: 'prefire' },
      // Exit: Flank position on east side
      { gridX: 26, gridZ: 22, pauseMs: 0, action: 'scan' },
    ],
    combatStyle: 'aggressive',
  },

  // Lane 2: Needle Threader - Direct assault through train
  {
    id: 'needle_threader',
    name: 'Needle Threader',
    type: 'push',
    trigger: {
      botSide: 'west',
      playerSide: 'east',
      minAggression: 0.7,
    },
    waypoints: [
      // Sprint to front door entrance
      { gridX: 10, gridZ: 16, pauseMs: 0, action: 'prefire' },
      // Cross through train
      { gridX: 18, gridZ: 16, pauseMs: 0, action: 'move' },
      // Exit east side
      { gridX: 26, gridZ: 16, pauseMs: 0, action: 'move' },
      // Slide to east luggage
      { gridX: 30, gridZ: 13, pauseMs: 0, action: 'scan' },
    ],
    combatStyle: 'aggressive',
  },

  // Lane 3: Platform King - Ranged suppression (no crossing)
  {
    id: 'platform_king',
    name: 'Platform King',
    type: 'push',
    trigger: {
      botSide: 'east',
      maxAggression: 0.6,
    },
    waypoints: [
      // Start: SE spawn
      { gridX: 32, gridZ: 32, pauseMs: 0, action: 'move' },
      // Move to luggage cover
      { gridX: 30, gridZ: 25, pauseMs: 500, action: 'check', aimDirection: 'west' },
      // Creep to north luggage
      { gridX: 30, gridZ: 10, pauseMs: 0, action: 'move' },
      // Strafe zone - hold and strafe
      { gridX: 30, gridZ: 14, pauseMs: 2000, action: 'hold', aimDirection: 'west' },
    ],
    combatStyle: 'cautious',
  },

  // Mirror lanes for east side
  {
    id: 'east_side_sweep',
    name: 'East Side Sweep',
    type: 'push',
    trigger: {
      botSide: 'east',
      minAggression: 0.5,
    },
    waypoints: [
      { gridX: 32, gridZ: 32, pauseMs: 0, action: 'move' },
      { gridX: 30, gridZ: 27, pauseMs: 500, action: 'check', aimDirection: 'west' },
      { gridX: 31, gridZ: 20, pauseMs: 300, action: 'move' },
      { gridX: 24, gridZ: 17, pauseMs: 0, action: 'prefire' },
      { gridX: 10, gridZ: 17, pauseMs: 0, action: 'scan' },
    ],
    combatStyle: 'aggressive',
  },
];

// ============================================================================
// Retreat Lanes (Defense Patterns)
// ============================================================================

const RETREAT_LANES: TacticalLane[] = [
  // Retreat 1: Fade to Shadow - Subway bait
  {
    id: 'fade_to_shadow_nw',
    name: 'Fade to Shadow (NW)',
    type: 'retreat',
    trigger: {
      botSide: 'west',
      nearSpawn: true,
      healthBelow: 0.4,
    },
    waypoints: [
      // Retreat into NW subway
      { gridX: 6, gridZ: 6, pauseMs: 0, action: 'move' },
      // Deep into subway
      { gridX: 4, gridZ: 4, pauseMs: 0, action: 'crouch' },
      // Hold angle on entrance
      { gridX: 4, gridZ: 5, pauseMs: 3000, action: 'hold', aimDirection: 'south' },
    ],
    combatStyle: 'ambush',
  },

  {
    id: 'fade_to_shadow_se',
    name: 'Fade to Shadow (SE)',
    type: 'retreat',
    trigger: {
      botSide: 'east',
      nearSpawn: true,
      healthBelow: 0.4,
    },
    waypoints: [
      { gridX: 30, gridZ: 32, pauseMs: 0, action: 'move' },
      { gridX: 32, gridZ: 34, pauseMs: 0, action: 'crouch' },
      { gridX: 32, gridZ: 33, pauseMs: 3000, action: 'hold', aimDirection: 'north' },
    ],
    combatStyle: 'ambush',
  },

  // Retreat 2: The Carousel - Luggage looping
  {
    id: 'carousel_west',
    name: 'Carousel (West)',
    type: 'retreat',
    trigger: {
      botSide: 'west',
      playerRushing: true,
    },
    waypoints: [
      // Anchor at west luggage cluster
      { gridX: 4, gridZ: 26, pauseMs: 1000, action: 'move' },
      // Loop around
      { gridX: 8, gridZ: 26, pauseMs: 1000, action: 'check', aimDirection: 'player' },
      // Back to start
      { gridX: 4, gridZ: 28, pauseMs: 1000, action: 'move' },
      { gridX: 4, gridZ: 26, pauseMs: 1000, action: 'check', aimDirection: 'player' },
    ],
    combatStyle: 'defensive',
  },

  {
    id: 'carousel_east',
    name: 'Carousel (East)',
    type: 'retreat',
    trigger: {
      botSide: 'east',
      playerRushing: true,
    },
    waypoints: [
      { gridX: 32, gridZ: 12, pauseMs: 1000, action: 'move' },
      { gridX: 28, gridZ: 12, pauseMs: 1000, action: 'check', aimDirection: 'player' },
      { gridX: 32, gridZ: 10, pauseMs: 1000, action: 'move' },
      { gridX: 32, gridZ: 12, pauseMs: 1000, action: 'check', aimDirection: 'player' },
    ],
    combatStyle: 'defensive',
  },

  // Retreat 3: Track Dive - Desperation move
  {
    id: 'track_dive_front',
    name: 'Track Dive (Front Door)',
    type: 'retreat',
    trigger: {
      criticalHealth: true,
    },
    waypoints: [
      // Dash into front train door
      { gridX: 16, gridZ: 16, pauseMs: 0, action: 'move' },
      // Crouch inside
      { gridX: 18, gridZ: 17, pauseMs: 0, action: 'crouch' },
      // Hold in darkness
      { gridX: 18, gridZ: 17, pauseMs: 2000, action: 'hold', aimDirection: 'player' },
    ],
    combatStyle: 'defensive',
  },

  {
    id: 'track_dive_back',
    name: 'Track Dive (Back Door)',
    type: 'retreat',
    trigger: {
      criticalHealth: true,
    },
    waypoints: [
      { gridX: 20, gridZ: 22, pauseMs: 0, action: 'move' },
      { gridX: 18, gridZ: 23, pauseMs: 0, action: 'crouch' },
      { gridX: 18, gridZ: 23, pauseMs: 2000, action: 'hold', aimDirection: 'player' },
    ],
    combatStyle: 'defensive',
  },
];

// ============================================================================
// Smart Angles
// ============================================================================

const SMART_ANGLES: SmartAngle[] = [
  // Pixel Peek Angles
  {
    id: 'west_sniper',
    name: 'West Sniper Spot',
    gridX: 5,
    gridZ: 16,
    covers: 'front_door',
    holdDuration: 3000,
    aimDirection: 'east',
    type: 'sniper',
  },
  {
    id: 'east_sniper',
    name: 'East Sniper Spot',
    gridX: 31,
    gridZ: 22,
    covers: 'back_door',
    holdDuration: 3000,
    aimDirection: 'west',
    type: 'sniper',
  },

  // Ambush Corners
  {
    id: 'nw_corner_ambush',
    name: 'NW Corner Ambush',
    gridX: 1,
    gridZ: 1,
    covers: 'spawn',
    holdDuration: 5000,
    aimDirection: 'south',
    type: 'ambush',
  },
  {
    id: 'train_shadow',
    name: 'Train Shadow',
    gridX: 11,
    gridZ: 19,
    covers: 'front_door',
    holdDuration: 4000,
    aimDirection: 'east',
    type: 'ambush',
  },
  {
    id: 'train_shadow_east',
    name: 'Train Shadow (East)',
    gridX: 25,
    gridZ: 19,
    covers: 'back_door',
    holdDuration: 4000,
    aimDirection: 'west',
    type: 'ambush',
  },

  // Flanking Coordinates
  {
    id: 'west_center_flank',
    name: 'West Center Flank',
    gridX: 6,
    gridZ: 20,
    covers: 'west_platform',
    holdDuration: 2000,
    aimDirection: 'east',
    type: 'flank',
  },
  {
    id: 'east_center_flank',
    name: 'East Center Flank',
    gridX: 30,
    gridZ: 20,
    covers: 'east_platform',
    holdDuration: 2000,
    aimDirection: 'west',
    type: 'flank',
  },
];

// ============================================================================
// Chokepoints
// ============================================================================

const CHOKEPOINTS = [
  { gridX: 16, gridZ: 16, name: 'Front Door West' },
  { gridX: 20, gridZ: 16, name: 'Front Door East' },
  { gridX: 16, gridZ: 22, name: 'Back Door West' },
  { gridX: 20, gridZ: 22, name: 'Back Door East' },
];

// ============================================================================
// Track Fear Factor
// ============================================================================

/** Track cells (X: 15-20) have higher traversal cost */
const TRACK_COST_MULTIPLIER = 3;

/**
 * Check if a grid position is on the track (lower level)
 * Track is at grid X: 15-20 (world X: -3 to +2)
 */
export function isOnTrack(gridX: number): boolean {
  return gridX >= 15 && gridX <= 20;
}

/**
 * Calculate the traversal cost for a path
 * Track cells cost 3x more, discouraging casual track crossing
 */
export function calculatePathCost(waypoints: TacticalWaypoint[]): number {
  let cost = 0;
  
  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];
    
    // Base distance cost
    const dx = to.gridX - from.gridX;
    const dz = to.gridZ - from.gridZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    // Apply track multiplier if crossing track
    const crossesTrack = isOnTrack(from.gridX) || isOnTrack(to.gridX);
    const multiplier = crossesTrack ? TRACK_COST_MULTIPLIER : 1;
    
    cost += dist * multiplier;
  }
  
  return cost;
}

/**
 * Check if a lane crosses the track
 */
export function laneUsesTrack(lane: TacticalLane): boolean {
  return lane.waypoints.some(wp => isOnTrack(wp.gridX));
}

// ============================================================================
// Main Export
// ============================================================================

export const MAP_TACTICS: MapTacticsData = {
  pushingLanes: PUSHING_LANES,
  retreatLanes: RETREAT_LANES,
  smartAngles: SMART_ANGLES,
  chokepoints: CHOKEPOINTS,
};



// ============================================================================
// Lane Selection Logic
// ============================================================================

export interface LaneSelectionContext {
  botPosition: Vector3;
  playerPosition: Vector3;
  botHealth: number;
  botMaxHealth: number;
  aggression: number;
  playerVisible: boolean;
  playerDistance: number;
}

/**
 * Determines which side of the map a position is on
 */
export function getMapSide(position: Vector3): 'west' | 'east' {
  return position.x < 0 ? 'west' : 'east';
}

/**
 * Check if position is near a spawn point
 */
export function isNearSpawn(position: Vector3): boolean {
  const spawnNW = new Vector3(-14, 0, -12);
  const spawnSE = new Vector3(14, 0, 12);
  
  const distNW = position.distanceTo(spawnNW);
  const distSE = position.distanceTo(spawnSE);
  
  return distNW < 8 || distSE < 8;
}

/**
 * Select the best pushing lane based on context
 * @param mercyActive - If true, disables aggressive cross-map lanes
 */
export function selectPushingLane(ctx: LaneSelectionContext, mercyActive = false): TacticalLane | null {
  const botSide = getMapSide(ctx.botPosition);
  const playerSide = getMapSide(ctx.playerPosition);
  
  // Score each lane
  let bestLane: TacticalLane | null = null;
  let bestScore = -1;
  
  for (const lane of PUSHING_LANES) {
    let score = 0;
    const t = lane.trigger;
    
    // MERCY SYSTEM: Disable aggressive cross-map lanes when dominating
    if (mercyActive) {
      // Disable Needle Threader and direct assault lanes
      if (lane.id.includes('threader') || lane.combatStyle === 'aggressive') {
        continue; // Skip this lane entirely
      }
      // Boost defensive/cautious lanes
      if (lane.combatStyle === 'cautious') score += 5;
    }
    
    // Check side requirements
    if (t.botSide && t.botSide !== botSide) continue;
    if (t.playerSide && t.playerSide !== playerSide) continue;
    
    // Check aggression requirements
    if (t.minAggression !== undefined && ctx.aggression < t.minAggression) continue;
    if (t.maxAggression !== undefined && ctx.aggression > t.maxAggression) continue;
    
    // Score based on how well it matches
    if (t.botSide === botSide) score += 2;
    if (t.playerSide === playerSide) score += 3;
    
    // Prefer aggressive lanes when aggression is high
    if (lane.combatStyle === 'aggressive' && ctx.aggression > 0.7) score += 2;
    if (lane.combatStyle === 'cautious' && ctx.aggression < 0.5) score += 2;
    
    // Prefer cross-map lanes when player is on opposite side
    if (botSide !== playerSide && lane.id.includes('threader')) score += 3;
    
    if (score > bestScore) {
      bestScore = score;
      bestLane = lane;
    }
  }
  
  return bestLane;
}

/**
 * Select the best retreat lane based on context
 */
export function selectRetreatLane(ctx: LaneSelectionContext): TacticalLane | null {
  const botSide = getMapSide(ctx.botPosition);
  const healthRatio = ctx.botHealth / ctx.botMaxHealth;
  const nearSpawn = isNearSpawn(ctx.botPosition);
  const playerRushing = ctx.playerDistance < 8;
  const criticalHealth = healthRatio < 0.2;
  
  let bestLane: TacticalLane | null = null;
  let bestScore = -1;
  
  for (const lane of RETREAT_LANES) {
    let score = 0;
    const t = lane.trigger;
    
    // Check side requirements
    if (t.botSide && t.botSide !== botSide) continue;
    
    // Check health requirements
    if (t.healthBelow !== undefined && healthRatio > t.healthBelow) continue;
    
    // Check situational triggers
    if (t.nearSpawn && !nearSpawn) continue;
    if (t.playerRushing && !playerRushing) continue;
    if (t.criticalHealth && !criticalHealth) continue;
    
    // Score based on match quality
    if (t.botSide === botSide) score += 2;
    if (t.nearSpawn && nearSpawn) score += 3;
    if (t.playerRushing && playerRushing) score += 3;
    if (t.criticalHealth && criticalHealth) score += 5; // Highest priority
    
    // Prefer ambush style when health is low
    if (lane.combatStyle === 'ambush' && healthRatio < 0.3) score += 2;
    
    if (score > bestScore) {
      bestScore = score;
      bestLane = lane;
    }
  }
  
  return bestLane;
}

/**
 * Find the nearest smart angle to a position
 */
export function findNearestSmartAngle(
  position: Vector3,
  type?: SmartAngle['type']
): SmartAngle | null {
  let nearest: SmartAngle | null = null;
  let nearestDist = Infinity;
  
  for (const angle of SMART_ANGLES) {
    if (type && angle.type !== type) continue;
    
    const angleWorld = gridToWorld(angle.gridX, angle.gridZ);
    const dist = position.distanceTo(angleWorld);
    
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = angle;
    }
  }
  
  return nearest;
}

/**
 * Get smart angles that cover a specific area
 */
export function getAnglesForCoverage(
  covers: SmartAngle['covers']
): SmartAngle[] {
  return SMART_ANGLES.filter(a => a.covers === covers);
}

/**
 * Check if a position is at a chokepoint
 */
export function isAtChokepoint(position: Vector3, threshold = 2): boolean {
  for (const cp of CHOKEPOINTS) {
    const cpWorld = gridToWorld(cp.gridX, cp.gridZ);
    if (position.distanceTo(cpWorld) < threshold) {
      return true;
    }
  }
  return false;
}

/**
 * Get the nearest chokepoint
 */
export function getNearestChokepoint(position: Vector3): { gridX: number; gridZ: number; name: string } | null {
  let nearest = null;
  let nearestDist = Infinity;
  
  for (const cp of CHOKEPOINTS) {
    const cpWorld = gridToWorld(cp.gridX, cp.gridZ);
    const dist = position.distanceTo(cpWorld);
    
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = cp;
    }
  }
  
  return nearest;
}

/**
 * Calculate the optimal flanking position given player location
 * Uses the "Pincer" logic - if player is at west center, bot goes to east center via back door
 */
export function calculateFlankPosition(
  _botPosition: Vector3,
  playerPosition: Vector3
): { target: Vector3; viaChokepoint: { gridX: number; gridZ: number } } {
  const playerSide = getMapSide(playerPosition);
  
  // Target the opposite side's center
  const targetGridX = playerSide === 'west' ? 30 : 6;
  const targetGridZ = 20; // Center Z
  
  // Choose the back door (Z=22) for flanking - less expected
  const chokepoint = { gridX: playerSide === 'west' ? 20 : 16, gridZ: 22 };
  
  return {
    target: gridToWorld(targetGridX, targetGridZ),
    viaChokepoint: chokepoint,
  };
}
