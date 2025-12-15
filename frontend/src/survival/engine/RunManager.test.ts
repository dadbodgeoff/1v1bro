/**
 * RunManager Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RunManager } from './RunManager'

// Mock survivalApi
vi.mock('../services/SurvivalApiService', () => ({
  survivalApi: {
    submitRun: vi.fn().mockResolvedValue({ response: { id: 'test-run-id' } }),
  },
}))

// Mock InputRecorder static method
vi.mock('../systems/InputRecorder', () => ({
  InputRecorder: {
    serializeRecording: vi.fn().mockReturnValue('serialized-ghost-data'),
  },
}))

describe('RunManager', () => {
  let runManager: RunManager
  let mockDeps: Record<string, ReturnType<typeof vi.fn> | Record<string, ReturnType<typeof vi.fn>>>
  let mockCallbacks: { onGameOver: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    mockDeps = {
      stateManager: {
        getPhase: vi.fn().mockReturnValue('ready'),
        setPhase: vi.fn(),
        isRunning: vi.fn().mockReturnValue(false),
        generateRunSeed: vi.fn().mockReturnValue(12345),
        resetRunTracking: vi.fn(),
        getMutableState: vi.fn().mockReturnValue({
          distance: 1000,
          score: 500,
          player: { z: 8, lives: 3 },
        }),
        reset: vi.fn(),
        gameTimeMs: 60000,
        maxSpeed: 25,
        obstaclesCleared: 50,
        lastDeathObstacleType: 'spike',
        lastDeathPosition: { x: 0, z: -100 },
        runSeed: 12345,
      },
      obstacleManager: {
        setSeed: vi.fn(),
        setSpawningEnabled: vi.fn(),
        reset: vi.fn(),
      },
      collectibleManager: {
        setSpawningEnabled: vi.fn(),
        reset: vi.fn(),
      },
      collectibleOrchestrator: {
        reset: vi.fn(),
      },
      trackManager: {
        reset: vi.fn(),
      },
      physicsController: {
        reset: vi.fn(),
      },
      collisionSystem: {
        reset: vi.fn(),
      },
      inputBuffer: {
        clear: vi.fn(),
      },
      playerController: {
        setVisualState: vi.fn(),
        reset: vi.fn(),
      },
      cameraController: {
        reset: vi.fn(),
        initialize: vi.fn(),
      },
      performanceMonitor: {
        reset: vi.fn(),
      },
      particleSystem: {
        reset: vi.fn(),
      },
      transitionSystem: {
        startCountdown: vi.fn(),
        startFadeIn: vi.fn(),
        reset: vi.fn(),
      },
      comboSystem: {
        reset: vi.fn(),
        getState: vi.fn().mockReturnValue({ combo: 10 }),
      },
      inputRecorder: {
        start: vi.fn(),
        stop: vi.fn().mockReturnValue({ inputs: [], seed: 12345 }),
        reset: vi.fn(),
        constructor: { serializeRecording: vi.fn().mockReturnValue('ghost-data') },
      },
      milestoneSystem: {
        reset: vi.fn(),
      },
      achievementSystem: {
        reset: vi.fn(),
      },
      ghostManager: {
        startGhost: vi.fn(),
        reset: vi.fn(),
        reloadPersonalBestGhost: vi.fn(),
      },
      loadingOrchestrator: {
        isReadyForCountdown: vi.fn().mockReturnValue(true),
        startCountdown: vi.fn(),
        startRunning: vi.fn(),
      },
      renderer: {
        resetOrbitControls: vi.fn(),
      },
      gameLoop: {
        setTimeScale: vi.fn(),
      },
      fixedUpdateLoop: {
        setSpeed: vi.fn(),
        resetSpeed: vi.fn(),
      },
    }

    mockCallbacks = {
      onGameOver: vi.fn(),
    }

    runManager = new RunManager(mockDeps as never, mockCallbacks, 15)
  })

  describe('start', () => {
    it('should start countdown when ready and loading complete', () => {
      runManager.start()

      expect(mockDeps.stateManager.generateRunSeed).toHaveBeenCalled()
      expect(mockDeps.obstacleManager.setSeed).toHaveBeenCalledWith(12345)
      expect(mockDeps.inputRecorder.start).toHaveBeenCalledWith(12345)
      expect(mockDeps.loadingOrchestrator.startCountdown).toHaveBeenCalled()
      expect(mockDeps.transitionSystem.startCountdown).toHaveBeenCalled()
    })

    it('should start immediately when loading not ready', () => {
      (mockDeps.loadingOrchestrator.isReadyForCountdown as ReturnType<typeof vi.fn>).mockReturnValue(false)
      
      runManager.start()

      expect(mockDeps.loadingOrchestrator.startRunning).toHaveBeenCalled()
      expect(mockDeps.stateManager.setPhase).toHaveBeenCalledWith('running')
    })

    it('should resume when paused', () => {
      (mockDeps.stateManager.getPhase as ReturnType<typeof vi.fn>).mockReturnValue('paused')
      
      runManager.start()

      expect(mockDeps.stateManager.setPhase).toHaveBeenCalledWith('running')
      expect(mockDeps.playerController.setVisualState).toHaveBeenCalledWith({ isRunning: true })
    })
  })

  describe('pause', () => {
    it('should pause when running', () => {
      (mockDeps.stateManager.isRunning as ReturnType<typeof vi.fn>).mockReturnValue(true)
      
      runManager.pause()

      expect(mockDeps.stateManager.setPhase).toHaveBeenCalledWith('paused')
      expect(mockDeps.playerController.setVisualState).toHaveBeenCalledWith({ isRunning: false })
    })

    it('should not pause when not running', () => {
      (mockDeps.stateManager.isRunning as ReturnType<typeof vi.fn>).mockReturnValue(false)
      
      runManager.pause()

      expect(mockDeps.stateManager.setPhase).not.toHaveBeenCalled()
    })
  })

  describe('resume', () => {
    it('should resume when paused', () => {
      (mockDeps.stateManager.getPhase as ReturnType<typeof vi.fn>).mockReturnValue('paused')
      
      runManager.resume()

      expect(mockDeps.stateManager.setPhase).toHaveBeenCalledWith('running')
      expect(mockDeps.playerController.setVisualState).toHaveBeenCalledWith({ isRunning: true })
    })

    it('should not resume when not paused', () => {
      (mockDeps.stateManager.getPhase as ReturnType<typeof vi.fn>).mockReturnValue('running')
      
      runManager.resume()

      expect(mockDeps.stateManager.setPhase).not.toHaveBeenCalled()
    })
  })

  describe('gameOver', () => {
    it('should set phase to gameover and disable spawning', () => {
      runManager.gameOver()

      expect(mockDeps.stateManager.setPhase).toHaveBeenCalledWith('gameover')
      expect(mockDeps.playerController.setVisualState).toHaveBeenCalledWith({ isRunning: false })
      expect(mockDeps.obstacleManager.setSpawningEnabled).toHaveBeenCalledWith(false)
    })

    it('should call onGameOver callback', () => {
      runManager.gameOver()

      expect(mockCallbacks.onGameOver).toHaveBeenCalledWith(500, 1000)
    })
  })

  describe('reset', () => {
    it('should reset all systems', () => {
      runManager.reset()

      expect(mockDeps.stateManager.reset).toHaveBeenCalled()
      expect(mockDeps.fixedUpdateLoop.resetSpeed).toHaveBeenCalled()
      expect(mockDeps.obstacleManager.reset).toHaveBeenCalled()
      expect(mockDeps.collectibleManager.reset).toHaveBeenCalled()
      expect(mockDeps.trackManager.reset).toHaveBeenCalled()
      expect(mockDeps.physicsController.reset).toHaveBeenCalled()
      expect(mockDeps.collisionSystem.reset).toHaveBeenCalled()
      expect(mockDeps.inputBuffer.clear).toHaveBeenCalled()
      expect(mockDeps.playerController.reset).toHaveBeenCalled()
      expect(mockDeps.cameraController.reset).toHaveBeenCalled()
      expect(mockDeps.particleSystem.reset).toHaveBeenCalled()
      expect(mockDeps.comboSystem.reset).toHaveBeenCalled()
      expect(mockDeps.ghostManager.reset).toHaveBeenCalled()
      expect(mockDeps.gameLoop.setTimeScale).toHaveBeenCalledWith(1)
    })
  })

  describe('quickRestart', () => {
    it('should reset and start new run with countdown', () => {
      runManager.quickRestart()

      // Should reset
      expect(mockDeps.stateManager.reset).toHaveBeenCalled()
      
      // Should generate new seed
      expect(mockDeps.stateManager.generateRunSeed).toHaveBeenCalled()
      expect(mockDeps.obstacleManager.setSeed).toHaveBeenCalledWith(12345)
      
      // Should reload ghost
      expect(mockDeps.ghostManager.reloadPersonalBestGhost).toHaveBeenCalled()
      
      // Should start countdown
      expect(mockDeps.loadingOrchestrator.startCountdown).toHaveBeenCalled()
      expect(mockDeps.transitionSystem.startCountdown).toHaveBeenCalled()
    })
  })

  describe('onCountdownComplete', () => {
    it('should enable spawning and start ghost', () => {
      runManager.onCountdownComplete()

      expect(mockDeps.stateManager.setPhase).toHaveBeenCalledWith('running')
      expect(mockDeps.playerController.setVisualState).toHaveBeenCalledWith({ isRunning: true })
      expect(mockDeps.obstacleManager.setSpawningEnabled).toHaveBeenCalledWith(true)
      expect(mockDeps.collectibleManager.setSpawningEnabled).toHaveBeenCalledWith(true)
      expect(mockDeps.ghostManager.startGhost).toHaveBeenCalled()
    })
  })
})
