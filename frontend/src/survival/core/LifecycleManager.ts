/**
 * LifecycleManager - Handles browser lifecycle events for the game
 * Manages visibility, focus, context loss, and cleanup
 */

export type LifecycleState = 'active' | 'hidden' | 'suspended' | 'terminated'

export interface LifecycleCallbacks {
  onVisibilityChange?: (visible: boolean) => void
  onFocusChange?: (focused: boolean) => void
  onContextLost?: () => void
  onContextRestored?: () => void
  onBeforeUnload?: () => void
  onLowMemory?: () => void
}

export class LifecycleManager {
  private state: LifecycleState = 'active'
  private callbacks: LifecycleCallbacks
  private canvas: HTMLCanvasElement | null = null
  
  // Bound handlers for cleanup
  private boundHandlers: {
    visibilityChange: () => void
    focus: () => void
    blur: () => void
    contextLost: (e: Event) => void
    contextRestored: () => void
    beforeUnload: () => void
  }

  constructor(callbacks: LifecycleCallbacks = {}) {
    this.callbacks = callbacks
    
    // Bind handlers
    this.boundHandlers = {
      visibilityChange: this.handleVisibilityChange.bind(this),
      focus: this.handleFocus.bind(this),
      blur: this.handleBlur.bind(this),
      contextLost: this.handleContextLost.bind(this),
      contextRestored: this.handleContextRestored.bind(this),
      beforeUnload: this.handleBeforeUnload.bind(this),
    }
  }

  /**
   * Initialize lifecycle management
   */
  initialize(canvas?: HTMLCanvasElement): void {
    this.canvas = canvas || null
    
    // Document visibility
    document.addEventListener('visibilitychange', this.boundHandlers.visibilityChange)
    
    // Window focus
    window.addEventListener('focus', this.boundHandlers.focus)
    window.addEventListener('blur', this.boundHandlers.blur)
    
    // Before unload (cleanup)
    window.addEventListener('beforeunload', this.boundHandlers.beforeUnload)
    
    // WebGL context events (if canvas provided)
    if (this.canvas) {
      this.canvas.addEventListener('webglcontextlost', this.boundHandlers.contextLost)
      this.canvas.addEventListener('webglcontextrestored', this.boundHandlers.contextRestored)
    }

    // Memory pressure (Chrome only)
    if ('onmemorypressure' in window) {
      (window as unknown as { onmemorypressure: () => void }).onmemorypressure = () => {
        console.warn('[LifecycleManager] Memory pressure detected')
        this.callbacks.onLowMemory?.()
      }
    }

    console.log('[LifecycleManager] Initialized')
  }

  /**
   * Handle visibility change (tab switch)
   */
  private handleVisibilityChange(): void {
    const visible = document.visibilityState === 'visible'
    this.state = visible ? 'active' : 'hidden'
    
    this.callbacks.onVisibilityChange?.(visible)
  }

  /**
   * Handle window focus
   */
  private handleFocus(): void {
    if (this.state === 'hidden') {
      this.state = 'active'
    }
    this.callbacks.onFocusChange?.(true)
  }

  /**
   * Handle window blur
   */
  private handleBlur(): void {
    this.callbacks.onFocusChange?.(false)
  }

  /**
   * Handle WebGL context loss
   */
  private handleContextLost(event: Event): void {
    event.preventDefault() // Allows context restoration
    this.state = 'suspended'
    console.error('[LifecycleManager] WebGL context lost')
    this.callbacks.onContextLost?.()
  }

  /**
   * Handle WebGL context restoration
   */
  private handleContextRestored(): void {
    this.state = 'active'
    console.log('[LifecycleManager] WebGL context restored')
    this.callbacks.onContextRestored?.()
  }

  /**
   * Handle before unload (cleanup)
   */
  private handleBeforeUnload(): void {
    this.state = 'terminated'
    this.callbacks.onBeforeUnload?.()
  }

  /**
   * Get current lifecycle state
   */
  getState(): LifecycleState {
    return this.state
  }

  /**
   * Check if game should be running
   */
  shouldRun(): boolean {
    return this.state === 'active'
  }

  /**
   * Check if game is visible
   */
  isVisible(): boolean {
    return document.visibilityState === 'visible'
  }

  /**
   * Check if window is focused
   */
  isFocused(): boolean {
    return document.hasFocus()
  }

  /**
   * Update callbacks
   */
  setCallbacks(callbacks: Partial<LifecycleCallbacks>): void {
    Object.assign(this.callbacks, callbacks)
  }

  /**
   * Clean up all event listeners
   */
  dispose(): void {
    document.removeEventListener('visibilitychange', this.boundHandlers.visibilityChange)
    window.removeEventListener('focus', this.boundHandlers.focus)
    window.removeEventListener('blur', this.boundHandlers.blur)
    window.removeEventListener('beforeunload', this.boundHandlers.beforeUnload)
    
    if (this.canvas) {
      this.canvas.removeEventListener('webglcontextlost', this.boundHandlers.contextLost)
      this.canvas.removeEventListener('webglcontextrestored', this.boundHandlers.contextRestored)
    }
    
    this.state = 'terminated'
    console.log('[LifecycleManager] Disposed')
  }
}
