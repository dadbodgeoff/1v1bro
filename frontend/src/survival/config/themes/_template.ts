/**
 * Theme Template
 * 
 * Copy this file and fill in your values to create a new theme.
 * 
 * Steps:
 * 1. Copy this file to a new name (e.g., 'neon-jungle.ts')
 * 2. Replace all YOUR_* placeholders with your values
 * 3. Upload your GLB models to Supabase storage
 * 4. Register the theme in index.ts
 * 
 * Tips:
 * - Use gltf-transform to optimize your models: npx @gltf-transform/cli simplify input.glb output.glb --ratio 0.5
 * - Keep textures under 1024x1024 for web
 * - Test on mobile - aim for <50MB total GPU memory
 */

import type { MapTheme } from './types'

// Your Supabase storage base URL
const STORAGE_BASE = 'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/YOUR_BUCKET'

export const YOUR_THEME_NAME: MapTheme = {
  id: 'your-theme-id',
  name: 'Your Theme Name',
  description: 'A brief description of your theme',
  previewImage: '/images/themes/your-theme-preview.jpg',
  
  // ============================================
  // ASSETS - Replace with your model URLs
  // ============================================
  assets: {
    // The repeating track tile
    track: `${STORAGE_BASE}/your-track.glb`,
    
    // Obstacle models
    obstacles: {
      highBarrier: `${STORAGE_BASE}/your-slide-obstacle.glb`,  // Player slides under
      lowBarrier: `${STORAGE_BASE}/your-jump-obstacle.glb`,    // Player jumps over
      laneBarrier: `${STORAGE_BASE}/your-dodge-obstacle.glb`,  // Player dodges left/right
      spikes: `${STORAGE_BASE}/your-ground-hazard.glb`,        // Ground spikes
      knowledgeGate: `${STORAGE_BASE}/your-trivia-gate.glb`,   // Optional trivia trigger
    },
    
    // Background environment
    environment: {
      // Repeating scenery on sides (like city skyline, mountains, etc.)
      scenery: `${STORAGE_BASE}/your-scenery.glb`,
      
      // Objects that float by in the background (optional)
      celestials: {
        // Add as many as you want - they'll spawn randomly
        object1: `${STORAGE_BASE}/your-bg-object-1.glb`,
        object2: `${STORAGE_BASE}/your-bg-object-2.glb`,
      },
    },
    
    // Collectibles (optional - can use default)
    collectibles: {
      gem: `${STORAGE_BASE}/your-collectible.glb`,
    },
    
    // Character (optional - can use default)
    // character: {
    //   run: `${STORAGE_BASE}/your-character-run.glb`,
    //   jump: `${STORAGE_BASE}/your-character-jump.glb`,
    //   down: `${STORAGE_BASE}/your-character-slide.glb`,
    // },
  },
  
  // ============================================
  // OBSTACLE VISUALS - Tune these for your models
  // ============================================
  obstacleVisuals: {
    highBarrier: {
      scale: 0.35,           // Adjust based on your model size
      yOffset: 0.5,          // Height above track surface
      rotationY: Math.PI / 2, // Rotation (radians)
      forceLane: 0,          // Force to center lane, or null for any
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
      forceLane: null,       // Can spawn in any lane
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
  
  // ============================================
  // COLLISION BOXES - Match to your model dimensions
  // ============================================
  collisionBoxes: {
    highBarrier: {
      halfWidth: 1.8,        // Half the width (extends both directions)
      minY: 0.8,             // Bottom of hitbox (above slide height)
      maxY: 4.0,             // Top of hitbox
      halfDepth: 0.5,        // Half the depth
    },
    lowBarrier: {
      halfWidth: 1.5,
      minY: -0.5,
      maxY: 1.2,             // Player must jump above this
      halfDepth: 0.8,
      spansAllLanes: true,   // Blocks all lanes
    },
    laneBarrier: {
      halfWidth: 0.6,        // Narrow - only blocks one lane
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
  
  // ============================================
  // BACKGROUND - Set your atmosphere
  // ============================================
  background: {
    backgroundColor: 0x09090b,  // Scene background color
    
    fog: {
      color: 0x09090b,
      density: 0.008,
    },
    
    // Sky gradient colors [top, middle, bottom]
    skyColors: [0x1a0a2e, 0x6366f1, 0x0d1b2a],
    
    // Star field (set enabled: false for non-space themes)
    stars: {
      enabled: true,
      count: 2000,
      color: 0xffffff,
    },
    
    // Particle effects
    particles: {
      shootingStars: true,
      cosmicDust: true,
      spawnRate: 0.3,
    },
    
    // Side scenery (city, mountains, etc.)
    scenery: {
      enabled: true,
      scale: 60,
      yOffset: -25,          // Below track
      xOffset: 15,           // Distance from track center
      zSpacing: 120,         // Distance between instances
      instanceCount: 8,      // Reduce for mobile performance
    },
  },
  
  // ============================================
  // LIGHTING
  // ============================================
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
    
    // Optional point lights for atmosphere
    // pointLights: [
    //   { color: 0xff6600, intensity: 0.5, position: { x: -5, y: 3, z: 0 }, distance: 20 },
    // ],
  },
  
  // ============================================
  // TRACK
  // ============================================
  track: {
    scale: 10,               // Scale multiplier for track model
    // tileDepth: 20,        // Optional - calculated from model if not set
  },
  
  // ============================================
  // UI COLORS
  // ============================================
  colors: {
    primary: 0xf97316,       // Orange
    secondary: 0x6366f1,     // Indigo
    accent: 0x00ffff,        // Cyan
    danger: 0xf43f5e,        // Red
  },
}
