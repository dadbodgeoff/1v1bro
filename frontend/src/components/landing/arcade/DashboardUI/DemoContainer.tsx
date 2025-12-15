/**
 * DemoContainer - LiveDemo wrapper with CRT styling
 * 
 * Wraps the LiveDemo and SurvivalDemo components with fallback handling.
 * Shows both demos side by side with individual Play Now CTAs.
 * 
 * @module landing/arcade/DashboardUI/DemoContainer
 * Requirements: 4.1, 10.2
 */

import { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { trackEvent } from '@/services/analytics';
import { ARCADE_CONTENT, DELIGHT_DETAILS } from '../constants';
import type { DemoContainerProps } from '../types';
import '../styles/arcade.css';

// Lazy load LiveDemo to handle potential failures
const LiveDemo = lazy(() => 
  import('@/components/landing/enterprise/LiveDemo').then(module => ({
    default: module.LiveDemo
  })).catch(() => ({
    default: () => <div className="demo-fallback"><span>Demo unavailable</span></div>,
  }))
);

// Lazy load SurvivalDemo
const SurvivalDemo = lazy(() => 
  import('@/components/landing/enterprise/survival-demo').then(module => ({
    default: module.SurvivalDemo
  })).catch(() => ({
    default: () => <div className="demo-fallback"><span>Demo unavailable</span></div>,
  }))
);

export function DemoContainer({
  hasFailed = false,
  fallbackImage = '/assets/landing/demo-fallback.svg',
}: DemoContainerProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [demoError] = useState(false);
  const [showLive, setShowLive] = useState(false);

  // Show live indicator after demo loads
  useEffect(() => {
    if (!hasFailed && !demoError) {
      const timer = setTimeout(() => setShowLive(true), 500);
      return () => clearTimeout(timer);
    }
  }, [hasFailed, demoError]);

  const showFallback = hasFailed || demoError;

  // Handle Trivia Duel Play Now click
  const handleTriviaDuelPlay = useCallback(() => {
    trackEvent('demo_cta_click', {
      demo_type: 'trivia_duel',
      is_authenticated: isAuthenticated,
    });
    navigate(isAuthenticated ? '/dashboard' : '/instant-play');
  }, [navigate, isAuthenticated]);

  // Handle Survival Runner Play Now click
  const handleSurvivalPlay = useCallback(() => {
    trackEvent('demo_cta_click', {
      demo_type: 'survival_runner',
      is_authenticated: isAuthenticated,
    });
    navigate(isAuthenticated ? '/survival' : '/survival/instant');
  }, [navigate, isAuthenticated]);

  return (
    <div className="demo-container stagger-item stagger-item--visible stagger-item--delay-1">
      {/* Live indicator */}
      {showLive && !showFallback && (
        <div className="demo-live-indicator">
          <span
            className="demo-live-dot"
            style={{ width: DELIGHT_DETAILS.liveIndicator.dotSize, height: DELIGHT_DETAILS.liveIndicator.dotSize }}
          />
          {ARCADE_CONTENT.liveIndicator}
        </div>
      )}

      {/* Demo or fallback */}
      {showFallback ? (
        <div className="demo-fallback">
          <img
            src={fallbackImage}
            alt="Gameplay preview"
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }}
            onError={(e) => {
              // Hide broken image
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <span style={{ position: 'absolute' }}>{ARCADE_CONTENT.demoUnavailable}</span>
        </div>
      ) : (
        <div className="demo-grid">
          {/* Trivia Duel Demo */}
          <div className="demo-panel">
            <div className="demo-badge demo-badge--trivia">TRIVIA DUEL</div>
            <div className="demo-screen">
              <Suspense
                fallback={
                  <div className="demo-fallback">
                    <span>Loading demo...</span>
                  </div>
                }
              >
                <LiveDemo
                  autoPlay={true}
                  showHUD={true}
                />
              </Suspense>
            </div>
            <div className="demo-arcade-box demo-arcade-box--trivia">
              <button
                onClick={handleTriviaDuelPlay}
                className="demo-play-btn"
                aria-label="Play Trivia Duel now"
              >
                <span className="demo-play-btn-icon">▶</span>
                PLAY NOW
              </button>
            </div>
          </div>
          
          {/* Survival Runner Demo */}
          <div className="demo-panel">
            <div className="demo-badge demo-badge--survival">SURVIVAL MODE</div>
            <div className="demo-screen">
              <Suspense
                fallback={
                  <div className="demo-fallback">
                    <span>Loading demo...</span>
                  </div>
                }
              >
                <SurvivalDemo
                  autoPlay={true}
                  showHUD={true}
                />
              </Suspense>
            </div>
            <div className="demo-arcade-box demo-arcade-box--survival">
              <button
                onClick={handleSurvivalPlay}
                className="demo-play-btn"
                aria-label="Play Survival Runner now"
              >
                <span className="demo-play-btn-icon">▶</span>
                PLAY NOW
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DemoContainer;
