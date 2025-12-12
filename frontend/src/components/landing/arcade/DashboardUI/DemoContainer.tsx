/**
 * DemoContainer - LiveDemo wrapper with CRT styling
 * 
 * Wraps the LiveDemo component with fallback handling.
 * 
 * @module landing/arcade/DashboardUI/DemoContainer
 * Requirements: 4.1, 10.2
 */

import { Suspense, lazy, useState, useEffect } from 'react';
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

export function DemoContainer({
  hasFailed = false,
  fallbackImage = '/assets/landing/demo-fallback.svg',
}: DemoContainerProps) {
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
      )}
    </div>
  );
}

export default DemoContainer;
