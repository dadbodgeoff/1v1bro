/**
 * BarrierManager - Manages all barrier instances and their lifecycle
 * Handles collision detection, damage, and destruction
 * 
 * @module barriers/BarrierManager
 */

import type { 
  BarrierConfig, 
  BarrierState, 
  BarrierCallbacks
} from '../arena/types'
import type { MapTheme } from '../config/maps/map-schema'
import type { Vector2 } from '../types'
import { DestructibleBarrier } from './DestructibleBarrier'
import { OneWayBarrier } from './OneWayBarrier'
import { blocksProjectiles, BARRIER_HEALTH } from './BarrierTypes'
import { renderBarrier } from './BarrierRenderer'
import { renderVolcanicBarrier } from './VolcanicBarrierRenderer'

/**
 * BarrierManager manages all barrier instances and their lifecycle
 */
export class BarrierManager {
  private barriers: Map<string, BarrierState> = new Map()
  private destructibles: Map<string, DestructibleBarrier> = new Map()
  private oneWays: Map<string, OneWayBarrier> = new Map()
  private callbacks: BarrierCallbacks = {}
  private theme: MapTheme = 'space'

  setTheme(theme: MapTheme): void {
    this.theme = theme
  }

  initialize(configs: BarrierConfig[]): void {
    this.barriers.clear()
    this.destructibles.clear()
    this.oneWays.clear()

    for (const config of configs) {
      const state: BarrierState = {
        id: config.id,
        type: config.type,
        position: { ...config.position },
        size: { ...config.size },
        health: config.health ?? BARRIER_HEALTH.DEFAULT,
        maxHealth: config.health ?? BARRIER_HEALTH.DEFAULT,
        damageState: 'intact',
        isActive: true
      }

      this.barriers.set(config.id, state)

      if (config.type === 'destructible') {
        this.destructibles.set(config.id, new DestructibleBarrier(state))
      } else if (config.type === 'one_way' && config.direction) {
        this.oneWays.set(config.id, new OneWayBarrier(state, config.direction))
      }
    }
  }

  setCallbacks(callbacks: BarrierCallbacks): void {
    this.callbacks = callbacks
  }

  checkCollision(position: Vector2, radius: number, nearbyIds: string[]): boolean {
    for (const id of nearbyIds) {
      const barrier = this.barriers.get(id)
      if (!barrier || !barrier.isActive) continue

      if (barrier.type === 'one_way') {
        const oneWay = this.oneWays.get(id)
        if (oneWay && !oneWay.shouldBlock(position)) continue
      }

      if (this.circleRectCollision(position, radius, barrier)) {
        return true
      }
    }
    return false
  }

  checkProjectileCollision(position: Vector2, nearbyIds: string[]): string | null {
    for (const id of nearbyIds) {
      const barrier = this.barriers.get(id)
      if (!barrier || !barrier.isActive) continue

      if (!blocksProjectiles(barrier.type)) continue

      if (this.pointInRect(position, barrier)) {
        return id
      }
    }
    return null
  }

  resolveCollision(position: Vector2, radius: number, nearbyIds: string[]): Vector2 {
    let resolved = { ...position }

    for (const id of nearbyIds) {
      const barrier = this.barriers.get(id)
      if (!barrier || !barrier.isActive) continue

      if (barrier.type === 'one_way') {
        const oneWay = this.oneWays.get(id)
        if (oneWay && !oneWay.shouldBlock(resolved)) continue
      }

      if (this.circleRectCollision(resolved, radius, barrier)) {
        resolved = this.pushOutOfRect(resolved, radius, barrier)
      }
    }

    return resolved
  }

  applyDamage(barrierId: string, damage: number): void {
    const destructible = this.destructibles.get(barrierId)
    if (!destructible) return

    const result = destructible.applyDamage(damage)
    const barrier = this.barriers.get(barrierId)!

    barrier.health = result.health
    barrier.damageState = result.damageState

    this.callbacks.onDamaged?.(barrierId, result.health, barrier.maxHealth)

    if (result.destroyed) {
      barrier.isActive = false
      this.callbacks.onDestroyed?.(barrierId, barrier.position)
    }
  }

  getActiveBarriers(): BarrierState[] {
    return Array.from(this.barriers.values()).filter(b => b.isActive)
  }

  getBarrierAt(position: Vector2): BarrierState | null {
    for (const barrier of this.barriers.values()) {
      if (!barrier.isActive) continue
      if (this.pointInRect(position, barrier)) {
        return barrier
      }
    }
    return null
  }

  getBarrier(id: string): BarrierState | undefined {
    return this.barriers.get(id)
  }

  applyServerState(serverState: Array<{
    id: string
    x: number
    y: number
    width: number
    height: number
    type: string
    health: number
    max_health: number
    is_active: boolean
    direction?: string
  }>): void {
    const serverIds = new Set(serverState.map(s => s.id))

    for (const id of this.barriers.keys()) {
      if (!serverIds.has(id)) {
        this.barriers.delete(id)
        this.destructibles.delete(id)
        this.oneWays.delete(id)
      }
    }

    const mapDirection = (dir?: string): 'N' | 'S' | 'E' | 'W' | undefined => {
      if (!dir) return undefined
      const dirMap: Record<string, 'N' | 'S' | 'E' | 'W'> = {
        'up': 'N', 'down': 'S', 'left': 'W', 'right': 'E',
        'N': 'N', 'S': 'S', 'E': 'E', 'W': 'W'
      }
      return dirMap[dir]
    }

    for (const state of serverState) {
      const existing = this.barriers.get(state.id)
      
      if (existing) {
        existing.position = { x: state.x, y: state.y }
        existing.size = { x: state.width, y: state.height }
        existing.health = state.health
        existing.maxHealth = state.max_health
        existing.isActive = state.is_active
        
        const healthPercent = state.health / state.max_health
        if (healthPercent <= 0) {
          existing.damageState = 'destroyed'
        } else if (healthPercent <= 0.33) {
          existing.damageState = 'damaged'
        } else if (healthPercent <= 0.66) {
          existing.damageState = 'cracked'
        } else {
          existing.damageState = 'intact'
        }
      } else {
        const newState: BarrierState = {
          id: state.id,
          type: state.type as BarrierState['type'],
          position: { x: state.x, y: state.y },
          size: { x: state.width, y: state.height },
          health: state.health,
          maxHealth: state.max_health,
          damageState: 'intact',
          isActive: state.is_active
        }
        
        this.barriers.set(state.id, newState)
        
        if (state.type === 'destructible') {
          this.destructibles.set(state.id, new DestructibleBarrier(newState))
        } else if (state.type === 'one_way') {
          const dir = mapDirection(state.direction)
          if (dir) {
            this.oneWays.set(state.id, new OneWayBarrier(newState, dir))
          }
        }
      }
    }
  }

  applyServerDamage(barrierId: string, health: number, maxHealth: number): void {
    const barrier = this.barriers.get(barrierId)
    if (!barrier) return

    barrier.health = health
    barrier.maxHealth = maxHealth

    const healthPercent = health / maxHealth
    if (healthPercent <= 0) {
      barrier.damageState = 'destroyed'
      barrier.isActive = false
    } else if (healthPercent <= 0.33) {
      barrier.damageState = 'damaged'
    } else if (healthPercent <= 0.66) {
      barrier.damageState = 'cracked'
    }

    this.callbacks.onDamaged?.(barrierId, health, maxHealth)
  }

  applyServerDestruction(barrierId: string): void {
    const barrier = this.barriers.get(barrierId)
    if (!barrier) return

    barrier.health = 0
    barrier.damageState = 'destroyed'
    barrier.isActive = false

    this.callbacks.onDestroyed?.(barrierId, barrier.position)
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const barrier of this.barriers.values()) {
      if (!barrier.isActive) continue
      
      const oneWay = this.oneWays.get(barrier.id)
      
      if (this.theme === 'volcanic') {
        renderVolcanicBarrier(ctx, barrier, oneWay)
      } else {
        renderBarrier(ctx, barrier, oneWay)
      }
    }
  }

  private circleRectCollision(pos: Vector2, radius: number, barrier: BarrierState): boolean {
    const { position, size } = barrier
    
    const closestX = Math.max(position.x, Math.min(pos.x, position.x + size.x))
    const closestY = Math.max(position.y, Math.min(pos.y, position.y + size.y))
    
    const dx = pos.x - closestX
    const dy = pos.y - closestY
    
    return (dx * dx + dy * dy) < (radius * radius)
  }

  private pointInRect(pos: Vector2, barrier: BarrierState): boolean {
    const { position, size } = barrier
    return pos.x >= position.x && pos.x <= position.x + size.x &&
           pos.y >= position.y && pos.y <= position.y + size.y
  }

  private pushOutOfRect(pos: Vector2, radius: number, barrier: BarrierState): Vector2 {
    const { position, size } = barrier
    
    const closestX = Math.max(position.x, Math.min(pos.x, position.x + size.x))
    const closestY = Math.max(position.y, Math.min(pos.y, position.y + size.y))
    
    const dx = pos.x - closestX
    const dy = pos.y - closestY
    const dist = Math.sqrt(dx * dx + dy * dy)
    
    if (dist === 0) {
      const toLeft = pos.x - position.x
      const toRight = position.x + size.x - pos.x
      const toTop = pos.y - position.y
      const toBottom = position.y + size.y - pos.y
      
      const minDist = Math.min(toLeft, toRight, toTop, toBottom)
      
      if (minDist === toLeft) return { x: position.x - radius, y: pos.y }
      if (minDist === toRight) return { x: position.x + size.x + radius, y: pos.y }
      if (minDist === toTop) return { x: pos.x, y: position.y - radius }
      return { x: pos.x, y: position.y + size.y + radius }
    }
    
    const overlap = radius - dist
    if (overlap > 0) {
      return {
        x: pos.x + (dx / dist) * overlap,
        y: pos.y + (dy / dist) * overlap
      }
    }
    
    return pos
  }
}
