/**
 * AssetLoader - Handles loading GLB models for Survival Mode
 * Provides caching and progress tracking
 */

import * as THREE from 'three'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { SURVIVAL_ASSETS } from '../config/constants'
import { getDeviceCapabilities } from '../config/device'

export interface LoadedAssets {
  track: {
    longTile: THREE.Group
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
  private isSafariMobile: boolean = false
  private maxTextureSize: number = 2048

  constructor(onProgress?: (progress: LoadProgress) => void) {
    // Detect Safari/iOS for texture optimization
    const caps = getDeviceCapabilities()
    this.isSafariMobile = caps.isSafari && caps.isMobile
    // Limit texture size on Safari mobile to prevent VRAM exhaustion
    this.maxTextureSize = this.isSafariMobile ? 512 : (caps.isIOS ? 1024 : 2048)
    // Setup Draco decoder for compressed GLB files
    this.dracoLoader = new DRACOLoader()
    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
    this.dracoLoader.setDecoderConfig({ type: 'js' }) // Use JS decoder (works everywhere)
    
    this.loader = new GLTFLoader()
    this.loader.setDRACOLoader(this.dracoLoader)
    
    this.onProgress = onProgress
  }

  /**
   * Load a single GLB model with retry logic
   */
  private async loadModel(url: string, name: string, retries = 3): Promise<THREE.Group> {
    // Check cache first
    if (this.cache.has(url)) {
      return this.cache.get(url)!.clone()
    }

    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const model = await this.loadModelOnce(url, name)
        return model
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.warn(`[AssetLoader] Attempt ${attempt}/${retries} failed for ${name}:`, error)
        
        if (attempt < retries) {
          // Exponential backoff: 500ms, 1000ms, 2000ms
          const delay = 500 * Math.pow(2, attempt - 1)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    throw lastError || new Error(`Failed to load ${name} after ${retries} attempts`)
  }

  /**
   * Single attempt to load a GLB model
   */
  private loadModelOnce(url: string, name: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      // Add timeout for mobile (Safari can hang on large assets)
      const timeout = this.isSafariMobile ? 30000 : 60000 // 30s for Safari, 60s otherwise
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout loading ${name}`))
      }, timeout)

      this.loader.load(
        url,
        (gltf: GLTF) => {
          clearTimeout(timeoutId)
          const model = gltf.scene
          
          // Safari/iOS optimization: reduce texture sizes to prevent VRAM exhaustion
          if (this.isSafariMobile || this.maxTextureSize < 2048) {
            this.optimizeModelForMobile(model)
          }
          
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
          clearTimeout(timeoutId)
          console.error(`[AssetLoader] Failed to load ${name}:`, error)
          reject(new Error(`Failed to load ${name}`))
        }
      )
    })
  }

  /**
   * Safari/iOS optimization: reduce texture sizes and simplify materials
   * This helps prevent VRAM exhaustion and improves performance
   */
  private optimizeModelForMobile(model: THREE.Group): void {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material]
        
        for (const material of materials) {
          if (material instanceof THREE.MeshStandardMaterial || 
              material instanceof THREE.MeshPhysicalMaterial) {
            // Reduce texture sizes
            const textures = [
              material.map,
              material.normalMap,
              material.roughnessMap,
              material.metalnessMap,
              material.aoMap,
              material.emissiveMap,
            ]
            
            for (const texture of textures) {
              if (texture && texture.image) {
                // Set minFilter to avoid mipmaps on Safari (saves VRAM)
                texture.minFilter = THREE.LinearFilter
                texture.generateMipmaps = false
              }
            }
            
            // Disable expensive features on Safari mobile
            if (this.isSafariMobile) {
              material.normalMap = null // Normal maps are expensive
              material.aoMap = null // AO maps add overhead
              material.envMapIntensity = 0 // Disable environment reflections
            }
          }
        }
        
        // Reduce geometry complexity if possible
        if (this.isSafariMobile && child.geometry) {
          // Dispose of unused attributes to save memory
          const geometry = child.geometry
          if (geometry.attributes.uv2) {
            geometry.deleteAttribute('uv2')
          }
        }
      }
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
    // NOTE: gapped and narrowBridge track tiles removed - not currently used, saves memory
    const [
      longTile,
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
      track: { longTile },
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
   * Downscale textures in a model to save VRAM
   * Celestials are far away so 256-512px textures look fine
   */
  private downscaleModelTextures(model: THREE.Group, maxSize: number = 512): void {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const processedTextures = new Set<THREE.Texture>()

    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      
      for (const material of materials) {
        if (!material) continue
        
        // Get all texture properties
        const textureProps = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap'] as const
        
        for (const prop of textureProps) {
          const texture = (material as Record<string, unknown>)[prop] as THREE.Texture | undefined
          if (!texture || !texture.image || processedTextures.has(texture)) continue
          
          processedTextures.add(texture)
          
          const img = texture.image as HTMLImageElement | ImageBitmap
          const origWidth = img.width || 1
          const origHeight = img.height || 1
          
          // Skip if already small enough
          if (origWidth <= maxSize && origHeight <= maxSize) continue
          
          // Calculate new size maintaining aspect ratio
          const scale = maxSize / Math.max(origWidth, origHeight)
          const newWidth = Math.floor(origWidth * scale)
          const newHeight = Math.floor(origHeight * scale)
          
          // Downscale using canvas
          canvas.width = newWidth
          canvas.height = newHeight
          ctx.drawImage(img as CanvasImageSource, 0, 0, newWidth, newHeight)
          
          // Create new texture from downscaled canvas
          const newTexture = new THREE.CanvasTexture(canvas)
          newTexture.colorSpace = texture.colorSpace
          newTexture.wrapS = texture.wrapS
          newTexture.wrapT = texture.wrapT
          newTexture.minFilter = THREE.LinearFilter // No mipmaps needed
          newTexture.magFilter = THREE.LinearFilter
          newTexture.generateMipmaps = false // Save more VRAM
          
          // Replace the texture
          ;(material as Record<string, unknown>)[prop] = newTexture
          
          // Dispose old texture to free memory
          texture.dispose()
        }
      }
    })
    
    console.log(`[AssetLoader] Downscaled ${processedTextures.size} textures to max ${maxSize}px`)
  }

  /**
   * Load celestial models asynchronously (for space background)
   * Textures are downscaled to 256-512px since celestials are distant
   * Skipped on Safari mobile to save ~12MB GPU memory
   */
  async loadCelestialsAsync(): Promise<LoadedAssets['celestials'] | null> {
    // Skip celestials on Safari mobile - saves significant GPU memory
    if (this.isSafariMobile) {
      console.log('[AssetLoader] Skipping celestials on Safari mobile to save memory')
      return null
    }
    if (!SURVIVAL_ASSETS.celestials) return null

    // Celestial texture size - smaller since they're far away
    // 256px for mobile, 512px for desktop
    const celestialTextureSize = this.maxTextureSize <= 1024 ? 256 : 512

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
        this.loadModel(SURVIVAL_ASSETS.celestials.planetVolcanic, 'planetVolcanic').then(m => { this.downscaleModelTextures(m, celestialTextureSize); return m }),
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
   * Now enabled on mobile - only downscales textures, preserves original lighting
   */
  async loadCityAsync(): Promise<THREE.Group | null> {
    if (!SURVIVAL_ASSETS.environment?.city) return null

    try {
      const city = await this.loadModel(SURVIVAL_ASSETS.environment.city, 'city')
      
      // Only downscale textures on mobile - preserve original lighting/materials
      // Don't call optimizeModelForMobile() as it strips lighting properties
      if (this.isSafariMobile) {
        this.downscaleModelTextures(city, 256)
        console.log('[AssetLoader] City loaded with 256px textures (original lighting preserved)')
      } else if (this.maxTextureSize <= 1024) {
        this.downscaleModelTextures(city, 512)
        console.log('[AssetLoader] City loaded with 512px textures')
      }
      
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
