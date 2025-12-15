/**
 * MemoryMonitor - Track WebGL/Three.js memory usage
 * 
 * Provides real-time memory estimates for:
 * - Geometry (vertices, indices)
 * - Textures (based on dimensions and format)
 * - Total GPU memory estimate
 * 
 * NOTE: Browser DevTools "Memory" shows JS Heap (800MB+ is normal for 3D games)
 * This monitor tracks GPU VRAM which is what matters for mobile crashes.
 * 
 * iOS Safari limit: ~256MB WebGL memory
 * Desktop Chrome: ~2GB+ WebGL memory
 */

import * as THREE from 'three'

export interface MemoryStats {
  // Geometry memory
  geometries: number
  geometryMemoryMB: number
  vertices: number
  triangles: number
  
  // Texture memory
  textures: number
  textureMemoryMB: number
  
  // Programs/shaders
  programs: number
  
  // Totals
  totalEstimatedMB: number
  
  // Draw calls (performance indicator)
  drawCalls: number
  
  // Budget tracking
  budgetMB: number
  budgetUsedPercent: number
  isOverBudget: boolean
}

export interface MemoryBudget {
  textures: number  // MB
  geometry: number  // MB
  total: number     // MB
}

/**
 * Calculate memory used by a texture
 */
function estimateTextureMemory(texture: THREE.Texture): number {
  if (!texture.image) return 0
  
  const img = texture.image as { width?: number; height?: number }
  const width = img.width || 1
  const height = img.height || 1
  
  // Bytes per pixel based on format
  let bytesPerPixel = 4 // RGBA default
  
  if (texture.format === THREE.RGBFormat) {
    bytesPerPixel = 3
  } else if (texture.format === THREE.RedFormat || texture.format === THREE.AlphaFormat) {
    bytesPerPixel = 1
  } else if (texture.format === THREE.RGFormat) {
    bytesPerPixel = 2
  }
  
  // Data type multiplier
  let typeMultiplier = 1
  if (texture.type === THREE.FloatType) {
    typeMultiplier = 4
  } else if (texture.type === THREE.HalfFloatType) {
    typeMultiplier = 2
  }
  
  // Base memory
  let memory = width * height * bytesPerPixel * typeMultiplier
  
  // Mipmaps roughly add 33% more memory
  if (texture.generateMipmaps) {
    memory *= 1.33
  }
  
  return memory
}

/**
 * Calculate memory used by geometry
 */
function estimateGeometryMemory(geometry: THREE.BufferGeometry): number {
  let memory = 0
  
  const attributes = geometry.attributes
  for (const name in attributes) {
    const attr = attributes[name]
    if (attr && attr.array) {
      memory += attr.array.byteLength
    }
  }
  
  // Index buffer
  if (geometry.index && geometry.index.array) {
    memory += geometry.index.array.byteLength
  }
  
  return memory
}

/**
 * MemoryMonitor class - tracks Three.js scene memory usage
 */
export class MemoryMonitor {
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private budget: MemoryBudget
  private lastStats: MemoryStats | null = null
  private updateInterval: number = 1000 // Update every second
  private lastUpdate: number = 0
  
  constructor(
    renderer: THREE.WebGLRenderer, 
    scene: THREE.Scene,
    budget: MemoryBudget = { textures: 64, geometry: 32, total: 128 }
  ) {
    this.renderer = renderer
    this.scene = scene
    this.budget = budget
  }
  
  /**
   * Set memory budget (in MB)
   */
  setBudget(budget: Partial<MemoryBudget>): void {
    this.budget = { ...this.budget, ...budget }
  }
  
  /**
   * Get current memory stats
   * @param forceUpdate - Force recalculation even if within update interval
   */
  getStats(forceUpdate = false): MemoryStats {
    const now = performance.now()
    
    // Return cached stats if within update interval
    if (!forceUpdate && this.lastStats && (now - this.lastUpdate) < this.updateInterval) {
      return this.lastStats
    }
    
    const info = this.renderer.info
    
    // Calculate texture memory
    let textureMemoryBytes = 0
    const textureCache = new Set<THREE.Texture>()
    
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Line) {
        const material = object.material
        const materials = Array.isArray(material) ? material : [material]
        
        for (const mat of materials) {
          if (!mat) continue
          
          // Check all texture properties
          const textureProps = [
            'map', 'normalMap', 'roughnessMap', 'metalnessMap', 
            'aoMap', 'emissiveMap', 'envMap', 'lightMap',
            'bumpMap', 'displacementMap', 'alphaMap'
          ]
          
          for (const prop of textureProps) {
            const tex = (mat as Record<string, unknown>)[prop] as THREE.Texture | undefined
            if (tex && !textureCache.has(tex)) {
              textureCache.add(tex)
              textureMemoryBytes += estimateTextureMemory(tex)
            }
          }
        }
      }
    })
    
    // Calculate geometry memory
    let geometryMemoryBytes = 0
    const geometryCache = new Set<THREE.BufferGeometry>()
    
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Line) {
        const geo = object.geometry
        if (geo && !geometryCache.has(geo)) {
          geometryCache.add(geo)
          geometryMemoryBytes += estimateGeometryMemory(geo)
        }
      }
    })
    
    // Convert to MB
    const textureMemoryMB = textureMemoryBytes / (1024 * 1024)
    const geometryMemoryMB = geometryMemoryBytes / (1024 * 1024)
    const totalEstimatedMB = textureMemoryMB + geometryMemoryMB
    
    const stats: MemoryStats = {
      geometries: info.memory.geometries,
      geometryMemoryMB: Math.round(geometryMemoryMB * 100) / 100,
      vertices: info.render.triangles * 3, // Approximate
      triangles: info.render.triangles,
      
      textures: info.memory.textures,
      textureMemoryMB: Math.round(textureMemoryMB * 100) / 100,
      
      programs: info.programs?.length || 0,
      
      totalEstimatedMB: Math.round(totalEstimatedMB * 100) / 100,
      
      drawCalls: info.render.calls,
      
      budgetMB: this.budget.total,
      budgetUsedPercent: Math.round((totalEstimatedMB / this.budget.total) * 100),
      isOverBudget: totalEstimatedMB > this.budget.total,
    }
    
    this.lastStats = stats
    this.lastUpdate = now
    
    return stats
  }
  
  /**
   * Log detailed memory breakdown to console
   */
  logDetailedBreakdown(): void {
    const stats = this.getStats(true)
    
    // Get JS heap if available (Chrome only)
    const perfWithMemory = performance as unknown as { memory?: { usedJSHeapSize: number } }
    const jsHeapMB = perfWithMemory.memory
      ? (perfWithMemory.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1)
      : 'N/A'
    
    console.group('🎮 Memory Usage Breakdown')
    console.log('')
    console.log('═══════════════════════════════════════════')
    console.log('  GPU VRAM (what matters for mobile):')
    console.log('═══════════════════════════════════════════')
    console.log(`  📊 Total GPU: ${stats.totalEstimatedMB.toFixed(2)} MB / ${stats.budgetMB} MB (${stats.budgetUsedPercent}%)`)
    console.log(`  🖼️ Textures: ${stats.textureMemoryMB.toFixed(2)} MB (${stats.textures} textures)`)
    console.log(`  📐 Geometry: ${stats.geometryMemoryMB.toFixed(2)} MB (${stats.geometries} geometries)`)
    console.log(`  🔺 Triangles: ${stats.triangles.toLocaleString()}`)
    console.log(`  🎨 Shaders: ${stats.programs} programs`)
    console.log(`  📞 Draw Calls: ${stats.drawCalls}`)
    console.log('')
    console.log('═══════════════════════════════════════════')
    console.log('  JS Heap (normal to be high for 3D games):')
    console.log('═══════════════════════════════════════════')
    console.log(`  💾 JS Heap: ${jsHeapMB} MB`)
    console.log('  ℹ️  800MB+ is normal - includes Three.js objects,')
    console.log('     React state, cached data, event handlers, etc.')
    console.log('')
    
    if (stats.isOverBudget) {
      console.warn(`⚠️ GPU OVER BUDGET by ${(stats.totalEstimatedMB - stats.budgetMB).toFixed(2)} MB!`)
    } else {
      console.log(`✅ GPU memory within budget`)
    }
    
    console.groupEnd()
  }
  
  /**
   * Get a formatted string for display
   */
  getDisplayString(): string {
    const stats = this.getStats()
    return `${stats.totalEstimatedMB.toFixed(1)}/${stats.budgetMB}MB (${stats.budgetUsedPercent}%)`
  }
}

/**
 * Create a memory monitor instance
 */
export function createMemoryMonitor(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  budget?: MemoryBudget
): MemoryMonitor {
  return new MemoryMonitor(renderer, scene, budget)
}
