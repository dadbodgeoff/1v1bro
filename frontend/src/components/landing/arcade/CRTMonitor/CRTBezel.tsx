/**
 * CRTBezel - Arcade cabinet frame for CRT monitor
 * 
 * Renders a full arcade cabinet aesthetic with:
 * - Side panels with gradient lighting
 * - Control panel area below screen
 * - Coin slot indicator
 * - Ventilation slots
 * - Brand badge and marquee
 * - 3D parallax tilt on mouse movement
 * 
 * Supports responsive modes (mobile/tablet/desktop).
 * 
 * @module landing/arcade/CRTMonitor/CRTBezel
 * Requirements: 1.1, 1.2, 1.3
 */

import { type ReactNode } from 'react';
import { cn } from '@/utils/helpers';
import { BEZEL_DESIGN, RESPONSIVE_BEHAVIORS } from '../constants';
import { useParallaxTilt } from '../hooks/useParallaxTilt';
import { useReducedMotion } from '../hooks/useReducedMotion';
import '../styles/arcade.css';

export interface CRTBezelProps {
  children: ReactNode;
  /** Responsive breakpoint mode */
  mode?: 'mobile' | 'tablet' | 'desktop';
  /** Additional CSS classes */
  className?: string;
  /** Callback when control panel / insert coin is clicked */
  onControlPanelClick?: () => void;
}

export function CRTBezel({ children, mode = 'desktop', className, onControlPanelClick }: CRTBezelProps) {
  const config = RESPONSIVE_BEHAVIORS[mode];
  const showCabinetDetails = config.showVents; // Desktop only
  const showBrandBadge = config.showBrandBadge;
  const isDesktop = mode === 'desktop';
  const isTablet = mode === 'tablet';
  const reducedMotion = useReducedMotion();
  
  // 3D parallax tilt effect (desktop only, respects reduced motion)
  const parallaxRef = useParallaxTilt({
    maxTilt: 1.5,
    enabled: isDesktop && !reducedMotion,
    smoothing: 0.08,
  });

  return (
    <div
      ref={parallaxRef}
      className={cn(
        'arcade-cabinet',
        mode === 'mobile' && 'arcade-cabinet--mobile',
        mode === 'tablet' && 'arcade-cabinet--tablet',
        className
      )}
    >
      {/* Marquee header (desktop/tablet) */}
      {(isDesktop || isTablet) && (
        <div className="arcade-marquee" aria-hidden="true">
          <div className="arcade-marquee-text">1v1 BRO</div>
          <div className="arcade-marquee-glow" />
        </div>
      )}

      {/* Main cabinet body */}
      <div
        className={cn(
          'crt-bezel',
          mode === 'mobile' && 'crt-bezel--mobile',
          mode === 'tablet' && 'crt-bezel--tablet',
        )}
        style={{
          padding: config.bezelPadding,
          borderRadius: config.bezelRadius,
        }}
      >
        {/* Side panel accents (desktop only) */}
        {isDesktop && (
          <>
            <div className="cabinet-side-panel cabinet-side-panel--left" aria-hidden="true" />
            <div className="cabinet-side-panel cabinet-side-panel--right" aria-hidden="true" />
          </>
        )}

        {/* Screen content area */}
        {children}

        {/* Ventilation slots (desktop only) */}
        {showCabinetDetails && (
          <div className="bezel-vents" aria-hidden="true">
            {Array.from({ length: BEZEL_DESIGN.vents.count }).map((_, i) => (
              <div key={i} className="bezel-vent" />
            ))}
          </div>
        )}

        {/* Brand badge */}
        {showBrandBadge && (
          <div className="bezel-badge" aria-hidden="true">
            {BEZEL_DESIGN.brandBadge.text}
          </div>
        )}
      </div>

      {/* Control panel area (desktop/tablet) - clickable to login */}
      {(isDesktop || isTablet) && (
        <button
          className="arcade-control-panel arcade-control-panel--clickable"
          onClick={onControlPanelClick}
          aria-label="Insert coin to log in"
          type="button"
        >
          {/* Joystick indicator */}
          <div className="control-panel-joystick">
            <div className="joystick-base" />
            <div className="joystick-stick" />
          </div>
          
          {/* Button cluster */}
          <div className="control-panel-buttons">
            <div className="arcade-button arcade-button--a" />
            <div className="arcade-button arcade-button--b" />
            {isDesktop && <div className="arcade-button arcade-button--c" />}
          </div>

          {/* Coin slot (desktop only) */}
          {isDesktop && (
            <div className="coin-slot">
              <div className="coin-slot-opening" />
              <span className="coin-slot-text">INSERT COIN</span>
            </div>
          )}
        </button>
      )}
    </div>
  );
}

export default CRTBezel;
