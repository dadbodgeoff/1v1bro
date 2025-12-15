/**
 * ResourceManager - Enterprise resource lifecycle management
 * Handles asset loading, caching, memory management, and disposal
 */

import * as THREE from 'three'

export interface ResourceStats {
  texturesLoaded: number
  geometriesLoaded: number
  materialsLoaded: number
  estimatedMemoryMB: number
}

export interface LoadingProgress {
  loaded: number
  total: number
  currentAsset: string
  percentage: number
}

type ProgressCallback = (progress: LoadingProgress) => void

export class ResourceManager {
  private static instance: ResourceManager | null = null
  
  // Caches
  private textureCache: Map<string, THREE.Texture> = new Map()
  private geometryCache: Map<string, THREE.BufferGeometry> = new Map()
  private modelCache: Map<string, THREE.Group> = new Map()
  
  // Tracking
  private loadedAssets: Set<string> = new Set()
  private pendingLoads: Map<string, Promise<unknown>> = new Map()
  
  // Memory limits
  private readonly MAX_CACHED_MODELS = 20
  private readonly MEMORY_WARNING_MB = 512

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager()
    }
    return ResourceManager.instance
  }

  /**
   * Preload multiple assets with progress tracking
   */
  async preloadAssets(
    urls: string[],
    onProgress?: ProgressCallback
  ): Promise<void> {
    const total = urls.length
    let loaded = 0

    for (const url of urls) {
      onProgress?.({
        loaded,
        total,
        currentAsset: this.getAssetName(url),
        percentage: (loaded / total) * 100,
      })

      try {
        await this.loadAsset(url)
        loaded++
      } catch (error) {
        console.error(`[ResourceManager] Failed to preload: ${url}`, error)
        loaded++ // Continue with other assets
      }
    }

    onProgress?.({
      loaded: total,
      total,
      currentAsset: 'Complete',
      percentage: 100,
    })
  }

  /**
   * Load a single asset (with deduplication)
   */
  async loadAsset(url: string): Promise<unknown> {
    // Check if already loaded
    if (this.modelCache.has(url)) {
      return this.modelCache.get(url)!.clone()
    }

    // Check if load is in progress
    if (this.pendingLoads.has(url)) {
      return this.pendingLoads.get(url)
    }

    // Start new load
    const loadPromise = this.doLoad(url)
    this.pendingLoads.set(url, loadPromise)

    try {
      const result = await loadPromise
      this.loadedAssets.add(url)
      return result
    } finally {
      this.pendingLoads.delete(url)
    }
  }

  /**
   * Internal load implementation
   */
  private async doLoad(url: string): Promise<THREE.Group> {
    // Dynamic import to avoid loading Three.js loaders until needed
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
    const loader = new GLTFLoader()

    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (gltf) => {
          const model = gltf.scene
          this.modelCache.set(url, model.clone())
          this.enforceMemoryLimits()
          resolve(model)
        },
        undefined,
        reject
      )
    })
  }

  /**
   * Get cached model (returns clone)
   */
  getModel(url: string): THREE.Group | null {
    const cached = this.modelCache.get(url)
    return cached ? cached.clone() : null
  }

  /**
   * Check if asset is loaded
   */
  isLoaded(url: string): boolean {
    return this.loadedAssets.has(url)
  }

  /**
   * Enforce memory limits by evicting old assets
   */
  private enforceMemoryLimits(): void {
    // Evict oldest models if over limit
    if (this.modelCache.size > this.MAX_CACHED_MODELS) {
      const keysToRemove = Array.from(this.modelCache.keys())
        .slice(0, this.modelCache.size - this.MAX_CACHED_MODELS)
      
      keysToRemove.forEach(key => {
        const model = this.modelCache.get(key)
        if (model) {
          this.disposeModel(model)
          this.modelCache.delete(key)
          this.loadedAssets.delete(key)
        }
      })
    }

    // Check memory usage
    const stats = this.getStats()
    if (stats.estimatedMemoryMB > this.MEMORY_WARNING_MB) {
      console.warn(`[ResourceManager] High memory usage: ${stats.estimatedMemoryMB.toFixed(1)}MB`)
    }
  }

  /**
   * Dispose a model and its resources
   */
  private disposeModel(model: THREE.Group): void {
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry?.dispose()
        
        if (Array.isArray(object.material)) {
          object.material.forEach(m => this.disposeMaterial(m))
        } else if (object.material) {
          this.disposeMaterial(object.material)
        }
      }
    })
  }

  /**
   * Dispose a material and its textures
   */
  private disposeMaterial(material: THREE.Material): void {
    material.dispose()
    
    // Dispose textures
    const mat = material as THREE.MeshStandardMaterial
    mat.map?.dispose()
    mat.normalMap?.dispose()
    mat.roughnessMap?.dispose()
    mat.metalnessMap?.dispose()
    mat.emissiveMap?.dispose()
  }

  /**
   * Get resource statistics
   */
  getStats(): ResourceStats {
    let geometryMemory = 0
    let textureMemory = 0

    // Estimate geometry memory
    this.geometryCache.forEach(geo => {
      const position = geo.getAttribute('position')
      if (position) {
        geometryMemory += position.array.byteLength
      }
    })

    // Estimate texture memory (rough estimate)
    this.textureCache.forEach((tex) => {
      const image = tex.image as { width?: number; height?: number } | null
      const width = image?.width || 0
      const height = image?.height || 0
      textureMemory += width * height * 4 // RGBA
    })

    return {
      texturesLoaded: this.textureCache.size,
      geometriesLoaded: this.geometryCache.size,
      materialsLoaded: this.modelCache.size,
      estimatedMemoryMB: (geometryMemory + textureMemory) / (1024 * 1024),
    }
  }

  /**
   * Clear specific asset from cache
   */
  clearAsset(url: string): void {
    const model = this.modelCache.get(url)
    if (model) {
      this.disposeModel(model)
      this.modelCache.delete(url)
      this.loadedAssets.delete(url)
    }
  }

  /**
   * Clear all cached resources
   */
  clearAll(): void {
    this.modelCache.forEach(model => this.disposeModel(model))
    this.modelCache.clear()
    this.textureCache.forEach(tex => tex.dispose())
    this.textureCache.clear()
    this.geometryCache.forEach(geo => geo.dispose())
    this.geometryCache.clear()
    this.loadedAssets.clear()
    this.pendingLoads.clear()
  }

  /**
   * Get asset name from URL
   */
  private getAssetName(url: string): string {
    const parts = url.split('/')
    return decodeURIComponent(parts[parts.length - 1].replace('.glb', ''))
  }
}
