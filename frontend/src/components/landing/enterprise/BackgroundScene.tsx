/**
 * BackgroundScene - Multi-layer background system
 * 
 * Creates immersive arena scene with 4 depth layers:
 * - Far: Mountain silhouettes with horizon glow
 * - Mid: Arena silhouette with parallax
 * - Near: Floating platforms with rotation
 * - Foreground: Ember particles
 * 
 * @module landing/enterprise/BackgroundScene
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */

import { useEffect, useState, useRef } from 'react'
import { cn } from '@/utils/helpers'
import { CharacterSilhouettes } from './CharacterSilhouettes'

export interface BackgroundSceneProps {
  /** Additional CSS classes */
  className?: string
  /** Disable animations for reduced motion */
  reducedMotion?: boolean
}

export function BackgroundScene({
  className,
  reducedMotion = false,
}: BackgroundSceneProps) {
  const [scrollY, setScrollY] = useState(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(reducedMotion)
  const containerRef = useRef<HTMLDivElement>(null)

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches || reducedMotion)
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches || reducedMotion)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [reducedMotion])

  // Track scroll for parallax
  useEffect(() => {
    if (prefersReducedMotion) return

    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [prefersReducedMotion])

  const parallaxStyle = (ratio: number) => {
    if (prefersReducedMotion) return {}
    return {
      transform: `translateY(${scrollY * ratio}px)`,
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'absolute inset-0 overflow-hidden',
        'bg-[#0A0A0B]',
        className
      )}
      aria-hidden="true"
    >
      {/* Far Layer - Mountains with horizon glow */}
      <div
        className="absolute inset-0 z-0"
        style={parallaxStyle(0)}
      >
        {/* Horizon glow */}
        <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-[#DC2626]/20 to-transparent" />
        
        {/* Mountain silhouettes */}
        <svg
          className="absolute bottom-0 left-0 right-0 w-full h-[60%]"
          viewBox="0 0 1440 400"
          preserveAspectRatio="xMidYMax slice"
          fill="#1A0A0A"
        >
          <path d="M0,400 L0,300 Q200,200 400,280 T800,220 T1200,300 T1440,250 L1440,400 Z" />
          <path d="M0,400 L0,320 Q300,250 600,300 T1100,260 T1440,320 L1440,400 Z" opacity="0.7" />
        </svg>
        
        {/* Animated pulse */}
        {!prefersReducedMotion && (
          <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-[#DC2626]/10 to-transparent animate-pulse" 
               style={{ animationDuration: '2s' }} />
        )}
      </div>

      {/* Mid Layer - Arena silhouette */}
      <div
        className="absolute inset-0 z-10 opacity-60"
        style={parallaxStyle(0.3)}
      >
        <svg
          className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-[80%] max-w-4xl h-auto"
          viewBox="0 0 800 300"
          fill="#222226"
        >
          {/* Arena platform */}
          <rect x="100" y="200" width="600" height="40" rx="4" />
          <rect x="200" y="150" width="150" height="20" rx="2" />
          <rect x="450" y="150" width="150" height="20" rx="2" />
          <rect x="300" y="100" width="200" height="15" rx="2" />
          {/* Pillars */}
          <rect x="80" y="100" width="20" height="140" rx="2" />
          <rect x="700" y="100" width="20" height="140" rx="2" />
        </svg>
      </div>

      {/* Near Layer - Floating platforms */}
      <div
        className="absolute inset-0 z-20 opacity-80"
        style={parallaxStyle(0.6)}
      >
        {/* Floating rocks */}
        <div 
          className={cn(
            "absolute top-[20%] left-[10%] w-16 h-8 bg-[#2D2D2D] rounded",
            !prefersReducedMotion && "animate-float-slow"
          )}
        />
        <div 
          className={cn(
            "absolute top-[30%] right-[15%] w-20 h-10 bg-[#2D2D2D] rounded",
            !prefersReducedMotion && "animate-float-slow"
          )}
          style={{ animationDelay: '1s' }}
        />
        <div 
          className={cn(
            "absolute top-[50%] left-[5%] w-12 h-6 bg-[#2D2D2D] rounded",
            !prefersReducedMotion && "animate-float-slow"
          )}
          style={{ animationDelay: '2s' }}
        />
      </div>

      {/* Foreground Layer - Particles */}
      {!prefersReducedMotion && (
        <div
          className="absolute inset-0 z-30 pointer-events-none"
          style={parallaxStyle(1.2)}
        >
          <EmberParticles count={30} />
        </div>
      )}

      {/* Character Silhouettes */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 z-35">
          <CharacterSilhouettes reducedMotion={prefersReducedMotion} />
        </div>
      )}

      {/* Vignette overlay */}
      <div className="absolute inset-0 z-40 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(10,10,11,0.6)_100%)]" />
    </div>
  )
}

/**
 * Ember particle system
 */
function EmberParticles({ count }: { count: number }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 5}s`,
    duration: `${3 + Math.random() * 4}s`,
    size: 2 + Math.random() * 3,
  }))

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute bottom-0 rounded-full bg-[#E85D04]/60 animate-rise"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </>
  )
}

export default BackgroundScene
