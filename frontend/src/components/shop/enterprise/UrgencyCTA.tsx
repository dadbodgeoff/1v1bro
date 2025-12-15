/**
 * UrgencyCTA - Conversion-Focused Action Button
 * 
 * Features:
 * - Multiple urgency variants (get now, limited, last chance, bundle)
 * - Animated effects for high-urgency states
 * - Loading and disabled states
 * - Pulse animation for limited items
 * - Sound feedback on hover/click (Enterprise Polish 2025)
 */

import { cn } from '@/utils/helpers'
import { useUISound } from '@/hooks/useUISound'

interface UrgencyCTAProps {
  variant?: 'default' | 'limited' | 'lastChance' | 'bundle' | 'owned'
  label?: string
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  className?: string
}

const variantStyles = {
  default: {
    base: 'bg-[#6366f1] hover:bg-[#4f46e5] text-white',
    glow: 'hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]',
    label: 'Get Now',
  },
  limited: {
    base: 'bg-gradient-to-r from-[#f97316] to-[#ef4444] hover:from-[#ea580c] hover:to-[#dc2626] text-white',
    glow: 'hover:shadow-[0_0_25px_rgba(249,115,22,0.5)]',
    label: 'Limited Time',
  },
  lastChance: {
    base: 'bg-[#f43f5e] hover:bg-[#e11d48] text-white animate-pulse',
    glow: 'shadow-[0_0_20px_rgba(244,63,94,0.4)]',
    label: 'Last Chance!',
  },
  bundle: {
    base: 'bg-gradient-to-r from-[#10b981] to-[#06b6d4] hover:from-[#059669] hover:to-[#0891b2] text-white',
    glow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]',
    label: 'Get Bundle',
  },
  owned: {
    base: 'bg-[var(--color-bg-elevated)] text-[#10b981] border border-[#10b981]/30 cursor-default',
    glow: '',
    label: 'Owned',
  },
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs font-bold uppercase tracking-wide',
  md: 'px-4 py-2 text-sm font-bold',
  lg: 'px-6 py-3 text-base font-bold',
}

export function UrgencyCTA({
  variant = 'default',
  label,
  onClick,
  disabled = false,
  loading = false,
  size = 'md',
  fullWidth = false,
  className,
}: UrgencyCTAProps) {
  const styles = variantStyles[variant]
  const isOwned = variant === 'owned'
  const { playHover, playClick } = useUISound()

  const handleClick = () => {
    if (!disabled && !loading && !isOwned) {
      playClick()
      onClick()
    }
  }

  return (
    <button
      onClick={handleClick}
      onMouseEnter={playHover}
      disabled={disabled || loading || isOwned}
      aria-label={label || styles.label}
      aria-busy={loading}
      className={cn(
        'relative font-semibold rounded-lg transition-all duration-200',
        'flex items-center justify-center gap-2',
        // Accessibility utilities
        'focus-ring press-feedback touch-target',
        sizeStyles[size],
        styles.base,
        styles.glow,
        fullWidth && 'w-full',
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {/* Loading Spinner */}
      {loading && (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      
      {/* Owned Checkmark */}
      {isOwned && (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
      
      {/* Label */}
      <span>{label || styles.label}</span>
      
      {/* Urgency Indicator for limited/lastChance */}
      {(variant === 'limited' || variant === 'lastChance') && !loading && (
        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
      )}
    </button>
  )
}
