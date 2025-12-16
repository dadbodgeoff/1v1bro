/**
 * InitializationManager Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InitializationManager } from './InitializationManager'

// Mock audio
vi.mock('../audio', () => ({
  getSoundManager: vi.fn().mockReturnValue({
    initialize: vi.fn().mockResolvedValue(undefined),
  }),
}))

describe('InitializationManager', () => {
  let initManager: InitializationManager
  let mockDeps: Record<string, ReturnType<typeof vi.fn> | Record<string, ReturnType<typeof vi.fn>>>
  let mockCallbacks: Record<string, ReturnType<typeof vi.fn>>
  let mockAssets: Record<string, unknown>

  beforeEach(() => {
    mockAssets = {
      track: { longTile: {} },
      character: {
        runner: {
          run: { clone: vi.fn().mockReturnValue({}) },
          jump: {},
          down: {},
        },
      },
    }

    mockDeps = {
      renderer: {
        getScene: vi.fn().mockReturnValue({}),
        addTrackLights: vi.fn(),
        render: vi.fn(),
        registerCelestialModel: vi.fn(),
        registerCityModel: vi.fn(),
      },
      assetLoader: {
        loadAll: vi.fn().mockResolvedValue(mockAssets),
        loadCollectiblesAsync: vi.fn().mockResolvedValue({ gem: {} }),
        loadCelestialsAsync: vi.fn().mockResolvedValue({
          planetVolcanic: {},
          planetIce: {},
          planetGasGiant: {},
          asteroidCluster: {},
          spaceSatellite: {},
          icyComet: {},
          spaceWhale: {},
          ringPortal: {},
          crystalFormation: {},
          orbitalDefense: {},
          derelictShip: {},
        }),
        loadCityAsync: vi.fn().mockResolvedValue({}),
      },
      trackManager: {
        initialize: vi.fn(),
        getRaycastMeshes: vi.fn().mockReturnValue([]),
        getTileDepth: vi.fn().mockReturnValue(10),
        getTrackSurfaceHeight: vi.fn().mockReturnValue(1.3),
      },
      obstacleManager: {
        initialize: vi.fn(),
      },
      collectibleManager: {
        initialize: vi.fn(),
      },
      physicsController: {
        initialize: vi.fn(),
        setTrackMeshes: vi.fn(),
        setCharacterDimensions: vi.fn(),
      },
      cameraController: {
        initialize: vi.fn(),
      },
      lifecycleManager: {
        initialize: vi.fn(),
      },
      loadingOrchestrator: {
        start: vi.fn(),
        setTask: vi.fn(),
        markReady: vi.fn(),
        markFailed: vi.fn(),
        startCriticalLoading: vi.fn(),
        startSecondaryLoading: vi.fn(),
        startWarmup: vi.fn(),
        completeWarmup: vi.fn(),
      },
    }

    const mockPlayerManager = {
      setupPlayer: vi.fn(),
      setupAnimatedCharacter: vi.fn(),
      syncAnimationPosition: vi.fn(),
    }

    mockCallbacks = {
      onPlayerManagerReady: vi.fn().mockReturnValue(mockPlayerManager),
      onGhostRendererReady: vi.fn(),
      onUpdateLoopsReady: vi.fn(),
      onLoadingProgress: vi.fn(),
    }

    initManager = new InitializationManager(mockDeps as never, mockCallbacks as never)
  })

  describe('initialize', () => {
    it('should start loading orchestration', async () => {
      await initManager.initialize()

      expect(mockDeps.loadingOrchestrator.start).toHaveBeenCalled()
      expect(mockDeps.loadingOrchestrator.startCriticalLoading).toHaveBeenCalled()
    })

    it('should initialize lifecycle manager', async () => {
      await initManager.initialize()

      expect(mockDeps.lifecycleManager.initialize).toHaveBeenCalled()
    })

    it('should load all assets', async () => {
      await initManager.initialize()

      expect(mockDeps.assetLoader.loadAll).toHaveBeenCalled()
    })

    it('should initialize track with loaded assets', async () => {
      await initManager.initialize()

      expect(mockDeps.trackManager.initialize).toHaveBeenCalledWith(mockAssets.track.longTile)
    })

    it('should initialize obstacles with loaded assets', async () => {
      await initManager.initialize()

      expect(mockDeps.obstacleManager.initialize).toHaveBeenCalledWith(mockAssets)
    })

    it('should initialize physics', async () => {
      await initManager.initialize()

      expect(mockDeps.physicsController.initialize).toHaveBeenCalled()
    })

    it('should call onPlayerManagerReady callback', async () => {
      await initManager.initialize()

      expect(mockCallbacks.onPlayerManagerReady).toHaveBeenCalledWith(mockAssets)
    })

    it('should set track meshes for physics raycasting', async () => {
      await initManager.initialize()

      expect(mockDeps.trackManager.getRaycastMeshes).toHaveBeenCalled()
      expect(mockDeps.physicsController.setTrackMeshes).toHaveBeenCalled()
    })

    it('should initialize camera', async () => {
      await initManager.initialize()

      expect(mockDeps.cameraController.initialize).toHaveBeenCalledWith(8)
    })

    it('should add track lights', async () => {
      await initManager.initialize()

      expect(mockDeps.renderer.addTrackLights).toHaveBeenCalled()
    })

    it('should call onUpdateLoopsReady callback', async () => {
      await initManager.initialize()

      expect(mockCallbacks.onUpdateLoopsReady).toHaveBeenCalled()
    })

    it('should call onGhostRendererReady callback', async () => {
      await initManager.initialize()

      expect(mockCallbacks.onGhostRendererReady).toHaveBeenCalledWith(mockAssets)
    })

    it('should perform warmup render', async () => {
      await initManager.initialize()

      expect(mockDeps.loadingOrchestrator.startWarmup).toHaveBeenCalled()
      expect(mockDeps.renderer.render).toHaveBeenCalled()
      expect(mockDeps.loadingOrchestrator.completeWarmup).toHaveBeenCalled()
    })

    it('should mark subsystems as ready', async () => {
      await initManager.initialize()

      expect(mockDeps.loadingOrchestrator.markReady).toHaveBeenCalledWith('renderer', expect.any(Number))
      expect(mockDeps.loadingOrchestrator.markReady).toHaveBeenCalledWith('track', expect.any(Number))
      expect(mockDeps.loadingOrchestrator.markReady).toHaveBeenCalledWith('obstacles', expect.any(Number))
      expect(mockDeps.loadingOrchestrator.markReady).toHaveBeenCalledWith('physics', expect.any(Number))
      expect(mockDeps.loadingOrchestrator.markReady).toHaveBeenCalledWith('character', expect.any(Number))
    })

    it('should handle initialization failure', async () => {
      const error = new Error('Load failed')
      ;(mockDeps.assetLoader.loadAll as ReturnType<typeof vi.fn>).mockRejectedValue(error)

      await expect(initManager.initialize()).rejects.toThrow('Load failed')
      expect(mockDeps.loadingOrchestrator.markFailed).toHaveBeenCalledWith('renderer', 'Load failed')
    })
  })

  describe('getPlayerManager', () => {
    it('should return null before initialization', () => {
      expect(initManager.getPlayerManager()).toBeNull()
    })

    it('should return player manager after initialization', async () => {
      await initManager.initialize()
      expect(initManager.getPlayerManager()).not.toBeNull()
    })
  })
})
