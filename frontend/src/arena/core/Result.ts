/**
 * Result Type - Explicit error handling without exceptions
 * 
 * A discriminated union for representing success (Ok) or failure (Err) outcomes.
 * Used throughout the arena system to avoid throwing exceptions in the game loop.
 * 
 * @example
 * const result = validateInput(input);
 * if (isOk(result)) {
 *   processInput(result.value);
 * } else {
 *   logError(result.error);
 * }
 */

export type Result<T, E> = Ok<T> | Err<E>;

export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}

export interface Err<E> {
  readonly ok: false;
  readonly error: E;
}

/**
 * Creates a successful Result containing a value
 */
export const Ok = <T>(value: T): Ok<T> => ({ ok: true, value });

/**
 * Creates a failed Result containing an error
 */
export const Err = <E>(error: E): Err<E> => ({ ok: false, error });

/**
 * Type guard to check if a Result is Ok
 */
export const isOk = <T, E>(result: Result<T, E>): result is Ok<T> => result.ok;

/**
 * Type guard to check if a Result is Err
 */
export const isErr = <T, E>(result: Result<T, E>): result is Err<E> => !result.ok;

/**
 * Extracts the value from an Ok Result, throws if Err
 * @throws Error if result is Err
 */
export const unwrap = <T, E>(result: Result<T, E>): T => {
  if (isOk(result)) return result.value;
  throw new Error(`Unwrap called on Err: ${JSON.stringify(result.error)}`);
};

/**
 * Extracts the value from an Ok Result, returns default if Err
 */
export const unwrapOr = <T, E>(result: Result<T, E>, defaultValue: T): T => {
  return isOk(result) ? result.value : defaultValue;
};

/**
 * Extracts the error from an Err Result, throws if Ok
 * @throws Error if result is Ok
 */
export const unwrapErr = <T, E>(result: Result<T, E>): E => {
  if (isErr(result)) return result.error;
  throw new Error(`UnwrapErr called on Ok: ${JSON.stringify(result.value)}`);
};

/**
 * Transforms the value inside an Ok Result using the provided function
 * If the Result is Err, returns the Err unchanged
 */
export const map = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> => {
  return isOk(result) ? Ok(fn(result.value)) : result;
};

/**
 * Transforms the error inside an Err Result using the provided function
 * If the Result is Ok, returns the Ok unchanged
 */
export const mapErr = <T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> => {
  return isErr(result) ? Err(fn(result.error)) : result;
};

/**
 * Chains Result-returning operations
 * If the Result is Ok, applies fn to the value and returns the new Result
 * If the Result is Err, returns the Err unchanged
 */
export const flatMap = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> => {
  return isOk(result) ? fn(result.value) : result;
};

/**
 * Combines two Results into a single Result containing a tuple
 * Returns Err if either Result is Err (returns first Err encountered)
 */
export const combine = <T1, T2, E>(
  r1: Result<T1, E>,
  r2: Result<T2, E>
): Result<[T1, T2], E> => {
  if (isErr(r1)) return r1;
  if (isErr(r2)) return r2;
  return Ok([r1.value, r2.value]);
};

/**
 * Combines an array of Results into a Result containing an array
 * Returns Err if any Result is Err (returns first Err encountered)
 */
export const combineAll = <T, E>(results: Result<T, E>[]): Result<T[], E> => {
  const values: T[] = [];
  for (const result of results) {
    if (isErr(result)) return result;
    values.push(result.value);
  }
  return Ok(values);
};

/**
 * Executes a function that may throw and wraps the result in a Result type
 */
export const tryCatch = <T, E = Error>(
  fn: () => T,
  onError: (e: unknown) => E
): Result<T, E> => {
  try {
    return Ok(fn());
  } catch (e) {
    return Err(onError(e));
  }
};
