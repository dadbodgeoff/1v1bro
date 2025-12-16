/**
 * GameEventBus - Centralized typed event system for survival game
 * 
 * Replaces scattered callback wiring with a single pub/sub system.
 * All cross-system communication goes through this bus.
 * 
 * Benefits:
 * - Single place to see all event subscriptions
 * - Type-safe event payloads
 * - Easy debugging (can log all events)
 * - Decoupled systems
 */

import type { ObstacleType } from '../types/survival'

/**
 * All game events with their payload types
 */
export interface GameEvents {
  // Player events
  'player:nearMiss': {
    distance: number
    obstacleType: ObstacleType
    position: { x: number; y: number; z: number }
    isPerfect: boolean
  }
  'player:collision': {
    obstacleType: ObstacleType
    position: { x: number; z: number }
  }
  'player:lifeLost': {
    livesRemaining: number
  }
  'player:respawn': {
    position: { x: number; y: number; z: number }
  }
  'player:jump': {
    position: { x: number; y: number; z: number }
  }
  'player:land': {
    velocity: number
    position: { x: number; y: number; z: number }
  }
  'player:slide': {
    isSliding: boolean
  }
  'player:laneChange': {
    fromLane: number
    toLane: number
    direction: number
  }

  // Combo events
  'combo:update': {
    combo: number
    multiplier: number
    type: 'near_miss' | 'perfect_dodge' | 'collision' | 'decay' | 'milestone'
  }
  'combo:milestone': {
    milestone: number
    combo: number
    multiplier: number
    position?: { x: number; z: number }
  }
  'combo:reset': {
    previousCombo: number
  }

  // Achievement events
  'achievement:unlocked': {
    id: string
    name: string
    category: string
    value: number
  }
  'achievement:closeCall': {
    count: number
  }
  'achievement:perfectDodge': {
    count: number
  }

  // Milestone events (distance)
  'milestone:reached': {
    distance: number
    isMajor: boolean
  }

  // Game state events
  'game:start': Record<string, never>
  'game:pause': Record<string, never>
  'game:resume': Record<string, never>
  'game:over': {
    score: number
    distance: number
  }
  'game:countdown': {
    value: number | 'GO' | null
  }

  // Score events
  'score:add': {
    points: number
    source: 'nearMiss' | 'perfectDodge' | 'collectible' | 'obstacle' | 'bonus'
  }
  'score:update': {
    score: number
    multiplier: number
  }

  // Obstacle events
  'obstacle:cleared': {
    obstacleType: ObstacleType
    position: { x: number; z: number }
  }
  'obstacle:spawned': {
    obstacleType: ObstacleType
    position: { x: number; z: number }
  }

  // Collectible events
  'collectible:collected': {
    type: string
    points: number
    position: { x: number; y: number; z: number }
  }

  // Feedback events (for sound/haptic systems to listen to)
  'feedback:sound': {
    event: string
    intensity?: number
    pitch?: number
    position?: { x: number; z: number }
  }
  'feedback:haptic': {
    pattern: string
    intensity?: number
  }
  'feedback:visual': {
    type: 'close' | 'perfect' | 'combo-milestone'
    text: string
    position: { x: number; z: number }
    color?: number
    duration?: number
  }
}

type EventCallback<T> = (payload: T) => void
type UnsubscribeFn = () => void

/**
 * GameEventBus - Type-safe event emitter
 */
export class GameEventBus {
  private listeners: Map<keyof GameEvents, Set<EventCallback<unknown>>> = new Map()
  private debugMode: boolean = false

  /**
   * Enable debug mode to log all events
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled
  }

  /**
   * Subscribe to an event
   */
  on<K extends keyof GameEvents>(
    event: K,
    callback: EventCallback<GameEvents[K]>
  ): UnsubscribeFn {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    
    const callbacks = this.listeners.get(event)!
    callbacks.add(callback as EventCallback<unknown>)
    
    // Return unsubscribe function
    return () => {
      callbacks.delete(callback as EventCallback<unknown>)
    }
  }

  /**
   * Subscribe to an event (one-time)
   */
  once<K extends keyof GameEvents>(
    event: K,
    callback: EventCallback<GameEvents[K]>
  ): UnsubscribeFn {
    const unsubscribe = this.on(event, (payload) => {
      unsubscribe()
      callback(payload)
    })
    return unsubscribe
  }

  /**
   * Emit an event
   */
  emit<K extends keyof GameEvents>(event: K, payload: GameEvents[K]): void {
    if (this.debugMode) {
      console.log(`[GameEventBus] ${event}`, payload)
    }
    
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(payload)
        } catch (error) {
          console.error(`[GameEventBus] Error in ${event} handler:`, error)
        }
      })
    }
  }

  /**
   * Remove all listeners for an event
   */
  off<K extends keyof GameEvents>(event: K): void {
    this.listeners.delete(event)
  }

  /**
   * Remove all listeners
   */
  clear(): void {
    this.listeners.clear()
  }

  /**
   * Get listener count for debugging
   */
  getListenerCount(event?: keyof GameEvents): number {
    if (event) {
      return this.listeners.get(event)?.size ?? 0
    }
    let total = 0
    this.listeners.forEach(set => total += set.size)
    return total
  }

  /**
   * Get all registered events for debugging
   */
  getRegisteredEvents(): (keyof GameEvents)[] {
    return Array.from(this.listeners.keys())
  }
}

// Singleton instance for the game
let globalEventBus: GameEventBus | null = null

/**
 * Get the global event bus instance
 */
export function getEventBus(): GameEventBus {
  if (!globalEventBus) {
    globalEventBus = new GameEventBus()
  }
  return globalEventBus
}

/**
 * Reset the global event bus (for testing)
 */
export function resetEventBus(): void {
  if (globalEventBus) {
    globalEventBus.clear()
  }
  globalEventBus = null
}
