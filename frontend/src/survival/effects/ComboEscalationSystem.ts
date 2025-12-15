/**
 * ComboEscalationSystem - Visual escalation based on combo level
 * Creates increasingly exciting visuals as combo builds
 */

import * as THREE from 'three'

export type ComboVisualLevel = 'none' | 'low' | 'medium' | 'high'

export interface ComboVisualState {
  level: ComboVisualLevel
  glowIntensity: number      // 0-1
  trailActive: boolean
  edgeGlowActive: boolean
}

export interface ComboEscalationConfig {
  lowThreshold: number       // Combo level for 'low' (default 5)
  mediumThreshold: number    // Combo level for 'medium' (default 10)
  highThreshold: number      // Combo level for 'high' (default 15)
  fadeOutDuration: number    // Seconds to fade out on reset (default 0.5)
}

const DEFAULT_CONFIG: ComboEscalationConfig = {
  lowThreshold: 5,
  mediumThreshold: 10,
  highThreshold: 15,
  fadeOutDuration: 0.5,
}

export class ComboEscalationSystem {
  private config: ComboEscalationConfig
  private currentCombo: number = 0
  private visualState: ComboVisualState
  private fadeTimer: number = 0
  private isFading: boolean = false
  private _previousLevel: ComboVisualLevel = 'none' // Reserved for future level transition effects
  
  // Edge glow overlay (optional, created on demand)
  private edgeGlowMesh: THREE.Mesh | null = null
  private edgeGlowMaterial: THREE.ShaderMaterial | null = null
  
  constructor(config: Partial<ComboEscalationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.visualState = {
      level: 'none',
      glowIntensity: 0,
      trailActive: false,
      edgeGlowActive: false,
    }
  }
  
  /**
   * Update combo value and recalculate visual state
   */
  setCombo(combo: number): void {
    const previousCombo = this.currentCombo
    this.currentCombo = combo
    
    // Check for combo reset
    if (combo === 0 && previousCombo > 0) {
      this.startFadeOut()
      return
    }
    
    // Cancel fade if combo is building again
    if (combo > 0 && this.isFading) {
      this.isFading = false
      this.fadeTimer = 0
    }
    
    // Update visual level
    this.updateVisualLevel()
  }
  
  /**
   * Get current combo value
   */
  getCombo(): number {
    return this.currentCombo
  }
  
  /**
   * Calculate visual level from combo
   */
  private updateVisualLevel(): void {
    this._previousLevel = this.visualState.level
    
    if (this.currentCombo >= this.config.highThreshold) {
      this.visualState.level = 'high'
      this.visualState.glowIntensity = 1.0
      this.visualState.trailActive = true
      this.visualState.edgeGlowActive = true
    } else if (this.currentCombo >= this.config.mediumThreshold) {
      this.visualState.level = 'medium'
      this.visualState.glowIntensity = 0.7
      this.visualState.trailActive = true
      this.visualState.edgeGlowActive = false
    } else if (this.currentCombo >= this.config.lowThreshold) {
      this.visualState.level = 'low'
      this.visualState.glowIntensity = 0.4
      this.visualState.trailActive = true
      this.visualState.edgeGlowActive = false
    } else {
      this.visualState.level = 'none'
      this.visualState.glowIntensity = 0
      this.visualState.trailActive = false
      this.visualState.edgeGlowActive = false
    }
  }
  
  /**
   * Start fade out animation on combo reset
   */
  private startFadeOut(): void {
    this.isFading = true
    this.fadeTimer = 0
    this._previousLevel = this.visualState.level
  }
  
  /**
   * Update visual state (call each frame)
   * @param delta Time since last update in seconds
   */
  update(delta: number): void {
    if (this.isFading) {
      this.fadeTimer += delta
      
      const progress = Math.min(1, this.fadeTimer / this.config.fadeOutDuration)
      
      // Fade out glow intensity
      this.visualState.glowIntensity *= (1 - progress * 0.1)
      
      if (progress >= 1) {
        // Fade complete
        this.isFading = false
        this.fadeTimer = 0
        this.visualState = {
          level: 'none',
          glowIntensity: 0,
          trailActive: false,
          edgeGlowActive: false,
        }
      }
    }
    
    // Update edge glow if active
    if (this.edgeGlowMaterial && this.visualState.edgeGlowActive) {
      this.edgeGlowMaterial.uniforms.intensity.value = this.visualState.glowIntensity
    }
  }
  
  /**
   * Get current visual state
   */
  getVisualState(): ComboVisualState {
    return { ...this.visualState }
  }
  
  /**
   * Get visual level for a given combo value (for testing)
   */
  static getVisualLevelForCombo(
    combo: number,
    config: ComboEscalationConfig = DEFAULT_CONFIG
  ): ComboVisualLevel {
    if (combo >= config.highThreshold) return 'high'
    if (combo >= config.mediumThreshold) return 'medium'
    if (combo >= config.lowThreshold) return 'low'
    return 'none'
  }
  
  /**
   * Check if currently fading out
   */
  isFadingOut(): boolean {
    return this.isFading
  }
  
  /**
   * Get fade progress (0-1)
   */
  getFadeProgress(): number {
    if (!this.isFading) return 0
    return Math.min(1, this.fadeTimer / this.config.fadeOutDuration)
  }
  
  /**
   * Create edge glow overlay mesh (call once, add to scene)
   */
  createEdgeGlowOverlay(camera: THREE.Camera): THREE.Mesh {
    // Simple vignette-style shader for edge glow
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `
    
    const fragmentShader = `
      uniform float intensity;
      uniform vec3 color;
      varying vec2 vUv;
      
      void main() {
        vec2 center = vUv - 0.5;
        float dist = length(center) * 2.0;
        float edge = smoothstep(0.5, 1.0, dist);
        float alpha = edge * intensity * 0.5;
        gl_FragColor = vec4(color, alpha);
      }
    `
    
    this.edgeGlowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        intensity: { value: 0 },
        color: { value: new THREE.Color(0xff00ff) },  // Magenta
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })
    
    const geometry = new THREE.PlaneGeometry(2, 2)
    this.edgeGlowMesh = new THREE.Mesh(geometry, this.edgeGlowMaterial)
    this.edgeGlowMesh.frustumCulled = false
    this.edgeGlowMesh.renderOrder = 9998
    
    camera.add(this.edgeGlowMesh)
    
    return this.edgeGlowMesh
  }
  
  /**
   * Reset to initial state
   */
  reset(): void {
    this.currentCombo = 0
    this.isFading = false
    this.fadeTimer = 0
    this._previousLevel = 'none'
    this.visualState = {
      level: 'none',
      glowIntensity: 0,
      trailActive: false,
      edgeGlowActive: false,
    }
    
    if (this.edgeGlowMaterial) {
      this.edgeGlowMaterial.uniforms.intensity.value = 0
    }
  }
  
  /**
   * Get previous visual level (for transition effects)
   */
  getPreviousLevel(): ComboVisualLevel {
    return this._previousLevel
  }
  
  /**
   * Dispose resources
   */
  dispose(): void {
    if (this.edgeGlowMesh) {
      this.edgeGlowMesh.geometry.dispose()
    }
    if (this.edgeGlowMaterial) {
      this.edgeGlowMaterial.dispose()
    }
  }
}
