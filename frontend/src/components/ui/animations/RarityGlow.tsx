/**
 * RarityGlow - Ambient particle effects for rare items
 * 
 * Features:
 * - Floating particles around legendary/epic items
 * - Animated glow ring
 * - Shimmer effect for legendary
 * - Performance-optimized with canvas
 * - Respects reduced motion
 * 
 * Usage:
 * <RarityGlow rarity="legendary">
 *   <ItemCard />
 * </RarityGlow>
 */

import { useEffect, useRef, type ReactNode, type HTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/helpers'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { Rarity } from '@/types/cosmetic'

export interface RarityGlowProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  rarity: Rarity
  /** Show floating particles */
  particles?: boolean
  /** Number of particles (default based on rarity) */
  particleCount?: number
  /** Show animated glow ring */
  glowRing?: boolean
  /** Show shimmer overlay (legendary only) */
  shimmer?: boolean
  /** Intensity multiplier 0-2, default 1 */
  intensity?: number
}

// Rarity color configurations
const RARITY_COLORS: Record<Rarity, { primary: string; secondary: string; glow: string }> = {
  common: {
    primary: '#737373',
    secondary: '#a3a3a3',
    glow: 'rgba(115, 115, 115, 0.3)',
  },
  uncommon: {
    primary: '#10b981',
    secondary: '#34d399',
    glow: 'rgba(16, 185, 129, 0.4)',
  },
  rare: {
    primary: '#3b82f6',
    secondary: '#60a5fa',
    glow: 'rgba(59, 130, 246, 0.4)',
  },
  epic: {
    primary: '#a855f7',
    secondary: '#c084fc',
    glow: 'rgba(168, 85, 247, 0.5)',
  },
  legendary: {
    primary: '#f59e0b',
    secondary: '#fbbf24',
    glow: 'rgba(245, 158, 11, 0.5)',
  },
}

// Default particle counts by rarity
const DEFAULT_PARTICLE_COUNTS: Record<Rarity, number> = {
  common: 0,
  uncommon: 3,
  rare: 5,
  epic: 8,
  legendary: 12,
}

export function RarityGlow({
  children,
  rarity,
  particles = true,
  particleCount,
  glowRing = true,
  shimmer = true,
  intensity = 1,
  className,
  ...props
}: RarityGlowProps) {
  const { prefersReducedMotion } = useReducedMotion()
  const colors = RARITY_COLORS[rarity]
  const count = particleCount ?? DEFAULT_PARTICLE_COUNTS[rarity]
  
  // Skip effects for common rarity or reduced motion
  const showEffects = rarity !== 'common' && !prefersReducedMotion
  const showParticles = showEffects && particles && count > 0
  const showGlowRing = showEffects && glowRing
  const showShimmer = showEffects && shimmer && rarity === 'legendary'

  return (
    <div className={cn('relative', className)} {...props}>
      {/* Glow ring */}
      {showGlowRing && (
        <GlowRing color={colors.glow} intensity={intensity} rarity={rarity} />
      )}

      {/* Floating particles */}
      {showParticles && (
        <ParticleField 
          count={count} 
          colors={colors} 
          intensity={intensity} 
        />
      )}

      {/* Main content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Shimmer overlay for legendary */}
      {showShimmer && (
        <ShimmerOverlay color={colors.primary} />
      )}
    </div>
  )
}

// ============================================
// Glow Ring Component
// ============================================

function GlowRing({ 
  color, 
  intensity,
  rarity,
}: { 
  color: string
  intensity: number
  rarity: Rarity
}) {
  // Pulse animation - faster for higher rarities
  const duration = rarity === 'legendary' ? 2 : rarity === 'epic' ? 2.5 : 3

  return (
    <motion.div
      className="absolute inset-0 rounded-[inherit] pointer-events-none"
      style={{
        boxShadow: `0 0 ${20 * intensity}px ${color}, 0 0 ${40 * intensity}px ${color}`,
      }}
      animate={{
        boxShadow: [
          `0 0 ${20 * intensity}px ${color}, 0 0 ${40 * intensity}px ${color}`,
          `0 0 ${30 * intensity}px ${color}, 0 0 ${60 * intensity}px ${color}`,
          `0 0 ${20 * intensity}px ${color}, 0 0 ${40 * intensity}px ${color}`,
        ],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

// ============================================
// Particle Field (Canvas-based)
// ============================================

interface Particle {
  x: number
  y: number
  size: number
  speed: number
  angle: number
  opacity: number
  color: string
}

function ParticleField({ 
  count, 
  colors,
  intensity,
}: { 
  count: number
  colors: { primary: string; secondary: string }
  intensity: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const updateSize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()
      if (rect) {
        canvas.width = rect.width + 40
        canvas.height = rect.height + 40
      }
    }
    updateSize()

    // Initialize particles
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: (1 + Math.random() * 2) * intensity,
      speed: (0.2 + Math.random() * 0.3) * intensity,
      angle: Math.random() * Math.PI * 2,
      opacity: 0.3 + Math.random() * 0.7,
      color: Math.random() > 0.5 ? colors.primary : colors.secondary,
    }))

    let lastTime = performance.now()

    const animate = (time: number) => {
      const dt = (time - lastTime) / 16 // Normalize to ~60fps
      lastTime = time

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const particle of particlesRef.current) {
        // Float upward with slight horizontal drift
        particle.y -= particle.speed * dt
        particle.x += Math.sin(particle.angle) * 0.3 * dt
        particle.angle += 0.02 * dt

        // Wrap around
        if (particle.y < -10) {
          particle.y = canvas.height + 10
          particle.x = Math.random() * canvas.width
        }
        if (particle.x < -10) particle.x = canvas.width + 10
        if (particle.x > canvas.width + 10) particle.x = -10

        // Pulse opacity
        const pulse = 0.5 + 0.5 * Math.sin(time / 1000 + particle.angle)
        
        // Draw particle with glow
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        ctx.globalAlpha = particle.opacity * pulse
        ctx.fill()
        
        // Add glow
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        ctx.globalAlpha = particle.opacity * pulse * 0.3
        ctx.fill()
      }

      ctx.globalAlpha = 1
      frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [count, colors, intensity])

  return (
    <canvas
      ref={canvasRef}
      className="absolute -inset-5 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}

// ============================================
// Shimmer Overlay
// ============================================

function ShimmerOverlay({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute inset-0 rounded-[inherit] pointer-events-none overflow-hidden"
      style={{ zIndex: 20 }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(105deg, transparent 40%, ${color}20 50%, transparent 60%)`,
          backgroundSize: '200% 100%',
        }}
        animate={{
          backgroundPosition: ['200% 0', '-200% 0'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </motion.div>
  )
}
