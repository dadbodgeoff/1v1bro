/**
 * Projectile Manager - AAA Enterprise Grade
 * Handles projectile lifecycle: spawn, update, destroy
 *
 * Features:
 * - Object pooling for reduced GC pressure
 * - Configurable arena bounds (no magic numbers)
 * - Render interpolation support for smooth visuals
 * - Server reconciliation with timestamp tracking
 */

import { WEAPON_CONFIG, ARENA_SIZE } from '../config'
import { BARRIERS } from '../config/arena'
import type { Projectile, Vector2 } from '../types'
import type { Rectangle } from '../types'

/** Extended projectile with interpolation data for AAA rendering */
export interface InterpolatedProjectile extends Projectile {
  /** Previous position for interpolation */
  prevPosition: Vector2
  /** Server timestamp for lag compensation */
  serverTimestamp?: number
}

/** Arena bounds configuration */
interface ArenaBounds {
  width: number
  height: number
}

/** Collision configuration */
export interface ProjectileCollisionConfig {
  barriers: Rectangle[]
  bounds: ArenaBounds
}

// Pool size - enough for intense firefights without excessive memory
const POOL_SIZE = 64

/** Internal pooled projectile with usage flag */
interface PooledProjectile extends InterpolatedProjectile {
  inUse: boolean
}

export class ProjectileManager {
  private projectiles: Map<string, PooledProjectile> = new Map()
  private pool: PooledProjectile[] = []
  private nextId = 0

  // Configurable collision (no more magic numbers)
  private bounds: ArenaBounds = { width: ARENA_SIZE.width, height: ARENA_SIZE.height }
  private barriers: Rectangle[] = BARRIERS

  constructor() {
    // Pre-allocate projectile pool for reduced GC pressure
    this.initializePool()
  }

  /** Pre-allocate projectile objects to reduce GC pressure */
  private initializePool(): void {
    for (let i = 0; i < POOL_SIZE; i++) {
      this.pool.push(this.createEmptyProjectile())
    }
  }

  /** Create an empty projectile for the pool */
  private createEmptyProjectile(): PooledProjectile {
    return {
      id: '',
      ownerId: '',
      position: { x: 0, y: 0 },
      prevPosition: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      spawnTime: 0,
      spawnPosition: { x: 0, y: 0 },
      damage: 0,
      isPredicted: false,
      inUse: false,
    }
  }

  /** Get a projectile from the pool or create new if pool exhausted */
  private acquireFromPool(): PooledProjectile {
    for (const proj of this.pool) {
      if (!proj.inUse) {
        proj.inUse = true
        return proj
      }
    }
    // Pool exhausted - create new (rare case under heavy load)
    const newProj = this.createEmptyProjectile()
    newProj.inUse = true
    this.pool.push(newProj)
    return newProj
  }

  /** Return projectile to pool */
  private releaseToPool(projectile: PooledProjectile): void {
    projectile.inUse = false
  }

  /**
   * Configure arena bounds (call when map changes)
   */
  setArenaBounds(width: number, height: number): void {
    this.bounds = { width, height }
  }

  /**
   * Configure barriers (call when map changes)
   */
  setBarriers(barriers: Rectangle[]): void {
    this.barriers = barriers
  }

  /**
   * Full collision config update
   */
  setCollisionConfig(config: ProjectileCollisionConfig): void {
    this.bounds = config.bounds
    this.barriers = config.barriers
  }

  /**
   * Spawn a new projectile (uses object pooling)
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

    // Acquire from pool instead of creating new object
    const projectile = this.acquireFromPool()

    // Initialize projectile data
    projectile.id = id
    projectile.ownerId = ownerId
    projectile.position.x = position.x
    projectile.position.y = position.y
    projectile.prevPosition.x = position.x
    projectile.prevPosition.y = position.y
    projectile.velocity.x = normalizedDir.x * WEAPON_CONFIG.projectileSpeed
    projectile.velocity.y = normalizedDir.y * WEAPON_CONFIG.projectileSpeed
    projectile.spawnTime = Date.now()
    projectile.spawnPosition.x = position.x
    projectile.spawnPosition.y = position.y
    projectile.damage = WEAPON_CONFIG.damage
    projectile.isPredicted = isPredicted
    projectile.serverTimestamp = undefined

    this.projectiles.set(id, projectile)
    return projectile
  }


  /**
   * Update all projectiles (call each frame)
   * Stores previous position for interpolation
   */
  update(deltaTime: number): void {
    const toRemove: string[] = []

    for (const [id, projectile] of this.projectiles) {
      // Store previous position for interpolation
      projectile.prevPosition.x = projectile.position.x
      projectile.prevPosition.y = projectile.position.y

      // Move projectile
      projectile.position.x += projectile.velocity.x * deltaTime
      projectile.position.y += projectile.velocity.y * deltaTime

      // Check range - destroy if exceeded max range
      const dx = projectile.position.x - projectile.spawnPosition.x
      const dy = projectile.position.y - projectile.spawnPosition.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance >= WEAPON_CONFIG.maxRange) {
        toRemove.push(id)
        continue
      }

      // Check barrier collision (uses configurable barriers)
      if (this.checkBarrierCollision(projectile.position)) {
        toRemove.push(id)
        continue
      }

      // Check arena bounds (uses configurable bounds)
      if (this.isOutOfBounds(projectile.position)) {
        toRemove.push(id)
        continue
      }
    }

    // Remove destroyed projectiles and return to pool
    for (const id of toRemove) {
      const proj = this.projectiles.get(id)
      if (proj) {
        this.releaseToPool(proj)
        this.projectiles.delete(id)
      }
    }
  }

  /**
   * Get interpolated position for smooth rendering
   * @param projectileId - The projectile ID
   * @param alpha - Interpolation factor (0-1), typically from frame timing
   * @returns Interpolated position or null if projectile not found
   */
  getInterpolatedPosition(projectileId: string, alpha: number): Vector2 | null {
    const proj = this.projectiles.get(projectileId)
    if (!proj) return null

    // Linear interpolation between previous and current position
    return {
      x: proj.prevPosition.x + (proj.position.x - proj.prevPosition.x) * alpha,
      y: proj.prevPosition.y + (proj.position.y - proj.prevPosition.y) * alpha,
    }
  }

  /**
   * Get all projectiles with interpolation data
   */
  getProjectilesWithInterpolation(): InterpolatedProjectile[] {
    return Array.from(this.projectiles.values()).filter(p => p.inUse)
  }

  /**
   * Check if position collides with any barrier (uses configurable barriers)
   */
  private checkBarrierCollision(position: Vector2): boolean {
    for (const barrier of this.barriers) {
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
   * Check if position is outside arena bounds (uses configurable bounds)
   */
  private isOutOfBounds(position: Vector2): boolean {
    return (
      position.x < 0 ||
      position.x > this.bounds.width ||
      position.y < 0 ||
      position.y > this.bounds.height
    )
  }

  /**
   * Destroy a specific projectile
   */
  destroyProjectile(id: string): void {
    const proj = this.projectiles.get(id)
    if (proj) {
      this.releaseToPool(proj)
      this.projectiles.delete(id)
    }
  }

  /**
   * Get all active projectiles
   */
  getProjectiles(): Projectile[] {
    return Array.from(this.projectiles.values()).filter(p => p.inUse)
  }

  /**
   * Get a specific projectile by ID
   */
  getProjectile(id: string): Projectile | undefined {
    const proj = this.projectiles.get(id)
    return proj?.inUse ? proj : undefined
  }

  /**
   * Clear all projectiles
   */
  clear(): void {
    for (const proj of this.projectiles.values()) {
      this.releaseToPool(proj)
    }
    this.projectiles.clear()
  }

  /**
   * Get projectile count
   */
  getCount(): number {
    return this.projectiles.size
  }

  /**
   * Get pool statistics (for debugging/monitoring)
   */
  getPoolStats(): { poolSize: number; inUse: number; available: number } {
    const inUse = this.pool.filter(p => p.inUse).length
    return {
      poolSize: this.pool.length,
      inUse,
      available: this.pool.length - inUse,
    }
  }

  /**
   * Set projectiles from server state (replaces all local projectiles)
   * Preserves interpolation data for smooth transitions
   */
  setFromServer(projectiles: Projectile[]): void {
    // Release all current projectiles to pool
    for (const proj of this.projectiles.values()) {
      this.releaseToPool(proj)
    }
    this.projectiles.clear()

    // Add server projectiles
    for (const serverProj of projectiles) {
      const pooled = this.acquireFromPool()
      pooled.id = serverProj.id
      pooled.ownerId = serverProj.ownerId
      pooled.position.x = serverProj.position.x
      pooled.position.y = serverProj.position.y
      pooled.prevPosition.x = serverProj.position.x
      pooled.prevPosition.y = serverProj.position.y
      pooled.velocity.x = serverProj.velocity.x
      pooled.velocity.y = serverProj.velocity.y
      pooled.spawnTime = serverProj.spawnTime
      pooled.spawnPosition.x = serverProj.spawnPosition.x
      pooled.spawnPosition.y = serverProj.spawnPosition.y
      pooled.damage = serverProj.damage
      pooled.isPredicted = serverProj.isPredicted
      pooled.serverTimestamp = Date.now()
      this.projectiles.set(serverProj.id, pooled)
    }
  }

  /**
   * Merge external projectiles (e.g., bot projectiles) with local ones
   * Only adds/updates projectiles from the external source, doesn't remove local ones
   */
  mergeExternal(projectiles: Projectile[]): void {
    for (const proj of projectiles) {
      const existing = this.projectiles.get(proj.id)
      if (existing) {
        // Update existing - preserve prev position for interpolation
        existing.prevPosition.x = existing.position.x
        existing.prevPosition.y = existing.position.y
        existing.position.x = proj.position.x
        existing.position.y = proj.position.y
        existing.velocity.x = proj.velocity.x
        existing.velocity.y = proj.velocity.y
      } else {
        // Add new from pool
        const pooled = this.acquireFromPool()
        pooled.id = proj.id
        pooled.ownerId = proj.ownerId
        pooled.position.x = proj.position.x
        pooled.position.y = proj.position.y
        pooled.prevPosition.x = proj.position.x
        pooled.prevPosition.y = proj.position.y
        pooled.velocity.x = proj.velocity.x
        pooled.velocity.y = proj.velocity.y
        pooled.spawnTime = proj.spawnTime
        pooled.spawnPosition.x = proj.spawnPosition.x
        pooled.spawnPosition.y = proj.spawnPosition.y
        pooled.damage = proj.damage
        pooled.isPredicted = proj.isPredicted
        this.projectiles.set(proj.id, pooled)
      }
    }

    // Remove external projectiles that are no longer in the list
    const externalIds = new Set(projectiles.map(p => p.id))
    for (const [id, proj] of this.projectiles) {
      if (id.startsWith('bot-proj-') && !externalIds.has(id)) {
        this.releaseToPool(proj)
        this.projectiles.delete(id)
      }
    }
  }
}
