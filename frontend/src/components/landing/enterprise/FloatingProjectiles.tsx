/**
 * FloatingProjectiles - Decorative projectile effects across sections
 * 
 * Creates floating projectile trails that animate across the page
 * for visual interest and game theming.
 * 
 * @module landing/enterprise/FloatingProjectiles
 * Requirements: 4.3
 */

import { useEffect, useState } from 'react'
import { cn } from '@/utils/helpers'

export interface FloatingProjectilesProps {
  /** Number of projectiles to display */
  count?: number
  /** Additional CSS classes */
  className?: string
}

interface Projectile {
  id: number
  startX: number
  startY: number
  direction: 'left' | 'right'
  color: string
  delay: number
  duration: number
  size: number
}

const COLORS = ['#F97316', '#A855F7', '#EF4444', '#F59E0B']

export function FloatingProjectiles({
  count = 6,
  className,
}: FloatingProjectilesProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [projectiles, setProjectiles] = useState<Projectile[]>([])

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Generate projectiles
  useEffect(() => {
    const generated: Projectile[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      startX: Math.random() * 100,
      startY: 10 + Math.random() * 80, // 10-90% of viewport height
      direction: Math.random() > 0.5 ? 'left' : 'right',
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 8,
      duration: 4 + Math.random() * 4, // 4-8 seconds
      size: 3 + Math.random() * 3, // 3-6px
    }))
    setProjectiles(generated)
  }, [count])

  if (prefersReducedMotion) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed inset-0 pointer-events-none overflow-hidden z-[5]',
        className
      )}
      aria-hidden="true"
    >
      {projectiles.map((p) => (
        <div
          key={p.id}
          className={cn(
            'absolute rounded-full',
            p.direction === 'right' ? 'animate-float-projectile-right' : 'animate-float-projectile-left'
          )}
          style={{
            top: `${p.startY}%`,
            left: p.direction === 'right' ? '-5%' : 'auto',
            right: p.direction === 'left' ? '-5%' : 'auto',
            width: p.size * 4,
            height: p.size,
            background: `linear-gradient(${p.direction === 'right' ? '90deg' : '270deg'}, ${p.color}, transparent)`,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}, 0 0 ${p.size * 4}px ${p.color}50`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            opacity: 0.6,
          }}
        />
      ))}
    </div>
  )
}

export default FloatingProjectiles
