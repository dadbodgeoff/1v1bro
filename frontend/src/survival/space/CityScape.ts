/**
 * CityScape - Cyberpunk city skyline below the track
 * Creates the "elevated highway over a metropolis" effect
 */

import * as THREE from 'three'

export interface CityScapeConfig {
  scale: number
  yOffset: number // How far below the track
  xOffset: number // How far to the sides
  zSpacing: number // Distance between city instances along Z
  instanceCount: number // How many city instances per side
}

const DEFAULT_CONFIG: CityScapeConfig = {
  scale: 60, // Good size
  yOffset: -25, // Lower so buildings don't poke through bridge
  xOffset: 15, // Close to track/bridge
  zSpacing: 120, // Tighter spacing
  instanceCount: 8, // Good coverage
}

export class CityScape {
  private scene: THREE.Scene
  private config: CityScapeConfig
  private cityModel: THREE.Group | null = null
  private instances: THREE.Group[] = []
  private initialized: boolean = false

  constructor(scene: THREE.Scene, config: Partial<CityScapeConfig> = {}) {
    this.scene = scene
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Register the city model (call after loading)
   */
  registerModel(model: THREE.Group): void {
    this.cityModel = model
    this.createInstances()
    this.initialized = true
    console.log('[CityScape] City model registered and instances created')
  }

  /**
   * Create city instances on both sides of the track
   * Enterprise-grade rendering optimizations:
   * - Frustum culling for off-screen objects
   * - Render order for proper depth sorting
   * - Material optimization (reduced overdraw)
   * - Bounding box computation for efficient culling
   */
  private createInstances(): void {
    if (!this.cityModel) return

    const { scale, yOffset, xOffset, zSpacing, instanceCount } = this.config

    // Clear existing instances
    this.instances.forEach(inst => this.scene.remove(inst))
    this.instances = []

    // Pre-optimize the source model materials once
    this.optimizeModelMaterials(this.cityModel)

    // Create instances on both sides
    for (let i = 0; i < instanceCount; i++) {
      const zPos = -i * zSpacing

      // Left side
      const leftCity = this.cityModel.clone()
      leftCity.scale.setScalar(scale)
      leftCity.position.set(-xOffset, yOffset, zPos)
      leftCity.rotation.y = Math.PI * 0.1 // Slight angle toward track
      this.applyRenderOptimizations(leftCity)
      this.scene.add(leftCity)
      this.instances.push(leftCity)

      // Right side (mirrored)
      const rightCity = this.cityModel.clone()
      rightCity.scale.setScalar(scale)
      rightCity.position.set(xOffset, yOffset, zPos)
      rightCity.rotation.y = -Math.PI * 0.1 // Slight angle toward track
      this.applyRenderOptimizations(rightCity)
      this.scene.add(rightCity)
      this.instances.push(rightCity)
    }
  }

  /**
   * Optimize materials on the source model (called once)
   */
  private optimizeModelMaterials(model: THREE.Group): void {
    model.traverse(obj => {
      if (obj instanceof THREE.Mesh && obj.material) {
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
        materials.forEach(mat => {
          // Reduce precision for distant background objects
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.envMapIntensity = 0.3 // Reduce reflection intensity
            mat.roughness = Math.max(mat.roughness, 0.5) // Less shiny = less GPU work
          }
          // Disable features we don't need for background scenery
          mat.fog = false // Cities don't need fog
          mat.needsUpdate = true
        })
      }
    })
  }

  /**
   * Apply render optimizations to a city instance
   */
  private applyRenderOptimizations(city: THREE.Group): void {
    // Enable frustum culling at group level
    city.frustumCulled = true
    city.renderOrder = -10 // Render behind track/player

    // Compute bounding box for efficient culling
    const box = new THREE.Box3().setFromObject(city)
    city.userData.boundingBox = box

    // Apply to all child meshes
    city.traverse(obj => {
      if (obj instanceof THREE.Mesh) {
        obj.frustumCulled = true
        obj.castShadow = false // Background doesn't cast shadows
        obj.receiveShadow = false // Background doesn't receive shadows
        obj.renderOrder = -10

        // Freeze matrix for static objects (performance boost)
        obj.matrixAutoUpdate = false
        obj.updateMatrix()
      }
    })

    // Update matrices once after positioning
    city.updateMatrixWorld(true)
  }

  /**
   * Update city positions to follow player (infinite scrolling)
   * Uses dirty flag pattern to minimize matrix recalculations
   */
  update(playerZ: number): void {
    if (!this.initialized || this.instances.length === 0) return

    const { zSpacing, instanceCount } = this.config
    const totalLength = zSpacing * instanceCount

    // Move instances that are too far behind to the front
    this.instances.forEach(city => {
      // If city is too far behind player, wrap it forward
      if (city.position.z > playerZ + zSpacing) {
        city.position.z -= totalLength
        // Only update matrix when position changes
        city.updateMatrixWorld(true)
        // Re-freeze child matrices after move
        city.traverse(obj => {
          if (obj instanceof THREE.Mesh) {
            obj.updateMatrix()
          }
        })
      }
    })
  }

  /**
   * Get the group containing all city instances
   */
  getInstances(): THREE.Group[] {
    return this.instances
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.instances.forEach(inst => {
      this.scene.remove(inst)
      inst.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose()
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose())
          } else {
            obj.material?.dispose()
          }
        }
      })
    })
    this.instances = []
    this.cityModel = null
    this.initialized = false
  }
}
