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

export const BARRIERS: Rectangle[] = [
  { x: 240, y: 80, width: 60, height: 560 },   // Left
  { x: 980, y: 80, width: 60, height: 560 },   // Right
]

export const POWERUP_SPAWNS: Array<{ id: number; position: Vector2 }> = [
  { id: 1, position: { x: 280, y: 180 } },   // NW
  { id: 2, position: { x: 1000, y: 180 } },  // NE
  { id: 3, position: { x: 120, y: 360 } },   // W
  { id: 4, position: { x: 1160, y: 360 } },  // E
  { id: 5, position: { x: 280, y: 540 } },   // SW
  { id: 6, position: { x: 1000, y: 540 } },  // SE
]

export const PLAYER_CONFIG = {
  radius: 15,
  speed: 300,
  trailLength: 20,
}

export const POWERUP_CONFIG = {
  radiusInactive: 20,
  radiusActive: 30,
  pulseSpeed: 1.5,
  collectionRadius: 40,
}

export const RENDER_CONFIG = {
  glowBlur: 8,
  glowBlurIntense: 12,
  gridOpacity: 0.2,
  boundaryWidth: 4,
}
