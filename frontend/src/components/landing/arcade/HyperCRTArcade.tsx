/**
 * HyperCRTArcade - Tier-1 CRT Arcade Landing Page
 * 
 * Orchestrates all advanced visual effects:
 * - Hyper-CRT SVG filter pipeline (bloom, chromatic aberration, gamma)
 * - Verlet integration particle system
 * - Handshake boot sequence (phosphor warmup, interlaced, shockwave)
 * - Always-on micro-interactions (phosphor decay, signal noise, sub-pixel jitter)
 * 
 * Performance optimizations:
 * - GPU composition via will-change and translate3d
 * - requestAnimationFrame with delta-time integration
 * - Object pooling for particles (Float32Array)
 * - Automatic effect degradation on low FPS
 * 
 * @module landing/arcade/HyperCRTArcade
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { trackEvent } from '@/services/analytics';
import { cn } from '@/utils/helpers';

// Components
import { CRTMonitor } from './CRTMonitor';
import { DashboardUI } from './DashboardUI';
import { HyperCRTFilterPipeline } from './CRTEffects/HyperCRTFilterPipeline';
import { HandshakeBootSequence } from './BootSequence/HandshakeBootSequence';
import { useVerletParticles, VerletParticleRenderer } from './particles/VerletParticleSystem';

// Hooks
import { useArcadeSound } from './hooks/useArcadeSound';
import { useReducedMotion } from './hooks/useReducedMotion';

// Constants & Types
import { ANALYTICS_EVENTS, PERFORMANCE_THRESHOLDS } from './constants';
import type { ArcadeLandingProps } from './types';

// Styles
import './styles/arcade.css';
import './styles/hyper-crt.css';

// ============================================
// Performance Monitor Hook
// ============================================

interface PerformanceState {
  fps: number;
  isDegraded: boolean;
  frameCount: number;
}

function usePerformanceMonitor(onDegrade: () => void) {
  const [state, setState] = useState<PerformanceState>({
    fps: 60,
    isDegraded: false,
    frameCount: 0,
  });
  
  const frameTimesRef = useRef<number[]>([]);
  const lastFrameRef = useRef<number>(performance.now());
  const degradeTimeRef = useRef<number>(0);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const measureFPS = (timestamp: number) => {
      const delta = timestamp - lastFrameRef.current;
      lastFrameRef.current = timestamp;

      // Track frame times (rolling window of 30 frames)
      frameTimesRef.current.push(delta);
      if (frameTimesRef.current.length > 30) {
        frameTimesRef.current.shift();
      }

      // Calculate average FPS
      const avgDelta = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
      const fps = Math.round(1000 / avgDelta);

      // Check for degradation
      if (fps < PERFORMANCE_THRESHOLDS.minAcceptableFPS) {
        degradeTimeRef.current += delta;
        if (degradeTimeRef.current > PERFORMANCE_THRESHOLDS.degradationTriggerSeconds * 1000) {
          if (!state.isDegraded) {
            onDegrade();
            setState(prev => ({ ...prev, isDegraded: true }));
          }
        }
      } else {
        degradeTimeRef.current = 0;
      }

      setState(prev => ({
        ...prev,
        fps,
        frameCount: prev.frameCount + 1,
      }));

      animationRef.current = requestAnimationFrame(measureFPS);
    };

    animationRef.current = requestAnimationFrame(measureFPS);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [onDegrade, state.isDegraded]);

  return state;
}

// ============================================
// Sub-Pixel Jitter Hook
// ============================================

function useSubPixelJitter(enabled: boolean) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const frameRef = useRef<number>(0);
  const frameCountRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setOffset({ x: 0, y: 0 });
      return;
    }

    const jitter = () => {
      frameCountRef.current++;
      
      // Update jitter every 3-5 frames for subtle effect
      if (frameCountRef.current % (3 + Math.floor(Math.random() * 3)) === 0) {
        setOffset({
          x: (Math.random() - 0.5) * 1, // ±0.5px
          y: (Math.random() - 0.5) * 0.5, // ±0.25px
        });
      }

      frameRef.current = requestAnimationFrame(jitter);
    };

    frameRef.current = requestAnimationFrame(jitter);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [enabled]);

  return offset;
}

// ============================================
// Main Component
// ============================================

export function HyperCRTArcade({
  skipBoot: skipBootProp = false,
  onBootComplete,
}: ArcadeLandingProps) {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => !!state.user);
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<[number, number]>([800, 600]);

  // Skip boot if reduced motion is preferred
  const skipBoot = skipBootProp || reducedMotion;

  // Boot sequence state
  const [bootComplete, setBootComplete] = useState(skipBoot);
  const [chromaticBurst, setChromaticBurst] = useState(false);

  // Sound effects
  const sound = useArcadeSound();

  // Performance monitoring with auto-degradation
  const handlePerformanceDegrade = useCallback(() => {
    trackEvent(ANALYTICS_EVENTS.performanceDegraded, {
      effects_disabled: ['particles', 'chromatic', 'vhold'],
    });
  }, []);

  const performance = usePerformanceMonitor(handlePerformanceDegrade);

  // Sub-pixel jitter for analog instability
  const jitterOffset = useSubPixelJitter(!reducedMotion && !performance.isDegraded);

  // Particle system for ambient effects (with Akira-style motion trails)
  const particles = useVerletParticles({
    maxParticles: performance.isDegraded ? 50 : 150,
    gravity: 0.05,
    friction: 0.99,
    bounce: 0.3,
    lifetime: 4000,
    bounds: dimensions,
    reducedMotion,
    enableTrails: !performance.isDegraded, // Akira bike-style motion trails
    trailLength: 6, // 6 historical positions per particle
  });

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions([rect.width, rect.height]);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Ambient particle emission
  useEffect(() => {
    if (reducedMotion || !bootComplete || performance.isDegraded) return;

    const emitAmbient = () => {
      // Emit from random edge positions
      const edge = Math.floor(Math.random() * 4);
      const [w, h] = dimensions;
      let pos: [number, number];
      let vel: [number, number];

      switch (edge) {
        case 0: // Top
          pos = [Math.random() * w, 0];
          vel = [0, 2];
          break;
        case 1: // Right
          pos = [w, Math.random() * h];
          vel = [-2, 0];
          break;
        case 2: // Bottom
          pos = [Math.random() * w, h];
          vel = [0, -2];
          break;
        default: // Left
          pos = [0, Math.random() * h];
          vel = [2, 0];
      }

      particles.emit({
        position: pos,
        velocity: vel,
        count: 1,
        spread: Math.PI / 4,
        speed: 1,
      });
    };

    const interval = setInterval(emitAmbient, 500);
    return () => clearInterval(interval);
  }, [reducedMotion, bootComplete, performance.isDegraded, dimensions, particles]);

  // Boot complete handler
  const handleBootComplete = useCallback(() => {
    setBootComplete(true);
    
    // Trigger chromatic burst on boot complete
    setChromaticBurst(true);
    setTimeout(() => setChromaticBurst(false), 200);

    // Emit particle burst from center
    particles.emitBurst(
      [dimensions[0] / 2, dimensions[1] / 2],
      40,
      6
    );

    sound.playStartupChime();
    onBootComplete?.();
  }, [dimensions, particles, sound, onBootComplete]);

  // Navigation handlers
  const handlePrimaryCTA = useCallback(() => {
    sound.playClickBlip();
    
    // Chromatic burst on click
    setChromaticBurst(true);
    setTimeout(() => setChromaticBurst(false), 150);

    trackEvent(ANALYTICS_EVENTS.ctaClick, {
      cta_type: 'primary',
      is_authenticated: isAuthenticated,
    });
    navigate(isAuthenticated ? '/dashboard' : '/instant-play');
  }, [navigate, isAuthenticated, sound]);

  const handleSecondaryCTA = useCallback(() => {
    sound.playClickBlip();
    trackEvent(ANALYTICS_EVENTS.ctaClick, {
      cta_type: 'secondary',
      is_authenticated: isAuthenticated,
    });
    navigate(isAuthenticated ? '/dashboard' : '/register');
  }, [navigate, isAuthenticated, sound]);

  // Sound toggle handler
  const handleSoundToggle = useCallback(() => {
    sound.setMuted(!sound.isMuted);
  }, [sound]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'arcade-landing',
        'hyper-crt-container',
        performance.isDegraded && 'hyper-crt--degraded'
      )}
      style={{
        // Apply sub-pixel jitter to entire viewport
        transform: `translate3d(${jitterOffset.x}px, ${jitterOffset.y}px, 0)`,
      }}
    >
      {/* SVG Filter Definitions */}
      <HyperCRTFilterPipeline
        enableBloom={!performance.isDegraded}
        bloomIntensity={0.5}
        enableVHold={!performance.isDegraded && !reducedMotion}
        vHoldIntensity={0.2}
        enableChromaticAberration={!performance.isDegraded}
        chromaticOffset={1.5}
        enableGammaCorrection={true}
        gamma={1.15}
        reducedMotion={reducedMotion}
        triggerChromaticBurst={chromaticBurst}
      />

      {/* Background layers */}
      <div className="arcade-room-bg" aria-hidden="true" />
      <div className="arcade-wall" aria-hidden="true" />
      <div className="arcade-floor" aria-hidden="true" />
      <div className="arcade-spotlight" aria-hidden="true" />

      {/* Distant cabinet silhouettes */}
      {!reducedMotion && (
        <div className="arcade-silhouettes" aria-hidden="true">
          <div className="arcade-silhouette arcade-silhouette--left" />
          <div className="arcade-silhouette arcade-silhouette--right" />
        </div>
      )}

      {/* Atmospheric haze */}
      {!reducedMotion && <div className="arcade-haze" aria-hidden="true" />}

      {/* Neon accent lines */}
      {!reducedMotion && (
        <div className="arcade-neon-accents" aria-hidden="true">
          <div className="neon-line neon-line--top" />
          <div className="neon-line neon-line--left" />
          <div className="neon-line neon-line--right" />
        </div>
      )}

      {/* CRT Monitor with Hyper effects */}
      <CRTMonitor isPoweredOn={bootComplete || !skipBoot}>
        {/* Always-on micro-interactions layer */}
        {!reducedMotion && !performance.isDegraded && (
          <>
            {/* Physical Scanlines (CRT phosphor rows) */}
            <div className="hyper-crt-scanlines hyper-crt-layer" aria-hidden="true" />
            
            {/* SVG Scanline pattern for feDisplacementMap interaction */}
            <svg 
              className="hyper-crt-scanlines-svg hyper-crt-layer" 
              aria-hidden="true"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            >
              <defs>
                <pattern 
                  id="scanlines-pattern" 
                  patternUnits="userSpaceOnUse" 
                  width="1" 
                  height="4"
                >
                  <rect width="1" height="2" fill="black" fillOpacity="0.2" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#scanlines-pattern)" />
            </svg>
            
            {/* Scanline Moiré (interference with scanlines) */}
            <div className="hyper-crt-moire hyper-crt-layer" aria-hidden="true" />
            
            {/* Phosphor Decay */}
            <div className="hyper-crt-phosphor-decay hyper-crt-layer" aria-hidden="true" />
            
            {/* Signal Noise */}
            <div className="hyper-crt-signal-noise hyper-crt-layer" aria-hidden="true" />
            <div className="hyper-crt-signal-burst hyper-crt-layer" aria-hidden="true" />
            
            {/* V-Hold Glitch */}
            <div className="hyper-crt-vhold-glitch hyper-crt-layer" aria-hidden="true" />
          </>
        )}

        {/* Chromatic aberration CSS fallback */}
        <div
          className={cn(
            'hyper-crt-chromatic-css',
            chromaticBurst && 'hyper-crt-chromatic-css--burst'
          )}
          aria-hidden="true"
        />

        {/* Handshake Boot Sequence */}
        {!bootComplete && (
          <HandshakeBootSequence
            skip={skipBoot}
            onComplete={handleBootComplete}
            reducedMotion={reducedMotion}
            dimensions={dimensions}
          />
        )}

        {/* Dashboard UI (shows after boot) */}
        {bootComplete && (
          <DashboardUI
            isAuthenticated={isAuthenticated}
            onPrimaryCTA={handlePrimaryCTA}
            onSecondaryCTA={handleSecondaryCTA}
            animate={!reducedMotion}
            onHoverSound={() => sound.playHoverBlip()}
          />
        )}

        {/* Verlet Particle System */}
        <VerletParticleRenderer particles={particles} />

        {/* Sound Toggle */}
        <button
          className="sound-toggle"
          onClick={handleSoundToggle}
          aria-label={sound.isMuted ? 'Unmute sound' : 'Mute sound'}
          onMouseEnter={() => sound.playHoverBlip()}
        >
          {sound.isMuted ? '🔇' : '🔊'}
        </button>
      </CRTMonitor>

      {/* Performance indicator (dev only) */}
      {import.meta.env.DEV && (
        <div
          style={{
            position: 'fixed',
            bottom: 8,
            left: 8,
            padding: '4px 8px',
            background: 'rgba(0,0,0,0.8)',
            color: performance.fps < 30 ? '#ef4444' : '#22c55e',
            fontSize: 10,
            fontFamily: 'monospace',
            borderRadius: 4,
            zIndex: 9999,
          }}
        >
          {performance.fps} FPS {performance.isDegraded && '(DEGRADED)'}
        </div>
      )}
    </div>
  );
}

export default HyperCRTArcade;
