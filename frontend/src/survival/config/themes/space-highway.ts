/**
 * Space Highway Theme
 * 
 * The original survival mode theme - cyberpunk city below,
 * cosmic space above, neon obstacles on an elevated highway.
 */

import type { MapTheme } from './types'
import { COLORS } from '../constants'

const STORAGE_BASE = 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/3d'

export const SPACE_HIGHWAY_THEME: MapTheme = {
  id: 'space-highway',
  name: 'Space Highway',
  description: 'Race through the cosmos on an elevated highway above a cyberpunk metropolis',
  previewImage: '/images/themes/space-highway-preview.jpg',
  
  assets: {
    track: `${STORAGE_BASE}/track-optimized.glb`,
    
    obstacles: {
      highBarrier: `${STORAGE_BASE}/slideee-optimized.glb`,
      lowBarrier: `${STORAGE_BASE}/jump-optimized.glb`,
      laneBarrier: `${STORAGE_BASE}/lane-barrier-optimized.glb`,
      spikes: `${STORAGE_BASE}/spikes-optimized.glb`,
      knowledgeGate: `${STORAGE_BASE}/knowledge-gate-optimized.glb`,
    },
    
    environment: {
      scenery: `${STORAGE_BASE}/city-optimized.glb`,
      celestials: {
        planetVolcanic: `${STORAGE_BASE}/lava-planet-optimized.glb`,
        planetIce: `${STORAGE_BASE}/icy-planet-optimized.glb`,
        planetGasGiant: `${STORAGE_BASE}/alienworld-optimized.glb`,
        asteroidCluster: `${STORAGE_BASE}/asteroid-optimized.glb`,
        spaceSatellite: `${STORAGE_BASE}/space-sat-optimized.glb`,
        icyComet: `${STORAGE_BASE}/icy-comet-optimized.glb`,
        spaceWhale: `${STORAGE_BASE}/whale-optimized.glb`,
        ringPortal: `${STORAGE_BASE}/portal-optimized.glb`,
        crystalFormation: `${STORAGE_BASE}/crystal-optimized.glb`,
        orbitalDefense: `${STORAGE_BASE}/orbitaldefense-optimized.glb`,
        derelictShip: `${STORAGE_BASE}/destroyedwarship-optimized.glb`,
      },
    },
    
    collectibles: {
      gem: `${STORAGE_BASE}/gem-optimized.glb`,
    },
    
    character: {
      run: `${STORAGE_BASE}/cape-optimized.glb`,
      jump: `${STORAGE_BASE}/capejump-optimized.glb`,
      down: `${STORAGE_BASE}/capedown-optimized.glb`,
    },
  },
  
  obstacleVisuals: {
    highBarrier: {
      scale: 0.35,
      yOffset: 0.5,
      rotationY: Math.PI / 2,
      forceLane: 0,
    },
    lowBarrier: {
      scale: 0.5,
      yOffset: -0.3,
      rotationY: Math.PI / 2,
      forceLane: 0,
    },
    laneBarrier: {
      scale: 0.45,
      yOffset: -0.3,
      rotationY: 0,
      forceLane: null, // Can spawn in any lane
    },
    spikes: {
      scale: 0.35,
      yOffset: -0.5,
      rotationY: 0,
      forceLane: 0,
    },
    knowledgeGate: {
      scale: 1.0,
      yOffset: 0,
      rotationY: 0,
      forceLane: 0,
    },
    gap: {
      scale: 1.0,
      yOffset: 0,
      rotationY: 0,
      forceLane: null,
    },
  },
  
  collisionBoxes: {
    highBarrier: {
      halfWidth: 1.8,
      minY: 0.8,
      maxY: 4.0,
      halfDepth: 0.5,
    },
    lowBarrier: {
      halfWidth: 1.5,
      minY: -0.5,
      maxY: 1.2,
      halfDepth: 0.8,
      spansAllLanes: true,
    },
    laneBarrier: {
      halfWidth: 0.6, // Narrow - only blocks one lane
      minY: -0.5,
      maxY: 3.0,
      halfDepth: 0.6,
    },
    spikes: {
      halfWidth: 0.5,
      minY: -0.5,
      maxY: 1.5,
      halfDepth: 0.3,
    },
    knowledgeGate: {
      halfWidth: 2.25,
      minY: 0,
      maxY: 5.0,
      halfDepth: 0.6,
      spansAllLanes: true,
    },
    gap: {
      halfWidth: 1.5,
      minY: -10,
      maxY: 0,
      halfDepth: 2.0,
      spansAllLanes: true,
    },
  },
  
  background: {
    backgroundColor: 0x09090b,
    
    fog: {
      color: 0x09090b,
      density: 0.008,
    },
    
    skyColors: [0x1a0a2e, COLORS.brandIndigo, 0x0d1b2a],
    
    stars: {
      enabled: true,
      count: 2000,
      color: 0xffffff,
    },
    
    particles: {
      shootingStars: true,
      cosmicDust: true,
      spawnRate: 0.3,
    },
    
    scenery: {
      enabled: true,
      scale: 60,
      yOffset: -25,
      xOffset: 15,
      zSpacing: 120,
      instanceCount: 8,
    },
  },
  
  lighting: {
    ambient: {
      color: 0xffffff,
      intensity: 1.0,
    },
    
    directional: {
      color: 0xfff5e6,
      intensity: 0.8,
      position: { x: 10, y: 20, z: 10 },
      castShadow: true,
    },
  },
  
  track: {
    scale: 10,
  },
  
  colors: {
    primary: COLORS.brandOrange,
    secondary: COLORS.brandIndigo,
    accent: 0x00ffff,
    danger: COLORS.error,
  },
}
