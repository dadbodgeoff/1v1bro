/**
 * Constants for CRT Arcade Landing Page
 * 
 * This file serves as the centralized configuration for the arcade landing page.
 * All values are intentionally defined here for easy customization.
 * 
 * Colors reference tokens.css where possible via ARCADE_COLORS.
 * Typography values are documented to match BRAND_SYSTEM.md.
 * 
 * @module landing/arcade/constants
 */

import type { CRTEffectsConfig, SoundConfig } from './types';

// ============================================
// SVG Filter Support Detection
// ============================================

export const SVG_FILTER_SUPPORT = {
  feDisplacementMap: typeof window !== 'undefined' && typeof SVGFEDisplacementMapElement !== 'undefined',
  feGaussianBlur: typeof window !== 'undefined' && typeof SVGFEGaussianBlurElement !== 'undefined',
  /** iOS Safari 18.0-18.2 has feDisplacementMap rendering bugs */
  isIOSSafari18: (): boolean => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent;
    return ua.includes('Safari') && !ua.includes('Chrome') && /Version\/18/.test(ua);
  },
};

// ============================================
// Effect Fallback Cascade
// ============================================

export const EFFECT_FALLBACK_CASCADE = {
  barrelDistortion: {
    primary: 'svg-filter' as const,
    fallback1: 'css-border-radius-hack' as const,
    fallback2: 'none' as const,
  },
  phosphorGlow: {
    primary: 'svg-filter' as const,
    fallback1: 'css-box-shadow' as const,
    fallback2: 'none' as const,
  },
  scanlines: {
    primary: 'css-repeating-gradient' as const,
    fallback1: 'none' as const,
  },
};

// ============================================
// Performance Thresholds
// ============================================

export const PERFORMANCE_THRESHOLDS = {
  minAcceptableFPS: 30,
  targetFPS: 55,
  degradationTriggerSeconds: 2,
  fpsCheckIntervalMs: 500,
};

// ============================================
// Boot Sequence Configuration
// ============================================

export const BOOT_LINES = [
  'BIOS v3.0.1 ................ OK',
  'MEMORY TEST: 16384K ........ OK',
  'INITIALIZING ARENA CORE',
  'LOADING COMBAT ENGINE ...... OK',
  'NEURAL MATCHMAKING ......... ONLINE',
  'TRIVIA DATABASE ............ SYNCED',
  'WEAPONS SYSTEMS ............ ARMED',
  'LEADERBOARDS ............... CONNECTED',
  '',
  '>>> ALL SYSTEMS NOMINAL <<<',
];

export const BOOT_TIMING = {
  powerOnDelay: 300,      // ms before boot text starts
  lineDelay: 400,         // ms between each boot line
  lineTypeDuration: 200,  // ms to "type" each line
  logoRevealDelay: 500,   // ms after last line before logo
  progressDuration: 1000, // ms for progress bar to fill
  totalDuration: 4500,    // max total boot time
};

// ============================================
// CRT Effects Defaults
// ============================================

export const CRT_DEFAULTS: CRTEffectsConfig = {
  scanlines: true,
  scanlineIntensity: 0.15,
  phosphorGlow: true,
  glowIntensity: 0.4,
  barrelDistortion: true,
  distortionAmount: 0.02,
  flicker: true,
  flickerFrequency: 15,
  barrelDistortionMode: 'svg-filter',
  phosphorGlowMode: 'svg-filter',
};

/** Reduced effects for performance degradation */
export const CRT_DEGRADED: Partial<CRTEffectsConfig> = {
  flicker: false,
  scanlineIntensity: 0.05,
  phosphorGlow: false,
};

// ============================================
// Content Strings
// ============================================

export const ARCADE_CONTENT = {
  headline: 'ENTER THE ARENA',
  tagline: 'Trivia Duels With Real-Time Combat',
  primaryCTA: 'PLAY NOW',
  primaryCTAAuth: 'ENTER ARENA',
  secondaryCTA: 'CREATE ACCOUNT',
  secondaryCTAAuth: 'DASHBOARD',
  pressStart: 'PRESS START',
  skipButton: 'SKIP →',
  liveIndicator: 'LIVE',
  demoUnavailable: 'Live demo unavailable',
};

// ============================================
// Colors (from tokens.css)
// ============================================

export const ARCADE_COLORS = {
  // Screen and bezel
  screenBg: '#09090B',           // --color-bg-base
  bezelDark: '#111111',          // --color-bg-card
  bezelLight: '#1A1A1A',         // --color-bg-elevated
  bezelHighlight: '#2a2a2a',
  pageBackground: '#000000',
  
  // Brand orange family
  ledOff: '#331a00',
  ledOn: '#F97316',              // --color-brand
  ledGlow: 'rgba(249, 115, 22, 0.6)',
  
  // Effects
  scanlineColor: 'rgba(0, 0, 0, 0.15)',
  phosphorOrange: 'rgba(249, 115, 22, 0.3)',
  textGlow: 'rgba(249, 115, 22, 0.8)',
  
  // Text colors
  textPrimary: '#FFFFFF',        // --color-text-primary
  textSecondary: '#B4B4B4',      // --color-text-secondary
  textMuted: '#737373',          // --color-text-muted
  
  // CTA colors
  ctaPrimary: '#F97316',         // --color-brand
  ctaPrimaryHover: '#FB923C',    // --color-brand-light
  ctaSecondaryBorder: 'rgba(255, 255, 255, 0.16)',
  
  // Live indicator
  liveGreen: '#10B981',          // --color-accent-success
};

// ============================================
// Typography (from BRAND_SYSTEM.md)
// ============================================

export const ARCADE_TYPOGRAPHY = {
  bootText: {
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: '14px',
    fontWeight: 500,
    letterSpacing: '0.05em',
    lineHeight: 1.6,
  },
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
  },
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
  },
  ctaText: {
    fontFamily: "'Inter', sans-serif",
    fontSize: '18px',
    fontWeight: 700,
    letterSpacing: '0.02em',
  },
};

// ============================================
// Animation Choreography
// ============================================

export const ANIMATION_CHOREOGRAPHY = {
  powerOn: {
    duration: 600,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  typewriter: {
    charDelay: 30,
    lineDelay: 400,
    cursorBlink: 530,
  },
  logoReveal: {
    duration: 800,
    delay: 200,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  dashboardStagger: {
    baseDelay: 100,
    staggerDelay: 80,
    duration: 400,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  ctaHover: {
    duration: 200,
    transform: 'translateY(-2px)',
    glowIntensify: 1.5,
  },
  ctaPress: {
    duration: 100,
    transform: 'scale(0.97)',
  },
  flicker: {
    minInterval: 10000,
    maxInterval: 30000,
    duration: 150,
    opacityDip: 0.85,
  },
};

// ============================================
// Bezel Design
// ============================================

export const BEZEL_DESIGN = {
  frame: {
    borderRadius: '24px',
    padding: {
      mobile: '8px',
      tablet: '16px',
      desktop: '24px',
    },
  },
  screenInset: {
    borderRadius: '8px',
  },
  vents: {
    count: 6,
    width: '40px',
    height: '4px',
    gap: '6px',
  },
  brandBadge: {
    width: '80px',
    height: '20px',
    text: '1v1 BRO',
    fontSize: '10px',
  },
  powerLED: {
    size: '8px',
    glowRadius: '12px',
    pulseDuration: 2000,
  },
};

// ============================================
// Responsive Breakpoints
// ============================================

export const RESPONSIVE_BREAKPOINTS = {
  mobile: { maxWidth: 767 },
  tablet: { minWidth: 768, maxWidth: 1023 },
  desktop: { minWidth: 1024 },
};

export const RESPONSIVE_BEHAVIORS = {
  mobile: {
    bezelPadding: '8px',
    bezelRadius: '16px',
    showVents: false,
    showBrandBadge: false,
    headlineSize: '48px',
    layoutDirection: 'column' as const,
    ctaLayout: 'stacked' as const,
  },
  tablet: {
    bezelPadding: '16px',
    bezelRadius: '20px',
    showVents: false,
    showBrandBadge: true,
    headlineSize: '64px',
    layoutDirection: 'column' as const,
    ctaLayout: 'row' as const,
  },
  desktop: {
    bezelPadding: '24px',
    bezelRadius: '24px',
    showVents: true,
    showBrandBadge: true,
    headlineSize: '80px',
    layoutDirection: 'row' as const,
    ctaLayout: 'row' as const,
  },
};

// ============================================
// Sound Configuration
// ============================================

export const SOUND_CONFIG = {
  startupChime: {
    type: 'square' as OscillatorType,
    notes: [262, 330, 392, 523], // C4, E4, G4, C5
    noteDuration: 150,
    duration: 800,
    gain: 0.15,
  } as SoundConfig,
  hoverBlip: {
    type: 'sine' as OscillatorType,
    frequency: 880,
    duration: 50,
    gain: 0.08,
  } as SoundConfig,
  clickBlip: {
    type: 'square' as OscillatorType,
    frequency: 440,
    frequencyEnd: 660,
    duration: 80,
    gain: 0.12,
  } as SoundConfig,
};

// ============================================
// Analytics Events
// ============================================

export const ANALYTICS_EVENTS = {
  bootStart: 'arcade_boot_start',
  bootPhase: 'arcade_boot_phase',
  bootSkip: 'arcade_boot_skip',
  bootComplete: 'arcade_boot_complete',
  ctaVisible: 'arcade_cta_visible',
  ctaClick: 'arcade_cta_click',
  pressStartShown: 'arcade_press_start_shown',
  performanceDegraded: 'arcade_performance_degraded',
  errorBoundaryTriggered: 'arcade_error_boundary_triggered',
  svgFallbackUsed: 'arcade_svg_fallback_used',
} as const;

// ============================================
// Delight Details
// ============================================

export const DELIGHT_DETAILS = {
  terminalCursor: {
    character: '█',
    blinkRate: 530,
  },
  pressStart: {
    showAfter: 3000,
    blinkRate: 800,
    fontSize: '12px',
  },
  liveIndicator: {
    dotSize: '6px',
    pulseAnimation: true,
  },
  skipButton: {
    minHeight: '44px',
    minWidth: '44px',
    padding: '8px 16px',
  },
};
