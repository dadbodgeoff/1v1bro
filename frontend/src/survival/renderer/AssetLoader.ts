/**
 * AssetLoader - Handles loading GLB models for Survival Mode
 * Provides caching and progress tracking
 */

import * as THREE from 'three'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { SURVIVAL_ASSETS } from '../config/constants'

export interface LoadedAssets {
  track: {
    longTile: THREE.Group
    gapped: THREE.Group
    narrowBridge: THREE.Group
  }
  obstacles: {
    highBarrier: THREE.Group
    lowBarrier: THREE.Group
    laneBarrier: THREE.Group
    knowledgeGate: THREE.Group
    spikes: THREE.Group
  }
  character: {
    runner: {
      run: THREE.Group
      jump: THREE.Group
      down: THREE.Group
    }
  }
  collectibles?: {
    gem: THREE.Group
  }
  celestials?: {
    planetVolcanic: THREE.Group
    planetIce: THREE.Group
    planetGasGiant: THREE.Group
    asteroidCluster: THREE.Group
    spaceSatellite: THREE.Group
    icyComet: THREE.Group
    spaceWhale: THREE.Group
    ringPortal: THREE.Group
    crystalFormation: THREE.Group
    orbitalDefense: THREE.Group
    derelictShip: THREE.Group
  }
}

export interface AssetDimensions {
  longTile: THREE.Vector3
  runner: THREE.Vector3
}

type LoadProgress = {
  loaded: number
  total: number
  currentAsset: string
}

export class AssetLoader {
  private loader: GLTFLoader
  private dracoLoader: DRACOLoader
  private cache: Map<string, THREE.Group> = new Map()
  private onProgress?: (progress: LoadProgress) => void

  constructor(onProgress?: (progress: LoadProgress) => void) {
    // Setup Draco decoder for compressed GLB files
    this.dracoLoader = new DRACOLoader()
    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
    this.dracoLoader.setDecoderConfig({ type: 'js' }) // Use JS decoder (works everywhere)
    
    this.loader = new GLTFLoader()
    this.loader.setDRACOLoader(this.dracoLoader)
    
    this.onProgress = onProgress
  }

  /**
   * Load a single GLB model
   */
  private async loadModel(url: string, name: string): Promise<THREE.Group> {
    // Check cache first
    if (this.cache.has(url)) {
      return this.cache.get(url)!.clone()
    }

    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf: GLTF) => {
          const model = gltf.scene
          
          // Log dimensions for debugging
          new THREE.Box3().setFromObject(model)
          
          // Cache the original
          this.cache.set(url, model.clone())
          
          resolve(model)
        },
        (progress: ProgressEvent) => {
          if (this.onProgress && progress.total > 0) {
            this.onProgress({
              loaded: progress.loaded,
              total: progress.total,
              currentAsset: name,
            })
          }
        },
        (error: unknown) => {
          console.error(`[AssetLoader] Failed to load ${name}:`, error)
          reject(new Error(`Failed to load ${name}`))
        }
      )
    })
  }

  /**
   * Custom runner skin URLs (if equipped)
   */
  private customRunnerSkin?: {
    run: string
    jump: string
    down: string
  }

  /**
   * Set custom runner skin URLs to use instead of default
   * Call this before loadAll() to use equipped runner skin
   */
  setCustomRunnerSkin(skin: { run: string; jump: string; down: string }): void {
    this.customRunnerSkin = skin
    console.log('[AssetLoader] Custom runner skin set:', skin)
  }

  /**
   * Load all required assets for the game
   */
  async loadAll(): Promise<LoadedAssets> {
    // Determine runner skin URLs (custom or default)
    const runnerUrls = this.customRunnerSkin || SURVIVAL_ASSETS.character.runner

    // Load core assets first (required for gameplay)
    const [
      longTile,
      gapped,
      narrowBridge,
      highBarrier,
      lowBarrier,
      laneBarrier,
      knowledgeGate,
      spikes,
      runnerRun,
      runnerJump,
      runnerDown,
    ] = await Promise.all([
      this.loadModel(SURVIVAL_ASSETS.track.longTile, 'longTile'),
      this.loadModel(SURVIVAL_ASSETS.track.gapped, 'gapped'),
      this.loadModel(SURVIVAL_ASSETS.track.narrowBridge, 'narrowBridge'),
      this.loadModel(SURVIVAL_ASSETS.obstacles.highBarrier, 'highBarrier'),
      this.loadModel(SURVIVAL_ASSETS.obstacles.lowBarrier, 'lowBarrier'),
      this.loadModel(SURVIVAL_ASSETS.obstacles.laneBarrier, 'laneBarrier'),
      this.loadModel(SURVIVAL_ASSETS.obstacles.knowledgeGate, 'knowledgeGate'),
      this.loadModel(SURVIVAL_ASSETS.obstacles.spikes, 'spikes'),
      this.loadModelWithAnimations(runnerUrls.run, 'runner-run'),
      this.loadModelWithAnimations(runnerUrls.jump, 'runner-jump'),
      this.loadModelWithAnimations(runnerUrls.down, 'runner-down'),
    ])

    const result: LoadedAssets = {
      track: { longTile, gapped, narrowBridge },
      obstacles: { highBarrier, lowBarrier, laneBarrier, knowledgeGate, spikes },
      character: { runner: { run: runnerRun, jump: runnerJump, down: runnerDown } },
    }

    // Load collectibles in background (non-blocking for game start)
    this.loadCollectiblesAsync().then(collectibles => {
      if (collectibles) {
        result.collectibles = collectibles
      }
    }).catch(err => {
      console.warn('[AssetLoader] Failed to load collectibles:', err)
    })

    // Load celestials in background (non-blocking for game start)
    this.loadCelestialsAsync().then(celestials => {
      if (celestials) {
        result.celestials = celestials
      }
    }).catch(err => {
      console.warn('[AssetLoader] Failed to load some celestials:', err)
    })

    return result
  }

  /**
   * Load celestial models asynchronously (for space background)
   */
  async loadCelestialsAsync(): Promise<LoadedAssets['celestials'] | null> {
    if (!SURVIVAL_ASSETS.celestials) return null

    try {
      const [
        planetVolcanic,
        planetIce,
        planetGasGiant,
        asteroidCluster,
        spaceSatellite,
        icyComet,
        spaceWhale,
        ringPortal,
        crystalFormation,
        orbitalDefense,
        derelictShip,
      ] = await Promise.all([
        this.loadModel(SURVIVAL_ASSETS.celestials.planetVolcanic, 'planetVolcanic'),
        this.loadModel(SURVIVAL_ASSETS.celestials.planetIce, 'planetIce'),
        this.loadModel(SURVIVAL_ASSETS.celestials.planetGasGiant, 'planetGasGiant'),
        this.loadModel(SURVIVAL_ASSETS.celestials.asteroidCluster, 'asteroidCluster'),
        this.loadModel(SURVIVAL_ASSETS.celestials.spaceSatellite!, 'spaceSatellite'),
        this.loadModel(SURVIVAL_ASSETS.celestials.icyComet!, 'icyComet'),
        this.loadModel(SURVIVAL_ASSETS.celestials.spaceWhale!, 'spaceWhale'),
        this.loadModel(SURVIVAL_ASSETS.celestials.ringPortal!, 'ringPortal'),
        this.loadModel(SURVIVAL_ASSETS.celestials.crystalFormation!, 'crystalFormation'),
        this.loadModel(SURVIVAL_ASSETS.celestials.orbitalDefense!, 'orbitalDefense'),
        this.loadModel(SURVIVAL_ASSETS.celestials.derelictShip!, 'derelictShip'),
      ])

      return {
        planetVolcanic,
        planetIce,
        planetGasGiant,
        asteroidCluster,
        spaceSatellite,
        icyComet,
        spaceWhale,
        ringPortal,
        crystalFormation,
        orbitalDefense,
        derelictShip,
      }
    } catch (error) {
      console.error('[AssetLoader] Celestial loading failed:', error)
      return null
    }
  }

  /**
   * Load collectible models asynchronously
   */
  async loadCollectiblesAsync(): Promise<LoadedAssets['collectibles'] | null> {
    if (!SURVIVAL_ASSETS.collectibles) return null

    try {
      const gem = await this.loadModel(SURVIVAL_ASSETS.collectibles.gem, 'gem')
      return { gem }
    } catch (error) {
      console.error('[AssetLoader] Collectibles loading failed:', error)
      return null
    }
  }

  /**
   * Load city model asynchronously (for skyline below track)
   */
  async loadCityAsync(): Promise<THREE.Group | null> {
    if (!SURVIVAL_ASSETS.environment?.city) return null

    try {
      const city = await this.loadModel(SURVIVAL_ASSETS.environment.city, 'city')
      return city
    } catch (error) {
      console.error('[AssetLoader] City loading failed:', error)
      return null
    }
  }

  /**
   * Load a model and preserve its animations
   */
  private async loadModelWithAnimations(url: string, name: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf: GLTF) => {
          const model = gltf.scene

          // Attach animations to the model for later use
          model.animations = gltf.animations

          if (gltf.animations.length > 0) {
            // Animations found - no logging needed
          } else {
            console.warn(`[AssetLoader] ${name}: ⚠️ NO ANIMATIONS FOUND IN GLB!`)
            console.warn(`[AssetLoader] ${name}: Check that animations are exported with the model in Blender:`)
            console.warn(`  1. Select armature AND mesh before export`)
            console.warn(`  2. In GLB export settings, enable "Animations" checkbox`)
            console.warn(`  3. Make sure animation is in NLA track or use "Always Sample Animations"`)
          }

          // Log skeleton/armature info


          resolve(model)
        },
        undefined,
        (error: unknown) => {
          console.error(`[AssetLoader] Failed to load ${name}:`, error)
          reject(new Error(`Failed to load ${name}`))
        }
      )
    })
  }

  /**
   * Get dimensions of a model after scaling
   */
  static getDimensions(model: THREE.Group, scale: number = 1): THREE.Vector3 {
    const clone = model.clone()
    clone.scale.set(scale, scale, scale)
    const box = new THREE.Box3().setFromObject(clone)
    return box.getSize(new THREE.Vector3())
  }

  /**
   * Clone a model for instancing
   */
  static clone(model: THREE.Group): THREE.Group {
    return model.clone()
  }

  /**
   * Clear the asset cache
   */
  clearCache(): void {
    this.cache.clear()
  }
}
