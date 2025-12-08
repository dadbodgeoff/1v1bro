/**
 * DoorSystem - Dynamic doors/gates triggered by events
 * Can be linked to pressure plates, trivia completion, or timers
 * 
 * @module interactive/DoorSystem
 */

import type { Vector2 } from '../types'

// ============================================================================
// Types
// ============================================================================

export type DoorState = 'open' | 'closed' | 'opening' | 'closing'
export type DoorTrigger = 'pressure_plate' | 'trivia' | 'timer' | 'manual'

export interface DoorConfig {
  id: string
  position: Vector2
  size: Vector2
  direction: 'horizontal' | 'vertical'
  trigger: DoorTrigger
  linkedTriggerId?: string  // ID of pressure plate or trivia pad
  autoCloseDelay?: number   // ms before auto-closing (0 = stays open)
  openDuration: number      // ms for open animation
}

export interface DoorInstance {
  id: string
  config: DoorConfig
  state: DoorState
  progress: number         // 0-1 animation progress
  lastTriggerTime: number
  isBlocking: boolean      // Currently blocking movement
}

export interface DoorCallbacks {
  onOpen?: (doorId: string) => void
  onClose?: (doorId: string) => void
  onBlocked?: (doorId: string, playerId: string) => void
}

// ============================================================================
// DoorSystem Class
// ============================================================================

export class DoorSystem {
  private doors: Map<string, DoorInstance> = new Map()
  private triggerLinks: Map<string, string[]> = new Map()  // triggerId -> doorIds
  private callbacks: DoorCallbacks = {}

  constructor(callbacks?: DoorCallbacks) {
    if (callbacks) this.callbacks = callbacks
  }


  /**
   * Add a door to the system
   */
  addDoor(config: DoorConfig): void {
    const door: DoorInstance = {
      id: config.id,
      config,
      state: 'closed',
      progress: 0,
      lastTriggerTime: 0,
      isBlocking: true,
    }
    this.doors.set(config.id, door)

    // Link to trigger if specified
    if (config.linkedTriggerId) {
      const links = this.triggerLinks.get(config.linkedTriggerId) || []
      links.push(config.id)
      this.triggerLinks.set(config.linkedTriggerId, links)
    }
  }

  /**
   * Remove a door
   */
  removeDoor(doorId: string): void {
    const door = this.doors.get(doorId)
    if (door?.config.linkedTriggerId) {
      const links = this.triggerLinks.get(door.config.linkedTriggerId)
      if (links) {
        const idx = links.indexOf(doorId)
        if (idx !== -1) links.splice(idx, 1)
      }
    }
    this.doors.delete(doorId)
  }

  /**
   * Trigger doors linked to a specific trigger ID
   */
  triggerByLink(triggerId: string): void {
    const doorIds = this.triggerLinks.get(triggerId)
    if (!doorIds) return

    for (const doorId of doorIds) {
      this.toggleDoor(doorId)
    }
  }

  /**
   * Toggle a door open/closed
   */
  toggleDoor(doorId: string): void {
    const door = this.doors.get(doorId)
    if (!door) return

    if (door.state === 'closed' || door.state === 'closing') {
      this.openDoor(doorId)
    } else {
      this.closeDoor(doorId)
    }
  }

  /**
   * Open a door
   */
  openDoor(doorId: string): void {
    const door = this.doors.get(doorId)
    if (!door || door.state === 'open' || door.state === 'opening') return

    door.state = 'opening'
    door.lastTriggerTime = Date.now()
    this.callbacks.onOpen?.(doorId)
  }

  /**
   * Close a door
   */
  closeDoor(doorId: string): void {
    const door = this.doors.get(doorId)
    if (!door || door.state === 'closed' || door.state === 'closing') return

    door.state = 'closing'
    door.lastTriggerTime = Date.now()
    this.callbacks.onClose?.(doorId)
  }

  /**
   * Update all doors (call each frame)
   */
  update(deltaTime: number): void {
    const now = Date.now()

    for (const door of this.doors.values()) {
      const { config, state } = door
      const animSpeed = 1000 / config.openDuration

      switch (state) {
        case 'opening':
          door.progress = Math.min(1, door.progress + deltaTime * animSpeed)
          door.isBlocking = door.progress < 0.8
          if (door.progress >= 1) {
            door.state = 'open'
            door.progress = 1
            door.isBlocking = false
          }
          break

        case 'closing':
          door.progress = Math.max(0, door.progress - deltaTime * animSpeed)
          door.isBlocking = door.progress > 0.2
          if (door.progress <= 0) {
            door.state = 'closed'
            door.progress = 0
            door.isBlocking = true
          }
          break

        case 'open':
          // Auto-close check
          if (config.autoCloseDelay && config.autoCloseDelay > 0) {
            if (now - door.lastTriggerTime > config.autoCloseDelay) {
              this.closeDoor(door.id)
            }
          }
          break
      }
    }
  }


  /**
   * Check if a position collides with any closed/closing door
   */
  checkCollision(position: Vector2, radius: number): DoorInstance | null {
    for (const door of this.doors.values()) {
      if (!door.isBlocking) continue

      const doorRect = this.getDoorRect(door)

      // Simple AABB collision with circle
      const closestX = Math.max(doorRect.x, Math.min(position.x, doorRect.x + doorRect.width))
      const closestY = Math.max(doorRect.y, Math.min(position.y, doorRect.y + doorRect.height))
      const dx = position.x - closestX
      const dy = position.y - closestY

      if (dx * dx + dy * dy < radius * radius) {
        return door
      }
    }
    return null
  }

  /**
   * Get the current collision rect for a door (accounts for animation)
   */
  getDoorRect(door: DoorInstance): { x: number; y: number; width: number; height: number } {
    const { config, progress } = door
    const openAmount = progress

    if (config.direction === 'horizontal') {
      // Door slides left/right
      const slideOffset = config.size.x * openAmount
      return {
        x: config.position.x + slideOffset,
        y: config.position.y,
        width: config.size.x * (1 - openAmount),
        height: config.size.y,
      }
    } else {
      // Door slides up/down
      const slideOffset = config.size.y * openAmount
      return {
        x: config.position.x,
        y: config.position.y + slideOffset,
        width: config.size.x,
        height: config.size.y * (1 - openAmount),
      }
    }
  }

  /**
   * Get a door by ID
   */
  getDoor(doorId: string): DoorInstance | undefined {
    return this.doors.get(doorId)
  }

  /**
   * Get all doors
   */
  getAllDoors(): DoorInstance[] {
    return Array.from(this.doors.values())
  }

  /**
   * Clear all doors
   */
  clear(): void {
    this.doors.clear()
    this.triggerLinks.clear()
  }
}


// ============================================================================
// Server Sync Methods
// ============================================================================

/**
 * Apply server state to sync doors
 * Called when receiving door state from server
 */
export function applyServerDoorState(
  doorSystem: DoorSystem,
  serverState: Array<{
    id: string
    state: string
    progress: number
    is_blocking: boolean
  }>
): void {
  for (const serverDoor of serverState) {
    const door = doorSystem.getDoor(serverDoor.id)
    if (door) {
      door.state = serverDoor.state as DoorState
      door.progress = serverDoor.progress
      door.isBlocking = serverDoor.is_blocking
    }
  }
}
