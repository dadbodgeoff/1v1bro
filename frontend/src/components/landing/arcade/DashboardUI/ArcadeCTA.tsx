/**
 * ArcadeCTA - Retro-styled CTA buttons
 * 
 * Primary (filled) and secondary (outline) variants with glow effects.
 * Meets 44px minimum touch target requirement.
 * 
 * @module landing/arcade/DashboardUI/ArcadeCTA
 * Requirements: 4.4, 4.7, 6.3
 */

import { cn } from '@/utils/helpers';
import type { ArcadeCTAProps } from '../types';
import '../styles/arcade.css';

export function ArcadeCTA({
  variant,
  children,
  onClick,
  disabled = false,
  ariaLabel,
  onMouseEnter,
}: ArcadeCTAProps) {
  return (
    <button
      className={cn(
        'arcade-cta',
        variant === 'primary' && 'arcade-cta--primary',
        variant === 'secondary' && 'arcade-cta--secondary'
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

export default ArcadeCTA;
