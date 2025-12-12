/**
 * StaticLandingFallback - Static fallback when JS fails or errors occur
 * 
 * Displays a simple, functional landing page without CRT effects.
 * Used by ArcadeLandingErrorBoundary when components throw errors.
 * 
 * @module landing/arcade/StaticLandingFallback
 * Requirements: 10.1, 10.3
 */

import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { ARCADE_CONTENT, ARCADE_COLORS } from './constants';
import './styles/arcade.css';

export interface StaticLandingFallbackProps {
  /** Error message to display (optional) */
  errorMessage?: string;
}

export function StaticLandingFallback({ errorMessage }: StaticLandingFallbackProps) {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => !!state.user);

  const handlePrimaryCTA = () => {
    navigate(isAuthenticated ? '/dashboard' : '/instant-play');
  };

  const handleSecondaryCTA = () => {
    navigate(isAuthenticated ? '/dashboard' : '/register');
  };

  return (
    <div className="static-fallback" role="main">
      {/* Headline */}
      <h1
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '64px',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: ARCADE_COLORS.textPrimary,
          margin: 0,
          textAlign: 'center',
        }}
      >
        {ARCADE_CONTENT.headline}
      </h1>

      {/* Tagline */}
      <p
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '22px',
          fontWeight: 600,
          color: ARCADE_COLORS.ledOn,
          margin: 0,
          textAlign: 'center',
        }}
      >
        {ARCADE_CONTENT.tagline}
      </p>

      {/* Error message (if any) */}
      {errorMessage && (
        <p
          style={{
            fontSize: '14px',
            color: ARCADE_COLORS.textMuted,
            margin: '16px 0',
          }}
        >
          Something went wrong. Please try refreshing the page.
        </p>
      )}

      {/* CTAs */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginTop: '24px',
        }}
      >
        <button
          onClick={handlePrimaryCTA}
          className="arcade-cta arcade-cta--primary"
          aria-label={isAuthenticated ? 'Enter Arena' : 'Play Now'}
        >
          {isAuthenticated ? ARCADE_CONTENT.primaryCTAAuth : ARCADE_CONTENT.primaryCTA}
        </button>

        <button
          onClick={handleSecondaryCTA}
          className="arcade-cta arcade-cta--secondary"
          aria-label={isAuthenticated ? 'Go to Dashboard' : 'Create Account'}
        >
          {isAuthenticated ? ARCADE_CONTENT.secondaryCTAAuth : ARCADE_CONTENT.secondaryCTA}
        </button>
      </div>
    </div>
  );
}

export default StaticLandingFallback;
