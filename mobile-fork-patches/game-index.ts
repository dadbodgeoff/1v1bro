/**
 * Game module barrel export - MOBILE FORK VERSION
 * 
 * This is the updated version for the mobile fork.
 * The 2D GameEngine has been removed, but shared modules are kept.
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

// KEEP: Guest experience used by registration flow
export * from './guest'

// KEEP: Bot behavior (may be useful for 3D arena)
export * from './bot'
