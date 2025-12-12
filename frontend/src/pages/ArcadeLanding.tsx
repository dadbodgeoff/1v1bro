/**
 * ArcadeLanding Page - CRT Arcade Landing Page Entry Point
 * 
 * Wraps the ArcadeLanding component with error boundary.
 * This is the route-level component for /arcade.
 * 
 * @module pages/ArcadeLanding
 * Requirements: 9.4, 10.1, 11.1 (Analytics)
 */

import { useEffect } from 'react';
import { ArcadeLanding as ArcadeLandingComponent } from '@/components/landing/arcade/ArcadeLanding';
import { ArcadeLandingErrorBoundary } from '@/components/landing/arcade/ArcadeLandingErrorBoundary';
import { analytics } from '@/services/analytics';

export function ArcadeLanding() {
  useEffect(() => {
    document.title = '1v1 Bro - Arcade';
    
    // Initialize analytics and track arcade landing page view
    analytics.init();
    analytics.trackPageView('/arcade');
    
    return () => {
      document.title = '1v1 Bro';
    };
  }, []);

  return (
    <ArcadeLandingErrorBoundary>
      <ArcadeLandingComponent />
    </ArcadeLandingErrorBoundary>
  );
}

export default ArcadeLanding;
