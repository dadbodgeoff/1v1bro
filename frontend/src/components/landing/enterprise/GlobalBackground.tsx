/**
 * GlobalBackground - Full-page animated background system
 * 
 * Multi-layer parallax background with particles, nebula effects,
 * floating platforms, energy orbs, and projectile trails.
 * Spans the entire landing page for immersive game atmosphere.
 * 
 * @module landing/enterprise/GlobalBackground
 * Requirements: 1.1, 1.2, 1.3, 1.5, 5.2, 5.4
 */

import { useEffect, useState, useRef, useCallback } from 'react'
import { cn } from '@/utils/helpers'

export interface GlobalBackgroundProps {
  /** Additional CSS classes */
  className?: string
  /** Override particle count (default: auto based on viewport) */
  particleCount?: number
  /** Disable parallax effect */
  disableParallax?: boolean
}

interface Particle {
  id: number
  x: number
  y: number
  size: number
  speed: number
  opacity: number
  type: 'ember' | 'star' | 'orb' | 'projectile'
  angle?: number
  color: string
}

// Particle configuration by viewport
const PARTICLE_CONFIG = {
  desktop: { embers: 30, stars: 80, orbs: 6, projectiles: 4 },
  mobile: { embers: 12, stars: 30, orbs: 3, projectiles: 2 },
}

// Colors
const COLORS = {
  ember: '#F97316',
  emberGlow: 'rgba(249, 115, 22, 0.6)',
  star: '#FFFFFF',
  orb: '#A855F7',
  orbGlow: 'rgba(168, 85, 247, 0.4)',
  projectile: '#3B82F6',
  projectileGlow: 'rgba(59, 130, 246, 0.5)',
  nebulaPurple: 'rgba(139, 92, 246, 0.08)',
  nebulaOrange: 'rgba(249, 115, 22, 0.06)',
}

export function GlobalBackground({
  className,
  particleCount,
  disableParallax = false,
}: GlobalBackgroundProps) {
  const [scrollY, setScrollY] = useState(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  // Detect reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Track scroll for parallax
  useEffect(() => {
    if (prefersReducedMotion || disableParallax) return

    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [prefersReducedMotion, disableParallax])


  // Initialize particles
  const initParticles = useCallback(() => {
    const config = isMobile ? PARTICLE_CONFIG.mobile : PARTICLE_CONFIG.desktop
    const particles: Particle[] = []
    let id = 0

    // Create embers (rise from bottom)
    const emberCount = particleCount ? Math.floor(particleCount * 0.4) : config.embers
    for (let i = 0; i < emberCount; i++) {
      particles.push({
        id: id++,
        x: Math.random() * 100,
        y: 100 + Math.random() * 20,
        size: 2 + Math.random() * 3,
        speed: 0.3 + Math.random() * 0.5,
        opacity: 0.4 + Math.random() * 0.4,
        type: 'ember',
        color: COLORS.ember,
      })
    }

    // Create stars (slow drift)
    const starCount = particleCount ? Math.floor(particleCount * 0.5) : config.stars
    for (let i = 0; i < starCount; i++) {
      particles.push({
        id: id++,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1 + Math.random() * 2,
        speed: 0.02 + Math.random() * 0.05,
        opacity: 0.3 + Math.random() * 0.5,
        type: 'star',
        color: COLORS.star,
      })
    }

    // Create orbs (floating with glow)
    const orbCount = particleCount ? Math.floor(particleCount * 0.08) : config.orbs
    for (let i = 0; i < orbCount; i++) {
      particles.push({
        id: id++,
        x: Math.random() * 100,
        y: 20 + Math.random() * 60,
        size: 8 + Math.random() * 12,
        speed: 0.1 + Math.random() * 0.15,
        opacity: 0.3 + Math.random() * 0.3,
        type: 'orb',
        angle: Math.random() * Math.PI * 2,
        color: COLORS.orb,
      })
    }

    // Create projectiles (fast horizontal)
    const projectileCount = particleCount ? Math.floor(particleCount * 0.05) : config.projectiles
    for (let i = 0; i < projectileCount; i++) {
      particles.push({
        id: id++,
        x: -10,
        y: 10 + Math.random() * 80,
        size: 4 + Math.random() * 4,
        speed: 2 + Math.random() * 3,
        opacity: 0.6 + Math.random() * 0.3,
        type: 'projectile',
        angle: (Math.random() - 0.5) * 0.3,
        color: COLORS.projectile,
      })
    }

    particlesRef.current = particles
  }, [isMobile, particleCount])

  // Animation loop
  const animate = useCallback((timestamp: number) => {
    if (prefersReducedMotion) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const deltaTime = timestamp - lastTimeRef.current
    lastTimeRef.current = timestamp

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Update and draw particles
    particlesRef.current.forEach((particle) => {
      // Update position based on type
      switch (particle.type) {
        case 'ember':
          particle.y -= particle.speed * (deltaTime / 16)
          particle.x += Math.sin(timestamp / 1000 + particle.id) * 0.02
          if (particle.y < -5) {
            particle.y = 105
            particle.x = Math.random() * 100
          }
          break
        case 'star':
          particle.y += particle.speed * (deltaTime / 16)
          if (particle.y > 105) particle.y = -5
          break
        case 'orb':
          particle.angle = (particle.angle || 0) + 0.001 * (deltaTime / 16)
          particle.x += Math.sin(particle.angle) * 0.03
          particle.y += Math.cos(particle.angle * 0.7) * 0.02
          break
        case 'projectile':
          particle.x += particle.speed * (deltaTime / 16)
          particle.y += (particle.angle || 0) * (deltaTime / 16)
          if (particle.x > 110) {
            particle.x = -10
            particle.y = 10 + Math.random() * 80
            particle.angle = (Math.random() - 0.5) * 0.3
          }
          break
      }

      // Convert percentage to pixels
      const x = (particle.x / 100) * canvas.width
      const y = (particle.y / 100) * canvas.height

      // Draw particle
      ctx.save()
      ctx.globalAlpha = particle.opacity

      if (particle.type === 'ember' || particle.type === 'orb' || particle.type === 'projectile') {
        // Draw glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, particle.size * 2)
        const glowColor = particle.type === 'ember' ? COLORS.emberGlow 
          : particle.type === 'orb' ? COLORS.orbGlow 
          : COLORS.projectileGlow
        gradient.addColorStop(0, particle.color)
        gradient.addColorStop(0.5, glowColor)
        gradient.addColorStop(1, 'transparent')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, particle.size * 2, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw core
      ctx.fillStyle = particle.color
      ctx.beginPath()
      ctx.arc(x, y, particle.size, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    })

    animationRef.current = requestAnimationFrame(animate)
  }, [prefersReducedMotion])


  // Setup canvas and start animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = document.documentElement.scrollHeight
    }

    resizeCanvas()
    initParticles()

    if (!prefersReducedMotion) {
      lastTimeRef.current = performance.now()
      animationRef.current = requestAnimationFrame(animate)
    }

    window.addEventListener('resize', resizeCanvas)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [initParticles, animate, prefersReducedMotion])

  // Parallax style helper
  const parallaxStyle = (ratio: number): React.CSSProperties => {
    if (prefersReducedMotion || disableParallax) return {}
    return {
      transform: `translateY(${scrollY * ratio}px)`,
      willChange: 'transform',
    }
  }

  return (
    <div
      className={cn(
        'fixed inset-0 overflow-hidden pointer-events-none',
        className
      )}
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {/* Layer 1: Deep gradient background */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-[#09090B] via-[#0F0F12] to-[#09090B]"
        style={parallaxStyle(0)}
      />

      {/* Layer 2: Nebula clouds */}
      <div 
        className="absolute inset-0"
        style={parallaxStyle(0.1)}
      >
        {/* Purple nebula - top right */}
        <div 
          className="absolute top-[10%] right-[10%] w-[600px] h-[600px] rounded-full blur-[120px]"
          style={{ background: COLORS.nebulaPurple }}
        />
        {/* Orange nebula - bottom left */}
        <div 
          className="absolute bottom-[20%] left-[5%] w-[500px] h-[500px] rounded-full blur-[100px]"
          style={{ background: COLORS.nebulaOrange }}
        />
        {/* Purple nebula - mid */}
        <div 
          className="absolute top-[50%] left-[30%] w-[400px] h-[400px] rounded-full blur-[80px]"
          style={{ background: COLORS.nebulaPurple }}
        />
      </div>

      {/* Layer 3: Floating platforms (parallax 0.3x) */}
      {!prefersReducedMotion && (
        <div 
          className="absolute inset-0"
          style={parallaxStyle(0.3)}
        >
          <FloatingPlatform className="top-[15%] left-[8%]" size="lg" delay={0} />
          <FloatingPlatform className="top-[35%] right-[12%]" size="md" delay={1.5} />
          <FloatingPlatform className="top-[60%] left-[15%]" size="sm" delay={0.8} />
          <FloatingPlatform className="top-[75%] right-[20%]" size="md" delay={2.2} />
        </div>
      )}

      {/* Layer 4: Particle canvas (embers, stars, orbs, projectiles) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={parallaxStyle(0.5)}
      />

      {/* Layer 5: Horizon glow at bottom */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-[#DC2626]/10 via-[#F97316]/5 to-transparent"
        style={parallaxStyle(0.2)}
      />

      {/* Layer 6: Vignette overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(9,9,11,0.7)_100%)]" />
    </div>
  )
}

/**
 * Floating platform element with gentle animation
 */
interface FloatingPlatformProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  delay?: number
}

function FloatingPlatform({ className, size = 'md', delay = 0 }: FloatingPlatformProps) {
  const sizeClasses = {
    sm: 'w-12 h-4',
    md: 'w-20 h-6',
    lg: 'w-28 h-8',
  }

  return (
    <div
      className={cn(
        'absolute rounded bg-[#1A1A1E] opacity-40',
        sizeClasses[size],
        'animate-float-slow',
        className
      )}
      style={{ animationDelay: `${delay}s` }}
    />
  )
}

export default GlobalBackground
