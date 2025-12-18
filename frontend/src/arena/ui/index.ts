/**
 * Arena UI Components - Public API
 *
 * Exports UI components for the arena system.
 */

// Debug HUD
export { ArenaDebugHUD, DEFAULT_DEBUG_INFO } from './ArenaDebugHUD';
export type {
  ArenaDebugHUDProps,
  ArenaDebugInfo,
  BotTacticalIntent,
} from './ArenaDebugHUD';

// Overlays
export { ArenaOverlays, ArenaCountdown, ArenaResults } from './ArenaOverlays';
export type { ArenaOverlaysProps } from './ArenaOverlays';
