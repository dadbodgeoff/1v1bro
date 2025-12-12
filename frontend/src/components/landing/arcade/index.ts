/**
 * CRT Arcade Landing Page Components
 * 
 * A retro CRT monitor-themed landing page experience with boot sequence,
 * visual effects, and live gameplay demo.
 * 
 * Tier-1 "Hyper-CRT" implementation includes:
 * - Advanced SVG filter pipeline (bloom, chromatic aberration, gamma)
 * - Verlet integration particle system with object pooling
 * - Handshake boot sequence (phosphor warmup, interlaced, shockwave)
 * - Always-on micro-interactions (phosphor decay, signal noise, sub-pixel jitter)
 * 
 * @module landing/arcade
 */

// Main page components
export { ArcadeLanding } from './ArcadeLanding';
export { HyperCRTArcade } from './HyperCRTArcade';
export { ArcadeLandingPage } from './ArcadeLandingPage'; // The Chassis - production ready
export type { ArcadeLandingProps } from './types';
export type { ArcadeLandingPageProps } from './ArcadeLandingPage';

// CRT Monitor components
export { CRTMonitor } from './CRTMonitor';
export { CRTScreen } from './CRTMonitor/CRTScreen';
export { CRTBezel } from './CRTMonitor/CRTBezel';
export { PowerIndicator } from './CRTMonitor/PowerIndicator';

// Boot sequence components
export { BootSequence } from './BootSequence';
export { BootText } from './BootSequence/BootText';
export { BootProgress } from './BootSequence/BootProgress';
export { BootLogo } from './BootSequence/BootLogo';
export { HandshakeBootSequence } from './BootSequence/HandshakeBootSequence';
export type { HandshakeStage, HandshakeBootProps } from './BootSequence/HandshakeBootSequence';

// CRT effects components
export { CRTEffects } from './CRTEffects';
export { Scanlines } from './CRTEffects/Scanlines';
export { PhosphorGlow } from './CRTEffects/PhosphorGlow';
export { BarrelDistortion } from './CRTEffects/BarrelDistortion';
export { ScreenFlicker } from './CRTEffects/ScreenFlicker';
export { HyperCRTFilterPipeline } from './CRTEffects/HyperCRTFilterPipeline';
export type { HyperCRTFilterProps } from './CRTEffects/HyperCRTFilterPipeline';

// Particle system
export { useVerletParticles, VerletParticleRenderer } from './particles/VerletParticleSystem';
export type { VerletParticleConfig, ParticleEmitOptions } from './particles/VerletParticleSystem';

// Dashboard UI components
export { DashboardUI } from './DashboardUI';
export { ArcadeHeadline } from './DashboardUI/ArcadeHeadline';
export { ArcadeCTA } from './DashboardUI/ArcadeCTA';
export { DemoContainer } from './DashboardUI/DemoContainer';

// Error handling
export { ArcadeLandingErrorBoundary } from './ArcadeLandingErrorBoundary';
export { StaticLandingFallback } from './StaticLandingFallback';

// Hooks
export { useBootSequence } from './hooks/useBootSequence';
export { useCRTEffects } from './hooks/useCRTEffects';
export { useArcadeSound } from './hooks/useArcadeSound';
export { useReducedMotion } from './hooks/useReducedMotion';
export { useFPSMonitor } from './hooks/useFPSMonitor';
export { useSVGFilterSupport } from './hooks/useSVGFilterSupport';

// Types
export type {
  BootPhase,
  BootSequenceState,
  CRTEffectsConfig,
  FPSMonitorState,
  SVGFilterSupport,
  CRTMonitorProps,
  BootSequenceProps,
  CRTEffectsProps,
  DashboardUIProps,
  ArcadeSoundHook,
} from './types';

// Constants
export {
  BOOT_LINES,
  BOOT_TIMING,
  CRT_DEFAULTS,
  ARCADE_CONTENT,
  ARCADE_COLORS,
  PERFORMANCE_THRESHOLDS,
  ANALYTICS_EVENTS,
} from './constants';
