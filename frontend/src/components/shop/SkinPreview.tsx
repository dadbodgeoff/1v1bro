/**
 * SkinPreview Component
 * Renders a character skin preview from sprite sheet frames
 * Used in shop cards and inventory displays
 * Requirements: 5.1
 */

import { useEffect, useRef, useState } from 'react'
import { getSkinPreviewFrame, dynamicAssets, type SkinId, SKIN_IDS } from '@/game/assets'
import { cn } from '@/utils/helpers'

interface SkinPreviewProps {
  skinId?: SkinId
  spriteSheetUrl?: string
  metadataUrl?: string
  size?: number
  className?: string
  animate?: boolean
  frameIndex?: number
}

/**
 * Valid skin IDs that map to sprite sheets
 */
export const VALID_SKIN_IDS: SkinId[] = [
  'green',
  'pink',
  'soldierPurple',
  'bananaTactical',
  'knightGold',
  'ninjaCyber',
  'wraithMatrix',
]

/**
 * Check if a string is a valid SkinId
 */
export function isValidSkinId(id: string): id is SkinId {
  return VALID_SKIN_IDS.includes(id as SkinId)
}

export function SkinPreview({ 
  skinId, 
  spriteSheetUrl,
  metadataUrl,
  size = 64, 
  className,
  animate = false,
  frameIndex = 0 
}: SkinPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [currentFrame, setCurrentFrame] = useState(frameIndex)
  const [dynamicFrames, setDynamicFrames] = useState<HTMLCanvasElement[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Load dynamic sprite sheet if URL provided
  useEffect(() => {
    if (!spriteSheetUrl) {
      setDynamicFrames(null)
      return
    }
    
    let cancelled = false
    setIsLoading(true)
    
    dynamicAssets
      .loadSpriteSheet(spriteSheetUrl, metadataUrl)
      .then((result) => {
        if (!cancelled && result.frames.length > 0) {
          setDynamicFrames(result.frames)
        }
      })
      .catch((err) => {
        console.warn('[SkinPreview] Failed to load dynamic sprite:', err)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    
    return () => { cancelled = true }
  }, [spriteSheetUrl, metadataUrl])
  
  // Animation: cycle through first 8 frames (down-facing walk cycle)
  useEffect(() => {
    if (!animate) {
      setCurrentFrame(frameIndex)
      return
    }
    
    const interval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % 8)
    }, 150)
    
    return () => clearInterval(interval)
  }, [animate, frameIndex])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Try dynamic frames first, then static
    let frame: HTMLCanvasElement | null = null
    
    if (dynamicFrames && dynamicFrames.length > currentFrame) {
      frame = dynamicFrames[currentFrame]
    } else if (skinId) {
      frame = getSkinPreviewFrame(skinId, currentFrame)
    }
    
    if (!frame) {
      // Draw placeholder if frame not loaded
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, size, size)
      ctx.fillStyle = '#666'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(isLoading ? '...' : '?', size / 2, size / 2)
      return
    }

    // Clear canvas and fill with base background
    ctx.clearRect(0, 0, size, size)
    
    // Solid dark blue-gray base that contrasts with dark sprites
    ctx.fillStyle = '#1e1e2e'
    ctx.fillRect(0, 0, size, size)
    
    // Draw a bright spotlight/stage effect from below
    const floorGlow = ctx.createRadialGradient(
      size / 2, size * 0.85, 0,
      size / 2, size * 0.85, size * 0.6
    )
    floorGlow.addColorStop(0, 'rgba(255, 255, 255, 0.3)')    // Bright white center
    floorGlow.addColorStop(0.5, 'rgba(200, 200, 200, 0.15)') // Gray mid
    floorGlow.addColorStop(1, 'rgba(30, 30, 60, 0)')         // Fade out
    ctx.fillStyle = floorGlow
    ctx.fillRect(0, 0, size, size)
    
    // Add vignette effect (darker corners)
    const vignette = ctx.createRadialGradient(
      size / 2, size / 2, size * 0.3,
      size / 2, size / 2, size * 0.7
    )
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.3)')
    ctx.fillStyle = vignette
    ctx.fillRect(0, 0, size, size)
    
    // Draw frame with pixelated rendering
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(frame, 0, 0, size, size)
  }, [skinId, currentFrame, size, dynamicFrames, isLoading])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={cn('pixelated', className)}
      style={{ imageRendering: 'pixelated' }}
    />
  )
}

/**
 * Export available skin IDs for use in other components
 */
export { SKIN_IDS }
export type { SkinId }
