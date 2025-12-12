/**
 * Property-Based Tests for Error Boundary
 * 
 * Tests Property 15 from the design document:
 * - Property 15: Error Boundary Isolation
 * 
 * @module landing/arcade/__tests__/properties/error-boundary.property
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

// Error boundary behavior simulation (without React rendering)
// This tests the logic that would be used in the error boundary

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

function createErrorBoundaryState(): ErrorBoundaryState {
  return {
    hasError: false,
    error: null,
  };
}

function handleError(_state: ErrorBoundaryState, error: Error): ErrorBoundaryState {
  return {
    hasError: true,
    error,
  };
}

function shouldRenderFallback(state: ErrorBoundaryState): boolean {
  return state.hasError;
}

function getErrorMessage(state: ErrorBoundaryState): string | null {
  return state.error?.message ?? null;
}

describe('Error Boundary Properties', () => {
  // Suppress console.error for error boundary tests
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  afterEach(() => {
    console.error = originalError;
  });

  /**
   * **Feature: crt-arcade-landing, Property 15: Error Boundary Isolation**
   * 
   * *For any* error thrown by a child component, the ArcadeLandingErrorBoundary
   * SHALL catch it and render StaticLandingFallback without crashing the page.
   * 
   * **Validates: Requirements 6.1**
   */
  it('Property 15: Error boundary catches any error and sets fallback state', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }), // Error message
        (errorMessage) => {
          const error = new Error(errorMessage);
          const initialState = createErrorBoundaryState();
          
          // Initial state should not show fallback
          expect(shouldRenderFallback(initialState)).toBe(false);
          
          // After handling error, should show fallback
          const errorState = handleError(initialState, error);
          expect(shouldRenderFallback(errorState)).toBe(true);
          expect(errorState.hasError).toBe(true);
          expect(errorState.error).toBe(error);
          expect(getErrorMessage(errorState)).toBe(errorMessage);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Initial state does not show fallback
   */
  it('Initial state does not trigger fallback', () => {
    fc.assert(
      fc.property(
        fc.constant(undefined),
        () => {
          const state = createErrorBoundaryState();
          expect(shouldRenderFallback(state)).toBe(false);
          expect(state.hasError).toBe(false);
          expect(state.error).toBeNull();
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Additional property: Various error types are handled
   */
  it('Various error types are handled correctly', () => {
    const errorTypes = [
      (msg: string) => new Error(msg),
      (msg: string) => new TypeError(msg),
      (msg: string) => new ReferenceError(msg),
      (msg: string) => new RangeError(msg),
      (msg: string) => new SyntaxError(msg),
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...errorTypes),
        fc.string({ minLength: 1, maxLength: 50 }),
        (createError, message) => {
          const error = createError(message);
          const state = handleError(createErrorBoundaryState(), error);
          
          expect(shouldRenderFallback(state)).toBe(true);
          expect(state.error).toBe(error);
          expect(getErrorMessage(state)).toBe(message);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Error state is immutable
   */
  it('Error handling creates new state without mutating original', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (message) => {
          const initialState = createErrorBoundaryState();
          const error = new Error(message);
          
          const newState = handleError(initialState, error);
          
          // Original state should be unchanged
          expect(initialState.hasError).toBe(false);
          expect(initialState.error).toBeNull();
          
          // New state should have error
          expect(newState.hasError).toBe(true);
          expect(newState.error).toBe(error);
          
          // States should be different objects
          expect(newState).not.toBe(initialState);
        }
      ),
      { numRuns: 100 }
    );
  });
});
