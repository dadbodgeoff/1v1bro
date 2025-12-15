/**
 * CRTMonitor - Main CRT monitor frame wrapper
 * 
 * Combines CRTBezel, CRTScreen, and PowerIndicator into a complete
 * arcade cabinet frame. Handles responsive breakpoint detection.
 * 
 * The full arcade cabinet includes:
 * - Marquee header with glowing "1v1 BRO" text
 * - CRT screen with bezel and effects
 * - Control panel with joystick, buttons, and coin slot
 * - Side panel accent lights (desktop only)
 * 
 * @module landing/arcade/CRTMonitor/CRTMonitor
 * Requirements: 1.1, 1.2, 1.3, 5.1, 5.2, 5.3
 */

import { useEffect, useState } from 'react';
import { cn } from '@/utils/helpers';
import { CRTBezel } from './CRTBezel';
import { CRTScreen } from './CRTScreen';
import { PowerIndicator } from './PowerIndicator';
import { RESPONSIVE_BREAKPOINTS, ARCADE_COLORS } from '../constants';
import type { CRTMonitorProps, BarrelDistortionMode } from '../types';
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

export function CRTMonitor({
  children,
  showPowerLED = true,
  ledColor = ARCADE_COLORS.ledOn,
  mode: propMode,
  isPoweredOn = true,
  onControlPanelClick,
}: CRTMonitorProps) {
  const [responsiveMode, setResponsiveMode] = useState<ResponsiveMode>('desktop');
  const [barrelDistortionMode] = useState<BarrelDistortionMode>('css-border-radius-hack');

  // Detect responsive mode from viewport width
  useEffect(() => {
    if (propMode) {
      setResponsiveMode(propMode);
      return;
    }

    const updateMode = () => {
      setResponsiveMode(getResponsiveMode(window.innerWidth));
    };

    updateMode();
    window.addEventListener('resize', updateMode);
    return () => window.removeEventListener('resize', updateMode);
  }, [propMode]);

  return (
    <div className={cn('crt-monitor')}>
      {/* CRTBezel renders the full arcade cabinet structure:
          - Marquee header (desktop/tablet)
          - Screen bezel with side panels
          - Control panel with joystick/buttons (desktop/tablet)
      */}
      <CRTBezel mode={responsiveMode} onControlPanelClick={onControlPanelClick}>
        {/* CRTScreen contains the actual screen content with effects */}
        <CRTScreen
          barrelDistortion={true}
          distortionMode={barrelDistortionMode}
        >
          {/* Color fringing effect wrapper */}
          <div className="crt-color-fringing">
            {children}
          </div>
        </CRTScreen>

        {/* Power LED - positioned on the bezel */}
        {showPowerLED && (
          <PowerIndicator
            isOn={isPoweredOn}
            color={ledColor}
            glowColor={ARCADE_COLORS.ledGlow}
          />
        )}
      </CRTBezel>
    </div>
  );
}

export default CRTMonitor;
