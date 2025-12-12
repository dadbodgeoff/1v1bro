/**
 * Camera - Enterprise-grade camera system for mobile viewport management
 * 
 * Features:
 * - Smooth player following with configurable easing
 * - Screen shake effects for impacts
 * - Zoom support for special events
 * - Dead zone to prevent jittery movement
 * - Bounds clamping to keep view within arena
 * - Coordinate conversion utilities
 * 
 * @module game/engine/Camera
 */

import { ARENA_SIZE } from '../config'
import type { Vector2 } from './types'

export interface CameraConfig {
  /** Smoothing factor for camera movement (0-1, lower = smoother) */
  smoothing: number
  /** Dead zone radius - camera won't move if player is within this distance of center */
  deadZone: number
  /** Look-ahead factor - camera leads player movement direction */
  lookAhead: number
  /** Maximum shake intensity */
  maxShakeIntensity: number
  /** Shake decay rate per second */
  shakeDecay: number
}

interface ShakeState {
  intensity: number
  offsetX: number
  offsetY: number
  duration: number
  elapsed: number
}

const DEFAULT_CONFIG: CameraConfig = {
  smoothing: 0.1,
  deadZone: 30,
  lookAhead: 0.15,
  maxShakeIntensity: 15,
  shakeDecay: 8,
}

export class Camera {
  // Position state
  private position: Vector2 = { x: 0, y: 0 }
  private targetPosition: Vector2 = { x: 0, y: 0 }
  
  // Viewport dimensions (in arena coordinates)
  private viewportWidth: number = ARENA_SIZE.width
  private viewportHeight: number = ARENA_SIZE.height
  private scale: number = 1
  
  // Zoom state
  private zoom: number = 1
  private targetZoom: number = 1
  
  // Shake state
  private shakeState: ShakeState = {
    intensity: 0,
    offsetX: 0,
    offsetY: 0,
    duration: 0,
    elapsed: 0,
  }
  
  // Configuration
  private config: CameraConfig
  private enabled: boolean = false
  
  // Last known player velocity for look-ahead
  private lastPlayerPos: Vector2 | null = null

  constructor(config: Partial<CameraConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Set the viewport size (canvas size in pixels)
   * Enables camera when viewport doesn't fully contain arena
   */
  setViewport(canvasWidth: number, canvasHeight: number, scale: number): void {
    this.scale = scale
    
    // Convert canvas pixels to arena coordinates
    this.viewportWidth = canvasWidth / scale
    this.viewportHeight = canvasHeight / scale

    // Enable camera only when viewport doesn't fully contain arena
    // This happens on mobile landscape when we fill width but cap height
    const needsHorizontalScroll = this.viewportWidth < ARENA_SIZE.width
    const needsVerticalScroll = this.viewportHeight < ARENA_SIZE.height
    this.enabled = needsHorizontalScroll || needsVerticalScroll

    if (this.enabled) {
      // Center camera initially
      this.position.x = Math.max(0, (ARENA_SIZE.width - this.viewportWidth) / 2)
      this.position.y = Math.max(0, (ARENA_SIZE.height - this.viewportHeight) / 2)
      this.targetPosition = { ...this.position }
    } else {
      // Reset to origin when camera not needed
      this.position = { x: 0, y: 0 }
      this.targetPosition = { x: 0, y: 0 }
    }
  }

  /**
   * Update camera to follow target (usually local player)
   * Uses smooth interpolation with optional look-ahead
   */
  follow(target: Vector2, deltaTime: number): void {
    if (!this.enabled) return

    // Calculate player velocity for look-ahead
    let lookAheadX = 0
    let lookAheadY = 0
    
    if (this.lastPlayerPos && this.config.lookAhead > 0) {
      const vx = target.x - this.lastPlayerPos.x
      const vy = target.y - this.lastPlayerPos.y
      const speed = Math.sqrt(vx * vx + vy * vy)
      
      // Only apply look-ahead if moving significantly
      if (speed > 2) {
        lookAheadX = vx * this.config.lookAhead * 60 // Scale by expected frame rate
        lookAheadY = vy * this.config.lookAhead * 60
      }
    }
    this.lastPlayerPos = { ...target }

    // Calculate effective viewport size with zoom
    const effectiveWidth = this.viewportWidth / this.zoom
    const effectiveHeight = this.viewportHeight / this.zoom

    // Calculate ideal camera position to center on target (with look-ahead)
    const idealX = target.x + lookAheadX - effectiveWidth / 2
    const idealY = target.y + lookAheadY - effectiveHeight / 2

    // Clamp to arena bounds
    const maxX = Math.max(0, ARENA_SIZE.width - effectiveWidth)
    const maxY = Math.max(0, ARENA_SIZE.height - effectiveHeight)
    
    this.targetPosition.x = Math.max(0, Math.min(idealX, maxX))
    this.targetPosition.y = Math.max(0, Math.min(idealY, maxY))

    // Check if target is within dead zone
    const dx = this.targetPosition.x - this.position.x
    const dy = this.targetPosition.y - this.position.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > this.config.deadZone) {
      // Smooth interpolation toward target (frame-rate independent)
      const smoothing = 1 - Math.pow(1 - this.config.smoothing, deltaTime * 60)
      this.position.x += dx * smoothing
      this.position.y += dy * smoothing
    }

    // Update zoom smoothly
    if (this.zoom !== this.targetZoom) {
      const zoomDiff = this.targetZoom - this.zoom
      this.zoom += zoomDiff * this.config.smoothing * deltaTime * 60
      
      // Snap if close enough
      if (Math.abs(zoomDiff) < 0.01) {
        this.zoom = this.targetZoom
      }
    }

    // Update shake
    this.updateShake(deltaTime)
  }

  /**
   * Immediately snap camera to target (no smoothing)
   */
  snapTo(target: Vector2): void {
    if (!this.enabled) return

    const effectiveWidth = this.viewportWidth / this.zoom
    const effectiveHeight = this.viewportHeight / this.zoom

    const idealX = target.x - effectiveWidth / 2
    const idealY = target.y - effectiveHeight / 2

    const maxX = Math.max(0, ARENA_SIZE.width - effectiveWidth)
    const maxY = Math.max(0, ARENA_SIZE.height - effectiveHeight)

    this.position.x = Math.max(0, Math.min(idealX, maxX))
    this.position.y = Math.max(0, Math.min(idealY, maxY))
    this.targetPosition = { ...this.position }
    this.lastPlayerPos = { ...target }
  }

  /**
   * Trigger screen shake effect (for impacts, explosions, etc.)
   */
  shake(intensity: number, duration: number = 0.3): void {
    // Don't override stronger shake
    if (this.shakeState.intensity > intensity) return
    
    this.shakeState.intensity = Math.min(intensity, this.config.maxShakeIntensity)
    this.shakeState.duration = duration
    this.shakeState.elapsed = 0
  }

  /**
   * Update shake effect
   */
  private updateShake(deltaTime: number): void {
    if (this.shakeState.intensity <= 0) return

    this.shakeState.elapsed += deltaTime

    if (this.shakeState.elapsed >= this.shakeState.duration) {
      // Shake finished
      this.shakeState.intensity = 0
      this.shakeState.offsetX = 0
      this.shakeState.offsetY = 0
      return
    }

    // Decay intensity over time
    const progress = this.shakeState.elapsed / this.shakeState.duration
    const currentIntensity = this.shakeState.intensity * (1 - progress)

    // Random offset with perlin-like smoothing
    const angle = Math.random() * Math.PI * 2
    this.shakeState.offsetX = Math.cos(angle) * currentIntensity
    this.shakeState.offsetY = Math.sin(angle) * currentIntensity
  }

  /**
   * Set zoom level (1.0 = normal, >1 = zoomed in)
   */
  setZoom(zoom: number, immediate: boolean = false): void {
    this.targetZoom = Math.max(0.5, Math.min(zoom, 2.0))
    if (immediate) {
      this.zoom = this.targetZoom
    }
  }

  /**
   * Get current camera offset (for translating render context)
   * Includes shake offset
   */
  getOffset(): Vector2 {
    return {
      x: -(this.position.x + this.shakeState.offsetX),
      y: -(this.position.y + this.shakeState.offsetY),
    }
  }

  /**
   * Get camera position (top-left corner of viewport in arena coords)
   */
  getPosition(): Vector2 {
    return { ...this.position }
  }

  /**
   * Get current zoom level
   */
  getZoom(): number {
    return this.zoom
  }

  /**
   * Get current scale factor
   */
  getScale(): number {
    return this.scale
  }

  /**
   * Check if camera is enabled (viewport smaller than arena)
   */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * Get viewport bounds in arena coordinates
   */
  getViewportBounds(): { x: number; y: number; width: number; height: number } {
    const effectiveWidth = this.viewportWidth / this.zoom
    const effectiveHeight = this.viewportHeight / this.zoom
    
    return {
      x: this.position.x,
      y: this.position.y,
      width: effectiveWidth,
      height: effectiveHeight,
    }
  }

  /**
   * Check if a point is visible in the current viewport
   */
  isVisible(point: Vector2, padding: number = 50): boolean {
    if (!this.enabled) return true
    
    const bounds = this.getViewportBounds()
    return (
      point.x >= bounds.x - padding &&
      point.x <= bounds.x + bounds.width + padding &&
      point.y >= bounds.y - padding &&
      point.y <= bounds.y + bounds.height + padding
    )
  }

  /**
   * Convert screen coordinates to arena coordinates
   */
  screenToArena(screenX: number, screenY: number, scale: number): Vector2 {
    return {
      x: screenX / scale / this.zoom + this.position.x,
      y: screenY / scale / this.zoom + this.position.y,
    }
  }

  /**
   * Convert arena coordinates to screen coordinates
   */
  arenaToScreen(arenaX: number, arenaY: number, scale: number): Vector2 {
    return {
      x: (arenaX - this.position.x) * scale * this.zoom,
      y: (arenaY - this.position.y) * scale * this.zoom,
    }
  }

  /**
   * Get debug info for development
   */
  getDebugInfo(): Record<string, unknown> {
    return {
      enabled: this.enabled,
      position: this.position,
      target: this.targetPosition,
      viewport: { width: this.viewportWidth, height: this.viewportHeight },
      zoom: this.zoom,
      shake: this.shakeState.intensity > 0 ? this.shakeState.intensity : 0,
    }
  }
}
