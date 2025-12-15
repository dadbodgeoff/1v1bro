/**
 * SpritePreviewPopup Component
 * 
 * A hover-triggered popup that shows an enlarged animated 2D sprite preview.
 * Features:
 * - Large animated sprite display
 * - Direction controls (up/down/left/right facing)
 * - Animation speed control
 * - Smooth transitions
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/helpers'
import { SkinPreview, type SkinId } from './SkinPreview'

type Direction = 'down' | 'left' | 'right' | 'up'

interface SpritePreviewPopupProps {
  /** Bundled skin ID */
  skinId?: SkinId
  /** URL to dynamic sprite sheet */
  spriteSheetUrl?: string
  /** URL to sprite metadata */
  metadataUrl?: string
  /** Name of the skin for the header */
  skinName: string
  /** Whether the popup is visible */
  isVisible: boolean
  /** Reference element to position relative to */
  anchorRef: React.RefObject<HTMLElement | null>
  /** Callback when mouse enters the popup */
  onMouseEnter?: () => void
  /** Callback when mouse leaves the popup */
  onMouseLeave?: () => void
}

// Frame ranges for each direction (standard RPG Maker style sprite sheets)
// Row 0: Down (frames 0-7), Row 1: Left (8-15), Row 2: Right (16-23), Row 3: Up (24-31)
const DIRECTION_FRAMES: Record<Direction, { start: number; count: number }> = {
  down: { start: 0, count: 8 },
  left: { start: 8, count: 8 },
  right: { start: 16, count: 8 },
  up: { start: 24, count: 8 },
}

export function SpritePreviewPopup({
  skinId,
  spriteSheetUrl,
  metadataUrl,
  skinName,
  isVisible,
  anchorRef,
  onMouseEnter,
  onMouseLeave,
}: SpritePreviewPopupProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [shouldRender, setShouldRender] = useState(false)
  const [direction, setDirection] = useState<Direction>('down')
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [animSpeed, setAnimSpeed] = useState(150) // ms per frame
  const popupRef = useRef<HTMLDivElement>(null)

  // Delay rendering for smooth transitions
  useEffect(() => {
    if (isVisible) {
      setShouldRender(true)
      setDirection('down')
      setCurrentFrame(0)
      setIsPlaying(true)
    } else {
      const timeout = setTimeout(() => setShouldRender(false), 200)
      return () => clearTimeout(timeout)
    }
  }, [isVisible])

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !isVisible) return

    const interval = setInterval(() => {
      const { count } = DIRECTION_FRAMES[direction]
      setCurrentFrame(prev => (prev + 1) % count)
    }, animSpeed)

    return () => clearInterval(interval)
  }, [isPlaying, isVisible, direction, animSpeed])

  // Calculate position relative to anchor
  useEffect(() => {
    if (!isVisible || !anchorRef.current) return

    const updatePosition = () => {
      const anchor = anchorRef.current
      if (!anchor) return

      const rect = anchor.getBoundingClientRect()
      const popupWidth = 320
      const popupHeight = 400
      const padding = 16

      let left = rect.right + padding
      let top = rect.top + (rect.height / 2) - (popupHeight / 2)

      if (left + popupWidth > window.innerWidth - padding) {
        left = rect.left - popupWidth - padding
      }

      top = Math.max(padding, Math.min(top, window.innerHeight - popupHeight - padding))

      setPosition({ top, left })
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isVisible, anchorRef])

  // Get the actual frame index based on direction
  const frameIndex = DIRECTION_FRAMES[direction].start + currentFrame

  if (!shouldRender) return null

  return createPortal(
    <div
      ref={popupRef}
      className={cn(
        'fixed z-50 pointer-events-auto',
        'transition-all duration-200 ease-out',
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      )}
      style={{ top: position.top, left: position.left }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="bg-[var(--color-bg-elevated)] rounded-xl border border-white/10 shadow-2xl overflow-hidden w-[320px]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/5 bg-black/20">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white">{skinName}</h4>
            <span className="text-xs text-[var(--color-text-muted)]">
              Sprite Preview
            </span>
          </div>
        </div>

        {/* Large Sprite Display */}
        <div className="relative flex items-center justify-center p-6 bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a]">
          {/* Spotlight effect */}
          <div className="absolute inset-0 overflow-hidden">
            <div 
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 rounded-full"
              style={{
                background: 'radial-gradient(ellipse, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
              }}
            />
          </div>
          
          {/* Sprite */}
          <div className="relative">
            <SkinPreview
              skinId={skinId}
              spriteSheetUrl={spriteSheetUrl}
              metadataUrl={metadataUrl}
              size={160}
              animate={false}
              frameIndex={frameIndex}
            />
          </div>
        </div>

        {/* Direction Controls */}
        <div className="px-4 py-3 border-t border-white/5 bg-black/10">
          <div className="flex items-center justify-center gap-1 mb-3">
            {/* D-pad style controls */}
            <div className="grid grid-cols-3 gap-1">
              <div /> {/* Empty top-left */}
              <DirectionButton 
                direction="up" 
                active={direction === 'up'} 
                onClick={() => setDirection('up')}
                icon="↑"
              />
              <div /> {/* Empty top-right */}
              <DirectionButton 
                direction="left" 
                active={direction === 'left'} 
                onClick={() => setDirection('left')}
                icon="←"
              />
              <DirectionButton 
                direction="down" 
                active={direction === 'down'} 
                onClick={() => setDirection('down')}
                icon="↓"
              />
              <DirectionButton 
                direction="right" 
                active={direction === 'right'} 
                onClick={() => setDirection('right')}
                icon="→"
              />
            </div>
          </div>

          {/* Playback controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                isPlaying 
                  ? 'bg-[#6366f1] text-white' 
                  : 'bg-white/10 text-[var(--color-text-secondary)] hover:bg-white/15'
              )}
            >
              {isPlaying ? (
                <>
                  <PauseIcon className="w-3 h-3" />
                  Playing
                </>
              ) : (
                <>
                  <PlayIcon className="w-3 h-3" />
                  Paused
                </>
              )}
            </button>

            {/* Speed control */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--color-text-muted)]">Speed:</span>
              <div className="flex gap-1">
                {[200, 150, 100, 50].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setAnimSpeed(speed)}
                    className={cn(
                      'w-6 h-6 rounded text-[10px] font-medium transition-colors',
                      animSpeed === speed
                        ? 'bg-[#6366f1] text-white'
                        : 'bg-white/10 text-[var(--color-text-muted)] hover:bg-white/15'
                    )}
                  >
                    {speed === 200 ? '½' : speed === 150 ? '1' : speed === 100 ? '2' : '3'}×
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-white/5 bg-black/20">
          <p className="text-xs text-[var(--color-text-muted)] text-center">
            Use arrows to view different directions
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}

function DirectionButton({ 
  direction, 
  active, 
  onClick, 
  icon 
}: { 
  direction: Direction
  active: boolean
  onClick: () => void
  icon: string
}) {
  return (
    <button
      onClick={onClick}
      aria-label={`Face ${direction}`}
      className={cn(
        'w-8 h-8 rounded-lg text-sm font-bold transition-all',
        active
          ? 'bg-[#6366f1] text-white scale-110 shadow-lg shadow-indigo-500/30'
          : 'bg-white/10 text-[var(--color-text-muted)] hover:bg-white/20'
      )}
    >
      {icon}
    </button>
  )
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  )
}

/**
 * Hook to manage sprite preview popup state
 */
export function useSpritePreview() {
  const [isVisible, setIsVisible] = useState(false)
  const [skinId, setSkinId] = useState<SkinId | undefined>()
  const [spriteSheetUrl, setSpriteSheetUrl] = useState<string | undefined>()
  const [metadataUrl, setMetadataUrl] = useState<string | undefined>()
  const [skinName, setSkinName] = useState('')
  const anchorRef = useRef<HTMLElement | null>(null)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isHoveringPopupRef = useRef(false)

  const showPreview = useCallback((
    name: string,
    element: HTMLElement,
    options: {
      skinId?: SkinId
      spriteSheetUrl?: string
      metadataUrl?: string
    }
  ) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }

    setSkinName(name)
    setSkinId(options.skinId)
    setSpriteSheetUrl(options.spriteSheetUrl)
    setMetadataUrl(options.metadataUrl)
    anchorRef.current = element

    hoverTimeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, 300)
  }, [])

  const hidePreview = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }

    hoverTimeoutRef.current = setTimeout(() => {
      if (!isHoveringPopupRef.current) {
        setIsVisible(false)
      }
    }, 100)
  }, [])

  const handlePopupMouseEnter = useCallback(() => {
    isHoveringPopupRef.current = true
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
  }, [])

  const handlePopupMouseLeave = useCallback(() => {
    isHoveringPopupRef.current = false
    hidePreview()
  }, [hidePreview])

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  return {
    isVisible,
    skinId,
    spriteSheetUrl,
    metadataUrl,
    skinName,
    anchorRef,
    showPreview,
    hidePreview,
    handlePopupMouseEnter,
    handlePopupMouseLeave,
  }
}

export default SpritePreviewPopup
