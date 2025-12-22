/**
 * HeroBackground - Simple animated backdrop for mobile-app branch
 * Simplified version without 2D game layer dependencies
 */

import { useRef, useEffect } from 'react'

interface HeroBackgroundProps {
  reducedMotion: boolean
  parallaxOffset: number
}

export function HeroBackground({ reducedMotion, parallaxOffset }: HeroBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.scale(dpr, dpr)
    }

    resize()
    window.addEventListener('resize', resize)

    // Simple star field
    const stars: { x: number; y: number; size: number; alpha: number }[] = []
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.3,
      })
    }

    // Animation loop
    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Dark gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight)
      gradient.addColorStop(0, '#0a0a0f')
      gradient.addColorStop(1, '#0f0f1a')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)

      // Apply parallax
      ctx.save()
      ctx.translate(0, -parallaxOffset * 0.3)

      // Draw stars
      for (const star of stars) {
        const twinkle = reducedMotion ? 1 : 0.7 + 0.3 * Math.sin(time / 1000 + star.x)
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha * twinkle})`
        ctx.fill()
      }

      ctx.restore()

      if (!reducedMotion) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    if (reducedMotion) {
      animate(0)
    } else {
      animationRef.current = requestAnimationFrame(animate)
    }

    return () => {
      window.removeEventListener('resize', resize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [reducedMotion, parallaxOffset])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    />
  )
}
