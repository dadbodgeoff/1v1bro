# 2025 Landing Page - Design Document

## Overview

This document outlines the technical design for creating a revolutionary 2025 landing page for 1v1bro. The implementation delivers an immediate "what the fuck, this is awesome" first impression through cutting-edge web technologies including live game demos, custom SVG animations, scroll-driven animations, and interactive showcases.

The design follows established patterns from the existing codebase:
- **Component Pattern**: React functional components with hooks
- **Store Pattern**: Zustand stores for state management
- **Renderer Pattern**: Canvas-based rendering for game elements
- **Hook Pattern**: Custom hooks for reusable logic

All files remain under 400 lines through careful decomposition into focused, single-responsibility modules.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Landing Page System                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │    Hero     │  │    Demo     │  │  Features   │  │    Stats    │            │
│  │   Section   │  │   Section   │  │   Section   │  │   Section   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘            │
│         │                │                │                │                    │
│  ┌──────┴────────────────┴────────────────┴────────────────┴──────┐            │
│  │                        Landing.tsx                              │            │
│  │  (Main page component, orchestrates sections and scroll state)  │            │
│  └────────────────────────────────────────────────────────────────┘            │
│                                    │                                            │
│         ┌──────────────────────────┼──────────────────────────┐                │
│         │                          │                          │                │
│         ▼                          ▼                          ▼                │
│  ┌─────────────┐           ┌─────────────┐           ┌─────────────┐          │
│  │   Scroll    │           │    Demo     │           │   Stats     │          │
│  │  Animation  │           │    Game     │           │    API      │          │
│  │    Hook     │           │    Hook     │           │   Service   │          │
│  └─────────────┘           └─────────────┘           └─────────────┘          │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
                    ▼                                   ▼
┌─────────────────────────────────────┐   ┌─────────────────────────────────────┐
│         Animation Components         │   │           Game Integration          │
│  ┌───────────┐  ┌───────────┐       │   │  ┌───────────┐  ┌───────────┐      │
│  │   Logo    │  │  Particle │       │   │  │   Game    │  │  Backdrop │      │
│  │  Reveal   │  │   Burst   │       │   │  │  Engine   │  │  Layers   │      │
│  └───────────┘  └───────────┘       │   │  └───────────┘  └───────────┘      │
│  ┌───────────┐  ┌───────────┐       │   │  ┌───────────┐  ┌───────────┐      │
│  │  Number   │  │  Feature  │       │   │  │   Arena   │  │   Bot     │      │
│  │  Counter  │  │   Card    │       │   │  │  Manager  │  │    AI     │      │
│  └───────────┘  └───────────┘       │   │  └───────────┘  └───────────┘      │
└─────────────────────────────────────┘   └─────────────────────────────────────┘
```

## Project Structure

```
frontend/src/
├── pages/
│   └── Landing.tsx                     # Main landing page (<400 lines)
│
├── components/
│   └── landing/
│       ├── index.ts                    # Module exports
│       ├── HeroSection.tsx             # Hero with backdrop (<300 lines)
│       ├── HeroBackground.tsx          # Canvas backdrop renderer (<250 lines)
│       ├── LiveDemo.tsx                # Demo game container (<350 lines)
│       ├── DemoOverlay.tsx             # Demo UI overlays (<150 lines)
│       ├── FeatureShowcase.tsx         # Feature section (<300 lines)
│       ├── FeatureCard.tsx             # Individual feature card (<200 lines)
│       ├── StatsSection.tsx            # Stats display (<200 lines)
│       ├── TechShowcase.tsx            # Tech badges section (<200 lines)
│       ├── FooterCTA.tsx               # Final CTA section (<150 lines)
│       ├── MobileControls.tsx          # Touch controls (<200 lines)
│       ├── LoadingScreen.tsx           # Loading animation (<100 lines)
│       └── StickyMobileCTA.tsx         # Mobile sticky CTA (<100 lines)
│
├── components/landing/animations/
│   ├── index.ts                        # Animation exports
│   ├── LogoReveal.tsx                  # SVG logo animation (<150 lines)
│   ├── ParticleBurst.tsx               # CTA hover particles (<150 lines)
│   ├── NumberCounter.tsx               # Animated counter (<120 lines)
│   ├── NetworkDiagram.tsx              # Tech network viz (<200 lines)
│   └── ScrollReveal.tsx                # Scroll animation wrapper (<100 lines)
│
├── hooks/
│   └── landing/
│       ├── index.ts                    # Hook exports
│       ├── useScrollAnimation.ts       # Intersection Observer (<100 lines)
│       ├── useDemoGame.ts              # Demo game state (<250 lines)
│       ├── useParallax.ts              # Parallax effect (<80 lines)
│       ├── useReducedMotion.ts         # Motion preference (<50 lines)
│       └── useLandingStats.ts          # Stats fetching (<100 lines)
│
├── services/
│   └── landingAPI.ts                   # Landing stats API (<100 lines)
│
└── game/
    └── demo/
        ├── index.ts                    # Demo exports
        ├── DemoGameEngine.ts           # Simplified game engine (<300 lines)
        ├── BotAI.ts                    # Demo bot behavior (<150 lines)
        └── DemoConfig.ts               # Demo configuration (<50 lines)
```


## Data Structures

### Core Types (components/landing/types.ts)

```typescript
// Landing page state types
export interface LandingState {
  isLoading: boolean
  loadProgress: number
  activeSection: SectionId
  demoState: DemoState
  stats: LandingStats | null
  reducedMotion: boolean
}

export type SectionId = 'hero' | 'demo' | 'features' | 'stats' | 'tech' | 'footer'

// Demo game state
export interface DemoState {
  status: 'idle' | 'ready' | 'playing' | 'paused' | 'ended'
  timeRemaining: number        // Seconds remaining (60 max)
  playerHealth: number
  botHealth: number
  playerScore: number
  botScore: number
  result: 'win' | 'lose' | 'draw' | null
}

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
```

### Demo Game Configuration (game/demo/DemoConfig.ts)

```typescript
export const DEMO_CONFIG = {
  // Timing
  duration: 60,                // 60 second demo
  countdownStart: 3,           // 3 second countdown before start
  
  // Player settings
  player: {
    spawnPosition: { x: 160, y: 360 },
    speed: 200,
    health: 100,
    shootCooldown: 500,        // ms
  },
  
  // Bot settings
  bot: {
    spawnPosition: { x: 1120, y: 360 },
    speed: 150,                // Slightly slower than player
    health: 100,
    shootCooldown: 2000,       // Shoots every 2 seconds
    reactionTime: 300,         // ms delay before reacting
    accuracy: 0.7,             // 70% accuracy
  },
  
  // Arena
  arena: {
    width: 1280,
    height: 720,
    map: 'nexus-arena',
  },
  
  // Controls
  controls: {
    desktop: {
      up: ['w', 'ArrowUp'],
      down: ['s', 'ArrowDown'],
      left: ['a', 'ArrowLeft'],
      right: ['d', 'ArrowRight'],
      shoot: ['click', 'Space'],
    },
    mobile: {
      joystickSize: 120,
      buttonSize: 80,
    },
  },
} as const
```

### Animation Configuration (components/landing/animations/config.ts)

```typescript
export const ANIMATION_CONFIG = {
  // Hero section
  hero: {
    logoRevealDuration: 1500,      // ms
    taglineFadeDelay: 500,         // ms after logo
    ctaPulseFrequency: 2000,       // ms per cycle
    particleBurstCount: 10,
    parallaxFactor: 0.3,
  },
  
  // Scroll animations
  scroll: {
    triggerThreshold: 0.2,         // 20% visible to trigger
    staggerDelay: 100,             // ms between staggered items
    revealDuration: 600,           // ms
    resetOnExit: true,
  },
  
  // Feature cards
  features: {
    slideDistance: 100,            // px
    iconDrawDuration: 800,         // ms
    titleFadeDelay: 300,           // ms
    descriptionFadeDelay: 500,     // ms
    animationCycleTime: 3000,      // ms
  },
  
  // Stats counters
  stats: {
    countDuration: 2000,           // ms
    easing: 'easeOutExpo',
    updateInterval: 30000,         // 30 second refresh
  },
  
  // Tech section
  tech: {
    packetFlowSpeed: 100,          // px/s
    nodePulseDuration: 400,        // ms
    cycleTime: 4000,               // ms
  },
  
  // Reduced motion alternatives
  reducedMotion: {
    instantReveal: true,
    staticBackgrounds: true,
    noParticles: true,
    singleAnimationCycle: true,
  },
} as const
```

## Core Components

### Landing Page (pages/Landing.tsx)

```typescript
/**
 * Landing - Main landing page component
 * Orchestrates all sections and manages scroll state
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useReducedMotion } from '@/hooks/landing/useReducedMotion'
import { useLandingStats } from '@/hooks/landing/useLandingStats'
import {
  HeroSection,
  LiveDemo,
  FeatureShowcase,
  StatsSection,
  TechShowcase,
  FooterCTA,
  LoadingScreen,
  StickyMobileCTA,
} from '@/components/landing'
import type { SectionId, LandingState } from '@/components/landing/types'

export function Landing() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const reducedMotion = useReducedMotion()
  const { stats, isLoading: statsLoading } = useLandingStats()
  
  const [state, setState] = useState<LandingState>({
    isLoading: true,
    loadProgress: 0,
    activeSection: 'hero',
    demoState: { status: 'idle', /* ... */ },
    stats: null,
    reducedMotion,
  })
  
  const sectionRefs = useRef<Map<SectionId, HTMLElement>>(new Map())
  
  // Handle initial loading
  useEffect(() => {
    const loadAssets = async () => {
      // Preload critical assets
      setState(s => ({ ...s, loadProgress: 0.3 }))
      
      // Initialize backdrop layers
      setState(s => ({ ...s, loadProgress: 0.6 }))
      
      // Ready
      setState(s => ({ ...s, loadProgress: 1, isLoading: false }))
    }
    
    loadAssets()
  }, [])
  
  // Update stats when loaded
  useEffect(() => {
    if (stats) {
      setState(s => ({ ...s, stats }))
    }
  }, [stats])
  
  // Handle CTA clicks
  const handleCTAClick = (location: string) => {
    // Fire analytics
    trackEvent('cta_click', { location, timeOnPage: getTimeOnPage() })
    
    // Navigate based on auth state
    if (isAuthenticated) {
      navigate('/')
    } else {
      navigate('/register')
    }
  }
  
  // Redirect authenticated users who want dashboard
  const handlePlayNow = () => {
    if (isAuthenticated) {
      navigate('/')
    } else {
      navigate('/register')
    }
  }
  
  if (state.isLoading) {
    return <LoadingScreen progress={state.loadProgress} />
  }
  
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>1v1 Bro - Real-Time PvP Trivia Arena Game</title>
        <meta name="description" content="Challenge players worldwide..." />
        {/* Open Graph, Twitter Cards */}
      </Helmet>
      
      {/* Skip to content for accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only">
        Skip to main content
      </a>
      
      {/* Header with auth-aware CTA */}
      <header className="fixed top-0 w-full z-50 bg-gradient-to-b from-black/80 to-transparent">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <span className="text-xl font-bold text-white">1v1 Bro</span>
          <button
            onClick={handlePlayNow}
            className="px-6 py-2 bg-white text-black rounded-lg font-medium hover:bg-neutral-200 transition"
          >
            {isAuthenticated ? 'Play Now' : 'Sign Up Free'}
          </button>
        </nav>
      </header>
      
      <main id="main-content">
        <HeroSection
          ref={el => sectionRefs.current.set('hero', el!)}
          reducedMotion={reducedMotion}
          onCTAClick={() => handleCTAClick('hero')}
          isAuthenticated={isAuthenticated}
        />
        
        <LiveDemo
          ref={el => sectionRefs.current.set('demo', el!)}
          reducedMotion={reducedMotion}
          onComplete={(result) => {/* handle demo end */}}
        />
        
        <FeatureShowcase
          ref={el => sectionRefs.current.set('features', el!)}
          reducedMotion={reducedMotion}
        />
        
        <StatsSection
          ref={el => sectionRefs.current.set('stats', el!)}
          stats={state.stats}
          isLoading={statsLoading}
          reducedMotion={reducedMotion}
        />
        
        <TechShowcase
          ref={el => sectionRefs.current.set('tech', el!)}
          reducedMotion={reducedMotion}
        />
        
        <FooterCTA
          ref={el => sectionRefs.current.set('footer', el!)}
          onCTAClick={() => handleCTAClick('footer')}
          playerCount={state.stats?.activePlayers}
          isAuthenticated={isAuthenticated}
        />
      </main>
      
      {/* Mobile sticky CTA */}
      <StickyMobileCTA
        onCTAClick={() => handleCTAClick('sticky')}
        isAuthenticated={isAuthenticated}
      />
    </div>
  )
}
```

### Hero Section (components/landing/HeroSection.tsx)

```typescript
/**
 * HeroSection - Full-viewport hero with animated backdrop
 * Reuses existing backdrop layers for visual consistency
 */

import { useRef, useEffect, forwardRef } from 'react'
import { motion } from 'framer-motion'
import { HeroBackground } from './HeroBackground'
import { LogoReveal, ParticleBurst } from './animations'
import { useParallax } from '@/hooks/landing/useParallax'
import { ANIMATION_CONFIG } from './animations/config'

interface HeroSectionProps {
  reducedMotion: boolean
  onCTAClick: () => void
  isAuthenticated: boolean
}

export const HeroSection = forwardRef<HTMLElement, HeroSectionProps>(
  ({ reducedMotion, onCTAClick, isAuthenticated }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const parallaxOffset = useParallax(ANIMATION_CONFIG.hero.parallaxFactor)
    const [isHovering, setIsHovering] = useState(false)
    
    return (
      <section
        ref={ref}
        className="relative h-screen w-full overflow-hidden"
        aria-label="Welcome to 1v1 Bro"
      >
        {/* Animated backdrop canvas */}
        <HeroBackground
          reducedMotion={reducedMotion}
          parallaxOffset={parallaxOffset}
        />
        
        {/* Vignette overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)'
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-6">
          {/* Logo with reveal animation */}
          <LogoReveal
            duration={ANIMATION_CONFIG.hero.logoRevealDuration}
            reducedMotion={reducedMotion}
          />
          
          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: reducedMotion ? 0 : ANIMATION_CONFIG.hero.taglineFadeDelay / 1000,
              duration: reducedMotion ? 0 : 0.6 
            }}
            className="mt-6 text-xl text-neutral-400 text-center max-w-md"
          >
            Real-time PvP Trivia Arena
          </motion.p>
          
          {/* Primary CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reducedMotion ? 0 : 1, duration: reducedMotion ? 0 : 0.6 }}
            className="mt-10 relative"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <button
              onClick={onCTAClick}
              className="relative px-10 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-lg font-semibold rounded-xl transition-transform hover:scale-105"
              style={{
                boxShadow: `0 0 ${isHovering ? 40 : 20}px rgba(99, 102, 241, ${isHovering ? 0.6 : 0.4})`
              }}
            >
              {isAuthenticated ? 'Play Now' : 'Play Now - Free'}
            </button>
            
            {/* Particle burst on hover */}
            {isHovering && !reducedMotion && (
              <ParticleBurst count={ANIMATION_CONFIG.hero.particleBurstCount} />
            )}
          </motion.div>
          
          {/* Secondary CTA */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: reducedMotion ? 0 : 1.2 }}
            className="mt-4 text-neutral-500 hover:text-white transition-colors"
            onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Try the demo ↓
          </motion.button>
        </div>
        
        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-3 bg-white/50 rounded-full mt-2"
            />
          </div>
        </motion.div>
      </section>
    )
  }
)
```

### Hero Background (components/landing/HeroBackground.tsx)

```typescript
/**
 * HeroBackground - Canvas-based animated backdrop
 * Reuses existing backdrop layer classes
 */

import { useRef, useEffect } from 'react'
import { DeepSpaceLayer } from '@/game/backdrop/layers/DeepSpaceLayer'
import { HexGridLayer } from '@/game/backdrop/layers/HexGridLayer'
import { StarFieldLayer } from '@/game/backdrop/layers/StarFieldLayer'
import { NebulaLayer } from '@/game/backdrop/layers/NebulaLayer'
import { ShootingStarLayer } from '@/game/backdrop/layers/ShootingStarLayer'
import type { BackdropConfig } from '@/game/backdrop/types'

interface HeroBackgroundProps {
  reducedMotion: boolean
  parallaxOffset: number
}

export function HeroBackground({ reducedMotion, parallaxOffset }: HeroBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const layersRef = useRef<BackdropLayer[]>([])
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    
    // Initialize layers
    const config: BackdropConfig = {
      width: canvas.width,
      height: canvas.height,
    }
    
    layersRef.current = [
      new DeepSpaceLayer(config),
      new HexGridLayer(config),
      new StarFieldLayer({ ...config, starCount: reducedMotion ? 50 : 200 }),
      ...(reducedMotion ? [] : [
        new NebulaLayer({ ...config, cloudCount: 3 }),
        new ShootingStarLayer({ ...config, maxStars: 2 }),
      ]),
    ]
    
    // Animation loop
    let lastTime = performance.now()
    
    const animate = (time: number) => {
      const deltaTime = (time - lastTime) / 1000
      lastTime = time
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Apply parallax transform
      ctx.save()
      ctx.translate(0, parallaxOffset)
      
      // Update and render layers
      for (const layer of layersRef.current) {
        layer.update(deltaTime, time / 1000)
        layer.render(ctx)
      }
      
      ctx.restore()
      
      if (!reducedMotion) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }
    
    if (reducedMotion) {
      // Render once for reduced motion
      animate(performance.now())
    } else {
      animationRef.current = requestAnimationFrame(animate)
    }
    
    return () => {
      window.removeEventListener('resize', resize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [reducedMotion, parallaxOffset])
  
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    />
  )
}
```


### Live Demo (components/landing/LiveDemo.tsx)

```typescript
/**
 * LiveDemo - Embedded playable game demo
 * Uses simplified game engine with bot opponent
 */

import { useRef, useEffect, forwardRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useScrollAnimation } from '@/hooks/landing/useScrollAnimation'
import { useDemoGame } from '@/hooks/landing/useDemoGame'
import { DemoOverlay } from './DemoOverlay'
import { MobileControls } from './MobileControls'
import { DEMO_CONFIG } from '@/game/demo/DemoConfig'

interface LiveDemoProps {
  reducedMotion: boolean
  onComplete: (result: 'win' | 'lose' | 'draw') => void
}

export const LiveDemo = forwardRef<HTMLElement, LiveDemoProps>(
  ({ reducedMotion, onComplete }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const { isVisible } = useScrollAnimation(containerRef, { threshold: 0.5 })
    const isMobile = useMediaQuery('(max-width: 768px)')
    
    const {
      state,
      startDemo,
      pauseDemo,
      resumeDemo,
      resetDemo,
      handleInput,
    } = useDemoGame(canvasRef, {
      onComplete,
      config: DEMO_CONFIG,
    })
    
    // Pause when not visible
    useEffect(() => {
      if (!isVisible && state.status === 'playing') {
        pauseDemo()
      } else if (isVisible && state.status === 'paused') {
        resumeDemo()
      }
    }, [isVisible, state.status])
    
    return (
      <section
        ref={ref}
        id="demo"
        className="relative py-20 bg-gradient-to-b from-[#0a0a0a] to-[#0f0f1a]"
        aria-label="Try the game demo"
      >
        <div className="max-w-5xl mx-auto px-6">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Try It Now
            </h2>
            <p className="text-neutral-400 max-w-lg mx-auto">
              Experience the gameplay instantly. No signup required.
            </p>
          </motion.div>
          
          {/* Game container */}
          <div
            ref={containerRef}
            className="relative aspect-video max-w-4xl mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
          >
            {/* Game canvas */}
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              tabIndex={0}
              aria-label="Game demo canvas"
            />
            
            {/* Overlays based on state */}
            <AnimatePresence>
              {state.status === 'idle' && (
                <DemoOverlay
                  type="start"
                  onAction={startDemo}
                  isMobile={isMobile}
                />
              )}
              
              {state.status === 'playing' && (
                <DemoOverlay
                  type="hud"
                  timeRemaining={state.timeRemaining}
                  playerHealth={state.playerHealth}
                  botHealth={state.botHealth}
                />
              )}
              
              {state.status === 'ended' && (
                <DemoOverlay
                  type="results"
                  result={state.result}
                  playerScore={state.playerScore}
                  botScore={state.botScore}
                  onReplay={resetDemo}
                  onSignUp={() => {/* navigate to register */}}
                />
              )}
            </AnimatePresence>
            
            {/* Mobile touch controls */}
            {isMobile && state.status === 'playing' && (
              <MobileControls onInput={handleInput} />
            )}
          </div>
          
          {/* Control hints */}
          {!isMobile && state.status === 'playing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 flex justify-center gap-8 text-sm text-neutral-500"
            >
              <span>WASD to move</span>
              <span>Click to shoot</span>
              <span>Space for power-up</span>
            </motion.div>
          )}
        </div>
      </section>
    )
  }
)
```

### Demo Game Hook (hooks/landing/useDemoGame.ts)

```typescript
/**
 * useDemoGame - Manages demo game state and engine
 */

import { useRef, useEffect, useCallback, useState } from 'react'
import { DemoGameEngine } from '@/game/demo/DemoGameEngine'
import { BotAI } from '@/game/demo/BotAI'
import type { DemoState } from '@/components/landing/types'
import type { DemoConfig } from '@/game/demo/DemoConfig'

interface UseDemoGameOptions {
  onComplete: (result: 'win' | 'lose' | 'draw') => void
  config: DemoConfig
}

export function useDemoGame(
  canvasRef: RefObject<HTMLCanvasElement>,
  options: UseDemoGameOptions
) {
  const engineRef = useRef<DemoGameEngine | null>(null)
  const botRef = useRef<BotAI | null>(null)
  
  const [state, setState] = useState<DemoState>({
    status: 'idle',
    timeRemaining: options.config.duration,
    playerHealth: options.config.player.health,
    botHealth: options.config.bot.health,
    playerScore: 0,
    botScore: 0,
    result: null,
  })
  
  // Initialize engine
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    engineRef.current = new DemoGameEngine(canvas, options.config)
    botRef.current = new BotAI(options.config.bot)
    
    // Set up callbacks
    engineRef.current.setCallbacks({
      onHealthChange: (player, bot) => {
        setState(s => ({ ...s, playerHealth: player, botHealth: bot }))
      },
      onTimeUpdate: (time) => {
        setState(s => ({ ...s, timeRemaining: time }))
      },
      onGameEnd: (result) => {
        setState(s => ({ ...s, status: 'ended', result }))
        options.onComplete(result)
      },
    })
    
    return () => {
      engineRef.current?.destroy()
    }
  }, [canvasRef, options.config])
  
  const startDemo = useCallback(() => {
    if (!engineRef.current) return
    
    setState(s => ({ ...s, status: 'playing' }))
    engineRef.current.start()
    botRef.current?.start()
  }, [])
  
  const pauseDemo = useCallback(() => {
    engineRef.current?.pause()
    setState(s => ({ ...s, status: 'paused' }))
  }, [])
  
  const resumeDemo = useCallback(() => {
    engineRef.current?.resume()
    setState(s => ({ ...s, status: 'playing' }))
  }, [])
  
  const resetDemo = useCallback(() => {
    engineRef.current?.reset()
    botRef.current?.reset()
    setState({
      status: 'idle',
      timeRemaining: options.config.duration,
      playerHealth: options.config.player.health,
      botHealth: options.config.bot.health,
      playerScore: 0,
      botScore: 0,
      result: null,
    })
  }, [options.config])
  
  const handleInput = useCallback((input: InputEvent) => {
    engineRef.current?.handleInput(input)
  }, [])
  
  return {
    state,
    startDemo,
    pauseDemo,
    resumeDemo,
    resetDemo,
    handleInput,
  }
}
```

### Feature Showcase (components/landing/FeatureShowcase.tsx)

```typescript
/**
 * FeatureShowcase - Scroll-animated feature cards
 */

import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { FeatureCard } from './FeatureCard'
import { FEATURES } from './featureConfig'

interface FeatureShowcaseProps {
  reducedMotion: boolean
}

export const FeatureShowcase = forwardRef<HTMLElement, FeatureShowcaseProps>(
  ({ reducedMotion }, ref) => {
    return (
      <section
        ref={ref}
        className="py-24 bg-[#0a0a0a]"
        aria-label="Game features"
      >
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Why Players Love It
            </h2>
            <p className="text-neutral-400 max-w-lg mx-auto">
              A unique blend of fast-paced combat and brain-teasing trivia
            </p>
          </motion.div>
          
          <div className="space-y-24">
            {FEATURES.map((feature, index) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                index={index}
                reducedMotion={reducedMotion}
              />
            ))}
          </div>
        </div>
      </section>
    )
  }
)

// Feature configuration
export const FEATURES: FeatureConfig[] = [
  {
    id: 'combat',
    title: 'Real-Time Combat',
    description: 'Dodge projectiles, land shots, and outmaneuver your opponent in fast-paced arena battles.',
    icon: 'crosshair',
    animation: {
      type: 'combat',
      config: { projectileSpeed: 300, damageAmount: 25, cycleTime: 3000 }
    }
  },
  {
    id: 'trivia',
    title: 'Trivia Integration',
    description: 'Answer questions correctly to gain power-ups and advantages. Knowledge is power!',
    icon: 'brain',
    animation: {
      type: 'trivia',
      config: {
        question: 'What year was Fortnite released?',
        options: ['2015', '2016', '2017', '2018'],
        correctIndex: 2,
        cycleTime: 4000
      }
    }
  },
  {
    id: 'arena',
    title: 'Dynamic Arenas',
    description: 'Navigate teleporters, avoid hazards, and use the terrain to your advantage.',
    icon: 'map',
    animation: {
      type: 'arena',
      config: { mapScale: 0.25, playerPaths: [/* ... */], cycleTime: 5000 }
    }
  },
  {
    id: 'competitive',
    title: 'Competitive Play',
    description: 'Climb the leaderboards, track your stats, and prove you\'re the best.',
    icon: 'trophy',
    animation: {
      type: 'competitive',
      config: {
        leaderboardEntries: [
          { rank: 1, name: 'ProPlayer99', elo: 2450 },
          { rank: 2, name: 'QuizMaster', elo: 2380 },
          { rank: 3, name: 'ArenaKing', elo: 2290 },
        ],
        cycleTime: 3000
      }
    }
  },
]
```

### Stats Section (components/landing/StatsSection.tsx)

```typescript
/**
 * StatsSection - Animated statistics display
 */

import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { NumberCounter } from './animations/NumberCounter'
import { useScrollAnimation } from '@/hooks/landing/useScrollAnimation'
import type { LandingStats } from './types'

interface StatsSectionProps {
  stats: LandingStats | null
  isLoading: boolean
  reducedMotion: boolean
}

export const StatsSection = forwardRef<HTMLElement, StatsSectionProps>(
  ({ stats, isLoading, reducedMotion }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const { isVisible } = useScrollAnimation(containerRef, { threshold: 0.3 })
    
    const statItems = [
      { label: 'Games Played', value: stats?.totalGames ?? 0, suffix: '' },
      { label: 'Players Online', value: stats?.activePlayers ?? 0, suffix: '' },
      { label: 'Questions Answered', value: stats?.questionsAnswered ?? 0, suffix: '' },
      { label: 'Avg Match Time', value: stats?.avgMatchDuration ?? 0, suffix: 's', format: formatTime },
    ]
    
    return (
      <section
        ref={ref}
        className="py-24 bg-gradient-to-b from-[#0a0a0a] to-[#0f0f1a]"
        aria-label="Game statistics"
      >
        <div ref={containerRef} className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Join the Community
            </h2>
            <p className="text-neutral-400">
              Thousands of players are already competing
            </p>
          </motion.div>
          
          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {statItems.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className="text-4xl font-bold text-white mb-2">
                  {isVisible && !isLoading ? (
                    <NumberCounter
                      value={stat.value}
                      duration={2000}
                      reducedMotion={reducedMotion}
                      format={stat.format}
                    />
                  ) : (
                    <span className="opacity-50">--</span>
                  )}
                  {stat.suffix}
                </div>
                <div className="text-sm text-neutral-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
          
          {/* Recent matches feed */}
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">
              Recent Matches
            </h3>
            <div className="space-y-3">
              {stats?.recentMatches.slice(0, 5).map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-green-400 font-medium">{match.winner}</span>
                    <span className="text-neutral-600">defeated</span>
                    <span className="text-red-400">{match.loser}</span>
                  </div>
                  <span className="text-xs text-neutral-600">
                    {formatTimeAgo(match.timestamp)}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Last updated indicator */}
          {stats?.lastUpdated && (
            <p className="text-center text-xs text-neutral-600 mt-8">
              Updated {formatTimeAgo(stats.lastUpdated)}
            </p>
          )}
        </div>
      </section>
    )
  }
)
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, the following correctness properties have been identified for property-based testing:

### Property 1: Backdrop Layer Initialization

*For any* landing page load with valid configuration, all backdrop layers (DeepSpaceLayer, HexGridLayer, StarFieldLayer, NebulaLayer, ShootingStarLayer) SHALL initialize with correct configuration parameters and render without errors.

**Validates: Requirements 1.2, 1.3, 1.4**

### Property 2: Demo Visibility State Management

*For any* sequence of visibility changes (visible → hidden → visible), the demo game loop SHALL correctly pause when not visible and resume within 100ms when visible again, preserving game state across transitions.

**Validates: Requirements 2.7, 2.8**

### Property 3: Scroll Animation Lifecycle

*For any* feature card and scroll position, the animation state SHALL correctly transition: trigger on entry (20% visible), pause when fully visible, and reset on exit, with no state corruption across multiple scroll cycles.

**Validates: Requirements 3.2, 3.7, 3.8**

### Property 4: Counter Animation Behavior

*For any* numeric value and animation duration, the NumberCounter component SHALL animate from 0 to the target value using eased interpolation, completing within the specified duration ±50ms.

**Validates: Requirements 4.1, 4.2**

### Property 5: Responsive Layout Adaptation

*For any* viewport width, the landing page layout SHALL correctly adapt: single-column below 768px, two-column between 768-1024px, and full layout above 1024px, with no layout breakage or overflow.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**

### Property 6: CTA Navigation Behavior

*For any* CTA click and authentication state, the navigation SHALL route to /register when unauthenticated and / when authenticated, with analytics event fired containing correct location data.

**Validates: Requirements 8.1, 8.2**

### Property 7: Accessibility Compliance

*For any* user with prefers-reduced-motion enabled, all animations SHALL be disabled or reduced to single cycle, and all interactive elements SHALL be keyboard accessible with visible focus indicators.

**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

### Property 8: SEO Metadata Presence

*For any* page render, all required meta tags (title, description, Open Graph, Twitter Cards) SHALL be present in the document head with non-empty values matching the specification.

**Validates: Requirements 10.1, 10.2, 10.3**

### Property 9: Demo Game State Machine

*For any* sequence of demo interactions, the game state SHALL correctly transition: idle → playing → (paused ↔ playing) → ended, with no invalid state transitions and correct state preservation.

**Validates: Requirements 2.1, 2.3, 2.5, 2.6, 2.10**

### Property 10: Performance Budget Compliance

*For any* page load on target hardware, the initial bundle size SHALL be under 500KB compressed, FCP SHALL be under 1.5s, and animation frame rate SHALL maintain 60fps (±5fps) during normal operation.

**Validates: Requirements 7.2, 7.3, 7.4, 7.5**

---

## Error Handling

### Network Errors

| Error | Handling |
|-------|----------|
| Stats API failure | Display cached values with "Updated X ago" indicator |
| Stats API timeout | Retry once after 5s, then show fallback |
| WebSocket unavailable | Demo works offline, no live ping display |

### Runtime Errors

| Error | Handling |
|-------|----------|
| Canvas context unavailable | Show static fallback image |
| Animation frame drop | Log warning, continue with reduced quality |
| Demo game crash | Show error overlay with retry option |
| Asset load failure | Use placeholder, log error |

### Graceful Degradation

```typescript
// Example: Canvas fallback
function HeroBackground({ reducedMotion }: Props) {
  const [canvasSupported, setCanvasSupported] = useState(true)
  
  useEffect(() => {
    const canvas = document.createElement('canvas')
    if (!canvas.getContext('2d')) {
      setCanvasSupported(false)
    }
  }, [])
  
  if (!canvasSupported) {
    return (
      <div 
        className="absolute inset-0 bg-gradient-radial from-[#0a0a20] to-[#020208]"
        aria-hidden="true"
      />
    )
  }
  
  return <CanvasBackground reducedMotion={reducedMotion} />
}
```

---

## Testing Strategy

### Unit Testing

Unit tests verify specific examples and edge cases:

- Component rendering with various props
- Hook state transitions
- Animation timing calculations
- Responsive breakpoint detection
- Analytics event formatting

### Property-Based Testing

Property tests verify universal properties using fast-check:

```typescript
import fc from 'fast-check'

// Property 4: Counter Animation Behavior
describe('NumberCounter', () => {
  it('should animate to target value within duration', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000000 }),
        fc.integer({ min: 500, max: 5000 }),
        (targetValue, duration) => {
          const { result } = renderHook(() => 
            useCounterAnimation(targetValue, duration)
          )
          
          // Fast-forward to end
          act(() => jest.advanceTimersByTime(duration + 100))
          
          // Value should equal target
          expect(result.current.value).toBe(targetValue)
        }
      )
    )
  })
})

// Property 5: Responsive Layout Adaptation
describe('Landing responsive layout', () => {
  it('should adapt layout correctly at all breakpoints', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 2560 }),
        (viewportWidth) => {
          setViewportWidth(viewportWidth)
          render(<Landing />)
          
          if (viewportWidth < 768) {
            expect(screen.getByTestId('feature-grid')).toHaveClass('grid-cols-1')
          } else if (viewportWidth < 1024) {
            expect(screen.getByTestId('feature-grid')).toHaveClass('grid-cols-2')
          } else {
            expect(screen.getByTestId('feature-grid')).toHaveClass('grid-cols-4')
          }
        }
      )
    )
  })
})
```

### Integration Testing

Integration tests verify component interactions:

- Demo game initialization and gameplay flow
- Scroll animation triggering across sections
- CTA navigation with auth state
- Stats polling and display updates

### Performance Testing

Performance tests verify budget compliance:

- Lighthouse CI for FCP/LCP metrics
- Bundle size analysis in CI
- Frame rate monitoring during animations

---

## Integration Points

### With Existing Systems

| System | Integration |
|--------|-------------|
| AuthStore | Check authentication state for CTA personalization |
| Router | Navigation to /register, /login, / |
| GameEngine | Embedded in demo (simplified version) |
| BackdropLayers | Reused for hero background |
| ArenaManager | Loads Nexus Arena for demo |
| CombatSystem | Provides combat mechanics for demo |

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/v1/stats/landing | GET | Fetch landing page statistics |
| /api/v1/matches/recent | GET | Fetch recent match results |

### Event Flow

```
Page Load
    │
    ├─→ LoadingScreen displays
    │
    ├─→ Preload critical assets
    │       ├─→ Backdrop layer classes
    │       ├─→ Demo game engine
    │       └─→ Animation libraries
    │
    ├─→ Initialize hero backdrop
    │
    ├─→ Fetch landing stats (async)
    │
    └─→ LoadingScreen fades out
            │
            └─→ Hero section visible
                    │
                    ├─→ Logo reveal animation
                    ├─→ Tagline fade in
                    └─→ CTA appears

Scroll to Demo
    │
    ├─→ Intersection Observer triggers
    │
    ├─→ Demo section lazy loads
    │
    └─→ "Try It Now" overlay displays
            │
            └─→ User clicks play
                    │
                    ├─→ Demo game initializes
                    ├─→ Bot AI activates
                    ├─→ Timer starts (60s)
                    └─→ Controls enabled

Demo Ends
    │
    ├─→ Results overlay displays
    │
    ├─→ Stats calculated
    │
    └─→ CTA presented
            │
            └─→ User clicks "Sign Up"
                    │
                    ├─→ Analytics event fired
                    ├─→ Page transition
                    └─→ Navigate to /register
```

---

## Out of Scope

These features are explicitly NOT part of this implementation:

- Video trailer/gameplay footage
- User testimonials/reviews section
- Blog/news integration
- Discord widget integration
- Twitch stream embed
- Multi-language support (i18n)
- A/B testing framework
- Email capture/newsletter signup
- Pricing/premium features section
- Download links (mobile apps)
- Detailed game tutorial
- Character/skin showcase
- Sound effects/music
- Social login buttons on landing page

---

## File Size Targets

| File | Target Lines |
|------|--------------|
| Landing.tsx | <400 |
| HeroSection.tsx | <300 |
| HeroBackground.tsx | <250 |
| LiveDemo.tsx | <350 |
| DemoOverlay.tsx | <150 |
| FeatureShowcase.tsx | <300 |
| FeatureCard.tsx | <200 |
| StatsSection.tsx | <200 |
| TechShowcase.tsx | <200 |
| FooterCTA.tsx | <150 |
| MobileControls.tsx | <200 |
| LoadingScreen.tsx | <100 |
| useDemoGame.ts | <250 |
| useScrollAnimation.ts | <100 |
| DemoGameEngine.ts | <300 |
| BotAI.ts | <150 |

---

## Browser Support

| Browser | Minimum Version | Notes |
|---------|-----------------|-------|
| Chrome | 90+ | Full support |
| Firefox | 88+ | Full support |
| Safari | 14+ | Full support |
| Edge | 90+ | Full support |
| Mobile Safari | 14+ | Touch controls |
| Chrome Android | 90+ | Touch controls |

---

## Performance Considerations

### Code Splitting Strategy

```typescript
// Lazy load sections below the fold
const LiveDemo = lazy(() => import('./components/landing/LiveDemo'))
const FeatureShowcase = lazy(() => import('./components/landing/FeatureShowcase'))
const StatsSection = lazy(() => import('./components/landing/StatsSection'))
const TechShowcase = lazy(() => import('./components/landing/TechShowcase'))
const FooterCTA = lazy(() => import('./components/landing/FooterCTA'))

// Preload demo when user scrolls near
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        import('./components/landing/LiveDemo')
      }
    },
    { rootMargin: '500px' }
  )
  observer.observe(demoTriggerRef.current)
}, [])
```

### Animation Performance

- Use CSS transforms instead of layout properties
- Batch DOM reads/writes
- Use will-change sparingly
- Throttle scroll handlers to 60fps
- Use requestAnimationFrame for canvas animations
- Pause off-screen animations

### Asset Optimization

- Inline critical CSS
- Preload hero background assets
- Use WebP images with fallbacks
- Lazy load below-fold images
- Subset fonts to used characters
