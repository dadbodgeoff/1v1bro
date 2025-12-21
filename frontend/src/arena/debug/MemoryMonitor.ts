/**
 * MemoryMonitor - Track GPU memory usage for arena
 * Ported from survival runner
 * 
 * Features:
 * - Texture memory tracking
 * - Geometry memory tracking
 * - Budget warnings
 * - Detailed breakdown logging
 */

import * as THREE from 'three'

export interface MemoryBudget {
  textures: number  // MB
  geometry: number  // MB
  total: number     // MB
}

export interface MemoryStats {
  textures: number      // MB
  geometries: number    // MB
  total: number         // MB
  textureCount: number
  geometryCount: number
  drawCalls: number
  triangles: number
  isOverBudget: boolean
  budgetUsagePercent: number
}

export class ArenaMemoryMonitor {
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private budget: MemoryBudget
  private lastWarningTime = 0
  private readonly WARNING_INTERVAL = 10000 // 10 seconds between warnings

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, budget?: MemoryBudget) {
    this.renderer = renderer
    this.scene = scene
    this.budget = budget ?? { textures: 256, geometry: 128, total: 512 }
  }

  /**
   * Get current memory stats
   */
  getStats(): MemoryStats {
    const info = this.renderer.info
    const memory = info.memory

    // Estimate texture memory (rough approximation)
    // Average texture is ~4MB at 1024x1024 RGBA
    const textureMemory = memory.textures * 4

    // Estimate geometry memory
    // BufferGeometry memory is tracked by Three.js
    const geometryMemory = memory.geometries * 0.5 // Rough estimate

    const total = textureMemory + geometryMemory
    const isOverBudget = total > this.budget.total
    const budgetUsagePercent = (total / this.budget.total) * 100

    // Log warning if over budget (throttled)
    if (isOverBudget && performance.now() - this.lastWarningTime > this.WARNING_INTERVAL) {
      this.lastWarningTime = performance.now()
      console.warn(`[ArenaMemory] Over budget! ${total.toFixed(1)}MB / ${this.budget.total}MB`)
    }

    return {
      textures: textureMemory,
      geometries: geometryMemory,
      total,
      textureCount: memory.textures,
      geometryCount: memory.geometries,
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      isOverBudget,
      budgetUsagePercent,
    }
  }

  /**
   * Log detailed memory breakdown to console
   */
  logDetailedBreakdown(): void {
    const stats = this.getStats()
    console.group('[ArenaMemory] Detailed Breakdown')
    console.log(`Textures: ${stats.textureCount} (${stats.textures.toFixed(1)}MB)`)
    console.log(`Geometries: ${stats.geometryCount} (${stats.geometries.toFixed(1)}MB)`)
    console.log(`Total: ${stats.total.toFixed(1)}MB / ${this.budget.total}MB (${stats.budgetUsagePercent.toFixed(1)}%)`)
    console.log(`Draw Calls: ${stats.drawCalls}`)
    console.log(`Triangles: ${stats.triangles.toLocaleString()}`)
    
    // Count objects by type
    let meshCount = 0
    let skinnedMeshCount = 0
    let lightCount = 0
    
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.SkinnedMesh) skinnedMeshCount++
      else if (obj instanceof THREE.Mesh) meshCount++
      else if (obj instanceof THREE.Light) lightCount++
    })
    
    console.log(`Meshes: ${meshCount}, Skinned: ${skinnedMeshCount}, Lights: ${lightCount}`)
    console.groupEnd()
  }

  /**
   * Set memory budget
   */
  setBudget(budget: MemoryBudget): void {
    this.budget = budget
  }

  /**
   * Check if a specific category is over budget
   */
  isTextureOverBudget(): boolean {
    const stats = this.getStats()
    return stats.textures > this.budget.textures
  }

  isGeometryOverBudget(): boolean {
    const stats = this.getStats()
    return stats.geometries > this.budget.geometry
  }
}
