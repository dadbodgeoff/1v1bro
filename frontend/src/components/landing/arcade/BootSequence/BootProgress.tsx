/**
 * BootProgress - Progress bar for boot sequence
 * 
 * Animated progress bar with brand colors and glow effect.
 * 
 * @module landing/arcade/BootSequence/BootProgress
 * Requirements: 2.4
 */

import type { BootProgressProps } from '../types';
import '../styles/arcade.css';

export function BootProgress({ progress, visible = true }: BootProgressProps) {
  if (!visible) return null;

  return (
    <div
      className="boot-progress"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Boot progress"
    >
      <div
        className="boot-progress-fill"
        style={{ width: `${Math.min(progress, 100)}%` }}
      />
    </div>
  );
}

export default BootProgress;
