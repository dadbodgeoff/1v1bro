import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { EventBus, GameEvent, EventHandler } from './EventBus';

interface TestEvent extends GameEvent {
  type: 'test_event';
  value: number;
}

interface OtherEvent extends GameEvent {
  type: 'other_event';
  message: string;
}

describe('EventBus', () => {
  describe('emit and on', () => {
    it('handler receives emitted event', () => {
      const bus = new EventBus();
      const handler = vi.fn();
      
      bus.on<TestEvent>('test_event', handler);
      bus.emit<TestEvent>({ type: 'test_event', timestamp: 1000, value: 42 });
      
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ type: 'test_event', timestamp: 1000, value: 42 });
    });

    it('multiple handlers receive same event', () => {
      const bus = new EventBus();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();
      
      bus.on<TestEvent>('test_event', handler1);
      bus.on<TestEvent>('test_event', handler2);
      bus.on<TestEvent>('test_event', handler3);
      
      bus.emit<TestEvent>({ type: 'test_event', timestamp: 1000, value: 99 });
      
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).toHaveBeenCalledTimes(1);
    });

    it('handlers only receive events of subscribed type', () => {
      const bus = new EventBus();
      const testHandler = vi.fn();
      const otherHandler = vi.fn();
      
      bus.on<TestEvent>('test_event', testHandler);
      bus.on<OtherEvent>('other_event', otherHandler);
      
      bus.emit<TestEvent>({ type: 'test_event', timestamp: 1000, value: 1 });
      
      expect(testHandler).toHaveBeenCalledTimes(1);
      expect(otherHandler).not.toHaveBeenCalled();
    });

    it('emitting with no handlers does not throw', () => {
      const bus = new EventBus();
      expect(() => {
        bus.emit<TestEvent>({ type: 'test_event', timestamp: 1000, value: 1 });
      }).not.toThrow();
    });
  });

  describe('off', () => {
    it('off() prevents future event delivery', () => {
      const bus = new EventBus();
      const handler = vi.fn();
      
      bus.on<TestEvent>('test_event', handler);
      bus.emit<TestEvent>({ type: 'test_event', timestamp: 1000, value: 1 });
      expect(handler).toHaveBeenCalledTimes(1);
      
      bus.off<TestEvent>('test_event', handler);
      bus.emit<TestEvent>({ type: 'test_event', timestamp: 2000, value: 2 });
      expect(handler).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    it('unsubscribe function from on() works', () => {
      const bus = new EventBus();
      const handler = vi.fn();
      
      const unsubscribe = bus.on<TestEvent>('test_event', handler);
      bus.emit<TestEvent>({ type: 'test_event', timestamp: 1000, value: 1 });
      expect(handler).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      bus.emit<TestEvent>({ type: 'test_event', timestamp: 2000, value: 2 });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('off() on non-existent handler does not throw', () => {
      const bus = new EventBus();
      const handler = vi.fn();
      
      expect(() => {
        bus.off<TestEvent>('test_event', handler);
      }).not.toThrow();
    });

    it('off() only removes specified handler', () => {
      const bus = new EventBus();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      bus.on<TestEvent>('test_event', handler1);
      bus.on<TestEvent>('test_event', handler2);
      
      bus.off<TestEvent>('test_event', handler1);
      bus.emit<TestEvent>({ type: 'test_event', timestamp: 1000, value: 1 });
      
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe('clear', () => {
    it('clear() removes all handlers', () => {
      const bus = new EventBus();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      bus.on<TestEvent>('test_event', handler1);
      bus.on<OtherEvent>('other_event', handler2);
      
      bus.clear();
      
      bus.emit<TestEvent>({ type: 'test_event', timestamp: 1000, value: 1 });
      bus.emit<OtherEvent>({ type: 'other_event', timestamp: 1000, message: 'hi' });
      
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('listenerCount', () => {
    it('returns correct count', () => {
      const bus = new EventBus();
      
      expect(bus.listenerCount('test_event')).toBe(0);
      
      const unsub1 = bus.on<TestEvent>('test_event', () => {});
      expect(bus.listenerCount('test_event')).toBe(1);
      
      const unsub2 = bus.on<TestEvent>('test_event', () => {});
      expect(bus.listenerCount('test_event')).toBe(2);
      
      unsub1();
      expect(bus.listenerCount('test_event')).toBe(1);
      
      unsub2();
      expect(bus.listenerCount('test_event')).toBe(0);
    });
  });

  describe('error handling', () => {
    it('handler error does not prevent other handlers from running', () => {
      const bus = new EventBus();
      const errorHandler = vi.fn(() => { throw new Error('Handler error'); });
      const goodHandler = vi.fn();
      
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      bus.on<TestEvent>('test_event', errorHandler);
      bus.on<TestEvent>('test_event', goodHandler);
      
      bus.emit<TestEvent>({ type: 'test_event', timestamp: 1000, value: 1 });
      
      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(goodHandler).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('handler can unsubscribe during event handling', () => {
      const bus = new EventBus();
      let unsubscribe: () => void;
      const selfRemovingHandler = vi.fn(() => {
        unsubscribe();
      });
      const otherHandler = vi.fn();
      
      unsubscribe = bus.on<TestEvent>('test_event', selfRemovingHandler);
      bus.on<TestEvent>('test_event', otherHandler);
      
      bus.emit<TestEvent>({ type: 'test_event', timestamp: 1000, value: 1 });
      
      expect(selfRemovingHandler).toHaveBeenCalledTimes(1);
      expect(otherHandler).toHaveBeenCalledTimes(1);
      
      // Second emit should not call the self-removing handler
      bus.emit<TestEvent>({ type: 'test_event', timestamp: 2000, value: 2 });
      expect(selfRemovingHandler).toHaveBeenCalledTimes(1);
      expect(otherHandler).toHaveBeenCalledTimes(2);
    });
  });

  /**
   * Property Tests for EventBus
   * **Feature: arena-3d-physics-multiplayer, Property: Handlers receive all emitted events of subscribed type**
   * **Validates: Requirements 17.4**
   */
  describe('property tests', () => {
    it('handlers receive all emitted events of subscribed type', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer(), { minLength: 1, maxLength: 20 }),
          (values) => {
            const bus = new EventBus();
            const received: number[] = [];
            
            bus.on<TestEvent>('test_event', (event) => {
              received.push(event.value);
            });
            
            for (const value of values) {
              bus.emit<TestEvent>({ type: 'test_event', timestamp: Date.now(), value });
            }
            
            expect(received).toEqual(values);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: arena-3d-physics-multiplayer, Property: off() prevents future event delivery**
     * **Validates: Requirements 17.4**
     */
    it('off() prevents future event delivery for any sequence', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: 10 }),
          (beforeCount, afterCount) => {
            const bus = new EventBus();
            let callCount = 0;
            const handler = () => { callCount++; };
            
            const unsubscribe = bus.on<TestEvent>('test_event', handler);
            
            // Emit before unsubscribe
            for (let i = 0; i < beforeCount; i++) {
              bus.emit<TestEvent>({ type: 'test_event', timestamp: Date.now(), value: i });
            }
            expect(callCount).toBe(beforeCount);
            
            unsubscribe();
            
            // Emit after unsubscribe
            for (let i = 0; i < afterCount; i++) {
              bus.emit<TestEvent>({ type: 'test_event', timestamp: Date.now(), value: i });
            }
            expect(callCount).toBe(beforeCount); // Should not increase
          }
        ),
        { numRuns: 100 }
      );
    });

    it('events are isolated by type', () => {
      fc.assert(
        fc.property(
          fc.integer(),
          fc.string(),
          (testValue, otherMessage) => {
            const bus = new EventBus();
            let testReceived = false;
            let otherReceived = false;
            
            bus.on<TestEvent>('test_event', () => { testReceived = true; });
            bus.on<OtherEvent>('other_event', () => { otherReceived = true; });
            
            bus.emit<TestEvent>({ type: 'test_event', timestamp: Date.now(), value: testValue });
            
            expect(testReceived).toBe(true);
            expect(otherReceived).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('multiple handlers all receive the same event', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.integer(),
          (handlerCount, eventValue) => {
            const bus = new EventBus();
            const receivedValues: number[] = [];
            
            for (let i = 0; i < handlerCount; i++) {
              bus.on<TestEvent>('test_event', (event) => {
                receivedValues.push(event.value);
              });
            }
            
            bus.emit<TestEvent>({ type: 'test_event', timestamp: Date.now(), value: eventValue });
            
            expect(receivedValues.length).toBe(handlerCount);
            expect(receivedValues.every(v => v === eventValue)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
