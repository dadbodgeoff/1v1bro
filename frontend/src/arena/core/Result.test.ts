import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  Result,
  Ok,
  Err,
  isOk,
  isErr,
  unwrap,
  unwrapOr,
  unwrapErr,
  map,
  mapErr,
  flatMap,
  combine,
  combineAll,
  tryCatch,
} from './Result';

describe('Result', () => {
  describe('constructors', () => {
    it('Ok creates a successful result', () => {
      const result = Ok(42);
      expect(result.ok).toBe(true);
      expect(result.value).toBe(42);
    });

    it('Err creates a failed result', () => {
      const result = Err('error message');
      expect(result.ok).toBe(false);
      expect(result.error).toBe('error message');
    });
  });

  describe('type guards', () => {
    it('isOk returns true for Ok', () => {
      expect(isOk(Ok(1))).toBe(true);
      expect(isOk(Err('e'))).toBe(false);
    });

    it('isErr returns true for Err', () => {
      expect(isErr(Err('e'))).toBe(true);
      expect(isErr(Ok(1))).toBe(false);
    });
  });

  describe('unwrap', () => {
    it('unwrap returns value for Ok', () => {
      expect(unwrap(Ok(42))).toBe(42);
    });

    it('unwrap throws for Err', () => {
      expect(() => unwrap(Err('error'))).toThrow('Unwrap called on Err');
    });

    it('unwrapOr returns value for Ok', () => {
      expect(unwrapOr(Ok(42), 0)).toBe(42);
    });

    it('unwrapOr returns default for Err', () => {
      expect(unwrapOr(Err('error'), 0)).toBe(0);
    });

    it('unwrapErr returns error for Err', () => {
      expect(unwrapErr(Err('error'))).toBe('error');
    });

    it('unwrapErr throws for Ok', () => {
      expect(() => unwrapErr(Ok(42))).toThrow('UnwrapErr called on Ok');
    });
  });

  /**
   * Property Tests for Result Type
   * **Feature: arena-3d-physics-multiplayer, Property: map(Ok(x), f) === Ok(f(x))**
   * **Validates: Requirements 25.2**
   */
  describe('property tests', () => {
    it('map(Ok(x), f) === Ok(f(x)) - map preserves function application', () => {
      fc.assert(
        fc.property(fc.integer(), fc.func(fc.integer()), (x, f) => {
          const result = map(Ok(x), f);
          expect(isOk(result)).toBe(true);
          if (isOk(result)) {
            expect(result.value).toBe(f(x));
          }
        }),
        { numRuns: 100 }
      );
    });

    it('map on Err returns Err unchanged', () => {
      fc.assert(
        fc.property(fc.string(), fc.func(fc.integer()), (error, f) => {
          const result = map(Err(error), f);
          expect(isErr(result)).toBe(true);
          if (isErr(result)) {
            expect(result.error).toBe(error);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: arena-3d-physics-multiplayer, Property: flatMap composition is associative**
     * **Validates: Requirements 25.2**
     */
    it('flatMap composition is associative', () => {
      // (m >>= f) >>= g === m >>= (\x -> f x >>= g)
      fc.assert(
        fc.property(fc.integer(), (x) => {
          const m: Result<number, string> = Ok(x);
          const f = (n: number): Result<number, string> => Ok(n * 2);
          const g = (n: number): Result<number, string> => Ok(n + 1);

          // Left side: (m >>= f) >>= g
          const left = flatMap(flatMap(m, f), g);

          // Right side: m >>= (\x -> f x >>= g)
          const right = flatMap(m, (val) => flatMap(f(val), g));

          expect(left).toEqual(right);
        }),
        { numRuns: 100 }
      );
    });

    it('flatMap left identity: flatMap(Ok(x), f) === f(x)', () => {
      fc.assert(
        fc.property(fc.integer(), (x) => {
          const f = (n: number): Result<number, string> => Ok(n * 2);
          const left = flatMap(Ok(x), f);
          const right = f(x);
          expect(left).toEqual(right);
        }),
        { numRuns: 100 }
      );
    });

    it('flatMap right identity: flatMap(m, Ok) === m', () => {
      fc.assert(
        fc.property(fc.integer(), (x) => {
          const m: Result<number, string> = Ok(x);
          const result = flatMap(m, Ok);
          expect(result).toEqual(m);
        }),
        { numRuns: 100 }
      );
    });

    it('mapErr transforms error while preserving Ok', () => {
      fc.assert(
        fc.property(fc.integer(), fc.func(fc.string()), (x, f) => {
          const okResult = mapErr(Ok(x), f);
          expect(isOk(okResult)).toBe(true);
          if (isOk(okResult)) {
            expect(okResult.value).toBe(x);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('combine returns Ok tuple when both Ok', () => {
      fc.assert(
        fc.property(fc.integer(), fc.string(), (a, b) => {
          const result = combine(Ok(a), Ok(b));
          expect(isOk(result)).toBe(true);
          if (isOk(result)) {
            expect(result.value).toEqual([a, b]);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('combineAll returns Ok array when all Ok', () => {
      fc.assert(
        fc.property(fc.array(fc.integer(), { minLength: 0, maxLength: 10 }), (arr) => {
          const results = arr.map(Ok);
          const combined = combineAll(results);
          expect(isOk(combined)).toBe(true);
          if (isOk(combined)) {
            expect(combined.value).toEqual(arr);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('unit tests for edge cases', () => {
    it('unwrap on Err throws with error details', () => {
      const complexError = { code: 404, message: 'Not found' };
      expect(() => unwrap(Err(complexError))).toThrow(
        'Unwrap called on Err: {"code":404,"message":"Not found"}'
      );
    });

    it('unwrapOr returns default on Err with any error type', () => {
      expect(unwrapOr(Err(null), 'default')).toBe('default');
      expect(unwrapOr(Err(undefined), 'default')).toBe('default');
      expect(unwrapOr(Err({ complex: 'error' }), 'default')).toBe('default');
    });

    it('map with identity function returns equivalent result', () => {
      const identity = <T>(x: T): T => x;
      const okResult = Ok(42);
      const mapped = map(okResult, identity);
      expect(mapped).toEqual(okResult);
    });

    it('flatMap propagates Err from inner function', () => {
      const result = flatMap(Ok(5), (n) =>
        n > 10 ? Ok(n) : Err('too small')
      );
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe('too small');
      }
    });

    it('combine returns first Err when first is Err', () => {
      const result = combine(Err('first error'), Ok(2));
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe('first error');
      }
    });

    it('combine returns second Err when second is Err', () => {
      const result = combine(Ok(1), Err('second error'));
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe('second error');
      }
    });

    it('combineAll returns first Err in array', () => {
      const results: Result<number, string>[] = [
        Ok(1),
        Err('first error'),
        Ok(3),
        Err('second error'),
      ];
      const combined = combineAll(results);
      expect(isErr(combined)).toBe(true);
      if (isErr(combined)) {
        expect(combined.error).toBe('first error');
      }
    });

    it('combineAll handles empty array', () => {
      const combined = combineAll<number, string>([]);
      expect(isOk(combined)).toBe(true);
      if (isOk(combined)) {
        expect(combined.value).toEqual([]);
      }
    });

    it('tryCatch wraps successful execution in Ok', () => {
      const result = tryCatch(
        () => 42,
        (e) => String(e)
      );
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe(42);
      }
    });

    it('tryCatch wraps thrown error in Err', () => {
      const result = tryCatch(
        () => {
          throw new Error('test error');
        },
        (e) => (e instanceof Error ? e.message : 'unknown')
      );
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe('test error');
      }
    });

    it('tryCatch handles non-Error throws', () => {
      const result = tryCatch(
        () => {
          throw 'string error';
        },
        (e) => String(e)
      );
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe('string error');
      }
    });
  });
});
