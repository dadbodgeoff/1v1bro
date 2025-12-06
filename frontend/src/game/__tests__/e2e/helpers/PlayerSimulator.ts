/**
 * PlayerSimulator - Simulates player movement and interactions for E2E testing
 * 
 * @module __tests__/e2e/helpers/PlayerSimulator
 */

import type { Vector2 } from '../../../types'

/**
 * Interface for player simulation in tests
 */
export interface PlayerSimulator {
  readonly id: string
  position: Vector2
  velocity: Vector2
  
  /** Move player to absolute position */
  moveTo(position: Vector2): void
  
  /** Move player by delta from current position */
  moveBy(delta: Vector2): void
  
  /** Get current position */
  getPosition(): Vector2
  
  /** Set position directly */
  setPosition(position: Vector2): void
  
  /** Get current velocity */
  getVelocity(): Vector2
  
  /** Set velocity directly */
  setVelocity(velocity: Vector2): void
  
  /** Convert to Map format for ArenaManager.update() */
  toPlayerMap(): Map<string, Vector2>
  
  /** Reset to initial state */
  reset(): void
}

/**
 * Implementation of PlayerSimulator
 */
class PlayerSimulatorImpl implements PlayerSimulator {
  readonly id: string
  position: Vector2
  velocity: Vector2
  private initialPosition: Vector2
  
  constructor(id: string, startPosition: Vector2) {
    this.id = id
    this.position = { ...startPosition }
    this.velocity = { x: 0, y: 0 }
    this.initialPosition = { ...startPosition }
  }
  
  moveTo(position: Vector2): void {
    this.position = { ...position }
  }
  
  moveBy(delta: Vector2): void {
    this.position = {
      x: this.position.x + delta.x,
      y: this.position.y + delta.y
    }
  }
  
  getPosition(): Vector2 {
    return { ...this.position }
  }
  
  setPosition(position: Vector2): void {
    this.position = { ...position }
  }
  
  getVelocity(): Vector2 {
    return { ...this.velocity }
  }
  
  setVelocity(velocity: Vector2): void {
    this.velocity = { ...velocity }
  }
  
  toPlayerMap(): Map<string, Vector2> {
    const map = new Map<string, Vector2>()
    map.set(this.id, this.getPosition())
    return map
  }
  
  reset(): void {
    this.position = { ...this.initialPosition }
    this.velocity = { x: 0, y: 0 }
  }
}

/**
 * Factory function to create a PlayerSimulator
 */
export function createPlayerSimulator(id: string, startPosition: Vector2): PlayerSimulator {
  return new PlayerSimulatorImpl(id, startPosition)
}

/**
 * Create multiple player simulators and combine into a single Map
 */
export function createPlayerMap(...simulators: PlayerSimulator[]): Map<string, Vector2> {
  const map = new Map<string, Vector2>()
  for (const sim of simulators) {
    map.set(sim.id, sim.getPosition())
  }
  return map
}

/**
 * Helper to create a player at spawn point 1 (left side)
 */
export function createPlayer1(id: string = 'player1'): PlayerSimulator {
  return createPlayerSimulator(id, { x: 160, y: 360 })
}

/**
 * Helper to create a player at spawn point 2 (right side)
 */
export function createPlayer2(id: string = 'player2'): PlayerSimulator {
  return createPlayerSimulator(id, { x: 1120, y: 360 })
}
