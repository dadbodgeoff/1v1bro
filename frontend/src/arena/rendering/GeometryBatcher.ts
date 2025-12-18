/**
 * GeometryBatcher - Merges static geometry for optimal draw calls
 * 
 * Features:
 * - Automatic geometry merging by material
 * - Preserves UV coordinates
 * - Maintains shadow settings
 */

import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

interface BatchGroup {
  geometries: THREE.BufferGeometry[]
  material: THREE.Material
  castShadow: boolean
  receiveShadow: boolean
}

export class GeometryBatcher {
  private groups: Map<string, BatchGroup> = new Map()
  
  /**
   * Add a mesh to be batched
   */
  add(mesh: THREE.Mesh): void {
    const material = mesh.material as THREE.Material
    const key = this.getMaterialKey(material, mesh.castShadow, mesh.receiveShadow)
    
    if (!this.groups.has(key)) {
      this.groups.set(key, {
        geometries: [],
        material,
        castShadow: mesh.castShadow,
        receiveShadow: mesh.receiveShadow,
      })
    }
    
    // Clone geometry and apply world transform
    const geometry = mesh.geometry.clone()
    mesh.updateMatrixWorld()
    geometry.applyMatrix4(mesh.matrixWorld)
    
    this.groups.get(key)!.geometries.push(geometry)
  }
  
  /**
   * Add all meshes from a group
   */
  addGroup(group: THREE.Group): void {
    group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        this.add(obj)
      }
    })
  }
  
  /**
   * Build batched meshes
   */
  build(): THREE.Group {
    const result = new THREE.Group()
    result.name = 'batched-geometry'
    
    for (const [key, group] of this.groups) {
      if (group.geometries.length === 0) continue
      
      // Merge all geometries with same material
      const mergedGeometry = mergeGeometries(group.geometries, false)
      
      if (mergedGeometry) {
        const mesh = new THREE.Mesh(mergedGeometry, group.material)
        mesh.castShadow = group.castShadow
        mesh.receiveShadow = group.receiveShadow
        mesh.name = `batch-${key}`
        result.add(mesh)
      }
      
      // Dispose source geometries
      group.geometries.forEach(g => g.dispose())
    }
    
    this.groups.clear()
    return result
  }
  
  /**
   * Get stats about batching
   */
  getStats(): { groups: number; totalGeometries: number } {
    let totalGeometries = 0
    for (const group of this.groups.values()) {
      totalGeometries += group.geometries.length
    }
    return {
      groups: this.groups.size,
      totalGeometries,
    }
  }
  
  private getMaterialKey(
    material: THREE.Material,
    castShadow: boolean,
    receiveShadow: boolean
  ): string {
    return `${material.uuid}-${castShadow}-${receiveShadow}`
  }
}
