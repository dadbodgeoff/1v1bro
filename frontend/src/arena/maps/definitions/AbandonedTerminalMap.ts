/**
 * AbandonedTerminalMap - Complete map definition for the Abandoned Terminal arena
 *
 * This is the reference implementation for the MapDefinition interface,
 * migrating all hardcoded values from the original codebase.
 *
 * @module maps/definitions/AbandonedTerminalMap
 */

import type { MapDefinition, LightingConfig, PropPlacement } from '../types';
import {
  ABANDONED_TERMINAL_COLLISION_MANIFEST,
  ABANDONED_TERMINAL_SPAWN_MANIFEST,
} from '../../config/AbandonedTerminalManifest';

// ============================================================================
// Asset URLs (extracted from individual builders)
// ============================================================================

const ASSET_BASE = 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/arena';

const TEXTURE_URLS = {
  floor: `${ASSET_BASE}/floor-atlas.jpg`,
  wall: `${ASSET_BASE}/wall-texture.jpg`,
  ceiling: `${ASSET_BASE}/ceiling-texture.jpg`,
  track: `${ASSET_BASE}/track-texture.jpg`,
  tunnel: `${ASSET_BASE}/tunnel-texture.jpg`,
};

const MODEL_URLS = {
  // Original train with baked transforms (98k tris but correct scale)
  train: `${ASSET_BASE}/train2-optimized.glb`,
  subwayEntrance: `${ASSET_BASE}/subway.glb`,
  cart: `${ASSET_BASE}/underground-cart-optimized.glb`,
  fareTerminal: `${ASSET_BASE}/fare-terminal-optimized.glb`,
  bench: `${ASSET_BASE}/weathered-bench.glb`,
  luggage: `${ASSET_BASE}/lost-luggage.glb`,
  wallExpression: `${ASSET_BASE}/wall-expression.glb`,
};

// ============================================================================
// Lighting Configuration (Enterprise AAA-grade v2)
// ============================================================================

const LIGHTING_CONFIG: LightingConfig = {
  ambient: {
    color: 0x505868,  // Slightly cooler for underground feel
    intensity: 0.9,   // Reduced from 1.2 - preserves contrast
  },
  hemisphere: {
    skyColor: 0x404858,
    groundColor: 0x8a8580,
    intensity: 0.65,  // Reduced from 0.9 - lets directional lights dominate
  },
  keyLight: {
    color: 0xe0ecff,  // 5500K daylight through vents
    intensity: 1.5,   // Reduced from 1.8 - prevents overexposure
    position: { x: 5, y: 20, z: -8 },
    shadowMapSize: 2048,  // Increased for crisp shadows
    shadowBias: -0.00025, // Adjusted to reduce acne
    castShadow: true,
  },
  fillLight: {
    color: 0xfff0e0,  // 4000K warm fill
    intensity: 0.55,  // Reduced from 0.8 - softer fill
    position: { x: -8, y: 15, z: 10 },
  },
  // NEW: Rim light for player silhouette separation - critical for PvP
  rimLight: {
    color: 0xc8d8ff,  // Cool blue-white
    intensity: 0.7,
    position: { x: 0, y: 12, z: 15 }, // Behind and above center
    castShadow: false, // Performance: rim doesn't need shadows
  },
  pointLights: [
    // ========================================
    // UTILITY LIGHTS - Main visibility (Priority 1)
    // Reduced from 5 lights @ intensity 24 to 3 lights @ intensity 10-12
    // ========================================
    { type: 'utility', color: 0xfff8e8, intensity: 10, position: { x: -10, y: 2.5, z: 0 }, distance: 18, decay: 1.5, name: 'utility-west' },
    { type: 'utility', color: 0xfff8e8, intensity: 10, position: { x: 10, y: 2.5, z: 0 }, distance: 18, decay: 1.5, name: 'utility-east' },
    { type: 'utility', color: 0xfff8e8, intensity: 12, position: { x: 0, y: 4, z: 0 }, distance: 20, decay: 1.5, name: 'utility-center' },

    // ========================================
    // WALL WASH - Texture visibility (Priority 2)
    // Reduced from 8 lights to 4 cardinal directions
    // ========================================
    { type: 'wallWash', color: 0xfff8f0, intensity: 6, position: { x: 0, y: 2.5, z: -18 }, distance: 18, decay: 1.6, name: 'wall-wash-north' },
    { type: 'wallWash', color: 0xfff8f0, intensity: 6, position: { x: 0, y: 2.5, z: 18 }, distance: 18, decay: 1.6, name: 'wall-wash-south' },
    { type: 'wallWash', color: 0xfff8f0, intensity: 6, position: { x: 16, y: 2.5, z: 0 }, distance: 18, decay: 1.6, name: 'wall-wash-east' },
    { type: 'wallWash', color: 0xfff8f0, intensity: 6, position: { x: -16, y: 2.5, z: 0 }, distance: 18, decay: 1.6, name: 'wall-wash-west' },

    // ========================================
    // EMERGENCY LIGHTS - Atmosphere (Priority 3)
    // Reduced from 4 lights @ intensity 4 to 2 lights @ intensity 2.5
    // ========================================
    { type: 'emergency', color: 0xff3300, intensity: 2.5, position: { x: -17, y: 4, z: -18 }, distance: 8, decay: 2.0, name: 'emergency-nw' },
    { type: 'emergency', color: 0xff3300, intensity: 2.5, position: { x: 17, y: 4, z: 18 }, distance: 8, decay: 2.0, name: 'emergency-se' },

    // ========================================
    // TRACK GLOW - Eerie underlight (Priority 4)
    // Consolidated from 2 lights to 1 centered light
    // ========================================
    { type: 'trackGlow', color: 0x66aacc, intensity: 2.8, position: { x: 0, y: -1.5, z: 0 }, distance: 14, decay: 1.8, name: 'track-glow-center' },

    // ========================================
    // TUNNEL GLOW - Depth cue (Priority 5)
    // Reduced intensity from 5 to 3.5
    // ========================================
    { type: 'tunnelGlow', color: 0x445566, intensity: 3.5, position: { x: 0, y: 1, z: -22 }, distance: 12, decay: 1.6, name: 'tunnel-glow-north' },
    { type: 'tunnelGlow', color: 0x445566, intensity: 3.5, position: { x: 0, y: 1, z: 22 }, distance: 12, decay: 1.6, name: 'tunnel-glow-south' },
  ],
  // Total: 12 point lights (down from 21) - fits within Ultra tier budget with priority culling
};

// ============================================================================
// Prop Placements (extracted from individual builders)
// ============================================================================

const PROP_PLACEMENTS: PropPlacement[] = [
  // Wall expressions (at track ends - on sunken track floor at Y=-0.6)
  {
    assetKey: 'wallExpression',
    positions: [
      { x: 0, y: -0.6, z: -18, rotationY: 0, scale: 2.0 },
      { x: 0, y: -0.6, z: 18, rotationY: Math.PI, scale: 2.0 },
    ],
  },
  // Benches (along platform edges)
  {
    assetKey: 'bench',
    positions: [
      { x: -10, y: 0, z: -6, rotationY: Math.PI / 2, scale: 1.2 },
      { x: -10, y: 0, z: 6, rotationY: Math.PI / 2, scale: 1.2 },
      { x: 10, y: 0, z: -6, rotationY: -Math.PI / 2, scale: 1.2 },
      { x: 10, y: 0, z: 6, rotationY: -Math.PI / 2, scale: 1.2 },
    ],
  },
  // Luggage stacks (strategic cover)
  {
    assetKey: 'luggage',
    positions: [
      { x: -4, y: 0, z: 0, rotationY: Math.PI / 2, scale: 0.5 },
      { x: 4, y: 0, z: 0, rotationY: -Math.PI / 2, scale: 0.5 },
      { x: -10, y: 0, z: -16, rotationY: 0, scale: 0.5 },
      { x: 10, y: 0, z: 16, rotationY: Math.PI, scale: 0.5 },
      { x: -14, y: 0, z: 8, rotationY: Math.PI / 4, scale: 0.5 },
      { x: 14, y: 0, z: -8, rotationY: -Math.PI / 4, scale: 0.5 },
    ],
  },
  // Underground carts (on tracks)
  {
    assetKey: 'cart',
    positions: [
      { x: 0, y: -0.6, z: -13.25, rotationY: Math.PI / 2, scale: 2.45 },
      { x: 0, y: -0.6, z: 13.25, rotationY: -Math.PI / 2, scale: 2.45 },
    ],
  },
  // Fare terminals (on platforms)
  {
    assetKey: 'fareTerminal',
    positions: [
      { x: -8, y: 0, z: -10, rotationY: Math.PI / 2, scale: 2.1 },
      { x: 8, y: 0, z: 10, rotationY: -Math.PI / 2, scale: 2.1 },
    ],
  },
];

// ============================================================================
// Map Definition
// ============================================================================

export const AbandonedTerminalMap: MapDefinition = {
  id: 'abandoned_terminal',
  name: 'Abandoned Terminal',
  description:
    'A derelict subway station with platforms on either side of the tracks. Use the train car and pillars for cover.',
  playerCount: {
    min: 2,
    max: 2,
  },
  arenaConfig: {
    // Main dimensions
    width: 36,
    depth: 40,
    wallHeight: 6,
    wallThickness: 0.4,
    ceilingHeight: 6,

    // Window configuration
    windowHeight: 2.5,
    windowBottom: 1.5,
    windowWidth: 4,
    windowSpacing: 6,

    // Track configuration
    tracks: {
      width: 5,
      depth: 0.6,
      railWidth: 0.1,
      railHeight: 0.15,
      railSpacing: 1.4,
      sleeperWidth: 2.2,
      sleeperDepth: 0.15,
      sleeperSpacing: 0.6,
    },

    // Platform edge
    platformEdge: {
      width: 0.3,
      tactileWidth: 0.6,
    },

    // Subway entrance
    subwayEntrance: {
      width: 6,
      depth: 8,
      stairDepth: 1.5,
      stairSteps: 8,
      gateHeight: 2.2,
    },

    // Spawn positions
    spawns: {
      player1: { x: -14, y: -1.5, z: -16 },
      player2: { x: 14, y: -1.5, z: 16 },
    },

    // Hanging light positions
    lightPositions: [
      { x: -10, z: -10 },
      { x: 10, z: -10 },
      { x: -10, z: 10 },
      { x: 10, z: 10 },
      { x: 0, z: -12 },
      { x: 0, z: 12 },
    ],

    // Colors
    colors: {
      floor: 0xd4cfc4,
      wall: 0x8a8580,
      ceiling: 0x6a6560,
      windowFrame: 0x3a3530,
      lightFixture: 0x2a2520,
      lightEmissive: 0xfff5e6,
      ambient: 0x404040,
      fog: 0x1a1a1a,
      trackBed: 0x2a2520,
      rail: 0x4a4a4a,
      sleeper: 0x3d2b1f,
      yellowLine: 0xf4d03f,
      tactileStrip: 0xc4a000,
      gate: 0x5a5a5a,
    },
  },
  assets: {
    textures: TEXTURE_URLS,
    models: MODEL_URLS,
  },
  collisionManifest: ABANDONED_TERMINAL_COLLISION_MANIFEST,
  spawnManifest: ABANDONED_TERMINAL_SPAWN_MANIFEST,
  lightingConfig: LIGHTING_CONFIG,
  props: PROP_PLACEMENTS,
};
