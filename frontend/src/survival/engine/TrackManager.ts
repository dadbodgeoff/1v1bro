/**
 * TrackManager - Handles infinite track generation and recycling
 * Manages track tiles and ensures seamless endless running
 * 
 * Enterprise Rendering Optimizations:
 * - InstancedMesh for all track tiles (1 draw call total)
 * - Zero allocations during gameplay (reusable transform objects)
 * - Shared geometry/materials across all instances
 * - Efficient tile recycling without scene graph manipulation
 * 
 * Mobile-optimized: Uses dynamic config for track scale
 */

import * as THREE from 'three'
import type { TrackTile } from '../types/survival'
import { getSurvivalConfig } from '../config/constants'

// Enterprise: Extended tile with instance index
interface InstancedTrackTile extends TrackTile {
  instanceIndex: number
}

export class TrackManager {
  private scene: THREE.Scene
  private tiles: InstancedTrackTile[] = []
  private tileTemplate: THREE.Group | null = null
  private tileDepth: number
  private tileCount: number = 10 // Optimized model allows more tiles
  private nextTileId: number = 0
  
  // Config values (from dynamic config)
  private trackScale: number
  
  // Enterprise: Instanced rendering
  private instancedMesh: THREE.InstancedMesh | null = null
  private useInstancing: boolean = false
  
  // Enterprise: Reusable transform objects (avoid allocations)
  private tempMatrix: THREE.Matrix4 = new THREE.Matrix4()
  private tempPosition: THREE.Vector3 = new THREE.Vector3()
  private tempQuaternion: THREE.Quaternion = new THREE.Quaternion()
  private tempScale: THREE.Vector3 = new THREE.Vector3()

  constructor(scene: THREE.Scene) {
    this.scene = scene
    
    // Get config values
    const config = getSurvivalConfig()
    this.trackScale = config.trackScale
    this.tileDepth = config.trackTileDepth
  }

  /**
   * Initialize the track with a template model
   * Enterprise: Creates InstancedMesh for single draw call rendering
   */
  initialize(
    tileModel: THREE.Group,
    scale: number = this.trackScale
  ): void {
    // Apply scale and rotation to template
    this.tileTemplate = tileModel.clone()
    this.tileTemplate.scale.set(scale, scale, scale)
    this.tileTemplate.rotation.y = Math.PI / 2 // Rotate to face -Z direction

    // Calculate actual tile depth after scaling
    const box = new THREE.Box3().setFromObject(this.tileTemplate)
    const size = box.getSize(new THREE.Vector3())
    this.tileDepth = size.z
    
    // Store scale for instancing
    this.tempScale.set(scale, scale, scale)
    // Store rotation for instancing
    this.tempQuaternion.setFromEuler(new THREE.Euler(0, Math.PI / 2, 0))

    // Debug: Count triangles in the model
    let triangleCount = 0
    this.tileTemplate.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const geo = child.geometry
        if (geo.index) {
          triangleCount += geo.index.count / 3
        } else if (geo.attributes.position) {
          triangleCount += geo.attributes.position.count / 3
        }
      }
    })



    // Enterprise: Try to create instanced mesh for optimal rendering
    this.createInstancedMesh(scale)

    // Create initial tiles
    this.createInitialTiles()
  }
  
  /**
   * Enterprise: Create InstancedMesh from template for single draw call
   */
  private createInstancedMesh(_scale: number): void {
    if (!this.tileTemplate) return
    
    // Find the first mesh in the template
    let geometry: THREE.BufferGeometry | null = null
    let material: THREE.Material | THREE.Material[] | null = null
    
    this.tileTemplate.traverse((child) => {
      if (child instanceof THREE.Mesh && !geometry) {
        geometry = child.geometry
        material = child.material
      }
    })
    
    if (!geometry || !material) {
      console.log('[TrackManager] Could not extract geometry for instancing, using clone fallback')
      return
    }
    
    // Create instanced mesh
    this.instancedMesh = new THREE.InstancedMesh(
      geometry,
      material,
      this.tileCount
    )
    this.instancedMesh.frustumCulled = false // Track is always visible
    this.scene.add(this.instancedMesh)
    this.useInstancing = true
  }

  /**
   * Create the initial set of track tiles
   * Enterprise: Uses instancing when available
   */
  private createInitialTiles(): void {
    if (!this.tileTemplate) return

    for (let i = 0; i < this.tileCount; i++) {
      const z = this.tileDepth - (this.tileDepth * i)
      const tile = this.createTile(i, z)
      this.tiles.push(tile)
      
      // Enterprise: Update instance matrix or add cloned mesh
      if (this.useInstancing && this.instancedMesh) {
        this.updateInstanceTransform(i, z)
      } else {
        tile.mesh.position.z = z
        this.scene.add(tile.mesh)
      }
    }
    
    // Enterprise: Mark instance matrix as needing update
    if (this.instancedMesh) {
      this.instancedMesh.instanceMatrix.needsUpdate = true
    }
  }

  /**
   * Create a single track tile
   * Enterprise: Creates lightweight record for instanced tiles
   */
  private createTile(instanceIndex: number, z: number): InstancedTrackTile {
    if (!this.tileTemplate) {
      throw new Error('TrackManager not initialized')
    }

    // Enterprise: For instanced rendering, we don't need a real mesh per tile
    // Just create a placeholder group for API compatibility
    const mesh = this.useInstancing 
      ? new THREE.Group() // Lightweight placeholder
      : this.cloneWithSharedGeometry(this.tileTemplate)
    
    mesh.userData.isTrackTile = true

    return {
      id: `tile-${this.nextTileId++}`,
      z,
      mesh,
      instanceIndex,
    }
  }
  
  /**
   * Enterprise: Update instance transform matrix (zero allocation)
   */
  private updateInstanceTransform(instanceIndex: number, z: number): void {
    if (!this.instancedMesh) return
    
    this.tempPosition.set(0, 0, z)
    this.tempMatrix.compose(this.tempPosition, this.tempQuaternion, this.tempScale)
    this.instancedMesh.setMatrixAt(instanceIndex, this.tempMatrix)
  }

  /**
   * Clone a group while sharing geometry and materials (saves GPU memory)
   * Used as fallback when instancing isn't available
   */
  private cloneWithSharedGeometry(source: THREE.Group): THREE.Group {
    // Use standard clone - Three.js clone() already shares geometry/materials by default
    // Only the Object3D structure is duplicated, not the underlying buffers
    const clone = source.clone()
    return clone
  }

  /**
   * Update track tiles based on player position
   * Enterprise: Recycles tiles via instance matrix updates (zero allocation)
   */
  update(playerZ: number): void {
    const recycleThreshold = playerZ + this.tileDepth * 2 // Behind player
    let needsMatrixUpdate = false

    // Find frontmost tile ONCE before the loop (avoid repeated array operations)
    let frontmostZ = Infinity
    for (let i = 0; i < this.tiles.length; i++) {
      if (this.tiles[i].z < frontmostZ) {
        frontmostZ = this.tiles[i].z
      }
    }

    for (let i = 0; i < this.tiles.length; i++) {
      const tile = this.tiles[i]

      // Check if tile is behind player and needs recycling
      if (tile.z > recycleThreshold) {
        // Move this tile to the front
        const newZ = frontmostZ - this.tileDepth
        tile.z = newZ
        
        // Enterprise: Update via instancing or direct mesh position
        if (this.useInstancing) {
          this.updateInstanceTransform(tile.instanceIndex, newZ)
          needsMatrixUpdate = true
        } else {
          tile.mesh.position.z = newZ
        }
        
        // Update frontmost for next recycled tile
        frontmostZ = newZ
      }
    }
    
    // Enterprise: Batch update instance matrix
    if (needsMatrixUpdate && this.instancedMesh) {
      this.instancedMesh.instanceMatrix.needsUpdate = true
    }
  }

  /**
   * Get the depth of a single tile
   */
  getTileDepth(): number {
    return this.tileDepth
  }

  /**
   * Get all current tiles
   */
  getTiles(): TrackTile[] {
    return this.tiles
  }
  
  /**
   * Enterprise: Check if using instanced rendering
   */
  isUsingInstancing(): boolean {
    return this.useInstancing
  }
  
  /**
   * Get meshes suitable for raycasting (physics collision detection)
   * Returns the actual renderable meshes, not placeholder groups
   */
  getRaycastMeshes(): THREE.Object3D[] {
    if (this.useInstancing && this.instancedMesh) {
      // Return the instanced mesh for raycasting
      return [this.instancedMesh]
    }
    // Fallback: return the cloned tile meshes
    return this.tiles.map(t => t.mesh)
  }

  /**
   * Reset track tiles to initial positions (for play again)
   * Does NOT dispose/recreate - just repositions existing tiles
   */
  reset(): void {
    if (this.tiles.length === 0) {
      console.warn('[TrackManager] Cannot reset - no tiles exist')
      return
    }

    // Reposition all tiles to initial layout
    for (let i = 0; i < this.tiles.length; i++) {
      const z = this.tileDepth - (this.tileDepth * i)
      this.tiles[i].z = z

      if (this.useInstancing && this.instancedMesh) {
        this.updateInstanceTransform(this.tiles[i].instanceIndex, z)
      } else {
        this.tiles[i].mesh.position.z = z
      }
    }

    // Update instance matrix if using instancing
    if (this.instancedMesh) {
      this.instancedMesh.instanceMatrix.needsUpdate = true
    }

    console.log('[TrackManager] Reset - tiles repositioned to initial layout')
  }
  
  /**
   * Enterprise: Get rendering stats
   */
  getRenderStats(): { tileCount: number; drawCalls: number; instanced: boolean } {
    return {
      tileCount: this.tiles.length,
      drawCalls: this.useInstancing ? 1 : this.tiles.length,
      instanced: this.useInstancing
    }
  }

  /**
   * Clean up all tiles
   * Enterprise: Properly disposes instanced mesh
   */
  dispose(): void {
    // Enterprise: Dispose instanced mesh
    if (this.instancedMesh) {
      this.scene.remove(this.instancedMesh)
      this.instancedMesh.geometry.dispose()
      if (Array.isArray(this.instancedMesh.material)) {
        this.instancedMesh.material.forEach(m => m.dispose())
      } else {
        this.instancedMesh.material.dispose()
      }
      this.instancedMesh = null
    }
    
    // Dispose cloned tiles (fallback mode)
    if (!this.useInstancing) {
      this.tiles.forEach(tile => {
        this.scene.remove(tile.mesh)
        tile.mesh.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            child.geometry?.dispose()
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose())
            } else {
              child.material?.dispose()
            }
          }
        })
      })
    }
    
    this.tiles = []
    this.tileTemplate = null
    this.useInstancing = false
  }
}
