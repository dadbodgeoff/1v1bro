/**
 * Survival Mode - Public API
 * Clean exports for the endless runner game
 */

// Engine
export { SurvivalEngine } from './engine/SurvivalEngine'
export type { RunnerSkinConfig } from './engine/SurvivalEngine'
export { TrackManager } from './engine/TrackManager'
export { ObstacleManager } from './engine/ObstacleManager'
export { InputController } from './engine/InputController'
export { PhysicsController } from './engine/PhysicsController'
export { CollisionSystem } from './engine/CollisionSystem'
export { GameLoop } from './engine/GameLoop'
export { InputBuffer } from './engine/InputBuffer'
export { CameraController } from './engine/CameraController'
export { PlayerController } from './engine/PlayerController'
export { PerformanceMonitor } from './engine/PerformanceMonitor'

// Engine - Enterprise subsystems
export { GameStateManager } from './engine/GameStateManager'
export { PlayerManager } from './engine/PlayerManager'
export { CollisionHandler } from './engine/CollisionHandler'
export { FixedUpdateLoop } from './engine/FixedUpdateLoop'
export { RenderUpdateLoop } from './engine/RenderUpdateLoop'
export { InitializationManager } from './engine/InitializationManager'
export { RunManager } from './engine/RunManager'
export { GhostManager } from './engine/GhostManager'
export type { GamePhase as GameStatePhase, GameStateConfig } from './engine/GameStateManager'
export type { FixedUpdateDeps } from './engine/FixedUpdateLoop'
export type { RenderUpdateDeps } from './engine/RenderUpdateLoop'
export type { InitializationDeps, InitializationCallbacks } from './engine/InitializationManager'
export type { RunManagerDeps, RunManagerCallbacks } from './engine/RunManager'
export type { GhostManagerDeps } from './engine/GhostManager'
export type { CollisionHandlerDeps } from './engine/CollisionHandler'

// Renderer
export { SurvivalRenderer } from './renderer/SurvivalRenderer'
export { AssetLoader } from './renderer/AssetLoader'

// Core (Resource & Lifecycle Management)
export { ResourceManager, LifecycleManager, LoadingManager } from './core'
export type { ResourceStats, LoadingProgress, LifecycleState, LoadingPhase, LoadingState } from './core'

// Components
export { SurvivalErrorBoundary, SurvivalLoadingScreen } from './components'
export { TransitionOverlay, useTransitionOverlay } from './components/TransitionOverlay'
export { LeaderboardWidget, GameOverLeaderboard } from './components/LeaderboardWidget'
export { SurvivalRankWidget, SurvivalRankWidgetCompact } from './components/SurvivalRankWidget'

// Effects
export { TransitionSystem } from './effects/TransitionSystem'
export type { TransitionPhase, CountdownValue, TransitionConfig, TransitionCallbacks } from './effects/TransitionSystem'

// Systems
export { ComboSystem } from './systems/ComboSystem'
export { InputRecorder } from './systems/InputRecorder'
export { GhostReplay } from './systems/GhostReplay'
export { MilestoneSystem } from './systems/MilestoneSystem'
export { AchievementSystem } from './systems/AchievementSystem'
export { TriviaBillboardSubsystem } from './systems/TriviaBillboardSubsystem'
export type { MilestoneEvent, MilestoneConfig, MilestoneCallback } from './systems/MilestoneSystem'
export type { Achievement, UnlockedAchievement, AchievementCallback } from './systems/AchievementSystem'
export type { TriviaBillboardSubsystemConfig, TriviaScoreEvent, TriviaTimeoutEvent } from './systems/TriviaBillboardSubsystem'

// Services
export { survivalApi, SurvivalApiService } from './services/SurvivalApiService'
export { leaderboardService, LeaderboardService } from './services/LeaderboardService'
export type { 
  LeaderboardData, 
  LeaderboardStats, 
  ConnectionState,
  LeaderboardServiceConfig,
  LeaderboardEntry as LeaderboardServiceEntry,
} from './services/LeaderboardService'

// World (Environmental elements)
export { TriviaBillboard, TriviaBillboardManager, TriviaQuestionProvider } from './world'
export type {
  TriviaQuestion,
  TriviaBillboardConfig,
  TriviaBillboardManagerConfig,
  BillboardCallbacks,
  TriviaCategory,
  TriviaQuestionProviderConfig,
} from './world'

// Hooks
export { useSurvivalGame } from './hooks/useSurvivalGame'
export type { RunnerSkinConfig as HookRunnerSkinConfig } from './hooks/useSurvivalGame'
export { useSurvivalGameWithAnalytics } from './hooks/useSurvivalGameWithAnalytics'
export { useSurvivalAnalytics } from './hooks/useSurvivalAnalytics'
export { useTriviaBillboards } from './hooks/useTriviaBillboards'
export { useLeaderboard, usePlayerRank, useTopPlayers } from './hooks/useLeaderboard'
export type { 
  RunAnalytics, 
  InputAnalytics, 
  ComboAnalytics, 
  FunnelEvent,
  TriviaAnalytics,
  MilestoneAnalytics,
  ShopAnalytics,
  LeaderboardAnalytics,
  BattlePassAnalytics,
  AuthAnalytics,
} from './hooks/useSurvivalAnalytics'
export type { UseTriviaBillboardsOptions, UseTriviaBillboardsReturn } from './hooks/useTriviaBillboards'
export type { UseLeaderboardOptions, UseLeaderboardReturn } from './hooks/useLeaderboard'

// Config - Core constants
export { SURVIVAL_ASSETS, SURVIVAL_CONFIG, RENDERER_CONFIG, COLORS, KEY_BINDINGS } from './config/constants'
export { getSurvivalConfig, getRendererConfig } from './config/constants'

// Config - Device detection
export {
  getDeviceCapabilities,
  refreshDeviceCapabilities,
  onDeviceCapabilitiesChange,
  isMobileDevice,
  isTouchDevice,
  getPerformanceTier,
  shouldReduceMotion,
  BREAKPOINTS,
} from './config/device'
export type {
  DeviceCapabilities,
  DeviceType,
  PerformanceTier,
  InputMode,
  SafeAreaInsets,
} from './config/device'

// Config - Quality settings
export {
  getQualityProfile,
  setQualityTier,
  setQualityOverrides,
  recordFPSForQuality,
  onQualityChange,
  setAutoQualityAdjust,
  QUALITY_PRESETS,
} from './config/quality'
export type {
  QualityProfile,
  RendererQuality,
  ParticleQuality,
  SpaceQuality,
  PhysicsQuality,
  AnimationQuality,
  AudioQuality,
} from './config/quality'

// Config - Mobile optimization
export {
  getMobileConfig,
  refreshMobileConfig,
  setMobileConfigOverrides,
  onMobileConfigChange,
  getResponsiveValue,
  getTouchZonePixels,
  isInTouchZone,
} from './config/mobile'
export type {
  MobileConfig,
  TouchZoneConfig,
  UIScaleConfig,
  MobileBalanceConfig,
} from './config/mobile'

// Engine - Touch controller
export { TouchController } from './engine/TouchController'
export type { GestureType, GestureEvent } from './engine/TouchController'

// Core - Viewport management
export {
  getViewportManager,
  getViewportState,
  requestFullscreen,
  exitFullscreen,
  requestWakeLock,
  releaseWakeLock,
} from './core/ViewportManager'
export type { ViewportState, ViewportCallbacks } from './core/ViewportManager'

// Hooks - Mobile optimization
export {
  useMobileOptimization,
  useResponsiveValue,
  useTouchBehavior,
  useQualityFeatures,
} from './hooks/useMobileOptimization'
export type {
  MobileOptimizationState,
  MobileOptimizationActions,
} from './hooks/useMobileOptimization'

// Components - Touch controls
export { TouchControlsOverlay } from './components/TouchControlsOverlay'

// Guest session management
export {
  SurvivalGuestSessionManager,
  getSurvivalGuestSession,
  calculateSurvivalPreviewXp,
} from './guest'
export type {
  SurvivalGuestStats,
  SurvivalRunResult,
} from './guest'

// Types
export type {
  SurvivalGameState,
  GamePhase,
  Lane,
  PlayerState,
  Obstacle,
  ObstacleType,
  TrackTile,
  SurvivalCallbacks,
  SurvivalConfig,
  RendererConfig,
  InputAction,
  ComboState,
  ComboEvent,
  ComboEventType,
  InputRecording,
  InputEvent,
  GhostState,
  SurvivalRunData,
  LeaderboardEntry,
} from './types/survival'
