import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { HealthManager } from './HealthManager'
import { HEALTH_CONFIG } from '../config'

describe('HealthManager', () => {
  let manager: HealthManager

  beforeEach(() => {
    manager = new HealthManager()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initPlayer', () => {
    it('initializes player with full health', () => {
      manager.initPlayer('player1')
      const state = manager.getState('player1')

      expect(state?.current).toBe(HEALTH_CONFIG.maxHealth)
      expect(state?.max).toBe(HEALTH_CONFIG.maxHealth)
      expect(state?.shield).toBe(0)
      expect(state?.isInvulnerable).toBe(false)
    })

    it('can initialize multiple players', () => {
      manager.initPlayer('player1')
      manager.initPlayer('player2')

      expect(manager.getState('player1')).not.toBeNull()
      expect(manager.getState('player2')).not.toBeNull()
    })
  })

  describe('applyDamage', () => {
    beforeEach(() => {
      manager.initPlayer('player1')
    })

    it('reduces health by damage amount', () => {
      const dealt = manager.applyDamage('player1', 25)

      expect(dealt).toBe(25)
      expect(manager.getState('player1')?.current).toBe(HEALTH_CONFIG.maxHealth - 25)
    })

    it('does not reduce health below 0', () => {
      manager.applyDamage('player1', 200) // More than max health

      expect(manager.getState('player1')?.current).toBe(0)
    })

    it('returns 0 for non-existent player', () => {
      const dealt = manager.applyDamage('unknown', 25)
      expect(dealt).toBe(0)
    })

    it('shield absorbs damage first', () => {
      manager.addShield('player1', 30)
      const dealt = manager.applyDamage('player1', 50)

      // 30 absorbed by shield, 20 to health
      expect(dealt).toBe(20)
      expect(manager.getState('player1')?.shield).toBe(0)
      expect(manager.getState('player1')?.current).toBe(HEALTH_CONFIG.maxHealth - 20)
    })

    it('shield fully absorbs small damage', () => {
      manager.addShield('player1', HEALTH_CONFIG.maxShield)
      const dealt = manager.applyDamage('player1', 25)

      expect(dealt).toBe(0) // No health damage
      expect(manager.getState('player1')?.shield).toBe(HEALTH_CONFIG.maxShield - 25)
      expect(manager.getState('player1')?.current).toBe(HEALTH_CONFIG.maxHealth)
    })

    it('does not apply damage during invulnerability', () => {
      manager.respawn('player1') // Grants invulnerability
      const dealt = manager.applyDamage('player1', 50)

      expect(dealt).toBe(0)
      expect(manager.getState('player1')?.current).toBe(HEALTH_CONFIG.maxHealth)
    })

    it('updates lastDamageTime', () => {
      const before = Date.now()
      manager.applyDamage('player1', 25)
      const state = manager.getState('player1')

      expect(state?.lastDamageTime).toBeGreaterThanOrEqual(before)
    })
  })

  describe('isAlive', () => {
    it('returns true for player with health', () => {
      manager.initPlayer('player1')
      expect(manager.isAlive('player1')).toBe(true)
    })

    it('returns false for player with 0 health', () => {
      manager.initPlayer('player1')
      manager.applyDamage('player1', HEALTH_CONFIG.maxHealth)
      expect(manager.isAlive('player1')).toBe(false)
    })

    it('returns false for non-existent player', () => {
      expect(manager.isAlive('unknown')).toBe(false)
    })
  })

  describe('isInvulnerable', () => {
    beforeEach(() => {
      manager.initPlayer('player1')
    })

    it('returns false initially', () => {
      expect(manager.isInvulnerable('player1')).toBe(false)
    })

    it('returns true after respawn', () => {
      manager.respawn('player1')
      expect(manager.isInvulnerable('player1')).toBe(true)
    })

    it('returns false after invulnerability expires', () => {
      manager.respawn('player1')
      vi.advanceTimersByTime(HEALTH_CONFIG.invulnerabilityDuration + 1)
      expect(manager.isInvulnerable('player1')).toBe(false)
    })
  })

  describe('respawn', () => {
    beforeEach(() => {
      manager.initPlayer('player1')
    })

    it('restores full health', () => {
      manager.applyDamage('player1', 50)
      manager.respawn('player1')

      expect(manager.getState('player1')?.current).toBe(HEALTH_CONFIG.maxHealth)
    })

    it('clears shield', () => {
      manager.addShield('player1', 30)
      manager.respawn('player1')

      expect(manager.getState('player1')?.shield).toBe(0)
    })

    it('grants invulnerability', () => {
      manager.respawn('player1')

      expect(manager.isInvulnerable('player1')).toBe(true)
    })
  })

  describe('addShield', () => {
    beforeEach(() => {
      manager.initPlayer('player1')
    })

    it('adds shield amount', () => {
      manager.addShield('player1', 30)
      expect(manager.getState('player1')?.shield).toBe(30)
    })

    it('caps shield at max', () => {
      manager.addShield('player1', 100) // More than max
      expect(manager.getState('player1')?.shield).toBe(HEALTH_CONFIG.maxShield)
    })

    it('stacks shield up to max', () => {
      manager.addShield('player1', 20)
      manager.addShield('player1', 20)
      // Should cap at maxShield (35), not 40
      expect(manager.getState('player1')?.shield).toBe(HEALTH_CONFIG.maxShield)
    })
  })

  describe('setHealth', () => {
    beforeEach(() => {
      manager.initPlayer('player1')
    })

    it('sets health to specified value', () => {
      manager.setHealth('player1', 50)
      expect(manager.getState('player1')?.current).toBe(50)
    })

    it('clamps health to valid range', () => {
      manager.setHealth('player1', -10)
      expect(manager.getState('player1')?.current).toBe(0)

      manager.setHealth('player1', 200)
      expect(manager.getState('player1')?.current).toBe(HEALTH_CONFIG.maxHealth)
    })
  })

  describe('getHealthPercent', () => {
    beforeEach(() => {
      manager.initPlayer('player1')
    })

    it('returns 1 at full health', () => {
      expect(manager.getHealthPercent('player1')).toBe(1)
    })

    it('returns 0.5 at half health', () => {
      manager.setHealth('player1', HEALTH_CONFIG.maxHealth / 2)
      expect(manager.getHealthPercent('player1')).toBe(0.5)
    })

    it('returns 0 at zero health', () => {
      manager.setHealth('player1', 0)
      expect(manager.getHealthPercent('player1')).toBe(0)
    })
  })

  describe('wasRecentlyDamaged', () => {
    beforeEach(() => {
      manager.initPlayer('player1')
    })

    it('returns false initially', () => {
      expect(manager.wasRecentlyDamaged('player1')).toBe(false)
    })

    it('returns true immediately after damage', () => {
      manager.applyDamage('player1', 25)
      expect(manager.wasRecentlyDamaged('player1')).toBe(true)
    })

    it('returns false after flash duration', () => {
      manager.applyDamage('player1', 25)
      vi.advanceTimersByTime(HEALTH_CONFIG.damageFlashDuration + 1)
      expect(manager.wasRecentlyDamaged('player1')).toBe(false)
    })
  })

  describe('removePlayer', () => {
    it('removes player from tracking', () => {
      manager.initPlayer('player1')
      manager.removePlayer('player1')

      expect(manager.getState('player1')).toBeNull()
    })
  })

  describe('reset', () => {
    it('clears all player states', () => {
      manager.initPlayer('player1')
      manager.initPlayer('player2')
      manager.reset()

      expect(manager.getState('player1')).toBeNull()
      expect(manager.getState('player2')).toBeNull()
    })
  })
})
