/**
 * ArenaConfig - All arena dimensions and settings
 * Single source of truth for the Abandoned Terminal map
 * 
 * @deprecated Use MapRegistry and MapLoader instead.
 * Import map definitions from '@/arena/maps/definitions' which auto-register
 * with MapRegistry. Then use MapLoader to load the map and access arenaConfig
 * from LoadedMap.definition.arenaConfig.
 * 
 * Example:
 * ```typescript
 * import '@/arena/maps/definitions';
 * import { MapLoader } from '@/arena/maps/MapLoader';
 * 
 * const loader = new MapLoader();
 * const result = await loader.load('abandoned_terminal');
 * if (result.ok) {
 *   const { arenaConfig } = result.value.definition;
 * }
 * ```
 */

export const ARENA_CONFIG = {
  // Main floor dimensions (meters)
  width: 36,
  depth: 40,
  
  // Wall config
  wallHeight: 6,
  wallThickness: 0.4,
  windowHeight: 2.5,
  windowBottom: 1.5,
  windowWidth: 4,
  windowSpacing: 6,
  
  // Train tracks (sunken channel in middle)
  tracks: {
    width: 5,           // Total track bed width
    depth: 0.6,         // How deep the track bed is sunken
    railWidth: 0.1,     // Width of each rail
    railHeight: 0.15,   // Height of rails above track bed
    railSpacing: 1.4,   // Distance between rails (standard gauge ~1.435m)
    sleeperWidth: 2.2,  // Width of sleepers/ties
    sleeperDepth: 0.15, // Thickness of sleepers
    sleeperSpacing: 0.6,// Gap between sleepers
  },
  
  // Platform edge (yellow safety line)
  platformEdge: {
    width: 0.3,         // Yellow line width
    tactileWidth: 0.6,  // Tactile warning strip width
  },
  
  // Subway entrances (diagonal corners)
  subwayEntrance: {
    width: 6,           // Entrance width
    depth: 8,           // How far back the entrance goes
    stairDepth: 1.5,    // How deep stairs descend
    stairSteps: 8,      // Number of steps
    gateHeight: 2.2,    // Height of blocking gate
  },
  
  // Ceiling
  ceilingHeight: 6,
  
  // Spawn points (at bottom of subway stairs)
  spawns: {
    player1: { x: -14, y: -1.5, z: -16 },  // Top-left subway
    player2: { x: 14, y: -1.5, z: 16 },    // Bottom-right subway
  },
  
  // Hanging light positions (adjusted for new layout)
  lightPositions: [
    { x: -10, z: -10 },
    { x: 10, z: -10 },
    { x: -10, z: 10 },
    { x: 10, z: 10 },
    { x: 0, z: -12 },   // Over north platform
    { x: 0, z: 12 },    // Over south platform
  ],
  
  // Colors
  colors: {
    floor: 0xd4cfc4,        // Warm cream terrazzo
    wall: 0x8a8580,         // Aged plaster
    ceiling: 0x6a6560,      // Dark ceiling
    windowFrame: 0x3a3530,
    lightFixture: 0x2a2520,
    lightEmissive: 0xfff5e6,
    ambient: 0x404040,
    fog: 0x1a1a1a,
    // Track colors
    trackBed: 0x2a2520,     // Dark gravel/concrete
    rail: 0x4a4a4a,         // Steel rails
    sleeper: 0x3d2b1f,      // Dark wood sleepers
    // Safety colors
    yellowLine: 0xf4d03f,   // Safety yellow
    tactileStrip: 0xc4a000, // Darker yellow bumps
    // Gate colors
    gate: 0x5a5a5a,         // Metal gate
  },
} as const

export type ArenaConfig = typeof ARENA_CONFIG
