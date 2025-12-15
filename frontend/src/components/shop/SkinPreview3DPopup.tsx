/**
 * SkinPreview3DPopup Component
 * 
 * A hover-triggered popup that shows a 3D preview of a skin.
 * Appears when hovering over shop items that have a model_url.
 * 
 * Features:
 * - Lazy loads the 3D scene only when visible
 * - Positioned relative to the hovered element
 * - 360° rotation via drag
 * - Auto-rotates when idle
 * - Smooth fade in/out transitions
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/helpers'
import { SkinPreview3D } from './SkinPreview3D'

interface SkinPreview3DPopupProps {
  /** URL to the GLB model file */
  modelUrl: string
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

export function SkinPreview3DPopup({
  modelUrl,
  skinName,
  isVisible,
  anchorRef,
  onMouseEnter,
  onMouseLeave,
}: SkinPreview3DPopupProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [shouldRender, setShouldRender] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)

  // Delay rendering to allow for smooth transitions
  useEffect(() => {
    if (isVisible) {
      setShouldRender(true)
      setIsLoading(true)
    } else {
      // Keep rendered briefly for exit animation
      const timeout = setTimeout(() => setShouldRender(false), 200)
      return () => clearTimeout(timeout)
    }
  }, [isVisible])

  // Calculate position relative to anchor element
  useEffect(() => {
    if (!isVisible || !anchorRef.current) return

    const updatePosition = () => {
      const anchor = anchorRef.current
      if (!anchor) return

      const rect = anchor.getBoundingClientRect()
      const popupWidth = 320
      const popupHeight = 420
      const padding = 16

      // Try to position to the right of the anchor
      let left = rect.right + padding
      let top = rect.top + (rect.height / 2) - (popupHeight / 2)

      // If it would go off the right edge, position to the left
      if (left + popupWidth > window.innerWidth - padding) {
        left = rect.left - popupWidth - padding
      }

      // Keep within vertical bounds
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

  const handleLoad = useCallback(() => {
    setIsLoading(false)
  }, [])

  if (!shouldRender) return null

  return createPortal(
    <div
      ref={popupRef}
      className={cn(
        'fixed z-50 pointer-events-auto',
        'transition-all duration-200 ease-out',
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      )}
      style={{
        top: position.top,
        left: position.left,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="bg-[var(--color-bg-elevated)] rounded-xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/5 bg-black/20">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white">{skinName}</h4>
            <span className="text-xs text-[var(--color-text-muted)]">
              Drag to rotate
            </span>
          </div>
        </div>

        {/* 3D Preview */}
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-elevated)]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-[var(--color-text-muted)]">Loading 3D model...</span>
              </div>
            </div>
          )}
          <SkinPreview3D
            modelUrl={modelUrl}
            width={320}
            height={380}
            autoRotate={true}
            autoRotateSpeed={20}
            onLoad={handleLoad}
          />
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-white/5 bg-black/20">
          <p className="text-xs text-[var(--color-text-muted)] text-center">
            Scroll to zoom • Click and drag to rotate
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}

/**
 * Hook to manage 3D preview popup state
 * Use this in components that want to show the popup on hover
 */
export function useSkinPreview3D() {
  const [isVisible, setIsVisible] = useState(false)
  const [modelUrl, setModelUrl] = useState<string | null>(null)
  const [skinName, setSkinName] = useState('')
  const anchorRef = useRef<HTMLElement | null>(null)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isHoveringPopupRef = useRef(false)

  const showPreview = useCallback((
    url: string, 
    name: string, 
    element: HTMLElement
  ) => {
    // Clear any pending hide
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }

    setModelUrl(url)
    setSkinName(name)
    anchorRef.current = element
    
    // Small delay before showing to avoid flicker on quick mouse movements
    hoverTimeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, 300)
  }, [])

  const hidePreview = useCallback(() => {
    // Clear show timeout if pending
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }

    // Delay hide to allow moving to popup
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  return {
    isVisible,
    modelUrl,
    skinName,
    anchorRef,
    showPreview,
    hidePreview,
    handlePopupMouseEnter,
    handlePopupMouseLeave,
  }
}

export default SkinPreview3DPopup
