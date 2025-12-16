/**
 * Survival Mode Core - Resource and lifecycle management
 */

export { ResourceManager } from './ResourceManager'
export { LifecycleManager } from './LifecycleManager'
export { LoadingManager } from './LoadingManager'
export { LoadingOrchestrator, getLoadingOrchestrator, resetLoadingOrchestrator } from './LoadingOrchestrator'
export { GameEventBus, getEventBus, resetEventBus } from './GameEventBus'
export { wireEvents, wireCollisionSystem } from './EventWiring'

export type { ResourceStats, LoadingProgress as ResourceLoadingProgress } from './ResourceManager'
export type { LifecycleState, LifecycleCallbacks } from './LifecycleManager'
export type { LoadingPhase, LoadingState, LoadingCallbacks } from './LoadingManager'
export type { LoadingStage, LoadingProgress, SubsystemStatus, LoadingOrchestratorCallbacks } from './LoadingOrchestrator'
export type { GameEvents } from './GameEventBus'
export type { EventWiringDeps } from './EventWiring'
