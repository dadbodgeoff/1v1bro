/**
 * ArcadeLandingPage - The Chassis
 * 
 * Production-ready integration of all Tier-1 visual systems:
 * 1. HyperCRTFilterPipeline (The Lens)
 * 2. HandshakeBootSequence (The Startup)
 * 3. VerletParticleSystem (The Engine)
 * 4. CSS Compositing Layers (The Paint)
 * 
 * Features:
 * - Mouse-driven particle interaction
 * - State management (Boot -> Live)
 * - Dynamic energy bursts on click
 * - Direct DOM manipulation for 60/144 FPS
 * 
 * @module landing/arcade/ArcadeLandingPage
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { trackEvent } from '@/services/analytics';
import { cn } from '@/utils/helpers';

// Components
import { HyperCRTFilterPipeline } from './CRTEffects/HyperCRTFilterPipeline';
import { HandshakeBootSequence } from './BootSequence/HandshakeBootSequence';
import { useVerletParticles, VerletParticleRenderer } from './particles/VerletParticleSystem';
import { DashboardUI } from './DashboardUI';
import { CRTMonitor } from './CRTMonitor';

// Hooks
import { useArcadeSound } from './hooks/useArcadeSound';
import { useReducedMotion } from './hooks/useReducedMotion';

// Constants
import { ANALYTICS_EVENTS } from './constants';

// Styles
import './styles/arcade.css';
import './styles/hyper-crt.css';

export interface ArcadeLandingPageProps {
  /** Skip boot sequence */
  skipBoot?: boolean;
  /** Callback when boot completes */
  onBootComplete?: () => void;
}

// Detect if device is mobile/touch
const isTouchDevice = () => 
  typeof window !== 'undefined' && 
  ('ontouchstart' in window || navigator.maxTouchPoints > 0);

// Get responsive particle config based on screen size
const getParticleConfig = (width: number) => {
  if (width < 480) return { maxParticles: 50, trailLength: 4 }; // Small mobile
  if (width < 768) return { maxParticles: 80, trailLength: 5 }; // Mobile
  if (width < 1024) return { maxParticles: 100, trailLength: 6 }; // Tablet
  return { maxParticles: 150, trailLength: 8 }; // Desktop
};

export function ArcadeLandingPage({
  skipBoot: skipBootProp = false,
  onBootComplete,
}: ArcadeLandingPageProps) {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => !!state.user);
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State
  const [bootStatus, setBootStatus] = useState<'booting' | 'complete'>(
    skipBootProp || reducedMotion ? 'complete' : 'booting'
  );
  const [dimensions, setDimensions] = useState<[number, number]>([
    typeof window !== 'undefined' ? window.innerWidth : 800,
    typeof window !== 'undefined' ? window.innerHeight : 600,
  ]);
  const [chromaticBurst, setChromaticBurst] = useState(false);
  const [isMobile, setIsMobile] = useState(isTouchDevice());

  // Sound effects
  const sound = useArcadeSound();
  
  // Get responsive particle config
  const particleConfig = getParticleConfig(dimensions[0]);

  // Initialize the physics engine with Akira-style trails (responsive config)
  const particles = useVerletParticles({
    maxParticles: particleConfig.maxParticles,
    gravity: 0.05, // Lower gravity for floating "data" feel
    friction: 0.98,
    bounce: 0.4,
    lifetime: isMobile ? 2500 : 3500, // Shorter lifetime on mobile
    color: '#F97316', // Phosphor Orange
    bounds: dimensions,
    reducedMotion,
    enableTrails: !isMobile || dimensions[0] >= 768, // Disable trails on small mobile
    trailLength: particleConfig.trailLength,
  });

  // Update dimensions on resize and detect mobile
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions([window.innerWidth, window.innerHeight]);
      setIsMobile(isTouchDevice() || window.innerWidth < 768);
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    window.addEventListener('orientationchange', updateDimensions);
    return () => {
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('orientationchange', updateDimensions);
    };
  }, []);

  // Handle Boot Completion
  const handleBootComplete = useCallback(() => {
    setBootStatus('complete');
    
    // Emit celebration burst when UI goes live
    particles.emitBurst(
      [dimensions[0] / 2, dimensions[1] / 2],
      80,
      10
    );
    
    // Trigger chromatic aberration burst
    setChromaticBurst(true);
    setTimeout(() => setChromaticBurst(false), 200);
    
    sound.playStartupChime();
    onBootComplete?.();
  }, [particles, dimensions, sound, onBootComplete]);

  // Handle Mouse Interaction (The "Live" Feel)
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (bootStatus === 'booting' || reducedMotion || isMobile) return;

    // Emit particles as a trail following cursor (desktop only)
    particles.emit({
      position: [e.clientX, e.clientY],
      count: 1,
      spread: 0.5,
      speed: 2,
      velocity: [
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
      ],
    });
  }, [bootStatus, reducedMotion, isMobile, particles]);

  // Handle Touch Move (Mobile particle trails)
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (bootStatus === 'booting' || reducedMotion) return;
    
    const touch = e.touches[0];
    if (!touch) return;

    // Emit fewer particles on touch for performance
    particles.emit({
      position: [touch.clientX, touch.clientY],
      count: 1,
      spread: 0.3,
      speed: 1.5,
      velocity: [0, 0],
    });
  }, [bootStatus, reducedMotion, particles]);

  // Handle Clicks (Energy Bursts)
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (bootStatus === 'booting') return;
    
    // Emit particle burst at click location (fewer on mobile)
    const burstCount = isMobile ? 15 : 25;
    particles.emitBurst([e.clientX, e.clientY], burstCount, 8);
    
    // Trigger chromatic aberration burst
    setChromaticBurst(true);
    setTimeout(() => setChromaticBurst(false), 150);
    
    sound.playClickBlip();
  }, [bootStatus, isMobile, particles, sound]);

  // Handle Touch Start (Mobile tap bursts)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (bootStatus === 'booting') return;
    
    const touch = e.touches[0];
    if (!touch) return;

    // Smaller burst on mobile
    particles.emitBurst([touch.clientX, touch.clientY], 12, 6);
    
    setChromaticBurst(true);
    setTimeout(() => setChromaticBurst(false), 150);
    
    sound.playClickBlip();
  }, [bootStatus, particles, sound]);

  // Navigation handlers
  const handlePrimaryCTA = useCallback(() => {
    sound.playClickBlip();
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

  // Login button handler (for returning users)
  const handleLogin = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClickBlip();
    trackEvent(ANALYTICS_EVENTS.ctaClick, {
      cta_type: 'login_shortcut',
      is_authenticated: isAuthenticated,
    });
    navigate('/login');
  }, [navigate, isAuthenticated, sound]);

  // Sound toggle
  const handleSoundToggle = useCallback(() => {
    sound.setMuted(!sound.isMuted);
  }, [sound]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'hyper-crt-container',
        bootStatus === 'complete' && 'hyper-crt-jitter--subtle'
      )}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh', // Dynamic viewport height for mobile browsers (falls back to 100vh)
        minHeight: '100vh', // Fallback for browsers without dvh support
        background: '#050505',
        cursor: bootStatus === 'complete' && !isMobile ? 'crosshair' : 'default',
        overflow: 'hidden',
        // Prevent pull-to-refresh on mobile
        overscrollBehavior: 'none',
        touchAction: 'none',
      }}
    >
      {/* 1. The Lens: SVG Filter Definitions */}
      <HyperCRTFilterPipeline
        enableBloom={true}
        bloomIntensity={0.7}
        enableVHold={!reducedMotion}
        vHoldIntensity={0.08} // Subtle during normal use
        enableChromaticAberration={true}
        chromaticOffset={1.5}
        enableGammaCorrection={true}
        gamma={1.15}
        reducedMotion={reducedMotion}
        triggerChromaticBurst={chromaticBurst}
      />

      {/* 2. The Atmosphere: Always-on CRT Effects */}
      {!reducedMotion && (
        <>
          <div className="hyper-crt-scanlines" aria-hidden="true" />
          
          {/* SVG Scanline pattern for moiré interference */}
          <svg
            className="hyper-crt-scanlines-svg"
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 51,
            }}
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
          
          <div className="hyper-crt-moire" aria-hidden="true" />
          <div className="hyper-crt-signal-noise" aria-hidden="true" />
          <div className="hyper-crt-phosphor-decay" aria-hidden="true" />
        </>
      )}

      {/* 3. The Content Layer: Wrapped in Composite Filter */}
      <main
        className={cn(
          'hyper-crt-layer',
          !reducedMotion && 'hyper-crt-filter-composite',
          bootStatus === 'complete' ? 'hyper-crt-jitter--subtle' : 'hyper-crt-jitter'
        )}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      >
        {/* The Boot Sequence Overlay */}
        {bootStatus === 'booting' && (
          <HandshakeBootSequence
            onComplete={handleBootComplete}
            dimensions={dimensions}
            reducedMotion={reducedMotion}
          />
        )}

        {/* The Live UI (Fades in after boot) */}
        <div
          style={{
            opacity: bootStatus === 'complete' ? 1 : 0,
            transition: 'opacity 1.5s ease-in',
            height: '100%',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <CRTMonitor isPoweredOn={bootStatus === 'complete'} onControlPanelClick={() => { sound.playClickBlip(); navigate('/login'); }}>
            <DashboardUI
              isAuthenticated={isAuthenticated}
              onPrimaryCTA={handlePrimaryCTA}
              onSecondaryCTA={handleSecondaryCTA}
              animate={!reducedMotion}
              onHoverSound={() => sound.playHoverBlip()}
            />
          </CRTMonitor>
        </div>

        {/* The Engine: Physics Layer (Verlet Particles) */}
        <VerletParticleRenderer particles={particles} />
      </main>

      {/* 4. The Vignette (Physical Monitor Bezel Shadow) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle, transparent 60%, black 100%)',
          pointerEvents: 'none',
          zIndex: 9999,
        }}
        aria-hidden="true"
      />

      {/* Top Right Controls */}
      <div
        style={{
          position: 'absolute',
          top: 'max(12px, env(safe-area-inset-top, 12px))',
          right: 'max(12px, env(safe-area-inset-right, 12px))',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 10000,
        }}
      >
        {/* Login Button (for returning users) - only show if not authenticated */}
        {!isAuthenticated && bootStatus === 'complete' && (
          <button
            onClick={handleLogin}
            onMouseEnter={() => sound.playHoverBlip()}
            className="arcade-login-btn"
            style={{
              padding: '8px 16px',
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(249, 115, 22, 0.4)',
              borderRadius: '6px',
              color: '#F97316',
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.05em',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              textTransform: 'uppercase',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(249, 115, 22, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.8)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(249, 115, 22, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
              e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.4)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            aria-label="Log in to your account"
          >
            Log In
          </button>
        )}

        {/* Sound Toggle */}
        <button
          className="sound-toggle"
          onClick={(e) => {
            e.stopPropagation();
            handleSoundToggle();
          }}
          aria-label={sound.isMuted ? 'Unmute sound' : 'Mute sound'}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
            e.currentTarget.style.color = 'white';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
          }}
        >
          {sound.isMuted ? '🔇' : '🔊'}
        </button>
      </div>
    </div>
  );
}

export default ArcadeLandingPage;
