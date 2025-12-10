/**
 * Modal Component - 2025 Design System
 *
 * Mobile-optimized modal with:
 * - Full-screen or bottom sheet layout on mobile
 * - Safe area inset handling
 * - Touch-outside-to-dismiss
 * - Vertically stacked action buttons on mobile
 * - 44px+ close button touch target
 *
 * Requirements: 2.4, 7.3, 8.1, 8.2, 8.3, 8.5
 */

import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/helpers'
import { useViewport } from '@/hooks/useViewport'
import { TOUCH_TARGET } from '@/utils/breakpoints'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
  /**
   * Enable full-screen mode on mobile devices
   * @default true
   */
  mobileFullScreen?: boolean
  /**
   * Use bottom sheet style on mobile instead of centered modal
   * @default false
   */
  mobileBottomSheet?: boolean
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  mobileFullScreen = true,
  mobileBottomSheet = false,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)
  const { isMobile, isTouch, safeAreaInsets } = useViewport()

  // Determine mobile layout mode
  const useMobileLayout = isMobile && (mobileFullScreen || mobileBottomSheet)
  const useBottomSheet = isMobile && mobileBottomSheet

  // Size classes - full width on mobile
  const sizes = {
    sm: 'max-w-[400px]',
    md: 'max-w-[500px]',
    lg: 'max-w-[640px]',
    xl: 'max-w-[800px]',
    full: 'max-w-full',
  }

  // Mobile-specific styles
  const getMobileStyles = (): React.CSSProperties => {
    if (!useMobileLayout) return {}

    const baseStyles: React.CSSProperties = {
      width: '100%',
      maxWidth: '100%',
      maxHeight: '90vh',
      margin: 0,
      // Safe area padding for bottom content
      paddingBottom: `calc(16px + ${safeAreaInsets.bottom}px)`,
    }

    if (useBottomSheet) {
      return {
        ...baseStyles,
        borderRadius: '16px 16px 0 0',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
      }
    }

    return {
      ...baseStyles,
      borderRadius: '16px',
    }
  }

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose, closeOnEscape])

  // Focus trap and body scroll lock
  useEffect(() => {
    if (!isOpen) return

    // Store current active element
    previousActiveElement.current = document.activeElement as HTMLElement

    // Lock body scroll
    document.body.style.overflow = 'hidden'

    // Focus the modal
    modalRef.current?.focus()

    return () => {
      // Restore body scroll
      document.body.style.overflow = ''

      // Restore focus
      previousActiveElement.current?.focus()
    }
  }, [isOpen])

  // Focus trap
  useEffect(() => {
    if (!isOpen) return

    const modal = modalRef.current
    if (!modal) return

    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTab = (e: KeyboardEvent) => {
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

    modal.addEventListener('keydown', handleTab)
    return () => modal.removeEventListener('keydown', handleTab)
  }, [isOpen])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose()
    }
  }

  // Touch handler for swipe-to-dismiss on bottom sheet
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!useBottomSheet || !closeOnBackdrop) return
    // Store initial touch position for potential swipe detection
    const touch = e.touches[0]
    modalRef.current?.setAttribute('data-touch-start-y', String(touch.clientY))
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!useBottomSheet || !closeOnBackdrop) return
    const startY = Number(modalRef.current?.getAttribute('data-touch-start-y') || 0)
    const endY = e.changedTouches[0].clientY
    const deltaY = endY - startY

    // Swipe down to dismiss (threshold: 100px)
    if (deltaY > 100) {
      onClose()
    }
  }

  const mobileStyles = getMobileStyles()

  const modalContent = (
    <div
      className={cn(
        'fixed inset-0 z-[400] flex p-4',
        'animate-[modalFadeIn_200ms_ease-out]',
        // Mobile positioning
        useBottomSheet ? 'items-end' : 'items-center justify-center',
        // Remove padding on mobile full screen
        useMobileLayout && 'p-0'
      )}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black/60 backdrop-blur-sm',
          'animate-[modalFadeIn_200ms_ease-out]'
        )}
      />

      {/* Modal Content */}
      <div
        ref={modalRef}
        tabIndex={-1}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={cn(
          'relative w-full bg-[#111111] border border-[rgba(255,255,255,0.06)] shadow-2xl',
          'focus:outline-none',
          // Animation based on layout
          useBottomSheet
            ? 'animate-[modalSlideUp_200ms_ease-out]'
            : 'animate-[modalScaleIn_200ms_ease-out]',
          // Border radius - different for bottom sheet
          useBottomSheet ? 'rounded-t-2xl rounded-b-none' : 'rounded-2xl',
          // Size classes - only apply on non-mobile
          !useMobileLayout && sizes[size],
          // Scrollable content on mobile
          useMobileLayout && 'overflow-y-auto'
        )}
        style={mobileStyles}
      >
        {/* Drag handle for bottom sheet */}
        {useBottomSheet && (
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-white/20 rounded-full" />
          </div>
        )}

        {/* Header */}
        {(title || showCloseButton) && (
          <div
            className={cn(
              'flex items-center justify-between border-b border-[rgba(255,255,255,0.06)]',
              // Larger padding on mobile for touch
              isMobile ? 'px-4 py-3' : 'px-6 py-4',
              // Safe area top padding on mobile
              isMobile && `pt-[max(12px,${safeAreaInsets.top}px)]`
            )}
          >
            {title && (
              <h2
                id="modal-title"
                className={cn(
                  'font-semibold text-white',
                  isMobile ? 'text-xl' : 'text-lg'
                )}
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className={cn(
                  'rounded-lg text-[#737373] hover:text-white hover:bg-white/5',
                  'transition-colors duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1]',
                  !title && 'ml-auto',
                  // Touch-optimized close button (44px+ touch target)
                  isTouch ? 'p-3' : 'p-2'
                )}
                style={{
                  // Ensure minimum touch target
                  minWidth: isTouch ? `${TOUCH_TARGET.min}px` : undefined,
                  minHeight: isTouch ? `${TOUCH_TARGET.min}px` : undefined,
                }}
                aria-label="Close modal"
              >
                <svg
                  className={cn(isTouch ? 'w-6 h-6' : 'w-5 h-5')}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div
          className={cn(
            isMobile ? 'p-4' : 'p-6',
            // Ensure content doesn't overflow on mobile
            useMobileLayout && 'overflow-y-auto'
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )

  // Render in portal
  return createPortal(modalContent, document.body)
}

/**
 * Modal Footer helper component
 *
 * Automatically stacks buttons vertically on mobile devices
 * with full-width buttons for better touch targets.
 */
export function ModalFooter({
  children,
  className,
  /**
   * Stack buttons vertically on mobile
   * @default true
   */
  mobileStack = true,
}: {
  children: ReactNode
  className?: string
  mobileStack?: boolean
}) {
  const { isMobile } = useViewport()
  const shouldStack = isMobile && mobileStack

  return (
    <div
      className={cn(
        'pt-4 mt-4 border-t border-[rgba(255,255,255,0.06)]',
        // Stack vertically on mobile, horizontal on desktop
        shouldStack
          ? 'flex flex-col-reverse gap-3'
          : 'flex items-center justify-end gap-3',
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Get modal mobile sizing properties for testing
 */
export function getModalMobileSizing(
  isMobile: boolean,
  mobileFullScreen: boolean
): { width: string; maxHeight: string; buttonsStacked: boolean } {
  if (!isMobile || !mobileFullScreen) {
    return {
      width: 'auto',
      maxHeight: 'auto',
      buttonsStacked: false,
    }
  }

  return {
    width: '100%',
    maxHeight: '90vh',
    buttonsStacked: true,
  }
}
