/**
 * HandshakeBootSequence - Tier-1 BIOS-style boot animation
 * 
 * Three-stage boot process simulating authentic CRT power-on:
 * 
 * Stage 1: "Phosphor Warm-up"
 *   - Center-out white flash (radial gradient expansion)
 *   - Slow fade-in of UI elements
 * 
 * Stage 2: "Interlaced Loading"
 *   - Render UI in odd/even rows (1080i simulation)
 *   - Even rows first, odd rows 16ms later
 * 
 * Stage 3: "The Drop"
 *   - Shockwave displacement ripple through SVG text
 *   - Particle burst from center
 * 
 * @module landing/arcade/BootSequence/HandshakeBootSequence
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useVerletParticles, VerletParticleRenderer } from '../particles/VerletParticleSystem';

// ============================================
// Types
// ============================================

export type HandshakeStage = 
  | 'idle'
  | 'phosphor-warmup'
  | 'interlaced-loading'
  | 'the-drop'
  | 'complete';

export interface HandshakeBootProps {
  /** Skip boot sequence */
  skip?: boolean;
  /** Callback when boot completes */
  onComplete?: () => void;
  /** Callback when stage changes */
  onStageChange?: (stage: HandshakeStage) => void;
  /** Reduced motion preference */
  reducedMotion?: boolean;
  /** Container dimensions [width, height] */
  dimensions?: [number, number];
}

// ============================================
// Timing Constants
// ============================================

const STAGE_TIMING = {
  phosphorWarmup: {
    flashDuration: 200,
    expandDuration: 400,
    fadeInDelay: 300,
    totalDuration: 800,
  },
  interlacedLoading: {
    evenRowDelay: 0,
    oddRowDelay: 16, // 1 frame at 60fps
    rowFadeDuration: 200,
    totalDuration: 600,
  },
  theDrop: {
    shockwaveDelay: 100,
    shockwaveDuration: 500,
    particleBurstDelay: 50,
    totalDuration: 800,
  },
};

// ============================================
// Phosphor Warmup Component
// ============================================

interface PhosphorWarmupProps {
  active: boolean;
  onComplete: () => void;
}

function PhosphorWarmup({ active, onComplete }: PhosphorWarmupProps) {
  const [phase, setPhase] = useState<'flash' | 'expand' | 'fade' | 'done'>('flash');
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!active) {
      setPhase('flash');
      return;
    }

    // Flash phase
    const flashTimer = setTimeout(() => {
      setPhase('expand');
    }, STAGE_TIMING.phosphorWarmup.flashDuration);

    // Expand phase
    const expandTimer = setTimeout(() => {
      setPhase('fade');
    }, STAGE_TIMING.phosphorWarmup.flashDuration + STAGE_TIMING.phosphorWarmup.expandDuration);

    // Complete
    const completeTimer = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, STAGE_TIMING.phosphorWarmup.totalDuration);

    return () => {
      clearTimeout(flashTimer);
      clearTimeout(expandTimer);
      clearTimeout(completeTimer);
    };
  }, [active, onComplete]);

  if (!active || phase === 'done') return null;

  return (
    <div className="phosphor-warmup" aria-hidden="true">
      <svg
        ref={svgRef}
        className="phosphor-warmup-svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Radial gradient for center-out flash */}
          <radialGradient id="phosphor-flash-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity={phase === 'flash' ? 1 : 0.8}>
              <animate
                attributeName="stop-opacity"
                values="1;0.8;0"
                dur={`${STAGE_TIMING.phosphorWarmup.totalDuration}ms`}
                fill="freeze"
              />
            </stop>
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Expanding flash circle */}
        <circle
          cx="50"
          cy="50"
          r="5"
          fill="url(#phosphor-flash-gradient)"
          className={`phosphor-flash-circle phosphor-flash-circle--${phase}`}
        >
          <animate
            attributeName="r"
            values="5;80"
            dur={`${STAGE_TIMING.phosphorWarmup.expandDuration}ms`}
            begin={`${STAGE_TIMING.phosphorWarmup.flashDuration}ms`}
            fill="freeze"
          />
        </circle>

        {/* Horizontal scan line */}
        <line
          x1="0"
          y1="50"
          x2="100"
          y2="50"
          stroke="white"
          strokeWidth="2"
          opacity={phase === 'flash' ? 1 : 0}
          className="phosphor-scan-line"
        >
          <animate
            attributeName="opacity"
            values="1;0"
            dur={`${STAGE_TIMING.phosphorWarmup.flashDuration}ms`}
            fill="freeze"
          />
        </line>
      </svg>
    </div>
  );
}

// ============================================
// Interlaced Loading Component
// ============================================

interface InterlacedLoadingProps {
  active: boolean;
  onComplete: () => void;
  children: React.ReactNode;
}

function InterlacedLoading({ active, onComplete, children }: InterlacedLoadingProps) {
  const [evenRowsVisible, setEvenRowsVisible] = useState(false);
  const [oddRowsVisible, setOddRowsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) {
      setEvenRowsVisible(false);
      setOddRowsVisible(false);
      return;
    }

    // Show even rows first
    const evenTimer = setTimeout(() => {
      setEvenRowsVisible(true);
    }, STAGE_TIMING.interlacedLoading.evenRowDelay);

    // Show odd rows 16ms later (1 frame)
    const oddTimer = setTimeout(() => {
      setOddRowsVisible(true);
    }, STAGE_TIMING.interlacedLoading.oddRowDelay);

    // Complete
    const completeTimer = setTimeout(() => {
      onComplete();
    }, STAGE_TIMING.interlacedLoading.totalDuration);

    return () => {
      clearTimeout(evenTimer);
      clearTimeout(oddTimer);
      clearTimeout(completeTimer);
    };
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <div
      ref={containerRef}
      className="interlaced-loading"
      style={{
        // CSS mask for interlaced effect
        maskImage: evenRowsVisible && oddRowsVisible
          ? 'none'
          : evenRowsVisible
            ? 'repeating-linear-gradient(0deg, black 0px, black 1px, transparent 1px, transparent 2px)'
            : 'none',
        WebkitMaskImage: evenRowsVisible && oddRowsVisible
          ? 'none'
          : evenRowsVisible
            ? 'repeating-linear-gradient(0deg, black 0px, black 1px, transparent 1px, transparent 2px)'
            : 'none',
      }}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}

// ============================================
// The Drop (Shockwave) Component
// ============================================

interface TheDropProps {
  active: boolean;
  onComplete: () => void;
  dimensions: [number, number];
}

function TheDrop({ active, onComplete, dimensions }: TheDropProps) {
  const [shockwaveActive, setShockwaveActive] = useState(false);
  const [shockwaveScale, setShockwaveScale] = useState(0);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  // Particle system for burst effect
  const particles = useVerletParticles({
    maxParticles: 100,
    gravity: 0.1,
    friction: 0.96,
    bounce: 0.4,
    lifetime: 1500,
    bounds: dimensions,
    color: '#F97316',
  });

  // Animate shockwave expansion
  const animateShockwave = useCallback((timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }

    const elapsed = timestamp - startTimeRef.current;
    const progress = Math.min(elapsed / STAGE_TIMING.theDrop.shockwaveDuration, 1);
    
    // Ease-out cubic for natural deceleration
    const eased = 1 - Math.pow(1 - progress, 3);
    setShockwaveScale(eased * 4);

    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animateShockwave);
    } else {
      setShockwaveActive(false);
      onComplete();
    }
  }, [onComplete]);

  useEffect(() => {
    if (!active) {
      setShockwaveActive(false);
      setShockwaveScale(0);
      startTimeRef.current = 0;
      return;
    }

    // Start shockwave
    const shockwaveTimer = setTimeout(() => {
      setShockwaveActive(true);
      animationRef.current = requestAnimationFrame(animateShockwave);
    }, STAGE_TIMING.theDrop.shockwaveDelay);

    // Emit particle burst
    const particleTimer = setTimeout(() => {
      particles.emitBurst(
        [dimensions[0] / 2, dimensions[1] / 2],
        60,
        10
      );
    }, STAGE_TIMING.theDrop.particleBurstDelay);

    return () => {
      clearTimeout(shockwaveTimer);
      clearTimeout(particleTimer);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [active, animateShockwave, particles, dimensions]);

  if (!active) return null;

  const [width, height] = dimensions;
  const centerX = width / 2;
  const centerY = height / 2;

  return (
    <div className="the-drop" aria-hidden="true">
      {/* SVG Shockwave with displacement filter */}
      <svg
        className="shockwave-svg"
        viewBox={`0 0 ${width} ${height}`}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 100,
        }}
      >
        <defs>
          {/* Displacement map for ripple effect */}
          <filter id="shockwave-displacement" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence
              type="turbulence"
              baseFrequency="0.01"
              numOctaves="1"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={shockwaveScale * 20}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          {/* Radial gradient for shockwave ring */}
          <radialGradient id="shockwave-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="80%" stopColor="transparent" />
            <stop offset="90%" stopColor="#F97316" stopOpacity="0.6" />
            <stop offset="95%" stopColor="white" stopOpacity="0.8" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Shockwave ring */}
        {shockwaveActive && (
          <circle
            cx={centerX}
            cy={centerY}
            r={50}
            fill="none"
            stroke="url(#shockwave-gradient)"
            strokeWidth={10 * (1 - shockwaveScale / 4)}
            opacity={1 - shockwaveScale / 4}
            transform={`scale(${shockwaveScale})`}
            style={{ transformOrigin: `${centerX}px ${centerY}px` }}
          />
        )}

        {/* Energy burst lines */}
        {shockwaveActive && Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const length = 100 * shockwaveScale;
          return (
            <line
              key={i}
              x1={centerX}
              y1={centerY}
              x2={centerX + Math.cos(angle) * length}
              y2={centerY + Math.sin(angle) * length}
              stroke="#F97316"
              strokeWidth={2 * (1 - shockwaveScale / 4)}
              opacity={0.6 * (1 - shockwaveScale / 4)}
            />
          );
        })}
      </svg>

      {/* Particle burst */}
      <VerletParticleRenderer particles={particles} />
    </div>
  );
}

// ============================================
// Main Handshake Boot Sequence Component
// ============================================

export function HandshakeBootSequence({
  skip = false,
  onComplete,
  onStageChange,
  reducedMotion = false,
  dimensions = [800, 600],
}: HandshakeBootProps) {
  const [stage, setStage] = useState<HandshakeStage>('idle');
  const hasStarted = useRef(false);

  // Stage transition handler
  const advanceStage = useCallback((nextStage: HandshakeStage) => {
    setStage(nextStage);
    onStageChange?.(nextStage);

    if (nextStage === 'complete') {
      onComplete?.();
    }
  }, [onStageChange, onComplete]);

  // Start boot sequence
  useEffect(() => {
    if (skip || reducedMotion) {
      advanceStage('complete');
      return;
    }

    if (!hasStarted.current) {
      hasStarted.current = true;
      advanceStage('phosphor-warmup');
    }
  }, [skip, reducedMotion, advanceStage]);

  // Handle stage completions
  const handlePhosphorComplete = useCallback(() => {
    advanceStage('interlaced-loading');
  }, [advanceStage]);

  const handleInterlacedComplete = useCallback(() => {
    advanceStage('the-drop');
  }, [advanceStage]);

  const handleDropComplete = useCallback(() => {
    advanceStage('complete');
  }, [advanceStage]);

  if (skip || reducedMotion || stage === 'complete') {
    return null;
  }

  return (
    <div
      className="handshake-boot-sequence"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1000,
        overflow: 'hidden',
        background: '#000',
      }}
      role="region"
      aria-label="Boot sequence"
      aria-live="polite"
    >
      {/* Stage 1: Phosphor Warm-up */}
      <PhosphorWarmup
        active={stage === 'phosphor-warmup'}
        onComplete={handlePhosphorComplete}
      />

      {/* Stage 2: Interlaced Loading */}
      <InterlacedLoading
        active={stage === 'interlaced-loading'}
        onComplete={handleInterlacedComplete}
      >
        <div className="interlaced-content">
          {/* Placeholder content that fades in with interlacing */}
          <div className="boot-text-preview">INITIALIZING SYSTEMS...</div>
        </div>
      </InterlacedLoading>

      {/* Stage 3: The Drop */}
      <TheDrop
        active={stage === 'the-drop'}
        onComplete={handleDropComplete}
        dimensions={dimensions}
      />

      {/* Screen noise overlay */}
      <div className="boot-noise-overlay" aria-hidden="true" />
    </div>
  );
}

export default HandshakeBootSequence;
