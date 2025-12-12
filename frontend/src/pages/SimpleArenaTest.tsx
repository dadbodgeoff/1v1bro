/**
 * SimpleArenaTest - Test page for the Simple Arena floor tile rendering
 * 
 * Displays the 16x9 grid of 88x88 floor tiles scaled to 80x80
 * with a player spawn point for visual verification.
 */

import { useEffect, useRef, useState } from 'react'
import { SimpleArenaRenderer } from '@/game/terrain/SimpleArenaRenderer'
import { ARENA_SIZE } from '@/game/config'
import { SIMPLE_ARENA } from '@/game/config/maps/simple-arena'

export function SimpleArenaTest() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<SimpleArenaRenderer | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const [showWalls, setShowWalls] = useState(true)
  const [showProps, setShowProps] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Initialize renderer
    const renderer = new SimpleArenaRenderer()
    rendererRef.current = renderer
    renderer.setContext({ ctx, animationTime: 0, scale: 1 })

    // Load tile and start render loop
    renderer.loadTile().then(() => {
      setLoaded(true)
    })

    // Animation loop
    let animationId: number
    let lastTime = 0

    const animate = (time: number) => {
      const deltaTime = (time - lastTime) / 1000
      lastTime = time

      renderer.update(deltaTime)
      
      // Clear canvas
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Render floor tiles
      renderer.render()

      // Draw player spawn points
      ctx.fillStyle = '#00ff00'
      ctx.beginPath()
      ctx.arc(SIMPLE_ARENA.spawnPoints[0].position.x, SIMPLE_ARENA.spawnPoints[0].position.y, 15, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#ff0000'
      ctx.beginPath()
      ctx.arc(SIMPLE_ARENA.spawnPoints[1].position.x, SIMPLE_ARENA.spawnPoints[1].position.y, 15, 0, Math.PI * 2)
      ctx.fill()

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [])

  // Toggle grid
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setShowGrid(showGrid)
    }
  }, [showGrid])

  // Toggle walls
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setShowWalls(showWalls)
    }
  }, [showWalls])

  // Toggle props
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setShowProps(showProps)
    }
  }, [showProps])

  // Hexagon background URL
  const hexBgUrl = 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/skins/Generated%20Image%20December%2012,%202025%20-%2012_04AM.jpeg'

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundColor: '#000',
        backgroundImage: `url(${hexBgUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Controls - positioned at top */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-4 z-10">
        <button
          onClick={() => setShowGrid(!showGrid)}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500"
        >
          {showGrid ? 'Hide Grid' : 'Show Grid'}
        </button>
        <button
          onClick={() => setShowWalls(!showWalls)}
          className="px-4 py-2 bg-stone-600 text-white rounded hover:bg-stone-500"
        >
          {showWalls ? 'Hide Walls' : 'Show Walls'}
        </button>
        <button
          onClick={() => setShowProps(!showProps)}
          className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-600"
        >
          {showProps ? 'Hide Props' : 'Show Props'}
        </button>
        <span className="text-neutral-400 self-center">
          {loaded ? '✓ Tiles loaded' : 'Loading...'}
        </span>
      </div>

      {/* Game Container - Floating Island Effect */}
      <div 
        className="relative"
        style={{
          boxShadow: '0 0 60px 30px rgba(0, 0, 0, 0.9), 0 0 100px 60px rgba(0, 0, 0, 0.6)',
          border: '2px solid #222',
          borderRadius: '4px',
        }}
      >
        {/* Canvas with cinematic color grading */}
        <canvas
          ref={canvasRef}
          width={ARENA_SIZE.width}
          height={ARENA_SIZE.height}
          className="block"
          style={{
            // Cinematic color grading: slight desaturation + blue/teal tint
            filter: 'saturate(90%) contrast(105%) brightness(98%)',
          }}
        />
        
        {/* Heavy Vignette Overlay - dramatic corner darkening */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, transparent 40%, rgba(0, 10, 20, 0.6) 100%)',
            boxShadow: 'inset 0 0 100px 50px rgba(0, 0, 0, 0.5)',
            borderRadius: '4px',
          }}
        />

        {/* Floating Dust Particles - Digital Motes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ borderRadius: '4px' }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float-up ${8 + Math.random() * 8}s linear infinite`,
                animationDelay: `${Math.random() * 8}s`,
              }}
            />
          ))}
        </div>

        {/* CSS Animation for floating particles */}
        <style>{`
          @keyframes float-up {
            0% {
              transform: translateY(100%) translateX(0);
              opacity: 0;
            }
            10% {
              opacity: 0.6;
            }
            90% {
              opacity: 0.6;
            }
            100% {
              transform: translateY(-100%) translateX(20px);
              opacity: 0;
            }
          }
        `}</style>
      </div>

      {/* Info - positioned at bottom */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-neutral-400 text-sm text-center bg-black/60 px-4 py-2 rounded">
        <p>Green dot = Player 1 spawn ({SIMPLE_ARENA.spawnPoints[0].position.x}, {SIMPLE_ARENA.spawnPoints[0].position.y})</p>
        <p>Red dot = Player 2 spawn ({SIMPLE_ARENA.spawnPoints[1].position.x}, {SIMPLE_ARENA.spawnPoints[1].position.y})</p>
        <p>Arena size: {ARENA_SIZE.width}×{ARENA_SIZE.height}</p>
      </div>
    </div>
  )
}

export default SimpleArenaTest
