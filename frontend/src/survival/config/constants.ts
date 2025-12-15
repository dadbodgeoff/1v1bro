/**
 * Survival Mode Constants
 * Centralized configuration for game balance and rendering
 * 
 * Enterprise-grade: All values are derived from device capabilities
 * and quality settings for optimal cross-device performance.
 */

import type { SurvivalAssets, SurvivalConfig, RendererConfig } from '../types/survival'
import { getDeviceCapabilities, type DeviceCapabilities } from './device'
import { getQualityProfile, type QualityProfile } from './quality'
import { getMobileConfig, type MobileConfig } from './mobile'

// Supabase storage base URL
const STORAGE_BASE = 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/3d'

/**
 * Asset URLs for all 3D models
 * These are static and don't change based on device
 */
export const SURVIVAL_ASSETS: SurvivalAssets = {
  track: {
    // Only longTile is currently used - others reserved for future track variety
    longTile: `${STORAGE_BASE}/track-optimized.glb`,
  },
  obstacles: {
    highBarrier: `${STORAGE_BASE}/slideee-optimized.glb`, // Slide under obstacle
    lowBarrier: `${STORAGE_BASE}/jump-optimized.glb`, // Futuristic neon gate - jump over
    laneBarrier: `${STORAGE_BASE}/lane-barrier-optimized.glb`,
    knowledgeGate: `${STORAGE_BASE}/knowledge-gate-optimized.glb`,
    spikes: `${STORAGE_BASE}/spikes-optimized.glb`,
  },
  character: {
    // Cape runner with separate animation poses
    runner: {
      run: `${STORAGE_BASE}/cape-optimized.glb`,
      jump: `${STORAGE_BASE}/capejump-optimized.glb`,
      down: `${STORAGE_BASE}/capedown-optimized.glb`,
    },
  },
  // Celestial objects for space background
  celestials: {
    planetVolcanic: `${STORAGE_BASE}/lava-planet-optimized.glb`,
    planetIce: `${STORAGE_BASE}/icy-planet-optimized.glb`,
    planetGasGiant: `${STORAGE_BASE}/alienworld-optimized.glb`,
    planetEarthLike: `${STORAGE_BASE}/alienworld-optimized.glb`, // Reuse for now
    asteroidCluster: `${STORAGE_BASE}/asteroid-optimized.glb`,
    spaceSatellite: `${STORAGE_BASE}/space-sat-optimized.glb`,
    icyComet: `${STORAGE_BASE}/icy-comet-optimized.glb`,
    // New epic celestials
    spaceWhale: `${STORAGE_BASE}/whale-optimized.glb`,
    ringPortal: `${STORAGE_BASE}/portal-optimized.glb`,
    crystalFormation: `${STORAGE_BASE}/crystal-optimized.glb`,
    orbitalDefense: `${STORAGE_BASE}/orbitaldefense-optimized.glb`,
    derelictShip: `${STORAGE_BASE}/destroyedwarship-optimized.glb`,
  },
  // Environment
  environment: {
    city: `${STORAGE_BASE}/city-optimized.glb`,
  },
  // Collectibles
  collectibles: {
    gem: `${STORAGE_BASE}/gem-optimized.glb`,
  },
}

/**
 * Base game configuration (desktop defaults)
 * These are modified by getSurvivalConfig() based on device
 */
const BASE_SURVIVAL_CONFIG: SurvivalConfig = {
  // Speed settings
  baseSpeed: 15,              // Starting speed (units/sec)
  maxSpeed: 40,               // Maximum speed cap
  speedIncreaseRate: 0.3,     // Speed increase per second
  
  // Lane settings
  laneWidth: 1.5,             // Distance between lane centers
  laneSwitchSpeed: 8,         // How fast player moves between lanes
  
  // Track settings
  trackTileDepth: 20,         // Length of each track segment
  trackScale: 10,             // Scale multiplier
  
  // Obstacle settings
  obstacleScale: 10,          // Scale multiplier
  obstacleSpawnDistance: 50,  // How far ahead to spawn obstacles
  obstacleMinGap: 15,         // Minimum distance between obstacles
  
  // Player settings
  runnerScale: 2,             // Scale multiplier
  initialLives: 3,            // Starting lives (hearts)
}

/**
 * Base renderer configuration (desktop defaults)
 * These are modified by getRendererConfig() based on device
 */
const BASE_RENDERER_CONFIG: RendererConfig = {
  fov: 70,
  nearPlane: 0.5,
  farPlane: 300,
  cameraHeight: 6,
  cameraDistance: 6,
  backgroundColor: 0x09090b,
  ambientLightIntensity: 1.0,
  directionalLightIntensity: 0.8,
}

/**
 * Get device-optimized survival configuration
 * Applies mobile balance adjustments and quality settings
 */
export function getSurvivalConfig(
  _caps?: DeviceCapabilities,
  mobile?: MobileConfig
): SurvivalConfig {
  const capabilities = _caps || getDeviceCapabilities()
  const mobileConfig = mobile || getMobileConfig()
  const balance = mobileConfig.balance
  
  return {
    ...BASE_SURVIVAL_CONFIG,
    
    // Apply mobile speed adjustment
    baseSpeed: BASE_SURVIVAL_CONFIG.baseSpeed * balance.speedMultiplier,
    maxSpeed: BASE_SURVIVAL_CONFIG.maxSpeed * balance.speedMultiplier,
    
    // Apply obstacle gap adjustment for touch controls
    obstacleMinGap: BASE_SURVIVAL_CONFIG.obstacleMinGap * balance.obstacleGapMultiplier,
    
    // Adjust lane switch speed for touch responsiveness
    laneSwitchSpeed: capabilities.isMobile 
      ? BASE_SURVIVAL_CONFIG.laneSwitchSpeed * 1.2  // Faster lane switch on mobile
      : BASE_SURVIVAL_CONFIG.laneSwitchSpeed,
  }
}

/**
 * Get device-optimized renderer configuration
 * Applies quality settings and mobile camera adjustments
 */
export function getRendererConfig(
  _caps?: DeviceCapabilities,
  quality?: QualityProfile,
  mobile?: MobileConfig
): RendererConfig {
  const qualityProfile = quality || getQualityProfile()
  const mobileConfig = mobile || getMobileConfig()
  const balance = mobileConfig.balance
  
  // Adjust far plane based on quality
  let farPlane = BASE_RENDERER_CONFIG.farPlane
  if (qualityProfile.tier === 'low') {
    farPlane = 150  // Reduce draw distance on low-end
  } else if (qualityProfile.tier === 'medium') {
    farPlane = 200
  }
  
  return {
    ...BASE_RENDERER_CONFIG,
    
    // Apply mobile camera adjustments
    fov: balance.fov,
    cameraHeight: balance.cameraHeight,
    cameraDistance: balance.cameraDistance,
    farPlane,
    
    // Adjust light intensity based on quality
    ambientLightIntensity: qualityProfile.tier === 'low' 
      ? 1.2  // Brighter ambient on low quality (no shadows)
      : BASE_RENDERER_CONFIG.ambientLightIntensity,
  }
}

/**
 * Legacy exports for backward compatibility
 * These use the dynamic getters internally
 */
export const SURVIVAL_CONFIG: SurvivalConfig = getSurvivalConfig()
export const RENDERER_CONFIG: RendererConfig = getRendererConfig()

/**
 * Brand colors (from BRAND_SYSTEM.md)
 */
export const COLORS = {
  brandOrange: 0xf97316,
  brandIndigo: 0x6366f1,
  success: 0x10b981,
  error: 0xf43f5e,
  warning: 0xf59e0b,
}

/**
 * Input key mappings
 */
export const KEY_BINDINGS = {
  moveLeft: ['KeyA', 'ArrowLeft'],
  moveRight: ['KeyD', 'ArrowRight'],
  jump: ['KeyW', 'ArrowUp', 'Space'],
  slide: ['KeyS', 'ArrowDown'],
  pause: ['Escape', 'KeyP'],
} as const
