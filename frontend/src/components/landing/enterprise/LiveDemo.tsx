/**
 * LiveDemo - Enterprise-grade live gameplay demo for landing page
 * 
 * Renders a real-time AI vs AI match showcase with full HUD overlay.
 * Uses canvas rendering with a 30-second seamless loop.
 * 
 * @module landing/enterprise/LiveDemo
 * Requirements: 2.1, 2.4
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { cn } from '@/utils/helpers'
import { DemoGameEngine } from './demo/DemoGameEngine'
import { DemoHUD } from './demo/DemoHUD'
import type { DemoMatchState, DemoPlayerState, DemoQuestion, KillFeedEntry } from './demo/types'

export interface LiveDemoProps {
  /** Auto-start the demo on mount */
  autoPlay?: boolean
  /** Show the HUD overlay */
  showHUD?: boolean
  /** Additional CSS classes */
  className?: string
}

// Default player states for initial render
const defaultPlayer: DemoPlayerState = {
  id: 'player1',
  position: { x: 150, y: 225 },
  velocity: { x: 0, y: 0 },
  health: 100,
  maxHealth: 100,
  score: 0,
  color: '#F97316',
  isAlive: true,
  facingRight: true,
}

const defaultMatchState: DemoMatchState = {
  phase: 'intro',
  timeInPhase: 0,
  isPlaying: false,
}

export function LiveDemo({
  autoPlay = true,
  showHUD = true,
  className,
}: LiveDemoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<DemoGameEngine | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // HUD state
  const [player1, setPlayer1] = useState<DemoPlayerState>(defaultPlayer)
  const [player2, setPlayer2] = useState<DemoPlayerState>({ ...defaultPlayer, id: 'player2', color: '#A855F7', position: { x: 650, y: 225 }, facingRight: false })
  const [question, setQuestion] = useState<DemoQuestion | null>(null)
  const [questionTimer, setQuestionTimer] = useState(0)
  const [killFeed, setKillFeed] = useState<KillFeedEntry[]>([])
  const [matchState, setMatchState] = useState<DemoMatchState>(defaultMatchState)
  const [matchTime, setMatchTime] = useState(0)
  const [ai1Answer, setAi1Answer] = useState<number | null>(null)
  const [ai2Answer, setAi2Answer] = useState<number | null>(null)

  // Update HUD from engine
  const updateHUD = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return

    setPlayer1(engine.getPlayer1())
    setPlayer2(engine.getPlayer2())
    setQuestion(engine.getCurrentQuestion())
    setQuestionTimer(engine.getQuestionTimer())
    setKillFeed(engine.getKillFeed())
    setMatchState(engine.getMatchState())
    setMatchTime(engine.getMatchTime())
    setAi1Answer(engine.getAI1Answer())
    setAi2Answer(engine.getAI2Answer())
  }, [])

  // Initialize engine
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const engine = new DemoGameEngine(canvas)
    engineRef.current = engine

    // Set up state change callback
    engine.setOnStateChange(() => {
      updateHUD()
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
      const aspectRatio = 800 / 450 // Demo arena aspect ratio
      
      let width = rect.width
      let height = width / aspectRatio

      if (height > rect.height) {
        height = rect.height
        width = height * aspectRatio
      }

      canvas.width = width
      canvas.height = height
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => window.removeEventListener('resize', resizeCanvas)
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
        <DemoHUD
          player1={player1}
          player2={player2}
          question={question}
          questionTimer={questionTimer}
          killFeed={killFeed}
          matchState={matchState}
          matchTime={matchTime}
          loopDuration={30000}
          ai1Answer={ai1Answer}
          ai2Answer={ai2Answer}
        />
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

export default LiveDemo
