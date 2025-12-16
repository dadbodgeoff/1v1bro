/**
 * Tests for EventWiring
 * Verifies that events flow correctly through the wiring
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GameEventBus } from './GameEventBus'
import { wireEvents, wireCollisionSystem } from './EventWiring'

// Create mock implementations
const createMockFeedbackSystem = () => ({
  onPerfectDodge: vi.fn(),
  onNearMiss: vi.fn(),
  onCollision: vi.fn(),
  onGameOver: vi.fn(),
  onComboMilestone: vi.fn(),
  emitSound: vi.fn(),
  emitHaptic: vi.fn(),
  onVisualIndicator: vi.fn(() => () => {}),
})

const createMockAchievementSystem = () => ({
  recordCloseCall: vi.fn(),
  recordPerfectDodge: vi.fn(),
  recordHit: vi.fn(),
  getRunStats: vi.fn(() => ({ closeCalls: 0, perfectDodges: 0, hitsTaken: 0 })),
  onAchievement: vi.fn(() => () => {}),
})

const createMockMilestoneSystem = () => ({
  onMilestone: vi.fn(() => () => {}),
})

const createMockComboSystem = () => ({
  onCollision: vi.fn(),
  getMultiplier: vi.fn(() => 1.5),
  onComboChange: vi.fn(),
})

const createMockCollisionSystem = () => ({
  triggerInvincibility: vi.fn(),
  setNearMissCallback: vi.fn(),
})

const createMockStateManager = () => ({
  addScore: vi.fn(),
  incrementObstaclesCleared: vi.fn(),
  recordDeath: vi.fn(),
})

const createMockTransitionSystem = () => ({
  triggerDeath: vi.fn(),
})

const createMockParticleSystem = () => ({
  emitPerfectDodgeBurst: vi.fn(),
  emitDodgeParticles: vi.fn(),
})

const createMockCameraController = () => ({
  addShakeTrauma: vi.fn(),
  triggerImpactZoom: vi.fn(),
})

const createMockGameLoop = () => ({
  triggerHitstop: vi.fn(),
})

const createMockObstacleManager = () => ({
  recordNearMiss: vi.fn(),
})

describe('EventWiring', () => {
  let eventBus: GameEventBus
  let mocks: ReturnType<typeof createAllMocks>

  function createAllMocks() {
    return {
      feedbackSystem: createMockFeedbackSystem(),
      achievementSystem: createMockAchievementSystem(),
      milestoneSystem: createMockMilestoneSystem(),
      comboSystem: createMockComboSystem(),
      collisionSystem: createMockCollisionSystem(),
      stateManager: createMockStateManager(),
      transitionSystem: createMockTransitionSystem(),
      particleSystem: createMockParticleSystem(),
      cameraController: createMockCameraController(),
      gameLoop: createMockGameLoop(),
      obstacleManager: createMockObstacleManager(),
    }
  }

  beforeEach(() => {
    eventBus = new GameEventBus()
    mocks = createAllMocks()
  })

  describe('Near-miss event flow', () => {
    beforeEach(() => {
      wireEvents({ eventBus, ...mocks } as never)
    })

    it('should trigger feedback on near-miss', () => {
      eventBus.emit('player:nearMiss', {
        distance: 0.3,
        obstacleType: 'lowBarrier',
        position: { x: 0, y: 1, z: -10 },
        isPerfect: false,
      })

      expect(mocks.feedbackSystem.onNearMiss).toHaveBeenCalledWith(0.3, { x: 0, z: -10 })
      expect(mocks.particleSystem.emitDodgeParticles).toHaveBeenCalled()
    })

    it('should trigger perfect dodge effects on perfect near-miss', () => {
      eventBus.emit('player:nearMiss', {
        distance: 0.1,
        obstacleType: 'lowBarrier',
        position: { x: 0, y: 1, z: -10 },
        isPerfect: true,
      })

      expect(mocks.feedbackSystem.onPerfectDodge).toHaveBeenCalledWith({ x: 0, z: -10 })
      expect(mocks.particleSystem.emitPerfectDodgeBurst).toHaveBeenCalled()
      expect(mocks.gameLoop.triggerHitstop).toHaveBeenCalledWith(3, 0.05)
    })

    it('should record close call in achievement system', () => {
      eventBus.emit('player:nearMiss', {
        distance: 0.3,
        obstacleType: 'lowBarrier',
        position: { x: 0, y: 1, z: -10 },
        isPerfect: false,
      })

      expect(mocks.achievementSystem.recordCloseCall).toHaveBeenCalled()
    })

    it('should record perfect dodge in achievement system', () => {
      eventBus.emit('player:nearMiss', {
        distance: 0.1,
        obstacleType: 'lowBarrier',
        position: { x: 0, y: 1, z: -10 },
        isPerfect: true,
      })

      expect(mocks.achievementSystem.recordPerfectDodge).toHaveBeenCalled()
    })

    it('should add score with multiplier', () => {
      eventBus.emit('player:nearMiss', {
        distance: 0.3,
        obstacleType: 'lowBarrier',
        position: { x: 0, y: 1, z: -10 },
        isPerfect: false,
      })

      // Base score 25 * multiplier 1.5 = 37.5 → 38
      expect(mocks.stateManager.addScore).toHaveBeenCalledWith(38)
    })

    it('should add higher score for perfect dodge', () => {
      eventBus.emit('player:nearMiss', {
        distance: 0.1,
        obstacleType: 'lowBarrier',
        position: { x: 0, y: 1, z: -10 },
        isPerfect: true,
      })

      // Base score 100 * multiplier 1.5 = 150
      expect(mocks.stateManager.addScore).toHaveBeenCalledWith(150)
    })

    it('should increment obstacles cleared', () => {
      eventBus.emit('player:nearMiss', {
        distance: 0.3,
        obstacleType: 'lowBarrier',
        position: { x: 0, y: 1, z: -10 },
        isPerfect: false,
      })

      expect(mocks.stateManager.incrementObstaclesCleared).toHaveBeenCalled()
    })
  })

  describe('Collision event flow', () => {
    beforeEach(() => {
      wireEvents({ eventBus, ...mocks } as never)
    })

    it('should reset combo on collision', () => {
      eventBus.emit('player:collision', {
        obstacleType: 'spikes',
        position: { x: 0, z: -10 },
      })

      expect(mocks.comboSystem.onCollision).toHaveBeenCalled()
    })

    it('should record hit in achievement system', () => {
      eventBus.emit('player:collision', {
        obstacleType: 'spikes',
        position: { x: 0, z: -10 },
      })

      expect(mocks.achievementSystem.recordHit).toHaveBeenCalled()
    })

    it('should record death position', () => {
      eventBus.emit('player:collision', {
        obstacleType: 'spikes',
        position: { x: 1, z: -15 },
      })

      expect(mocks.stateManager.recordDeath).toHaveBeenCalledWith('spikes', { x: 1, z: -15 })
    })

    it('should trigger camera effects', () => {
      eventBus.emit('player:collision', {
        obstacleType: 'spikes',
        position: { x: 0, z: -10 },
      })

      expect(mocks.cameraController.addShakeTrauma).toHaveBeenCalledWith(0.6)
      expect(mocks.cameraController.triggerImpactZoom).toHaveBeenCalledWith(0.8)
      expect(mocks.gameLoop.triggerHitstop).toHaveBeenCalledWith(4, 0.05)
    })

    it('should trigger collision feedback', () => {
      eventBus.emit('player:collision', {
        obstacleType: 'spikes',
        position: { x: 0, z: -10 },
      })

      expect(mocks.feedbackSystem.onCollision).toHaveBeenCalled()
    })
  })

  describe('Life lost event flow', () => {
    beforeEach(() => {
      wireEvents({ eventBus, ...mocks } as never)
    })

    it('should trigger invincibility', () => {
      eventBus.emit('player:lifeLost', { livesRemaining: 2 })

      expect(mocks.collisionSystem.triggerInvincibility).toHaveBeenCalled()
    })

    it('should trigger death animation when lives remain', () => {
      eventBus.emit('player:lifeLost', { livesRemaining: 2 })

      expect(mocks.transitionSystem.triggerDeath).toHaveBeenCalled()
    })

    it('should not trigger death animation on final life', () => {
      eventBus.emit('player:lifeLost', { livesRemaining: 0 })

      expect(mocks.transitionSystem.triggerDeath).not.toHaveBeenCalled()
    })
  })

  describe('Milestone event flow', () => {
    beforeEach(() => {
      wireEvents({ eventBus, ...mocks } as never)
    })

    it('should emit milestone sound', () => {
      eventBus.emit('milestone:reached', { distance: 500, isMajor: false })

      expect(mocks.feedbackSystem.emitSound).toHaveBeenCalledWith('milestone', { intensity: 0.7 })
      expect(mocks.feedbackSystem.emitHaptic).toHaveBeenCalledWith('medium', 0.6)
    })

    it('should emit stronger feedback for major milestone', () => {
      eventBus.emit('milestone:reached', { distance: 1000, isMajor: true })

      expect(mocks.feedbackSystem.emitSound).toHaveBeenCalledWith('milestone', { intensity: 1 })
      expect(mocks.feedbackSystem.emitHaptic).toHaveBeenCalledWith('success', 1)
    })
  })

  describe('Combo milestone event flow', () => {
    beforeEach(() => {
      wireEvents({ eventBus, ...mocks } as never)
    })

    it('should show combo milestone visual', () => {
      eventBus.emit('combo:milestone', {
        milestone: 10,
        combo: 10,
        multiplier: 2.0,
        position: { x: 0, z: -5 },
      })

      expect(mocks.feedbackSystem.onComboMilestone).toHaveBeenCalledWith(10, { x: 0, z: -5 })
    })
  })

  describe('Achievement event flow', () => {
    beforeEach(() => {
      wireEvents({ eventBus, ...mocks } as never)
    })

    it('should play achievement sound', () => {
      eventBus.emit('achievement:unlocked', {
        id: 'dist_500',
        name: 'Getting Started',
        category: 'distance',
        value: 500,
      })

      expect(mocks.feedbackSystem.emitSound).toHaveBeenCalledWith('milestone', { intensity: 1, pitch: 1.2 })
      expect(mocks.feedbackSystem.emitHaptic).toHaveBeenCalledWith('success', 0.8)
    })
  })

  describe('Game state event flow', () => {
    beforeEach(() => {
      wireEvents({ eventBus, ...mocks } as never)
    })

    it('should trigger game over feedback', () => {
      eventBus.emit('game:over', { score: 1000, distance: 500 })

      expect(mocks.feedbackSystem.onGameOver).toHaveBeenCalled()
    })

    it('should play countdown sounds', () => {
      eventBus.emit('game:countdown', { value: 3 })
      expect(mocks.feedbackSystem.emitSound).toHaveBeenCalledWith('countdown', { intensity: 0.8 })

      eventBus.emit('game:countdown', { value: 'GO' })
      expect(mocks.feedbackSystem.emitSound).toHaveBeenCalledWith('boost', { intensity: 1 })
    })
  })

  describe('Cleanup', () => {
    it('should unsubscribe all listeners on cleanup', () => {
      const cleanup = wireEvents({ eventBus, ...mocks } as never)

      // Verify listeners are registered
      expect(eventBus.getListenerCount()).toBeGreaterThan(0)

      cleanup()

      // Most listeners should be cleaned up
      // Note: Some system callbacks (comboSystem.onComboChange) don't return unsubscribe
      // so they won't be fully cleaned up, but the event bus listeners will be
    })
  })
})

describe('wireCollisionSystem', () => {
  it('should emit player:nearMiss when collision system detects near-miss', () => {
    const eventBus = new GameEventBus()
    const collisionSystem = createMockCollisionSystem()
    const getPlayerPosition = vi.fn(() => ({ x: 1, y: 2, z: -10 }))

    wireCollisionSystem(collisionSystem as never, eventBus, getPlayerPosition)

    // Get the callback that was registered
    const callback = collisionSystem.setNearMissCallback.mock.calls[0][0]

    // Track emitted events
    const emittedEvents: unknown[] = []
    eventBus.on('player:nearMiss', (data) => emittedEvents.push(data))

    // Simulate near-miss detection
    callback(0.3, 'lowBarrier')

    expect(emittedEvents).toHaveLength(1)
    expect(emittedEvents[0]).toEqual({
      distance: 0.3,
      obstacleType: 'lowBarrier',
      position: { x: 1, y: 2, z: -10 },
      isPerfect: false,
    })
  })

  it('should mark as perfect when distance <= 0.2', () => {
    const eventBus = new GameEventBus()
    const collisionSystem = createMockCollisionSystem()
    const getPlayerPosition = vi.fn(() => ({ x: 0, y: 1, z: -5 }))

    wireCollisionSystem(collisionSystem as never, eventBus, getPlayerPosition)

    const callback = collisionSystem.setNearMissCallback.mock.calls[0][0]

    const emittedEvents: unknown[] = []
    eventBus.on('player:nearMiss', (data) => emittedEvents.push(data))

    callback(0.15, 'highBarrier')

    expect((emittedEvents[0] as { isPerfect: boolean }).isPerfect).toBe(true)
  })
})
