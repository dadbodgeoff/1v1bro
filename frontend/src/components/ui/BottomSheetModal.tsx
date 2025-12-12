/**
 * BottomSheetModal - Mobile-optimized modal that slides up from bottom
 * 
 * **Feature: ui-polish-8-of-10**
 * **Validates: Requirements 2.3, 2.4**
 */

import {
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
  type TouchEvent,
  type MouseEvent,
} from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { useReducedMotion } from '../../hooks/useReducedMotion'

export interface BottomSheetModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  /** Snap points as percentages of viewport height (0-1) */
  snapPoints?: number[]
  /** Whether to show the drag handle */
  showHandle?: boolean
  /** Test ID for testing */
  testId?: string
}

const DEFAULT_SNAP_POINTS = [0.5, 0.9]
const DRAG_THRESHOLD = 100 // pixels to trigger close

export function BottomSheetModal({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = DEFAULT_SNAP_POINTS,
  showHandle = true,
  testId,
}: BottomSheetModalProps) {
  const { prefersReducedMotion } = useReducedMotion()
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef<number | null>(null)
  const currentTranslateY = useRef(0)

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Focus trap
  useEffect(() => {
    if (!isOpen || !sheetRef.current) return

    const sheet = sheetRef.current
    const focusableElements = sheet.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)
    firstElement?.focus()

    return () => document.removeEventListener('keydown', handleTabKey)
  }, [isOpen])

  // Drag handlers
  const handleDragStart = useCallback((clientY: number) => {
    dragStartY.current = clientY
    currentTranslateY.current = 0
  }, [])

  const handleDragMove = useCallback((clientY: number) => {
    if (dragStartY.current === null || !sheetRef.current) return

    const deltaY = clientY - dragStartY.current
    // Only allow dragging down
    if (deltaY > 0) {
      currentTranslateY.current = deltaY
      sheetRef.current.style.transform = `translateY(${deltaY}px)`
    }
  }, [])

  const handleDragEnd = useCallback(() => {
    if (!sheetRef.current) return

    if (currentTranslateY.current > DRAG_THRESHOLD) {
      onClose()
    } else {
      // Snap back
      sheetRef.current.style.transform = 'translateY(0)'
    }

    dragStartY.current = null
    currentTranslateY.current = 0
  }, [onClose])

  // Touch event handlers
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      handleDragStart(e.touches[0].clientY)
    },
    [handleDragStart]
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      handleDragMove(e.touches[0].clientY)
    },
    [handleDragMove]
  )

  const handleTouchEnd = useCallback(() => {
    handleDragEnd()
  }, [handleDragEnd])

  // Mouse event handlers (for desktop testing)
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      handleDragStart(e.clientY)
    },
    [handleDragStart]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (dragStartY.current !== null) {
        handleDragMove(e.clientY)
      }
    },
    [handleDragMove]
  )

  const handleMouseUp = useCallback(() => {
    handleDragEnd()
  }, [handleDragEnd])

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose()
      }
    },
    [onClose]
  )

  if (!isOpen) return null

  const maxHeight = `${snapPoints[snapPoints.length - 1] * 100}vh`

  const content = (
    <div
      className={clsx(
        'fixed inset-0 z-[var(--z-modal-backdrop)] flex items-end justify-center',
        'bg-black/50 backdrop-blur-sm',
        !prefersReducedMotion && 'animate-[modalFadeIn_200ms_ease-out]'
      )}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'bottom-sheet-title' : undefined}
      data-testid={testId}
    >
      <div
        ref={sheetRef}
        className={clsx(
          'w-full bg-[var(--color-bg-card)] rounded-t-2xl',
          'safe-area-bottom',
          !prefersReducedMotion && 'animate-[slideUp_300ms_ease-out]',
          'transition-transform duration-200'
        )}
        style={{ maxHeight }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Drag handle */}
        {showHandle && (
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-[var(--color-border-visible)] rounded-full" />
          </div>
        )}

        {/* Header */}
        {title && (
          <div className="px-4 pb-3 border-b border-[var(--color-border-subtle)]">
            <h2
              id="bottom-sheet-title"
              className="text-lg font-semibold text-[var(--color-text-primary)]"
            >
              {title}
            </h2>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto p-4" style={{ maxHeight: `calc(${maxHeight} - 80px)` }}>
          {children}
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

// Add slideUp animation to index.css if not present
// @keyframes slideUp {
//   from { transform: translateY(100%); }
//   to { transform: translateY(0); }
// }

export default BottomSheetModal
