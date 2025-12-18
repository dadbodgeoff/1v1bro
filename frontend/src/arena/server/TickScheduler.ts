/**
 * Tick Scheduler
 *
 * Layer 5: Server Orchestration - Manages fixed-timestep game loop.
 * Maintains 60 ticks per second with catch-up logic to prevent spiral of death.
 */

import type { IEventBus } from '../core/EventBus';

/**
 * Tick scheduler configuration
 */
export interface TickSchedulerConfig {
  /** Target tick rate (ticks per second) */
  readonly tickRate: number;
  /** Maximum ticks to process in catch-up before skipping */
  readonly maxCatchUpTicks: number;
}

/**
 * Default tick scheduler configuration
 */
export const DEFAULT_TICK_SCHEDULER_CONFIG: TickSchedulerConfig = {
  tickRate: 60,
  maxCatchUpTicks: 3,
};

/**
 * Tick handler function signature
 */
export type TickHandler = (tickNumber: number, deltaTime: number) => void;

/**
 * Tick scheduler interface
 */
export interface ITickScheduler {
  /** Start the tick loop */
  start(): void;
  /** Stop the tick loop */
  stop(): void;
  /** Get current tick number */
  getCurrentTick(): number;
  /** Get tick duration in milliseconds */
  getTickDuration(): number;
  /** Register a tick handler, returns unsubscribe function */
  onTick(handler: TickHandler): () => void;
  /** Check if scheduler is running */
  isRunning(): boolean;
  /** Manually process a single tick (for testing) */
  manualTick(): void;
}

/**
 * Tick scheduler implementation
 *
 * Uses setInterval for consistent timing across environments.
 * Implements catch-up logic to handle slow ticks without spiral of death.
 */
export class TickScheduler implements ITickScheduler {
  private running = false;
  private currentTick = 0;
  private lastTickTime = 0;
  private tickHandlers: Set<TickHandler> = new Set();
  private readonly tickDuration: number;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private accumulatedTime = 0;
  private readonly config: TickSchedulerConfig;
  private readonly eventBus?: IEventBus;

  constructor(
    config: TickSchedulerConfig = DEFAULT_TICK_SCHEDULER_CONFIG,
    eventBus?: IEventBus
  ) {
    this.config = config;
    this.eventBus = eventBus;
    this.tickDuration = 1000 / config.tickRate;
  }

  start(): void {
    if (this.running) return;

    this.running = true;
    this.lastTickTime = Date.now();
    this.accumulatedTime = 0;
    this.scheduleNextUpdate();
  }

  stop(): void {
    this.running = false;

    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getCurrentTick(): number {
    return this.currentTick;
  }

  getTickDuration(): number {
    return this.tickDuration;
  }

  onTick(handler: TickHandler): () => void {
    this.tickHandlers.add(handler);
    return () => this.tickHandlers.delete(handler);
  }

  isRunning(): boolean {
    return this.running;
  }

  /**
   * Manually process a single tick (for testing)
   */
  manualTick(): void {
    this.processTick();
  }

  /**
   * Schedule the next update
   */
  private scheduleNextUpdate(): void {
    this.intervalId = setInterval(() => this.update(), this.tickDuration);
  }

  /**
   * Main update loop
   */
  private update(): void {
    if (!this.running) return;

    const now = Date.now();
    const elapsed = now - this.lastTickTime;
    this.lastTickTime = now;
    this.accumulatedTime += elapsed;

    let ticksToProcess = 0;

    // Calculate how many ticks we need to process
    while (this.accumulatedTime >= this.tickDuration) {
      ticksToProcess++;
      this.accumulatedTime -= this.tickDuration;

      // Cap catch-up to prevent spiral of death
      if (ticksToProcess >= this.config.maxCatchUpTicks) {
        const skippedTicks = Math.floor(this.accumulatedTime / this.tickDuration);
        this.accumulatedTime = 0;

        if (skippedTicks > 0) {
          this.eventBus?.emit({
            type: 'tick_catchup_warning',
            timestamp: now,
            skippedTicks,
          });
        }
        break;
      }
    }

    // Process ticks
    for (let i = 0; i < ticksToProcess; i++) {
      this.processTick();
    }
  }

  /**
   * Process a single tick
   */
  private processTick(): void {
    const deltaTime = this.tickDuration / 1000; // Convert to seconds

    this.tickHandlers.forEach((handler) => {
      try {
        handler(this.currentTick, deltaTime);
      } catch (error) {
        this.eventBus?.emit({
          type: 'tick_handler_error',
          timestamp: Date.now(),
          tickNumber: this.currentTick,
          error: String(error),
        });
      }
    });

    // Wrap tick number at MAX_UINT32 using unsigned right shift
    this.currentTick = (this.currentTick + 1) >>> 0;
  }
}
