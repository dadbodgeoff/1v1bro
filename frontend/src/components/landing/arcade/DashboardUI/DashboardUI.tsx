/**
 * DashboardUI - Main dashboard content layout
 * 
 * Combines headline, tagline, demo, and CTAs with responsive layout.
 * Layout: Header/Tagline at top -> Live Demo -> Two CTAs (Play Now + Create Account)
 * 
 * @module landing/arcade/DashboardUI/DashboardUI
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 10.4
 */

import { useState, useEffect } from 'react';
import { cn } from '@/utils/helpers';
import { trackEvent } from '@/services/analytics';
import { ArcadeHeadline } from './ArcadeHeadline';
import { ArcadeCTA } from './ArcadeCTA';
import { DemoContainer } from './DemoContainer';
import { ARCADE_CONTENT, RESPONSIVE_BREAKPOINTS, DELIGHT_DETAILS, ANALYTICS_EVENTS } from '../constants';
import type { DashboardUIProps } from '../types';
import '../styles/arcade.css';

type ResponsiveMode = 'mobile' | 'tablet' | 'desktop';

function getResponsiveMode(width: number): ResponsiveMode {
  if (width < RESPONSIVE_BREAKPOINTS.mobile.maxWidth) {
    return 'mobile';
  }
  if (width >= RESPONSIVE_BREAKPOINTS.tablet.minWidth && width <= RESPONSIVE_BREAKPOINTS.tablet.maxWidth) {
    return 'tablet';
  }
  return 'desktop';
}

export interface DashboardUIComponentProps extends DashboardUIProps {
  /** Hover sound handler */
  onHoverSound?: (e?: React.MouseEvent) => void;
}

export function DashboardUI({
  isAuthenticated,
  onPrimaryCTA,
  onSecondaryCTA,
  animate = true,
  onHoverSound,
}: DashboardUIComponentProps) {
  const [mode, setMode] = useState<ResponsiveMode>('desktop');
  const [showPressStart, setShowPressStart] = useState(false);

  // Detect responsive mode
  useEffect(() => {
    const updateMode = () => {
      setMode(getResponsiveMode(window.innerWidth));
    };

    updateMode();
    window.addEventListener('resize', updateMode);
    return () => window.removeEventListener('resize', updateMode);
  }, []);

  // Show "PRESS START" after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPressStart(true);
      // Track when press start prompt becomes visible
      trackEvent(ANALYTICS_EVENTS.pressStartShown, {
        delay_ms: DELIGHT_DETAILS.pressStart.showAfter,
      });
    }, DELIGHT_DETAILS.pressStart.showAfter);

    return () => clearTimeout(timer);
  }, []);

  // Handle keyboard press for "PRESS START" functionality
  useEffect(() => {
    if (!showPressStart) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore modifier keys alone and prevent default for game-like experience
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      // Track the press start event with the key used
      trackEvent(ANALYTICS_EVENTS.ctaClick, {
        cta_type: 'press_start_keyboard',
        key_pressed: e.key,
        is_authenticated: isAuthenticated,
      });
      onPrimaryCTA();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPressStart, onPrimaryCTA, isAuthenticated]);

  // Primary CTA: "Play Now" for instant play (no account needed)
  const primaryText = isAuthenticated
    ? ARCADE_CONTENT.primaryCTAAuth
    : ARCADE_CONTENT.primaryCTA;

  // Secondary CTA: "Create Account" for registration
  const secondaryText = isAuthenticated
    ? ARCADE_CONTENT.secondaryCTAAuth
    : ARCADE_CONTENT.secondaryCTA;

  const isDesktop = mode === 'desktop';

  return (
    <div
      className={cn('dashboard-ui', (isDesktop || mode === 'tablet') && 'dashboard-ui--desktop')}
      role="main"
    >
      {/* Header area at top - grid-area: header */}
      <div className="dashboard-header-area">
        <ArcadeHeadline animate={animate} mode={mode} />
      </div>

      {/* Demo area - grid-area: demo */}
      <DemoContainer />

      {/* Footer area with CTAs - grid-area: footer */}
      <div
        className={cn(
          'dashboard-footer-area',
          animate && 'stagger-item stagger-item--visible stagger-item--delay-4'
        )}
      >
        {/* Play Now - instant play, no account required */}
        <ArcadeCTA
          variant="primary"
          onClick={onPrimaryCTA}
          onMouseEnter={onHoverSound}
          ariaLabel={isAuthenticated ? 'Enter Arena' : 'Play Now - No account needed'}
        >
          {primaryText}
        </ArcadeCTA>

        {/* Create Account CTA */}
        <ArcadeCTA
          variant="secondary"
          onClick={onSecondaryCTA}
          onMouseEnter={onHoverSound}
          ariaLabel={isAuthenticated ? 'Go to Dashboard' : 'Create Account'}
        >
          {secondaryText}
        </ArcadeCTA>

        {/* Press Start Easter Egg - inline */}
        {showPressStart && (
          <button
            className="press-start press-start--inline"
            onClick={onPrimaryCTA}
            aria-label="Press to start playing"
          >
            {ARCADE_CONTENT.pressStart}
          </button>
        )}
      </div>
    </div>
  );
}

export default DashboardUI;
