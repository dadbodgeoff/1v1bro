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

export function ArcadeHeadline({
  text = ARCADE_CONTENT.headline,
  tagline = ARCADE_CONTENT.tagline,
  animate = true,
  mode = 'desktop',
}: ArcadeHeadlineComponentProps) {
  return (
    <div className="arcade-headline-wrapper">
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
    </div>
  );
}

export default ArcadeHeadline;
