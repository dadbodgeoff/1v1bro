/**
 * TypeScript types for CRT Arcade Landing Page
 * 
 * @module landing/arcade/types
 */

import type { ReactNode } from 'react';

// ============================================
// Boot Sequence Types
// ============================================

/** Boot sequence phases */
export type BootPhase = 'off' | 'powering-on' | 'booting' | 'ready' | 'complete';

/** Boot sequence state machine */
export interface BootSequenceState {
  phase: BootPhase;
  currentLine: number;
  progress: number;
  isSkipped: boolean;
  startTime: number | null;
}

// ============================================
// CRT Effects Types
// ============================================

/** Barrel distortion rendering mode */
export type BarrelDistortionMode = 'svg-filter' | 'css-border-radius-hack' | 'none';

/** Phosphor glow rendering mode */
export type PhosphorGlowMode = 'svg-filter' | 'css-box-shadow' | 'none';

/** CRT visual effects configuration */
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
  barrelDistortionMode: BarrelDistortionMode;
  phosphorGlowMode: PhosphorGlowMode;
}

// ============================================
// Performance Monitoring Types
// ============================================

/** FPS monitor state */
export interface FPSMonitorState {
  currentFPS: number;
  averageFPS: number;
  isPerformanceDegraded: boolean; // true if <30fps for 2+ seconds
  degradeEffects: () => void; // Auto-called when degraded
}

/** SVG filter support detection */
export interface SVGFilterSupport {
  feDisplacementMap: boolean;
  feGaussianBlur: boolean;
  isIOSSafari18: boolean;
  recommendedBarrelMode: BarrelDistortionMode;
  recommendedGlowMode: PhosphorGlowMode;
}

// ============================================
// Component Props Types
// ============================================

/** Main ArcadeLanding page props */
export interface ArcadeLandingProps {
  /** Skip boot sequence and show dashboard immediately */
  skipBoot?: boolean;
  /** Callback when boot sequence completes */
  onBootComplete?: () => void;
}

/** CRT Monitor frame props */
export interface CRTMonitorProps {
  children: ReactNode;
  /** Show power LED */
  showPowerLED?: boolean;
  /** LED color (defaults to brand orange) */
  ledColor?: string;
  /** Responsive breakpoint mode */
  mode?: 'mobile' | 'tablet' | 'desktop';
  /** Whether the monitor is powered on */
  isPoweredOn?: boolean;
}

/** CRT Screen container props */
export interface CRTScreenProps {
  children: ReactNode;
  /** Apply barrel distortion effect */
  barrelDistortion?: boolean;
  /** Distortion mode for fallback */
  distortionMode?: BarrelDistortionMode;
}

/** Boot sequence props */
export interface BootSequenceProps {
  /** Called when boot completes or is skipped */
  onComplete: () => void;
  /** Boot text lines to display */
  bootLines?: string[];
  /** Total boot duration in ms */
  duration?: number;
}

/** Boot text line props */
export interface BootTextProps {
  /** Lines to display */
  lines: string[];
  /** Current line index */
  currentLine: number;
  /** Whether typing animation is active */
  isTyping?: boolean;
}

/** Boot progress bar props */
export interface BootProgressProps {
  /** Progress value 0-100 */
  progress: number;
  /** Whether to show the progress bar */
  visible?: boolean;
}

/** Boot logo props */
export interface BootLogoProps {
  /** Whether to show the logo */
  visible?: boolean;
  /** Animation delay in ms */
  delay?: number;
}

/** CRT effects layer props */
export interface CRTEffectsProps {
  config: CRTEffectsConfig;
  /** Reduced motion preference */
  reducedMotion?: boolean;
}

/** Scanlines overlay props */
export interface ScanlinesProps {
  /** Intensity 0-1 */
  intensity?: number;
  /** Whether scanlines are enabled */
  enabled?: boolean;
}

/** Phosphor glow props */
export interface PhosphorGlowProps {
  /** Glow intensity 0-1 */
  intensity?: number;
  /** Rendering mode */
  mode?: PhosphorGlowMode;
}

/** Screen flicker props */
export interface ScreenFlickerProps {
  /** Whether flicker is enabled */
  enabled?: boolean;
  /** Average frequency in seconds */
  frequency?: number;
}

/** Barrel distortion props */
export interface BarrelDistortionProps {
  /** Distortion amount 0-1 */
  amount?: number;
  /** Rendering mode */
  mode?: BarrelDistortionMode;
}

/** Dashboard UI layout props */
export interface DashboardUIProps {
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Primary CTA click handler */
  onPrimaryCTA: () => void;
  /** Secondary CTA click handler */
  onSecondaryCTA: () => void;
  /** Whether to show stagger animation */
  animate?: boolean;
}

/** Arcade headline props */
export interface ArcadeHeadlineProps {
  /** Headline text */
  text?: string;
  /** Tagline text */
  tagline?: string;
  /** Whether to animate */
  animate?: boolean;
}

/** Arcade CTA button props */
export interface ArcadeCTAProps {
  /** Button variant */
  variant: 'primary' | 'secondary';
  /** Button text */
  children: ReactNode;
  /** Click handler */
  onClick: () => void;
  /** Whether button is disabled */
  disabled?: boolean;
  /** ARIA label */
  ariaLabel?: string;
  /** Mouse enter handler for hover sound */
  onMouseEnter?: () => void;
}

/** Demo container props */
export interface DemoContainerProps {
  /** Whether demo failed to load */
  hasFailed?: boolean;
  /** Fallback image URL */
  fallbackImage?: string;
}

/** Power indicator LED props */
export interface PowerIndicatorProps {
  /** Whether LED is on */
  isOn?: boolean;
  /** LED color */
  color?: string;
  /** Glow color */
  glowColor?: string;
}

// ============================================
// Sound Types
// ============================================

/** Sound synthesis configuration */
export interface SoundConfig {
  type: OscillatorType;
  frequency?: number;
  frequencyEnd?: number;
  notes?: number[];
  noteDuration?: number;
  duration: number;
  gain: number;
}

/** Arcade sound hook interface */
export interface ArcadeSoundHook {
  isMuted: boolean;
  setMuted: (muted: boolean) => void;
  playStartupChime: () => void;
  playHoverBlip: () => void;
  playClickBlip: () => void;
}

// ============================================
// Analytics Types
// ============================================

/** Analytics event names */
export type ArcadeAnalyticsEvent =
  | 'arcade_boot_start'
  | 'arcade_boot_phase'
  | 'arcade_boot_skip'
  | 'arcade_boot_complete'
  | 'arcade_cta_visible'
  | 'arcade_cta_click'
  | 'arcade_press_start_shown'
  | 'arcade_performance_degraded'
  | 'arcade_error_boundary_triggered'
  | 'arcade_svg_fallback_used';

/** Analytics event payload */
export interface ArcadeAnalyticsPayload {
  phase?: BootPhase;
  phase_at_skip?: BootPhase;
  time_elapsed_ms?: number;
  total_duration_ms?: number;
  was_skipped?: boolean;
  time_since_boot_ms?: number;
  cta_type?: 'primary' | 'secondary' | 'press_start_keyboard';
  is_authenticated?: boolean;
  fps_at_trigger?: number;
  effects_disabled?: string[];
  error_message?: string;
  effect?: string;
  fallback_mode?: string;
  reason?: string;
  key_pressed?: string;
  delay_ms?: number;
}
