/**
 * EasterEggRegistry - Hidden interaction tracking and trigger system.
 * Requirements: 6.1, 6.2, 6.3, 6.5
 * 
 * Manages easter egg catalog, sequence detection with timeout reset,
 * and discovery tracking in localStorage/profile.
 */

// ============================================
// Types
// ============================================

export type EasterEggTriggerType = 'konami' | 'click-sequence' | 'key-sequence' | 'secret-url';

export interface KonamiTrigger {
  type: 'konami';
}

export interface ClickSequenceTrigger {
  type: 'click-sequence';
  target: string;
  count: number;
}

export interface KeySequenceTrigger {
  type: 'key-sequence';
  keys: string[];
}

export interface SecretUrlTrigger {
  type: 'secret-url';
  path: string;
}

export type EasterEggTrigger = KonamiTrigger | ClickSequenceTrigger | KeySequenceTrigger | SecretUrlTrigger;

export type EasterEggRewardType = 'cosmetic' | 'title' | 'badge' | 'animation' | 'xp';

export interface EasterEggReward {
  type: EasterEggRewardType;
  id: string;
  amount?: number; // For XP rewards
}

export interface EasterEgg {
  id: string;
  name: string;
  hint: string;
  trigger: EasterEggTrigger;
  reward?: EasterEggReward;
  timeLimited?: {
    startDate: string; // ISO date
    endDate: string;   // ISO date
  };
}

export interface EasterEggDiscovery {
  eggId: string;
  discoveredAt: string; // ISO timestamp
  triggerMethod: string;
  isLegacy?: boolean; // For expired time-limited eggs
}

export type AnimationType = 'discovery' | 'repeat';

export interface EasterEggActivation {
  egg: EasterEgg;
  animationType: AnimationType;
  isFirstDiscovery: boolean;
}

export interface EasterEggRegistryOptions {
  enabled?: boolean;
  sequenceTimeoutMs?: number;
  onActivation?: (activation: EasterEggActivation) => void;
  onDiscovery?: (discovery: EasterEggDiscovery) => void;
}

// ============================================
// Constants
// ============================================

// Sequence timeout (ms) - resets after inactivity
export const DEFAULT_SEQUENCE_TIMEOUT_MS = 3000;

// Hint animation duration (ms)
export const HINT_ANIMATION_MS = 500;

// Full reveal duration (ms)
export const REVEAL_ANIMATION_MS = 1500;

// Activation delay (ms) - time from sequence completion to activation
export const ACTIVATION_DELAY_MS = 100;

// Progress threshold for hint (80%)
export const HINT_THRESHOLD = 0.8;

// Konami code sequence
export const KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];

// Storage key for discoveries
export const STORAGE_KEY = 'easter-egg-discoveries';

// ============================================
// Default Easter Eggs Catalog
// ============================================

export const DEFAULT_EASTER_EGGS: EasterEgg[] = [
  {
    id: 'classic-gamer',
    name: 'Classic Gamer',
    hint: 'Remember the old ways...',
    trigger: { type: 'konami' },
    reward: { type: 'badge', id: 'retro-badge' },
  },
  {
    id: 'persistent',
    name: 'Persistent',
    hint: 'Sometimes you just have to keep tapping...',
    trigger: { type: 'click-sequence', target: 'logo', count: 7 },
    reward: { type: 'animation', id: 'sparkle-effect' },
  },
  {
    id: 'secret-code',
    name: 'Code Breaker',
    hint: 'IDDQD? No, something else...',
    trigger: { type: 'key-sequence', keys: ['KeyI', 'KeyD', 'KeyK', 'KeyF', 'KeyA'] },
    reward: { type: 'title', id: 'hacker' },
  },
];

// ============================================
// Utility Functions
// ============================================

export function isEasterEggAvailable(egg: EasterEgg, currentDate: Date = new Date()): boolean {
  if (!egg.timeLimited) {
    return true;
  }
  
  const start = new Date(egg.timeLimited.startDate);
  const end = new Date(egg.timeLimited.endDate);
  
  return currentDate >= start && currentDate <= end;
}

export function getSequenceForTrigger(trigger: EasterEggTrigger): string[] | null {
  switch (trigger.type) {
    case 'konami':
      return KONAMI_CODE;
    case 'key-sequence':
      return trigger.keys;
    case 'click-sequence':
      // Click sequences are handled differently (count-based)
      return null;
    case 'secret-url':
      // URL triggers are handled differently
      return null;
    default:
      return null;
  }
}

export function getSequenceLength(trigger: EasterEggTrigger): number {
  switch (trigger.type) {
    case 'konami':
      return KONAMI_CODE.length;
    case 'key-sequence':
      return trigger.keys.length;
    case 'click-sequence':
      return trigger.count;
    case 'secret-url':
      return 1;
    default:
      return 0;
  }
}

// ============================================
// EasterEggRegistry Class
// ============================================

export class EasterEggRegistry {
  private _catalog: Map<string, EasterEgg> = new Map();
  private _discoveries: Map<string, EasterEggDiscovery> = new Map();
  private _sequenceProgress: Map<string, number> = new Map();
  private _clickCounts: Map<string, number> = new Map();
  private _enabled: boolean;
  private _sequenceTimeoutMs: number;
  private _timeoutTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  
  private activationCallbacks: Set<(activation: EasterEggActivation) => void> = new Set();
  private discoveryCallbacks: Set<(discovery: EasterEggDiscovery) => void> = new Set();
  private progressCallbacks: Set<(eggId: string, progress: number) => void> = new Set();

  constructor(options: EasterEggRegistryOptions = {}) {
    this._enabled = options.enabled ?? true;
    this._sequenceTimeoutMs = options.sequenceTimeoutMs ?? DEFAULT_SEQUENCE_TIMEOUT_MS;
    
    if (options.onActivation) {
      this.activationCallbacks.add(options.onActivation);
    }
    if (options.onDiscovery) {
      this.discoveryCallbacks.add(options.onDiscovery);
    }
    
    // Load default catalog
    for (const egg of DEFAULT_EASTER_EGGS) {
      this._catalog.set(egg.id, egg);
    }
    
    // Load discoveries from storage
    this.loadDiscoveries();
  }

  // ============================================
  // Getters
  // ============================================

  get discovered(): string[] {
    return Array.from(this._discoveries.keys());
  }

  get sequenceProgress(): Map<string, number> {
    return new Map(this._sequenceProgress);
  }

  get isEnabled(): boolean {
    return this._enabled;
  }

  get catalog(): EasterEgg[] {
    return Array.from(this._catalog.values());
  }

  // ============================================
  // Setters
  // ============================================

  setEnabled(enabled: boolean): void {
    this._enabled = enabled;
  }

  // ============================================
  // Discovery Management
  // ============================================

  isDiscovered(id: string): boolean {
    return this._discoveries.has(id);
  }

  getDiscovery(id: string): EasterEggDiscovery | undefined {
    return this._discoveries.get(id);
  }

  getDiscoveries(): EasterEggDiscovery[] {
    return Array.from(this._discoveries.values());
  }

  private recordDiscovery(egg: EasterEgg, triggerMethod: string): EasterEggDiscovery {
    const discovery: EasterEggDiscovery = {
      eggId: egg.id,
      discoveredAt: new Date().toISOString(),
      triggerMethod,
      isLegacy: egg.timeLimited ? !isEasterEggAvailable(egg) : false,
    };
    
    this._discoveries.set(egg.id, discovery);
    this.saveDiscoveries();
    
    // Notify callbacks
    for (const callback of this.discoveryCallbacks) {
      callback(discovery);
    }
    
    return discovery;
  }

  private loadDiscoveries(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const discoveries: EasterEggDiscovery[] = JSON.parse(stored);
        for (const discovery of discoveries) {
          this._discoveries.set(discovery.eggId, discovery);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }

  private saveDiscoveries(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const discoveries = Array.from(this._discoveries.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(discoveries));
    } catch {
      // Ignore storage errors - fall back to session only
    }
  }

  /**
   * Sync discoveries from guest session to authenticated account.
   */
  syncDiscoveries(serverDiscoveries: EasterEggDiscovery[]): void {
    for (const discovery of serverDiscoveries) {
      if (!this._discoveries.has(discovery.eggId)) {
        this._discoveries.set(discovery.eggId, discovery);
      }
    }
    this.saveDiscoveries();
  }

  // ============================================
  // Catalog Management
  // ============================================

  registerEasterEgg(egg: EasterEgg): void {
    this._catalog.set(egg.id, egg);
  }

  getEasterEgg(id: string): EasterEgg | undefined {
    return this._catalog.get(id);
  }

  // ============================================
  // Input Registration
  // ============================================

  /**
   * Register a keyboard input for sequence detection.
   */
  registerKeyInput(key: string): EasterEggActivation | null {
    if (!this._enabled) return null;
    
    let activation: EasterEggActivation | null = null;
    
    for (const egg of this._catalog.values()) {
      if (!isEasterEggAvailable(egg)) continue;
      
      const sequence = getSequenceForTrigger(egg.trigger);
      if (!sequence) continue;
      
      const currentProgress = this._sequenceProgress.get(egg.id) ?? 0;
      const expectedKey = sequence[currentProgress];
      
      if (key === expectedKey) {
        const newProgress = currentProgress + 1;
        this._sequenceProgress.set(egg.id, newProgress);
        
        // Reset timeout
        this.resetSequenceTimeout(egg.id);
        
        // Notify progress
        const progressPercent = newProgress / sequence.length;
        this.notifyProgress(egg.id, progressPercent);
        
        // Check if sequence complete
        if (newProgress >= sequence.length) {
          activation = this.activateEasterEgg(egg, 'key-sequence');
          this._sequenceProgress.set(egg.id, 0);
        }
      } else if (currentProgress > 0) {
        // Wrong key - check if it's the start of a new sequence
        if (key === sequence[0]) {
          this._sequenceProgress.set(egg.id, 1);
          this.resetSequenceTimeout(egg.id);
          this.notifyProgress(egg.id, 1 / sequence.length);
        } else {
          // Reset progress
          this._sequenceProgress.set(egg.id, 0);
          this.notifyProgress(egg.id, 0);
        }
      }
    }
    
    return activation;
  }

  /**
   * Register a click on a target element.
   */
  registerClick(target: string): EasterEggActivation | null {
    if (!this._enabled) return null;
    
    let activation: EasterEggActivation | null = null;
    
    for (const egg of this._catalog.values()) {
      if (!isEasterEggAvailable(egg)) continue;
      if (egg.trigger.type !== 'click-sequence') continue;
      if (egg.trigger.target !== target) continue;
      
      const currentCount = this._clickCounts.get(egg.id) ?? 0;
      const newCount = currentCount + 1;
      this._clickCounts.set(egg.id, newCount);
      
      // Reset timeout
      this.resetSequenceTimeout(egg.id);
      
      // Notify progress
      const progressPercent = newCount / egg.trigger.count;
      this.notifyProgress(egg.id, progressPercent);
      
      // Check if count reached
      if (newCount >= egg.trigger.count) {
        activation = this.activateEasterEgg(egg, 'click-sequence');
        this._clickCounts.set(egg.id, 0);
      }
    }
    
    return activation;
  }

  /**
   * Check if current URL matches a secret URL trigger.
   */
  checkSecretUrl(path: string): EasterEggActivation | null {
    if (!this._enabled) return null;
    
    for (const egg of this._catalog.values()) {
      if (!isEasterEggAvailable(egg)) continue;
      if (egg.trigger.type !== 'secret-url') continue;
      if (egg.trigger.path !== path) continue;
      
      return this.activateEasterEgg(egg, 'secret-url');
    }
    
    return null;
  }

  // ============================================
  // Sequence Timeout
  // ============================================

  private resetSequenceTimeout(eggId: string): void {
    // Clear existing timeout
    const existingTimer = this._timeoutTimers.get(eggId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Set new timeout
    const timer = setTimeout(() => {
      this._sequenceProgress.set(eggId, 0);
      this._clickCounts.set(eggId, 0);
      this.notifyProgress(eggId, 0);
      this._timeoutTimers.delete(eggId);
    }, this._sequenceTimeoutMs);
    
    this._timeoutTimers.set(eggId, timer);
  }

  /**
   * Get the current progress for an easter egg (0-1).
   */
  getProgress(eggId: string): number {
    const egg = this._catalog.get(eggId);
    if (!egg) return 0;
    
    if (egg.trigger.type === 'click-sequence') {
      const count = this._clickCounts.get(eggId) ?? 0;
      return count / egg.trigger.count;
    }
    
    const sequence = getSequenceForTrigger(egg.trigger);
    if (!sequence) return 0;
    
    const progress = this._sequenceProgress.get(eggId) ?? 0;
    return progress / sequence.length;
  }

  /**
   * Check if progress is at hint threshold (80%).
   */
  isNearCompletion(eggId: string): boolean {
    return this.getProgress(eggId) >= HINT_THRESHOLD;
  }

  // ============================================
  // Activation
  // ============================================

  private activateEasterEgg(egg: EasterEgg, triggerMethod: string): EasterEggActivation {
    const isFirstDiscovery = !this.isDiscovered(egg.id);
    
    if (isFirstDiscovery) {
      this.recordDiscovery(egg, triggerMethod);
    }
    
    const activation: EasterEggActivation = {
      egg,
      animationType: isFirstDiscovery ? 'discovery' : 'repeat',
      isFirstDiscovery,
    };
    
    // Notify callbacks
    for (const callback of this.activationCallbacks) {
      callback(activation);
    }
    
    return activation;
  }

  // ============================================
  // Callbacks
  // ============================================

  onActivation(callback: (activation: EasterEggActivation) => void): () => void {
    this.activationCallbacks.add(callback);
    return () => this.activationCallbacks.delete(callback);
  }

  onDiscovery(callback: (discovery: EasterEggDiscovery) => void): () => void {
    this.discoveryCallbacks.add(callback);
    return () => this.discoveryCallbacks.delete(callback);
  }

  onProgress(callback: (eggId: string, progress: number) => void): () => void {
    this.progressCallbacks.add(callback);
    return () => this.progressCallbacks.delete(callback);
  }

  private notifyProgress(eggId: string, progress: number): void {
    for (const callback of this.progressCallbacks) {
      callback(eggId, progress);
    }
  }

  // ============================================
  // Cleanup
  // ============================================

  dispose(): void {
    // Clear all timeouts
    for (const timer of this._timeoutTimers.values()) {
      clearTimeout(timer);
    }
    this._timeoutTimers.clear();
    
    this._sequenceProgress.clear();
    this._clickCounts.clear();
    this.activationCallbacks.clear();
    this.discoveryCallbacks.clear();
    this.progressCallbacks.clear();
  }

  /**
   * Reset all progress (for testing).
   */
  resetProgress(): void {
    for (const timer of this._timeoutTimers.values()) {
      clearTimeout(timer);
    }
    this._timeoutTimers.clear();
    this._sequenceProgress.clear();
    this._clickCounts.clear();
  }
}

// ============================================
// Singleton Instance
// ============================================

let easterEggRegistryInstance: EasterEggRegistry | null = null;

export function getEasterEggRegistry(): EasterEggRegistry {
  if (!easterEggRegistryInstance) {
    easterEggRegistryInstance = new EasterEggRegistry();
  }
  return easterEggRegistryInstance;
}

export function resetEasterEggRegistry(): void {
  if (easterEggRegistryInstance) {
    easterEggRegistryInstance.dispose();
    easterEggRegistryInstance = null;
  }
}
