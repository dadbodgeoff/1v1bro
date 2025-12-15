/**
 * ViewportManager - Enterprise-grade responsive viewport handling
 * 
 * Features:
 * - Safe area inset management
 * - Orientation change handling
 * - Fullscreen API integration
 * - Wake lock for mobile
 * - Viewport meta tag management
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
  visualViewportHeight: number  // Accounts for virtual keyboard
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
  private resizeObserver: ResizeObserver | null = null
  private visualViewportHandler: (() => void) | null = null
  private unsubscribeDeviceChanges: (() => void) | null = null
  
  // Debounce timers
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

  /**
   * Get current viewport state
   */
  getState(): ViewportState {
    return { ...this.state }
  }

  /**
   * Set callbacks for viewport events
   */
  setCallbacks(callbacks: ViewportCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  /**
   * Request fullscreen mode
   */
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
      console.warn('[ViewportManager] Fullscreen request failed:', error)
      return false
    }
  }

  /**
   * Exit fullscreen mode
   */
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
      console.warn('[ViewportManager] Exit fullscreen failed:', error)
      return false
    }
  }

  /**
   * Toggle fullscreen mode
   */
  async toggleFullscreen(element?: HTMLElement): Promise<boolean> {
    if (this.state.isFullscreen) {
      return this.exitFullscreen()
    } else {
      return this.requestFullscreen(element)
    }
  }

  /**
   * Request wake lock (prevent screen sleep)
   */
  async requestWakeLock(): Promise<boolean> {
    const config = getMobileConfig()
    if (!config.enableWakeLock) return false
    
    try {
      if ('wakeLock' in navigator) {
        this.wakeLock = await navigator.wakeLock.request('screen')
        
        this.wakeLock.addEventListener('release', () => {
          console.log('[ViewportManager] Wake lock released')
          this.wakeLock = null
        })
        
        console.log('[ViewportManager] Wake lock acquired')
        return true
      }
    } catch (error) {
      console.warn('[ViewportManager] Wake lock request failed:', error)
    }
    
    return false
  }

  /**
   * Release wake lock
   */
  async releaseWakeLock(): Promise<void> {
    if (this.wakeLock) {
      await this.wakeLock.release()
      this.wakeLock = null
    }
  }

  /**
   * Lock screen orientation (mobile only)
   */
  async lockOrientation(orientation: 'landscape' | 'portrait' | 'landscape-primary' | 'landscape-secondary' | 'portrait-primary' | 'portrait-secondary' = 'landscape'): Promise<boolean> {
    try {
      if (screen.orientation && 'lock' in screen.orientation) {
        await (screen.orientation.lock as (orientation: string) => Promise<void>)(orientation)
        return true
      }
    } catch (error) {
      console.warn('[ViewportManager] Orientation lock failed:', error)
    }
    return false
  }

  /**
   * Unlock screen orientation
   */
  unlockOrientation(): void {
    try {
      if (screen.orientation && 'unlock' in screen.orientation) {
        screen.orientation.unlock()
      }
    } catch {
      // Ignore errors
    }
  }

  /**
   * Get safe area CSS values
   */
  getSafeAreaCSS(): Record<string, string> {
    const insets = this.state.safeAreaInsets
    return {
      '--safe-area-top': `${insets.top}px`,
      '--safe-area-right': `${insets.right}px`,
      '--safe-area-bottom': `${insets.bottom}px`,
      '--safe-area-left': `${insets.left}px`,
    }
  }

  /**
   * Get viewport CSS values
   */
  getViewportCSS(): Record<string, string> {
    return {
      '--viewport-width': `${this.state.width}px`,
      '--viewport-height': `${this.state.height}px`,
      '--visual-viewport-height': `${this.state.visualViewportHeight}px`,
      '--viewport-scale': `${this.state.scale}`,
    }
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize)
    window.removeEventListener('orientationchange', this.handleOrientationChange)
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange)
    document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange)
    
    if (this.visualViewportHandler && window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this.visualViewportHandler)
    }
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }
    
    if (this.unsubscribeDeviceChanges) {
      this.unsubscribeDeviceChanges()
    }
    
    // Release wake lock
    this.releaseWakeLock()
    
    // Clear timeouts
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout)
    if (this.orientationTimeout) clearTimeout(this.orientationTimeout)
    
    ViewportManager.instance = null
  }

  private setupEventListeners(): void {
    // Window resize
    window.addEventListener('resize', this.handleResize)
    
    // Orientation change
    window.addEventListener('orientationchange', this.handleOrientationChange)
    
    // Fullscreen change
    document.addEventListener('fullscreenchange', this.handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange)
    
    // Visual viewport (for virtual keyboard detection)
    if (window.visualViewport) {
      this.visualViewportHandler = this.handleVisualViewportResize.bind(this)
      window.visualViewport.addEventListener('resize', this.visualViewportHandler)
    }
    
    // Device capability changes
    this.unsubscribeDeviceChanges = onDeviceCapabilitiesChange(
      this.handleDeviceCapabilitiesChange.bind(this)
    )
    
    // Visibility change (re-acquire wake lock)
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
  }

  private handleResize = (): void => {
    // Debounce resize events
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout)
    }
    
    this.resizeTimeout = window.setTimeout(() => {
      this.updateState()
      this.injectCSSVariables()
      this.callbacks.onResize?.(this.state)
    }, 100) as unknown as number
  }

  private handleOrientationChange = (): void => {
    // Delay to allow browser to update dimensions
    if (this.orientationTimeout) {
      clearTimeout(this.orientationTimeout)
    }
    
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
    
    // Detect keyboard show/hide (significant height change)
    if (heightDiff > 100) {
      this.callbacks.onKeyboardShow?.(heightDiff)
    } else if (this.state.visualViewportHeight < this.state.height - 100 && 
               newHeight >= this.state.height - 50) {
      this.callbacks.onKeyboardHide?.()
    }
    
    this.state.visualViewportHeight = newHeight
    this.state.scale = window.visualViewport.scale
    this.injectCSSVariables()
  }

  private handleDeviceCapabilitiesChange = (caps: DeviceCapabilities): void => {
    const oldInsets = this.state.safeAreaInsets
    this.state.safeAreaInsets = caps.safeAreaInsets
    
    // Check if safe area changed
    if (JSON.stringify(oldInsets) !== JSON.stringify(caps.safeAreaInsets)) {
      this.injectCSSVariables()
      this.callbacks.onSafeAreaChange?.(caps.safeAreaInsets)
    }
  }

  private handleVisibilityChange = async (): Promise<void> => {
    if (document.visibilityState === 'visible' && !this.wakeLock) {
      // Re-acquire wake lock when returning to foreground
      const config = getMobileConfig()
      if (config.enableWakeLock) {
        await this.requestWakeLock()
      }
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
    return !!(
      document.fullscreenElement ||
      (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement
    )
  }

  private injectCSSVariables(): void {
    const root = document.documentElement
    
    // Safe area insets
    const safeAreaCSS = this.getSafeAreaCSS()
    Object.entries(safeAreaCSS).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
    
    // Viewport dimensions
    const viewportCSS = this.getViewportCSS()
    Object.entries(viewportCSS).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
    
    // Device type class
    const caps = getDeviceCapabilities()
    root.classList.remove('device-mobile', 'device-tablet', 'device-desktop')
    root.classList.add(`device-${caps.deviceType}`)
    
    // Orientation class
    root.classList.remove('orientation-portrait', 'orientation-landscape')
    root.classList.add(`orientation-${this.state.isPortrait ? 'portrait' : 'landscape'}`)
    
    // Touch device class
    if (caps.touchSupported) {
      root.classList.add('touch-device')
    } else {
      root.classList.remove('touch-device')
    }
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
