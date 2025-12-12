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
│   └── useReducedMotion.ts     # Accessibility preference detection
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
  screenBg: '#0a0a0a',
  bezelDark: '#1a1a1a',
  bezelLight: '#2a2a2a',
  bezelHighlight: '#3a3a3a',
  ledOff: '#331a00',
  ledOn: '#F97316',
  ledGlow: 'rgba(249, 115, 22, 0.6)',
  scanlineColor: 'rgba(0, 0, 0, 0.15)',
  phosphorOrange: 'rgba(249, 115, 22, 0.3)',
  textGlow: 'rgba(249, 115, 22, 0.8)',
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

