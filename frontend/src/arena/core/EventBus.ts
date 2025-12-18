/**
 * EventBus - Typed pub/sub system for cross-system communication
 * 
 * Provides decoupled event-driven communication between arena subsystems.
 * All events must extend GameEvent interface with a type discriminator.
 * 
 * @example
 * const bus = new EventBus();
 * const unsubscribe = bus.on('player_damaged', (event) => {
 *   console.log(`Player ${event.victimId} took ${event.damage} damage`);
 * });
 * bus.emit({ type: 'player_damaged', timestamp: Date.now(), victimId: 1, damage: 25 });
 * unsubscribe(); // Clean up when done
 */

export interface GameEvent {
  readonly type: string;
  readonly timestamp: number;
}

export type EventHandler<T extends GameEvent> = (event: T) => void;

export interface IEventBus {
  /**
   * Emit an event to all registered handlers
   */
  emit<T extends GameEvent>(event: T): void;

  /**
   * Subscribe to events of a specific type
   * @returns Unsubscribe function
   */
  on<T extends GameEvent>(type: T['type'], handler: EventHandler<T>): () => void;

  /**
   * Unsubscribe a handler from a specific event type
   */
  off<T extends GameEvent>(type: T['type'], handler: EventHandler<T>): void;

  /**
   * Remove all handlers for all event types
   */
  clear(): void;

  /**
   * Get count of handlers for a specific event type
   */
  listenerCount(type: string): number;
}

export class EventBus implements IEventBus {
  private handlers: Map<string, Set<EventHandler<GameEvent>>> = new Map();

  emit<T extends GameEvent>(event: T): void {
    const typeHandlers = this.handlers.get(event.type);
    if (typeHandlers) {
      // Create a copy to allow handlers to unsubscribe during iteration
      const handlersCopy = Array.from(typeHandlers);
      for (const handler of handlersCopy) {
        try {
          handler(event);
        } catch (error) {
          // Log but don't propagate errors from handlers
          console.error(`EventBus handler error for '${event.type}':`, error);
        }
      }
    }
  }

  on<T extends GameEvent>(type: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler as EventHandler<GameEvent>);
    return () => this.off(type, handler);
  }

  off<T extends GameEvent>(type: string, handler: EventHandler<T>): void {
    const typeHandlers = this.handlers.get(type);
    if (typeHandlers) {
      typeHandlers.delete(handler as EventHandler<GameEvent>);
      // Clean up empty sets
      if (typeHandlers.size === 0) {
        this.handlers.delete(type);
      }
    }
  }

  clear(): void {
    this.handlers.clear();
  }

  listenerCount(type: string): number {
    const typeHandlers = this.handlers.get(type);
    return typeHandlers ? typeHandlers.size : 0;
  }
}
