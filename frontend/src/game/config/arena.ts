/**
 * Arena layout configuration
 * All dimensions and positions for the game world
 */

import type { Vector2, Rectangle } from '../types'

export const ARENA_SIZE = {
  width: 1280,
  height: 720,
} as const

export const GRID_SIZE = 80

export const PLAYER_SPAWNS: Record<'player1' | 'player2', Vector2> = {
  player1: { x: 160, y: 360 },
  player2: { x: 1120, y: 360 },
}

export const HUB_CONFIG = {
  center: { x: 640, y: 360 } as Vector2,
  innerRadius: 120,
  outerRadius: 180,
  pulseSpeed: 2, // seconds per cycle
}

// Multi-lane layout: 4 barriers creating 3 lanes (top, mid, bottom)
// Each barrier is 1 tile wide (80px) x 3 tiles tall (240px)
export const BARRIERS: Rectangle[] = [
  // Left side barriers (column 4 = x:320)
  { x: 320, y: 80, width: 80, height: 240 },   // Top-left (rows 1-3)
  { x: 320, y: 400, width: 80, height: 240 },  // Bottom-left (rows 5-7)

  // Right side barriers (column 10 = x:800)
  { x: 800, y: 80, width: 80, height: 240 },   // Top-right (rows 1-3)
  { x: 800, y: 400, width: 80, height: 240 },  // Bottom-right (rows 5-7)
]

// Fair spawn points - 8 positions accessible from all lanes
// Distributed around the hub and in lane corridors
export const POWERUP_SPAWN_POSITIONS: Vector2[] = [
  { x: 640, y: 40 },    // Top lane center
  { x: 640, y: 680 },   // Bottom lane center
  { x: 480, y: 160 },   // Upper-left quadrant
  { x: 800, y: 160 },   // Upper-right quadrant
  { x: 480, y: 360 },   // Mid-left (hub area)
  { x: 800, y: 360 },   // Mid-right (hub area)
  { x: 480, y: 560 },   // Lower-left quadrant
  { x: 800, y: 560 },   // Lower-right quadrant
]

// Legacy - keeping for backwards compatibility
export const POWERUP_SPAWNS: Array<{ id: number; position: Vector2 }> = [
  { id: 1, position: { x: 640, y: 40 } },
  { id: 2, position: { x: 640, y: 680 } },
  { id: 3, position: { x: 480, y: 360 } },
  { id: 4, position: { x: 800, y: 360 } },
]

export const PLAYER_CONFIG = {
  radius: 15,
  speed: 300,
  trailLength: 20,
}

export const POWERUP_CONFIG = {
  radiusInactive: 30,
  radiusActive: 40,
  pulseSpeed: 1.5,
  collectionRadius: 50,
}

export const RENDER_CONFIG = {
  glowBlur: 8,
  glowBlurIntense: 12,
  gridOpacity: 0.2,
  boundaryWidth: 4,
}
