/**
 * Arena Device Detection & Capability System
 * Ported from survival runner with arena-specific adaptations
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

  getCapabilities(): DeviceCapabilities {
    if (!this.capabilities) {
      this.capabilities = this.detectCapabilities()
    }
    return this.capabilities
  }

  refresh(): DeviceCapabilities {
    this.capabilities = this.detectCapabilities()
    this.notifyListeners()
    return this.capabilities
  }

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
    window.addEventListener('resize', () => {
      if (this.resizeTimeout) clearTimeout(this.resizeTimeout)
      this.resizeTimeout = window.setTimeout(() => this.refresh(), 150) as unknown as number
    })

    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.refresh(), 100)
    })

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.refresh()
    })
  }

  private detectCapabilities(): DeviceCapabilities {
    const ua = navigator.userAgent.toLowerCase()
    
    const isIOS = /iphone|ipad|ipod/.test(ua) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const isAndroid = /android/.test(ua)
    const isMobile = isIOS || isAndroid || /mobile/.test(ua)
    const isSafari = /safari/.test(ua) && !/chrome/.test(ua)
    const isChrome = /chrome/.test(ua) && !/edge/.test(ua)

    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 3)
    const isPortrait = screenHeight > screenWidth

    const deviceType = this.classifyDeviceType(screenWidth, isMobile)
    
    const touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const maxTouchPoints = navigator.maxTouchPoints || 0
    const multiTouchSupported = maxTouchPoints > 1

    const glInfo = this.detectWebGLCapabilities()
    const memoryInfo = this.estimateMemory()
    
    const performanceTier = this.classifyPerformanceTier(
      deviceType, glInfo.gpuTier, memoryInfo.estimatedMemoryMB, pixelRatio
    )

    const inputMode = this.detectInputMode(touchSupported, isMobile)
    const safeAreaInsets = this.getSafeAreaInsets()
    const connectionType = this.detectConnectionType()
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isLowPowerMode = this.detectLowPowerMode()

    return {
      deviceType, performanceTier, inputMode,
      screenWidth, screenHeight, pixelRatio, isPortrait, safeAreaInsets,
      maxTextureSize: glInfo.maxTextureSize,
      maxRenderbufferSize: glInfo.maxRenderbufferSize,
      supportsWebGL2: glInfo.supportsWebGL2,
      supportsFloatTextures: glInfo.supportsFloatTextures,
      gpuTier: glInfo.gpuTier,
      estimatedMemoryMB: memoryInfo.estimatedMemoryMB,
      isLowMemory: memoryInfo.isLowMemory,
      touchSupported, multiTouchSupported, maxTouchPoints,
      isMobile, isIOS, isAndroid, isSafari, isChrome,
      prefersReducedMotion, isLowPowerMode, connectionType,
    }
  }

  private classifyDeviceType(screenWidth: number, isMobile: boolean): DeviceType {
    if (screenWidth < BREAKPOINTS.sm) return 'mobile'
    if (screenWidth < BREAKPOINTS.md || isMobile) return 'tablet'
    return 'desktop'
  }

  private detectWebGLCapabilities() {
    const canvas = document.createElement('canvas')
    let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null
    let supportsWebGL2 = false

    try {
      gl = canvas.getContext('webgl2') as WebGL2RenderingContext
      if (gl) supportsWebGL2 = true
      else gl = canvas.getContext('webgl') as WebGLRenderingContext
    } catch { /* WebGL not supported */ }

    if (!gl) {
      return { maxTextureSize: 2048, maxRenderbufferSize: 2048, supportsWebGL2: false, supportsFloatTextures: false, gpuTier: 0 }
    }

    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048
    const maxRenderbufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) || 2048
    const supportsFloatTextures = supportsWebGL2 || !!gl.getExtension('OES_texture_float')

    let gpuTier = 1
    if (maxTextureSize >= 16384 && supportsWebGL2) gpuTier = 3
    else if (maxTextureSize >= 8192) gpuTier = 2
    else if (maxTextureSize >= 4096) gpuTier = 1
    else gpuTier = 0

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    if (debugInfo) {
      const renderer = (gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '').toLowerCase()
      if (/nvidia|geforce|rtx|gtx|radeon rx|amd|apple m[123]/.test(renderer)) gpuTier = Math.max(gpuTier, 2)
      if (/intel|integrated|mali-4|adreno 3/.test(renderer)) gpuTier = Math.min(gpuTier, 1)
    }

    return { maxTextureSize, maxRenderbufferSize, supportsWebGL2, supportsFloatTextures, gpuTier }
  }

  private estimateMemory(): { estimatedMemoryMB: number; isLowMemory: boolean } {
    const nav = navigator as Navigator & { deviceMemory?: number }
    if (nav.deviceMemory) {
      return { estimatedMemoryMB: nav.deviceMemory * 1024, isLowMemory: nav.deviceMemory <= 2 }
    }
    const ua = navigator.userAgent.toLowerCase()
    const isOldDevice = /iphone [5-7]|ipad (2|3|4|mini)|android 4/.test(ua)
    if (isOldDevice) return { estimatedMemoryMB: 1024, isLowMemory: true }
    const isMobile = /mobile|android|iphone|ipad/.test(ua)
    return { estimatedMemoryMB: isMobile ? 3072 : 8192, isLowMemory: false }
  }

  private classifyPerformanceTier(deviceType: DeviceType, gpuTier: number, memoryMB: number, pixelRatio: number): PerformanceTier {
    let score = gpuTier * 10
    if (memoryMB >= 8192) score += 20
    else if (memoryMB >= 4096) score += 15
    else if (memoryMB >= 2048) score += 10
    else score += 5
    if (deviceType === 'desktop') score += 20
    else if (deviceType === 'tablet') score += 10
    else score += 5
    if (deviceType === 'mobile' && pixelRatio > 2) score -= 5

    if (score >= 50) return 'ultra'
    if (score >= 35) return 'high'
    if (score >= 20) return 'medium'
    return 'low'
  }

  private detectInputMode(touchSupported: boolean, isMobile: boolean): InputMode {
    let hasGamepad = false
    try {
      const gamepads = navigator.getGamepads?.() || []
      hasGamepad = Array.from(gamepads).some(gp => gp !== null)
    } catch { hasGamepad = false }
    
    if (hasGamepad) return 'gamepad'
    if (isMobile && touchSupported) return 'touch'
    if (touchSupported && !isMobile) return 'hybrid'
    return 'keyboard'
  }

  private getSafeAreaInsets(): SafeAreaInsets {
    const style = getComputedStyle(document.documentElement)
    return {
      top: parseInt(style.getPropertyValue('--sat') || '0', 10) || parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0', 10),
      right: parseInt(style.getPropertyValue('--sar') || '0', 10) || parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0', 10),
      bottom: parseInt(style.getPropertyValue('--sab') || '0', 10) || parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0', 10),
      left: parseInt(style.getPropertyValue('--sal') || '0', 10) || parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0', 10),
    }
  }

  private detectConnectionType(): DeviceCapabilities['connectionType'] {
    const nav = navigator as Navigator & { connection?: { effectiveType?: string; type?: string } }
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
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }
}

// Export singleton accessors
export function getDeviceCapabilities(): DeviceCapabilities {
  return DeviceDetector.getInstance().getCapabilities()
}

export function refreshDeviceCapabilities(): DeviceCapabilities {
  return DeviceDetector.getInstance().refresh()
}

export function onDeviceCapabilitiesChange(callback: (caps: DeviceCapabilities) => void): () => void {
  return DeviceDetector.getInstance().onChange(callback)
}

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
