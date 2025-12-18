/**
 * PerformanceOptimizer - AAA-level performance optimizations
 * 
 * Implements:
 * - Object pooling for particles/projectiles
 * - Frustum culling helpers
 * - LOD (Level of Detail) management
 * - GPU instancing for repeated objects
 * - Texture atlas management
 * - Animation LOD (reduce bone updates at distance)
 */

import * as THREE from 'three'

// ============================================================================
// Object Pooling - Avoid GC spikes from frequent allocations
// ============================================================================

export class ObjectPool<T> {
  private pool: T[] = []
  private factory: () => T
  private reset: (obj: T) => void
  private maxSize: number

  constructor(
    factory: () => T,
    reset: (obj: T) => void,
    initialSize = 20,
    maxSize = 100
  ) {
    this.factory = factory
    this.reset = reset
    this.maxSize = maxSize

    // Pre-allocate
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory())
    }
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!
    }
    return this.factory()
  }

  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.reset(obj)
      this.pool.push(obj)
    }
  }

  get size(): number {
    return this.pool.length
  }
}

// Pre-built pools for common objects
export const vector3Pool = new ObjectPool(
  () => new THREE.Vector3(),
  (v) => v.set(0, 0, 0),
  50,
  200
)

export const matrix4Pool = new ObjectPool(
  () => new THREE.Matrix4(),
  (m) => m.identity(),
  10,
  50
)

// ============================================================================
// Frustum Culling Helper - Skip rendering off-screen objects
// ============================================================================

export class FrustumCuller {
  private frustum = new THREE.Frustum()
  private projScreenMatrix = new THREE.Matrix4()

  update(camera: THREE.Camera): void {
    this.projScreenMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    )
    this.frustum.setFromProjectionMatrix(this.projScreenMatrix)
  }

  isVisible(object: THREE.Object3D): boolean {
    // Only works for Mesh objects with geometry
    if (!(object instanceof THREE.Mesh)) return true
    if (!object.geometry) return true
    
    // Use bounding sphere for fast check
    if (!object.geometry.boundingSphere) {
      object.geometry.computeBoundingSphere()
    }
    
    const sphere = object.geometry.boundingSphere!.clone()
    sphere.applyMatrix4(object.matrixWorld)
    
    return this.frustum.intersectsSphere(sphere)
  }

  isBoxVisible(box: THREE.Box3): boolean {
    return this.frustum.intersectsBox(box)
  }
}

// ============================================================================
// Animation LOD - Reduce animation updates for distant characters
// ============================================================================

export class AnimationLOD {
  private fullUpdateDistance = 15 // Full 60fps animation
  private halfUpdateDistance = 30 // 30fps animation
  private quarterUpdateDistance = 50 // 15fps animation
  
  private frameCounter = 0

  /**
   * Returns true if animation should update this frame
   */
  shouldUpdate(distance: number): boolean {
    this.frameCounter++
    
    if (distance < this.fullUpdateDistance) {
      return true // Every frame
    } else if (distance < this.halfUpdateDistance) {
      return this.frameCounter % 2 === 0 // Every other frame
    } else if (distance < this.quarterUpdateDistance) {
      return this.frameCounter % 4 === 0 // Every 4th frame
    } else {
      return this.frameCounter % 8 === 0 // Every 8th frame (far away)
    }
  }

  /**
   * Get time multiplier for animation delta
   * When skipping frames, multiply deltaTime to maintain speed
   */
  getTimeMultiplier(distance: number): number {
    if (distance < this.fullUpdateDistance) return 1
    if (distance < this.halfUpdateDistance) return 2
    if (distance < this.quarterUpdateDistance) return 4
    return 8
  }
}

// ============================================================================
// GPU Instancing Helper - For repeated objects (luggage, lights, etc.)
// ============================================================================

export class InstancedMeshBuilder {
  /**
   * Convert array of meshes with same geometry/material to instanced mesh
   */
  static createFromMeshes(
    meshes: THREE.Mesh[],
    maxInstances?: number
  ): THREE.InstancedMesh | null {
    if (meshes.length === 0) return null
    
    const count = maxInstances ?? meshes.length
    const template = meshes[0]
    
    const instancedMesh = new THREE.InstancedMesh(
      template.geometry,
      template.material,
      count
    )
    
    const matrix = new THREE.Matrix4()
    
    meshes.forEach((mesh, i) => {
      mesh.updateMatrixWorld()
      matrix.copy(mesh.matrixWorld)
      instancedMesh.setMatrixAt(i, matrix)
    })
    
    instancedMesh.instanceMatrix.needsUpdate = true
    instancedMesh.castShadow = template.castShadow
    instancedMesh.receiveShadow = template.receiveShadow
    
    return instancedMesh
  }
}

// ============================================================================
// Render Order Optimizer - Minimize state changes
// ============================================================================

export function optimizeRenderOrder(scene: THREE.Scene): void {
  const meshes: THREE.Mesh[] = []
  
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      meshes.push(obj)
    }
  })
  
  // Sort by material to minimize GPU state changes
  // Opaque first, then transparent (sorted back-to-front)
  meshes.sort((a, b) => {
    const matA = a.material as THREE.Material
    const matB = b.material as THREE.Material
    
    // Opaque before transparent
    if (matA.transparent !== matB.transparent) {
      return matA.transparent ? 1 : -1
    }
    
    // Same material type - group by material UUID
    return matA.uuid.localeCompare(matB.uuid)
  })
  
  // Assign render order
  meshes.forEach((mesh, i) => {
    mesh.renderOrder = i
  })
}

// ============================================================================
// Texture Optimization
// ============================================================================

export function optimizeTexture(texture: THREE.Texture): void {
  // Use mipmaps for better performance at distance
  texture.generateMipmaps = true
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  
  // Anisotropic filtering for textures at angles
  texture.anisotropy = Math.min(4, THREE.WebGLRenderer.prototype.capabilities?.getMaxAnisotropy?.() ?? 4)
}

// ============================================================================
// Shadow Optimization
// ============================================================================

export interface ShadowConfig {
  mapSize: number
  bias: number
  near: number
  far: number
  radius: number // For soft shadows
}

export const SHADOW_QUALITY = {
  low: { mapSize: 512, bias: -0.001, near: 0.5, far: 50, radius: 2 },
  medium: { mapSize: 1024, bias: -0.0005, near: 0.5, far: 50, radius: 1.5 },
  high: { mapSize: 2048, bias: -0.0003, near: 0.5, far: 50, radius: 1 },
} as const

export function configureShadowLight(
  light: THREE.DirectionalLight | THREE.SpotLight,
  quality: keyof typeof SHADOW_QUALITY
): void {
  const config = SHADOW_QUALITY[quality]
  
  light.shadow.mapSize.setScalar(config.mapSize)
  light.shadow.bias = config.bias
  light.shadow.camera.near = config.near
  light.shadow.camera.far = config.far
  light.shadow.radius = config.radius
}

// ============================================================================
// Draw Call Monitor
// ============================================================================

export class DrawCallMonitor {
  private history: number[] = []
  private maxHistory = 60

  update(renderer: THREE.WebGLRenderer): void {
    this.history.push(renderer.info.render.calls)
    if (this.history.length > this.maxHistory) {
      this.history.shift()
    }
  }

  getAverage(): number {
    if (this.history.length === 0) return 0
    return this.history.reduce((a, b) => a + b, 0) / this.history.length
  }

  getMax(): number {
    return Math.max(...this.history, 0)
  }

  getCurrent(): number {
    return this.history[this.history.length - 1] ?? 0
  }
}

// ============================================================================
// Preloader - Load assets before gameplay
// ============================================================================

export class AssetPreloader {
  private loadingManager: THREE.LoadingManager
  private textureLoader: THREE.TextureLoader
  private onProgress?: (loaded: number, total: number) => void

  constructor(onProgress?: (loaded: number, total: number) => void) {
    this.onProgress = onProgress
    this.loadingManager = new THREE.LoadingManager()
    this.textureLoader = new THREE.TextureLoader(this.loadingManager)

    this.loadingManager.onProgress = (_url, loaded, total) => {
      this.onProgress?.(loaded, total)
    }
  }

  async preloadTextures(urls: string[]): Promise<THREE.Texture[]> {
    const promises = urls.map(
      (url) =>
        new Promise<THREE.Texture>((resolve, reject) => {
          this.textureLoader.load(url, resolve, undefined, reject)
        })
    )
    return Promise.all(promises)
  }

  /**
   * Warm up GPU by rendering a hidden frame
   * This compiles shaders ahead of time
   */
  warmUpGPU(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera
  ): void {
    // Render one frame to compile all shaders
    renderer.compile(scene, camera)
  }
}
