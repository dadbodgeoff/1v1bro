/**
 * EventRecorder - Records arena events for assertion in E2E tests
 * 
 * @module __tests__/e2e/helpers/EventRecorder
 */

import type { Vector2 } from '../../../types'
import type { ArenaCallbacks } from '../../../arena/types'

/**
 * Recorded barrier destroyed event
 */
export interface BarrierDestroyedEvent {
  barrierId: string
  position: Vector2
  timestamp: number
}

/**
 * Recorded trap triggered event
 */
export interface TrapTriggeredEvent {
  trapId: string
  affectedPlayers: string[]
  timestamp: number
}

/**
 * Recorded player teleported event
 */
export interface PlayerTeleportedEvent {
  playerId: string
  from: Vector2
  to: Vector2
  timestamp: number
}

/**
 * Recorded player launched event
 */
export interface PlayerLaunchedEvent {
  playerId: string
  direction: Vector2
  timestamp: number
}

/**
 * Recorded hazard damage event
 */
export interface HazardDamageEvent {
  playerId: string
  damage: number
  sourceId: string
  timestamp: number
}

/**
 * All event types
 */
export type RecordedEvent = 
  | { type: 'barrierDestroyed'; data: BarrierDestroyedEvent }
  | { type: 'trapTriggered'; data: TrapTriggeredEvent }
  | { type: 'playerTeleported'; data: PlayerTeleportedEvent }
  | { type: 'playerLaunched'; data: PlayerLaunchedEvent }
  | { type: 'hazardDamage'; data: HazardDamageEvent }

/**
 * EventRecorder class for capturing and asserting arena events
 */
export class EventRecorder {
  /** All recorded events in order */
  readonly events: RecordedEvent[] = []
  
  /** Barrier destroyed events */
  readonly barrierDestroyed: BarrierDestroyedEvent[] = []
  
  /** Trap triggered events */
  readonly trapTriggered: TrapTriggeredEvent[] = []
  
  /** Player teleported events */
  readonly playerTeleported: PlayerTeleportedEvent[] = []
  
  /** Player launched events */
  readonly playerLaunched: PlayerLaunchedEvent[] = []
  
  /** Hazard damage events */
  readonly hazardDamage: HazardDamageEvent[] = []
  
  /**
   * Clear all recorded events
   */
  clear(): void {
    this.events.length = 0
    this.barrierDestroyed.length = 0
    this.trapTriggered.length = 0
    this.playerTeleported.length = 0
    this.playerLaunched.length = 0
    this.hazardDamage.length = 0
  }
  
  /**
   * Get ArenaCallbacks that record events
   */
  getCallbacks(): ArenaCallbacks {
    return {
      onBarrierDestroyed: (barrierId, position) => {
        const event: BarrierDestroyedEvent = {
          barrierId,
          position: { ...position },
          timestamp: Date.now()
        }
        this.barrierDestroyed.push(event)
        this.events.push({ type: 'barrierDestroyed', data: event })
      },
      
      onTrapTriggered: (trapId, affectedPlayers) => {
        const event: TrapTriggeredEvent = {
          trapId,
          affectedPlayers: [...affectedPlayers],
          timestamp: Date.now()
        }
        this.trapTriggered.push(event)
        this.events.push({ type: 'trapTriggered', data: event })
      },
      
      onPlayerTeleported: (playerId, from, to) => {
        const event: PlayerTeleportedEvent = {
          playerId,
          from: { ...from },
          to: { ...to },
          timestamp: Date.now()
        }
        this.playerTeleported.push(event)
        this.events.push({ type: 'playerTeleported', data: event })
      },
      
      onPlayerLaunched: (playerId, direction) => {
        const event: PlayerLaunchedEvent = {
          playerId,
          direction: { ...direction },
          timestamp: Date.now()
        }
        this.playerLaunched.push(event)
        this.events.push({ type: 'playerLaunched', data: event })
      },
      
      onHazardDamage: (playerId, damage, sourceId) => {
        const event: HazardDamageEvent = {
          playerId,
          damage,
          sourceId,
          timestamp: Date.now()
        }
        this.hazardDamage.push(event)
        this.events.push({ type: 'hazardDamage', data: event })
      }
    }
  }
  
  /**
   * Check if an event of the given type exists matching the predicate
   */
  hasEvent<T extends RecordedEvent['type']>(
    type: T,
    predicate?: (event: unknown) => boolean
  ): boolean {
    const events = this.getEventsByType(type)
    if (!predicate) return events.length > 0
    return events.some(predicate)
  }
  
  /**
   * Get all events of a specific type
   */
  getEventsByType<T extends RecordedEvent['type']>(
    type: T
  ): Array<Extract<RecordedEvent, { type: T }>['data']> {
    switch (type) {
      case 'barrierDestroyed': return this.barrierDestroyed as any
      case 'trapTriggered': return this.trapTriggered as any
      case 'playerTeleported': return this.playerTeleported as any
      case 'playerLaunched': return this.playerLaunched as any
      case 'hazardDamage': return this.hazardDamage as any
      default: return []
    }
  }
  
  /**
   * Get the last event of a specific type
   */
  getLastEvent<T extends RecordedEvent['type']>(
    type: T
  ): unknown | undefined {
    const events = this.getEventsByType(type)
    return events[events.length - 1]
  }
  
  /**
   * Get count of events of a specific type
   */
  getEventCount(type: RecordedEvent['type']): number {
    return this.getEventsByType(type).length
  }
  
  /**
   * Get total count of all events
   */
  getTotalEventCount(): number {
    return this.events.length
  }
}

/**
 * Factory function to create an EventRecorder
 */
export function createEventRecorder(): EventRecorder {
  return new EventRecorder()
}
