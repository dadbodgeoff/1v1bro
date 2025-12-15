/**
 * TransitionManager - Page transition orchestration system
 * 
 * Handles animated transitions between routes with route-specific configurations.
 * Supports forward/back navigation detection, loading indicators, and reduced motion.
 * 
 * Requirements: 1.1, 1.3, 1.4, 1.6
 */

// ============================================
// Types
// ============================================

/**
 * Available transition animation types
 */
export type TransitionType = 
  | 'fade'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'zoom'
  | 'morph'
  | 'none'

/**
 * Configuration for a single transition
 */
export interface TransitionConfig {
  type: TransitionType
  duration: number  // milliseconds
  easing: string    // CSS easing function
}

/**
 * Map of route pairs to transition configurations
 */
export interface RouteTransitionMap {
  [fromRoute: string]: {
    [toRoute: string]: TransitionConfig
  }
}

/**
 * Navigation direction
 */
export type NavigationDirection = 'forward' | 'back'

/**
 * Transition state
 */
export type TransitionState = 'idle' | 'transitioning' | 'loading'

// ============================================
// Default Transition Configurations
// ============================================

/**
 * Default transition for unspecified route pairs
 */
export const DEFAULT_TRANSITION: TransitionConfig = {
  type: 'fade',
  duration: 200,
  easing: 'ease',
}

/**
 * Reduced motion transition (instant cross-fade)
 * Requirement 1.5: 100ms duration for reduced motion
 */
export const REDUCED_MOTION_TRANSITION: TransitionConfig = {
  type: 'fade',
  duration: 100,
  easing: 'ease',
}

/**
 * Route-specific transition configurations
 * Requirements: 1.7, 1.8, 1.9, 1.10
 */
export const DEFAULT_ROUTE_TRANSITIONS: RouteTransitionMap = {
  // Dashboard to sub-pages: slide-right (Req 1.7)
  '/dashboard': {
    '/profile': { type: 'slide-left', duration: 300, easing: 'ease-out' },
    '/settings': { type: 'slide-left', duration: 300, easing: 'ease-out' },
    '/shop': { type: 'slide-left', duration: 300, easing: 'ease-out' },
    '/battlepass': { type: 'slide-left', duration: 300, easing: 'ease-out' },
    '/coins': { type: 'slide-left', duration: 300, easing: 'ease-out' },
    '/achievements': { type: 'slide-left', duration: 300, easing: 'ease-out' },
    '/leaderboards': { type: 'slide-left', duration: 300, easing: 'ease-out' },
    '/friends': { type: 'slide-left', duration: 300, easing: 'ease-out' },
    '/inventory': { type: 'slide-left', duration: 300, easing: 'ease-out' },
    '*': { type: 'fade', duration: 250, easing: 'ease' },
  },
  // Sub-pages back to Dashboard: slide-left (Req 1.8)
  '/profile': {
    '/dashboard': { type: 'slide-right', duration: 300, easing: 'ease-out' },
    '*': { type: 'fade', duration: 200, easing: 'ease' },
  },
  '/settings': {
    '/dashboard': { type: 'slide-right', duration: 300, easing: 'ease-out' },
    '*': { type: 'fade', duration: 200, easing: 'ease' },
  },
  '/shop': {
    '/dashboard': { type: 'slide-right', duration: 300, easing: 'ease-out' },
    '*': { type: 'fade', duration: 200, easing: 'ease' },
  },
  '/battlepass': {
    '/dashboard': { type: 'slide-right', duration: 300, easing: 'ease-out' },
    '*': { type: 'fade', duration: 200, easing: 'ease' },
  },
  '/coins': {
    '/dashboard': { type: 'slide-right', duration: 300, easing: 'ease-out' },
    '*': { type: 'fade', duration: 200, easing: 'ease' },
  },
  '/achievements': {
    '/dashboard': { type: 'slide-right', duration: 300, easing: 'ease-out' },
    '*': { type: 'fade', duration: 200, easing: 'ease' },
  },
  '/leaderboards': {
    '/dashboard': { type: 'slide-right', duration: 300, easing: 'ease-out' },
    '/leaderboards/*': { type: 'zoom', duration: 400, easing: 'ease-in-out' },
    '*': { type: 'fade', duration: 200, easing: 'ease' },
  },
  '/friends': {
    '/dashboard': { type: 'slide-right', duration: 300, easing: 'ease-out' },
    '*': { type: 'fade', duration: 200, easing: 'ease' },
  },
  '/inventory': {
    '/dashboard': { type: 'slide-right', duration: 300, easing: 'ease-out' },
    '*': { type: 'fade', duration: 200, easing: 'ease' },
  },
  // Wildcard fallback
  '*': {
    '*': { type: 'fade', duration: 200, easing: 'ease' },
  },
}

// ============================================
// Reverse Transition Mapping
// ============================================

/**
 * Maps transition types to their reverse counterparts
 * Requirement 1.3: Back navigation reverses transition direction
 */
export const REVERSE_TRANSITION_MAP: Record<TransitionType, TransitionType> = {
  'fade': 'fade',
  'slide-left': 'slide-right',
  'slide-right': 'slide-left',
  'slide-up': 'slide-down',
  'slide-down': 'slide-up',
  'zoom': 'zoom',
  'morph': 'morph',
  'none': 'none',
}

/**
 * Get the reverse transition type
 */
export function getReverseTransitionType(type: TransitionType): TransitionType {
  return REVERSE_TRANSITION_MAP[type]
}

// ============================================
// Route Matching Utilities
// ============================================

/**
 * Normalize a route path for matching
 * Strips trailing slashes and handles dynamic segments
 */
export function normalizeRoute(route: string): string {
  // Remove trailing slash (except for root)
  let normalized = route.endsWith('/') && route.length > 1 
    ? route.slice(0, -1) 
    : route
  
  // Handle dynamic segments - convert /leaderboards/weekly to /leaderboards/*
  const segments = normalized.split('/')
  if (segments.length > 2) {
    // Check if this is a detail page (e.g., /leaderboards/weekly)
    const basePath = '/' + segments[1]
    if (basePath === '/leaderboards' || basePath === '/profile') {
      normalized = basePath + '/*'
    }
  }
  
  return normalized
}

/**
 * Check if a route matches a pattern (supports * wildcard)
 */
export function routeMatches(route: string, pattern: string): boolean {
  if (pattern === '*') return true
  if (pattern === route) return true
  
  // Handle wildcard patterns like /leaderboards/*
  if (pattern.endsWith('/*')) {
    const base = pattern.slice(0, -2)
    return route.startsWith(base)
  }
  
  return false
}

// ============================================
// TransitionManager Class
// ============================================

export interface TransitionManagerOptions {
  routeTransitions?: RouteTransitionMap
  reducedMotion?: boolean
  pageTransitionsEnabled?: boolean
}

export class TransitionManager {
  private _state: TransitionState = 'idle'
  private _direction: NavigationDirection = 'forward'
  private _showLoading: boolean = false
  private _currentRoute: string = ''
  private _previousRoute: string = ''
  private _reducedMotion: boolean = false
  private _pageTransitionsEnabled: boolean = true
  private _routeTransitions: RouteTransitionMap
  private _transitionStartTime: number = 0  // Used for timing calculations
  private _pendingNavigation: string | null = null
  private _loadingTimeout: ReturnType<typeof setTimeout> | null = null

  // Loading indicator threshold (Req 1.2)
  static readonly LOADING_THRESHOLD_MS = 200

  constructor(options: TransitionManagerOptions = {}) {
    this._routeTransitions = options.routeTransitions ?? DEFAULT_ROUTE_TRANSITIONS
    this._reducedMotion = options.reducedMotion ?? false
    this._pageTransitionsEnabled = options.pageTransitionsEnabled ?? true
  }

  // ============================================
  // Public Properties
  // ============================================

  /**
   * Current transition state
   */
  get state(): TransitionState {
    return this._state
  }

  /**
   * Whether a transition is currently in progress
   * Requirement 1.6: Navigation blocked during transition
   */
  get isTransitioning(): boolean {
    return this._state === 'transitioning'
  }

  /**
   * Current navigation direction
   */
  get direction(): NavigationDirection {
    return this._direction
  }

  /**
   * Whether loading indicator should be shown
   * Requirement 1.2: Show after 200ms threshold
   */
  get showLoading(): boolean {
    return this._showLoading
  }

  /**
   * Current route
   */
  get currentRoute(): string {
    return this._currentRoute
  }

  /**
   * Previous route
   */
  get previousRoute(): string {
    return this._previousRoute
  }

  /**
   * Whether reduced motion is enabled
   */
  get reducedMotion(): boolean {
    return this._reducedMotion
  }

  /**
   * Whether page transitions are enabled
   */
  get pageTransitionsEnabled(): boolean {
    return this._pageTransitionsEnabled
  }

  /**
   * Time when current transition started
   */
  get transitionStartTime(): number {
    return this._transitionStartTime
  }

  /**
   * Pending navigation (if blocked during transition)
   */
  get pendingNavigation(): string | null {
    return this._pendingNavigation
  }

  // ============================================
  // Public Methods
  // ============================================

  /**
   * Get transition configuration for a route pair
   * Requirement 1.1: Return valid TransitionConfig for any route pair
   */
  getTransition(from: string, to: string): TransitionConfig {
    // If transitions disabled, return instant
    if (!this._pageTransitionsEnabled) {
      return { type: 'none', duration: 0, easing: 'linear' }
    }

    // If reduced motion, return reduced motion transition
    if (this._reducedMotion) {
      return REDUCED_MOTION_TRANSITION
    }

    const normalizedFrom = normalizeRoute(from)
    const normalizedTo = normalizeRoute(to)

    // Try exact match first
    const fromRoutes = this._routeTransitions[normalizedFrom]
    if (fromRoutes) {
      // Try exact to-route match
      if (fromRoutes[normalizedTo]) {
        return fromRoutes[normalizedTo]
      }
      // Try wildcard match for to-route
      for (const pattern of Object.keys(fromRoutes)) {
        if (routeMatches(normalizedTo, pattern)) {
          return fromRoutes[pattern]
        }
      }
    }

    // Try wildcard from-route
    const wildcardRoutes = this._routeTransitions['*']
    if (wildcardRoutes) {
      if (wildcardRoutes[normalizedTo]) {
        return wildcardRoutes[normalizedTo]
      }
      if (wildcardRoutes['*']) {
        return wildcardRoutes['*']
      }
    }

    // Fallback to default
    return DEFAULT_TRANSITION
  }

  /**
   * Get reversed transition for back navigation
   * Requirement 1.3: Back navigation reverses transition direction
   */
  getReversedTransition(config: TransitionConfig): TransitionConfig {
    return {
      ...config,
      type: getReverseTransitionType(config.type),
    }
  }

  /**
   * Start a transition to a new route
   * Requirement 1.6: Block navigation during transition
   */
  startTransition(
    to: string, 
    direction: NavigationDirection = 'forward'
  ): { allowed: boolean; config: TransitionConfig } {
    // If already transitioning, queue the navigation
    if (this._state === 'transitioning') {
      this._pendingNavigation = to
      return { 
        allowed: false, 
        config: this.getTransition(this._currentRoute, to) 
      }
    }

    const from = this._currentRoute
    this._previousRoute = from
    this._direction = direction
    this._state = 'transitioning'
    this._transitionStartTime = performance.now()

    // Get transition config
    let config = this.getTransition(from, to)
    
    // Reverse if back navigation
    if (direction === 'back') {
      config = this.getReversedTransition(config)
    }

    return { allowed: true, config }
  }

  /**
   * Complete the current transition
   */
  completeTransition(route: string): void {
    this._currentRoute = route
    this._state = 'idle'
    this._showLoading = false
    this.clearLoadingTimeout()

    // Handle pending navigation
    if (this._pendingNavigation) {
      // Clear pending - actual navigation will be handled by the component
      this._pendingNavigation = null
    }
  }

  /**
   * Start loading state (for data fetching)
   * Requirement 1.2: Show loading indicator after 200ms
   */
  startLoading(): void {
    if (this._state !== 'transitioning') {
      this._state = 'loading'
    }

    // Set timeout for loading indicator
    this.clearLoadingTimeout()
    this._loadingTimeout = setTimeout(() => {
      this._showLoading = true
    }, TransitionManager.LOADING_THRESHOLD_MS)
  }

  /**
   * Complete loading state
   */
  completeLoading(): void {
    this.clearLoadingTimeout()
    this._showLoading = false
    if (this._state === 'loading') {
      this._state = 'idle'
    }
  }

  /**
   * Check if loading indicator should be shown based on elapsed time
   * Requirement 1.2: 200ms threshold
   */
  shouldShowLoading(elapsedMs: number): boolean {
    return elapsedMs >= TransitionManager.LOADING_THRESHOLD_MS
  }

  /**
   * Update reduced motion setting
   */
  setReducedMotion(enabled: boolean): void {
    this._reducedMotion = enabled
  }

  /**
   * Update page transitions enabled setting
   */
  setPageTransitionsEnabled(enabled: boolean): void {
    this._pageTransitionsEnabled = enabled
  }

  /**
   * Set current route (for initialization)
   */
  setCurrentRoute(route: string): void {
    this._currentRoute = route
  }

  /**
   * Reset manager state
   */
  reset(): void {
    this._state = 'idle'
    this._direction = 'forward'
    this._showLoading = false
    this._pendingNavigation = null
    this.clearLoadingTimeout()
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.clearLoadingTimeout()
    this._pendingNavigation = null
  }

  // ============================================
  // Private Methods
  // ============================================

  private clearLoadingTimeout(): void {
    if (this._loadingTimeout) {
      clearTimeout(this._loadingTimeout)
      this._loadingTimeout = null
    }
  }
}

// ============================================
// Singleton Instance
// ============================================

let transitionManagerInstance: TransitionManager | null = null

/**
 * Get or create the TransitionManager singleton
 */
export function getTransitionManager(
  options?: TransitionManagerOptions
): TransitionManager {
  if (!transitionManagerInstance) {
    transitionManagerInstance = new TransitionManager(options)
  } else if (options) {
    // Update settings if provided
    if (options.reducedMotion !== undefined) {
      transitionManagerInstance.setReducedMotion(options.reducedMotion)
    }
    if (options.pageTransitionsEnabled !== undefined) {
      transitionManagerInstance.setPageTransitionsEnabled(options.pageTransitionsEnabled)
    }
  }
  return transitionManagerInstance
}

/**
 * Reset the singleton (for testing)
 */
export function resetTransitionManager(): void {
  if (transitionManagerInstance) {
    transitionManagerInstance.dispose()
    transitionManagerInstance = null
  }
}
