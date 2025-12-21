/**
 * Zen Garden Theme
 * 
 * A peaceful Japanese garden with cherry blossoms, wooden bridges,
 * and traditional architecture. Bright, warm, and inviting.
 */

import type { MapTheme } from './types'

const STORAGE_BASE = 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/3d'

// Theme colors - soft pinks, warm woods, jade greens
const COLORS = {
  sakuraPink: 0xFFB7C5,
  cherryBlossom: 0xFFD1DC,
  warmWood: 0x8B6914,
  jadeGreen: 0x00A86B,
  cream: 0xFFFDD0,
  vermillion: 0xD64933,
  softSky: 0x87CEEB,
  goldenHour: 0xFFD700,
}

export const ZEN_GARDEN_THEME: MapTheme = {
  id: 'zen-garden',
  name: 'Zen Garden',
  description: 'Race through a peaceful Japanese garden with cherry blossoms and wooden bridges',
  previewImage: '/images/themes/zen-garden-preview.jpg',
  
  // ============================================
  // ASSETS
  // ============================================
  assets: {
    track: `${STORAGE_BASE}/wooden-pallet-optimized.glb`,
    
    obstacles: {
      // Torii gate - SLIDE under the horizontal beam
      highBarrier: `${STORAGE_BASE}/torii-gate-optimized.glb`,
      // Bamboo fence - JUMP over
      lowBarrier: `${STORAGE_BASE}/bamboo-fence-optimized.glb`,
      // Stone lantern - DODGE left/right
      laneBarrier: `${STORAGE_BASE}/stone-lantern-optimized.glb`,
      // Reuse stone lantern for spikes (or could be a different ground hazard)
      spikes: `${STORAGE_BASE}/stone-lantern-optimized.glb`,
      // Knowledge gate - use torii for now
      knowledgeGate: `${STORAGE_BASE}/torii-gate-optimized.glb`,
    },
    
    environment: {
      // Cherry blossom trees on sides
      scenery: `${STORAGE_BASE}/sakura-tree-optimized.glb`,
      // Background celestials/floating objects
      celestials: {
        pagoda: `${STORAGE_BASE}/pagoda-optimized.glb`,
        toriiRow: `${STORAGE_BASE}/torii-row-optimized.glb`,
      },
    },
    
    collectibles: {
      gem: `${STORAGE_BASE}/coin-optimized.glb`,
    },
    
    // Ninja character with run/jump/slide animations
    // rotationY: Math.PI makes ninja face forward (away from camera)
    character: {
      run: `${STORAGE_BASE}/ninja-run-optimized.glb`,
      jump: `${STORAGE_BASE}/ninja-jump-optimized.glb`,
      down: `${STORAGE_BASE}/ninja-slide-optimized.glb`,
      rotationY: Math.PI,  // Face forward (opposite of space theme)
    },
  },
  
  // ============================================
  // OBSTACLE VISUALS - Tune these for your models
  // ============================================
  obstacleVisuals: {
    highBarrier: {
      // Torii gate - player slides under (NOT CURRENTLY USED)
      scale: 0.1,
      yOffset: 0,
      rotationY: 0,
      forceLane: 0,
    },
    lowBarrier: {
      // Bamboo fence - player jumps over
      // Needs to be perpendicular to track (blocking path)
      scale: 0.12,  // Fits on bridge width
      yOffset: 0,
      rotationY: 0, // Face forward (perpendicular to track)
      forceLane: 0,
    },
    laneBarrier: {
      // Stone lantern - player dodges left/right
      // Blocks ONE lane only - collision must match
      scale: 0.3,  // 40% smaller than 0.5
      yOffset: 0,
      rotationY: 0,
      forceLane: null, // Can spawn in any lane
    },
    spikes: {
      // Ground hazard - reusing stone lantern (should get a proper model)
      // Can spawn in any lane - player can jump over or dodge
      scale: 0.25,  // Smaller than laneBarrier
      yOffset: 0,   // On the ground
      rotationY: 0,
      forceLane: null, // DO NOT force lane - let patterns decide
    },
    knowledgeGate: {
      // Torii gate - trivia trigger, player slides under
      scale: 0.1,  // Much smaller - was 0.8, way too big
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
  
  // ============================================
  // COLLISION BOXES - Match to model dimensions
  // These will need tuning once you see the models in-game
  // ============================================
  collisionBoxes: {
    highBarrier: {
      // Torii gate - ROLL/SLIDE under the beam
      // Collision ONLY exists above 1.3 meters - anything below passes through
      // Player must stay below 1.3m during entire roll animation
      // Extra breathing room: player sliding maxY ~1.0, barrier starts at 1.3
      halfWidth: 2.5,
      minY: 1.3,    // Collision starts at 1.3 meters - below this is safe
      maxY: 5.0,    // Extends high - can't jump over
      halfDepth: 0.8,
      spansAllLanes: true,
    },
    lowBarrier: {
      // Bamboo fence - jump over
      // Spans all lanes, player must jump
      halfWidth: 2.5,
      minY: -0.5,
      maxY: 1.0,  // Low enough to jump over
      halfDepth: 0.4,
      spansAllLanes: true,
    },
    laneBarrier: {
      // Stone lantern - dodge around
      // ONLY blocks the lane it's in - narrow collision box
      // laneWidth is 1.5, so halfWidth of 0.5 means it only blocks ~66% of one lane
      halfWidth: 0.5,  // Narrow - only blocks the lane it spawns in
      minY: -0.5,
      maxY: 3.0,  // Tall - can't jump over
      halfDepth: 0.5,
    },
    spikes: {
      // Ground hazard - can jump over or dodge
      halfWidth: 0.5,
      minY: -0.5,
      maxY: 1.2,  // Can jump over
      halfDepth: 0.4,
    },
    knowledgeGate: {
      // Torii gate - trivia trigger, spans all lanes
      // Player passes through (not a damage obstacle)
      halfWidth: 2.5,
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
  
  // ============================================
  // BACKGROUND - Bright, warm, peaceful
  // ============================================
  background: {
    // Soft sky blue with warm tint
    backgroundColor: 0xE8F4F8,
    
    // Static background image - Mount Fuji with cherry blossoms
    backgroundImage: `${STORAGE_BASE}/zen-garden-background.jpg`,
    
    fog: {
      color: 0xFFE4E1, // Misty pink fog
      density: 0.006,  // Light fog for depth
    },
    
    // Sky gradient - sunrise/golden hour feel (fallback if no image)
    // [top, middle, bottom]
    skyColors: [
      0x87CEEB,  // Soft sky blue
      0xFFB7C5,  // Sakura pink
      0xFFE4B5,  // Warm peach/moccasin
    ],
    
    // Disable space stars - this is daytime
    stars: {
      enabled: false,
    },
    
    // Particle effects - cherry blossom petals instead of cosmic dust
    particles: {
      shootingStars: false,
      cosmicDust: true,  // Repurpose as falling petals
      spawnRate: 0.4,
    },
    
    // Side scenery - cherry blossom trees
    scenery: {
      enabled: true,
      scale: 3.0,       // Adjust based on tree model size
      yOffset: -2,      // Slightly below track
      xOffset: 8,       // Distance from track center
      zSpacing: 25,     // Space between trees
      instanceCount: 6, // Trees per side (reduce for mobile)
    },
  },
  
  // ============================================
  // LIGHTING - Warm, bright, inviting
  // ============================================
  lighting: {
    ambient: {
      color: 0xFFF5EE,  // Warm white (seashell)
      intensity: 1.2,   // Bright ambient
    },
    
    directional: {
      color: 0xFFD700,  // Golden sunlight
      intensity: 0.8,
      position: { x: 10, y: 20, z: 5 },
      castShadow: true,
    },
    
    // Optional accent lights
    pointLights: [
      // Warm accent from the side
      {
        color: 0xFFB7C5,  // Pink accent
        intensity: 0.3,
        position: { x: -10, y: 5, z: 0 },
        distance: 30,
      },
    ],
  },
  
  // ============================================
  // TRACK
  // ============================================
  track: {
    scale: 6,  // Reduced from 8 - narrower to fit 3-lane system better
  },
  
  // ============================================
  // UI COLORS - Match the theme
  // ============================================
  colors: {
    primary: COLORS.sakuraPink,
    secondary: COLORS.jadeGreen,
    accent: COLORS.vermillion,
    danger: 0xDC143C,  // Crimson red
  },
  
  // ============================================
  // FORCE THEME CHARACTER
  // Override user's equipped skin with theme's ninja character
  // ============================================
  forceThemeCharacter: true,
  
  // ============================================
  // TRIVIA - Disabled for now while testing visuals
  // ============================================
  triviaEnabled: false,
  
  // ============================================
  // GHOST REPLAY - Disabled (ghost shows T-pose, needs animation work)
  // ============================================
  ghostEnabled: false,
}
