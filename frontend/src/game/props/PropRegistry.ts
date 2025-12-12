/**
 * PropRegistry - Centralized prop definitions for arena maps
 *
 * Defines all available props with their visual and collision properties.
 * Props are loaded once and cached for efficient rendering.
 *
 * @module props/PropRegistry
 */

import type { BackgroundType } from '../assets/ImageProcessor'

// Base URL for prop assets
const PROP_BASE_URL = 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/tilesets'

/**
 * Prop collision type determines how the prop interacts with gameplay
 */
export type PropCollisionType = 
  | 'solid'      // Blocks movement and projectiles (box, rock)
  | 'partial'    // Only part blocks (tree trunk blocks, canopy doesn't)
  | 'hazard'     // Slows movement, bullets pass through (water)
  | 'decorative' // No collision, visual only

/**
 * Prop definition - describes a single prop type
 */
export interface PropDefinition {
  id: string
  name: string
  url: string
  
  // Visual properties
  width: number        // Display width in pixels
  height: number       // Display height in pixels
  anchorX: number      // X anchor point (0-1, 0.5 = center)
  anchorY: number      // Y anchor point (0-1, 1 = bottom)
  cropPercent?: number // How much of center to extract from source (0-1, default 0.5)
  backgroundType?: BackgroundType // Type of background to remove (default 'checkered')
  
  // Collision properties
  collisionType: PropCollisionType
  collisionBox?: {     // Optional custom collision box (relative to anchor)
    x: number          // Offset from anchor
    y: number
    width: number
    height: number
  }
  
  // Rendering properties
  castsShadow: boolean
  shadowOffsetX?: number
  shadowOffsetY?: number
  zOffset?: number     // Additional z-offset for sorting (e.g., tall trees)
}

/**
 * Prop placement in a map
 */
export interface PropPlacement {
  propId: string       // References PropDefinition.id
  x: number            // World X position
  y: number            // World Y position
  scale?: number       // Optional scale multiplier (default 1)
  rotation?: number    // Optional rotation in degrees (default 0)
  flipX?: boolean      // Horizontal flip
}

/**
 * All available props in the game
 */
export const PROP_DEFINITIONS: Record<string, PropDefinition> = {
  box: {
    id: 'box',
    name: 'Stone Wall',
    url: `${PROP_BASE_URL}/Generated%20Image%20December%2011,%202025%20-%2011_12PM.jpeg`,
    width: 80,           // Full tile width for better visibility
    height: 56,          // Slightly shorter than wide (wall aspect)
    anchorX: 0.5,
    anchorY: 0.80,       // Adjusted anchor for better ground contact
    cropPercent: 0.65,   // Show more of the stone texture
    backgroundType: 'white',
    collisionType: 'solid',
    collisionBox: {
      x: -36,
      y: -44,
      width: 72,
      height: 44,
    },
    castsShadow: true,
    shadowOffsetX: 4,
    shadowOffsetY: 4,
  },

  rock: {
    id: 'rock',
    name: 'Mossy Rocks',
    url: `${PROP_BASE_URL}/rockw.jpeg`,
    width: 64,
    height: 50,
    anchorX: 0.5,
    anchorY: 0.85,
    cropPercent: 0.5,
    backgroundType: 'white',
    collisionType: 'solid',
    collisionBox: {
      x: -28,
      y: -35,
      width: 56,
      height: 35,
    },
    castsShadow: true,
    shadowOffsetX: 4,
    shadowOffsetY: 4,
  },

  // ═══════════════════════════════════════════════════════════════════
  // WATER HAZARD - "The Causeway" - SMALLER for better gameplay
  // Two mirrored ponds create symmetric bridges on both sides
  // ═══════════════════════════════════════════════════════════════════
  waterPond: {
    id: 'waterPond',
    name: 'Water Pond with Bridge',
    url: `${PROP_BASE_URL}/Generated%20Image%20December%2011,%202025%20-%2010_35PM.jpeg`,
    width: 240,          // Shrunk from 400 - ~3x3 tiles
    height: 240,
    anchorX: 0.5,
    anchorY: 0.5,        // Center anchor
    cropPercent: 0.85,   // Most of image is usable
    backgroundType: 'white',
    collisionType: 'hazard', // Slows movement, bullets pass through
    castsShadow: false,
    zOffset: -100,       // Render below other props
  },

  // ═══════════════════════════════════════════════════════════════════
  // TELEPORTER - Lane Switcher (Cyan Portal)
  // Linked pairs: step in one, appear at the other
  // Cooldown: 1.5s to prevent infinite loops
  // ═══════════════════════════════════════════════════════════════════
  teleporter: {
    id: 'teleporter',
    name: 'Teleporter Portal',
    url: `${PROP_BASE_URL}/Generated%20Image%20December%2011,%202025%20-%2010_39PM.jpeg`,
    width: 80,           // Increased from 64 for better quality
    height: 96,          // Increased from 80 for better quality
    anchorX: 0.5,
    anchorY: 0.75,       // Adjusted anchor for better placement
    cropPercent: 0.90,   // Increased from 0.75 - show more of the asset
    backgroundType: 'white',
    collisionType: 'decorative', // Walk through to activate
    castsShadow: false,  // Magical glow, no shadow
    zOffset: 10,         // Render slightly above ground
  },

  // ═══════════════════════════════════════════════════════════════════
  // BOUNCE PAD - Moat Jumper (Spring Launcher)
  // Launches player in specified direction with high velocity
  // Bypasses water slow effect while airborne
  // ═══════════════════════════════════════════════════════════════════
  bouncePad: {
    id: 'bouncePad',
    name: 'Bounce Pad',
    url: `${PROP_BASE_URL}/Generated%20Image%20December%2011,%202025%20-%2011_40PM%20(1).jpeg`,
    width: 80,           // Full tile width
    height: 80,          // Square for new asset
    anchorX: 0.5,
    anchorY: 0.5,        // Center anchor for new asset
    cropPercent: 0.85,   // Good crop for new asset
    backgroundType: 'white',
    collisionType: 'decorative', // Walk over to activate
    castsShadow: false,
    zOffset: 5,
  },

  // ═══════════════════════════════════════════════════════════════════
  // MINEFIELD - Danger Zone (Explosive Hazard)
  // Dynamically spawned by game engine - NOT hardcoded in map config
  // Deals damage when stepped on, respawns after delay
  // Visual: Red warning lights on cracked ground
  // ═══════════════════════════════════════════════════════════════════
  minefield: {
    id: 'minefield',
    name: 'Minefield',
    url: `${PROP_BASE_URL}/Generated%20Image%20December%2011,%202025%20-%2010_46PM.jpeg`,
    width: 120,          // ~1.5x1.5 grid (80px * 1.5 = 120px)
    height: 120,
    anchorX: 0.5,
    anchorY: 0.5,        // Center anchor
    cropPercent: 0.85,
    backgroundType: 'auto', // Auto-detect checkered/white/dark backgrounds
    collisionType: 'hazard', // Triggers damage on contact
    castsShadow: false,
    zOffset: -50,        // Render below props but above water
  },

  // ═══════════════════════════════════════════════════════════════════
  // EMP ZONE - Ability Effect (Dynamic Spawn)
  // Dynamically spawned by game engine - NOT hardcoded in map config
  // Disables weapons/abilities for players inside the zone
  // Visual: Blue electric crackling with tesla coils
  // ═══════════════════════════════════════════════════════════════════
  empZone: {
    id: 'empZone',
    name: 'EMP Zone',
    url: `${PROP_BASE_URL}/Generated%20Image%20December%2011,%202025%20-%2010_47PM.jpeg`,
    width: 120,          // ~1.5x1.5 grid (80px * 1.5 = 120px)
    height: 120,
    anchorX: 0.5,
    anchorY: 0.5,        // Center anchor for ability targeting
    cropPercent: 0.90,   // Most of image is usable
    backgroundType: 'checkered-white', // Remove both checkered bg AND white interior
    collisionType: 'hazard', // Triggers EMP effect on contact
    castsShadow: false,  // Electric glow, no shadow
    zOffset: -40,        // Render below props, above water/minefield
  },

  // ═══════════════════════════════════════════════════════════════════
  // SLOW ZONE - Ice/Frost Field (hazard_slow)
  // Reduces player movement speed to 50%
  // Visual: Frozen ground with ice crystals
  // ═══════════════════════════════════════════════════════════════════
  slowZone: {
    id: 'slowZone',
    name: 'Slow Zone (Ice Field)',
    url: `${PROP_BASE_URL}/Generated%20Image%20December%2011,%202025%20-%2010_58PM.jpeg`,
    width: 120,
    height: 120,
    anchorX: 0.5,
    anchorY: 0.5,
    cropPercent: 0.90,
    backgroundType: 'auto', // Auto-detect checkered/white/dark backgrounds
    collisionType: 'hazard', // Slows movement
    castsShadow: false,
    zOffset: -60,        // Render below props
  },

  // ═══════════════════════════════════════════════════════════════════
  // PRESSURE TRAP - Step-Activated Damage (trap_pressure)
  // Triggers burst damage when stepped on
  // Visual: Metal plate with warning stripes and red indicator
  // ═══════════════════════════════════════════════════════════════════
  pressureTrap: {
    id: 'pressureTrap',
    name: 'Pressure Trap',
    url: `${PROP_BASE_URL}/Generated%20Image%20December%2011,%202025%20-%2010_59PM.jpeg`,
    width: 64,
    height: 64,
    anchorX: 0.5,
    anchorY: 0.5,
    cropPercent: 0.85,
    backgroundType: 'white',
    collisionType: 'decorative', // Walk over to trigger
    castsShadow: false,
    zOffset: -30,        // Ground level
  },

  // ═══════════════════════════════════════════════════════════════════
  // POWER-UP PEDESTAL - Spawn Point Marker
  // Visual indicator for where power-ups appear
  // Glowing rune platform with magical energy
  // ═══════════════════════════════════════════════════════════════════
  powerUpPedestal: {
    id: 'powerUpPedestal',
    name: 'Power-Up Pedestal',
    url: `${PROP_BASE_URL}/Generated%20Image%20December%2011,%202025%20-%2011_01PM.jpeg`,
    width: 72,
    height: 72,
    anchorX: 0.5,
    anchorY: 0.5,
    cropPercent: 0.80,
    backgroundType: 'white',
    collisionType: 'decorative', // Walk through to collect
    castsShadow: false,  // Magical glow
    zOffset: -20,        // Ground level, above hazards
  },

  // ═══════════════════════════════════════════════════════════════════
  // TALL GRASS - Stealth Zone (Soft Cover)
  // Hides player visually but doesn't block bullets
  // Rendered ABOVE players for proper layering
  // Corner camping spots for answering trivia questions safely
  // ═══════════════════════════════════════════════════════════════════
  tallGrass: {
    id: 'tallGrass',
    name: 'Tall Grass',
    url: `${PROP_BASE_URL}/Generated%20Image%20December%2011,%202025%20-%2011_20PM.png`,
    width: 160,          // 2x2 tile coverage
    height: 160,
    anchorX: 0.5,
    anchorY: 0.5,
    cropPercent: 0.95,   // PNG with transparency, minimal crop
    backgroundType: 'white',
    collisionType: 'decorative', // Walk through, no collision
    castsShadow: false,
    zOffset: 100,        // Render ABOVE players for stealth effect
  },

  // ═══════════════════════════════════════════════════════════════════
  // SPAWN PLATFORM - Player Spawn Point Marker
  // Circular stone platform where players spawn at arena start
  // Decorative - no collision, rendered below players
  // ═══════════════════════════════════════════════════════════════════
  spawnPlatform: {
    id: 'spawnPlatform',
    name: 'Spawn Platform',
    url: 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/skins/Generated%20Image%20December%2011,%202025%20-%2011_55PM.jpeg',
    width: 120,          // ~1.5 tiles - fits player nicely
    height: 120,
    anchorX: 0.5,
    anchorY: 0.5,        // Center anchor
    cropPercent: 0.90,   // Show most of the circular platform
    backgroundType: 'white',
    collisionType: 'decorative', // Walk through, no collision
    castsShadow: false,
    zOffset: -80,        // Render below players but above floor
  },

  // ═══════════════════════════════════════════════════════════════════
  // DIRT PATCH - "Desire Lines" (Traffic Wear)
  // Shows where players run the most - hotspots and choke points
  // Rendered ON TOP of grass floor but BELOW everything else
  // ═══════════════════════════════════════════════════════════════════
  dirtPatch: {
    id: 'dirtPatch',
    name: 'Dirt Patch',
    url: 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/skins/Generated%20Image%20December%2011,%202025%20-%2011_58PM%20(1).jpeg',
    width: 80,           // Single tile coverage
    height: 80,
    anchorX: 0.5,
    anchorY: 0.5,
    cropPercent: 0.85,
    backgroundType: 'white',
    collisionType: 'decorative', // Walk through, no collision
    castsShadow: false,
    zOffset: -90,        // Render above floor, below everything else
  },

  // ═══════════════════════════════════════════════════════════════════
  // WIRE DEBRIS - "Tech Parasites" (Decorative Debris)
  // Looks like tech powering the map or monitoring the ruins
  // Anchored to walls and hidden in grass corners
  // ═══════════════════════════════════════════════════════════════════
  wireDebris: {
    id: 'wireDebris',
    name: 'Wire Debris',
    url: 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/skins/Generated%20Image%20December%2012,%202025%20-%2012_02AM.jpeg',
    width: 80,           // Larger for visibility
    height: 80,
    anchorX: 0.5,
    anchorY: 0.5,
    cropPercent: 0.85,   // Show more of the asset
    backgroundType: 'white',
    collisionType: 'decorative', // Walk through, no collision
    castsShadow: true,
    shadowOffsetX: 3,
    shadowOffsetY: 3,
    zOffset: 5,          // Render above ground props, visible
  },
}

/**
 * Get a prop definition by ID
 */
export function getPropDefinition(id: string): PropDefinition | undefined {
  return PROP_DEFINITIONS[id]
}

/**
 * Get all prop IDs
 */
export function getAllPropIds(): string[] {
  return Object.keys(PROP_DEFINITIONS)
}
