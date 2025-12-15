/**
 * Space Background System - Type Definitions
 * Enterprise-grade types for the procedural space environment
 */

import type * as THREE from 'three'

/**
 * Star particle data for instanced rendering
 */
export interface StarField {
  positions: Float32Array
  colors: Float32Array
  sizes: Float32Array
  count: number
}

/**
 * Star layer configuration for parallax depth
 */
export interface StarLayerConfig {
  count: number
  minSize: number
  maxSize: number
  minDistance: number
  maxDistance: number
  speedMultiplier: number // Parallax speed relative to player
  color: THREE.Color
  twinkleSpeed: number
}

/**
 * Nebula cloud configuration
 */
export interface NebulaConfig {
  color1: number
  color2: number
  color3: number
  density: number
  scale: number
  speed: number
}

/**
 * Celestial object types
 */
export type CelestialType = 
  | 'planet-volcanic'
  | 'planet-ice'
  | 'planet-gas-giant'
  | 'planet-earth-like'
  | 'asteroid-cluster'
  | 'space-station'
  | 'comet'
  // New epic celestials
  | 'space-whale'
  | 'ring-portal'
  | 'crystal-formation'
  | 'orbital-defense'
  | 'derelict-ship'

/**
 * Celestial object instance
 */
export interface CelestialObject {
  id: string
  type: CelestialType
  mesh: THREE.Group | THREE.Mesh | null
  position: THREE.Vector3
  rotation: THREE.Euler
  rotationSpeed: THREE.Vector3
  scale: number
  spawnDistance: number // Z distance from origin where it spawns
  passedPlayer: boolean
}

/**
 * Celestial spawn configuration
 */
export interface CelestialSpawnConfig {
  type: CelestialType
  weight: number // Spawn probability weight
  minScale: number
  maxScale: number
  minDistance: number // Min lateral distance from track
  maxDistance: number
  rotationSpeedRange: [number, number]
}

/**
 * Shooting star configuration
 */
export interface ShootingStarConfig {
  spawnRate: number // Per second
  minSpeed: number
  maxSpeed: number
  minLength: number
  maxLength: number
  color: number
  fadeTime: number
}

/**
 * Active shooting star instance
 */
export interface ShootingStar {
  id: number
  startPosition: THREE.Vector3
  direction: THREE.Vector3
  speed: number
  length: number
  life: number
  maxLife: number
}

/**
 * Space background state
 */
export interface SpaceBackgroundState {
  playerZ: number
  speed: number
  distanceTraveled: number
  celestialsPassed: number
}

/**
 * Quality preset for different devices
 */
export type QualityPreset = 'low' | 'medium' | 'high' | 'ultra'

/**
 * Quality settings per preset
 */
export interface QualitySettings {
  starCount: number
  starLayers: number
  nebulaEnabled: boolean
  shootingStarsEnabled: boolean
  celestialCount: number
  bloomEnabled: boolean
}

/**
 * Quality presets configuration
 */
export const QUALITY_PRESETS: Record<QualityPreset, QualitySettings> = {
  low: {
    starCount: 500,
    starLayers: 1,
    nebulaEnabled: false,
    shootingStarsEnabled: false,
    celestialCount: 2,
    bloomEnabled: false,
  },
  medium: {
    starCount: 1500,
    starLayers: 2,
    nebulaEnabled: true,
    shootingStarsEnabled: true,
    celestialCount: 3,
    bloomEnabled: false,
  },
  high: {
    starCount: 3000,
    starLayers: 3,
    nebulaEnabled: true,
    shootingStarsEnabled: true,
    celestialCount: 4,
    bloomEnabled: true,
  },
  ultra: {
    starCount: 5000,
    starLayers: 4,
    nebulaEnabled: true,
    shootingStarsEnabled: true,
    celestialCount: 5,
    bloomEnabled: true,
  },
}
