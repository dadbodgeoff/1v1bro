/**
 * ArenaRenderer - Enterprise-grade renderer for the arena
 * 
 * Features:
 * - Post-processing pipeline
 * - Optimized shadow mapping
 * - Environment mapping
 * - Performance monitoring
 * - Adaptive quality system
 * - Memory monitoring
 */

import * as THREE from 'three'
import { PostProcessingPipeline, type PostProcessingConfig } from './PostProcessing'
import { 
  getArenaQualityProfile, 
  onArenaQualityChange, 
  recordArenaFPS,
  type ArenaQualityProfile 
} from '../config/quality'
import { ArenaMemoryMonitor, type MemoryStats } from '../debug/MemoryMonitor'

export interface ArenaRendererConfig {
  antialias?: boolean
  shadows?: boolean
  shadowMapSize?: number
  postProcessing?: Partial<PostProcessingConfig>
  pixelRatio?: number
  toneMapping?: THREE.ToneMapping
  toneMappingExposure?: number
  useAdaptiveQuality?: boolean
}

const DEFAULT_CONFIG: ArenaRendererConfig = {
  antialias: true,
  shadows: true,
  shadowMapSize: 2048, // Higher res shadows
  pixelRatio: Math.min(window.devicePixelRatio, 2),
  toneMapping: THREE.ACESFilmicToneMapping,
  toneMappingExposure: 1.05, // Balanced exposure - prevents blown highlights
  useAdaptiveQuality: true,
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
  
  // Quality system
  private qualityProfile: ArenaQualityProfile
  private unsubscribeQuality: (() => void) | null = null
  
  // Memory monitoring
  private memoryMonitor: ArenaMemoryMonitor | null = null
  
  // ResizeObserver for container changes
  private resizeObserver: ResizeObserver | null = null
  private container: HTMLElement | null = null
  
  constructor(
    canvas: HTMLCanvasElement | null,
    config: ArenaRendererConfig = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.qualityProfile = getArenaQualityProfile()
    
    // Apply quality profile to config if adaptive quality enabled
    if (this.config.useAdaptiveQuality) {
      this.applyQualityProfile(this.qualityProfile)
    }
    
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas ?? undefined,
      antialias: this.config.antialias,
      powerPreference: 'high-performance',
      stencil: false, // Not needed, saves memory
    })
    
    this.setupRenderer()
    
    // Subscribe to quality changes
    if (this.config.useAdaptiveQuality) {
      this.unsubscribeQuality = onArenaQualityChange(this.handleQualityChange.bind(this))
    }
  }
  
  /**
   * Apply quality profile to renderer config
   */
  private applyQualityProfile(profile: ArenaQualityProfile): void {
    this.config.pixelRatio = Math.min(window.devicePixelRatio, profile.renderer.pixelRatio)
    this.config.antialias = profile.renderer.antialias
    this.config.shadows = profile.renderer.shadows
    this.config.shadowMapSize = profile.renderer.shadowMapSize
    
    if (!profile.renderer.postProcessing) {
      this.config.postProcessing = undefined
    }
  }
  
  /**
   * Handle runtime quality changes
   */
  private handleQualityChange(newProfile: ArenaQualityProfile): void {
    console.log('[ArenaRenderer] Quality changed to:', newProfile.name)
    this.qualityProfile = newProfile
    
    // Update pixel ratio
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, newProfile.renderer.pixelRatio))
    
    // Update shadows
    this.renderer.shadowMap.enabled = newProfile.renderer.shadows
    
    // Update post-processing
    if (!newProfile.renderer.postProcessing && this.postProcessing) {
      this.postProcessing.dispose()
      this.postProcessing = null
    } else if (newProfile.renderer.postProcessing && !this.postProcessing && this.scene && this.camera) {
      this.postProcessing = new PostProcessingPipeline(
        this.renderer,
        this.scene,
        this.camera,
        this.config.postProcessing
      )
    }
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
    
    // Setup post-processing (if quality allows)
    if (this.config.postProcessing !== null && this.qualityProfile.renderer.postProcessing) {
      this.postProcessing = new PostProcessingPipeline(
        this.renderer,
        scene,
        camera,
        this.config.postProcessing
      )
    }
    
    // Initialize memory monitor
    const budget = {
      textures: this.qualityProfile.textureMemoryBudget,
      geometry: this.qualityProfile.geometryMemoryBudget,
      total: this.qualityProfile.textureMemoryBudget + this.qualityProfile.geometryMemoryBudget,
    }
    this.memoryMonitor = new ArenaMemoryMonitor(this.renderer, scene, budget)
  }
  
  /**
   * Setup container with ResizeObserver for responsive resizing
   */
  setupContainer(container: HTMLElement): void {
    this.container = container
    
    // Use ResizeObserver for CSS-driven size changes
    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize()
    })
    this.resizeObserver.observe(container)
    
    // Also listen for window resize as fallback
    window.addEventListener('resize', this.handleResize)
  }
  
  /**
   * Handle resize events
   */
  private handleResize = (): void => {
    if (!this.container) return
    
    const rect = this.container.getBoundingClientRect()
    const width = rect.width || this.container.clientWidth
    const height = rect.height || this.container.clientHeight
    
    if (width === 0 || height === 0) return
    
    this.setSize(width, height)
    
    // Update camera aspect if it's a PerspectiveCamera
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = width / height
      this.camera.updateProjectionMatrix()
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
      
      // Record FPS for quality auto-adjustment
      if (this.config.useAdaptiveQuality) {
        recordArenaFPS(this.fps)
      }
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
   * Get memory stats
   */
  getMemoryStats(): MemoryStats | null {
    return this.memoryMonitor?.getStats() ?? null
  }
  
  /**
   * Log detailed memory breakdown
   */
  logMemoryBreakdown(): void {
    this.memoryMonitor?.logDetailedBreakdown()
  }
  
  /**
   * Get current quality profile
   */
  getQualityProfile(): ArenaQualityProfile {
    return this.qualityProfile
  }
  
  /**
   * Dispose all resources
   */
  dispose(): void {
    // Cleanup resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
    window.removeEventListener('resize', this.handleResize)
    
    // Unsubscribe from quality changes
    if (this.unsubscribeQuality) {
      this.unsubscribeQuality()
      this.unsubscribeQuality = null
    }
    
    this.postProcessing?.dispose()
    this.renderer.dispose()
  }
}
