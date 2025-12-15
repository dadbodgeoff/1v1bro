/**
 * SurvivalDemo - Survival runner demo component for landing page
 * 
 * Self-contained canvas-based endless runner demo that showcases
 * the survival mode gameplay. Runs AI-controlled for demonstration.
 * 
 * @module landing/enterprise/survival-demo/SurvivalDemo
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { cn } from '@/utils/helpers'
import { SurvivalDemoEngine } from './SurvivalDemoEngine'
import { SurvivalDemoHUD } from './SurvivalDemoHUD'
import type { DemoGameState } from './types'

export interface SurvivalDemoProps {
  /** Auto-start the demo on mount */
  autoPlay?: boolean
  /** Show the HUD overlay */
  showHUD?: boolean
  /** Additional CSS classes */
  className?: string
}

const defaultGameState: DemoGameState = {
  phase: 'intro',
  distance: 0,
  score: 0,
  speed: 200,
  combo: 0,
  lives: 3,
  maxLives: 3,
}

export function SurvivalDemo({
  autoPlay = true,
  showHUD = true,
  className,
}: SurvivalDemoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<SurvivalDemoEngine | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [gameState, setGameState] = useState<DemoGameState>(defaultGameState)

  // Update HUD from engine
  const updateHUD = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return
    setGameState(engine.getGameState())
  }, [])

  // Initialize engine
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      console.warn('[SurvivalDemo] Canvas ref not available')
      return
    }

    try {
      const engine = new SurvivalDemoEngine(canvas)
      engineRef.current = engine

      // Set up state change callback
      engine.setOnStateChange((state) => {
        setGameState(state)
      })

      // HUD update loop
      let hudInterval: number
      if (showHUD) {
        hudInterval = window.setInterval(updateHUD, 50) // 20fps for HUD
      }

      return () => {
        engine.destroy()
        engineRef.current = null
        if (hudInterval) clearInterval(hudInterval)
      }
    } catch (error) {
      console.error('[SurvivalDemo] Failed to initialize engine:', error)
    }
  }, [showHUD, updateHUD])

  // Handle visibility-based autoplay
  useEffect(() => {
    if (!autoPlay || !containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.3 }
    )

    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [autoPlay])

  // Start/stop based on visibility
  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return

    if (isVisible && autoPlay && !isPlaying) {
      engine.start()
      setIsPlaying(true)
    } else if (!isVisible && isPlaying) {
      engine.stop()
      setIsPlaying(false)
    }
  }, [isVisible, autoPlay, isPlaying])

  // Handle canvas resize
  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect()
      
      // Use container dimensions directly, fallback to reasonable defaults
      const width = rect.width || 400
      const height = rect.height || 225
      
      // Set canvas dimensions
      canvas.width = width
      canvas.height = height
    }

    // Initial resize
    resizeCanvas()
    
    // Also resize after a short delay to catch layout shifts
    const timeoutId = setTimeout(resizeCanvas, 100)
    
    window.addEventListener('resize', resizeCanvas)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      clearTimeout(timeoutId)
    }
  }, [])

  const handlePlayPause = () => {
    const engine = engineRef.current
    if (!engine) return

    if (isPlaying) {
      engine.stop()
      setIsPlaying(false)
    } else {
      engine.start()
      setIsPlaying(true)
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full aspect-video bg-[#09090B] rounded-xl overflow-hidden',
        'border border-white/10',
        className
      )}
    >
      {/* Game canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* HUD overlay */}
      {showHUD && (
        <SurvivalDemoHUD gameState={gameState} />
      )}

      {/* Play/Pause button (shown when paused) */}
      {!isPlaying && (
        <button
          onClick={handlePlayPause}
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            'bg-black/40 backdrop-blur-sm transition-opacity',
            'hover:bg-black/50'
          )}
          aria-label="Play demo"
        >
          <div className="w-16 h-16 rounded-full bg-[#F97316] flex items-center justify-center shadow-lg shadow-[#F97316]/30">
            <svg
              className="w-8 h-8 text-white ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
      )}

      {/* Glow border effect */}
      <div 
        className="absolute inset-0 pointer-events-none rounded-xl"
        style={{
          boxShadow: 'inset 0 0 30px rgba(249, 115, 22, 0.1)',
        }}
      />
    </div>
  )
}

export default SurvivalDemo
