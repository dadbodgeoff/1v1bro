/**
 * SectionDivider - Animated gradient line between sections
 * 
 * Creates a horizontal gradient line with flowing animation effect.
 * Uses GPU-accelerated CSS for smooth performance.
 * 
 * @module landing/enterprise/SectionDivider
 * Requirements: 3.4
 */

import { cn } from '@/utils/helpers'

export interface SectionDividerProps {
  /** Additional CSS classes */
  className?: string
  /** Gradient color theme */
  color?: 'orange' | 'purple' | 'mixed'
  /** Animation enabled */
  animated?: boolean
}

const GRADIENT_COLORS = {
  orange: 'from-transparent via-[#F97316]/50 to-transparent',
  purple: 'from-transparent via-[#A855F7]/50 to-transparent',
  mixed: 'from-[#F97316]/30 via-[#A855F7]/50 to-[#3B82F6]/30',
}

export function SectionDivider({
  className,
  color = 'orange',
  animated = true,
}: SectionDividerProps) {
  return (
    <div
      className={cn(
        'relative w-full h-px overflow-hidden',
        className
      )}
      aria-hidden="true"
    >
      {/* Base line */}
      <div className="absolute inset-0 bg-white/[0.06]" />
      
      {/* Animated gradient overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-r',
          GRADIENT_COLORS[color],
          animated && 'animate-gradient-flow'
        )}
        style={{
          backgroundSize: animated ? '200% 100%' : '100% 100%',
          // GPU acceleration
          transform: 'translateZ(0)',
          willChange: animated ? 'background-position' : 'auto',
        }}
      />
      
      {/* Glow effect */}
      <div
        className={cn(
          'absolute inset-0 blur-sm bg-gradient-to-r',
          GRADIENT_COLORS[color],
          'opacity-50'
        )}
      />
    </div>
  )
}

export default SectionDivider
