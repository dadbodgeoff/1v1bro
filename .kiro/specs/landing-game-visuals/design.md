# Design Document: Landing Page Game Visuals

## Overview

Transform the landing page into an immersive game experience with a full-page animated background system, live gameplay demo, glowing border effects, and dynamic visual elements. The design prioritizes performance (60fps desktop, 30fps mobile) while creating an exciting, game-like atmosphere.

## Architecture

```
Landing Page
├── GlobalBackground (fixed, full-page)
│   ├── ParticleCanvas (WebGL/Canvas2D)
│   ├── FloatingElements (CSS animations)
│   └── ParallaxLayers (scroll-driven)
├── LandingHeader
├── HeroSection
│   ├── AnimatedCharacters
│   └── ProjectileEffects
├── LiveDemoSection (NEW)
│   ├── DemoCanvas (mini game preview)
│   ├── QuizOverlay
│   └── CTAOverlay
├── HowItWorksSection
│   └── AnimatedStepIcons
├── FeaturesSection
│   └── GlowCards
├── UseCasesSection
├── FinalCTASection
└── LandingFooter
```

## Components and Interfaces

### 1. GlobalBackground Component

```typescript
interface GlobalBackgroundProps {
  particleCount?: number      // Default: 50 desktop, 20 mobile
  enableParallax?: boolean    // Default: true
  reducedMotion?: boolean     // Auto-detect from system
}

// Layers (back to front):
// 1. Deep space gradient (#09090B → #0F0F12)
// 2. Distant stars (tiny white dots, slow drift)
// 3. Nebula clouds (purple/orange gradients, very slow movement)
// 4. Floating platforms (parallax 0.3x)
// 5. Energy orbs (parallax 0.6x, glow effect)
// 6. Projectile trails (fast, random directions)
// 7. Ember particles (rise from bottom)
```

### 2. LiveDemoSection Component (Enterprise-Grade)

```typescript
interface LiveDemoProps {
  autoPlay?: boolean          // Default: true
  interactive?: boolean       // Allow user to click/tap to fire
  showHUD?: boolean           // Show health bars, scores, timer
}

// ENTERPRISE LIVE DEMO FEATURES:
// 
// 1. ACTUAL GAME ENGINE RENDERING
//    - Uses the real GameEngine from /game with a demo map
//    - Real physics, collision detection, projectile system
//    - Actual character sprites and animations
//
// 2. AI-CONTROLLED PLAYERS
//    - Two AI players with realistic movement patterns
//    - Smart dodging, strategic shooting
//    - Natural-looking gameplay, not scripted
//
// 3. REAL QUIZ INTEGRATION
//    - Actual quiz questions from the database (or curated demo set)
//    - AI "answers" questions with realistic timing
//    - Shows correct/incorrect feedback
//
// 4. FULL HUD OVERLAY
//    - Health bars (animated damage)
//    - Score display with +points animations
//    - Question timer with urgency effects
//    - Kill feed notifications
//
// 5. INTERACTIVE MODE (optional)
//    - Visitor can click/tap to fire projectiles
//    - "Try shooting!" prompt appears
//    - Demonstrates responsiveness
//
// 6. CINEMATIC CAMERA
//    - Smooth camera follows action
//    - Zoom on kills/answers
//    - Dramatic slow-mo on close calls
//
// 7. SEAMLESS LOOP
//    - Match ends, brief celebration
//    - Smooth transition to "rematch"
//    - No jarring reset

// Technical Implementation:
// - Renders in a contained <canvas> element
// - Uses actual GameEngine with demo configuration
// - AI players use simple state machines (idle → move → aim → fire → dodge)
// - 30-second match loop with 5 questions
// - Responsive: scales to container width
```

### Demo AI Behavior System

```typescript
interface DemoAI {
  state: 'idle' | 'moving' | 'aiming' | 'firing' | 'dodging' | 'answering'
  personality: 'aggressive' | 'defensive' | 'balanced'
  reactionTime: number        // ms delay before actions
  accuracy: number            // 0-1, affects aim wobble
  quizSpeed: number           // How fast they "read" questions
}

// AI State Machine:
// 1. IDLE (0.5-1s): Stand still, look around
// 2. MOVING (1-3s): Move toward strategic position
// 3. AIMING (0.3-0.8s): Track opponent, add slight wobble
// 4. FIRING (instant): Shoot projectile
// 5. DODGING (0.5s): Quick strafe when projectile incoming
// 6. ANSWERING (1-3s): When question appears, "think" then select

const DEMO_AI_PRESETS = {
  player1: { personality: 'aggressive', reactionTime: 200, accuracy: 0.8, quizSpeed: 1.5 },
  player2: { personality: 'defensive', reactionTime: 300, accuracy: 0.7, quizSpeed: 2.0 },
}
```

### Demo HUD Components

```typescript
// Floating above the demo canvas:
interface DemoHUD {
  // Top bar
  player1Health: HealthBar      // Left side, orange theme
  timer: CountdownTimer         // Center, pulses when low
  player2Health: HealthBar      // Right side, purple theme
  
  // Score overlay
  player1Score: AnimatedScore   // "+100" floats up on correct
  player2Score: AnimatedScore
  
  // Question panel (bottom)
  questionPanel: QuizPanel      // Shows question + 4 options
  
  // Kill feed (top right)
  killFeed: KillNotification[]  // "Player1 eliminated Player2"
  
  // Interactive prompt
  interactiveHint?: string      // "Click anywhere to fire!"
}
```

### 3. GlowBorder Component

```typescript
interface GlowBorderProps {
  color?: 'orange' | 'purple' | 'blue'  // Default: 'orange'
  intensity?: 'subtle' | 'medium' | 'strong'
  animated?: boolean          // Default: true
  pulseOnHover?: boolean      // Default: true
}

// CSS implementation using:
// - box-shadow with multiple layers
// - ::before pseudo-element for animated gradient border
// - CSS custom properties for color theming
```

### 4. AnimatedIcon Component

```typescript
interface AnimatedIconProps {
  icon: 'matchmaking' | 'combat' | 'victory' | 'quiz'
  size?: 'sm' | 'md' | 'lg'
  animate?: boolean
}

// Icons animate on scroll-into-view:
// - matchmaking: Two dots converge
// - combat: Crosshairs pulse
// - victory: Trophy bounces
// - quiz: Question mark flips
```

## Data Models

### Particle System Configuration

```typescript
interface ParticleConfig {
  type: 'ember' | 'star' | 'orb' | 'projectile'
  count: number
  speed: { min: number; max: number }
  size: { min: number; max: number }
  color: string
  glow: boolean
  direction: 'up' | 'down' | 'random' | 'horizontal'
}

const PARTICLE_PRESETS = {
  desktop: {
    embers: { count: 30, speed: { min: 0.5, max: 2 } },
    stars: { count: 100, speed: { min: 0.1, max: 0.3 } },
    orbs: { count: 8, speed: { min: 0.2, max: 0.5 } },
    projectiles: { count: 5, speed: { min: 3, max: 6 } },
  },
  mobile: {
    embers: { count: 15, speed: { min: 0.3, max: 1 } },
    stars: { count: 40, speed: { min: 0.1, max: 0.2 } },
    orbs: { count: 4, speed: { min: 0.1, max: 0.3 } },
    projectiles: { count: 2, speed: { min: 2, max: 4 } },
  },
}
```

### Demo Match Flow (30-second loop)

```typescript
// Phase 1: INTRO (0-3s)
// - Camera zooms out to show arena
// - Both players spawn with entrance animation
// - "MATCH START" text fades in/out
// - Health bars fill up

// Phase 2: QUESTION 1 (3-9s)
// - Question slides in from bottom
// - AI players "read" and select answers
// - Correct answer highlighted, scores update
// - Brief combat exchange

// Phase 3: COMBAT (9-15s)
// - Intense projectile exchange
// - One player takes damage
// - Dodging, strafing, shooting
// - Kill feed shows "Nice shot!"

// Phase 4: QUESTION 2 (15-21s)
// - Second question appears
// - One AI answers faster (shows speed matters)
// - More combat, health getting low

// Phase 5: FINALE (21-28s)
// - Final question, dramatic music swell
// - Close combat, both low health
// - One player wins with final shot
// - "VICTORY" celebration

// Phase 6: RESET (28-30s)
// - Quick fade transition
// - Seamless loop back to Phase 1

interface DemoMatchState {
  phase: 'intro' | 'question' | 'combat' | 'finale' | 'reset'
  timeInPhase: number
  player1: DemoPlayerState
  player2: DemoPlayerState
  currentQuestion: DemoQuestion | null
  projectiles: Projectile[]
  killFeed: KillFeedEntry[]
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Parallax Transform Proportionality
*For any* scroll position, the transform values of parallax layers should change proportionally to their assigned parallax ratio (e.g., 0.3x layer moves 30% of scroll distance).
**Validates: Requirements 1.2**

### Property 2: Reduced Motion Compliance
*For any* animated element, when prefers-reduced-motion is enabled, the element should not have active CSS animations or should use reduced/static alternatives.
**Validates: Requirements 1.5**

### Property 3: Glow Border Presence on Feature Cards
*For any* feature card component, it should have glow border styling applied (box-shadow or border-image with glow effect).
**Validates: Requirements 3.1**

### Property 4: CTA Glow Color Consistency
*For any* CTA button, the glow effect color should match the brand accent color (#F97316 or derived).
**Validates: Requirements 3.3**

### Property 5: GPU-Accelerated Animations
*For any* animated border or visual effect, the animation should use transform or opacity properties (not width, height, top, left) for GPU acceleration.
**Validates: Requirements 3.5**

### Property 6: Step Card Animated Icons
*For any* step card in the HowItWorks section, it should contain an icon element with animation capability.
**Validates: Requirements 4.2**

### Property 7: Mobile Particle Reduction
*For any* mobile viewport (width < 768px), the particle count should be less than or equal to the mobile preset values.
**Validates: Requirements 5.2**

### Property 8: Decorative Animation Accessibility
*For any* purely decorative animation element (particles, floating objects), it should have aria-hidden="true" to hide from screen readers.
**Validates: Requirements 5.4**

## Error Handling

- **WebGL not supported**: Fall back to CSS-only animations
- **Low FPS detected**: Reduce particle count dynamically
- **Animation errors**: Gracefully degrade to static background
- **Demo load failure**: Show static screenshot with play button

## Testing Strategy

### Unit Tests
- GlowBorder renders with correct CSS properties
- ParticleConfig generates valid particle objects
- Demo timeline keyframes are properly sequenced

### Property-Based Tests (using fast-check)
- Property 1: Parallax transforms scale correctly for random scroll values
- Property 2: All animated elements respect reduced motion for random component trees
- Property 3-4: Glow styling present on randomly generated card/CTA instances
- Property 5: Animation properties use only GPU-accelerated values
- Property 6: Step cards always contain animated icon children
- Property 7: Particle counts respect viewport-based limits
- Property 8: Decorative elements have aria-hidden attribute

### Integration Tests
- Full page renders without console errors
- Scroll triggers parallax updates
- Demo loops without memory leaks
- Mobile viewport applies reduced animations
