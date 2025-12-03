/**
 * Game type definitions
 * Single source of truth for all game-related types
 */

export interface Vector2 {
  x: number
  y: number
}

export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

export interface TrailPoint extends Vector2 {
  alpha: number
}

export interface PlayerState {
  id: string
  position: Vector2
  trail: TrailPoint[]
  isLocal: boolean
}

export interface PowerUpState {
  id: number
  position: Vector2
  type: PowerUpType
  active: boolean
  collected: boolean
}

export type PowerUpType = 'sos' | 'time_steal' | 'shield' | 'double_points'

export interface GameState {
  player1: PlayerState | null
  player2: PlayerState | null
  powerUps: PowerUpState[]
  animationTime: number
}

export interface RenderContext {
  ctx: CanvasRenderingContext2D
  scale: number
  animationTime: number
}
