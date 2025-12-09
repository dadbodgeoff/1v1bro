/**
 * AnimatedIcon - Scroll-triggered animated icons for HowItWorks section
 * 
 * Implements 4 icon types with scroll-triggered animations using Intersection Observer.
 * Uses GPU-accelerated CSS properties (transform, opacity) for performance.
 * 
 * @module landing/enterprise/AnimatedIcon
 * Requirements: 4.2
 */

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/utils/helpers'
import { ICON_SIZES } from './icons/IconBase'
import type { IconSize } from './icons/IconBase'

export type AnimatedIconType = 'matchmaking' | 'combat' | 'victory' | 'quiz'

export interface AnimatedIconProps {
  /** Icon type determines the animation style */
  icon: AnimatedIconType
  /** Icon size */
  size?: IconSize
  /** Enable animation (respects reduced motion) */
  animate?: boolean
  /** Additional CSS classes */
  className?: string
  /** Accessible label */
  'aria-label'?: string
}

/**
 * Animation configurations per icon type
 */
const ANIMATION_CONFIG: Record<AnimatedIconType, { 
  duration: number
  delay: number
  keyframes: string
}> = {
  matchmaking: {
    duration: 1000,
    delay: 0,
    keyframes: 'animate-matchmaking',
  },
  combat: {
    duration: 800,
    delay: 100,
    keyframes: 'animate-combat-pulse',
  },
  victory: {
    duration: 600,
    delay: 200,
    keyframes: 'animate-victory-bounce',
  },
  quiz: {
    duration: 700,
    delay: 150,
    keyframes: 'animate-quiz-flip',
  },
}

/**
 * Get animation class for testing
 */
export function getAnimationClass(icon: AnimatedIconType, isAnimating: boolean): string {
  if (!isAnimating) return ''
  return ANIMATION_CONFIG[icon].keyframes
}

/**
 * Check if reduced motion is preferred
 */
function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return reducedMotion
}

/**
 * Matchmaking icon - Two dots converging
 */
function MatchmakingIcon({ size, isAnimating }: { size: number; isAnimating: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      {/* Left dot */}
      <circle
        cx={isAnimating ? 10 : 6}
        cy="12"
        r="2"
        fill="currentColor"
        className={cn(
          'transition-all duration-500',
          isAnimating && 'animate-matchmaking-left'
        )}
        style={{
          transform: 'translateZ(0)',
          willChange: isAnimating ? 'cx' : 'auto',
        }}
      />
      {/* Right dot */}
      <circle
        cx={isAnimating ? 14 : 18}
        cy="12"
        r="2"
        fill="currentColor"
        className={cn(
          'transition-all duration-500',
          isAnimating && 'animate-matchmaking-right'
        )}
        style={{
          transform: 'translateZ(0)',
          willChange: isAnimating ? 'cx' : 'auto',
        }}
      />
      {/* Connection line (appears when converged) */}
      <line
        x1="10"
        y1="12"
        x2="14"
        y2="12"
        className={cn(
          'transition-opacity duration-300',
          isAnimating ? 'opacity-100' : 'opacity-0'
        )}
        style={{ transitionDelay: '400ms' }}
      />
    </svg>
  )
}

/**
 * Combat icon - Crosshairs with pulse
 */
function CombatIcon({ size, isAnimating }: { size: number; isAnimating: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        'shrink-0',
        isAnimating && 'animate-combat-pulse'
      )}
      style={{
        transform: 'translateZ(0)',
        willChange: isAnimating ? 'transform, opacity' : 'auto',
      }}
    >
      {/* Crosshairs */}
      <circle cx="12" cy="12" r="6" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      {/* Center dot */}
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  )
}

/**
 * Victory icon - Trophy with bounce
 */
function VictoryIcon({ size, isAnimating }: { size: number; isAnimating: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        'shrink-0',
        isAnimating && 'animate-victory-bounce'
      )}
      style={{
        transform: 'translateZ(0)',
        willChange: isAnimating ? 'transform' : 'auto',
      }}
    >
      {/* Trophy cup */}
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}

/**
 * Quiz icon - Question mark with flip
 */
function QuizIcon({ size, isAnimating }: { size: number; isAnimating: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        'shrink-0',
        isAnimating && 'animate-quiz-flip'
      )}
      style={{
        transform: 'translateZ(0)',
        transformStyle: 'preserve-3d',
        willChange: isAnimating ? 'transform' : 'auto',
      }}
    >
      {/* Circle background */}
      <circle cx="12" cy="12" r="10" />
      {/* Question mark */}
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </svg>
  )
}

/**
 * Icon component map
 */
const ICON_COMPONENTS: Record<AnimatedIconType, React.FC<{ size: number; isAnimating: boolean }>> = {
  matchmaking: MatchmakingIcon,
  combat: CombatIcon,
  victory: VictoryIcon,
  quiz: QuizIcon,
}

export function AnimatedIcon({
  icon,
  size = 'default',
  animate = true,
  className,
  'aria-label': ariaLabel,
}: AnimatedIconProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  const pixelSize = ICON_SIZES[size]
  const IconComponent = ICON_COMPONENTS[icon]
  const shouldAnimate = animate && !reducedMotion

  // Intersection Observer for scroll-triggered animation
  useEffect(() => {
    if (!shouldAnimate || hasAnimated) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            // Delay animation slightly for visual effect
            const config = ANIMATION_CONFIG[icon]
            setTimeout(() => {
              setIsAnimating(true)
              setHasAnimated(true)
              
              // Reset animation state after duration
              setTimeout(() => {
                setIsAnimating(false)
              }, config.duration + 500)
            }, config.delay)
          }
        })
      },
      { threshold: 0.5 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [shouldAnimate, hasAnimated, icon])

  return (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center',
        className
      )}
      role={ariaLabel ? 'img' : 'presentation'}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
      data-icon-type={icon}
      data-animating={isAnimating}
      data-animated={hasAnimated}
    >
      <IconComponent size={pixelSize} isAnimating={shouldAnimate && isAnimating} />
    </div>
  )
}

export default AnimatedIcon
