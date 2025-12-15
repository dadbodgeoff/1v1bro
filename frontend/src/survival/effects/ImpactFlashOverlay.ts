/**
 * ImpactFlashOverlay - Screen flash effect for impacts
 * Creates brief white/red flash on collision for visual feedback
 */

import * as THREE from 'three'

export interface FlashConfig {
  duration: number        // Flash duration in seconds
  maxOpacity: number      // Peak opacity (0-1)
  normalColor: number     // Color for normal hits
  lethalColor: number     // Color for lethal hits
}

const DEFAULT_CONFIG: FlashConfig = {
  duration: 0.15,         // 150ms
  maxOpacity: 0.3,
  normalColor: 0xffffff,
  lethalColor: 0xff3333,
}

export class ImpactFlashOverlay {
  private mesh: THREE.Mesh
  private material: THREE.MeshBasicMaterial
  private config: FlashConfig
  
  private flashTimer: number = 0
  private flashDuration: number = 0
  private isFlashing: boolean = false
  
  constructor(camera: THREE.Camera, config: Partial<FlashConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    
    // Create full-screen quad
    // Position it close to the camera's near plane
    const geometry = new THREE.PlaneGeometry(100, 100)
    
    this.material = new THREE.MeshBasicMaterial({
      color: this.config.normalColor,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
    })
    
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.renderOrder = 9999  // Render on top of everything
    this.mesh.frustumCulled = false
    
    // Position in front of camera
    this.mesh.position.set(0, 0, -5)
    
    // Add to camera so it moves with view
    camera.add(this.mesh)
  }
  
  /**
   * Trigger a flash effect
   * @param isLethal Whether this is a lethal hit (red flash)
   */
  trigger(isLethal: boolean = false): void {
    this.material.color.setHex(
      isLethal ? this.config.lethalColor : this.config.normalColor
    )
    this.material.opacity = this.config.maxOpacity
    this.flashTimer = 0
    this.flashDuration = this.config.duration
    this.isFlashing = true
    this.mesh.visible = true
  }
  
  /**
   * Update flash fade
   * @param delta Time since last update in seconds
   */
  update(delta: number): void {
    if (!this.isFlashing) return
    
    this.flashTimer += delta
    
    if (this.flashTimer >= this.flashDuration) {
      // Flash complete
      this.material.opacity = 0
      this.isFlashing = false
      this.mesh.visible = false
    } else {
      // Linear fade from maxOpacity to 0
      const progress = this.flashTimer / this.flashDuration
      this.material.opacity = this.config.maxOpacity * (1 - progress)
    }
  }
  
  /**
   * Check if currently flashing
   */
  isActive(): boolean {
    return this.isFlashing
  }
  
  /**
   * Get current opacity (for testing)
   */
  getOpacity(): number {
    return this.material.opacity
  }
  
  /**
   * Get flash progress (0-1)
   */
  getProgress(): number {
    if (!this.isFlashing) return 0
    return this.flashTimer / this.flashDuration
  }
  
  /**
   * Reset flash state
   */
  reset(): void {
    this.material.opacity = 0
    this.isFlashing = false
    this.flashTimer = 0
    this.mesh.visible = false
  }
  
  /**
   * Dispose resources
   */
  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
