/**
 * InitializationManager - Handles game initialization and asset loading
 * Extracted from SurvivalEngine for modularity
 * 
 * Responsibilities:
 * - Parallel asset loading for faster startup
 * - Subsystem initialization coordination
 * - Loading progress tracking
 */

import type { LoadedAssets } from '../renderer/AssetLoader'
import type { LoadingProgress, LoadingOrchestrator } from '../core/LoadingOrchestrator'
import type { AssetLoader } from '../renderer/AssetLoader'
import type { SurvivalRenderer } from '../renderer/SurvivalRenderer'
import type { TrackManager } from './TrackManager'
import type { ObstacleManager } from './ObstacleManager'
import type { CollectibleManager } from './CollectibleManager'
import type { PhysicsController } from './PhysicsController'
import type { CameraController } from './CameraController'
import type { LifecycleManager } from '../core/LifecycleManager'
import type { PlayerManager } from './PlayerManager'
import { getSoundManager } from '../audio'

export interface InitializationDeps {
  renderer: SurvivalRenderer
  assetLoader: AssetLoader
  trackManager: TrackManager
  obstacleManager: ObstacleManager
  collectibleManager: CollectibleManager
  physicsController: PhysicsController
  cameraController: CameraController
  lifecycleManager: LifecycleManager
  loadingOrchestrator: LoadingOrchestrator
}

export interface InitializationCallbacks {
  onPlayerManagerReady: (assets: LoadedAssets) => PlayerManager
  onGhostRendererReady: (assets: LoadedAssets) => void
  onUpdateLoopsReady: () => void
  onLoadingProgress?: (progress: LoadingProgress) => void
}

export class InitializationManager {
  private deps: InitializationDeps
  private callbacks: InitializationCallbacks
  private playerManager: PlayerManager | null = null

  constructor(deps: InitializationDeps, callbacks: InitializationCallbacks) {
    this.deps = deps
    this.callbacks = callbacks
  }

  /**
   * Initialize the game - load assets and setup scene
   * Uses parallel loading and subsystem tracking
   */
  async initialize(): Promise<void> {
    const initStart = performance.now()
    const { renderer, assetLoader, trackManager, obstacleManager, 
            physicsController, cameraController, lifecycleManager,
            loadingOrchestrator } = this.deps

    try {
      // Start loading orchestration
      loadingOrchestrator.start()
      loadingOrchestrator.setTask('Initializing lifecycle manager...')
      
      lifecycleManager.initialize()
      loadingOrchestrator.markReady('renderer', performance.now() - initStart)
      
      // Start critical asset loading
      loadingOrchestrator.startCriticalLoading()
      
      // Load all critical assets in parallel
      const assetStart = performance.now()
      const assets = await assetLoader.loadAll()
      
      // Initialize subsystems in parallel where possible
      const subsystemStart = performance.now()
      loadingOrchestrator.setTask('Initializing track...')
      
      // Track initialization
      trackManager.initialize(assets.track.longTile)
      loadingOrchestrator.markReady('track', performance.now() - assetStart)
      
      // Obstacle initialization
      loadingOrchestrator.setTask('Initializing obstacles...')
      obstacleManager.initialize(assets)
      loadingOrchestrator.markReady('obstacles', performance.now() - assetStart)
      
      // Collectible initialization (async - non-blocking)
      this.loadCollectiblesAsync()
      
      // Physics initialization
      loadingOrchestrator.setTask('Initializing physics...')
      physicsController.initialize(renderer.getScene())
      loadingOrchestrator.markReady('physics', performance.now() - subsystemStart)

      // Initialize player manager via callback
      loadingOrchestrator.setTask('Setting up character...')
      this.playerManager = this.callbacks.onPlayerManagerReady(assets)
      loadingOrchestrator.markReady('character', performance.now() - assetStart)
      
      // Give physics controller the track meshes for raycasting
      const raycastMeshes = trackManager.getRaycastMeshes()
      physicsController.setTrackMeshes(raycastMeshes)
      
      // Enterprise: Pass track surface height to physics, obstacles, and player
      // This ensures all systems use the same reference point for Y positioning
      const trackSurfaceHeight = trackManager.getTrackSurfaceHeight()
      physicsController.setTrackSurfaceHeight(trackSurfaceHeight)
      obstacleManager.setTrackSurfaceHeight(trackSurfaceHeight)
      
      // Set player initial Y to track surface height
      // This ensures collision detection works from the first frame
      if (this.playerManager) {
        this.playerManager.setInitialY(trackSurfaceHeight)
      }

      cameraController.initialize(8) // Initial player Z

      // Add track lights
      const tileDepth = trackManager.getTileDepth()
      const lightPositions = Array.from({ length: 10 }, (_, i) => -tileDepth * i)
      renderer.addTrackLights(lightPositions)

      // Initialize update loops via callback
      this.callbacks.onUpdateLoopsReady()

      // Initialize audio system (lazy init, will activate on first user interaction)
      loadingOrchestrator.setTask('Initializing audio...')
      const soundManager = getSoundManager()
      soundManager.initialize().then(() => {
        loadingOrchestrator.markReady('audio', performance.now() - initStart)
      }).catch(() => {
        // Audio init may fail without user interaction - that's OK
        loadingOrchestrator.markReady('audio', performance.now() - initStart)
      })

      // Start secondary loading (non-blocking)
      loadingOrchestrator.startSecondaryLoading()
      
      // Load secondary assets in parallel (non-blocking)
      Promise.all([
        this.loadCelestialsAsync(),
        this.loadCityAsync(),
      ]).then(() => {
        loadingOrchestrator.markReady('celestials', performance.now() - initStart)
        loadingOrchestrator.markReady('city', performance.now() - initStart)
      }).catch(() => {
        // Secondary assets are optional
        loadingOrchestrator.markReady('celestials', performance.now() - initStart)
        loadingOrchestrator.markReady('city', performance.now() - initStart)
      })
      
      // Setup animated character and ghost renderer
      this.callbacks.onGhostRendererReady(assets)
      
      // Initialize particles
      loadingOrchestrator.markReady('particles', performance.now() - initStart)

      // Warmup phase - render first frame to compile shaders
      loadingOrchestrator.startWarmup()
      loadingOrchestrator.setTask('Compiling shaders...')
      
      // Force a render to compile shaders
      renderer.render()
      
      // Mark warmup complete
      loadingOrchestrator.completeWarmup()

    } catch (error) {
      console.error('[InitializationManager] Initialization failed:', error)
      loadingOrchestrator.markFailed('renderer', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  /**
   * Load collectible models asynchronously
   */
  private async loadCollectiblesAsync(): Promise<void> {
    try {
      const collectibles = await this.deps.assetLoader.loadCollectiblesAsync()
      if (collectibles?.gem) {
        this.deps.collectibleManager.initialize(collectibles.gem)
      }
    } catch {
      // Collectibles failed to load - non-critical
    }
  }

  /**
   * Load celestial models asynchronously
   */
  private async loadCelestialsAsync(): Promise<void> {
    try {
      const celestials = await this.deps.assetLoader.loadCelestialsAsync()
      if (!celestials) return

      const { renderer } = this.deps
      renderer.registerCelestialModel('planet-volcanic', celestials.planetVolcanic)
      renderer.registerCelestialModel('planet-ice', celestials.planetIce)
      renderer.registerCelestialModel('planet-gas-giant', celestials.planetGasGiant)
      renderer.registerCelestialModel('asteroid-cluster', celestials.asteroidCluster)
      renderer.registerCelestialModel('space-station', celestials.spaceSatellite)
      renderer.registerCelestialModel('comet', celestials.icyComet)
      // New epic celestials
      renderer.registerCelestialModel('space-whale', celestials.spaceWhale)
      renderer.registerCelestialModel('ring-portal', celestials.ringPortal)
      renderer.registerCelestialModel('crystal-formation', celestials.crystalFormation)
      renderer.registerCelestialModel('orbital-defense', celestials.orbitalDefense)
      renderer.registerCelestialModel('derelict-ship', celestials.derelictShip)
    } catch {
      // Celestials failed to load - non-critical
    }
  }

  /**
   * Load city model asynchronously
   */
  private async loadCityAsync(): Promise<void> {
    try {
      const city = await this.deps.assetLoader.loadCityAsync()
      if (!city) return

      this.deps.renderer.registerCityModel(city)
    } catch {
      // City failed to load - non-critical
    }
  }

  /**
   * Get the player manager (available after initialization)
   */
  getPlayerManager(): PlayerManager | null {
    return this.playerManager
  }
}
