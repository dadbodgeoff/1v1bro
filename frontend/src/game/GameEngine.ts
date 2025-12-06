/**
 * GameEngine - Re-exports from refactored engine module
 * 
 * This file maintains backwards compatibility.
 * The actual implementation is in ./engine/GameEngine.ts
 * 
 * Module structure:
 * - engine/GameLoop.ts (~50 lines) - Game loop, timing
 * - engine/PlayerController.ts (~100 lines) - Movement, physics
 * - engine/RenderPipeline.ts (~120 lines) - Render orchestration
 * - engine/ServerSync.ts (~110 lines) - Server-authoritative updates
 * - engine/GameEngine.ts (~200 lines) - Facade coordinating above
 */

export { GameEngine } from './engine/GameEngine'
export type { GameEngineCallbacks } from './engine/types'
