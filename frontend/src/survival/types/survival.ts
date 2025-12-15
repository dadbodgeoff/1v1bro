/**
 * Survival Mode Type Definitions
 * Enterprise-grade type safety for the endless runner game
 */

// Lane positions
export type Lane = -1 | 0 | 1 // Left, Center, Right

// Player state
export interface PlayerState {
  z: number           // Forward position (negative = further down track)
  x: number           // Lateral position (lane)
  targetLane: Lane    // Lane we're moving toward
  isJumping: boolean
  isSliding: boolean
  lives: number
}

// Game phases
export type GamePhase = 'loading' | 'ready' | 'running' | 'paused' | 'gameover'

// Core game state
export interface SurvivalGameState {
  phase: GamePhase
  distance: number      // Total distance traveled (meters)
  speed: number         // Current speed (units/sec)
  score: number         // Points accumulated
  streak: number        // Correct answer streak
  player: PlayerState
}

// Obstacle types
export type ObstacleType = 
  | 'highBarrier'    // Slide under (elevated barrier)
  | 'lowBarrier'     // Jump over (ground obstacle)
  | 'laneBarrier'    // Dodge left/right
  | 'knowledgeGate'  // Trivia trigger
  | 'gap'            // Jump over gap
  | 'spikes'         // Jump over (ground spikes)

// Spawned obstacle instance
export interface Obstacle {
  id: string
  type: ObstacleType
  z: number           // Position on track
  lane: Lane          // Which lane (-1, 0, 1)
  mesh: import('three').Group   // Three.js mesh reference
  triggered?: boolean // For knowledge gates
}

// Track tile instance
export interface TrackTile {
  id: string
  z: number
  mesh: import('three').Group
}

// Asset URLs
export interface SurvivalAssets {
  track: {
    longTile: string
    flatTile: string
    narrowBridge: string
    gapped: string
    icyTile?: string
  }
  obstacles: {
    highBarrier: string
    lowBarrier: string
    laneBarrier: string
    sidewall: string
    knowledgeGate: string
    spikes: string
  }
  character: {
    runner: {
      run: string
      jump: string
      down: string
    }
  }
  celestials?: {
    planetVolcanic: string
    planetIce: string
    planetGasGiant: string
    planetEarthLike: string
    asteroidCluster: string
    spaceSatellite?: string
    icyComet?: string
    // New epic celestials
    spaceWhale?: string
    ringPortal?: string
    crystalFormation?: string
    orbitalDefense?: string
    derelictShip?: string
  }
  environment?: {
    city: string
  }
  collectibles?: {
    gem: string
  }
}

// Input actions
export type InputAction = 
  | 'moveLeft'
  | 'moveRight'
  | 'jump'
  | 'slide'
  | 'pause'
  | 'start'

// Event callbacks
export interface SurvivalCallbacks {
  onDistanceUpdate?: (distance: number) => void
  onSpeedUpdate?: (speed: number) => void
  onLifeLost?: (livesRemaining: number) => void
  onGameOver?: (finalScore: number, distance: number) => void
  onKnowledgeGate?: (gateId: string) => Promise<boolean> // Returns true if answered correctly
  onScoreUpdate?: (score: number) => void
}

// Engine configuration
export interface SurvivalConfig {
  baseSpeed: number
  maxSpeed: number
  speedIncreaseRate: number
  laneWidth: number
  laneSwitchSpeed: number
  trackTileDepth: number
  trackScale: number
  obstacleScale: number
  runnerScale: number
  initialLives: number
  obstacleSpawnDistance: number
  obstacleMinGap: number
}

// Renderer configuration
export interface RendererConfig {
  fov: number
  nearPlane: number
  farPlane: number
  cameraHeight: number
  cameraDistance: number
  backgroundColor: number
  ambientLightIntensity: number
  directionalLightIntensity: number
}

// ============================================
// Combo System Types
// ============================================

// Combo event types
export type ComboEventType = 
  | 'near_miss'      // Passed within 0.5 units
  | 'perfect_dodge'  // Passed within 0.2 units
  | 'collision'      // Hit obstacle, reset combo
  | 'decay'          // Combo decayed over time
  | 'milestone'      // Reached combo milestone (5, 10, 15...)

// Current combo state
export interface ComboState {
  combo: number           // Current combo count
  multiplier: number      // Score multiplier (1 + combo * 0.1)
  lastEventTime: number   // Game time of last combo event
  decayTimer: number      // Time since last near-miss/perfect dodge
}

// Combo change event
export interface ComboEvent {
  type: ComboEventType
  combo: number
  multiplier: number
  position?: { x: number; z: number }  // World position of triggering obstacle
  milestone?: number                    // Milestone value if type is 'milestone'
}

// ============================================
// Death System Types
// ============================================

// Context captured at moment of death
export interface DeathContext {
  position: { x: number; z: number }
  obstacleType: ObstacleType
  obstacleId: string
  speed: number
  distance: number
  wasJumping: boolean
  wasSliding: boolean
  currentLane: Lane
  comboAtDeath: number
  patternId?: string      // Obstacle pattern that killed player
}

// Slow-mo configuration
export interface SlowMoConfig {
  timeScale: number       // 0.2 = 20% speed
  duration: number        // 1.5 seconds
  cameraZoomFactor: number // 1.5 = 50% zoom in
}

// Death sequence phase
export type DeathPhase = 'none' | 'slow_mo' | 'camera_zoom' | 'fade_out' | 'complete'

// ============================================
// Input Recording Types
// ============================================

// Compact input event for recording
export interface InputEvent {
  t: number      // Timestamp (game time in ms, delta-encoded)
  i: number      // Input type enum (0=left, 1=right, 2=jump, 3=slide, 4=position)
  p?: number     // Position z (optional, for validation)
  l?: number     // Lane (-1, 0, 1) for ghost X position
  y?: number     // Y position for accurate jump rendering
}

// Input type enum for compact encoding
export const INPUT_TYPE = {
  MOVE_LEFT: 0,
  MOVE_RIGHT: 1,
  JUMP: 2,
  SLIDE: 3,
  POSITION: 4,   // Position snapshot for smooth ghost interpolation
} as const

export type InputTypeValue = typeof INPUT_TYPE[keyof typeof INPUT_TYPE]

// Complete input recording for a run
export interface InputRecording {
  version: number         // Schema version for forward compatibility
  seed: number            // Random seed for obstacle generation
  startTime: number       // Unix timestamp when run started
  duration: number        // Total duration in ms
  events: InputEvent[]    // Recorded input events
}

// ============================================
// Ghost Replay Types
// ============================================

// Ghost visual state
export interface GhostState {
  active: boolean
  currentEventIndex: number
  position: { x: number; z: number }  // x = lane (-1, 0, 1), z = track position
  y?: number              // Y position for accurate jump rendering
  opacity: number         // 0-1, fades out at end
  tint: number            // Color hex (0x00ffff = cyan)
  isJumping: boolean
  isSliding: boolean
}

// ============================================
// Run Data Types (for API submission)
// ============================================

// Complete run data to submit to backend
export interface SurvivalRunData {
  // Core metrics
  distance: number
  score: number
  durationSeconds: number
  maxSpeed: number
  
  // Combo stats
  maxCombo: number
  totalNearMisses: number
  perfectDodges: number
  obstaclesCleared: number
  
  // Death info
  deathObstacleType?: string
  deathPosition?: { x: number; z: number }
  deathDistance?: number
  
  // Replay data
  seed: number
  ghostData?: string      // Serialized InputRecording
}

// Leaderboard entry from backend
export interface LeaderboardEntry {
  rank: number
  userId: string
  displayName: string
  avatarUrl?: string
  bestDistance: number
  bestScore: number
  bestCombo: number
}

// ============================================
// Collectible System Types
// ============================================

// Collectible types
export type CollectibleType = 'gem'

// Spawned collectible instance
export interface Collectible {
  id: string
  type: CollectibleType
  z: number           // Position on track
  lane: Lane          // Which lane (-1, 0, 1)
  y: number           // Height (for floating effect)
  mesh: import('three').Group
  collected: boolean
  value: number       // Score value
}

// Collectible spawn request
export interface CollectibleSpawnRequest {
  type: CollectibleType
  lane: Lane
  z: number
  y?: number          // Optional height offset
  patternId?: string  // Pattern this belongs to
}

// Collectible pattern (line, arc, zigzag, etc.)
export interface CollectiblePattern {
  id: string
  name: string
  placements: Array<{
    lane: Lane
    offsetZ: number
    y?: number
  }>
  length: number      // Total Z length of pattern
}

// ============================================
// Milestone System Types
// ============================================

// Milestone event data
export interface MilestoneEventData {
  distance: number
  isMajor: boolean
  timestamp: number
}

// ============================================
// Achievement System Types
// ============================================

export type AchievementCategory = 'distance' | 'combo' | 'speed' | 'survival' | 'special'
export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export interface AchievementData {
  id: string
  name: string
  description: string
  category: AchievementCategory
  icon: string
  rarity: AchievementRarity
}

export interface UnlockedAchievementData {
  achievement: AchievementData
  unlockedAt: number
  value: number
}
