/**
 * Confetti Component - 2025 Design System
 * Requirements: 7.5
 *
 * Particle burst animation with:
 * - Configurable particle count and colors
 * - Rarity-based presets (common: 20, legendary: 100)
 * - 1-2 second duration
 */

import { useEffect, useRef, useCallback } from 'react'

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  rotation: number
  rotationSpeed: number
  life: number
  maxLife: number
}

interface ConfettiConfig {
  particleCount: number
  colors: string[]
  duration: number // ms
  spread: number // degrees
  startVelocity: number
  gravity: number
}

const rarityConfigs: Record<Rarity, ConfettiConfig> = {
  common: {
    particleCount: 20,
    colors: ['#737373', '#a3a3a3', '#d4d4d4', '#ffffff'],
    duration: 1000,
    spread: 60,
    startVelocity: 25,
    gravity: 0.5,
  },
  uncommon: {
    particleCount: 40,
    colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
    duration: 1200,
    spread: 70,
    startVelocity: 30,
    gravity: 0.5,
  },
  rare: {
    particleCount: 60,
    colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'],
    duration: 1500,
    spread: 80,
    startVelocity: 35,
    gravity: 0.4,
  },
  epic: {
    particleCount: 80,
    colors: ['#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff'],
    duration: 1800,
    spread: 90,
    startVelocity: 40,
    gravity: 0.4,
  },
  legendary: {
    particleCount: 100,
    colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#ffffff'],
    duration: 2000,
    spread: 100,
    startVelocity: 45,
    gravity: 0.35,
  },
}

interface ConfettiProps {
  active: boolean
  rarity?: Rarity
  originX?: number // 0-1, default 0.5 (center)
  originY?: number // 0-1, default 0.5 (center)
  onComplete?: () => void
}

export function Confetti({
  active,
  rarity = 'common',
  originX = 0.5,
  originY = 0.5,
  onComplete,
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)

  const createParticles = useCallback(
    (canvas: HTMLCanvasElement) => {
      const config = rarityConfigs[rarity]
      const particles: Particle[] = []
      const centerX = canvas.width * originX
      const centerY = canvas.height * originY

      for (let i = 0; i < config.particleCount; i++) {
        const angle =
          ((Math.random() * config.spread - config.spread / 2) * Math.PI) / 180 -
          Math.PI / 2
        const velocity =
          config.startVelocity * (0.5 + Math.random() * 0.5)

        particles.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          color: config.colors[Math.floor(Math.random() * config.colors.length)],
          size: 4 + Math.random() * 6,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10,
          life: config.duration,
          maxLife: config.duration,
        })
      }

      return particles
    },
    [rarity, originX, originY]
  )

  const animate = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const config = rarityConfigs[rarity]
      const elapsed = timestamp - startTimeRef.current

      if (elapsed >= config.duration) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        particlesRef.current = []
        onComplete?.()
        return
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particlesRef.current.forEach((particle) => {
        // Update physics
        particle.vy += config.gravity
        particle.x += particle.vx
        particle.y += particle.vy
        particle.rotation += particle.rotationSpeed
        particle.life -= 16 // ~60fps

        // Calculate opacity based on life
        const lifeRatio = particle.life / particle.maxLife
        const opacity = Math.min(1, lifeRatio * 2)

        // Draw particle
        ctx.save()
        ctx.translate(particle.x, particle.y)
        ctx.rotate((particle.rotation * Math.PI) / 180)
        ctx.globalAlpha = opacity
        ctx.fillStyle = particle.color
        ctx.fillRect(
          -particle.size / 2,
          -particle.size / 2,
          particle.size,
          particle.size * 0.6
        )
        ctx.restore()
      })

      animationRef.current = requestAnimationFrame(animate)
    },
    [rarity, onComplete]
  )

  useEffect(() => {
    if (!active) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    // Set canvas size to window
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Create particles and start animation
    particlesRef.current = createParticles(canvas)
    startTimeRef.current = performance.now()
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [active, createParticles, animate])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 'var(--z-confetti)' }}
      aria-hidden="true"
    />
  )
}
