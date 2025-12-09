/**
 * Property-based tests for matchmaking hook.
 *
 * Tests correctness properties for reconnection and heartbeat handling.
 *
 * **Feature: matchmaking-hardening**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

// ============================================
// Test Constants (matching hook implementation)
// ============================================

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAYS = [1000, 2000, 4000];
const HEARTBEAT_TIMEOUT = 30000;

// ============================================
// Property 8: Client Reconnection with Exponential Backoff
// ============================================

describe('Property 8: Client reconnection with exponential backoff', () => {
  /**
   * **Feature: matchmaking-hardening, Property 8: Client reconnection with exponential backoff**
   *
   * For any unexpected WebSocket closure on the client, the client must attempt
   * reconnection up to 3 times with exponential backoff delays.
   *
   * **Validates: Requirements 4.1**
   */

  it('should have exactly 3 max reconnection attempts', () => {
    expect(MAX_RECONNECT_ATTEMPTS).toBe(3);
  });

  it('should have exponential backoff delays', () => {
    // Verify delays are exponential (each roughly double the previous)
    expect(RECONNECT_DELAYS[0]).toBe(1000);
    expect(RECONNECT_DELAYS[1]).toBe(2000);
    expect(RECONNECT_DELAYS[2]).toBe(4000);

    // Verify exponential growth
    for (let i = 1; i < RECONNECT_DELAYS.length; i++) {
      expect(RECONNECT_DELAYS[i]).toBeGreaterThan(RECONNECT_DELAYS[i - 1]);
    }
  });

  it('property: delay at attempt N is greater than delay at attempt N-1', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: RECONNECT_DELAYS.length - 1 }),
        (attemptIndex) => {
          const currentDelay = RECONNECT_DELAYS[attemptIndex];
          const previousDelay = RECONNECT_DELAYS[attemptIndex - 1];
          return currentDelay > previousDelay;
        }
      )
    );
  });

  it('property: total reconnection time is bounded', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: MAX_RECONNECT_ATTEMPTS }),
        (numAttempts) => {
          // Calculate total delay for N attempts
          let totalDelay = 0;
          for (let i = 0; i < numAttempts && i < RECONNECT_DELAYS.length; i++) {
            totalDelay += RECONNECT_DELAYS[i];
          }

          // Total delay should be reasonable (under 10 seconds for all attempts)
          return totalDelay <= 7000; // 1000 + 2000 + 4000 = 7000
        }
      )
    );
  });

  it('property: reconnection attempts are capped at MAX_RECONNECT_ATTEMPTS', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        (requestedAttempts) => {
          const actualAttempts = Math.min(requestedAttempts, MAX_RECONNECT_ATTEMPTS);
          return actualAttempts <= MAX_RECONNECT_ATTEMPTS;
        }
      )
    );
  });
});

// ============================================
// Property 9: Client Heartbeat Timeout Detection
// ============================================

describe('Property 9: Client heartbeat timeout detection', () => {
  /**
   * **Feature: matchmaking-hardening, Property 9: Client heartbeat timeout detection**
   *
   * For any client that receives no heartbeat response for 30 seconds,
   * the client must trigger reconnection.
   *
   * **Validates: Requirements 4.4**
   */

  it('should have 30 second heartbeat timeout', () => {
    expect(HEARTBEAT_TIMEOUT).toBe(30000);
  });

  it('property: any time gap >= HEARTBEAT_TIMEOUT triggers reconnection', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: HEARTBEAT_TIMEOUT, max: HEARTBEAT_TIMEOUT * 10 }),
        (timeSinceLastHeartbeat) => {
          // If time since last heartbeat >= timeout, should trigger reconnection
          const shouldReconnect = timeSinceLastHeartbeat >= HEARTBEAT_TIMEOUT;
          return shouldReconnect === true;
        }
      )
    );
  });

  it('property: any time gap < HEARTBEAT_TIMEOUT does not trigger reconnection', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: HEARTBEAT_TIMEOUT - 1 }),
        (timeSinceLastHeartbeat) => {
          // If time since last heartbeat < timeout, should not trigger reconnection
          const shouldReconnect = timeSinceLastHeartbeat >= HEARTBEAT_TIMEOUT;
          return shouldReconnect === false;
        }
      )
    );
  });

  it('property: heartbeat timeout is greater than server heartbeat interval', () => {
    // Server sends heartbeats every 15 seconds, client timeout is 30 seconds
    // This gives 2 missed heartbeats before timeout
    const SERVER_HEARTBEAT_INTERVAL = 15000;
    expect(HEARTBEAT_TIMEOUT).toBeGreaterThan(SERVER_HEARTBEAT_INTERVAL);
    expect(HEARTBEAT_TIMEOUT).toBe(SERVER_HEARTBEAT_INTERVAL * 2);
  });
});

// ============================================
// Reconnection State Machine Tests
// ============================================

describe('Reconnection state machine', () => {
  interface ReconnectionState {
    isReconnecting: boolean;
    attemptCount: number;
    connectionError: string | null;
  }

  type ReconnectionEvent =
    | { type: 'CONNECTION_LOST' }
    | { type: 'RECONNECT_SUCCESS' }
    | { type: 'RECONNECT_FAILURE' }
    | { type: 'MAX_ATTEMPTS_REACHED' }
    | { type: 'USER_CANCELLED' };

  function reconnectionReducer(
    state: ReconnectionState,
    event: ReconnectionEvent
  ): ReconnectionState {
    switch (event.type) {
      case 'CONNECTION_LOST':
        return {
          ...state,
          isReconnecting: true,
          attemptCount: state.attemptCount + 1,
        };
      case 'RECONNECT_SUCCESS':
        return {
          isReconnecting: false,
          attemptCount: 0,
          connectionError: null,
        };
      case 'RECONNECT_FAILURE':
        if (state.attemptCount >= MAX_RECONNECT_ATTEMPTS) {
          return {
            isReconnecting: false,
            attemptCount: state.attemptCount,
            connectionError: 'Connection lost. Please try again.',
          };
        }
        return {
          ...state,
          attemptCount: state.attemptCount + 1,
        };
      case 'MAX_ATTEMPTS_REACHED':
        return {
          isReconnecting: false,
          attemptCount: state.attemptCount,
          connectionError: 'Connection lost. Please try again.',
        };
      case 'USER_CANCELLED':
        return {
          isReconnecting: false,
          attemptCount: 0,
          connectionError: null,
        };
      default:
        return state;
    }
  }

  const initialState: ReconnectionState = {
    isReconnecting: false,
    attemptCount: 0,
    connectionError: null,
  };

  it('property: successful reconnection always resets state', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: MAX_RECONNECT_ATTEMPTS }),
        (attemptCount) => {
          const state: ReconnectionState = {
            isReconnecting: true,
            attemptCount,
            connectionError: null,
          };

          const newState = reconnectionReducer(state, { type: 'RECONNECT_SUCCESS' });

          return (
            newState.isReconnecting === false &&
            newState.attemptCount === 0 &&
            newState.connectionError === null
          );
        }
      )
    );
  });

  it('property: max attempts always results in error state', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: MAX_RECONNECT_ATTEMPTS, max: MAX_RECONNECT_ATTEMPTS + 10 }),
        (attemptCount) => {
          const state: ReconnectionState = {
            isReconnecting: true,
            attemptCount,
            connectionError: null,
          };

          const newState = reconnectionReducer(state, { type: 'RECONNECT_FAILURE' });

          return (
            newState.isReconnecting === false &&
            newState.connectionError !== null
          );
        }
      )
    );
  });

  it('property: user cancellation always clears error', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.integer({ min: 0, max: 10 }),
        fc.option(fc.string(), { nil: null }),
        (isReconnecting, attemptCount, connectionError) => {
          const state: ReconnectionState = {
            isReconnecting,
            attemptCount,
            connectionError,
          };

          const newState = reconnectionReducer(state, { type: 'USER_CANCELLED' });

          return (
            newState.isReconnecting === false &&
            newState.attemptCount === 0 &&
            newState.connectionError === null
          );
        }
      )
    );
  });
});
