/**
 * CelebrationSystem - Manages reward animations, fanfares, and celebration queuing.
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7
 * 
 * Handles purchase cinematics, tier-up fanfares, achievement celebrations,
 * and manages a priority queue for multiple simultaneous celebrations.
 */

// ============================================
// Types
// ============================================

export type CelebrationType = 'purchase' | 'tier-up' | 'achievement' | 'milestone' | 'daily-reward' | 'coin-purchase';

export type CelebrationPriority = 'low' | 'medium' | 'high' | 'critical';

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface RewardItem {
  id: string;
  name: string;
  icon?: string;
  rarity?: ItemRarity;
  type?: string;
}

export interface CelebrationData {
  title: string;
  subtitle?: string;
  icon?: string;
  rarity?: ItemRarity;
  rewards?: RewardItem[];
  amount?: number; // For coin purchases
  tierNumber?: number; // For tier-up
  xpReward?: number;
}

export interface Celebration {
  id: string;
  type: CelebrationType;
  data: CelebrationData;
  priority: CelebrationPriority;
  timestamp: number;
  status: 'pending' | 'active' | 'completed' | 'skipped';
}

export interface CelebrationSystemOptions {
  enabled?: boolean;
  reducedMotion?: boolean;
  masterVolume?: number;
  sfxVolume?: number;
  maxQueueSize?: number;
}

export type CelebrationState = 'idle' | 'entering' | 'displaying' | 'exiting';

// ============================================
// Constants
// ============================================

const PRIORITY_VALUES: Record<CelebrationPriority, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const TYPE_TO_PRIORITY: Record<CelebrationType, CelebrationPriority> = {
  'daily-reward': 'low',
  'milestone': 'medium',
  'purchase': 'medium',
  'coin-purchase': 'medium',
  'tier-up': 'high',
  'achievement': 'high',
};


// Duration constants (ms)
export const CELEBRATION_DURATIONS: Record<CelebrationType, number> = {
  'purchase': 2000,
  'coin-purchase': 2000,
  'tier-up': 2500,
  'achievement': 2000,
  'milestone': 2000,
  'daily-reward': 1500,
};

// Enhanced duration for rare/legendary items
export const ENHANCED_DURATION = 3000;

// Gap between celebrations
export const CELEBRATION_GAP_MS = 500;

// Skip animation duration
export const SKIP_DURATION_MS = 200;

// Reduced motion duration
export const REDUCED_MOTION_DURATION_MS = 1500;

// Max queue size before consolidation
export const MAX_QUEUE_SIZE = 10;

// Batching window for simultaneous triggers
export const BATCH_WINDOW_MS = 100;

// ============================================
// Utility Functions
// ============================================

let celebrationIdCounter = 0;

function generateCelebrationId(): string {
  return `celebration-${Date.now()}-${++celebrationIdCounter}`;
}

export function getPriorityValue(priority: CelebrationPriority): number {
  return PRIORITY_VALUES[priority];
}

export function getDefaultPriority(type: CelebrationType): CelebrationPriority {
  return TYPE_TO_PRIORITY[type];
}

export function getDuration(type: CelebrationType, rarity?: ItemRarity): number {
  const baseDuration = CELEBRATION_DURATIONS[type];
  if (rarity === 'legendary' || rarity === 'epic') {
    return ENHANCED_DURATION;
  }
  return baseDuration;
}

export function calculateAudioVolume(masterVolume: number, sfxVolume: number): number {
  // Both volumes are 0-1 normalized
  return Math.max(0, Math.min(1, masterVolume * sfxVolume));
}

// ============================================
// CelebrationSystem Class
// ============================================

export class CelebrationSystem {
  private _queue: Celebration[] = [];
  private _current: Celebration | null = null;
  private _state: CelebrationState = 'idle';
  private _enabled: boolean;
  private _reducedMotion: boolean;
  private _masterVolume: number;
  private _sfxVolume: number;
  private _maxQueueSize: number;
  
  private stateChangeCallbacks: Set<(state: CelebrationState) => void> = new Set();
  private celebrationCallbacks: Set<(celebration: Celebration | null) => void> = new Set();
  private transitionTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: CelebrationSystemOptions = {}) {
    this._enabled = options.enabled ?? true;
    this._reducedMotion = options.reducedMotion ?? false;
    this._masterVolume = options.masterVolume ?? 1;
    this._sfxVolume = options.sfxVolume ?? 1;
    this._maxQueueSize = options.maxQueueSize ?? MAX_QUEUE_SIZE;
  }

  // ============================================
  // Getters
  // ============================================

  get current(): Celebration | null {
    return this._current;
  }

  get state(): CelebrationState {
    return this._state;
  }

  get queueLength(): number {
    return this._queue.length;
  }

  get isActive(): boolean {
    return this._state !== 'idle';
  }

  get isEnabled(): boolean {
    return this._enabled;
  }

  get reducedMotion(): boolean {
    return this._reducedMotion;
  }

  get audioVolume(): number {
    return calculateAudioVolume(this._masterVolume, this._sfxVolume);
  }

  // ============================================
  // Setters
  // ============================================

  setEnabled(enabled: boolean): void {
    this._enabled = enabled;
  }

  setReducedMotion(reducedMotion: boolean): void {
    this._reducedMotion = reducedMotion;
  }

  setMasterVolume(volume: number): void {
    this._masterVolume = Math.max(0, Math.min(1, volume));
  }

  setSfxVolume(volume: number): void {
    this._sfxVolume = Math.max(0, Math.min(1, volume));
  }


  // ============================================
  // Queue Management
  // ============================================

  /**
   * Queue a celebration for display.
   * Celebrations are ordered by priority (highest first), then by timestamp.
   */
  queue(input: Omit<Celebration, 'id' | 'timestamp' | 'status'>): Celebration {
    const celebration: Celebration = {
      ...input,
      id: generateCelebrationId(),
      timestamp: Date.now(),
      status: 'pending',
    };

    // If disabled, mark as skipped and return
    if (!this._enabled) {
      celebration.status = 'skipped';
      return celebration;
    }

    // Add to queue
    this._queue.push(celebration);

    // Sort by priority (descending) then timestamp (ascending)
    this.sortQueue();

    // Consolidate if queue is too large
    if (this._queue.length > this._maxQueueSize) {
      this.consolidateQueue();
    }

    // Start displaying if idle
    if (this._state === 'idle') {
      this.displayNext();
    }

    return celebration;
  }

  /**
   * Queue a celebration with just type and data (convenience method).
   */
  queueCelebration(
    type: CelebrationType,
    data: CelebrationData,
    priority?: CelebrationPriority
  ): Celebration {
    return this.queue({
      type,
      data,
      priority: priority ?? getDefaultPriority(type),
    });
  }

  /**
   * Sort queue by priority (descending) then timestamp (ascending).
   */
  private sortQueue(): void {
    this._queue.sort((a, b) => {
      const priorityDiff = getPriorityValue(b.priority) - getPriorityValue(a.priority);
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Consolidate low-priority celebrations when queue exceeds max size.
   */
  private consolidateQueue(): void {
    // Keep only the highest priority celebrations up to max size
    // Drop lowest priority items
    while (this._queue.length > this._maxQueueSize) {
      // Find lowest priority item
      let lowestIdx = this._queue.length - 1;
      for (let i = this._queue.length - 1; i >= 0; i--) {
        if (getPriorityValue(this._queue[i].priority) < getPriorityValue(this._queue[lowestIdx].priority)) {
          lowestIdx = i;
        }
      }
      // Remove it
      const removed = this._queue.splice(lowestIdx, 1)[0];
      removed.status = 'skipped';
    }
  }

  // ============================================
  // Display Logic
  // ============================================

  /**
   * Display the next celebration in the queue.
   */
  private displayNext(): void {
    if (this._queue.length === 0) {
      this._state = 'idle';
      this._current = null;
      this.notifyCelebrationChange();
      this.notifyStateChange();
      return;
    }

    const next = this._queue.shift()!;
    next.status = 'active';
    this._current = next;
    this._state = 'entering';
    
    this.notifyCelebrationChange();
    this.notifyStateChange();

    // Calculate duration
    const duration = this._reducedMotion
      ? REDUCED_MOTION_DURATION_MS
      : getDuration(next.type, next.data.rarity);

    // Transition to displaying after entrance
    const entranceDuration = this._reducedMotion ? 100 : 300;
    this.transitionTimer = setTimeout(() => {
      this._state = 'displaying';
      this.notifyStateChange();

      // Schedule exit
      this.transitionTimer = setTimeout(() => {
        this.completeCurrentCelebration();
      }, duration - entranceDuration);
    }, entranceDuration);
  }

  /**
   * Complete the current celebration and move to next.
   */
  private completeCurrentCelebration(): void {
    if (this._current) {
      this._current.status = 'completed';
    }
    
    this._state = 'exiting';
    this.notifyStateChange();

    // After exit animation, show next or go idle
    const exitDuration = this._reducedMotion ? 100 : 200;
    this.transitionTimer = setTimeout(() => {
      // Gap before next celebration
      setTimeout(() => {
        this.displayNext();
      }, CELEBRATION_GAP_MS);
    }, exitDuration);
  }


  // ============================================
  // Skip Functionality
  // ============================================

  /**
   * Skip the current celebration and advance to the next.
   */
  skip(): void {
    if (!this._current || this._state === 'idle') {
      return;
    }

    // Clear any pending timers
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }

    // Mark as skipped
    this._current.status = 'skipped';
    
    // Fast-forward to exit
    this._state = 'exiting';
    this.notifyStateChange();

    // Quick exit then next
    this.transitionTimer = setTimeout(() => {
      setTimeout(() => {
        this.displayNext();
      }, CELEBRATION_GAP_MS);
    }, SKIP_DURATION_MS);
  }

  /**
   * Clear all pending celebrations.
   */
  clearQueue(): void {
    for (const celebration of this._queue) {
      celebration.status = 'skipped';
    }
    this._queue = [];
  }

  // ============================================
  // Callbacks
  // ============================================

  onStateChange(callback: (state: CelebrationState) => void): () => void {
    this.stateChangeCallbacks.add(callback);
    return () => this.stateChangeCallbacks.delete(callback);
  }

  onCelebrationChange(callback: (celebration: Celebration | null) => void): () => void {
    this.celebrationCallbacks.add(callback);
    return () => this.celebrationCallbacks.delete(callback);
  }

  private notifyStateChange(): void {
    for (const callback of this.stateChangeCallbacks) {
      callback(this._state);
    }
  }

  private notifyCelebrationChange(): void {
    for (const callback of this.celebrationCallbacks) {
      callback(this._current);
    }
  }

  // ============================================
  // Convenience Methods for Common Celebrations
  // ============================================

  /**
   * Trigger a purchase celebration.
   */
  triggerPurchase(item: RewardItem): Celebration {
    return this.queueCelebration('purchase', {
      title: 'Item Purchased!',
      subtitle: item.name,
      icon: item.icon,
      rarity: item.rarity,
      rewards: [item],
    });
  }

  /**
   * Trigger a coin purchase celebration.
   */
  triggerCoinPurchase(amount: number): Celebration {
    return this.queueCelebration('coin-purchase', {
      title: 'Coins Acquired!',
      subtitle: `+${amount.toLocaleString()} coins`,
      amount,
    });
  }

  /**
   * Trigger a tier-up celebration.
   */
  triggerTierUp(tierNumber: number, reward?: RewardItem): Celebration {
    return this.queueCelebration('tier-up', {
      title: `Tier ${tierNumber}!`,
      subtitle: reward?.name ?? 'New tier unlocked',
      tierNumber,
      rarity: reward?.rarity,
      rewards: reward ? [reward] : undefined,
    }, 'high');
  }

  /**
   * Trigger an achievement celebration.
   */
  triggerAchievement(name: string, _description: string, xpReward?: number, rarity?: ItemRarity): Celebration {
    return this.queueCelebration('achievement', {
      title: 'Achievement Unlocked!',
      subtitle: name,
      rarity: rarity ?? 'common',
      xpReward,
    }, rarity === 'legendary' ? 'critical' : 'high');
  }

  // ============================================
  // Cleanup
  // ============================================

  dispose(): void {
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }
    this.clearQueue();
    this._current = null;
    this._state = 'idle';
    this.stateChangeCallbacks.clear();
    this.celebrationCallbacks.clear();
  }
}

// ============================================
// Singleton Instance
// ============================================

let celebrationSystemInstance: CelebrationSystem | null = null;

export function getCelebrationSystem(): CelebrationSystem {
  if (!celebrationSystemInstance) {
    celebrationSystemInstance = new CelebrationSystem();
  }
  return celebrationSystemInstance;
}

export function resetCelebrationSystem(): void {
  if (celebrationSystemInstance) {
    celebrationSystemInstance.dispose();
    celebrationSystemInstance = null;
  }
}
