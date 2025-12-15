/**
 * AmbientEffectRenderer - Seasonal particle effects with performance awareness.
 * Requirements: 4.1, 4.2, 4.3, 4.5
 * 
 * Renders seasonal particle effects (snow, leaves, petals, confetti, sparkles)
 * with automatic performance scaling and heavy page detection.
 */

// ============================================
// Types
// ============================================

export type AmbientTheme = 'winter' | 'autumn' | 'spring' | 'summer' | 'celebration' | 'none';

export type ParticleType = 'snow' | 'leaves' | 'petals' | 'confetti' | 'sparkles';

export type RenderMode = 'animated' | 'static' | 'disabled';

export interface ParticleConfig {
  type: ParticleType;
  count: number;
  speed: number;
  size: [number, number]; // min, max
  opacity: [number, number]; // min, max
  colors: string[];
  drift?: number; // horizontal drift factor
  rotation?: boolean;
}

export interface AmbientEffectRendererOptions {
  enabled?: boolean;
  reducedMotion?: boolean;
  performanceScore?: number; // 0-100
}

// ============================================
// Constants
// ============================================

// Base particle counts per theme
const BASE_PARTICLE_COUNTS: Record<AmbientTheme, number> = {
  winter: 50,
  autumn: 30,
  spring: 40,
  summer: 25,
  celebration: 60,
  none: 0,
};

// Theme to particle type mapping
const THEME_PARTICLE_TYPES: Record<AmbientTheme, ParticleType | null> = {
  winter: 'snow',
  autumn: 'leaves',
  spring: 'petals',
  summer: 'sparkles',
  celebration: 'confetti',
  none: null,
};

// Particle configurations per type
export const PARTICLE_CONFIGS: Record<ParticleType, Omit<ParticleConfig, 'count'>> = {
  snow: {
    type: 'snow',
    speed: 1.5,
    size: [3, 8],
    opacity: [0.6, 1],
    colors: ['#ffffff', '#e0e7ff', '#c7d2fe'],
    drift: 0.5,
    rotation: false,
  },
  leaves: {
    type: 'leaves',
    speed: 2,
    size: [8, 16],
    opacity: [0.7, 1],
    colors: ['#f97316', '#ea580c', '#dc2626', '#facc15'],
    drift: 1.5,
    rotation: true,
  },
  petals: {
    type: 'petals',
    speed: 1.2,
    size: [6, 12],
    opacity: [0.5, 0.9],
    colors: ['#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6'],
    drift: 0.8,
    rotation: true,
  },
  confetti: {
    type: 'confetti',
    speed: 3,
    size: [4, 10],
    opacity: [0.8, 1],
    colors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'],
    drift: 2,
    rotation: true,
  },
  sparkles: {
    type: 'sparkles',
    speed: 0.5,
    size: [2, 6],
    opacity: [0.3, 0.8],
    colors: ['#fef08a', '#fde047', '#facc15'],
    drift: 0.3,
    rotation: false,
  },
};

// Heavy pages where ambient effects should be disabled/reduced
export const HEAVY_PAGES = [
  '/game',
  '/survival',
  '/shop', // Has 3D previews
  '/inventory', // Has 3D previews
];

// Performance thresholds
const PERFORMANCE_THRESHOLD_REDUCE = 50; // Below this, reduce particles by 50%
const PERFORMANCE_THRESHOLD_DISABLE = 20; // Below this, disable particles


// ============================================
// Utility Functions
// ============================================

export function getParticleConfigForTheme(theme: AmbientTheme): ParticleConfig | null {
  if (theme === 'none') return null;
  
  const particleType = THEME_PARTICLE_TYPES[theme];
  if (!particleType) return null;
  
  const baseConfig = PARTICLE_CONFIGS[particleType];
  const baseCount = BASE_PARTICLE_COUNTS[theme];
  
  return {
    ...baseConfig,
    count: baseCount,
  };
}

export function calculateEffectiveParticleCount(
  baseCount: number,
  performanceScore: number,
  isHeavyPage: boolean,
  enabled: boolean
): number {
  if (!enabled) return 0;
  if (performanceScore < PERFORMANCE_THRESHOLD_DISABLE) return 0;
  
  let count = baseCount;
  
  // Reduce for heavy pages
  if (isHeavyPage) {
    count = Math.floor(count * 0.25); // 75% reduction
  }
  
  // Reduce for low performance
  if (performanceScore < PERFORMANCE_THRESHOLD_REDUCE) {
    count = Math.floor(count * 0.5);
  }
  
  return count;
}

export function isHeavyPage(pathname: string): boolean {
  return HEAVY_PAGES.some(page => pathname.startsWith(page));
}

export function getRenderMode(
  enabled: boolean,
  reducedMotion: boolean,
  performanceScore: number
): RenderMode {
  if (!enabled) return 'disabled';
  if (reducedMotion) return 'static';
  if (performanceScore < PERFORMANCE_THRESHOLD_DISABLE) return 'disabled';
  return 'animated';
}

// ============================================
// AmbientEffectRenderer Class
// ============================================

export class AmbientEffectRenderer {
  private _theme: AmbientTheme = 'none';
  private _enabled: boolean;
  private _reducedMotion: boolean;
  private _performanceScore: number;
  private _currentPath: string = '/';
  
  private themeChangeCallbacks: Set<(theme: AmbientTheme) => void> = new Set();
  private configChangeCallbacks: Set<(config: ParticleConfig | null) => void> = new Set();

  constructor(options: AmbientEffectRendererOptions = {}) {
    this._enabled = options.enabled ?? true;
    this._reducedMotion = options.reducedMotion ?? false;
    this._performanceScore = options.performanceScore ?? 100;
  }

  // ============================================
  // Getters
  // ============================================

  get theme(): AmbientTheme {
    return this._theme;
  }

  get isActive(): boolean {
    if (!this._enabled) return false;
    if (this._theme === 'none') return false;
    if (isHeavyPage(this._currentPath)) return false;
    if (this._performanceScore < PERFORMANCE_THRESHOLD_DISABLE) return false;
    return true;
  }

  get renderMode(): RenderMode {
    return getRenderMode(this._enabled, this._reducedMotion, this._performanceScore);
  }

  get effectiveParticleCount(): number {
    const config = this.getParticleConfig();
    if (!config) return 0;
    
    return calculateEffectiveParticleCount(
      config.count,
      this._performanceScore,
      isHeavyPage(this._currentPath),
      this._enabled
    );
  }

  get isEnabled(): boolean {
    return this._enabled;
  }

  get reducedMotion(): boolean {
    return this._reducedMotion;
  }

  get performanceScore(): number {
    return this._performanceScore;
  }

  get currentPath(): string {
    return this._currentPath;
  }

  // ============================================
  // Setters
  // ============================================

  setTheme(theme: AmbientTheme): void {
    if (this._theme === theme) return;
    
    this._theme = theme;
    this.notifyThemeChange();
    this.notifyConfigChange();
  }

  setEnabled(enabled: boolean): void {
    if (this._enabled === enabled) return;
    
    this._enabled = enabled;
    this.notifyConfigChange();
  }

  setReducedMotion(reducedMotion: boolean): void {
    if (this._reducedMotion === reducedMotion) return;
    
    this._reducedMotion = reducedMotion;
    this.notifyConfigChange();
  }

  setPerformanceScore(score: number): void {
    const clampedScore = Math.max(0, Math.min(100, score));
    if (this._performanceScore === clampedScore) return;
    
    this._performanceScore = clampedScore;
    this.notifyConfigChange();
  }

  setCurrentPath(path: string): void {
    if (this._currentPath === path) return;
    
    this._currentPath = path;
    this.notifyConfigChange();
  }

  // ============================================
  // Configuration
  // ============================================

  getParticleConfig(): ParticleConfig | null {
    if (!this._enabled) return null;
    if (this._theme === 'none') return null;
    
    const baseConfig = getParticleConfigForTheme(this._theme);
    if (!baseConfig) return null;
    
    // Adjust count based on performance and page
    const effectiveCount = calculateEffectiveParticleCount(
      baseConfig.count,
      this._performanceScore,
      isHeavyPage(this._currentPath),
      this._enabled
    );
    
    return {
      ...baseConfig,
      count: effectiveCount,
    };
  }


  // ============================================
  // Callbacks
  // ============================================

  onThemeChange(callback: (theme: AmbientTheme) => void): () => void {
    this.themeChangeCallbacks.add(callback);
    return () => this.themeChangeCallbacks.delete(callback);
  }

  onConfigChange(callback: (config: ParticleConfig | null) => void): () => void {
    this.configChangeCallbacks.add(callback);
    return () => this.configChangeCallbacks.delete(callback);
  }

  private notifyThemeChange(): void {
    for (const callback of this.themeChangeCallbacks) {
      callback(this._theme);
    }
  }

  private notifyConfigChange(): void {
    const config = this.getParticleConfig();
    for (const callback of this.configChangeCallbacks) {
      callback(config);
    }
  }

  // ============================================
  // Seasonal Theme Detection
  // ============================================

  /**
   * Get the current seasonal theme based on date.
   */
  static getCurrentSeasonalTheme(): AmbientTheme {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    
    // Northern hemisphere seasons
    if (month >= 11 || month <= 1) return 'winter'; // Dec, Jan, Feb
    if (month >= 2 && month <= 4) return 'spring';  // Mar, Apr, May
    if (month >= 5 && month <= 7) return 'summer';  // Jun, Jul, Aug
    if (month >= 8 && month <= 10) return 'autumn'; // Sep, Oct, Nov
    
    return 'none';
  }

  /**
   * Set theme to current season.
   */
  setSeasonalTheme(): void {
    this.setTheme(AmbientEffectRenderer.getCurrentSeasonalTheme());
  }

  // ============================================
  // Cleanup
  // ============================================

  dispose(): void {
    this._theme = 'none';
    this.themeChangeCallbacks.clear();
    this.configChangeCallbacks.clear();
  }
}

// ============================================
// Singleton Instance
// ============================================

let ambientEffectRendererInstance: AmbientEffectRenderer | null = null;

export function getAmbientEffectRenderer(): AmbientEffectRenderer {
  if (!ambientEffectRendererInstance) {
    ambientEffectRendererInstance = new AmbientEffectRenderer();
  }
  return ambientEffectRendererInstance;
}

export function resetAmbientEffectRenderer(): void {
  if (ambientEffectRendererInstance) {
    ambientEffectRendererInstance.dispose();
    ambientEffectRendererInstance = null;
  }
}
