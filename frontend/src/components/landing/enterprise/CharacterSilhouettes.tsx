/**
 * CharacterSilhouettes - Animated character silhouettes for hero section
 * 
 * Displays two opposing player silhouettes with idle animations
 * and occasional combat actions (shooting, dodging).
 * 
 * @module landing/enterprise/CharacterSilhouettes
 * Requirements: 4.1
 */

import { useEffect, useState } from 'react'
import { cn } from '@/utils/helpers'

export interface CharacterSilhouettesProps {
  /** Additional CSS classes */
  className?: string
  /** Disable animations for reduced motion */
  reducedMotion?: boolean
}

type CharacterAction = 'idle' | 'shoot' | 'dodge' | 'jump'

interface CharacterState {
  action: CharacterAction
  frame: number
}

export function CharacterSilhouettes({
  className,
  reducedMotion = false,
}: CharacterSilhouettesProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(reducedMotion)
  const [player1State, setPlayer1State] = useState<CharacterState>({ action: 'idle', frame: 0 })
  const [player2State, setPlayer2State] = useState<CharacterState>({ action: 'idle', frame: 0 })
  const [showProjectile, setShowProjectile] = useState(false)
  const [projectileDirection, setProjectileDirection] = useState<'left' | 'right'>('right')

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches || reducedMotion)
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches || reducedMotion)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [reducedMotion])

  // Animate characters with random actions
  useEffect(() => {
    if (prefersReducedMotion) return

    const actionInterval = setInterval(() => {
      // Randomly trigger actions
      const rand = Math.random()
      
      if (rand < 0.15) {
        // Player 1 shoots
        setPlayer1State({ action: 'shoot', frame: 0 })
        setProjectileDirection('right')
        setShowProjectile(true)
        setTimeout(() => {
          setPlayer1State({ action: 'idle', frame: 0 })
          setShowProjectile(false)
        }, 500)
      } else if (rand < 0.3) {
        // Player 2 shoots
        setPlayer2State({ action: 'shoot', frame: 0 })
        setProjectileDirection('left')
        setShowProjectile(true)
        setTimeout(() => {
          setPlayer2State({ action: 'idle', frame: 0 })
          setShowProjectile(false)
        }, 500)
      } else if (rand < 0.4) {
        // Player 1 dodges
        setPlayer1State({ action: 'dodge', frame: 0 })
        setTimeout(() => setPlayer1State({ action: 'idle', frame: 0 }), 400)
      } else if (rand < 0.5) {
        // Player 2 dodges
        setPlayer2State({ action: 'dodge', frame: 0 })
        setTimeout(() => setPlayer2State({ action: 'idle', frame: 0 }), 400)
      }
    }, 2000)

    return () => clearInterval(actionInterval)
  }, [prefersReducedMotion])

  if (prefersReducedMotion) {
    return null
  }

  return (
    <div
      className={cn(
        'absolute inset-0 pointer-events-none overflow-hidden',
        className
      )}
      aria-hidden="true"
    >
      {/* Player 1 (Orange) - Left side */}
      <div
        className={cn(
          'absolute bottom-[15%] left-[8%] md:left-[12%] transition-transform duration-200',
          player1State.action === 'shoot' && 'scale-110',
          player1State.action === 'dodge' && 'translate-y-[-20px]'
        )}
      >
        <CharacterSVG 
          color="#F97316" 
          facingRight={true}
          action={player1State.action}
        />
      </div>

      {/* Player 2 (Purple) - Right side */}
      <div
        className={cn(
          'absolute bottom-[15%] right-[8%] md:right-[12%] transition-transform duration-200',
          player2State.action === 'shoot' && 'scale-110',
          player2State.action === 'dodge' && 'translate-y-[-20px]'
        )}
      >
        <CharacterSVG 
          color="#A855F7" 
          facingRight={false}
          action={player2State.action}
        />
      </div>

      {/* Projectile */}
      {showProjectile && (
        <div
          className={cn(
            'absolute bottom-[20%] h-3 w-8 rounded-full',
            projectileDirection === 'right' 
              ? 'left-[15%] animate-projectile-right bg-gradient-to-r from-[#F97316] to-[#F97316]/50'
              : 'right-[15%] animate-projectile-left bg-gradient-to-l from-[#A855F7] to-[#A855F7]/50'
          )}
          style={{
            boxShadow: projectileDirection === 'right' 
              ? '0 0 20px #F97316, 0 0 40px #F97316/50'
              : '0 0 20px #A855F7, 0 0 40px #A855F7/50'
          }}
        />
      )}
    </div>
  )
}

interface CharacterSVGProps {
  color: string
  facingRight: boolean
  action: CharacterAction
}

function CharacterSVG({ color, facingRight, action }: CharacterSVGProps) {
  const transform = facingRight ? '' : 'scale(-1, 1)'
  const armRotation = action === 'shoot' ? -30 : 0
  
  return (
    <svg
      width="60"
      height="80"
      viewBox="0 0 60 80"
      className={cn(
        'opacity-70',
        action === 'idle' && 'animate-character-idle'
      )}
      style={{ transform }}
    >
      {/* Glow filter */}
      <defs>
        <filter id={`glow-${color}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Body silhouette */}
      <g filter={`url(#glow-${color})`}>
        {/* Head */}
        <circle cx="30" cy="15" r="12" fill={color} />
        
        {/* Body */}
        <rect x="22" y="27" width="16" height="25" rx="4" fill={color} />
        
        {/* Arms */}
        <rect 
          x="38" 
          y="30" 
          width="18" 
          height="6" 
          rx="3" 
          fill={color}
          style={{ 
            transformOrigin: '38px 33px',
            transform: `rotate(${armRotation}deg)`
          }}
        />
        <rect x="4" y="30" width="18" height="6" rx="3" fill={color} />
        
        {/* Legs */}
        <rect x="22" y="52" width="7" height="22" rx="3" fill={color} />
        <rect x="31" y="52" width="7" height="22" rx="3" fill={color} />
      </g>
    </svg>
  )
}

export default CharacterSilhouettes
