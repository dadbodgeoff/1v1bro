/**
 * Collision detection system
 * Handles arena bounds and barrier collisions
 */

import { ARENA_SIZE, BARRIERS, PLAYER_CONFIG } from '../config'
import type { Vector2, Rectangle } from '../types'

export class CollisionSystem {
  /**
   * Check if a position would collide with anything
   */
  checkCollision(position: Vector2, radius = PLAYER_CONFIG.radius): boolean {
    return this.checkBounds(position, radius) || this.checkBarriers(position, radius)
  }

  /**
   * Check arena boundary collision
   */
  checkBounds(position: Vector2, radius: number): boolean {
    return (
      position.x - radius < 0 ||
      position.x + radius > ARENA_SIZE.width ||
      position.y - radius < 0 ||
      position.y + radius > ARENA_SIZE.height
    )
  }

  /**
   * Check barrier collision
   */
  checkBarriers(position: Vector2, radius: number): boolean {
    return BARRIERS.some(barrier => this.circleRectCollision(position, radius, barrier))
  }

  /**
   * Circle-rectangle collision detection
   */
  private circleRectCollision(circle: Vector2, radius: number, rect: Rectangle): boolean {
    // Find closest point on rectangle to circle center
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width))
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height))

    // Calculate distance from circle center to closest point
    const dx = circle.x - closestX
    const dy = circle.y - closestY
    const distanceSquared = dx * dx + dy * dy

    return distanceSquared < radius * radius
  }

  /**
   * Resolve collision by pushing position out of obstacle
   */
  resolveCollision(position: Vector2, radius = PLAYER_CONFIG.radius): Vector2 {
    let resolved = { ...position }

    // Resolve bounds
    resolved.x = Math.max(radius, Math.min(ARENA_SIZE.width - radius, resolved.x))
    resolved.y = Math.max(radius, Math.min(ARENA_SIZE.height - radius, resolved.y))

    // Resolve barriers (simple push-out)
    BARRIERS.forEach(barrier => {
      if (this.circleRectCollision(resolved, radius, barrier)) {
        resolved = this.pushOutOfRect(resolved, radius, barrier)
      }
    })

    return resolved
  }

  /**
   * Push circle out of rectangle
   */
  private pushOutOfRect(circle: Vector2, radius: number, rect: Rectangle): Vector2 {
    const centerX = rect.x + rect.width / 2
    const centerY = rect.y + rect.height / 2

    // Determine which edge to push toward
    const dx = circle.x - centerX
    const dy = circle.y - centerY

    if (Math.abs(dx) / rect.width > Math.abs(dy) / rect.height) {
      // Push horizontally
      return {
        x: dx > 0 ? rect.x + rect.width + radius : rect.x - radius,
        y: circle.y,
      }
    } else {
      // Push vertically
      return {
        x: circle.x,
        y: dy > 0 ? rect.y + rect.height + radius : rect.y - radius,
      }
    }
  }
}
