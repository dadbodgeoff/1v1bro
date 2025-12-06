import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ProjectileManager } from './ProjectileManager'
import { WEAPON_CONFIG } from '../config'

describe('ProjectileManager', () => {
  let manager: ProjectileManager

  beforeEach(() => {
    manager = new ProjectileManager()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('spawnProjectile', () => {
    it('creates a projectile with correct properties', () => {
      const projectile = manager.spawnProjectile(
        'player1',
        { x: 100, y: 200 },
        { x: 1, y: 0 },
        true
      )

      expect(projectile.ownerId).toBe('player1')
      expect(projectile.position).toEqual({ x: 100, y: 200 })
      expect(projectile.damage).toBe(WEAPON_CONFIG.damage)
      expect(projectile.isPredicted).toBe(true)
    })

    it('normalizes direction vector', () => {
      const projectile = manager.spawnProjectile(
        'player1',
        { x: 0, y: 0 },
        { x: 3, y: 4 }, // Length 5, should normalize to 0.6, 0.8
        false
      )

      const speed = WEAPON_CONFIG.projectileSpeed
      expect(projectile.velocity.x).toBeCloseTo(0.6 * speed, 5)
      expect(projectile.velocity.y).toBeCloseTo(0.8 * speed, 5)
    })

    it('handles zero direction vector', () => {
      const projectile = manager.spawnProjectile(
        'player1',
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        false
      )

      // Should default to right direction
      expect(projectile.velocity.x).toBe(WEAPON_CONFIG.projectileSpeed)
      expect(projectile.velocity.y).toBe(0)
    })

    it('generates unique IDs', () => {
      const p1 = manager.spawnProjectile('player1', { x: 0, y: 0 }, { x: 1, y: 0 }, false)
      const p2 = manager.spawnProjectile('player1', { x: 0, y: 0 }, { x: 1, y: 0 }, false)

      expect(p1.id).not.toBe(p2.id)
    })

    it('stores spawn position for range calculation', () => {
      const projectile = manager.spawnProjectile(
        'player1',
        { x: 100, y: 200 },
        { x: 1, y: 0 },
        false
      )

      expect(projectile.spawnPosition).toEqual({ x: 100, y: 200 })
    })
  })

  describe('update', () => {
    it('moves projectiles based on velocity', () => {
      const projectile = manager.spawnProjectile(
        'player1',
        { x: 100, y: 100 },
        { x: 1, y: 0 },
        false
      )

      manager.update(0.1) // 100ms

      const updated = manager.getProjectile(projectile.id)
      expect(updated?.position.x).toBeCloseTo(100 + WEAPON_CONFIG.projectileSpeed * 0.1, 1)
      expect(updated?.position.y).toBe(100)
    })

    it('destroys projectiles that exceed max range', () => {
      manager.spawnProjectile('player1', { x: 100, y: 100 }, { x: 1, y: 0 }, false)

      // Move beyond max range
      const timeToMaxRange = WEAPON_CONFIG.maxRange / WEAPON_CONFIG.projectileSpeed + 0.1
      manager.update(timeToMaxRange)

      expect(manager.getCount()).toBe(0)
    })

    it('destroys projectiles that hit barriers', () => {
      // Spawn projectile heading toward a barrier
      // Barriers are at specific positions in arena config
      manager.spawnProjectile('player1', { x: 400, y: 200 }, { x: 0, y: 1 }, false)

      // Update until it would hit barrier area
      manager.update(1) // Move 600 units down

      // Should be destroyed (either by barrier or bounds)
      expect(manager.getCount()).toBe(0)
    })

    it('destroys projectiles that go out of bounds', () => {
      // Spawn near edge heading out
      manager.spawnProjectile('player1', { x: 50, y: 100 }, { x: -1, y: 0 }, false)

      manager.update(0.5) // Should go past x=0

      expect(manager.getCount()).toBe(0)
    })
  })

  describe('destroyProjectile', () => {
    it('removes specific projectile', () => {
      const p1 = manager.spawnProjectile('player1', { x: 0, y: 0 }, { x: 1, y: 0 }, false)
      const p2 = manager.spawnProjectile('player1', { x: 0, y: 0 }, { x: 1, y: 0 }, false)

      manager.destroyProjectile(p1.id)

      expect(manager.getProjectile(p1.id)).toBeUndefined()
      expect(manager.getProjectile(p2.id)).toBeDefined()
    })
  })

  describe('getProjectiles', () => {
    it('returns all active projectiles', () => {
      manager.spawnProjectile('player1', { x: 0, y: 0 }, { x: 1, y: 0 }, false)
      manager.spawnProjectile('player2', { x: 100, y: 0 }, { x: -1, y: 0 }, false)

      const projectiles = manager.getProjectiles()
      expect(projectiles).toHaveLength(2)
    })

    it('returns empty array when no projectiles', () => {
      expect(manager.getProjectiles()).toEqual([])
    })
  })

  describe('clear', () => {
    it('removes all projectiles', () => {
      manager.spawnProjectile('player1', { x: 0, y: 0 }, { x: 1, y: 0 }, false)
      manager.spawnProjectile('player2', { x: 100, y: 0 }, { x: -1, y: 0 }, false)

      manager.clear()

      expect(manager.getCount()).toBe(0)
    })
  })

  describe('getCount', () => {
    it('returns correct count', () => {
      expect(manager.getCount()).toBe(0)

      manager.spawnProjectile('player1', { x: 0, y: 0 }, { x: 1, y: 0 }, false)
      expect(manager.getCount()).toBe(1)

      manager.spawnProjectile('player1', { x: 0, y: 0 }, { x: 1, y: 0 }, false)
      expect(manager.getCount()).toBe(2)
    })
  })
})
