/**
 * GlowBorder - Animated glowing border wrapper component
 * 
 * Wraps content with an animated gradient border and glow effect.
 * Uses GPU-accelerated CSS properties (transform, opacity) for performance.
 * 
 * @module landing/enterprise/GlowBorder
 * Requirements: 3.1, 3.2, 3.5
 */

import { useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/utils/helpers'

export type GlowBorderColor = 'orange' | 'purple' | 'blue'
export type GlowBorderIntensity = 'subtle' | 'medium' | 'strong'

export interface GlowBorderProps {
  /** Content to wrap */
  children: ReactNode
  /** Glow color theme */
  color?: GlowBorderColor
  /** Glow intensity */
  intensity?: GlowBorderIntensity
  /** Enable animation */
  animated?: boolean
  /** Pulse effect on hover */
  pulseOnHover?: boolean
  /** Additional CSS classes */
  className?: string
  /** Border radius */
  borderRadius?: string
}

// Color configurations
const GLOW_COLORS: Record<GlowBorderColor, { primary: string; secondary: string; glow: string }> = {
  orange: {
    primary: '#F97316',
    secondary: '#FB923C',
    glow: 'rgba(249, 115, 22, 0.4)',
  },
  purple: {
    primary: '#A855F7',
    secondary: '#C084FC',
    glow: 'rgba(168, 85, 247, 0.4)',
  },
  blue: {
    primary: '#3B82F6',
    secondary: '#60A5FA',
    glow: 'rgba(59, 130, 246, 0.4)',
  },
}

// Intensity configurations
const INTENSITY_CONFIG: Record<GlowBorderIntensity, { blur: number; spread: number; opacity: number }> = {
  subtle: { blur: 8, spread: 0, opacity: 0.3 },
  medium: { blur: 16, spread: 2, opacity: 0.5 },
  strong: { blur: 24, spread: 4, opacity: 0.7 },
}

/**
 * Get glow border styles for testing
 */
export function getGlowBorderStyles(
  color: GlowBorderColor = 'orange',
  intensity: GlowBorderIntensity = 'medium',
  isHovered: boolean = false
): { boxShadow: string; borderColor: string } {
  const colors = GLOW_COLORS[color]
  const config = isHovered 
    ? INTENSITY_CONFIG.strong 
    : INTENSITY_CONFIG[intensity]
  
  return {
    boxShadow: `0 0 ${config.blur}px ${config.spread}px ${colors.glow}`,
    borderColor: colors.primary,
  }
}

export function GlowBorder({
  children,
  color = 'orange',
  intensity = 'medium',
  animated = true,
  pulseOnHover = true,
  className,
  borderRadius = 'rounded-xl',
}: GlowBorderProps) {
  const [isHovered, setIsHovered] = useState(false)
  const colors = GLOW_COLORS[color]
  const config = isHovered && pulseOnHover 
    ? INTENSITY_CONFIG.strong 
    : INTENSITY_CONFIG[intensity]

  // Build box-shadow for glow effect
  const glowShadow = `0 0 ${config.blur}px ${config.spread}px ${colors.glow}`
  
  // Hover intensified shadow
  const hoverShadow = `0 0 ${INTENSITY_CONFIG.strong.blur}px ${INTENSITY_CONFIG.strong.spread}px ${colors.glow}`

  return (
    <div
      className={cn(
        'relative',
        borderRadius,
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated gradient border */}
      <div
        className={cn(
          'absolute inset-0 -z-10',
          borderRadius,
          animated && 'animate-glow-pulse'
        )}
        style={{
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary}, ${colors.primary})`,
          backgroundSize: animated ? '200% 200%' : '100% 100%',
          padding: '1px',
          opacity: config.opacity,
          // GPU-accelerated properties
          transform: 'translateZ(0)',
          willChange: animated ? 'background-position, opacity' : 'auto',
        }}
      >
        {/* Inner mask to create border effect */}
        <div 
          className={cn('w-full h-full bg-[#111113]', borderRadius)}
          style={{ margin: '1px' }}
        />
      </div>

      {/* Glow effect layer */}
      <div
        className={cn(
          'absolute inset-0 -z-20',
          borderRadius,
          'transition-all duration-300'
        )}
        style={{
          boxShadow: isHovered && pulseOnHover ? hoverShadow : glowShadow,
          // GPU-accelerated
          transform: 'translateZ(0)',
          willChange: 'box-shadow',
        }}
      />

      {/* Content */}
      <div className={cn('relative z-10', borderRadius)}>
        {children}
      </div>
    </div>
  )
}

export default GlowBorder
