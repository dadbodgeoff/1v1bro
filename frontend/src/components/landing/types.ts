/**
 * Landing page type definitions
 * Defines all interfaces and types for the 2025 landing page
 */

// Section identifiers
export type SectionId = 'hero' | 'demo' | 'features' | 'stats' | 'tech' | 'footer'

// Landing page state
export interface LandingState {
  isLoading: boolean
  loadProgress: number
  activeSection: SectionId
  demoState: DemoState
  stats: LandingStats | null
  reducedMotion: boolean
}

// Demo game state
export interface DemoState {
  status: DemoStatus
  timeRemaining: number        // Seconds remaining (60 max)
  playerHealth: number
  botHealth: number
  playerScore: number
  botScore: number
  result: DemoResult | null
}

export type DemoStatus = 'idle' | 'ready' | 'playing' | 'paused' | 'ended'
export type DemoResult = 'win' | 'lose' | 'draw'

// Stats from API
export interface LandingStats {
  totalGames: number
  activePlayers: number
  questionsAnswered: number
  avgMatchDuration: number     // Seconds
  recentMatches: RecentMatch[]
  lastUpdated: Date
}

export interface RecentMatch {
  id: string
  winner: string
  loser: string
  winnerAvatar?: string
  loserAvatar?: string
  timestamp: Date
}

// Feature card configuration
export interface FeatureConfig {
  id: string
  title: string
  description: string
  icon: string                 // SVG path or component name
  animation: FeatureAnimation
}

export type FeatureAnimation = 
  | { type: 'combat'; config: CombatAnimationConfig }
  | { type: 'trivia'; config: TriviaAnimationConfig }
  | { type: 'arena'; config: ArenaAnimationConfig }
  | { type: 'competitive'; config: CompetitiveAnimationConfig }

export interface CombatAnimationConfig {
  projectileSpeed: number
  damageAmount: number
  cycleTime: number
}

export interface TriviaAnimationConfig {
  question: string
  options: string[]
  correctIndex: number
  cycleTime: number
}

export interface ArenaAnimationConfig {
  mapScale: number
  playerPaths: Vector2[][]
  cycleTime: number
}

export interface CompetitiveAnimationConfig {
  leaderboardEntries: LeaderboardEntry[]
  cycleTime: number
}

export interface LeaderboardEntry {
  rank: number
  name: string
  elo: number
}

export interface Vector2 {
  x: number
  y: number
}

// Scroll animation state
export interface ScrollAnimationState {
  isVisible: boolean
  progress: number             // 0-1 based on scroll position
  hasAnimated: boolean
}

// CTA configuration
export interface CTAConfig {
  text: string
  href: string
  variant: 'primary' | 'secondary'
  analytics: {
    location: string
    action: string
  }
}

// Input events for demo game
export interface DemoInputEvent {
  type: 'move' | 'shoot' | 'powerup'
  direction?: Vector2
  position?: Vector2
}

// Animation configuration
export interface AnimationConfig {
  hero: HeroAnimationConfig
  scroll: ScrollAnimationConfig
  features: FeatureAnimationSettings
  stats: StatsAnimationConfig
  tech: TechAnimationConfig
  reducedMotion: ReducedMotionConfig
}

export interface HeroAnimationConfig {
  logoRevealDuration: number
  taglineFadeDelay: number
  ctaPulseFrequency: number
  particleBurstCount: number
  parallaxFactor: number
}

export interface ScrollAnimationConfig {
  triggerThreshold: number
  staggerDelay: number
  revealDuration: number
  resetOnExit: boolean
}

export interface FeatureAnimationSettings {
  slideDistance: number
  iconDrawDuration: number
  titleFadeDelay: number
  descriptionFadeDelay: number
  animationCycleTime: number
}

export interface StatsAnimationConfig {
  countDuration: number
  easing: string
  updateInterval: number
}

export interface TechAnimationConfig {
  packetFlowSpeed: number
  nodePulseDuration: number
  cycleTime: number
}

export interface ReducedMotionConfig {
  instantReveal: boolean
  staticBackgrounds: boolean
  noParticles: boolean
  singleAnimationCycle: boolean
}

// Tech badge configuration
export interface TechBadge {
  name: string
  version?: string
  description: string
  badge: string
  icon: string
}

// Props interfaces for components
export interface HeroSectionProps {
  reducedMotion: boolean
  onCTAClick: () => void
  isAuthenticated: boolean
}

export interface LiveDemoProps {
  reducedMotion: boolean
  onComplete: (result: DemoResult) => void
}

export interface FeatureShowcaseProps {
  reducedMotion: boolean
}

export interface StatsSectionProps {
  stats: LandingStats | null
  isLoading: boolean
  reducedMotion: boolean
}

export interface TechShowcaseProps {
  reducedMotion: boolean
}

export interface FooterCTAProps {
  onCTAClick: () => void
  playerCount?: number
  isAuthenticated: boolean
}

export interface MobileControlsProps {
  onInput: (event: DemoInputEvent) => void
}

export interface LoadingScreenProps {
  progress: number
}
