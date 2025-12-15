/**
 * CinematicController - Full-screen achievement unlock cinematics.
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.7
 * 
 * Manages achievement cinematics with queue management, state machine,
 * and audio pause/resume for background music.
 */

// ============================================
// Types
// ============================================

export type AchievementRarity = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface AchievementCinematic {
  id: string;
  achievementId: string;
  icon: string;
  name: string;
  description: string;
  rarity: AchievementRarity;
  xpReward?: number;
  isSecret?: boolean;
}

export type CinematicState = 'idle' | 'entering' | 'displaying' | 'exiting';

export type DisplayMode = 'fullscreen' | 'toast';

export interface CinematicControllerOptions {
  reducedMotion?: boolean;
  enabled?: boolean;
}

// ============================================
// Constants
// ============================================

// Entrance animation duration (ms)
export const ENTRANCE_DURATION_MS = 1000;

// Display duration by rarity (ms)
const DISPLAY_DURATIONS: Record<AchievementRarity, number> = {
  bronze: 2000,
  silver: 2500,
  gold: 3000,
  platinum: 4000,
};

// Exit animation duration (ms)
export const EXIT_DURATION_MS = 300;

// Gap between cinematics (ms)
export const CINEMATIC_GAP_MS = 500;

// Skip animation duration (ms)
export const SKIP_DURATION_MS = 200;

// Toast duration for reduced motion (ms)
export const TOAST_DURATION_MS = 3000;

// Batching window for simultaneous unlocks (ms)
export const BATCH_WINDOW_MS = 500;

// Background audio volume during cinematic
export const BACKGROUND_AUDIO_VOLUME = 0.2;

// ============================================
// Utility Functions
// ============================================

let cinematicIdCounter = 0;

function generateCinematicId(): string {
  return `cinematic-${Date.now()}-${++cinematicIdCounter}`;
}

export function getDisplayDuration(rarity: AchievementRarity): number {
  return DISPLAY_DURATIONS[rarity];
}

export function getTotalDuration(rarity: AchievementRarity, reducedMotion: boolean): number {
  if (reducedMotion) {
    return TOAST_DURATION_MS;
  }
  return ENTRANCE_DURATION_MS + DISPLAY_DURATIONS[rarity] + EXIT_DURATION_MS;
}

// Rarity priority for queue ordering (higher = shown first)
const RARITY_PRIORITY: Record<AchievementRarity, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 4,
};

export function getRarityPriority(rarity: AchievementRarity): number {
  return RARITY_PRIORITY[rarity];
}


// ============================================
// CinematicController Class
// ============================================

export class CinematicController {
  private _queue: AchievementCinematic[] = [];
  private _current: AchievementCinematic | null = null;
  private _state: CinematicState = 'idle';
  private _reducedMotion: boolean;
  private _enabled: boolean;
  
  private stateChangeCallbacks: Set<(state: CinematicState) => void> = new Set();
  private cinematicCallbacks: Set<(cinematic: AchievementCinematic | null) => void> = new Set();
  private transitionTimer: ReturnType<typeof setTimeout> | null = null;
  
  // Audio control
  private previousAudioVolume: number = 1;
  private audioVolumeCallback: ((volume: number) => void) | null = null;

  constructor(options: CinematicControllerOptions = {}) {
    this._reducedMotion = options.reducedMotion ?? false;
    this._enabled = options.enabled ?? true;
  }

  // ============================================
  // Getters
  // ============================================

  get current(): AchievementCinematic | null {
    return this._current;
  }

  get state(): CinematicState {
    return this._state;
  }

  get queueLength(): number {
    return this._queue.length;
  }

  get isActive(): boolean {
    return this._state !== 'idle';
  }

  get displayMode(): DisplayMode {
    return this._reducedMotion ? 'toast' : 'fullscreen';
  }

  get reducedMotion(): boolean {
    return this._reducedMotion;
  }

  get isEnabled(): boolean {
    return this._enabled;
  }

  // ============================================
  // Setters
  // ============================================

  setReducedMotion(reducedMotion: boolean): void {
    this._reducedMotion = reducedMotion;
  }

  setEnabled(enabled: boolean): void {
    this._enabled = enabled;
  }

  setAudioVolumeCallback(callback: (volume: number) => void): void {
    this.audioVolumeCallback = callback;
  }

  // ============================================
  // Queue Management
  // ============================================

  /**
   * Queue an achievement cinematic for display.
   * Achievements are ordered by rarity (highest first).
   */
  queueAchievement(achievement: Omit<AchievementCinematic, 'id'>): AchievementCinematic {
    const cinematic: AchievementCinematic = {
      ...achievement,
      id: generateCinematicId(),
    };

    if (!this._enabled) {
      return cinematic;
    }

    // Add to queue
    this._queue.push(cinematic);

    // Sort by rarity (descending)
    this.sortQueue();

    // Start displaying if idle
    if (this._state === 'idle') {
      this.displayNext();
    }

    return cinematic;
  }

  /**
   * Sort queue by rarity priority (highest first).
   */
  private sortQueue(): void {
    this._queue.sort((a, b) => {
      return getRarityPriority(b.rarity) - getRarityPriority(a.rarity);
    });
  }

  // ============================================
  // Display Logic
  // ============================================

  /**
   * Display the next cinematic in the queue.
   */
  private displayNext(): void {
    if (this._queue.length === 0) {
      this._state = 'idle';
      this._current = null;
      this.restoreAudioVolume();
      this.notifyCinematicChange();
      this.notifyStateChange();
      return;
    }

    const next = this._queue.shift()!;
    this._current = next;
    this._state = 'entering';
    
    // Reduce background audio
    this.reduceAudioVolume();
    
    this.notifyCinematicChange();
    this.notifyStateChange();

    if (this._reducedMotion) {
      // Toast mode: simple timing
      this.transitionTimer = setTimeout(() => {
        this.completeCinematic();
      }, TOAST_DURATION_MS);
    } else {
      // Full cinematic mode
      // Entrance phase
      this.transitionTimer = setTimeout(() => {
        this._state = 'displaying';
        this.notifyStateChange();

        // Display phase
        const displayDuration = getDisplayDuration(next.rarity);
        this.transitionTimer = setTimeout(() => {
          this.completeCinematic();
        }, displayDuration);
      }, ENTRANCE_DURATION_MS);
    }
  }

  /**
   * Complete the current cinematic and move to next.
   */
  private completeCinematic(): void {
    this._state = 'exiting';
    this.notifyStateChange();

    const exitDuration = this._reducedMotion ? 100 : EXIT_DURATION_MS;
    this.transitionTimer = setTimeout(() => {
      // Gap before next cinematic
      setTimeout(() => {
        this.displayNext();
      }, CINEMATIC_GAP_MS);
    }, exitDuration);
  }


  // ============================================
  // Skip Functionality
  // ============================================

  /**
   * Skip the current cinematic and advance to the next.
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

    // Fast-forward to exit
    this._state = 'exiting';
    this.notifyStateChange();

    // Quick exit then next
    this.transitionTimer = setTimeout(() => {
      setTimeout(() => {
        this.displayNext();
      }, CINEMATIC_GAP_MS);
    }, SKIP_DURATION_MS);
  }

  /**
   * Clear all pending cinematics.
   */
  clearQueue(): void {
    this._queue = [];
  }

  // ============================================
  // Audio Control
  // ============================================

  private reduceAudioVolume(): void {
    if (this.audioVolumeCallback) {
      this.previousAudioVolume = 1; // Assume full volume
      this.audioVolumeCallback(BACKGROUND_AUDIO_VOLUME);
    }
  }

  private restoreAudioVolume(): void {
    if (this.audioVolumeCallback) {
      this.audioVolumeCallback(this.previousAudioVolume);
    }
  }

  // ============================================
  // Callbacks
  // ============================================

  onStateChange(callback: (state: CinematicState) => void): () => void {
    this.stateChangeCallbacks.add(callback);
    return () => this.stateChangeCallbacks.delete(callback);
  }

  onCinematicChange(callback: (cinematic: AchievementCinematic | null) => void): () => void {
    this.cinematicCallbacks.add(callback);
    return () => this.cinematicCallbacks.delete(callback);
  }

  private notifyStateChange(): void {
    for (const callback of this.stateChangeCallbacks) {
      callback(this._state);
    }
  }

  private notifyCinematicChange(): void {
    for (const callback of this.cinematicCallbacks) {
      callback(this._current);
    }
  }

  // ============================================
  // Cleanup
  // ============================================

  dispose(): void {
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }
    this.restoreAudioVolume();
    this.clearQueue();
    this._current = null;
    this._state = 'idle';
    this.stateChangeCallbacks.clear();
    this.cinematicCallbacks.clear();
    this.audioVolumeCallback = null;
  }
}

// ============================================
// Singleton Instance
// ============================================

let cinematicControllerInstance: CinematicController | null = null;

export function getCinematicController(): CinematicController {
  if (!cinematicControllerInstance) {
    cinematicControllerInstance = new CinematicController();
  }
  return cinematicControllerInstance;
}

export function resetCinematicController(): void {
  if (cinematicControllerInstance) {
    cinematicControllerInstance.dispose();
    cinematicControllerInstance = null;
  }
}
