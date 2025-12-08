/**
 * ParticleBurst - Canvas-based particle effect for CTA hover
 * Particles radiate outward from center
 * 
 * Validates: Requirements 1.8
 */

import { useEffect, useRef } from 'react'

interface ParticleBurstProps {
  count?: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
}

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#ffffff']

export function ParticleBurst({ count = 10 }: ParticleBurstProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match parent
    const rect = canvas.parentElement?.getBoundingClientRect()
    if (rect) {
      canvas.width = rect.width + 100
      canvas.height = rect.height + 100
    }

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    // Create particles
    particlesRef.current = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 4
      return {
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 0.5 + Math.random() * 0.5,
        size: 2 + Math.random() * 4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }
    })

    let lastTime = performance.now()

    const animate = (time: number) => {
      const deltaTime = (time - lastTime) / 1000
      lastTime = time

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      let allDead = true

      for (const particle of particlesRef.current) {
        if (particle.life <= 0) continue
        allDead = false

        // Update position
        particle.x += particle.vx
        particle.y += particle.vy
        
        // Apply friction
        particle.vx *= 0.98
        particle.vy *= 0.98
        
        // Decrease life
        particle.life -= deltaTime / particle.maxLife

        // Draw particle
        const alpha = Math.max(0, particle.life)
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        ctx.globalAlpha = alpha
        ctx.fill()
      }

      ctx.globalAlpha = 1

      if (!allDead) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [count])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 -m-[50px] pointer-events-none"
      style={{ width: 'calc(100% + 100px)', height: 'calc(100% + 100px)' }}
    />
  )
}
