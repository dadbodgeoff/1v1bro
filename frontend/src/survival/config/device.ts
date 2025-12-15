/**
 * Device Detection & Capability System
 * Enterprise-grade device profiling for adaptive performance
 * 
 * Features:
 * - Hardware capability detection
 * - Performance tier classification
 * - Touch/input capability detection
 * - Memory and GPU profiling
 * - Responsive breakpoint management
 */

export type DeviceType = 'mobile' | 'tablet' | 'desktop'
export type PerformanceTier = 'low' | 'medium' | 'high' | 'ultra'
export type InputMode = 'touch' | 'keyboard' | 'gamepad' | 'hybrid'

export interface DeviceCapabilities {
  // Device classification
  deviceType: DeviceType
  performanceTier: PerformanceTier
  inputMode: InputMode
  
  // Screen properties
  screenWidth: number
  screenHeight: number
  pixelRatio: number
  isPortrait: boolean
  safeAreaInsets: SafeAreaInsets
  
  // Hardware capabilities
  maxTextureSize: number
  maxRenderbufferSize: number
  supportsWebGL2: boolean
  supportsFloatTextures: boolean
  gpuTier: number // 0-3 (0=integrated/low, 3=high-end discrete)
  
  // Memory estimates
  estimatedMemoryMB: number
  isLowMemory: boolean
  
  // Touch capabilities
  touchSupported: boolean
  multiTouchSupported: boolean
  maxTouchPoints: number
  
  // Browser/platform
  isMobile: boolean
  isIOS: boolean
  isAndroid: boolean
  isSafari: boolean
  isChrome: boolean
  
  // Performance flags
  prefersReducedMotion: boolean
  isLowPowerMode: boolean
  connectionType: 'slow-2g' | '2g' | '3g' | '4g' | 'wifi' | 'unknown'
}

export interface SafeAreaInsets {
  top: number
  right: number
  bottom: number
  left: number
}

export interface Breakpoints {
  xs: number  // < 480px (small phones)
  sm: number  // 480-768px (large phones)
  md: number  // 768-1024px (tablets)
  lg: number  // 1024-1440px (laptops)
  xl: number  // > 1440px (desktops)
}

export const BREAKPOINTS: Breakpoints = {
  xs: 480,
  sm: 768,
  md: 1024,
  lg: 1440,
  xl: 1920,
}

/**
 * Singleton device detector with caching
 */
class DeviceDetector {
  private static instance: DeviceDetector | null = null
  private capabilities: DeviceCapabilities | null = null
  private listeners: Set<(caps: DeviceCapabilities) => void> = new Set()
  private resizeTimeout: number | null = null

  private constructor() {
    this.setupEventListeners()
  }

  static getInstance(): DeviceDetector {
    if (!DeviceDetector.instance) {
      DeviceDetector.instance = new DeviceDetector()
    }
    return DeviceDetector.instance
  }

  /**
   * Get current device capabilities (cached)
   */
  getCapabilities(): DeviceCapabilities {
    if (!this.capabilities) {
      this.capabilities = this.detectCapabilities()
    }
    return this.capabilities
  }

  /**
   * Force re-detection (useful after orientation change)
   */
  refresh(): DeviceCapabilities {
    this.capabilities = this.detectCapabilities()
    this.notifyListeners()
    return this.capabilities
  }

  /**
   * Subscribe to capability changes
   */
  onChange(callback: (caps: DeviceCapabilities) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private notifyListeners(): void {
    if (this.capabilities) {
      this.listeners.forEach(cb => cb(this.capabilities!))
    }
  }

  private setupEventListeners(): void {
    // Debounced resize handler
    window.addEventListener('resize', () => {
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout)
      }
      this.resizeTimeout = window.setTimeout(() => {
        this.refresh()
      }, 150) as unknown as number
    })

    // Orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.refresh(), 100)
    })

    // Visibility change (for low power mode detection)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.refresh()
      }
    })
  }

  private detectCapabilities(): DeviceCapabilities {
    const ua = navigator.userAgent.toLowerCase()
    
    // Platform detection
    const isIOS = /iphone|ipad|ipod/.test(ua) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const isAndroid = /android/.test(ua)
    const isMobile = isIOS || isAndroid || /mobile/.test(ua)
    const isSafari = /safari/.test(ua) && !/chrome/.test(ua)
    const isChrome = /chrome/.test(ua) && !/edge/.test(ua)

    // Screen properties
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 3)
    const isPortrait = screenHeight > screenWidth

    // Device type classification
    const deviceType = this.classifyDeviceType(screenWidth, isMobile)
    
    // Touch capabilities
    const touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const maxTouchPoints = navigator.maxTouchPoints || 0
    const multiTouchSupported = maxTouchPoints > 1

    // WebGL capabilities
    const glInfo = this.detectWebGLCapabilities()
    
    // Memory estimation
    const memoryInfo = this.estimateMemory()
    
    // Performance tier
    const performanceTier = this.classifyPerformanceTier(
      deviceType,
      glInfo.gpuTier,
      memoryInfo.estimatedMemoryMB,
      pixelRatio
    )

    // Input mode
    const inputMode = this.detectInputMode(touchSupported, isMobile)

    // Safe area insets (for notched devices)
    const safeAreaInsets = this.getSafeAreaInsets()

    // Connection type
    const connectionType = this.detectConnectionType()

    // Reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Low power mode (heuristic)
    const isLowPowerMode = this.detectLowPowerMode()

    return {
      deviceType,
      performanceTier,
      inputMode,
      screenWidth,
      screenHeight,
      pixelRatio,
      isPortrait,
      safeAreaInsets,
      maxTextureSize: glInfo.maxTextureSize,
      maxRenderbufferSize: glInfo.maxRenderbufferSize,
      supportsWebGL2: glInfo.supportsWebGL2,
      supportsFloatTextures: glInfo.supportsFloatTextures,
      gpuTier: glInfo.gpuTier,
      estimatedMemoryMB: memoryInfo.estimatedMemoryMB,
      isLowMemory: memoryInfo.isLowMemory,
      touchSupported,
      multiTouchSupported,
      maxTouchPoints,
      isMobile,
      isIOS,
      isAndroid,
      isSafari,
      isChrome,
      prefersReducedMotion,
      isLowPowerMode,
      connectionType,
    }
  }

  private classifyDeviceType(screenWidth: number, isMobile: boolean): DeviceType {
    if (screenWidth < BREAKPOINTS.sm) return 'mobile'
    if (screenWidth < BREAKPOINTS.md || isMobile) return 'tablet'
    return 'desktop'
  }

  private detectWebGLCapabilities(): {
    maxTextureSize: number
    maxRenderbufferSize: number
    supportsWebGL2: boolean
    supportsFloatTextures: boolean
    gpuTier: number
  } {
    const canvas = document.createElement('canvas')
    let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null
    let supportsWebGL2 = false

    try {
      gl = canvas.getContext('webgl2') as WebGL2RenderingContext
      if (gl) {
        supportsWebGL2 = true
      } else {
        gl = canvas.getContext('webgl') as WebGLRenderingContext
      }
    } catch {
      // WebGL not supported
    }

    if (!gl) {
      return {
        maxTextureSize: 2048,
        maxRenderbufferSize: 2048,
        supportsWebGL2: false,
        supportsFloatTextures: false,
        gpuTier: 0,
      }
    }

    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048
    const maxRenderbufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) || 2048
    
    // Check float texture support
    const supportsFloatTextures = supportsWebGL2 || 
      !!gl.getExtension('OES_texture_float')

    // GPU tier estimation based on capabilities
    let gpuTier = 1
    if (maxTextureSize >= 16384 && supportsWebGL2) {
      gpuTier = 3 // High-end
    } else if (maxTextureSize >= 8192) {
      gpuTier = 2 // Mid-range
    } else if (maxTextureSize >= 4096) {
      gpuTier = 1 // Low-mid
    } else {
      gpuTier = 0 // Low-end
    }

    // Try to get GPU info from debug extension
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || ''
      const rendererLower = renderer.toLowerCase()
      
      // Boost tier for known high-end GPUs
      if (/nvidia|geforce|rtx|gtx/.test(rendererLower) ||
          /radeon rx|amd/.test(rendererLower) ||
          /apple m[123]/.test(rendererLower)) {
        gpuTier = Math.max(gpuTier, 2)
      }
      
      // Lower tier for known integrated GPUs
      if (/intel|integrated|mali-4|adreno 3/.test(rendererLower)) {
        gpuTier = Math.min(gpuTier, 1)
      }
    }

    return {
      maxTextureSize,
      maxRenderbufferSize,
      supportsWebGL2,
      supportsFloatTextures,
      gpuTier,
    }
  }

  private estimateMemory(): { estimatedMemoryMB: number; isLowMemory: boolean } {
    // Try to get actual memory info (Chrome only)
    const nav = navigator as Navigator & { deviceMemory?: number }
    if (nav.deviceMemory) {
      const memoryGB = nav.deviceMemory
      return {
        estimatedMemoryMB: memoryGB * 1024,
        isLowMemory: memoryGB <= 2,
      }
    }

    // Fallback: estimate based on device type
    const ua = navigator.userAgent.toLowerCase()
    const isOldDevice = /iphone [5-7]|ipad (2|3|4|mini)|android 4/.test(ua)
    
    if (isOldDevice) {
      return { estimatedMemoryMB: 1024, isLowMemory: true }
    }

    // Default estimates
    const isMobile = /mobile|android|iphone|ipad/.test(ua)
    return {
      estimatedMemoryMB: isMobile ? 3072 : 8192,
      isLowMemory: false,
    }
  }

  private classifyPerformanceTier(
    deviceType: DeviceType,
    gpuTier: number,
    memoryMB: number,
    pixelRatio: number
  ): PerformanceTier {
    // Score-based classification
    let score = 0
    
    // GPU contribution (0-30 points)
    score += gpuTier * 10
    
    // Memory contribution (0-20 points)
    if (memoryMB >= 8192) score += 20
    else if (memoryMB >= 4096) score += 15
    else if (memoryMB >= 2048) score += 10
    else score += 5
    
    // Device type contribution (0-20 points)
    if (deviceType === 'desktop') score += 20
    else if (deviceType === 'tablet') score += 10
    else score += 5
    
    // Pixel ratio penalty for mobile (high DPR = more work)
    if (deviceType === 'mobile' && pixelRatio > 2) {
      score -= 5
    }

    // Classify
    if (score >= 50) return 'ultra'
    if (score >= 35) return 'high'
    if (score >= 20) return 'medium'
    return 'low'
  }

  private detectInputMode(touchSupported: boolean, isMobile: boolean): InputMode {
    // Check for gamepad
    const gamepads = navigator.getGamepads?.() || []
    const hasGamepad = Array.from(gamepads).some(gp => gp !== null)
    
    if (hasGamepad) return 'gamepad'
    if (isMobile && touchSupported) return 'touch'
    if (touchSupported && !isMobile) return 'hybrid'
    return 'keyboard'
  }

  private getSafeAreaInsets(): SafeAreaInsets {
    const style = getComputedStyle(document.documentElement)
    
    return {
      top: parseInt(style.getPropertyValue('--sat') || '0', 10) || 
           parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0', 10),
      right: parseInt(style.getPropertyValue('--sar') || '0', 10) ||
             parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0', 10),
      bottom: parseInt(style.getPropertyValue('--sab') || '0', 10) ||
              parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0', 10),
      left: parseInt(style.getPropertyValue('--sal') || '0', 10) ||
            parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0', 10),
    }
  }

  private detectConnectionType(): DeviceCapabilities['connectionType'] {
    const nav = navigator as Navigator & { 
      connection?: { effectiveType?: string; type?: string }
    }
    
    if (nav.connection) {
      const effectiveType = nav.connection.effectiveType
      if (effectiveType === 'slow-2g') return 'slow-2g'
      if (effectiveType === '2g') return '2g'
      if (effectiveType === '3g') return '3g'
      if (effectiveType === '4g') return '4g'
      
      const type = nav.connection.type
      if (type === 'wifi' || type === 'ethernet') return 'wifi'
    }
    
    return 'unknown'
  }

  private detectLowPowerMode(): boolean {
    // iOS Safari exposes this via CSS
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return true
    }
    
    // Check for battery API (not used currently but available for future)
    // const nav = navigator as Navigator & {
    //   getBattery?: () => Promise<{ charging: boolean; level: number }>
    // }
    
    // Heuristic: if we can't detect, assume not low power
    return false
  }
}

// Export singleton accessor
export function getDeviceCapabilities(): DeviceCapabilities {
  return DeviceDetector.getInstance().getCapabilities()
}

export function refreshDeviceCapabilities(): DeviceCapabilities {
  return DeviceDetector.getInstance().refresh()
}

export function onDeviceCapabilitiesChange(
  callback: (caps: DeviceCapabilities) => void
): () => void {
  return DeviceDetector.getInstance().onChange(callback)
}

// Utility functions
export function isMobileDevice(): boolean {
  return getDeviceCapabilities().isMobile
}

export function isTouchDevice(): boolean {
  return getDeviceCapabilities().touchSupported
}

export function getPerformanceTier(): PerformanceTier {
  return getDeviceCapabilities().performanceTier
}

export function shouldReduceMotion(): boolean {
  return getDeviceCapabilities().prefersReducedMotion
}
