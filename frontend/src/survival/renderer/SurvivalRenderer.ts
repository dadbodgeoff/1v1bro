/**
 * SurvivalRenderer - Three.js scene setup and rendering for Survival Mode
 * Handles camera, lighting, and render loop
 * 
 * Features:
 * - Enterprise-grade space background with stars, nebula, and celestials
 * - Adaptive quality based on device capabilities
 * - Mobile-optimized rendering pipeline
 */

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { COLORS } from '../config/constants'
import { getRendererConfig } from '../config/constants'
import { getQualityProfile, onQualityChange, recordFPSForQuality, type QualityProfile } from '../config/quality'
import { getDeviceCapabilities } from '../config/device'
import { SpaceBackground } from '../space'
import type { CelestialType } from '../space'
import { MemoryMonitor, type MemoryStats, type MemoryBudget } from '../debug/MemoryMonitor'

export class SurvivalRenderer {
  private container: HTMLElement
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls
  private animationId: number | null = null
  private onRender: ((delta: number) => void) | null = null
  private lastTime: number = 0

  // Configuration (derived from device/quality)
  private rendererConfig = getRendererConfig()
  private qualityProfile = getQualityProfile()
  private unsubscribeQuality: (() => void) | null = null

  // Reference to the player-following lights for efficient updates
  private playerLight: THREE.PointLight | null = null
  private characterSpotlight: THREE.SpotLight | null = null
  private characterFillLight: THREE.DirectionalLight | null = null

  // Space background system
  private spaceBackground: SpaceBackground | null = null

  // AAA Feature: Speed lines effect
  private speedLines: THREE.LineSegments | null = null
  private speedLinesOpacity: number = 0
  private speedLinesMaterial: THREE.LineBasicMaterial | null = null
  private speedLinesThreshold: number = 25 // Speed at which lines start appearing
  private speedLinesMax: number = 50 // Speed at which lines are fully visible

  // Memory monitoring
  private memoryMonitor: MemoryMonitor | null = null

  constructor(container: HTMLElement) {
    this.container = container
    
    // Get device-specific configuration
    const caps = getDeviceCapabilities()
    this.rendererConfig = getRendererConfig(caps, this.qualityProfile)

    // Scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(this.rendererConfig.backgroundColor)
    
    // Add fog to hide far clipping and improve visual depth
    // Adjust fog distance based on quality
    const fogNear = this.qualityProfile.tier === 'low' ? 30 : 50
    const fogFar = this.qualityProfile.tier === 'low' ? 100 : 200
    this.scene.fog = new THREE.Fog(this.rendererConfig.backgroundColor, fogNear, fogFar)

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      this.rendererConfig.fov,
      container.clientWidth / container.clientHeight,
      this.rendererConfig.nearPlane,
      this.rendererConfig.farPlane
    )
    this.camera.position.set(
      0,
      this.rendererConfig.cameraHeight,
      this.rendererConfig.cameraDistance + 8
    )
    this.camera.lookAt(0, 0, -50)

    // Renderer with quality-adaptive settings
    // Safari/iOS specific: use low-power to prevent thermal throttling
    const rendererQuality = this.qualityProfile.renderer
    const isSafariMobile = caps.isSafari && caps.isMobile
    this.renderer = new THREE.WebGLRenderer({
      antialias: isSafariMobile ? false : rendererQuality.antialias, // Disable AA on Safari mobile
      powerPreference: isSafariMobile ? 'low-power' : (caps.isMobile ? 'default' : 'high-performance'),
      stencil: false,
      depth: true,
      alpha: false,
      // Safari/iOS: avoid preserveDrawingBuffer (major perf hit)
      preserveDrawingBuffer: false,
      // Safari/iOS: prefer failIfMajorPerformanceCaveat to avoid software rendering
      failIfMajorPerformanceCaveat: isSafariMobile,
    })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    
    // Use quality-based pixel ratio
    // Safari/iOS: cap at 2x max to prevent VRAM exhaustion (Retina can be 3x)
    let maxPixelRatio = rendererQuality.pixelRatio
    if (isSafariMobile) {
      maxPixelRatio = Math.min(maxPixelRatio, 1.5) // Aggressive cap for Safari mobile
    } else if (caps.isIOS) {
      maxPixelRatio = Math.min(maxPixelRatio, 2) // Cap iOS at 2x
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio))
    
    // Enable better color output (if quality allows)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    if (rendererQuality.toneMapping) {
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping
      this.renderer.toneMappingExposure = 1.0
    } else {
      this.renderer.toneMapping = THREE.NoToneMapping
    }

    container.appendChild(this.renderer.domElement)

    // Orbit controls (for debug/paused state)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.enabled = false // Disabled by default during gameplay

    // Setup lighting (quality-aware)
    this.setupLighting()
    
    // Setup space background (quality-aware)
    this.setupSpaceBackground()

    // Setup speed lines effect (if quality allows)
    if (this.qualityProfile.animation.speedLines) {
      this.setupSpeedLines()
    }

    // Handle resize
    window.addEventListener('resize', this.handleResize)
    
    // Subscribe to quality changes for runtime adjustment
    this.unsubscribeQuality = onQualityChange(this.handleQualityChange.bind(this))
    
    // Initialize memory monitor with iOS Safari budget
    const memoryBudget: MemoryBudget = isSafariMobile 
      ? { textures: 64, geometry: 32, total: 128 }  // Conservative for Safari
      : { textures: 128, geometry: 64, total: 256 } // Standard mobile budget
    this.memoryMonitor = new MemoryMonitor(this.renderer, this.scene, memoryBudget)
  }

  /**
   * Handle runtime quality changes
   */
  private handleQualityChange(newProfile: QualityProfile): void {
    console.log('[SurvivalRenderer] Quality changed to:', newProfile.name)
    this.qualityProfile = newProfile
    
    // Update pixel ratio
    const maxPixelRatio = newProfile.renderer.pixelRatio
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio))
    
    // Update tone mapping
    if (newProfile.renderer.toneMapping) {
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    } else {
      this.renderer.toneMapping = THREE.NoToneMapping
    }
    
    // Update fog distance
    const fogNear = newProfile.tier === 'low' ? 30 : 50
    const fogFar = newProfile.tier === 'low' ? 100 : 200
    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.near = fogNear
      this.scene.fog.far = fogFar
    }
    
    // Update space background quality
    if (this.spaceBackground) {
      const spaceQuality = newProfile.tier === 'low' ? 'low' : 
                          newProfile.tier === 'medium' ? 'medium' : 'high'
      this.spaceBackground.setQuality(spaceQuality as 'low' | 'medium' | 'high')
    }
    
    // Toggle speed lines based on quality
    if (newProfile.animation.speedLines && !this.speedLines) {
      this.setupSpeedLines()
    } else if (!newProfile.animation.speedLines && this.speedLines) {
      this.disposeSpeedLines()
    }
  }

  /**
   * Setup scene lighting - optimized for dark theme visibility
   * Quality-aware: reduces lights on low-end devices
   * 
   * Strategy:
   * 1. Strong ambient light - ensures all objects have base visibility (cheap)
   * 2. Multiple directional lights - illuminate from different angles (cheap)
   * 3. Hemisphere light - adds color variation sky/ground (cheap)
   * 4. Single player-following point light - dramatic effect (moderate cost)
   */
  private setupLighting(): void {
    const maxLights = this.qualityProfile.renderer.maxLights
    const ambientIntensity = this.rendererConfig.ambientLightIntensity
    
    // Strong ambient light for base illumination of dark objects
    // This is the cheapest way to ensure everything is visible
    const ambient = new THREE.AmbientLight(0xffffff, ambientIntensity)
    this.scene.add(ambient)

    // Main directional light (sun-like) - from above and front
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2)
    mainLight.position.set(0, 30, -20) // Above and slightly behind camera
    this.scene.add(mainLight)

    // Additional lights only if quality allows
    if (maxLights >= 4) {
      // Fill light from the side - reduces harsh shadows
      const fillLight = new THREE.DirectionalLight(0x88ccff, 0.5)
      fillLight.position.set(-20, 10, 0) // From the left
      this.scene.add(fillLight)

      // Rim light from behind - makes objects pop against dark background
      const rimLight = new THREE.DirectionalLight(COLORS.brandOrange, 0.4)
      rimLight.position.set(0, 5, 50) // From behind (positive Z)
      this.scene.add(rimLight)
    }

    // Hemisphere light for sky/ground color gradient (cheap)
    const hemi = new THREE.HemisphereLight(0x6699ff, COLORS.brandOrange, 0.5)
    this.scene.add(hemi)

    // Single point light that follows player (only on medium+ quality)
    // Point lights are expensive on mobile
    if (maxLights >= 6) {
      this.playerLight = new THREE.PointLight(COLORS.brandOrange, 2.0, 40)
      this.playerLight.position.set(0, 5, 0)
      this.scene.add(this.playerLight)
    }
    
    // Character-specific lighting - makes the runner pop against dark background
    // Spotlight from above/front to illuminate the character
    this.characterSpotlight = new THREE.SpotLight(0xffffff, 3.0, 30, Math.PI / 6, 0.5, 1)
    this.characterSpotlight.position.set(0, 12, 15) // Above and in front of player
    this.characterSpotlight.target.position.set(0, 2, 0) // Aim at character center
    this.scene.add(this.characterSpotlight)
    this.scene.add(this.characterSpotlight.target)
    
    // Fill light from below/front to reduce harsh shadows on character
    this.characterFillLight = new THREE.DirectionalLight(0x88aaff, 0.8)
    this.characterFillLight.position.set(0, -2, 10) // Below and in front
    this.scene.add(this.characterFillLight)
  }

  /**
   * Setup the space background system
   * Quality-aware: adjusts particle counts and effects based on device
   */
  private setupSpaceBackground(): void {
    const spaceQuality = this.qualityProfile.space
    
    // Map quality tier to space background preset
    const qualityPreset = this.qualityProfile.tier === 'low' ? 'low' :
                         this.qualityProfile.tier === 'medium' ? 'medium' : 'high'
    
    this.spaceBackground = new SpaceBackground(this.scene, {
      quality: qualityPreset as 'low' | 'medium' | 'high',
      nebulaColors: spaceQuality.nebulaEnabled 
        ? [0x1a0a2e, COLORS.brandIndigo, 0x0d1b2a]
        : undefined,
      shootingStarRate: spaceQuality.shootingStarRate,
      celestialSpawnInterval: 400 / Math.max(1, spaceQuality.celestialCount / 4),
    })
  }

  /**
   * Dispose speed lines effect
   */
  private disposeSpeedLines(): void {
    if (this.speedLines) {
      this.camera.remove(this.speedLines)
      this.speedLines.geometry.dispose()
      this.speedLinesMaterial?.dispose()
      this.speedLines = null
      this.speedLinesMaterial = null
    }
  }

  /**
   * AAA Feature: Setup speed lines effect for high-speed visual feedback
   */
  private setupSpeedLines(): void {
    const lineCount = 60
    const positions: number[] = []
    
    // Create lines radiating from center toward edges
    for (let i = 0; i < lineCount; i++) {
      // Random angle around the screen
      const angle = (i / lineCount) * Math.PI * 2 + Math.random() * 0.3
      const innerRadius = 3 + Math.random() * 2
      const outerRadius = innerRadius + 8 + Math.random() * 6
      
      // Start point (inner)
      const x1 = Math.cos(angle) * innerRadius
      const y1 = Math.sin(angle) * innerRadius * 0.6 // Squash vertically
      const z1 = -10 - Math.random() * 5
      
      // End point (outer)
      const x2 = Math.cos(angle) * outerRadius
      const y2 = Math.sin(angle) * outerRadius * 0.6
      const z2 = z1 - 15 - Math.random() * 10
      
      positions.push(x1, y1, z1, x2, y2, z2)
    }
    
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    
    this.speedLinesMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    })
    
    this.speedLines = new THREE.LineSegments(geometry, this.speedLinesMaterial)
    this.speedLines.frustumCulled = false // Always render
    this.speedLines.renderOrder = 1000 // Render on top
    
    // Attach to camera so it moves with view
    this.camera.add(this.speedLines)
    this.scene.add(this.camera) // Camera needs to be in scene for children to render
  }

  /**
   * AAA Feature: Update speed lines based on current speed
   */
  updateSpeedLines(currentSpeed: number, delta: number): void {
    if (!this.speedLinesMaterial || !this.speedLines) return
    
    // Calculate target opacity based on speed
    let targetOpacity = 0
    if (currentSpeed > this.speedLinesThreshold) {
      const speedRange = this.speedLinesMax - this.speedLinesThreshold
      const speedProgress = (currentSpeed - this.speedLinesThreshold) / speedRange
      targetOpacity = Math.min(0.6, speedProgress * 0.6)
    }
    
    // Smooth opacity transition
    this.speedLinesOpacity += (targetOpacity - this.speedLinesOpacity) * delta * 3
    this.speedLinesMaterial.opacity = this.speedLinesOpacity
    
    // Animate lines (stretch based on speed)
    if (this.speedLinesOpacity > 0.01) {
      const positions = this.speedLines.geometry.attributes.position.array as Float32Array
      
      // Animate Z positions for motion effect
      for (let i = 0; i < positions.length; i += 6) {
        // Move lines forward
        positions[i + 2] += delta * currentSpeed * 0.5
        positions[i + 5] += delta * currentSpeed * 0.5
        
        // Reset lines that go too far
        if (positions[i + 2] > 5) {
          positions[i + 2] -= 30
          positions[i + 5] -= 30
        }
      }
      
      this.speedLines.geometry.attributes.position.needsUpdate = true
    }
  }

  /**
   * Update space background (call each frame)
   */
  updateSpaceBackground(delta: number, playerZ: number, speed: number): void {
    this.spaceBackground?.update(delta, playerZ, speed)
  }

  /**
   * Register a celestial model (planet, asteroid, etc.)
   */
  registerCelestialModel(type: CelestialType, model: THREE.Group): void {
    this.spaceBackground?.registerCelestialModel(type, model)
  }

  /**
   * Trigger damage effect (hit obstacle - red nebula flash)
   */
  triggerDamageEffect(): void {
    this.spaceBackground?.triggerDamageEffect()
  }

  /**
   * Trigger boost effect (speed boost - energetic colors + shooting stars)
   */
  triggerBoostEffect(): void {
    this.spaceBackground?.triggerBoostEffect()
  }

  /**
   * Get space background for direct access if needed
   */
  getSpaceBackground(): SpaceBackground | null {
    return this.spaceBackground
  }

  /**
   * Register the city model for the skyline below the track
   */
  registerCityModel(model: THREE.Group): void {
    this.spaceBackground?.registerCityModel(model)
  }

  /**
   * Add atmospheric lights along the track
   * DISABLED for performance - point lights are expensive
   */
  addTrackLights(_positions: number[]): void {
    // Disabled - point lights kill performance on MacBooks
    // TODO: Use baked lighting or emissive materials instead
  }

  /**
   * Get the Three.js scene
   */
  getScene(): THREE.Scene {
    return this.scene
  }

  /**
   * Get the camera
   */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }

  /**
   * Update camera to follow player
   */
  updateCamera(playerZ: number): void {
    this.camera.position.z = playerZ + this.rendererConfig.cameraDistance
    this.camera.lookAt(0, 0, playerZ - 50)

    // Update orange light to follow player (direct reference, no iteration)
    if (this.playerLight) {
      this.playerLight.position.z = playerZ
    }
    
    // Update character spotlight to follow player
    if (this.characterSpotlight) {
      this.characterSpotlight.position.z = playerZ + 15
      this.characterSpotlight.target.position.z = playerZ
    }
    
    // Update character fill light to follow player
    if (this.characterFillLight) {
      this.characterFillLight.position.z = playerZ + 10
    }
  }

  /**
   * Enable/disable orbit controls
   */
  setOrbitControlsEnabled(enabled: boolean): void {
    this.controls.enabled = enabled
  }

  /**
   * Reset orbit controls to default state (useful when starting a run)
   */
  resetOrbitControls(): void {
    // Reset the orbit controls target to look at the player's starting position
    this.controls.target.set(0, 0, -42) // Look ahead of player
    this.controls.reset()
    
    // Also reset camera position to default
    this.camera.position.set(
      0,
      this.rendererConfig.cameraHeight,
      this.rendererConfig.cameraDistance + 8
    )
    this.camera.lookAt(0, 0, -50)
    this.camera.rotation.z = 0
  }

  /**
   * Set the render callback
   */
  setRenderCallback(callback: (delta: number) => void): void {
    this.onRender = callback
  }

  /**
   * Start the render loop
   */
  start(): void {
    this.lastTime = performance.now()
    this.animate()
  }

  /**
   * Stop the render loop
   */
  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  /**
   * Animation loop (legacy - use render() with GameLoop instead)
   */
  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate)

    const now = performance.now()
    const delta = (now - this.lastTime) / 1000
    this.lastTime = now

    // Call game update
    if (this.onRender) {
      this.onRender(delta)
    }

    // Update controls if enabled
    if (this.controls.enabled) {
      this.controls.update()
    }

    // Render
    this.renderer.render(this.scene, this.camera)
  }

  /**
   * Update player light position (called from engine)
   * Currently disabled for performance
   */
  updatePlayerLight(_z: number): void {
    // Disabled - point lights are expensive
  }

  /**
   * Render a single frame (called by GameLoop)
   */
  render(): void {
    // Update controls if enabled
    if (this.controls.enabled) {
      this.controls.update()
    }

    // Reset renderer info for this frame (for debugging)
    this.renderer.info.reset()

    // Render the scene
    this.renderer.render(this.scene, this.camera)
  }

  /**
   * Get renderer info for debugging
   */
  getRendererInfo(): THREE.WebGLInfo {
    return this.renderer.info
  }

  /**
   * Get memory usage stats
   */
  getMemoryStats(): MemoryStats | null {
    return this.memoryMonitor?.getStats() ?? null
  }

  /**
   * Log detailed memory breakdown to console
   */
  logMemoryBreakdown(): void {
    this.memoryMonitor?.logDetailedBreakdown()
  }

  /**
   * Handle window resize
   */
  private handleResize = (): void => {
    this.resize()
  }

  /**
   * Public resize method - call when container size changes
   * (e.g., when mobile trivia panel shows/hides)
   */
  resize(): void {
    // Get container dimensions - use getBoundingClientRect for more accurate values
    // especially when CSS calc() is used
    const rect = this.container.getBoundingClientRect()
    const width = rect.width || this.container.clientWidth
    const height = rect.height || this.container.clientHeight

    if (width === 0 || height === 0) return

    // Update camera aspect ratio
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    
    // Update renderer size
    this.renderer.setSize(width, height)
    
    // Force a render to apply changes immediately
    this.renderer.render(this.scene, this.camera)
  }

  /**
   * AAA Feature: Update dynamic FOV based on speed
   * Higher speed = wider FOV for sense of velocity
   */
  updateDynamicFOV(currentSpeed: number, delta: number): void {
    const baseFOV = this.rendererConfig.fov
    const maxFOVIncrease = 15 // Max FOV increase at top speed
    
    // Calculate target FOV based on speed
    let targetFOV = baseFOV
    if (currentSpeed > 20) {
      const speedProgress = Math.min(1, (currentSpeed - 20) / 40)
      targetFOV = baseFOV + maxFOVIncrease * speedProgress
    }
    
    // Smooth FOV transition
    const currentFOV = this.camera.fov
    const newFOV = currentFOV + (targetFOV - currentFOV) * delta * 2
    
    if (Math.abs(newFOV - currentFOV) > 0.01) {
      this.camera.fov = newFOV
      this.camera.updateProjectionMatrix()
    }
  }

  /**
   * Record FPS for quality auto-adjustment
   */
  recordFPS(fps: number): void {
    recordFPSForQuality(fps)
  }

  /**
   * Get current quality profile
   */
  getQualityProfile(): QualityProfile {
    return this.qualityProfile
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop()
    window.removeEventListener('resize', this.handleResize)
    
    // Unsubscribe from quality changes
    if (this.unsubscribeQuality) {
      this.unsubscribeQuality()
      this.unsubscribeQuality = null
    }
    
    // Dispose space background
    this.spaceBackground?.dispose()
    this.spaceBackground = null
    
    // Dispose speed lines
    this.disposeSpeedLines()
    
    this.controls.dispose()
    this.renderer.dispose()
    
    // Remove canvas from DOM
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement)
    }

    // Dispose scene objects
    this.scene.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.geometry?.dispose()
        if (Array.isArray(object.material)) {
          object.material.forEach(m => m.dispose())
        } else {
          object.material?.dispose()
        }
      }
    })
  }
}
