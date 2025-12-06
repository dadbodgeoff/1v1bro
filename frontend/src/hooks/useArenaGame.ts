/**
 * useArenaGame - Re-exports from refactored arena hooks module
 * 
 * This file maintains backwards compatibility.
 * The actual implementation is in ./arena/useArenaGame.ts
 * 
 * Module structure:
 * - arena/useQuizEvents.ts (~100 lines) - Quiz question/answer flow
 * - arena/useCombatEvents.ts (~120 lines) - Combat state sync
 * - arena/useArenaEvents.ts (~170 lines) - Hazards, traps, transport
 * - arena/useInterpolation.ts (~60 lines) - Smooth opponent movement
 * - arena/usePowerUpEvents.ts (~45 lines) - Power-up spawn/collection
 * - arena/useArenaGame.ts (~110 lines) - Main hook composing above
 */

export { useArenaGame } from './arena/useArenaGame'
