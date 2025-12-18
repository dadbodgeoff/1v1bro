/**
 * Arena Map Registry - Type Definitions
 *
 * Central type definitions for the map registry system.
 * All map-specific data is encapsulated in the MapDefinition interface.
 *
 * @module maps/types
 */

// Re-export existing types from physics and game modules
export type { CollisionManifest, AABBDefinition } from '../physics/CollisionWorld';
export type { SpawnManifest, SpawnPointDefinition } from '../game/SpawnSystem';

// ============================================================================
// Shared Constants
// ============================================================================

/** Draco decoder path for compressed GLB models */
export const DRACO_DECODER_PATH = 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/';

// ============================================================================
// Position Types
// ============================================================================

/** Tuple format for positions (consistent with existing manifests) */
export type Position3 = [number, number, number];

/** Object format for configs that need named fields */
export interface Vector3Config {
  x: number;
  y: number;
  z: number;
}

// ============================================================================
// Arena Configuration
// ============================================================================

/** Track/rail configuration for subway-style maps */
export interface TrackConfig {
  width: number;
  depth: number;
  railWidth: number;
  railHeight: number;
  railSpacing: number;
  sleeperWidth: number;
  sleeperDepth: number;
  sleeperSpacing: number;
}

/** Color configuration for all map surfaces and elements */
export interface ColorConfig {
  floor: number;
  wall: number;
  ceiling: number;
  windowFrame: number;
  lightFixture: number;
  lightEmissive: number;
  ambient: number;
  fog: number;
  trackBed: number;
  rail: number;
  sleeper: number;
  yellowLine: number;
  tactileStrip: number;
  gate: number;
}

/** Platform edge configuration */
export interface PlatformEdgeConfig {
  width: number;
  tactileWidth: number;
}

/** Subway entrance configuration */
export interface SubwayEntranceConfig {
  width: number;
  depth: number;
  stairDepth: number;
  stairSteps: number;
  gateHeight: number;
}

/** Player spawn position configuration */
export interface SpawnPositionConfig {
  player1: Vector3Config;
  player2: Vector3Config;
}

/** Light position for hanging lights */
export interface LightPosition {
  x: number;
  z: number;
}

/** Complete arena configuration - dimensions, colors, and structural parameters */
export interface ArenaConfig {
  // Main dimensions
  readonly width: number;
  readonly depth: number;
  readonly wallHeight: number;
  readonly wallThickness: number;
  readonly ceilingHeight: number;

  // Window configuration
  readonly windowHeight: number;
  readonly windowBottom: number;
  readonly windowWidth: number;
  readonly windowSpacing: number;

  // Sub-configurations
  readonly tracks: Readonly<TrackConfig>;
  readonly platformEdge: Readonly<PlatformEdgeConfig>;
  readonly subwayEntrance: Readonly<SubwayEntranceConfig>;
  readonly spawns: Readonly<SpawnPositionConfig>;
  readonly lightPositions: readonly LightPosition[];
  readonly colors: Readonly<ColorConfig>;
}

// ============================================================================
// Asset Configuration
// ============================================================================

/** Texture asset URLs */
export interface TextureAssets {
  floor?: string;
  wall?: string;
  ceiling?: string;
  track?: string;
  tunnel?: string;
}

/** Model asset URLs */
export interface ModelAssets {
  train?: string;
  subwayEntrance?: string;
  cart?: string;
  fareTerminal?: string;
  bench?: string;
  luggage?: string;
  wallExpression?: string;
}

/** Complete asset manifest for a map */
export interface AssetManifest {
  textures: TextureAssets;
  models: ModelAssets;
}

// ============================================================================
// Lighting Configuration
// ============================================================================

/** Ambient light configuration */
export interface AmbientLightConfig {
  color: number;
  intensity: number;
}

/** Hemisphere light configuration */
export interface HemisphereLightConfig {
  skyColor: number;
  groundColor: number;
  intensity: number;
}

/** Directional light configuration */
export interface DirectionalLightConfig {
  color: number;
  intensity: number;
  position: Vector3Config;
  shadowMapSize?: number;
  shadowBias?: number;
  castShadow?: boolean;
}

/** Point light types for categorization */
export type PointLightType = 'emergency' | 'utility' | 'trackGlow' | 'tunnelGlow' | 'wallWash';

/** Point light configuration */
export interface PointLightConfig {
  type: PointLightType;
  color: number;
  intensity: number;
  position: Vector3Config;
  distance: number;
  decay: number;
  name?: string;
}

/** Complete lighting configuration for a map */
export interface LightingConfig {
  ambient: AmbientLightConfig;
  hemisphere: HemisphereLightConfig;
  keyLight: DirectionalLightConfig;
  fillLight: DirectionalLightConfig;
  pointLights: PointLightConfig[];
}

// ============================================================================
// Prop Placement
// ============================================================================

/** Single prop instance placement */
export interface PropInstance {
  x: number;
  y: number;
  z: number;
  rotationY: number;
  scale: number;
}

/** Prop placement configuration referencing asset keys */
export interface PropPlacement {
  assetKey: keyof ModelAssets;
  positions: PropInstance[];
}

// ============================================================================
// Map Definition
// ============================================================================

/** Player count constraints for a map */
export interface PlayerCountConfig {
  min: number;
  max: number;
}

/**
 * Complete map definition containing all configuration, assets,
 * collision geometry, spawn points, lighting, and prop placements.
 */
export interface MapDefinition {
  /** Unique identifier for the map */
  id: string;

  /** Display name for the map */
  name: string;

  /** Description of the map */
  description: string;

  /** Player count constraints */
  playerCount: PlayerCountConfig;

  /** Arena dimensions, colors, and structural parameters */
  arenaConfig: ArenaConfig;

  /** Asset URLs for textures and models */
  assets: AssetManifest;

  /** Collision geometry definitions */
  collisionManifest: import('../physics/CollisionWorld').CollisionManifest;

  /** Spawn point definitions */
  spawnManifest: import('../game/SpawnSystem').SpawnManifest;

  /** Lighting configuration */
  lightingConfig: LightingConfig;

  /** Prop placements referencing asset keys */
  props: PropPlacement[];
}
