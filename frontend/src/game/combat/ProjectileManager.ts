/**
 * Projectile Manager
 * Handles projectile lifecycle: spawn, update, destroy
 */

import { WEAPON_CONFIG } from '../config'
import { BARRIERS } from '../config/arena'
import type { Projectile, Vector2 } from '../types'

export class ProjectileManager {
  private projectiles: Map<string, Projectile> = new Map()
  private nextId = 0

  /**
   * Spawn a new projectile
   */
  spawnProjectile(
    ownerId: string,
    position: Vector2,
    direction: Vector2,
    isPredicted: boolean
  ): Projectile {
    const id = `proj_${ownerId}_${this.nextId++}`

    // Normalize direction
    const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y)
    const normalizedDir =
      length > 0 ? { x: direction.x / length, y: direction.y / length } : { x: 1, y: 0 }

    const projectile: Projectile = {
      id,
      ownerId,
      position: { ...position },
      velocity: {
        x: normalizedDir.x * WEAPON_CONFIG.projectileSpeed,
        y: normalizedDir.y * WEAPON_CONFIG.projectileSpeed,
      },
      spawnTime: Date.now(),
      spawnPosition: { ...position },
      damage: WEAPON_CONFIG.damage,
      isPredicted,
    }

    this.projectiles.set(id, projectile)
    return projectile
  }

  /**
   * Update all projectiles (call each frame)
   */
  update(deltaTime: number): void {
    for (const [id, projectile] of this.projectiles) {
      // Move projectile
      projectile.position.x += projectile.velocity.x * deltaTime
      projectile.position.y += projectile.velocity.y * deltaTime


      // Check range - destroy if exceeded max range
      const dx = projectile.position.x - projectile.spawnPosition.x
      const dy = projectile.position.y - projectile.spawnPosition.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance >= WEAPON_CONFIG.maxRange) {
        this.projectiles.delete(id)
        continue
      }

      // Check barrier collision
      if (this.checkBarrierCollision(projectile.position)) {
        this.projectiles.delete(id)
        continue
      }

      // Check arena bounds
      if (this.isOutOfBounds(projectile.position)) {
        this.projectiles.delete(id)
        continue
      }
    }
  }

  /**
   * Check if position collides with any barrier
   */
  private checkBarrierCollision(position: Vector2): boolean {
    for (const barrier of BARRIERS) {
      if (
        position.x >= barrier.x &&
        position.x <= barrier.x + barrier.width &&
        position.y >= barrier.y &&
        position.y <= barrier.y + barrier.height
      ) {
        return true
      }
    }
    return false
  }

  /**
   * Check if position is outside arena bounds
   */
  private isOutOfBounds(position: Vector2): boolean {
    return position.x < 0 || position.x > 1280 || position.y < 0 || position.y > 720
  }

  /**
   * Destroy a specific projectile
   */
  destroyProjectile(id: string): void {
    this.projectiles.delete(id)
  }

  /**
   * Get all active projectiles
   */
  getProjectiles(): Projectile[] {
    return Array.from(this.projectiles.values())
  }

  /**
   * Get a specific projectile by ID
   */
  getProjectile(id: string): Projectile | undefined {
    return this.projectiles.get(id)
  }

  /**
   * Clear all projectiles
   */
  clear(): void {
    this.projectiles.clear()
  }

  /**
   * Get projectile count
   */
  getCount(): number {
    return this.projectiles.size
  }

  /**
   * Set projectiles from server state (replaces all local projectiles)
   */
  setFromServer(projectiles: Projectile[]): void {
    this.projectiles.clear()
    for (const proj of projectiles) {
      this.projectiles.set(proj.id, proj)
    }
  }
}
