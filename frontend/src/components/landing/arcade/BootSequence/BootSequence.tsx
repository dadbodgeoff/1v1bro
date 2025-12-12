/**
 * BootSequence - Boot animation orchestrator
 * 
 * Combines BootText, BootProgress, and BootLogo with skip functionality.
 * Enhanced with matrix rain, scan lines, and particle effects for WOW factor.
 * 
 * @module landing/arcade/BootSequence/BootSequence
 * Requirements: 2.1, 2.5, 2.6, 6.4
 */

import { BootText } from './BootText';
import { BootProgress } from './BootProgress';
import { BootLogo } from './BootLogo';
import { BOOT_LINES, ARCADE_CONTENT, DELIGHT_DETAILS } from '../constants';
import type { BootSequenceProps, BootPhase } from '../types';
import '../styles/arcade.css';

export interface BootSequenceComponentProps extends BootSequenceProps {
  /** Current boot phase */
  phase: BootPhase;
  /** Current line index */
  currentLine: number;
  /** Progress percentage */
  progress: number;
  /** Skip handler */
  onSkip: () => void;
}

// Random characters for matrix rain effect
const RAIN_CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
const getRandomChars = () => {
  let result = '';
  for (let i = 0; i < 20; i++) {
    result += RAIN_CHARS[Math.floor(Math.random() * RAIN_CHARS.length)];
  }
  return result;
};

export function BootSequence({
  bootLines = BOOT_LINES,
  phase,
  currentLine,
  progress,
  onSkip,
}: BootSequenceComponentProps) {
  // Show boot text during powering-on, booting, and ready phases
  const showBootText = phase === 'powering-on' || phase === 'booting' || phase === 'ready';
  const showProgress = phase === 'booting' || phase === 'powering-on';
  const showLogo = phase === 'ready';
  const showPowerOn = phase === 'powering-on';
  const showEffects = phase !== 'complete';

  return (
    <div className="boot-sequence" role="region" aria-label="Boot sequence">
      {/* Matrix-style digital rain background */}
      {showEffects && (
        <div className="boot-sequence-rain" aria-hidden="true">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rain-column">
              {getRandomChars()}
            </div>
          ))}
        </div>
      )}

      {/* Hexagonal grid overlay */}
      {showEffects && (
        <div className="boot-hex-grid" aria-hidden="true" />
      )}

      {/* Scanning line effect */}
      {showEffects && !showLogo && (
        <div className="boot-scan-line" aria-hidden="true" />
      )}

      {/* Initial power flicker effect */}
      {showPowerOn && (
        <div className="power-on-flicker" aria-hidden="true" />
      )}

      {/* CRT tube warm-up effect (horizontal line expanding) */}
      {showPowerOn && (
        <div className="power-on-effect" aria-hidden="true" />
      )}

      {/* Boot text lines - show container immediately with first line during power-on */}
      {showBootText && !showLogo && (
        <BootText
          lines={bootLines}
          currentLine={phase === 'powering-on' ? 0 : currentLine}
          isTyping={phase === 'booting'}
        />
      )}

      {/* Progress bar - visible during power-on and booting */}
      {!showLogo && (
        <BootProgress progress={progress} visible={showProgress} />
      )}

      {/* Epic logo reveal with particles and energy rings */}
      {showLogo && (
        <>
          {/* Screen flash */}
          <div className="boot-logo-flash" aria-hidden="true" />
          
          {/* Energy ring pulses */}
          <div className="boot-logo-particles" aria-hidden="true">
            <div className="boot-energy-ring" />
            <div className="boot-energy-ring" />
            <div className="boot-energy-ring" />
            {/* Particle burst */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="boot-particle" style={{ top: '50%', left: '50%' }} />
            ))}
          </div>
          
          {/* Logo container */}
          <div className="boot-logo-container">
            <BootLogo visible={showLogo} delay={100} />
            <span className="boot-logo-subtitle">ARENA COMBAT READY</span>
          </div>
        </>
      )}

      {/* Skip button - always visible until complete */}
      {phase !== 'complete' && (
        <button
          className="boot-skip-button"
          onClick={onSkip}
          aria-label="Skip boot sequence"
          style={{
            minHeight: DELIGHT_DETAILS.skipButton.minHeight,
            minWidth: DELIGHT_DETAILS.skipButton.minWidth,
          }}
        >
          {ARCADE_CONTENT.skipButton}
        </button>
      )}
    </div>
  );
}

export default BootSequence;
