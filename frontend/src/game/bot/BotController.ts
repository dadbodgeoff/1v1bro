/**
 * BotController - Handles bot AI movement, shooting, and combat
 * Runs inside GameEngine's requestAnimationFrame loop for synchronized timing
 * Eliminates the duplicate setInterval loops that caused input lag
 */

import type { Vector2, Projectile } from '../types'
import { SIMPLE_ARENA } from '../config/maps'

// Bot behavior patterns
type BotBehavior = 'patrol' | 'chase' | 'evade' | 'strafe'

// Helper: Check if a line segment intersects a rectangle (for wall collision)
function lineIntersectsRect(
  x1: number, y1: number, x2: number, y2: number,
  rx: number, ry: number, rw: number, rh: number
): boolean {
  const left = rx
  const right = rx + rw
  const top = ry
  const bottom = ry + rh

  // Check if either endpoint is inside the rectangle
  if ((x1 >= left && x1 <= right && y1 >= top && y1 <= bottom) ||
      (x2 >= left && x2 <= right && y2 >= top && y2 <= bottom)) {
    return true
  }

  const dx = x2 - x1
  const dy = y2 - y1
  let tMin = 0
  let tMax = 1

  if (dx !== 0) {
    const tLeft = (left - x1) / dx
    const tRight = (right - x1) / dx
    const t1 = Math.min(tLeft, tRight)
    const t2 = Math.max(tLeft, tRight)
    tMin = Math.max(tMin, t1)
    tMax = Math.min(tMax, t2)
  } else if (x1 < left || x1 > right) {
    return false
  }

  if (dy !== 0) {
    const tTop = (top - y1) / dy
    const tBottom = (bottom - y1) / dy
    const t1 = Math.min(tTop, tBottom)
    const t2 = Math.max(tTop, tBottom)
    tMin = Math.max(tMin, t1)
    tMax = Math.min(tMax, t2)
  } else if (y1 < top || y1 > bottom) {
    return false
  }

  return tMax >= tMin && tMax >= 0 && tMin <= 1
}

// Check if there's a clear line of sight between two points
function hasLineOfSight(x1: number, y1: number, x2: number, y2: number): boolean {
  const barriers = SIMPLE_ARENA.barriers
  for (const barrier of barriers) {
    if (lineIntersectsRect(x1, y1, x2, y2, barrier.position.x, barrier.position.y, barrier.size.x, barrier.size.y)) {
      return false
    }
  }
  return true
}

// Check if a point is inside any wall barrier
function pointInWall(x: number, y: number): boolean {
  const barriers = SIMPLE_ARENA.barriers
  for (const barrier of barriers) {
    if (x >= barrier.position.x && x <= barrier.position.x + barrier.size.x &&
        y >= barrier.position.y && y <= barrier.position.y + barrier.size.y) {
      return true
    }
  }
  return false
}

// Bot configuration
export interface BotConfig {
  // Combat behavior
  shootCooldown: number      // ms between shots
  shootAccuracy: number      // 0-1, chance to aim at player vs random
  aggroRange: number         // Distance to start chasing
  retreatHealth: number      // Health % to start evading
  speed: number              // Movement speed
  projectileSpeed: number    // Projectile velocity
  projectileDamage: number   // Damage per hit
}

// Default moderate difficulty
export const DEFAULT_BOT_CONFIG: BotConfig = {
  shootCooldown: 1200, // Increased from 800ms to reduce spam
  shootAccuracy: 0.7,
  aggroRange: 400,
  retreatHealth: 30,
  speed: 120,
  projectileSpeed: 400,
  projectileDamage: 10,
}

// Patrol waypoints
const PATROL_POINTS: Vector2[] = [
  { x: 1000, y: 200 },
  { x: 1100, y: 500 },
  { x: 900, y: 360 },
  { x: 1050, y: 300 },
]

// Arena bounds
const BOUNDS = { minX: 100, maxX: 1180, minY: 100, maxY: 620 }

export interface BotState {
  position: Vector2
  health: number
  isAlive: boolean
}

export interface BotCallbacks {
  onPositionUpdate: (position: Vector2) => void
  onHealthUpdate: (health: number) => void
  onProjectileSpawned: (projectile: Projectile) => void
  onProjectileRemoved: (id: string) => void
  onBotDeath: () => void
  onPlayerHit: (damage: number) => void
}

export class BotController {
  private config: BotConfig
  private callbacks: Partial<BotCallbacks> = {}
  
  // Bot state
  private position: Vector2 = { x: 1050, y: 360 }
  private velocity: Vector2 = { x: 0, y: 0 }
  private health = 100
  private isAlive = true
  
  // AI state
  private behavior: BotBehavior = 'patrol'
  private patrolIndex = 0
  private lastBehaviorChange = 0
  private lastShot = 0
  private strafeDirection = 1
  
  // Projectiles managed by bot
  private projectiles: Map<string, Projectile> = new Map()
  private nextProjectileId = 0
  
  // Respawn state
  private respawnTimer = 0
  private readonly RESPAWN_DELAY = 1.5 // seconds

  constructor(config: Partial<BotConfig> = {}) {
    this.config = { ...DEFAULT_BOT_CONFIG, ...config }
  }

  setCallbacks(callbacks: Partial<BotCallbacks>): void {
    this.callbacks = callbacks
  }

  setConfig(config: Partial<BotConfig>): void {
    this.config = { ...this.config, ...config }
  }

  getState(): BotState {
    return {
      position: { ...this.position },
      health: this.health,
      isAlive: this.isAlive,
    }
  }

  getPosition(): Vector2 {
    return { ...this.position }
  }

  getHealth(): number {
    return this.health
  }

  getProjectiles(): Projectile[] {
    return Array.from(this.projectiles.values())
  }

  /**
   * Main update - call from GameEngine's update loop
   */
  update(deltaTime: number, playerPosition: Vector2): void {
    // Handle respawn timer
    if (!this.isAlive) {
      this.respawnTimer -= deltaTime
      if (this.respawnTimer <= 0) {
        this.respawn()
      }
      return
    }

    const now = Date.now()
    
    // Update AI behavior
    this.updateBehavior(now, playerPosition)
    
    // Update movement
    this.updateMovement(deltaTime, playerPosition)
    
    // Update shooting
    this.updateShooting(now, playerPosition)
    
    // Update projectiles
    this.updateProjectiles(deltaTime, playerPosition)
  }

  private updateBehavior(now: number, playerPosition: Vector2): void {
    const distToPlayer = this.distanceTo(playerPosition)
    
    // Change behavior periodically
    if (now - this.lastBehaviorChange > 2000 + Math.random() * 1500) {
      if (this.health < this.config.retreatHealth) {
        this.behavior = 'evade'
      } else if (distToPlayer < this.config.aggroRange) {
        this.behavior = Math.random() < 0.6 ? 'strafe' : 'chase'
      } else {
        const behaviors: BotBehavior[] = ['patrol', 'chase', 'strafe']
        this.behavior = behaviors[Math.floor(Math.random() * behaviors.length)]
      }
      this.lastBehaviorChange = now
    }
  }

  private updateMovement(deltaTime: number, playerPosition: Vector2): void {
    const dx = playerPosition.x - this.position.x
    const dy = playerPosition.y - this.position.y
    const distToPlayer = Math.sqrt(dx * dx + dy * dy)

    switch (this.behavior) {
      case 'patrol': {
        const target = PATROL_POINTS[this.patrolIndex]
        const pdx = target.x - this.position.x
        const pdy = target.y - this.position.y
        const dist = Math.sqrt(pdx * pdx + pdy * pdy)

        if (dist < 20) {
          this.patrolIndex = (this.patrolIndex + 1) % PATROL_POINTS.length
        } else {
          this.velocity.x = (pdx / dist) * this.config.speed
          this.velocity.y = (pdy / dist) * this.config.speed
        }
        break
      }

      case 'chase': {
        if (distToPlayer > 150) {
          this.velocity.x = (dx / distToPlayer) * this.config.speed
          this.velocity.y = (dy / distToPlayer) * this.config.speed
        } else {
          this.velocity.x *= 0.85
          this.velocity.y *= 0.85
        }
        break
      }

      case 'strafe': {
        if (distToPlayer > 100 && distToPlayer < 350) {
          const perpX = -dy / distToPlayer
          const perpY = dx / distToPlayer
          this.velocity.x = perpX * this.config.speed * this.strafeDirection
          this.velocity.y = perpY * this.config.speed * this.strafeDirection
          
          if (Math.random() < 0.02) {
            this.strafeDirection *= -1
          }
        } else if (distToPlayer <= 100) {
          this.velocity.x = -(dx / distToPlayer) * this.config.speed * 0.5
          this.velocity.y = -(dy / distToPlayer) * this.config.speed * 0.5
        } else {
          this.velocity.x = (dx / distToPlayer) * this.config.speed * 0.7
          this.velocity.y = (dy / distToPlayer) * this.config.speed * 0.7
        }
        break
      }

      case 'evade': {
        if (distToPlayer < 400) {
          this.velocity.x = -(dx / distToPlayer) * this.config.speed
          this.velocity.y = -(dy / distToPlayer) * this.config.speed
        } else {
          this.behavior = 'patrol'
        }
        break
      }
    }

    // Apply velocity
    this.position.x += this.velocity.x * deltaTime
    this.position.y += this.velocity.y * deltaTime

    // Clamp to bounds
    this.position.x = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, this.position.x))
    this.position.y = Math.max(BOUNDS.minY, Math.min(BOUNDS.maxY, this.position.y))

    this.callbacks.onPositionUpdate?.(this.position)
  }

  private updateShooting(now: number, playerPosition: Vector2): void {
    const distToPlayer = this.distanceTo(playerPosition)
    
    // Only shoot if in range, cooldown elapsed, AND has line of sight
    if (distToPlayer < 500 && now - this.lastShot > this.config.shootCooldown) {
      // Check line of sight - don't shoot through walls
      if (!hasLineOfSight(this.position.x, this.position.y, playerPosition.x, playerPosition.y)) {
        return
      }
      
      this.lastShot = now
      
      let dx = playerPosition.x - this.position.x
      let dy = playerPosition.y - this.position.y
      
      // Add inaccuracy
      if (Math.random() > this.config.shootAccuracy) {
        const spread = 0.3
        dx += (Math.random() - 0.5) * distToPlayer * spread
        dy += (Math.random() - 0.5) * distToPlayer * spread
      }
      
      const dist = Math.sqrt(dx * dx + dy * dy)
      const id = `bot-proj-${this.nextProjectileId++}`
      
      const projectile: Projectile = {
        id,
        ownerId: 'bot',
        position: { ...this.position },
        velocity: {
          x: (dx / dist) * this.config.projectileSpeed,
          y: (dy / dist) * this.config.projectileSpeed,
        },
        spawnTime: now,
        spawnPosition: { ...this.position },
        damage: this.config.projectileDamage,
        isPredicted: false,
      }
      
      this.projectiles.set(id, projectile)
      this.callbacks.onProjectileSpawned?.(projectile)
    }
  }

  private updateProjectiles(deltaTime: number, playerPosition: Vector2): void {
    const toRemove: string[] = []
    
    for (const [id, proj] of this.projectiles) {
      // Move projectile
      proj.position.x += proj.velocity.x * deltaTime
      proj.position.y += proj.velocity.y * deltaTime
      
      // Check bounds
      if (proj.position.x < 0 || proj.position.x > 1280 ||
          proj.position.y < 0 || proj.position.y > 720) {
        toRemove.push(id)
        continue
      }
      
      // Check wall collision - destroy projectile if it hits a wall
      if (pointInWall(proj.position.x, proj.position.y)) {
        toRemove.push(id)
        continue
      }
      
      // Check player collision
      const dx = proj.position.x - playerPosition.x
      const dy = proj.position.y - playerPosition.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      if (dist < 30) {
        toRemove.push(id)
        this.callbacks.onPlayerHit?.(proj.damage)
      }
    }
    
    for (const id of toRemove) {
      this.projectiles.delete(id)
      this.callbacks.onProjectileRemoved?.(id)
    }
  }

  /**
   * Apply damage to bot
   */
  applyDamage(damage: number): void {
    if (!this.isAlive) return
    
    this.health = Math.max(0, this.health - damage)
    this.callbacks.onHealthUpdate?.(this.health)
    
    if (this.health <= 0) {
      this.die()
    }
  }

  private die(): void {
    this.isAlive = false
    this.respawnTimer = this.RESPAWN_DELAY
    this.callbacks.onBotDeath?.()
  }

  private respawn(): void {
    // Respawn at random patrol point
    const spawnPoint = PATROL_POINTS[Math.floor(Math.random() * PATROL_POINTS.length)]
    this.position = { ...spawnPoint }
    this.health = 100
    this.isAlive = true
    this.behavior = 'patrol'
    
    this.callbacks.onPositionUpdate?.(this.position)
    this.callbacks.onHealthUpdate?.(this.health)
  }

  /**
   * Reset bot to initial state
   */
  reset(): void {
    this.position = { x: 1050, y: 360 }
    this.velocity = { x: 0, y: 0 }
    this.health = 100
    this.isAlive = true
    this.behavior = 'patrol'
    this.patrolIndex = 0
    this.lastBehaviorChange = 0
    this.lastShot = 0
    this.strafeDirection = 1
    this.projectiles.clear()
    this.respawnTimer = 0
  }

  private distanceTo(target: Vector2): number {
    const dx = target.x - this.position.x
    const dy = target.y - this.position.y
    return Math.sqrt(dx * dx + dy * dy)
  }
}
