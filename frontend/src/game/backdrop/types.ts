/**
 * Backdrop Layer Types
 */

// Vector2 type available from '../types' if needed

export interface BackdropLayer {
  update(deltaTime: number, time: number): void
  render(ctx: CanvasRenderingContext2D): void
  /** Parallax multiplier (0 = fixed, 0.5 = half speed, 1 = full speed) */
  parallax?: number
}

/**
 * Camera offset for parallax scrolling
 */
export interface CameraOffset {
  x: number
  y: number
}

export interface DataStream {
  x: number
  y: number
  speed: number
  length: number
  alpha: number
}

export interface CircuitNode {
  x: number
  y: number
  connections: number[]
  pulsePhase: number
  type: 'junction' | 'endpoint' | 'processor'
}

export interface EnergyParticle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  hue: number
}

export interface HexCell {
  x: number
  y: number
  phase: number
}

export interface BackdropConfig {
  width: number
  height: number
}

export interface BackdropColors {
  deepSpace: string
  darkPurple: string
  gridLine: string
  circuitPrimary: string   // Blue (enterprise)
  circuitSecondary: string // Indigo (enterprise)
  energyPulse: string
  glowCyan: string         // Blue glow (legacy name kept for compatibility)
  glowMagenta: string      // Indigo glow (legacy name kept for compatibility)
}

export const BACKDROP_COLORS: BackdropColors = {
  deepSpace: '#050510',
  darkPurple: '#0a0a1a',
  gridLine: '#1a1a3a',
  circuitPrimary: '#3b82f6',    // Blue-500 (was cyan)
  circuitSecondary: '#6366f1',  // Indigo-500 (was magenta)
  energyPulse: '#10b981',       // Emerald-500
  glowCyan: 'rgba(59, 130, 246, 0.3)',    // Blue glow
  glowMagenta: 'rgba(99, 102, 241, 0.2)', // Indigo glow
}

// ============================================================================
// Volcanic Theme Colors
// ============================================================================

/**
 * Color palette for volcanic/lava themed maps
 * Used by Vortex Arena and volcanic backdrop layers
 */
export interface VolcanicColors {
  /** Bright orange lava center (#ff4400) */
  lavaCore: string
  /** Orange glow effect (#ff6600) */
  lavaGlow: string
  /** Darker lava edges (#cc3300) */
  lavaDark: string
  /** Yellow-orange fire (#ffaa00) */
  fire: string
  /** Ember particle color (#ff8844) */
  ember: string
  /** Dark obsidian rock (#1a1a1a) */
  obsidian: string
  /** Volcanic stone floor (#2d2d2d) */
  stone: string
  /** Smoke/steam dark (#4a4a4a) */
  smoke: string
  /** Light steam (#888888) */
  steam: string
  /** Glowing cracks (#ff2200) */
  crack: string
}

export const VOLCANIC_COLORS: VolcanicColors = {
  lavaCore: '#ff4400',
  lavaGlow: '#ff6600',
  lavaDark: '#cc3300',
  fire: '#ffaa00',
  ember: '#ff8844',
  obsidian: '#1a1a1a',
  stone: '#2d2d2d',
  smoke: '#4a4a4a',
  steam: '#888888',
  crack: '#ff2200',
}
