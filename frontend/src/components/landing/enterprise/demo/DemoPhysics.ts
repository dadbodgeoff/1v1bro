/**
 * DemoPhysics - Physics and collision for demo game
 * 
 * Handles player movement, projectile updates, and collision detection
 * 
 * @module landing/enterprise/demo/DemoPhysics
 */

import type { DemoPlayerState, DemoProjectile } from './types'

export interface DemoArenaConfig {
  width: number
  height: number
  playerRadius: number
  projectileRadius: number
  projectileSpeed: number
}

export const DEMO_ARENA: DemoArenaConfig = {
  width: 800,
  height: 450,
  playerRadius: 16,
  projectileRadius: 6,
  projectileSpeed: 400,
}

/**
 * Create initial player state
 */
export function createPlayer(id: string, x: number, y: number, color: string): DemoPlayerState {
  return {
    id,
    position: { x, y },
    velocity: { x: 0, y: 0 },
    health: 100,
    maxHealth: 100,
    score: 0,
    color,
    isAlive: true,
    facingRight: id === 'player1',
  }
}

/**
 * Update player physics
 */
export function updatePlayer(player: DemoPlayerState, dt: number, arena: DemoArenaConfig): void {
  // Apply velocity
  player.position.x += player.velocity.x * dt
  player.position.y += player.velocity.y * dt

  // Friction
  player.velocity.x *= 0.95
  player.velocity.y *= 0.95

  // Bounds
  const r = arena.playerRadius
  player.position.x = Math.max(r, Math.min(arena.width - r, player.position.x))
  player.position.y = Math.max(r, Math.min(arena.height - r, player.position.y))
}

/**
 * Fire a projectile from one player toward another
 */
export function fireProjectile(
  from: DemoPlayerState,
  to: DemoPlayerState,
  accuracy: number,
  arena: DemoArenaConfig
): DemoProjectile {
  const dx = to.position.x - from.position.x
  const dy = to.position.y - from.position.y
  
  // Add some inaccuracy
  const wobble = (1 - accuracy) * 0.3
  const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * wobble

  return {
    id: `proj_${Date.now()}_${Math.random()}`,
    position: { x: from.position.x, y: from.position.y },
    velocity: {
      x: Math.cos(angle) * arena.projectileSpeed,
      y: Math.sin(angle) * arena.projectileSpeed,
    },
    ownerId: from.id,
    color: from.color,
  }
}

export interface ProjectileHitResult {
  hit: boolean
  targetId: string
  damage: number
}

/**
 * Update projectiles and check collisions
 */
export function updateProjectiles(
  projectiles: DemoProjectile[],
  player1: DemoPlayerState,
  player2: DemoPlayerState,
  dt: number,
  arena: DemoArenaConfig,
  onHit: (result: ProjectileHitResult, projectile: DemoProjectile) => void
): DemoProjectile[] {
  const remaining: DemoProjectile[] = []

  for (const proj of projectiles) {
    // Move
    proj.position.x += proj.velocity.x * dt
    proj.position.y += proj.velocity.y * dt

    // Check bounds
    if (proj.position.x < 0 || proj.position.x > arena.width ||
        proj.position.y < 0 || proj.position.y > arena.height) {
      continue // Remove projectile
    }

    // Check collision with players
    const target = proj.ownerId === 'player1' ? player2 : player1
    const dx = proj.position.x - target.position.x
    const dy = proj.position.y - target.position.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < arena.playerRadius + arena.projectileRadius) {
      // Hit!
      onHit({ hit: true, targetId: target.id, damage: 15 }, proj)
      continue // Remove projectile
    }

    remaining.push(proj)
  }

  return remaining
}

/**
 * Apply damage to a player
 */
export function applyDamage(player: DemoPlayerState, damage: number): boolean {
  player.health = Math.max(0, player.health - damage)
  if (player.health <= 0) {
    player.isAlive = false
    return true // Player died
  }
  return false
}

/**
 * Respawn a player
 */
export function respawnPlayer(player: DemoPlayerState, arena: DemoArenaConfig): void {
  player.health = player.maxHealth
  player.isAlive = true
  player.position = {
    x: player.id === 'player1' ? 150 : arena.width - 150,
    y: arena.height / 2,
  }
}
