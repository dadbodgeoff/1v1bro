/**
 * HeroBackground - Canvas-based animated backdrop
 * Reuses existing backdrop layer classes for visual consistency
 * 
 * Validates: Requirements 1.2, 1.3, 1.4, 1.10
 */

import { useRef, useEffect } from 'react'
import { DeepSpaceLayer } from '@/game/backdrop/layers/DeepSpaceLayer'
import { HexGridLayer } from '@/game/backdrop/layers/HexGridLayer'
import { StarFieldLayer } from '@/game/backdrop/layers/StarFieldLayer'
import { NebulaLayer } from '@/game/backdrop/layers/NebulaLayer'
import { ShootingStarLayer } from '@/game/backdrop/layers/ShootingStarLayer'
import type { BackdropLayer, BackdropConfig } from '@/game/backdrop/types'

interface HeroBackgroundProps {
  reducedMotion: boolean
  parallaxOffset: number
}

export function HeroBackground({ reducedMotion, parallaxOffset }: HeroBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const layersRef = useRef<BackdropLayer[]>([])
  const configRef = useRef<BackdropConfig | null>(null)

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

      // Update config and reinitialize layers
      configRef.current = {
        width: window.innerWidth,
        height: window.innerHeight,
      }
      initializeLayers()
    }

    const initializeLayers = () => {
      if (!configRef.current) return

      const config = configRef.current

      // Base layers always included
      layersRef.current = [
        new DeepSpaceLayer(config),
        new HexGridLayer(config),
        new StarFieldLayer(config),
      ]

      // Add animated layers only if not reduced motion
      if (!reducedMotion) {
        layersRef.current.push(new NebulaLayer(config))
        layersRef.current.push(new ShootingStarLayer(config))
      }
    }

    resize()
    window.addEventListener('resize', resize)

    // Animation loop
    let lastTime = performance.now()

    const animate = (time: number) => {
      const deltaTime = (time - lastTime) / 1000
      lastTime = time

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Apply parallax transform
      ctx.save()
      ctx.translate(0, -parallaxOffset)

      // Update and render layers
      for (const layer of layersRef.current) {
        layer.update(deltaTime, time / 1000)
        layer.render(ctx)
      }

      ctx.restore()

      if (!reducedMotion) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    if (reducedMotion) {
      // Render once for reduced motion
      animate(performance.now())
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
