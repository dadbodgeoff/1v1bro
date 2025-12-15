/**
 * TouchController - Enterprise-grade touch input handling
 * 
 * Features:
 * - Multi-touch gesture recognition
 * - Swipe detection with velocity
 * - Zone-based tap handling
 * - Haptic feedback integration
 * - Visual touch indicators
 * - Gesture buffering for responsiveness
 */

import type { InputAction } from '../types/survival'
import type { TouchZoneConfig } from '../config/mobile'
import { getMobileConfig, isInTouchZone } from '../config/mobile'
import { getDeviceCapabilities } from '../config/device'

export type GestureType = 
  | 'tap'
  | 'double-tap'
  | 'hold'
  | 'swipe-left'
  | 'swipe-right'
  | 'swipe-up'
  | 'swipe-down'

export interface TouchEvent {
  id: number
  startX: number
  startY: number
  currentX: number
  currentY: number
  startTime: number
  lastTime: number
  velocityX: number
  velocityY: number
}

export interface GestureEvent {
  type: GestureType
  x: number
  y: number
  velocityX?: number
  velocityY?: number
  duration?: number
}

type InputCallback = (action: InputAction) => void
type GestureCallback = (gesture: GestureEvent) => void

export class TouchController {
  private config: TouchZoneConfig
  private callbacks: Set<InputCallback> = new Set()
  private gestureCallbacks: Set<GestureCallback> = new Set()
  private enabled: boolean = true
  
  // Active touches
  private activeTouches: Map<number, TouchEvent> = new Map()
  
  // Gesture detection state
  private lastTapTime: number = 0
  private lastTapX: number = 0
  private lastTapY: number = 0
  private holdTimeout: number | null = null
  
  // Swipe tracking
  private swipeStartX: number = 0
  private swipeStartY: number = 0
  
  // Visual feedback
  private touchIndicators: Map<number, HTMLElement> = new Map()
  private indicatorContainer: HTMLElement | null = null
  
  // Haptic feedback
  private hapticEnabled: boolean = false
  
  // Bound handlers for cleanup
  private boundHandlers: {
    touchStart: (e: globalThis.TouchEvent) => void
    touchMove: (e: globalThis.TouchEvent) => void
    touchEnd: (e: globalThis.TouchEvent) => void
    touchCancel: (e: globalThis.TouchEvent) => void
  }

  constructor() {
    const mobileConfig = getMobileConfig()
    this.config = mobileConfig.touch
    this.hapticEnabled = mobileConfig.enableVibration
    
    // Bind handlers
    this.boundHandlers = {
      touchStart: this.handleTouchStart.bind(this),
      touchMove: this.handleTouchMove.bind(this),
      touchEnd: this.handleTouchEnd.bind(this),
      touchCancel: this.handleTouchCancel.bind(this),
    }
  }

  /**
   * Attach touch event listeners
   */
  attach(container?: HTMLElement): void {
    const target = container || document.body
    
    target.addEventListener('touchstart', this.boundHandlers.touchStart, { passive: false })
    target.addEventListener('touchmove', this.boundHandlers.touchMove, { passive: false })
    target.addEventListener('touchend', this.boundHandlers.touchEnd, { passive: false })
    target.addEventListener('touchcancel', this.boundHandlers.touchCancel, { passive: false })
    
    // Setup visual indicators if enabled
    if (this.config.showTouchIndicators) {
      this.setupIndicatorContainer(target)
    }
  }

  /**
   * Detach touch event listeners
   */
  detach(): void {
    document.body.removeEventListener('touchstart', this.boundHandlers.touchStart)
    document.body.removeEventListener('touchmove', this.boundHandlers.touchMove)
    document.body.removeEventListener('touchend', this.boundHandlers.touchEnd)
    document.body.removeEventListener('touchcancel', this.boundHandlers.touchCancel)
    
    this.clearIndicators()
    this.activeTouches.clear()
    
    if (this.holdTimeout) {
      clearTimeout(this.holdTimeout)
      this.holdTimeout = null
    }
  }

  /**
   * Register input action callback
   */
  onInput(callback: InputCallback): () => void {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  /**
   * Register gesture callback
   */
  onGesture(callback: GestureCallback): () => void {
    this.gestureCallbacks.add(callback)
    return () => this.gestureCallbacks.delete(callback)
  }

  /**
   * Enable/disable touch processing
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) {
      this.activeTouches.clear()
      this.clearIndicators()
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<TouchZoneConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Enable/disable haptic feedback
   */
  setHapticEnabled(enabled: boolean): void {
    this.hapticEnabled = enabled
  }

  private handleTouchStart(e: globalThis.TouchEvent): void {
    if (!this.enabled) return
    
    // Only prevent default if touch is on the canvas, not on UI buttons
    const target = e.target as HTMLElement
    const isUIElement = target.closest('button, a, [role="button"], .z-10, .z-20, .z-30')
    if (isUIElement) {
      // Let UI elements handle their own touch events
      return
    }
    
    // Prevent default to avoid scrolling/zooming on canvas
    e.preventDefault()
    
    const now = performance.now()
    
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]
      
      const touchEvent: TouchEvent = {
        id: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        startTime: now,
        lastTime: now,
        velocityX: 0,
        velocityY: 0,
      }
      
      this.activeTouches.set(touch.identifier, touchEvent)
      
      // Show visual indicator
      if (this.config.showTouchIndicators) {
        this.showIndicator(touch.identifier, touch.clientX, touch.clientY)
      }
      
      // Start hold detection
      this.startHoldDetection(touch.identifier, touch.clientX, touch.clientY)
    }
    
    // Store swipe start for first touch
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      this.swipeStartX = touch.clientX
      this.swipeStartY = touch.clientY
    }
  }

  private handleTouchMove(e: globalThis.TouchEvent): void {
    if (!this.enabled) return
    
    // Only prevent default if not on UI elements
    const target = e.target as HTMLElement
    const isUIElement = target.closest('button, a, [role="button"], .z-10, .z-20, .z-30')
    if (!isUIElement) {
      e.preventDefault()
    }
    
    const now = performance.now()
    
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]
      const touchEvent = this.activeTouches.get(touch.identifier)
      
      if (touchEvent) {
        const dt = (now - touchEvent.lastTime) / 1000
        
        if (dt > 0) {
          touchEvent.velocityX = (touch.clientX - touchEvent.currentX) / dt
          touchEvent.velocityY = (touch.clientY - touchEvent.currentY) / dt
        }
        
        touchEvent.currentX = touch.clientX
        touchEvent.currentY = touch.clientY
        touchEvent.lastTime = now
        
        // Update indicator position
        if (this.config.showTouchIndicators) {
          this.updateIndicator(touch.identifier, touch.clientX, touch.clientY)
        }
        
        // Cancel hold if moved too far
        const dx = touch.clientX - touchEvent.startX
        const dy = touch.clientY - touchEvent.startY
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance > this.config.swipeThreshold * 0.5) {
          this.cancelHoldDetection()
        }
      }
    }
  }

  private handleTouchEnd(e: globalThis.TouchEvent): void {
    if (!this.enabled) return
    e.preventDefault()
    
    const now = performance.now()
    
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]
      const touchEvent = this.activeTouches.get(touch.identifier)
      
      if (touchEvent) {
        this.processGesture(touchEvent, now)
        this.activeTouches.delete(touch.identifier)
        
        // Hide indicator
        if (this.config.showTouchIndicators) {
          this.hideIndicator(touch.identifier)
        }
      }
    }
    
    this.cancelHoldDetection()
  }

  private handleTouchCancel(e: globalThis.TouchEvent): void {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]
      this.activeTouches.delete(touch.identifier)
      this.hideIndicator(touch.identifier)
    }
    
    this.cancelHoldDetection()
  }

  private processGesture(touchEvent: TouchEvent, endTime: number): void {
    const duration = endTime - touchEvent.startTime
    const dx = touchEvent.currentX - touchEvent.startX
    const dy = touchEvent.currentY - touchEvent.startY
    const distance = Math.sqrt(dx * dx + dy * dy)
    const velocity = distance / duration
    
    // Check for swipe
    if (distance > this.config.swipeThreshold && velocity > this.config.swipeVelocity) {
      const gesture = this.detectSwipeDirection(dx, dy, velocity)
      this.emitGesture(gesture)
      this.mapGestureToInput(gesture)
      return
    }
    
    // Check for tap
    if (duration < this.config.tapTimeout && distance < this.config.swipeThreshold * 0.5) {
      // Check for double-tap
      const timeSinceLastTap = endTime - this.lastTapTime
      const distanceFromLastTap = Math.sqrt(
        Math.pow(touchEvent.startX - this.lastTapX, 2) +
        Math.pow(touchEvent.startY - this.lastTapY, 2)
      )
      
      if (timeSinceLastTap < this.config.doubleTapTimeout && distanceFromLastTap < 50) {
        const gesture: GestureEvent = {
          type: 'double-tap',
          x: touchEvent.startX,
          y: touchEvent.startY,
          duration,
        }
        this.emitGesture(gesture)
        this.mapGestureToInput(gesture)
        this.lastTapTime = 0 // Reset to prevent triple-tap
      } else {
        const gesture: GestureEvent = {
          type: 'tap',
          x: touchEvent.startX,
          y: touchEvent.startY,
          duration,
        }
        this.emitGesture(gesture)
        this.mapGestureToInput(gesture)
        
        this.lastTapTime = endTime
        this.lastTapX = touchEvent.startX
        this.lastTapY = touchEvent.startY
      }
    }
  }

  private detectSwipeDirection(dx: number, dy: number, velocity: number): GestureEvent {
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    
    let type: GestureType
    
    if (absDx > absDy) {
      type = dx > 0 ? 'swipe-right' : 'swipe-left'
    } else {
      type = dy > 0 ? 'swipe-down' : 'swipe-up'
    }
    
    return {
      type,
      x: this.swipeStartX + dx / 2,
      y: this.swipeStartY + dy / 2,
      velocityX: dx > 0 ? velocity : -velocity,
      velocityY: dy > 0 ? velocity : -velocity,
    }
  }

  private mapGestureToInput(gesture: GestureEvent): void {
    const config = this.config
    
    let action: InputAction | null = null
    
    switch (gesture.type) {
      case 'tap':
        // Zone-based tap handling
        if (isInTouchZone(gesture.x, gesture.y, config.leftZone)) {
          action = 'moveLeft'
        } else if (isInTouchZone(gesture.x, gesture.y, config.rightZone)) {
          action = 'moveRight'
        } else if (isInTouchZone(gesture.x, gesture.y, config.jumpZone)) {
          action = 'jump'
        } else if (isInTouchZone(gesture.x, gesture.y, config.slideZone)) {
          action = 'slide'
        } else if (isInTouchZone(gesture.x, gesture.y, config.pauseZone)) {
          action = 'pause'
        } else {
          // Fallback: center tap = jump
          action = 'jump'
        }
        break
        
      case 'double-tap':
        // Double-tap anywhere = start/jump
        action = 'start'
        break
        
      case 'swipe-left':
        action = 'moveLeft'
        break
        
      case 'swipe-right':
        action = 'moveRight'
        break
        
      case 'swipe-up':
        action = 'jump'
        break
        
      case 'swipe-down':
        action = 'slide'
        break
        
      case 'hold':
        // Hold in pause zone = pause
        if (isInTouchZone(gesture.x, gesture.y, config.pauseZone)) {
          action = 'pause'
        }
        break
    }
    
    if (action) {
      this.emitInput(action)
      this.triggerHaptic(gesture.type)
    }
  }

  private startHoldDetection(_id: number, x: number, y: number): void {
    this.cancelHoldDetection()
    
    this.holdTimeout = window.setTimeout(() => {
      const gesture: GestureEvent = {
        type: 'hold',
        x,
        y,
        duration: this.config.holdDuration,
      }
      this.emitGesture(gesture)
      this.mapGestureToInput(gesture)
    }, this.config.holdDuration)
  }

  private cancelHoldDetection(): void {
    if (this.holdTimeout) {
      clearTimeout(this.holdTimeout)
      this.holdTimeout = null
    }
  }

  private emitInput(action: InputAction): void {
    this.callbacks.forEach(cb => cb(action))
  }

  private emitGesture(gesture: GestureEvent): void {
    this.gestureCallbacks.forEach(cb => cb(gesture))
  }

  private triggerHaptic(gestureType: GestureType): void {
    if (!this.hapticEnabled || !('vibrate' in navigator)) return
    
    const caps = getDeviceCapabilities()
    if (caps.prefersReducedMotion) return
    
    let pattern: number | number[]
    
    // Stronger, more impactful haptic patterns
    switch (gestureType) {
      case 'tap':
        pattern = 18 // Punchy tap feedback
        break
      case 'double-tap':
        pattern = [15, 40, 15] // Quick double pulse
        break
      case 'swipe-left':
      case 'swipe-right':
        pattern = 25 // Strong lane change feedback
        break
      case 'swipe-up':
        pattern = 35 // Powerful jump feedback
        break
      case 'swipe-down':
        pattern = 30 // Solid slide feedback
        break
      case 'hold':
        pattern = [25, 25, 25]
        break
      default:
        pattern = 15
    }
    
    try {
      navigator.vibrate(pattern)
    } catch {
      // Vibration not supported or blocked
    }
  }

  // Visual indicator methods
  private setupIndicatorContainer(parent: HTMLElement): void {
    this.indicatorContainer = document.createElement('div')
    this.indicatorContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
    `
    parent.appendChild(this.indicatorContainer)
  }

  private showIndicator(id: number, x: number, y: number): void {
    if (!this.indicatorContainer) return
    
    const indicator = document.createElement('div')
    indicator.style.cssText = `
      position: absolute;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(249, 115, 22, 0.3);
      border: 2px solid rgba(249, 115, 22, 0.6);
      transform: translate(-50%, -50%) scale(0.5);
      transition: transform 0.1s ease-out, opacity 0.15s ease-out;
      pointer-events: none;
    `
    indicator.style.left = `${x}px`
    indicator.style.top = `${y}px`
    
    this.indicatorContainer.appendChild(indicator)
    this.touchIndicators.set(id, indicator)
    
    // Animate in
    requestAnimationFrame(() => {
      indicator.style.transform = 'translate(-50%, -50%) scale(1)'
    })
  }

  private updateIndicator(id: number, x: number, y: number): void {
    const indicator = this.touchIndicators.get(id)
    if (indicator) {
      indicator.style.left = `${x}px`
      indicator.style.top = `${y}px`
    }
  }

  private hideIndicator(id: number): void {
    const indicator = this.touchIndicators.get(id)
    if (indicator) {
      indicator.style.opacity = '0'
      indicator.style.transform = 'translate(-50%, -50%) scale(1.5)'
      
      setTimeout(() => {
        indicator.remove()
        this.touchIndicators.delete(id)
      }, this.config.touchHighlightDuration)
    }
  }

  private clearIndicators(): void {
    this.touchIndicators.forEach(indicator => indicator.remove())
    this.touchIndicators.clear()
    
    if (this.indicatorContainer) {
      this.indicatorContainer.remove()
      this.indicatorContainer = null
    }
  }

  /**
   * Get active touch count
   */
  getActiveTouchCount(): number {
    return this.activeTouches.size
  }

  /**
   * Check if any touch is active
   */
  hasActiveTouch(): boolean {
    return this.activeTouches.size > 0
  }
}
