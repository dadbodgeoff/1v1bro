import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { RespawnManager } from './RespawnManager'
import { RESPAWN_CONFIG } from '../config'

describe('RespawnManager', () => {
  let manager: RespawnManager

  beforeEach(() => {
    manager = new RespawnManager()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('startRespawn', () => {
    it('returns a spawn position', () => {
      const position = manager.startRespawn('player1', null)

      expect(position).toHaveProperty('x')
      expect(position).toHaveProperty('y')
    })

    it('selects spawn point furthest from enemy', () => {
      // Enemy at player1 spawn (left side)
      const enemyPos = { x: 160, y: 360 }
      const position = manager.startRespawn('player1', enemyPos)

      // Should spawn on opposite side (right side is further)
      expect(position.x).toBeGreaterThan(640) // Right half of arena
    })

    it('marks player as respawning', () => {
      manager.startRespawn('player1', null)
      expect(manager.isRespawning('player1')).toBe(true)
    })

    it('stores spawn position for later retrieval', () => {
      const position = manager.startRespawn('player1', null)
      expect(manager.getSpawnPosition('player1')).toEqual(position)
    })
  })

  describe('isRespawning', () => {
    it('returns false for player not respawning', () => {
      expect(manager.isRespawning('player1')).toBe(false)
    })

    it('returns true for player currently respawning', () => {
      manager.startRespawn('player1', null)
      expect(manager.isRespawning('player1')).toBe(true)
    })

    it('returns false after respawn completed', () => {
      manager.startRespawn('player1', null)
      vi.advanceTimersByTime(RESPAWN_CONFIG.respawnDelay)
      manager.completeRespawn('player1')

      expect(manager.isRespawning('player1')).toBe(false)
    })
  })

  describe('getRespawnTimeRemaining', () => {
    it('returns 0 for player not respawning', () => {
      expect(manager.getRespawnTimeRemaining('player1')).toBe(0)
    })

    it('returns full delay immediately after death', () => {
      manager.startRespawn('player1', null)
      expect(manager.getRespawnTimeRemaining('player1')).toBe(RESPAWN_CONFIG.respawnDelay)
    })

    it('returns remaining time during respawn', () => {
      manager.startRespawn('player1', null)
      vi.advanceTimersByTime(1000)

      expect(manager.getRespawnTimeRemaining('player1')).toBe(RESPAWN_CONFIG.respawnDelay - 1000)
    })

    it('returns 0 after respawn delay elapsed', () => {
      manager.startRespawn('player1', null)
      vi.advanceTimersByTime(RESPAWN_CONFIG.respawnDelay + 100)

      expect(manager.getRespawnTimeRemaining('player1')).toBe(0)
    })
  })

  describe('getSpawnPosition', () => {
    it('returns null for player not respawning', () => {
      expect(manager.getSpawnPosition('player1')).toBeNull()
    })

    it('returns spawn position for respawning player', () => {
      const position = manager.startRespawn('player1', null)
      expect(manager.getSpawnPosition('player1')).toEqual(position)
    })
  })

  describe('isRespawnReady', () => {
    it('returns false for player not respawning', () => {
      expect(manager.isRespawnReady('player1')).toBe(false)
    })

    it('returns false during respawn delay', () => {
      manager.startRespawn('player1', null)
      vi.advanceTimersByTime(RESPAWN_CONFIG.respawnDelay - 100)

      expect(manager.isRespawnReady('player1')).toBe(false)
    })

    it('returns true after respawn delay', () => {
      manager.startRespawn('player1', null)
      vi.advanceTimersByTime(RESPAWN_CONFIG.respawnDelay)

      expect(manager.isRespawnReady('player1')).toBe(true)
    })
  })

  describe('completeRespawn', () => {
    it('returns spawn position and removes timer', () => {
      const startPos = manager.startRespawn('player1', null)
      vi.advanceTimersByTime(RESPAWN_CONFIG.respawnDelay)

      const completePos = manager.completeRespawn('player1')

      expect(completePos).toEqual(startPos)
      expect(manager.isRespawning('player1')).toBe(false)
    })

    it('returns null for player not respawning', () => {
      expect(manager.completeRespawn('player1')).toBeNull()
    })
  })

  describe('cancelRespawn', () => {
    it('removes respawn timer', () => {
      manager.startRespawn('player1', null)
      manager.cancelRespawn('player1')

      expect(manager.isRespawning('player1')).toBe(false)
    })
  })

  describe('reset', () => {
    it('clears all respawn timers', () => {
      manager.startRespawn('player1', null)
      manager.startRespawn('player2', null)
      manager.reset()

      expect(manager.isRespawning('player1')).toBe(false)
      expect(manager.isRespawning('player2')).toBe(false)
    })
  })

  describe('spawn point selection', () => {
    it('respects minimum spawn distance', () => {
      // Enemy in center
      const enemyPos = { x: 640, y: 360 }
      const position = manager.startRespawn('player1', enemyPos)

      // Calculate distance from enemy
      const dx = position.x - enemyPos.x
      const dy = position.y - enemyPos.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      expect(distance).toBeGreaterThanOrEqual(RESPAWN_CONFIG.minSpawnDistance)
    })

    it('selects random spawn when no enemy', () => {
      // Without enemy, should pick from available spawn points
      const position = manager.startRespawn('player1', null)

      // Should be one of the configured spawn points
      const isValidSpawn = RESPAWN_CONFIG.spawnPoints.some(
        (sp) => sp.x === position.x && sp.y === position.y
      )
      expect(isValidSpawn).toBe(true)
    })
  })
})
