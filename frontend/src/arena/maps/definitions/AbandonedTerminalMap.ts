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
  train: `${ASSET_BASE}/train2-optimized.glb`,
  subwayEntrance: `${ASSET_BASE}/subway.glb`,
  cart: `${ASSET_BASE}/underground-cart-optimized.glb`,
  fareTerminal: `${ASSET_BASE}/fare-terminal-optimized.glb`,
  bench: `${ASSET_BASE}/weathered-bench.glb`,
  luggage: `${ASSET_BASE}/lost-luggage.glb`,
  wallExpression: `${ASSET_BASE}/wall-expression.glb`,
};

// ============================================================================
// Lighting Configuration (extracted from LightingBuilder.ts)
// ============================================================================

const LIGHTING_CONFIG: LightingConfig = {
  ambient: {
    color: 0x606878,
    intensity: 1.2,
  },
  hemisphere: {
    skyColor: 0x505868,
    groundColor: 0x8a8580,
    intensity: 0.9,
  },
  keyLight: {
    color: 0xe8f0ff,
    intensity: 1.8,
    position: { x: 5, y: 20, z: -8 },
    shadowMapSize: 1024,
    shadowBias: -0.0001,
    castShadow: true,
  },
  fillLight: {
    color: 0xfff0e0,
    intensity: 0.8,
    position: { x: -8, y: 15, z: 10 },
  },
  pointLights: [
    // Emergency lights (exit signs, strips)
    { type: 'emergency', color: 0xff3300, intensity: 4, position: { x: -17, y: 4, z: -18 }, distance: 10, decay: 1.8, name: 'emergency-0' },
    { type: 'emergency', color: 0xff3300, intensity: 4, position: { x: 17, y: 4, z: 18 }, distance: 10, decay: 1.8, name: 'emergency-1' },
    { type: 'emergency', color: 0xff3300, intensity: 4, position: { x: 0, y: 3.5, z: -19 }, distance: 10, decay: 1.8, name: 'emergency-2' },
    { type: 'emergency', color: 0xff3300, intensity: 4, position: { x: 0, y: 3.5, z: 19 }, distance: 10, decay: 1.8, name: 'emergency-3' },

    // Utility lights (work lights - main visibility)
    { type: 'utility', color: 0xfff8e8, intensity: 24, position: { x: -10, y: 2.5, z: 0 }, distance: 20.8, decay: 1.4, name: 'utility-0' },
    { type: 'utility', color: 0xfff8e8, intensity: 24, position: { x: 10, y: 2.5, z: 0 }, distance: 20.8, decay: 1.4, name: 'utility-1' },
    { type: 'utility', color: 0xfff8e8, intensity: 24, position: { x: 0, y: 4, z: 0 }, distance: 20.8, decay: 1.4, name: 'utility-2' },
    { type: 'utility', color: 0xfff8e8, intensity: 24, position: { x: 0, y: 3, z: -14 }, distance: 20.8, decay: 1.4, name: 'utility-3' },
    { type: 'utility', color: 0xfff8e8, intensity: 24, position: { x: 0, y: 3, z: 14 }, distance: 20.8, decay: 1.4, name: 'utility-4' },

    // Track pit glow (eerie underlight)
    { type: 'trackGlow', color: 0x66aacc, intensity: 4.5, position: { x: 0, y: -1.5, z: -8 }, distance: 16, decay: 1.8, name: 'track-glow-0' },
    { type: 'trackGlow', color: 0x66aacc, intensity: 4.5, position: { x: 0, y: -1.5, z: 8 }, distance: 16, decay: 1.8, name: 'track-glow-1' },

    // Tunnel mouth glow
    { type: 'tunnelGlow', color: 0x445566, intensity: 5, position: { x: 0, y: 1, z: -22 }, distance: 15, decay: 1.5, name: 'tunnel-glow-0' },
    { type: 'tunnelGlow', color: 0x445566, intensity: 5, position: { x: 0, y: 1, z: 22 }, distance: 15, decay: 1.5, name: 'tunnel-glow-1' },

    // Wall wash (texture enhancement)
    { type: 'wallWash', color: 0xeef4ff, intensity: 4.5, position: { x: 0, y: 1.5, z: -18 }, distance: 18, decay: 1.8, name: 'wall-wash-n' },
    { type: 'wallWash', color: 0xeef4ff, intensity: 4.5, position: { x: 0, y: 1.5, z: 18 }, distance: 18, decay: 1.8, name: 'wall-wash-s' },
    { type: 'wallWash', color: 0xeef4ff, intensity: 4.5, position: { x: 16, y: 1.5, z: 0 }, distance: 18, decay: 1.8, name: 'wall-wash-e' },
    { type: 'wallWash', color: 0xeef4ff, intensity: 4.5, position: { x: -16, y: 1.5, z: 0 }, distance: 18, decay: 1.8, name: 'wall-wash-w' },
  ],
};

// ============================================================================
// Prop Placements (extracted from individual builders)
// ============================================================================

const PROP_PLACEMENTS: PropPlacement[] = [
  // Wall expressions (at track ends)
  {
    assetKey: 'wallExpression',
    positions: [
      { x: 0, y: 0, z: -18, rotationY: 0, scale: 2.0 },
      { x: 0, y: 0, z: 18, rotationY: Math.PI, scale: 2.0 },
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
