/**
 * ArenaRenderer - Enterprise-grade renderer for the arena
 * 
 * Features:
 * - Post-processing pipeline
 * - Optimized shadow mapping
 * - Environment mapping
 * - Performance monitoring
 */

import * as THREE from 'three'
import { PostProcessingPipeline, type PostProcessingConfig } from './PostProcessing'

export interface ArenaRendererConfig {
  antialias?: boolean
  shadows?: boolean
  shadowMapSize?: number
  postProcessing?: Partial<PostProcessingConfig>
  pixelRatio?: number
  toneMapping?: THREE.ToneMapping
  toneMappingExposure?: number
}

const DEFAULT_CONFIG: ArenaRendererConfig = {
  antialias: true,
  shadows: true,
  shadowMapSize: 2048, // Higher res shadows
  pixelRatio: Math.min(window.devicePixelRatio, 2),
  toneMapping: THREE.ACESFilmicToneMapping,
  toneMappingExposure: 1.2, // Slightly brighter
}

export class ArenaRenderer {
  public readonly renderer: THREE.WebGLRenderer
  private postProcessing: PostProcessingPipeline | null = null
  private scene: THREE.Scene | null = null
  private camera: THREE.Camera | null = null
  private config: ArenaRendererConfig
  
  // Performance tracking
  private frameCount = 0
  private lastFpsUpdate = 0
  private fps = 0
  
  constructor(
    canvas: HTMLCanvasElement | null,
    config: ArenaRendererConfig = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas ?? undefined,
      antialias: this.config.antialias,
      powerPreference: 'high-performance',
      stencil: false, // Not needed, saves memory
    })
    
    this.setupRenderer()
  }
  
  private setupRenderer(): void {
    const { renderer, config } = this
    
    renderer.setPixelRatio(config.pixelRatio!)
    renderer.toneMapping = config.toneMapping!
    renderer.toneMappingExposure = config.toneMappingExposure!
    
    // Shadow configuration
    if (config.shadows) {
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
    }
    
    // Output encoding
    renderer.outputColorSpace = THREE.SRGBColorSpace
  }
  
  /**
   * Initialize with scene and camera
   */
  initialize(scene: THREE.Scene, camera: THREE.Camera): void {
    this.scene = scene
    this.camera = camera
    
    // Setup post-processing
    if (this.config.postProcessing !== null) {
      this.postProcessing = new PostProcessingPipeline(
        this.renderer,
        scene,
        camera,
        this.config.postProcessing
      )
    }
  }
  
  /**
   * Render a frame
   */
  render(): void {
    if (!this.scene || !this.camera) return
    
    // Track FPS
    this.frameCount++
    const now = performance.now()
    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = this.frameCount
      this.frameCount = 0
      this.lastFpsUpdate = now
    }
    
    // Render with or without post-processing
    if (this.postProcessing) {
      this.postProcessing.render()
    } else {
      this.renderer.render(this.scene, this.camera)
    }
  }
  
  /**
   * Handle resize
   */
  setSize(width: number, height: number): void {
    this.renderer.setSize(width, height)
    this.postProcessing?.setSize(width, height)
  }
  
  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.fps
  }
  
  /**
   * Get renderer info for debugging
   */
  getInfo(): THREE.WebGLInfo {
    return this.renderer.info
  }
  
  /**
   * Get draw call count
   */
  getDrawCalls(): number {
    return this.renderer.info.render.calls
  }
  
  /**
   * Get triangle count
   */
  getTriangles(): number {
    return this.renderer.info.render.triangles
  }
  
  /**
   * Enable/disable post-processing
   */
  setPostProcessingEnabled(enabled: boolean): void {
    if (enabled && !this.postProcessing && this.scene && this.camera) {
      this.postProcessing = new PostProcessingPipeline(
        this.renderer,
        this.scene,
        this.camera,
        this.config.postProcessing
      )
    } else if (!enabled && this.postProcessing) {
      this.postProcessing.dispose()
      this.postProcessing = null
    }
  }
  
  /**
   * Dispose all resources
   */
  dispose(): void {
    this.postProcessing?.dispose()
    this.renderer.dispose()
  }
}
