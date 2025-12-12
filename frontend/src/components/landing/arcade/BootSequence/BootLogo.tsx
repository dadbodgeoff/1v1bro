/**
 * BootLogo - Epic logo reveal animation for boot sequence
 * 
 * Displays "1v1 BRO" logo with phosphor glow, chromatic aberration,
 * and 3D rotation effects for maximum wow factor.
 * 
 * @module landing/arcade/BootSequence/BootLogo
 * Requirements: 2.5
 */

import { ARCADE_CONTENT } from '../constants';
import type { BootLogoProps } from '../types';
import '../styles/arcade.css';

export function BootLogo({ visible = false, delay = 0 }: BootLogoProps) {
  if (!visible) return null;

  return (
    <div
      className="boot-logo"
      style={{ animationDelay: `${delay}ms` }}
      data-text={ARCADE_CONTENT.headline}
      aria-label={`${ARCADE_CONTENT.headline} logo`}
    >
      {ARCADE_CONTENT.headline}
    </div>
  );
}

export default BootLogo;
