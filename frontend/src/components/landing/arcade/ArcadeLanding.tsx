/**
 * ArcadeLanding - Main CRT Arcade Landing Page
 * 
 * Orchestrates boot sequence, CRT effects, and dashboard UI.
 * Wrapped in error boundary for resilience.
 * 
 * @module landing/arcade/ArcadeLanding
 * Requirements: 9.2, 9.4, 10.1, 10.4
 */

import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { trackEvent } from '@/services/analytics';
import { CRTMonitor } from './CRTMonitor';
import { CRTEffects } from './CRTEffects';
import { BootSequence } from './BootSequence';
import { DashboardUI } from './DashboardUI';
import { useBootSequence } from './hooks/useBootSequence';
import { useCRTEffects } from './hooks/useCRTEffects';
import { useArcadeSound } from './hooks/useArcadeSound';
import { useReducedMotion } from './hooks/useReducedMotion';
import { ANALYTICS_EVENTS } from './constants';
import type { ArcadeLandingProps } from './types';
import './styles/arcade.css';

export function ArcadeLanding({
  skipBoot: skipBootProp = false,
  onBootComplete,
}: ArcadeLandingProps) {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => !!state.user);
  const reducedMotion = useReducedMotion();
  const hasTrackedCTAVisible = useRef(false);

  // Skip boot if reduced motion is preferred
  const skipBoot = skipBootProp || reducedMotion;

  // Sound effects
  const sound = useArcadeSound();

  // CRT effects configuration
  const { config: effectsConfig, isReducedMotion } = useCRTEffects({
    trackEvent,
  });

  // Boot sequence state
  const boot = useBootSequence({
    skipBoot,
    onComplete: () => {
      onBootComplete?.();
    },
    onPhaseChange: (phase) => {
      // Play appropriate sounds for each boot phase
      if (phase === 'powering-on') {
        sound.playStartupChime();
      } else if (phase === 'ready') {
        sound.playReadyFanfare?.();
      }
    },
    onLineComplete: () => {
      // Play blip for each boot line
      sound.playBootLine?.();
    },
    trackEvent,
  });

  // Track CTA visible when dashboard loads
  useEffect(() => {
    if (boot.isComplete && !hasTrackedCTAVisible.current) {
      hasTrackedCTAVisible.current = true;
      const timeSinceBoot = boot.state.startTime
        ? Date.now() - boot.state.startTime
        : 0;
      trackEvent(ANALYTICS_EVENTS.ctaVisible, {
        time_since_boot_ms: timeSinceBoot,
      });
    }
  }, [boot.isComplete, boot.state.startTime]);

  // Navigation handlers
  const handlePrimaryCTA = useCallback(() => {
    sound.playClickBlip();
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
    <div className="arcade-landing">
      {/* Background layers - Immersive arcade room */}
      <div className="arcade-room-bg" aria-hidden="true" />
      <div className="arcade-wall" aria-hidden="true" />
      <div className="arcade-floor" aria-hidden="true" />
      <div className="arcade-spotlight" aria-hidden="true" />

      {/* Distant cabinet silhouettes for depth */}
      {!reducedMotion && (
        <div className="arcade-silhouettes" aria-hidden="true">
          <div className="arcade-silhouette arcade-silhouette--left" />
          <div className="arcade-silhouette arcade-silhouette--right" />
        </div>
      )}

      {/* Atmospheric haze */}
      {!reducedMotion && <div className="arcade-haze" aria-hidden="true" />}

      {/* Atmospheric neon accent lines */}
      {!reducedMotion && (
        <div className="arcade-neon-accents" aria-hidden="true">
          <div className="neon-line neon-line--top" />
          <div className="neon-line neon-line--left" />
          <div className="neon-line neon-line--right" />
        </div>
      )}

      {/* Floating dust particles */}
      {!reducedMotion && (
        <div className="arcade-particles" aria-hidden="true">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="arcade-particle" />
          ))}
        </div>
      )}

      <CRTMonitor isPoweredOn={boot.phase !== 'off'}>
        {/* CRT Effects Layer */}
        <CRTEffects config={effectsConfig} reducedMotion={isReducedMotion} />

        {/* Boot Sequence (shows during boot) */}
        {!boot.isComplete && (
          <BootSequence
            onComplete={() => {}}
            phase={boot.phase}
            currentLine={boot.currentLine}
            progress={boot.progress}
            onSkip={boot.skip}
          />
        )}

        {/* Dashboard UI (shows after boot) */}
        {boot.isComplete && (
          <DashboardUI
            isAuthenticated={isAuthenticated}
            onPrimaryCTA={handlePrimaryCTA}
            onSecondaryCTA={handleSecondaryCTA}
            animate={!reducedMotion}
            onHoverSound={() => sound.playHoverBlip()}
          />
        )}

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
    </div>
  );
}

export default ArcadeLanding;
