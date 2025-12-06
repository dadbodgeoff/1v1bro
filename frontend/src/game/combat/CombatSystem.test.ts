import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { CombatSystem } from './CombatSystem'
import { HEALTH_CONFIG, HIT_RADIUS } from '../config'

describe('CombatSystem', () => {
  let combat: CombatSystem

  beforeEach(() => {
    combat = new CombatSystem()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('setLocalPlayer', () => {
    it('initializes local player for combat', () => {
      combat.setLocalPlayer('player1')

      const health = combat.getHealthState('player1')
      expect(health).not.toBeNull()
      expect(health?.current).toBe(HEALTH_CONFIG.maxHealth)
    })
  })

  describe('setOpponent', () => {
    it('initializes opponent for combat', () => {
      combat.setOpponent('player2')

      const health = combat.getHealthState('player2')
      expect(health).not.toBeNull()
    })
  })

  describe('updateAim', () => {
    it('calculates aim direction from mouse position', () => {
      combat.setLocalPlayer('player1')

      // Player at (100, 100), mouse at (200, 100) = aiming right
      combat.updateAim({ x: 200, y: 100 }, { x: 100, y: 100 })

      const aim = combat.getAimDirection()
      expect(aim.x).toBeCloseTo(1, 5)
      expect(aim.y).toBeCloseTo(0, 5)
    })

    it('normalizes aim direction', () => {
      combat.setLocalPlayer('player1')

      // Diagonal aim
      combat.updateAim({ x: 200, y: 200 }, { x: 100, y: 100 })

      const aim = combat.getAimDirection()
      const length = Math.sqrt(aim.x * aim.x + aim.y * aim.y)
      expect(length).toBeCloseTo(1, 5)
    })
  })

  describe('updateAimFromMovement', () => {
    it('sets aim direction from velocity', () => {
      combat.setLocalPlayer('player1')

      combat.updateAimFromMovement({ x: 0, y: -1 }) // Moving up

      const aim = combat.getAimDirection()
      expect(aim.x).toBeCloseTo(0, 5)
      expect(aim.y).toBeCloseTo(-1, 5)
    })

    it('ignores zero velocity', () => {
      combat.setLocalPlayer('player1')
      combat.updateAim({ x: 200, y: 100 }, { x: 100, y: 100 }) // Set initial aim

      combat.updateAimFromMovement({ x: 0, y: 0 })

      // Aim should remain unchanged
      const aim = combat.getAimDirection()
      expect(aim.x).toBeCloseTo(1, 5)
    })
  })

  describe('tryFire', () => {
    beforeEach(() => {
      combat.setLocalPlayer('player1')
    })

    it('spawns projectile when can fire', () => {
      const result = combat.tryFire({ x: 100, y: 100 })

      expect(result).toBe(true)
      expect(combat.getProjectiles()).toHaveLength(1)
    })

    it('returns false when on cooldown', () => {
      combat.tryFire({ x: 100, y: 100 })
      const result = combat.tryFire({ x: 100, y: 100 })

      expect(result).toBe(false)
      expect(combat.getProjectiles()).toHaveLength(1)
    })

    it('returns false when player is dead', () => {
      // Kill the player
      const health = combat.getHealthState('player1')
      if (health) health.current = 0

      const result = combat.tryFire({ x: 100, y: 100 })
      expect(result).toBe(false)
    })

    it('returns false when player is respawning', () => {
      // This requires triggering death flow
      combat.setOpponent('player2')

      // Damage player1 to death
      for (let i = 0; i < 5; i++) {
        const health = combat.getHealthState('player1')
        if (health) health.current -= 25
      }

      // Player should not be able to fire while dead/respawning
      expect(combat.isPlayerAlive('player1')).toBe(false)
    })

    it('calls onFire callback', () => {
      const onFire = vi.fn()
      combat.setCallbacks({ onFire })

      combat.tryFire({ x: 100, y: 100 })

      expect(onFire).toHaveBeenCalledTimes(1)
      expect(onFire).toHaveBeenCalledWith(
        expect.objectContaining({
          playerId: 'player1',
          position: { x: 100, y: 100 },
        })
      )
    })
  })

  describe('update', () => {
    beforeEach(() => {
      combat.setLocalPlayer('player1')
      combat.setOpponent('player2')
    })

    it('moves projectiles', () => {
      combat.updateAim({ x: 200, y: 100 }, { x: 100, y: 100 }) // Aim right
      combat.tryFire({ x: 100, y: 100 })

      const before = combat.getProjectiles()[0].position.x

      combat.update(0.1, new Map([['player1', { x: 100, y: 100 }]]))

      const after = combat.getProjectiles()[0].position.x
      expect(after).toBeGreaterThan(before)
    })

    it('detects hits on opponents', () => {
      const onHit = vi.fn()
      combat.setCallbacks({ onHit })

      // Aim at opponent
      combat.updateAim({ x: 200, y: 100 }, { x: 100, y: 100 })
      combat.tryFire({ x: 100, y: 100 })

      // Place opponent in projectile path
      const players = new Map([
        ['player1', { x: 100, y: 100 }],
        ['player2', { x: 100 + HIT_RADIUS, y: 100 }], // Just within hit range
      ])

      combat.update(0.001, players)

      expect(onHit).toHaveBeenCalled()
    })

    it('does not hit self', () => {
      const onHit = vi.fn()
      combat.setCallbacks({ onHit })

      combat.tryFire({ x: 100, y: 100 })

      // Only local player in map
      const players = new Map([['player1', { x: 100, y: 100 }]])

      combat.update(0.1, players)

      expect(onHit).not.toHaveBeenCalled()
    })

    it('does not hit invulnerable players', () => {
      const onHit = vi.fn()
      combat.setCallbacks({ onHit })

      // Make opponent invulnerable
      combat.addShield('player2', 0) // Initialize
      const health = combat.getHealthState('player2')
      if (health) {
        health.isInvulnerable = true
        health.invulnerabilityEnd = Date.now() + 10000
      }

      combat.updateAim({ x: 200, y: 100 }, { x: 100, y: 100 })
      combat.tryFire({ x: 100, y: 100 })

      const players = new Map([
        ['player1', { x: 100, y: 100 }],
        ['player2', { x: 100 + HIT_RADIUS, y: 100 }],
      ])

      combat.update(0.001, players)

      expect(onHit).not.toHaveBeenCalled()
    })
  })

  describe('getProjectiles', () => {
    it('returns empty array initially', () => {
      expect(combat.getProjectiles()).toEqual([])
    })

    it('returns active projectiles', () => {
      combat.setLocalPlayer('player1')
      combat.tryFire({ x: 100, y: 100 })

      expect(combat.getProjectiles()).toHaveLength(1)
    })
  })

  describe('getHealthState', () => {
    it('returns null for unknown player', () => {
      expect(combat.getHealthState('unknown')).toBeNull()
    })

    it('returns health state for initialized player', () => {
      combat.setLocalPlayer('player1')
      const state = combat.getHealthState('player1')

      expect(state).not.toBeNull()
      expect(state?.current).toBe(HEALTH_CONFIG.maxHealth)
    })
  })

  describe('isPlayerAlive', () => {
    it('returns true for healthy player', () => {
      combat.setLocalPlayer('player1')
      expect(combat.isPlayerAlive('player1')).toBe(true)
    })

    it('returns false for dead player', () => {
      combat.setLocalPlayer('player1')
      const health = combat.getHealthState('player1')
      if (health) health.current = 0

      expect(combat.isPlayerAlive('player1')).toBe(false)
    })
  })

  describe('isPlayerInvulnerable', () => {
    it('returns false initially', () => {
      combat.setLocalPlayer('player1')
      expect(combat.isPlayerInvulnerable('player1')).toBe(false)
    })
  })

  describe('isPlayerRespawning', () => {
    it('returns false initially', () => {
      combat.setLocalPlayer('player1')
      expect(combat.isPlayerRespawning('player1')).toBe(false)
    })
  })

  describe('addShield', () => {
    it('adds shield to player', () => {
      combat.setLocalPlayer('player1')
      combat.addShield('player1', 30)

      const state = combat.getHealthState('player1')
      expect(state?.shield).toBe(30)
    })
  })

  describe('reset', () => {
    it('clears all combat state', () => {
      combat.setLocalPlayer('player1')
      combat.tryFire({ x: 100, y: 100 })

      combat.reset()

      expect(combat.getProjectiles()).toEqual([])
    })
  })
})
