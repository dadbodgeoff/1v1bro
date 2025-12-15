/**
 * Survival Demo Types
 * 
 * Type definitions for the landing page survival runner demo.
 * Lightweight version mimicking the full survival mode.
 * 
 * @module landing/enterprise/survival-demo/types
 */

export interface Vector2 {
  x: number
  y: number
}

export interface Vector3 {
  x: number
  y: number
  z: number
}

export type Lane = 'left' | 'center' | 'right'

export interface DemoRunnerState {
  lane: Lane
  laneX: number
  z: number
  y: number
  velocityY: number
  isJumping: boolean
  isSliding: boolean
  isRunning: boolean
  animationFrame: number
}

export type ObstacleType = 'barrier' | 'spike' | 'overhead' | 'gap'

export interface DemoObstacle {
  id: string
  type: ObstacleType
  lane: Lane
  z: number
  width: number
  height: number
  cleared: boolean
}

export interface DemoCollectible {
  id: string
  lane: Lane
  z: number
  y: number
  collected: boolean
  type: 'gem' | 'coin'
}

export interface DemoTrackTile {
  z: number
  opacity: number
}

export interface DemoGameState {
  phase: 'intro' | 'running' | 'hit' | 'gameover' | 'reset'
  distance: number
  score: number
  speed: number
  combo: number
  lives: number
  maxLives: number
}

export interface SurvivalDemoCallbacks {
  onStateChange?: (state: DemoGameState) => void
  onDistanceUpdate?: (distance: number) => void
  onScoreUpdate?: (score: number) => void
}
