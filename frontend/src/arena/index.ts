/**
 * Arena module barrel export
 */

export { ArenaScene } from './ArenaScene'
export { ARENA_CONFIG } from './config/ArenaConfig'
export type { ArenaConfig } from './config/ArenaConfig'

// Re-export rendering utilities
export * from './rendering'

// Re-export player/character system
export * from './player'

// Re-export config (quality, device, mobile)
export * from './config'

// Re-export core (viewport manager)
export * from './core'

// Re-export mobile optimization hook
export {
  useMobileOptimization,
  useResponsiveValue,
  useTouchBehavior,
  useQualityFeatures,
  useArenaMobileBalance,
  type MobileOptimizationState,
  type MobileOptimizationActions,
} from './hooks/useMobileOptimization'

// Re-export touch controller
export {
  TouchController,
  type ArenaInputAction,
  type GestureType,
  type GestureEvent,
  type JoystickState,
  type AimState,
} from './engine/TouchController'
