/**
 * Tick Scheduler Tests
 *
 * Unit tests for the fixed-timestep game loop scheduler.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  TickScheduler,
  DEFAULT_TICK_SCHEDULER_CONFIG,
  type TickSchedulerConfig,
} from './TickScheduler';
import { EventBus } from '../core/EventBus';

describe('TickScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Configuration', () => {
    it('uses default config when none provided', () => {
      const scheduler = new TickScheduler();
      expect(scheduler.getTickDuration()).toBe(1000 / DEFAULT_TICK_SCHEDULER_CONFIG.tickRate);
    });

    it('calculates tick duration from tick rate', () => {
      const config: TickSchedulerConfig = { tickRate: 30, maxCatchUpTicks: 3 };
      const scheduler = new TickScheduler(config);
      expect(scheduler.getTickDuration()).toBeCloseTo(1000 / 30, 2);
    });

    it('starts with tick 0', () => {
      const scheduler = new TickScheduler();
      expect(scheduler.getCurrentTick()).toBe(0);
    });
  });

  describe('Start/Stop', () => {
    it('starts in stopped state', () => {
      const scheduler = new TickScheduler();
      expect(scheduler.isRunning()).toBe(false);
    });

    it('transitions to running on start', () => {
      const scheduler = new TickScheduler();
      scheduler.start();
      expect(scheduler.isRunning()).toBe(true);
      scheduler.stop();
    });

    it('transitions to stopped on stop', () => {
      const scheduler = new TickScheduler();
      scheduler.start();
      scheduler.stop();
      expect(scheduler.isRunning()).toBe(false);
    });

    it('ignores multiple start calls', () => {
      const scheduler = new TickScheduler();
      scheduler.start();
      scheduler.start();
      expect(scheduler.isRunning()).toBe(true);
      scheduler.stop();
    });

    it('ignores stop when not running', () => {
      const scheduler = new TickScheduler();
      scheduler.stop();
      expect(scheduler.isRunning()).toBe(false);
    });
  });

  describe('Tick Processing', () => {
    it('calls tick handler with tick number and delta time', () => {
      const scheduler = new TickScheduler();
      const handler = vi.fn();

      scheduler.onTick(handler);
      scheduler.manualTick();

      expect(handler).toHaveBeenCalled();
      const [tickNumber, deltaTime] = handler.mock.calls[0];
      expect(tickNumber).toBe(0);
      expect(deltaTime).toBeCloseTo(1 / DEFAULT_TICK_SCHEDULER_CONFIG.tickRate, 4);
    });

    it('increments tick number each tick', () => {
      const scheduler = new TickScheduler();
      const tickNumbers: number[] = [];

      scheduler.onTick((tick) => tickNumbers.push(tick));

      scheduler.manualTick();
      scheduler.manualTick();
      scheduler.manualTick();

      expect(tickNumbers).toEqual([0, 1, 2]);
    });

    it('calls multiple handlers', () => {
      const scheduler = new TickScheduler();
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      scheduler.onTick(handler1);
      scheduler.onTick(handler2);
      scheduler.manualTick();

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('unsubscribes handler when returned function is called', () => {
      const scheduler = new TickScheduler();
      const handler = vi.fn();

      const unsubscribe = scheduler.onTick(handler);
      unsubscribe();

      scheduler.manualTick();

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Tick Number Wrapping', () => {
    it('wraps tick number at MAX_UINT32', () => {
      const scheduler = new TickScheduler();

      // Access private field for testing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (scheduler as any).currentTick = 0xffffffff;

      const tickNumbers: number[] = [];
      scheduler.onTick((tick) => tickNumbers.push(tick));

      scheduler.manualTick();
      scheduler.manualTick();

      // Should wrap from MAX_UINT32 to 0
      expect(tickNumbers).toEqual([0xffffffff, 0]);
    });

    it('handles tick comparison correctly after wrap', () => {
      const scheduler = new TickScheduler();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (scheduler as any).currentTick = 0xffffffff;

      scheduler.manualTick();
      scheduler.manualTick();

      expect(scheduler.getCurrentTick()).toBe(1);
    });
  });

  describe('Handler Error Isolation', () => {
    it('continues processing when handler throws', () => {
      const eventBus = new EventBus();
      const scheduler = new TickScheduler(DEFAULT_TICK_SCHEDULER_CONFIG, eventBus);

      const errorHandler = vi.fn(() => {
        throw new Error('Test error');
      });
      const normalHandler = vi.fn();

      scheduler.onTick(errorHandler);
      scheduler.onTick(normalHandler);
      scheduler.manualTick();

      expect(errorHandler).toHaveBeenCalled();
      expect(normalHandler).toHaveBeenCalled();
    });

    it('emits tick_handler_error event when handler throws', () => {
      const eventBus = new EventBus();
      const errorEventHandler = vi.fn();
      eventBus.on('tick_handler_error', errorEventHandler);

      const scheduler = new TickScheduler(DEFAULT_TICK_SCHEDULER_CONFIG, eventBus);

      scheduler.onTick(() => {
        throw new Error('Test error');
      });
      scheduler.manualTick();

      expect(errorEventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'tick_handler_error',
          tickNumber: 0,
          error: expect.stringContaining('Test error'),
        })
      );
    });
  });

  describe('Catch-up Logic', () => {
    it('processes multiple ticks when accumulated time exceeds threshold', () => {
      const config: TickSchedulerConfig = { tickRate: 60, maxCatchUpTicks: 5 };
      const scheduler = new TickScheduler(config);
      const tickNumbers: number[] = [];

      scheduler.onTick((tick) => tickNumbers.push(tick));

      // Manually set accumulated time to simulate being behind
      const tickDuration = 1000 / config.tickRate;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (scheduler as any).accumulatedTime = tickDuration * 3.5; // 3.5 ticks worth
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (scheduler as any).lastTickTime = Date.now();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (scheduler as any).running = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (scheduler as any).update();

      // Should have processed 3 ticks (floor of 3.5)
      expect(tickNumbers.length).toBe(3);
    });

    it('caps catch-up ticks to prevent spiral of death', () => {
      const config: TickSchedulerConfig = { tickRate: 60, maxCatchUpTicks: 3 };
      const scheduler = new TickScheduler(config);
      let tickCount = 0;

      scheduler.onTick(() => {
        tickCount++;
      });

      // Manually set accumulated time to simulate being very behind
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (scheduler as any).accumulatedTime = config.tickRate > 0 ? (1000 / config.tickRate) * 10 : 167;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (scheduler as any).lastTickTime = Date.now();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (scheduler as any).running = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (scheduler as any).update();

      // Should have capped at maxCatchUpTicks
      expect(tickCount).toBe(config.maxCatchUpTicks);
    });

    it('emits tick_catchup_warning when skipping ticks', () => {
      const config: TickSchedulerConfig = { tickRate: 60, maxCatchUpTicks: 2 };
      const eventBus = new EventBus();
      const warningHandler = vi.fn();
      eventBus.on('tick_catchup_warning', warningHandler);

      const scheduler = new TickScheduler(config, eventBus);
      scheduler.onTick(() => {});

      // Manually set accumulated time to simulate being very behind
      const tickDuration = 1000 / config.tickRate;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (scheduler as any).accumulatedTime = tickDuration * 10;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (scheduler as any).lastTickTime = Date.now();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (scheduler as any).running = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (scheduler as any).update();

      expect(warningHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'tick_catchup_warning',
          skippedTicks: expect.any(Number),
        })
      );
    });
  });

  describe('Tick Duration', () => {
    it('returns correct tick duration for 60 tick rate', () => {
      const config: TickSchedulerConfig = { tickRate: 60, maxCatchUpTicks: 3 };
      const scheduler = new TickScheduler(config);
      expect(scheduler.getTickDuration()).toBeCloseTo(16.67, 1);
    });

    it('returns correct tick duration for 30 tick rate', () => {
      const config: TickSchedulerConfig = { tickRate: 30, maxCatchUpTicks: 3 };
      const scheduler = new TickScheduler(config);
      expect(scheduler.getTickDuration()).toBeCloseTo(33.33, 1);
    });

    it('returns correct tick duration for 120 tick rate', () => {
      const config: TickSchedulerConfig = { tickRate: 120, maxCatchUpTicks: 3 };
      const scheduler = new TickScheduler(config);
      expect(scheduler.getTickDuration()).toBeCloseTo(8.33, 1);
    });
  });

  describe('getCurrentTick', () => {
    it('returns current tick number', () => {
      const scheduler = new TickScheduler();
      expect(scheduler.getCurrentTick()).toBe(0);

      scheduler.manualTick();
      expect(scheduler.getCurrentTick()).toBe(1);

      scheduler.manualTick();
      expect(scheduler.getCurrentTick()).toBe(2);
    });
  });
});
