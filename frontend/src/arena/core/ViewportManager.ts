/**
 * Arena ViewportManager - Enterprise-grade responsive viewport handling
 * Ported from survival runner
 * 
 * Features:
 * - Safe area inset management
 * - Orientation change handling
 * - Fullscreen API integration
 * - Wake lock for mobile
 * - CSS custom property injection
 */

import type { DeviceCapabilities, SafeAreaInsets } from '../config/device'
import { getDeviceCapabilities, onDeviceCapabilitiesChange } from '../config/device'
import { getMobileConfig } from '../config/mobile'

export interface ViewportState {
  width: number
  height: number
  isPortrait: boolean
  isFullscreen: boolean
  safeAreaInsets: SafeAreaInsets
  visualViewportHeight: number
  scale: number
}

export interface ViewportCallbacks {
  onResize?: (state: ViewportState) => void
  onOrientationChange?: (isPortrait: boolean) => void
  onFullscreenChange?: (isFullscreen: boolean) => void
  onSafeAreaChange?: (insets: SafeAreaInsets) => void
  onKeyboardShow?: (keyboardHeight: number) => void
  onKeyboardHide?: () => void
}

export class ViewportManager {
  private static instance: ViewportManager | null = null
  
  private state: ViewportState
  private callbacks: ViewportCallbacks = {}
  private wakeLock: WakeLockSentinel | null = null
  private unsubscribeDeviceChanges: (() => void) | null = null
  private resizeTimeout: number | null = null
  private orientationTimeout: number | null = null

  private constructor() {
    const caps = getDeviceCapabilities()
    
    this.state = {
      width: window.innerWidth,
      height: window.innerHeight,
      isPortrait: caps.isPortrait,
      isFullscreen: this.checkFullscreen(),
      safeAreaInsets: caps.safeAreaInsets,
      visualViewportHeight: window.visualViewport?.height || window.innerHeight,
      scale: window.visualViewport?.scale || 1,
    }
    
    this.setupEventListeners()
    this.injectCSSVariables()
  }

  static getInstance(): ViewportManager {
    if (!ViewportManager.instance) {
      ViewportManager.instance = new ViewportManager()
    }
    return ViewportManager.instance
  }

  getState(): ViewportState { return { ...this.state } }

  setCallbacks(callbacks: ViewportCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  async requestFullscreen(element?: HTMLElement): Promise<boolean> {
    const target = element || document.documentElement
    try {
      if (target.requestFullscreen) {
        await target.requestFullscreen()
      } else if ((target as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
        await (target as HTMLElement & { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen()
      } else {
        return false
      }
      return true
    } catch (error) {
      console.warn('[ArenaViewport] Fullscreen request failed:', error)
      return false
    }
  }

  async exitFullscreen(): Promise<boolean> {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if ((document as Document & { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen) {
        await (document as Document & { webkitExitFullscreen: () => Promise<void> }).webkitExitFullscreen()
      } else {
        return false
      }
      return true
    } catch (error) {
      console.warn('[ArenaViewport] Exit fullscreen failed:', error)
      return false
    }
  }

  async toggleFullscreen(element?: HTMLElement): Promise<boolean> {
    return this.state.isFullscreen ? this.exitFullscreen() : this.requestFullscreen(element)
  }

  async requestWakeLock(): Promise<boolean> {
    const config = getMobileConfig()
    if (!config.enableWakeLock) return false
    
    try {
      if ('wakeLock' in navigator) {
        this.wakeLock = await navigator.wakeLock.request('screen')
        this.wakeLock.addEventListener('release', () => {
          console.log('[ArenaViewport] Wake lock released')
          this.wakeLock = null
        })
        console.log('[ArenaViewport] Wake lock acquired')
        return true
      }
    } catch (error) {
      console.warn('[ArenaViewport] Wake lock request failed:', error)
    }
    return false
  }

  async releaseWakeLock(): Promise<void> {
    if (this.wakeLock) {
      await this.wakeLock.release()
      this.wakeLock = null
    }
  }


  async lockOrientation(orientation: 'landscape' | 'portrait' | 'landscape-primary' | 'landscape-secondary' | 'portrait-primary' | 'portrait-secondary' = 'landscape'): Promise<boolean> {
    try {
      if (screen.orientation && 'lock' in screen.orientation) {
        await (screen.orientation.lock as (orientation: string) => Promise<void>)(orientation)
        return true
      }
    } catch (error) {
      console.warn('[ArenaViewport] Orientation lock failed:', error)
    }
    return false
  }

  unlockOrientation(): void {
    try {
      if (screen.orientation && 'unlock' in screen.orientation) {
        screen.orientation.unlock()
      }
    } catch { /* Ignore */ }
  }

  getSafeAreaCSS(): Record<string, string> {
    const insets = this.state.safeAreaInsets
    return {
      '--safe-area-top': `${insets.top}px`,
      '--safe-area-right': `${insets.right}px`,
      '--safe-area-bottom': `${insets.bottom}px`,
      '--safe-area-left': `${insets.left}px`,
    }
  }

  getViewportCSS(): Record<string, string> {
    return {
      '--viewport-width': `${this.state.width}px`,
      '--viewport-height': `${this.state.height}px`,
      '--visual-viewport-height': `${this.state.visualViewportHeight}px`,
      '--viewport-scale': `${this.state.scale}`,
    }
  }

  dispose(): void {
    window.removeEventListener('resize', this.handleResize)
    window.removeEventListener('orientationchange', this.handleOrientationChange)
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange)
    document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange)
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this.handleVisualViewportResize)
    }
    
    if (this.unsubscribeDeviceChanges) this.unsubscribeDeviceChanges()
    this.releaseWakeLock()
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout)
    if (this.orientationTimeout) clearTimeout(this.orientationTimeout)
    
    ViewportManager.instance = null
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.handleResize)
    window.addEventListener('orientationchange', this.handleOrientationChange)
    document.addEventListener('fullscreenchange', this.handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange)
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', this.handleVisualViewportResize)
    }
    
    this.unsubscribeDeviceChanges = onDeviceCapabilitiesChange(this.handleDeviceCapabilitiesChange.bind(this))
  }

  private handleResize = (): void => {
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout)
    this.resizeTimeout = window.setTimeout(() => {
      this.updateState()
      this.injectCSSVariables()
      this.callbacks.onResize?.(this.state)
    }, 100) as unknown as number
  }

  private handleOrientationChange = (): void => {
    if (this.orientationTimeout) clearTimeout(this.orientationTimeout)
    this.orientationTimeout = window.setTimeout(() => {
      const wasPortrait = this.state.isPortrait
      this.updateState()
      this.injectCSSVariables()
      if (wasPortrait !== this.state.isPortrait) {
        this.callbacks.onOrientationChange?.(this.state.isPortrait)
      }
    }, 150) as unknown as number
  }

  private handleFullscreenChange = (): void => {
    const wasFullscreen = this.state.isFullscreen
    this.state.isFullscreen = this.checkFullscreen()
    if (wasFullscreen !== this.state.isFullscreen) {
      this.callbacks.onFullscreenChange?.(this.state.isFullscreen)
    }
  }

  private handleVisualViewportResize = (): void => {
    if (!window.visualViewport) return
    const newHeight = window.visualViewport.height
    const heightDiff = this.state.height - newHeight
    
    if (heightDiff > 100) {
      this.callbacks.onKeyboardShow?.(heightDiff)
    } else if (this.state.visualViewportHeight < this.state.height - 100 && newHeight >= this.state.height - 50) {
      this.callbacks.onKeyboardHide?.()
    }
    
    this.state.visualViewportHeight = newHeight
    this.state.scale = window.visualViewport.scale
    this.injectCSSVariables()
  }

  private handleDeviceCapabilitiesChange = (caps: DeviceCapabilities): void => {
    const oldInsets = this.state.safeAreaInsets
    this.state.safeAreaInsets = caps.safeAreaInsets
    if (JSON.stringify(oldInsets) !== JSON.stringify(caps.safeAreaInsets)) {
      this.injectCSSVariables()
      this.callbacks.onSafeAreaChange?.(caps.safeAreaInsets)
    }
  }

  private handleVisibilityChange = async (): Promise<void> => {
    if (document.visibilityState === 'visible' && !this.wakeLock) {
      const config = getMobileConfig()
      if (config.enableWakeLock) await this.requestWakeLock()
    }
  }

  private updateState(): void {
    const caps = getDeviceCapabilities()
    this.state = {
      ...this.state,
      width: window.innerWidth,
      height: window.innerHeight,
      isPortrait: caps.isPortrait,
      safeAreaInsets: caps.safeAreaInsets,
      visualViewportHeight: window.visualViewport?.height || window.innerHeight,
      scale: window.visualViewport?.scale || 1,
    }
  }

  private checkFullscreen(): boolean {
    return !!(document.fullscreenElement || (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement)
  }

  private injectCSSVariables(): void {
    const root = document.documentElement
    
    Object.entries(this.getSafeAreaCSS()).forEach(([key, value]) => root.style.setProperty(key, value))
    Object.entries(this.getViewportCSS()).forEach(([key, value]) => root.style.setProperty(key, value))
    
    const caps = getDeviceCapabilities()
    root.classList.remove('device-mobile', 'device-tablet', 'device-desktop')
    root.classList.add(`device-${caps.deviceType}`)
    root.classList.remove('orientation-portrait', 'orientation-landscape')
    root.classList.add(`orientation-${this.state.isPortrait ? 'portrait' : 'landscape'}`)
    
    if (caps.touchSupported) root.classList.add('touch-device')
    else root.classList.remove('touch-device')
  }
}

// Export singleton accessor
export function getViewportManager(): ViewportManager {
  return ViewportManager.getInstance()
}

export function getViewportState(): ViewportState {
  return ViewportManager.getInstance().getState()
}

// Convenience functions
export async function requestFullscreen(element?: HTMLElement): Promise<boolean> {
  return ViewportManager.getInstance().requestFullscreen(element)
}

export async function exitFullscreen(): Promise<boolean> {
  return ViewportManager.getInstance().exitFullscreen()
}

export async function requestWakeLock(): Promise<boolean> {
  return ViewportManager.getInstance().requestWakeLock()
}

export async function releaseWakeLock(): Promise<void> {
  return ViewportManager.getInstance().releaseWakeLock()
}
