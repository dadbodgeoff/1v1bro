/**
 * Demo Game Types
 * 
 * Type definitions for the landing page demo game system.
 * 
 * @module landing/enterprise/demo/types
 */

export interface Vector2 {
  x: number
  y: number
}

export interface DemoPlayerState {
  id: string
  position: Vector2
  velocity: Vector2
  health: number
  maxHealth: number
  score: number
  color: string
  isAlive: boolean
  facingRight: boolean
}

export interface DemoProjectile {
  id: string
  position: Vector2
  velocity: Vector2
  ownerId: string
  color: string
}

export interface DemoQuestion {
  id: string
  text: string
  options: string[]
  correctIndex: number
}

export interface DemoAI {
  state: 'idle' | 'moving' | 'aiming' | 'firing' | 'dodging' | 'answering'
  personality: 'aggressive' | 'defensive'
  reactionTime: number
  accuracy: number
  quizSpeed: number
  targetPosition: Vector2 | null
  stateTimer: number
  lastFireTime: number
  selectedAnswer: number | null
}

export interface DemoMatchState {
  phase: 'intro' | 'question' | 'combat' | 'finale' | 'reset'
  timeInPhase: number
  isPlaying: boolean
}

export interface KillFeedEntry {
  text: string
  time: number
}
