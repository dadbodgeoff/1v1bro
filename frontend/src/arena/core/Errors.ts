/**
 * Arena Error Types
 * 
 * Explicit error types for all arena subsystems.
 * Used with Result<T, E> pattern for type-safe error handling.
 * 
 * @module core/Errors
 */

// ============================================================================
// Base Error Types
// ============================================================================

export interface ArenaError {
  readonly code: string;
  readonly message: string;
  readonly timestamp: number;
  readonly context?: Record<string, unknown>;
}

// ============================================================================
// Physics Errors
// ============================================================================

export type PhysicsErrorCode =
  | 'INVALID_POSITION'
  | 'COLLISION_RESOLUTION_FAILED'
  | 'INVALID_VELOCITY'
  | 'MANIFEST_LOAD_FAILED'
  | 'RAYCAST_FAILED';

export interface PhysicsError extends ArenaError {
  readonly type: 'physics';
  readonly code: PhysicsErrorCode;
}

export function createPhysicsError(
  code: PhysicsErrorCode,
  message: string,
  context?: Record<string, unknown>
): PhysicsError {
  return {
    type: 'physics',
    code,
    message,
    timestamp: Date.now(),
    context
  };
}

// ============================================================================
// Network Errors
// ============================================================================

export type NetworkErrorCode =
  | 'CONNECTION_FAILED'
  | 'CONNECTION_LOST'
  | 'SEND_FAILED'
  | 'TIMEOUT'
  | 'INVALID_MESSAGE'
  | 'PROTOCOL_MISMATCH'
  | 'CLOCK_SYNC_FAILED';

export interface NetworkError extends ArenaError {
  readonly type: 'network';
  readonly code: NetworkErrorCode;
}

export function createNetworkError(
  code: NetworkErrorCode,
  message: string,
  context?: Record<string, unknown>
): NetworkError {
  return {
    type: 'network',
    code,
    message,
    timestamp: Date.now(),
    context
  };
}

// ============================================================================
// Validation Errors
// ============================================================================

export type ValidationErrorCode =
  | 'INVALID_INPUT'
  | 'SPEED_VIOLATION'
  | 'JUMP_VIOLATION'
  | 'FIRE_RATE_VIOLATION'
  | 'TIMESTAMP_VIOLATION'
  | 'PLAYER_NOT_FOUND'
  | 'INVALID_STATE';

export interface ValidationError extends ArenaError {
  readonly type: 'validation';
  readonly code: ValidationErrorCode;
  readonly playerId?: number;
}

export function createValidationError(
  code: ValidationErrorCode,
  message: string,
  playerId?: number,
  context?: Record<string, unknown>
): ValidationError {
  return {
    type: 'validation',
    code,
    message,
    timestamp: Date.now(),
    playerId,
    context
  };
}

// ============================================================================
// Game Errors
// ============================================================================

export type GameErrorCode =
  | 'MATCH_NOT_FOUND'
  | 'PLAYER_ALREADY_EXISTS'
  | 'PLAYER_NOT_IN_MATCH'
  | 'INVALID_MATCH_STATE'
  | 'SPAWN_FAILED'
  | 'COMBAT_ERROR'
  | 'TICK_PROCESSING_FAILED';

export interface GameError extends ArenaError {
  readonly type: 'game';
  readonly code: GameErrorCode;
  readonly matchId?: string;
}

export function createGameError(
  code: GameErrorCode,
  message: string,
  matchId?: string,
  context?: Record<string, unknown>
): GameError {
  return {
    type: 'game',
    code,
    message,
    timestamp: Date.now(),
    matchId,
    context
  };
}

// ============================================================================
// Serialization Errors
// ============================================================================

export type SerializationErrorCode =
  | 'BUFFER_TOO_SMALL'
  | 'INVALID_MESSAGE_TYPE'
  | 'INVALID_FIELD_VALUE'
  | 'SCHEMA_MISMATCH'
  | 'DESERIALIZATION_FAILED';

export interface SerializationError extends ArenaError {
  readonly type: 'serialization';
  readonly code: SerializationErrorCode;
  readonly expectedSize?: number;
  readonly actualSize?: number;
}

export function createSerializationError(
  code: SerializationErrorCode,
  message: string,
  context?: Record<string, unknown>
): SerializationError {
  return {
    type: 'serialization',
    code,
    message,
    timestamp: Date.now(),
    context
  };
}

// ============================================================================
// Initialization Errors
// ============================================================================

export type InitializationErrorCode =
  | 'SYSTEM_INIT_FAILED'
  | 'DEPENDENCY_MISSING'
  | 'CONFIG_INVALID'
  | 'ASSET_LOAD_FAILED'
  | 'AUDIO_INIT_FAILED';

export interface InitializationError extends ArenaError {
  readonly type: 'initialization';
  readonly code: InitializationErrorCode;
  readonly systemName?: string;
}

export function createInitializationError(
  code: InitializationErrorCode,
  message: string,
  systemName?: string,
  context?: Record<string, unknown>
): InitializationError {
  return {
    type: 'initialization',
    code,
    message,
    timestamp: Date.now(),
    systemName,
    context
  };
}

// ============================================================================
// Union Type
// ============================================================================

export type AnyArenaError =
  | PhysicsError
  | NetworkError
  | ValidationError
  | GameError
  | SerializationError
  | InitializationError;

// ============================================================================
// Error Utilities
// ============================================================================

/**
 * Check if an error is of a specific type
 */
export function isPhysicsError(error: AnyArenaError): error is PhysicsError {
  return error.type === 'physics';
}

export function isNetworkError(error: AnyArenaError): error is NetworkError {
  return error.type === 'network';
}

export function isValidationError(error: AnyArenaError): error is ValidationError {
  return error.type === 'validation';
}

export function isGameError(error: AnyArenaError): error is GameError {
  return error.type === 'game';
}

export function isSerializationError(error: AnyArenaError): error is SerializationError {
  return error.type === 'serialization';
}

export function isInitializationError(error: AnyArenaError): error is InitializationError {
  return error.type === 'initialization';
}

/**
 * Format error for logging
 */
export function formatError(error: AnyArenaError): string {
  const parts = [
    `[${error.type.toUpperCase()}]`,
    `${error.code}:`,
    error.message
  ];
  
  if (error.context) {
    parts.push(`Context: ${JSON.stringify(error.context)}`);
  }
  
  return parts.join(' ');
}

/**
 * Check if error is recoverable
 */
export function isRecoverableError(error: AnyArenaError): boolean {
  // Network errors are generally recoverable
  if (isNetworkError(error)) {
    return error.code !== 'PROTOCOL_MISMATCH';
  }
  
  // Validation errors are recoverable (just reject the input)
  if (isValidationError(error)) {
    return true;
  }
  
  // Serialization errors might be recoverable
  if (isSerializationError(error)) {
    return error.code !== 'SCHEMA_MISMATCH';
  }
  
  // Game errors depend on the specific error
  if (isGameError(error)) {
    return error.code !== 'TICK_PROCESSING_FAILED';
  }
  
  // Physics and initialization errors are generally not recoverable
  return false;
}
