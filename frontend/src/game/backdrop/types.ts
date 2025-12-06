/**
 * Backdrop Layer Types
 */

// Vector2 type available from '../types' if needed

export interface BackdropLayer {
  update(deltaTime: number, time: number): void
  render(ctx: CanvasRenderingContext2D): void
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
  circuitPrimary: string
  circuitSecondary: string
  energyPulse: string
  glowCyan: string
  glowMagenta: string
}

export const BACKDROP_COLORS: BackdropColors = {
  deepSpace: '#050510',
  darkPurple: '#0a0a1a',
  gridLine: '#1a1a3a',
  circuitPrimary: '#00ffff',
  circuitSecondary: '#ff00ff',
  energyPulse: '#00ff88',
  glowCyan: 'rgba(0, 255, 255, 0.3)',
  glowMagenta: 'rgba(255, 0, 255, 0.2)',
}
