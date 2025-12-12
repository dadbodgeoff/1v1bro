/**
 * ArcadeHeadline - Styled headline with phosphor glow
 * 
 * Displays headline, tagline, and feature list with responsive sizing.
 * Enterprise typography hierarchy for maximum impact.
 * 
 * @module landing/arcade/DashboardUI/ArcadeHeadline
 * Requirements: 4.2
 */

import { cn } from '@/utils/helpers';
import { ARCADE_CONTENT } from '../constants';
import type { ArcadeHeadlineProps } from '../types';
import '../styles/arcade.css';

export interface ArcadeHeadlineComponentProps extends ArcadeHeadlineProps {
  /** Responsive mode */
  mode?: 'mobile' | 'tablet' | 'desktop';
}

// Feature highlights for the landing page
const FEATURES = [
  'Real-time PvP combat',
  'Trivia-powered abilities',
  'Ranked matchmaking',
];

export function ArcadeHeadline({
  text = ARCADE_CONTENT.headline,
  tagline = ARCADE_CONTENT.tagline,
  animate = true,
  mode = 'desktop',
}: ArcadeHeadlineComponentProps) {
  const isDesktop = mode === 'desktop' || mode === 'tablet';
  
  return (
    <div className={isDesktop ? '' : 'text-center'}>
      {/* Main headline */}
      <h1
        className={cn(
          'arcade-headline',
          `arcade-headline--${mode}`,
          animate && 'stagger-item stagger-item--visible stagger-item--delay-2'
        )}
      >
        {text}
      </h1>
      
      {/* Divider line */}
      {isDesktop && (
        <div 
          className={cn(
            'arcade-divider',
            animate && 'stagger-item stagger-item--visible stagger-item--delay-2'
          )}
          aria-hidden="true"
        />
      )}
      
      {/* Tagline */}
      <p
        className={cn(
          'arcade-tagline',
          `arcade-tagline--${mode}`,
          animate && 'stagger-item stagger-item--visible stagger-item--delay-3'
        )}
      >
        {tagline}
      </p>
      
      {/* Feature list - desktop only */}
      {isDesktop && (
        <div 
          className={cn(
            'arcade-features',
            animate && 'stagger-item stagger-item--visible stagger-item--delay-3'
          )}
        >
          {FEATURES.map((feature, index) => (
            <span key={index} className="arcade-feature">
              {feature}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default ArcadeHeadline;
