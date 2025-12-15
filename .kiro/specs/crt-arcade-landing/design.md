    # Design Document: CRT Arcade Landing Page

## Overview

The CRT Arcade Landing Page transforms the 1v1 Bro landing experience into an immersive retro gaming console simulation. The entire viewport becomes a CRT monitor screen, complete with authentic visual effects, a dramatic boot sequence, and a functional dashboard that showcases the live gameplay demo alongside conversion-focused CTAs.

This design prioritizes:
- **Memorability**: A unique experience that makes visitors talk about it
- **Performance**: Lightweight SVG/CSS effects that maintain 60fps
- **Conversion**: Clear CTAs and demo visibility despite the creative framing
- **Accessibility**: Full keyboard navigation and reduced-motion support

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ArcadeLanding Page                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    CRTMonitor (SVG Frame)                  │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │                   CRTScreen                          │  │  │
│  │  │  ┌───────────────────────────────────────────────┐  │  │  │
│  │  │  │              BootSequence                      │  │  │  │
│  │  │  │  (shows during boot, then unmounts)           │  │  │  │
│  │  │  └───────────────────────────────────────────────┘  │  │  │
│  │  │  ┌───────────────────────────────────────────────┐  │  │  │
│  │  │  │              DashboardUI                       │  │  │  │
│  │  │  │  ┌─────────────────────────────────────────┐  │  │  │  │
│  │  │  │  │           LiveDemo (imported)            │  │  │  │  │
│  │  │  │  └─────────────────────────────────────────┘  │  │  │  │
│  │  │  │  ┌─────────────────────────────────────────┐  │  │  │  │
│  │  │  │  │     Headline + Tagline + CTAs           │  │  │  │  │
│  │  │  │  └─────────────────────────────────────────┘  │  │  │  │
│  │  │  └───────────────────────────────────────────────┘  │  │  │
│  │  │  ┌───────────────────────────────────────────────┐  │  │  │
│  │  │  │           CRTEffects (overlay)                │  │  │  │
│  │  │  │  - Scanlines                                  │  │  │  │
│  │  │  │  - Phosphor glow                              │  │  │  │
│  │  │  │  - Barrel distortion                          │  │  │  │
│  │  │  │  - Occasional flicker                         │  │  │  │
│  │  │  └───────────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │              PowerIndicator (LED)                    │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### File Structure

```
frontend/src/components/landing/arcade/
├── index.ts                    # Public exports
├── types.ts                    # TypeScript interfaces
├── constants.ts                # Animation timings, colors, text content
├── ArcadeLanding.tsx           # Main page component
├── ArcadeLandingErrorBoundary.tsx  # Error boundary with static fallback
├── StaticLandingFallback.tsx   # Static fallback when JS fails
├── CRTMonitor/
│   ├── index.ts
│   ├── CRTMonitor.tsx          # SVG frame wrapper
│   ├── CRTBezel.tsx            # The monitor bezel SVG
│   ├── CRTScreen.tsx           # Screen container with effects
│   └── PowerIndicator.tsx      # Animated LED
├── BootSequence/
│   ├── index.ts
│   ├── BootSequence.tsx        # Boot animation orchestrator
│   ├── BootText.tsx            # Typewriter text lines
│   ├── BootProgress.tsx        # Loading progress bar
│   └── BootLogo.tsx            # Logo reveal animation
├── CRTEffects/
│   ├── index.ts
│   ├── CRTEffects.tsx          # Effect layer wrapper
│   ├── Scanlines.tsx           # Horizontal line overlay
│   ├── PhosphorGlow.tsx        # Bloom effect on bright elements
│   ├── BarrelDistortion.tsx    # Edge curvature via SVG filter
│   └── ScreenFlicker.tsx       # Occasional flicker animation
├── DashboardUI/
│   ├── index.ts
│   ├── DashboardUI.tsx         # Main content layout
│   ├── ArcadeHeadline.tsx      # Styled headline with glow
│   ├── ArcadeCTA.tsx           # Retro-styled buttons
│   └── DemoContainer.tsx       # LiveDemo wrapper with CRT styling
├── hooks/
│   ├── useBootSequence.ts      # Boot state machine
│   ├── useCRTEffects.ts        # Effect toggle and intensity
│   ├── useArcadeSound.ts       # Optional sound effects
│   ├── useReducedMotion.ts     # Accessibility preference detection
│   ├── useFPSMonitor.ts        # Performance monitoring with auto-degradation
│   └── useSVGFilterSupport.ts  # Feature detection for SVG filters
└── styles/
    └── arcade.css              # All CRT-specific styles
```

### Component Interfaces

```typescript
// types.ts

export type BootPhase = 'off' | 'powering-on' | 'booting' | 'ready' | 'complete';

export interface BootSequenceState {
  phase: BootPhase;
  currentLine: number;
  progress: number;
  isSkipped: boolean;
}

export interface CRTEffectsConfig {
  scanlines: boolean;
  scanlineIntensity: number; // 0-1
  phosphorGlow: boolean;
  glowIntensity: number; // 0-1
  barrelDistortion: boolean;
  distortionAmount: number; // 0-1
  flicker: boolean;
  flickerFrequency: number; // seconds between flickers
  // Fallback modes for unsupported browsers
  barrelDistortionMode: 'svg-filter' | 'css-border-radius-hack' | 'none';
  phosphorGlowMode: 'svg-filter' | 'css-box-shadow' | 'none';
}

export interface FPSMonitorState {
  currentFPS: number;
  averageFPS: number;
  isPerformanceDegraded: boolean; // true if <30fps for 2+ seconds
  degradeEffects: () => void; // Auto-called when degraded
}

export interface SVGFilterSupport {
  feDisplacementMap: boolean;
  feGaussianBlur: boolean;
  isIOSSafari18: boolean;
  recommendedBarrelMode: 'svg-filter' | 'css-border-radius-hack' | 'none';
  recommendedGlowMode: 'svg-filter' | 'css-box-shadow' | 'none';
}

export interface ArcadeLandingProps {
  /** Skip boot sequence and show dashboard immediately */
  skipBoot?: boolean;
  /** Callback when boot sequence completes */
  onBootComplete?: () => void;
}

export interface CRTMonitorProps {
  children: React.ReactNode;
  /** Show power LED */
  showPowerLED?: boolean;
  /** LED color (defaults to brand orange) */
  ledColor?: string;
  /** Responsive breakpoint mode */
  mode?: 'mobile' | 'tablet' | 'desktop';
}

export interface BootSequenceProps {
  /** Called when boot completes or is skipped */
  onComplete: () => void;
  /** Boot text lines to display */
  bootLines?: string[];
  /** Total boot duration in ms */
  duration?: number;
}

export interface CRTEffectsProps {
  config: CRTEffectsConfig;
  /** Reduced motion preference */
  reducedMotion?: boolean;
}

export interface DashboardUIProps {
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Primary CTA click handler */
  onPrimaryCTA: () => void;
  /** Secondary CTA click handler */
  onSecondaryCTA: () => void;
}
```

### Constants

```typescript
// constants.ts

// SVG Filter Support Detection (P0 - iOS Safari 18 workaround)
export const SVG_FILTER_SUPPORT = {
  feDisplacementMap: typeof SVGFEDisplacementMapElement !== 'undefined',
  feGaussianBlur: typeof SVGFEGaussianBlurElement !== 'undefined',
  // iOS Safari 18.0-18.2 has feDisplacementMap rendering bugs
  isIOSSafari18: () => {
    const ua = navigator.userAgent;
    return ua.includes('Safari') && !ua.includes('Chrome') && /Version\/18/.test(ua);
  },
};

// Effect Fallback Cascade (P0 - graceful degradation)
export const EFFECT_FALLBACK_CASCADE = {
  barrelDistortion: {
    primary: 'svg-filter',
    fallback1: 'css-border-radius-hack', // border-radius: 50% 50% / 2% 2%
    fallback2: 'none',
  },
  phosphorGlow: {
    primary: 'svg-filter',
    fallback1: 'css-box-shadow',
    fallback2: 'none',
  },
  scanlines: {
    primary: 'css-repeating-gradient',
    fallback1: 'none',
  },
};

// Performance Thresholds
export const PERFORMANCE_THRESHOLDS = {
  minAcceptableFPS: 30,
  targetFPS: 55,
  degradationTriggerSeconds: 2, // Degrade effects if <30fps for 2s
  fpsCheckIntervalMs: 500,
};

export const BOOT_LINES = [
  'INITIALIZING ARENA SYSTEMS...',
  'LOADING COMBAT MODULES... OK',
  'CALIBRATING MATCHMAKING... OK', 
  'SYNCING PLAYER DATA... OK',
  'ARENA READY',
];

export const BOOT_TIMING = {
  powerOnDelay: 300,      // ms before boot text starts
  lineDelay: 400,         // ms between each boot line
  lineTypeDuration: 200,  // ms to "type" each line
  logoRevealDelay: 500,   // ms after last line before logo
  progressDuration: 1000, // ms for progress bar to fill
  totalDuration: 4500,    // max total boot time
};

export const CRT_DEFAULTS: CRTEffectsConfig = {
  scanlines: true,
  scanlineIntensity: 0.15,
  phosphorGlow: true,
  glowIntensity: 0.4,
  barrelDistortion: true,
  distortionAmount: 0.02,
  flicker: true,
  flickerFrequency: 15, // every 15 seconds on average
};

export const ARCADE_CONTENT = {
  headline: '1v1 BRO',
  tagline: 'Trivia Duels With Real-Time Combat',
  primaryCTA: 'PLAY NOW',
  primaryCTAAuth: 'ENTER ARENA',
  secondaryCTA: 'CREATE ACCOUNT',
  secondaryCTAAuth: 'DASHBOARD',
};

export const ARCADE_COLORS = {
  // From tokens.css - maintaining brand consistency
  screenBg: '#09090B',           // --color-bg-base
  bezelDark: '#111111',          // --color-bg-card
  bezelLight: '#1A1A1A',         // --color-bg-elevated
  bezelHighlight: '#2a2a2a',
  
  // Brand orange family
  ledOff: '#331a00',
  ledOn: '#F97316',              // --color-brand
  ledGlow: 'rgba(249, 115, 22, 0.6)',
  
  // Effects
  scanlineColor: 'rgba(0, 0, 0, 0.15)',
  phosphorOrange: 'rgba(249, 115, 22, 0.3)',
  textGlow: 'rgba(249, 115, 22, 0.8)',
  
  // Text colors from brand system
  textPrimary: '#FFFFFF',        // --color-text-primary
  textSecondary: '#B4B4B4',      // --color-text-secondary
  textMuted: '#737373',          // --color-text-muted
  
  // CTA colors
  ctaPrimary: '#F97316',         // --color-brand
  ctaPrimaryHover: '#FB923C',    // --color-brand-light
  ctaSecondaryBorder: 'rgba(255, 255, 255, 0.16)', // --color-border-strong
};
```

## Data Models

### Boot Sequence State Machine

```
┌─────┐    load     ┌────────────┐   delay    ┌─────────┐
│ off │ ──────────► │ powering-on │ ─────────► │ booting │
└─────┘             └────────────┘            └─────────┘
                                                   │
                          ┌────────────────────────┘
                          │ lines complete
                          ▼
                    ┌─────────┐   fade out   ┌──────────┐
                    │  ready  │ ───────────► │ complete │
                    └─────────┘              └──────────┘
                          ▲
                          │ skip (any phase)
    ──────────────────────┴──────────────────────────────
```

### CRT Effects Layer Stack (z-index order)

```
z-index: 100  ─  ScreenFlicker (intermittent)
z-index: 50   ─  Scanlines (always on)
z-index: 40   ─  PhosphorGlow (SVG filter)
z-index: 30   ─  BarrelDistortion (SVG filter on container)
z-index: 10   ─  DashboardUI / BootSequence (content)
z-index: 0    ─  Screen background
```

### Web Audio Sound Synthesis

All sound effects are generated programmatically using the Web Audio API - no external audio files required.

```typescript
// Sound synthesis configuration
export const SOUND_CONFIG = {
  // Startup chime - ascending tone sequence
  startupChime: {
    type: 'square' as OscillatorType,
    notes: [262, 330, 392, 523], // C4, E4, G4, C5
    noteDuration: 150,           // ms per note
    totalDuration: 800,          // ms total
    gain: 0.15,                  // volume (0-1)
  },
  
  // UI hover sound - short high blip
  hoverBlip: {
    type: 'sine' as OscillatorType,
    frequency: 880,              // A5
    duration: 50,                // ms
    gain: 0.08,
  },
  
  // UI click sound - lower confirmation blip
  clickBlip: {
    type: 'square' as OscillatorType,
    frequency: 440,              // A4
    frequencyEnd: 660,           // Pitch bend up
    duration: 80,                // ms
    gain: 0.12,
  },
};

// useArcadeSound hook interface
export interface ArcadeSoundHook {
  isMuted: boolean;
  setMuted: (muted: boolean) => void;
  playStartupChime: () => void;
  playHoverBlip: () => void;
  playClickBlip: () => void;
}
```

**Implementation approach:**
1. Create AudioContext lazily on first user interaction (browser requirement)
2. Use OscillatorNode for tone generation (square wave = retro 8-bit feel)
3. Use GainNode for volume control and fade-out envelopes
4. Chain: Oscillator → Gain → Destination
5. Clean up oscillators after each sound completes



## Visual Design Specification

This section defines every visual detail to ensure the implementation matches the brand system and creates a share-worthy experience.

### Typography Hierarchy (from BRAND_SYSTEM.md)

```typescript
export const ARCADE_TYPOGRAPHY = {
  // Boot sequence text - monospace terminal aesthetic
  bootText: {
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: '14px',
    fontWeight: 500,
    letterSpacing: '0.05em',
    lineHeight: 1.6,
    color: '#F97316', // Brand orange for boot text
    textShadow: '0 0 10px rgba(249, 115, 22, 0.6)',
  },
  
  // Main headline - Display size with maximum impact
  headline: {
    fontFamily: "'Inter', sans-serif",
    fontSize: {
      mobile: '48px',
      tablet: '64px',
      desktop: '80px',
    },
    fontWeight: 800,
    letterSpacing: '-0.03em',
    lineHeight: 1.1,
    color: '#FFFFFF',
    textShadow: '0 0 40px rgba(249, 115, 22, 0.8), 0 0 80px rgba(249, 115, 22, 0.4)',
  },
  
  // Tagline - Secondary emphasis
  tagline: {
    fontFamily: "'Inter', sans-serif",
    fontSize: {
      mobile: '18px',
      tablet: '22px',
      desktop: '26px',
    },
    fontWeight: 600,
    letterSpacing: '-0.02em',
    lineHeight: 1.3,
    color: '#F97316', // Brand orange
    textShadow: '0 0 20px rgba(249, 115, 22, 0.5)',
  },
  
  // CTA buttons
  ctaText: {
    fontFamily: "'Inter', sans-serif",
    fontSize: '18px',
    fontWeight: 700,
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  },
};
```

### Animation Choreography

```typescript
export const ANIMATION_CHOREOGRAPHY = {
  // Power-on warm-up effect
  powerOn: {
    duration: 600,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    // Screen glows from center outward like real CRT phosphor warming
    keyframes: [
      { time: 0, scale: 0, opacity: 0 },
      { time: 0.3, scale: 0.3, opacity: 0.5 },
      { time: 0.6, scale: 0.7, opacity: 0.8 },
      { time: 1, scale: 1, opacity: 1 },
    ],
  },
  
  // Boot text typewriter
  typewriter: {
    charDelay: 30,           // ms between characters
    lineDelay: 400,          // ms between lines
    cursorBlink: 530,        // ms cursor blink interval
    easing: 'steps(1)',      // Instant character appearance
  },
  
  // Logo reveal
  logoReveal: {
    duration: 800,
    delay: 200,              // After last boot line
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Overshoot bounce
    keyframes: [
      { time: 0, scale: 0.5, opacity: 0, blur: 20 },
      { time: 0.5, scale: 1.05, opacity: 0.8, blur: 5 },
      { time: 1, scale: 1, opacity: 1, blur: 0 },
    ],
  },
  
  // Dashboard content stagger
  dashboardStagger: {
    baseDelay: 100,          // ms before first element
    staggerDelay: 80,        // ms between each element
    duration: 400,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    // Order: Demo → Headline → Tagline → Primary CTA → Secondary CTA
  },
  
  // CTA hover micro-interaction
  ctaHover: {
    duration: 200,
    easing: 'ease-out',
    transform: 'translateY(-2px)',
    glowIntensify: 1.5,      // Multiply glow intensity
  },
  
  // CTA press feedback
  ctaPress: {
    duration: 100,
    transform: 'scale(0.97)',
  },
  
  // Screen flicker (random intervals)
  flicker: {
    minInterval: 10000,      // 10 seconds minimum
    maxInterval: 30000,      // 30 seconds maximum
    duration: 150,
    opacityDip: 0.85,        // Brief opacity reduction
  },
};
```

### CRT Bezel Design Specification

```typescript
export const BEZEL_DESIGN = {
  // Overall frame
  frame: {
    borderRadius: '24px',
    padding: {
      mobile: '8px',
      tablet: '16px',
      desktop: '24px',
    },
    background: 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 50%, #0f0f0f 100%)',
    boxShadow: `
      inset 0 2px 4px rgba(255,255,255,0.05),
      inset 0 -2px 4px rgba(0,0,0,0.3),
      0 20px 60px rgba(0,0,0,0.5),
      0 0 0 1px rgba(255,255,255,0.05)
    `,
  },
  
  // Screen inset
  screenInset: {
    borderRadius: '8px',
    border: '3px solid #0a0a0a',
    boxShadow: `
      inset 0 0 30px rgba(0,0,0,0.8),
      inset 0 0 60px rgba(0,0,0,0.4)
    `,
  },
  
  // Ventilation slots (desktop only)
  vents: {
    count: 6,
    width: '40px',
    height: '4px',
    gap: '6px',
    color: '#0a0a0a',
    position: 'bottom-left',
  },
  
  // Brand badge area
  brandBadge: {
    width: '80px',
    height: '20px',
    position: 'bottom-center',
    background: '#1a1a1a',
    borderRadius: '4px',
    text: '1v1 BRO',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: '#4a4a4a',
  },
  
  // Power LED
  powerLED: {
    size: '8px',
    position: 'bottom-right',
    offColor: '#331a00',
    onColor: '#F97316',
    glowRadius: '12px',
    glowColor: 'rgba(249, 115, 22, 0.6)',
    pulseAnimation: {
      duration: 2000,
      minOpacity: 0.7,
      maxOpacity: 1,
    },
  },
};
```

### Screen Effects Detail

```typescript
export const SCREEN_EFFECTS = {
  // Glass reflection overlay
  glassReflection: {
    enabled: true,
    gradient: `linear-gradient(
      135deg,
      rgba(255,255,255,0.03) 0%,
      rgba(255,255,255,0.08) 20%,
      rgba(255,255,255,0.03) 40%,
      transparent 60%
    )`,
    pointerEvents: 'none',
  },
  
  // Scanlines
  scanlines: {
    lineHeight: '2px',
    gap: '2px',
    color: 'rgba(0, 0, 0, 0.15)',
    animation: 'none', // Static for performance
  },
  
  // Phosphor glow (SVG filter)
  phosphorGlow: {
    blurRadius: 4,
    color: '#F97316',
    opacity: 0.3,
  },
  
  // Barrel distortion
  barrelDistortion: {
    amount: 0.02,        // 2% edge curvature
    // Implemented via SVG feDisplacementMap
  },
  
  // Vignette (darkened edges)
  vignette: {
    gradient: `radial-gradient(
      ellipse at center,
      transparent 0%,
      transparent 60%,
      rgba(0,0,0,0.3) 100%
    )`,
  },
  
  // CRT color fringing (subtle RGB offset)
  colorFringing: {
    enabled: true,
    offset: '0.5px',
    // Red channel shifted left, blue shifted right
  },
};
```

### Color Application Map

```typescript
export const COLOR_APPLICATION = {
  // Page background (outside CRT)
  pageBackground: '#000000',
  
  // CRT screen background
  screenBackground: '#09090B', // --color-bg-base
  
  // Boot sequence
  boot: {
    text: '#F97316',           // Brand orange
    textGlow: 'rgba(249, 115, 22, 0.6)',
    cursor: '#F97316',
    progressBar: {
      track: 'rgba(255, 255, 255, 0.1)',
      fill: 'linear-gradient(90deg, #EA580C, #F97316, #FB923C)',
      glow: 'rgba(249, 115, 22, 0.5)',
    },
  },
  
  // Dashboard
  dashboard: {
    headline: '#FFFFFF',
    headlineGlow: 'rgba(249, 115, 22, 0.8)',
    tagline: '#F97316',
    taglineGlow: 'rgba(249, 115, 22, 0.5)',
  },
  
  // CTAs
  cta: {
    primary: {
      background: '#F97316',
      backgroundHover: '#FB923C',
      text: '#FFFFFF',
      glow: 'rgba(249, 115, 22, 0.4)',
      glowHover: 'rgba(249, 115, 22, 0.6)',
    },
    secondary: {
      background: 'transparent',
      backgroundHover: 'rgba(255, 255, 255, 0.05)',
      border: 'rgba(255, 255, 255, 0.2)',
      borderHover: 'rgba(255, 255, 255, 0.4)',
      text: '#FFFFFF',
    },
  },
};
```

### Analytics Events (P1)

```typescript
// Required analytics tracking for boot funnel
export const ANALYTICS_EVENTS = {
  // Boot funnel tracking
  bootStart: 'arcade_boot_start',
  bootPhase: 'arcade_boot_phase', // payload: { phase: BootPhase }
  bootSkip: 'arcade_boot_skip', // payload: { phase_at_skip, time_elapsed_ms }
  bootComplete: 'arcade_boot_complete', // payload: { total_duration_ms, was_skipped }
  
  // Dashboard engagement
  ctaVisible: 'arcade_cta_visible', // payload: { time_since_boot_ms }
  ctaClick: 'arcade_cta_click', // payload: { cta_type: 'primary' | 'secondary', is_authenticated }
  
  // Performance tracking
  performanceDegraded: 'arcade_performance_degraded', // payload: { fps_at_trigger, effects_disabled }
  errorBoundaryTriggered: 'arcade_error_boundary_triggered', // payload: { error_message }
  
  // Effect fallback tracking
  svgFallbackUsed: 'arcade_svg_fallback_used', // payload: { effect, fallback_mode, reason }
};
```

### Micro-Interactions & Delight Details

```typescript
export const DELIGHT_DETAILS = {
  // Terminal cursor during boot
  terminalCursor: {
    character: '█',
    blinkRate: 530,          // ms
    color: '#F97316',
  },
  
  // "PRESS START" Easter egg
  pressStart: {
    enabled: true,
    text: 'PRESS START',
    showAfter: 3000,         // ms after dashboard loads
    blinkRate: 800,
    fontSize: '12px',
    position: 'bottom-center',
    color: 'rgba(255, 255, 255, 0.3)',
    onClick: 'navigate to primary CTA action',
  },
  
  // Konami code Easter egg (optional)
  konamiCode: {
    enabled: false,          // Can enable later
    sequence: ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'],
    reward: 'confetti animation',
  },
  
  // Demo "LIVE" indicator pulse
  liveIndicator: {
    text: 'LIVE',
    dotSize: '6px',
    dotColor: '#10B981',     // Success green
    pulseAnimation: true,
    position: 'top-right of demo',
  },
  
  // Skip button styling
  skipButton: {
    text: 'SKIP →',
    position: 'bottom-right',
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.4)',
    hoverColor: 'rgba(255, 255, 255, 0.8)',
    padding: '8px 16px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '4px',
    minHeight: '44px', // Touch target compliance
    minWidth: '44px',
    ariaLabel: 'Skip boot sequence',
  },
  
  // Sound toggle icon
  soundToggle: {
    position: 'top-right of bezel',
    size: '32px',
    iconMuted: '🔇',
    iconUnmuted: '🔊',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '50%',
  },
};
```

### Responsive Breakpoint Behaviors

```typescript
export const RESPONSIVE_BEHAVIORS = {
  mobile: {
    maxWidth: 767,
    bezelPadding: '8px',
    bezelRadius: '16px',
    showVents: false,
    showBrandBadge: false,
    headlineSize: '48px',
    layoutDirection: 'column',
    demoPosition: 'top',
    ctaLayout: 'stacked',
    ctaWidth: '100%',
  },
  
  tablet: {
    minWidth: 768,
    maxWidth: 1023,
    bezelPadding: '16px',
    bezelRadius: '20px',
    showVents: false,
    showBrandBadge: true,
    headlineSize: '64px',
    layoutDirection: 'column',
    demoPosition: 'top',
    ctaLayout: 'row',
    ctaWidth: 'auto',
  },
  
  desktop: {
    minWidth: 1024,
    bezelPadding: '24px',
    bezelRadius: '24px',
    showVents: true,
    showBrandBadge: true,
    headlineSize: '80px',
    layoutDirection: 'row',
    demoPosition: 'right',
    ctaLayout: 'row',
    ctaWidth: 'auto',
  },
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Aspect Ratio Preservation
*For any* viewport size, the Screen_Content area dimensions SHALL maintain a ratio between 16:9 and 4:3 (1.33 to 1.78)
**Validates: Requirements 1.4, 5.4**

### Property 2: Boot Lines Sequential Display
*For any* boot sequence execution, boot text lines SHALL appear in the order defined in BOOT_LINES array, with each line appearing only after the previous line has started displaying
**Validates: Requirements 2.2**

### Property 3: Boot Progress Monotonic Increase
*For any* boot sequence execution, the progress value SHALL only increase (never decrease) from 0 to 100 over the duration of the boot
**Validates: Requirements 2.4**

### Property 4: Skip Functionality
*For any* boot phase before 'complete', triggering skip (via Space, Enter, or click) SHALL immediately transition the boot state to 'complete' and render the Dashboard_UI
**Validates: Requirements 2.6**

### Property 5: Boot Duration Limit
*For any* boot sequence execution without user skip, the total time from start to 'complete' phase SHALL NOT exceed 5000ms
**Validates: Requirements 2.7**

### Property 6: Reduced Motion Respect
*For any* user with prefers-reduced-motion enabled, the CRT effects config SHALL have flicker disabled and animation intensities reduced to 0
**Validates: Requirements 3.5, 6.6**

### Property 7: Auth-Based Primary CTA Navigation
*For any* primary CTA click, the navigation target SHALL be '/instant-play' when isAuthenticated is false, and '/dashboard' when isAuthenticated is true
**Validates: Requirements 4.5**

### Property 8: Auth-Based Secondary CTA Navigation
*For any* secondary CTA click, the navigation target SHALL be '/register' when isAuthenticated is false, and '/dashboard' when isAuthenticated is true
**Validates: Requirements 4.6**

### Property 9: Touch Target Minimum Size
*For any* interactive element (buttons, links) in the Dashboard_UI, the computed width and height SHALL both be at least 44px
**Validates: Requirements 4.7**

### Property 10: ARIA Labels Present
*For any* interactive element in the component tree, the element SHALL have either an aria-label, aria-labelledby, or visible text content for screen reader accessibility
**Validates: Requirements 6.2**

### Property 11: Sound Preference Persistence
*For any* sound mute/unmute action, the preference SHALL be written to localStorage and subsequent page loads SHALL restore that preference
**Validates: Requirements 7.5**

### Property 12: Analytics Tracking
*For any* page view or CTA click event, the analytics service SHALL be called with the appropriate event type and metadata
**Validates: Requirements 8.5**

### Property 13: Frame Rate Guarantee
*For any* device with GPU acceleration, the CRT effects layer SHALL maintain ≥55fps average over 5 seconds of rendering
**Validates: Requirements 3.6**

### Property 14: SVG Filter Fallback
*For any* browser configuration (with or without SVG filter support), the getEffectsConfig function SHALL return a valid CRTEffectsConfig without throwing
**Validates: Requirements 3.4, 6.5**

### Property 15: Error Boundary Isolation
*For any* error thrown by a child component, the ArcadeLandingErrorBoundary SHALL catch it and render StaticLandingFallback without crashing the page
**Validates: Requirements 6.1**

## Error Handling

### Component Error Boundary (P0)
- ArcadeLanding MUST be wrapped in ArcadeLandingErrorBoundary
- IF any child component throws THEN display StaticLandingFallback
- StaticLandingFallback shows: static hero image, headline, tagline, CTAs (no effects)
- Error boundary SHALL log to analytics: `arcade_error_boundary_triggered`

### Boot Sequence Errors
- If boot sequence animation fails, auto-skip to dashboard after 2 seconds
- If requestAnimationFrame is unavailable, skip boot entirely
- Boot timeout: 5000ms hard limit, auto-complete if exceeded

### LiveDemo Failure States (P0)
- IF LiveDemo canvas fails to initialize THEN display static fallback image with "Demo loading..." overlay
- IF LiveDemo network request fails THEN retry 2x with exponential backoff (1s, 2s), then show static placeholder
- Static placeholder: Screenshot of gameplay with "Live demo unavailable" badge
- Fallback image path: `/assets/landing/demo-fallback.webp`

### SVG Filter Fallback Cascade (P0)
- WHEN device is iOS Safari 18.x THEN barrel distortion SHALL use CSS fallback (border-radius hack)
- WHEN feDisplacementMap is unsupported THEN barrel distortion SHALL use CSS fallback
- WHEN feGaussianBlur is unsupported THEN phosphor glow SHALL use CSS box-shadow fallback
- Detection runs once on mount, result cached in useSVGFilterSupport hook

### Auth State Race Condition (P0)
- Boot sequence SHALL NOT block on auth state resolution
- IF auth state changes during boot THEN CTA text SHALL update reactively after dashboard renders
- IF auth state is undefined at CTA click THEN default to unauthenticated behavior ('/instant-play', '/register')
- Auth state subscription via useAuthStore selector, not blocking fetch

### Navigation Errors
- If navigation fails, show toast notification and retry option
- If auth state is undefined during CTA click, default to unauthenticated behavior

### Performance Degradation (P0)
- useFPSMonitor hook tracks frame rate continuously
- IF frame rate drops below 30fps for 2+ seconds THEN auto-degrade effects:
  1. Disable flicker immediately
  2. Reduce scanline intensity to 0.05
  3. Disable phosphor glow
  4. Log to analytics: `arcade_performance_degraded`
- IF device has low memory (navigator.deviceMemory < 4), start with reduced effects

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests:

**Unit Tests** verify specific examples:
- Boot sequence renders initial state correctly
- Skip button is visible and clickable
- CRT frame SVG renders with expected structure
- Dashboard shows correct CTA text based on auth state

**Property-Based Tests** verify universal properties using `fast-check`:
- Aspect ratio is always within valid range across random viewport sizes
- Boot progress always increases monotonically
- Navigation always goes to correct route based on auth state
- All interactive elements meet minimum touch target size

### Testing Framework
- **Unit Tests**: Vitest + React Testing Library
- **Property Tests**: fast-check (JavaScript property-based testing library)
- **Visual Regression**: Optional Playwright screenshots for CRT effects

### Test File Structure
```
frontend/src/components/landing/arcade/__tests__/
├── ArcadeLanding.test.tsx       # Integration tests
├── ArcadeLandingErrorBoundary.test.tsx # Error boundary tests
├── BootSequence.test.tsx        # Boot animation tests
├── CRTMonitor.test.tsx          # Frame rendering tests
├── DashboardUI.test.tsx         # Content and CTA tests
├── properties/
│   ├── aspect-ratio.property.ts # Property 1
│   ├── boot-sequence.property.ts # Properties 2-5
│   ├── accessibility.property.ts # Properties 9-10
│   ├── navigation.property.ts   # Properties 7-8
│   ├── performance.property.ts  # Property 13
│   ├── svg-fallback.property.ts # Property 14
│   └── error-boundary.property.ts # Property 15
└── hooks/
    ├── useBootSequence.test.ts
    ├── useCRTEffects.test.ts
    ├── useFPSMonitor.test.ts
    └── useSVGFilterSupport.test.ts
```

### Property Test Configuration
- Minimum 100 iterations per property test
- Each test tagged with: `**Feature: crt-arcade-landing, Property {N}: {description}**`

### Visual Regression Tests (Playwright)
- Capture baseline screenshots at: boot-start, boot-50%, boot-complete, dashboard-idle
- Breakpoints: 375px (iPhone SE), 768px (iPad), 1440px (Desktop)
- Reduced motion: separate baseline set
- iOS Safari 18: separate baseline for CSS fallback effects

### Performance Budget
| Metric | Target | Measurement |
|--------|--------|-------------|
| LCP | <2.5s | Lighthouse CI |
| FCP | <1.8s | Lighthouse CI |
| CLS | <0.1 | Lighthouse CI |
| TTI | <3.0s | WebPageTest 3G |
| FPS (effects) | ≥55fps | useFPSMonitor |
| Boot duration | ≤5000ms | Analytics |

### E2E Test Requirements (Playwright)
```typescript
// Required E2E tests
test('boot sequence completes within 5s and shows dashboard');
test('skip button works with keyboard (Space, Enter, Escape)');
test('reduced motion disables animations and skips boot');
test('iOS Safari 18 uses CSS fallback for barrel distortion');
test('error boundary catches errors and shows fallback');
test('CTAs navigate correctly based on auth state');
```
