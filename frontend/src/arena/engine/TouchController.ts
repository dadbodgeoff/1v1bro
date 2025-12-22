/**
 * Arena TouchController - Touch input handling for arena combat
 * Ported from survival runner with arena-specific adaptations
 * 
 * Features:
 * - Virtual joystick for movement
 * - Touch-to-aim with sensitivity control
 * - Fire/reload/weapon switch buttons
 * - Haptic feedback
 * - Visual touch indicators
 */

import type { TouchZoneConfig } from '../config/mobile'
import { getMobileConfig, isInTouchZone } from '../config/mobile'
import { getDeviceCapabilities } from '../config/device'

export type ArenaInputAction = 
  | 'moveForward' | 'moveBackward' | 'moveLeft' | 'moveRight'
  | 'fire' | 'reload' | 'weaponSwitch' | 'aim'
  | 'pause' | 'interact'

export type GestureType = 'tap' | 'double-tap' | 'hold' | 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down'

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

export interface JoystickState {
  active: boolean
  x: number  // -1 to 1
  y: number  // -1 to 1
  angle: number
  magnitude: number
}

export interface AimState {
  active: boolean
  deltaX: number
  deltaY: number
}

type InputCallback = (action: ArenaInputAction) => void
type JoystickCallback = (state: JoystickState) => void
type AimCallback = (state: AimState) => void
type GestureCallback = (gesture: GestureEvent) => void

export class TouchController {
  private config: TouchZoneConfig
  private callbacks: Set<InputCallback> = new Set()
  private joystickCallbacks: Set<JoystickCallback> = new Set()
  private aimCallbacks: Set<AimCallback> = new Set()
  private gestureCallbacks: Set<GestureCallback> = new Set()
  private enabled: boolean = true
  
  // Active touches
  private activeTouches: Map<number, TouchEvent> = new Map()
  
  // Joystick state
  private joystickTouchId: number | null = null
  private joystickOrigin: { x: number; y: number } | null = null
  private joystickState: JoystickState = { active: false, x: 0, y: 0, angle: 0, magnitude: 0 }
  
  // Aim state
  private aimTouchId: number | null = null
  private lastAimPosition: { x: number; y: number } | null = null
  
  // Gesture detection state (for double-tap detection) - exposed for external use
  public gestureState = {
    lastTapTime: 0,
    lastTapX: 0,
    lastTapY: 0,
  }
  private holdTimeout: number | null = null
  
  // Visual feedback
  private touchIndicators: Map<number, HTMLElement> = new Map()
  private indicatorContainer: HTMLElement | null = null
  private joystickVisual: HTMLElement | null = null
  
  // Haptic
  private hapticEnabled: boolean = false
  
  // Bound handlers
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
    
    this.boundHandlers = {
      touchStart: this.handleTouchStart.bind(this),
      touchMove: this.handleTouchMove.bind(this),
      touchEnd: this.handleTouchEnd.bind(this),
      touchCancel: this.handleTouchCancel.bind(this),
    }
  }

  attach(container?: HTMLElement): void {
    const target = container || document.body
    target.addEventListener('touchstart', this.boundHandlers.touchStart, { passive: false })
    target.addEventListener('touchmove', this.boundHandlers.touchMove, { passive: false })
    target.addEventListener('touchend', this.boundHandlers.touchEnd, { passive: false })
    target.addEventListener('touchcancel', this.boundHandlers.touchCancel, { passive: false })
    
    if (this.config.showTouchIndicators) {
      this.setupIndicatorContainer(target)
    }
  }

  detach(): void {
    document.body.removeEventListener('touchstart', this.boundHandlers.touchStart)
    document.body.removeEventListener('touchmove', this.boundHandlers.touchMove)
    document.body.removeEventListener('touchend', this.boundHandlers.touchEnd)
    document.body.removeEventListener('touchcancel', this.boundHandlers.touchCancel)
    
    this.clearIndicators()
    this.activeTouches.clear()
    if (this.holdTimeout) clearTimeout(this.holdTimeout)
  }

  onInput(callback: InputCallback): () => void {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  onJoystick(callback: JoystickCallback): () => void {
    this.joystickCallbacks.add(callback)
    return () => this.joystickCallbacks.delete(callback)
  }

  onAim(callback: AimCallback): () => void {
    this.aimCallbacks.add(callback)
    return () => this.aimCallbacks.delete(callback)
  }

  onGesture(callback: GestureCallback): () => void {
    this.gestureCallbacks.add(callback)
    return () => this.gestureCallbacks.delete(callback)
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) {
      this.activeTouches.clear()
      this.clearIndicators()
      this.resetJoystick()
      this.resetAim()
    }
  }

  updateConfig(config: Partial<TouchZoneConfig>): void {
    this.config = { ...this.config, ...config }
  }

  getJoystickState(): JoystickState { return { ...this.joystickState } }


  private handleTouchStart(e: globalThis.TouchEvent): void {
    if (!this.enabled) return
    
    const target = e.target as HTMLElement
    const isUIElement = target.closest('button, a, [role="button"], .z-10, .z-20, .z-30')
    if (isUIElement) return
    
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
      
      // Determine touch zone
      if (isInTouchZone(touch.clientX, touch.clientY, this.config.moveZone) && this.joystickTouchId === null) {
        this.joystickTouchId = touch.identifier
        this.joystickOrigin = { x: touch.clientX, y: touch.clientY }
        this.showJoystickVisual(touch.clientX, touch.clientY)
      } else if (isInTouchZone(touch.clientX, touch.clientY, this.config.aimZone) && this.aimTouchId === null) {
        this.aimTouchId = touch.identifier
        this.lastAimPosition = { x: touch.clientX, y: touch.clientY }
      } else if (isInTouchZone(touch.clientX, touch.clientY, this.config.fireZone)) {
        this.emitInput('fire')
        this.triggerHaptic('tap')
      } else if (isInTouchZone(touch.clientX, touch.clientY, this.config.reloadZone)) {
        this.emitInput('reload')
        this.triggerHaptic('tap')
      } else if (isInTouchZone(touch.clientX, touch.clientY, this.config.weaponSwitchZone)) {
        this.emitInput('weaponSwitch')
        this.triggerHaptic('tap')
      } else if (isInTouchZone(touch.clientX, touch.clientY, this.config.pauseZone)) {
        this.emitInput('pause')
      }
      
      if (this.config.showTouchIndicators) {
        this.showIndicator(touch.identifier, touch.clientX, touch.clientY)
      }
    }
  }

  private handleTouchMove(e: globalThis.TouchEvent): void {
    if (!this.enabled) return
    
    const target = e.target as HTMLElement
    const isUIElement = target.closest('button, a, [role="button"], .z-10, .z-20, .z-30')
    if (!isUIElement) e.preventDefault()
    
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
        
        // Update joystick
        if (touch.identifier === this.joystickTouchId && this.joystickOrigin) {
          this.updateJoystick(touch.clientX, touch.clientY)
        }
        
        // Update aim
        if (touch.identifier === this.aimTouchId && this.lastAimPosition) {
          const deltaX = touch.clientX - this.lastAimPosition.x
          const deltaY = touch.clientY - this.lastAimPosition.y
          this.emitAim({ active: true, deltaX, deltaY })
          this.lastAimPosition = { x: touch.clientX, y: touch.clientY }
        }
        
        if (this.config.showTouchIndicators) {
          this.updateIndicator(touch.identifier, touch.clientX, touch.clientY)
        }
      }
    }
  }

  private handleTouchEnd(e: globalThis.TouchEvent): void {
    if (!this.enabled) return
    e.preventDefault()
    
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]
      
      if (touch.identifier === this.joystickTouchId) {
        this.resetJoystick()
      }
      
      if (touch.identifier === this.aimTouchId) {
        this.resetAim()
      }
      
      this.activeTouches.delete(touch.identifier)
      
      if (this.config.showTouchIndicators) {
        this.hideIndicator(touch.identifier)
      }
    }
  }

  private handleTouchCancel(e: globalThis.TouchEvent): void {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]
      if (touch.identifier === this.joystickTouchId) this.resetJoystick()
      if (touch.identifier === this.aimTouchId) this.resetAim()
      this.activeTouches.delete(touch.identifier)
      this.hideIndicator(touch.identifier)
    }
  }

  private updateJoystick(x: number, y: number): void {
    if (!this.joystickOrigin) return
    
    const dx = x - this.joystickOrigin.x
    const dy = y - this.joystickOrigin.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const maxRadius = this.config.joystickMaxRadius
    
    // Clamp to max radius
    const clampedDistance = Math.min(distance, maxRadius)
    const angle = Math.atan2(dy, dx)
    
    // Normalize to -1 to 1
    let normalizedX = (clampedDistance / maxRadius) * Math.cos(angle)
    let normalizedY = (clampedDistance / maxRadius) * Math.sin(angle)
    
    // Apply deadzone
    const magnitude = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY)
    if (magnitude < this.config.joystickDeadzone) {
      normalizedX = 0
      normalizedY = 0
    } else {
      // Rescale to remove deadzone
      const scale = (magnitude - this.config.joystickDeadzone) / (1 - this.config.joystickDeadzone)
      normalizedX = (normalizedX / magnitude) * scale
      normalizedY = (normalizedY / magnitude) * scale
    }
    
    this.joystickState = {
      active: true,
      x: normalizedX,
      y: normalizedY,
      angle,
      magnitude: Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY),
    }
    
    this.emitJoystick(this.joystickState)
    this.updateJoystickVisual(x, y)
  }

  private resetJoystick(): void {
    this.joystickTouchId = null
    this.joystickOrigin = null
    this.joystickState = { active: false, x: 0, y: 0, angle: 0, magnitude: 0 }
    this.emitJoystick(this.joystickState)
    this.hideJoystickVisual()
  }

  private resetAim(): void {
    this.aimTouchId = null
    this.lastAimPosition = null
    this.emitAim({ active: false, deltaX: 0, deltaY: 0 })
  }

  private emitInput(action: ArenaInputAction): void {
    this.callbacks.forEach(cb => cb(action))
  }

  private emitJoystick(state: JoystickState): void {
    this.joystickCallbacks.forEach(cb => cb(state))
  }

  private emitAim(state: AimState): void {
    this.aimCallbacks.forEach(cb => cb(state))
  }

  /** Emit gesture event to registered callbacks */
  emitGesture(gesture: GestureEvent): void {
    this.gestureCallbacks.forEach(cb => cb(gesture))
  }

  private triggerHaptic(gestureType: GestureType | 'tap'): void {
    if (!this.hapticEnabled || !('vibrate' in navigator)) return
    const caps = getDeviceCapabilities()
    if (caps.prefersReducedMotion) return
    
    let pattern: number | number[]
    switch (gestureType) {
      case 'tap': pattern = 15; break
      case 'double-tap': pattern = [12, 30, 12]; break
      default: pattern = 10
    }
    
    try { navigator.vibrate(pattern) } catch { /* Vibration blocked */ }
  }

  // Visual indicator methods
  private setupIndicatorContainer(parent: HTMLElement): void {
    this.indicatorContainer = document.createElement('div')
    this.indicatorContainer.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;`
    parent.appendChild(this.indicatorContainer)
  }

  private showIndicator(id: number, x: number, y: number): void {
    if (!this.indicatorContainer) return
    const indicator = document.createElement('div')
    indicator.style.cssText = `position:absolute;width:50px;height:50px;border-radius:50%;background:rgba(249,115,22,0.25);border:2px solid rgba(249,115,22,0.5);transform:translate(-50%,-50%) scale(0.5);transition:transform 0.1s ease-out,opacity 0.15s ease-out;pointer-events:none;`
    indicator.style.left = `${x}px`
    indicator.style.top = `${y}px`
    this.indicatorContainer.appendChild(indicator)
    this.touchIndicators.set(id, indicator)
    requestAnimationFrame(() => { indicator.style.transform = 'translate(-50%,-50%) scale(1)' })
  }

  private updateIndicator(id: number, x: number, y: number): void {
    const indicator = this.touchIndicators.get(id)
    if (indicator) { indicator.style.left = `${x}px`; indicator.style.top = `${y}px` }
  }

  private hideIndicator(id: number): void {
    const indicator = this.touchIndicators.get(id)
    if (indicator) {
      indicator.style.opacity = '0'
      indicator.style.transform = 'translate(-50%,-50%) scale(1.5)'
      setTimeout(() => { indicator.remove(); this.touchIndicators.delete(id) }, this.config.touchHighlightDuration)
    }
  }

  private showJoystickVisual(x: number, y: number): void {
    if (!this.indicatorContainer) return
    this.joystickVisual = document.createElement('div')
    this.joystickVisual.innerHTML = `
      <div style="position:absolute;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,0.1);border:2px solid rgba(255,255,255,0.3);transform:translate(-50%,-50%);"></div>
      <div class="joystick-knob" style="position:absolute;width:40px;height:40px;border-radius:50%;background:rgba(249,115,22,0.6);border:2px solid rgba(249,115,22,0.8);transform:translate(-50%,-50%);"></div>
    `
    this.joystickVisual.style.cssText = `position:absolute;pointer-events:none;`
    this.joystickVisual.style.left = `${x}px`
    this.joystickVisual.style.top = `${y}px`
    this.indicatorContainer.appendChild(this.joystickVisual)
  }

  private updateJoystickVisual(x: number, y: number): void {
    if (!this.joystickVisual || !this.joystickOrigin) return
    const knob = this.joystickVisual.querySelector('.joystick-knob') as HTMLElement
    if (knob) {
      const dx = x - this.joystickOrigin.x
      const dy = y - this.joystickOrigin.y
      const distance = Math.min(Math.sqrt(dx * dx + dy * dy), this.config.joystickMaxRadius)
      const angle = Math.atan2(dy, dx)
      const clampedX = distance * Math.cos(angle)
      const clampedY = distance * Math.sin(angle)
      knob.style.transform = `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`
    }
  }

  private hideJoystickVisual(): void {
    if (this.joystickVisual) { this.joystickVisual.remove(); this.joystickVisual = null }
  }

  private clearIndicators(): void {
    this.touchIndicators.forEach(indicator => indicator.remove())
    this.touchIndicators.clear()
    this.hideJoystickVisual()
    if (this.indicatorContainer) { this.indicatorContainer.remove(); this.indicatorContainer = null }
  }

  getActiveTouchCount(): number { return this.activeTouches.size }
  hasActiveTouch(): boolean { return this.activeTouches.size > 0 }
}
