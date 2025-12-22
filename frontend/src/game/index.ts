/**
 * Game module barrel export - MOBILE APP VERSION
 * 
 * The 2D GameEngine has been removed for the mobile fork.
 * Shared modules are kept for use by other systems.
 */

// REMOVED: GameEngine (2D canvas engine)
// export { GameEngine } from './GameEngine'
// export type { GameEngineCallbacks } from './GameEngine'

// KEEP: Shared types used by other systems
export * from './types'

// KEEP: Config used by matchmaking and other systems
export * from './config'

// KEEP: Asset loading used by useDynamicImage hook
export * from './assets'

// KEEP: Systems used by arena hooks (PositionInterpolator)
export * from './systems'

// REMOVED for mobile-app: guest and bot (2D arena specific)
// export * from './guest'
// export * from './bot'
