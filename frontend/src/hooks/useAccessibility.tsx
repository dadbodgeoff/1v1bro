/**
 * useAccessibility - Accessibility utilities for dashboard components
 * 
 * Provides hooks and utilities for:
 * - Focus management and trapping
 * - Arrow key navigation within widgets
 * - ARIA live region announcements
 * - Focus ring styling
 * 
 * Requirements: 1.1, 1.3, 1.5, 1.6
 */

import { useEffect, useRef, useCallback, useState } from 'react'

/**
 * Focus ring CSS class for visible focus indicators
 * Uses 2px indigo-500 outline as per Requirements 1.1
 */
export const FOCUS_RING_CLASS = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]'

/**
 * Focus ring styles for inline application
 */
export const FOCUS_RING_STYLES = {
  outline: 'none',
  boxShadow: '0 0 0 2px #0a0a0a, 0 0 0 4px #6366f1',
}

/**
 * useFocusTrap - Traps focus within a container element
 * 
 * When active, Tab and Shift+Tab cycle through focusable elements
 * within the container. Escape key triggers onEscape callback.
 * 
 * @param isActive - Whether the focus trap is active
 * @param onEscape - Callback when Escape key is pressed
 * @returns Ref to attach to the container element
 * 
 * Requirements: 1.6
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  isActive: boolean,
  onEscape?: () => void
) {
  const containerRef = useRef<T>(null)
  const previousActiveElement = useRef<Element | null>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    // Store the previously focused element
    previousActiveElement.current = document.activeElement

    const container = containerRef.current
    const focusableSelector = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ')

    const getFocusableElements = () => {
      return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector))
    }

    // Focus the first focusable element
    const focusableElements = getFocusableElements()
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault()
        onEscape()
        return
      }

      if (e.key !== 'Tab') return

      const focusable = getFocusableElements()
      if (focusable.length === 0) return

      const firstElement = focusable[0]
      const lastElement = focusable[focusable.length - 1]

      if (e.shiftKey) {
        // Shift+Tab: if on first element, go to last
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab: if on last element, go to first
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      // Restore focus to previously focused element
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus()
      }
    }
  }, [isActive, onEscape])

  return containerRef
}

/**
 * useArrowNavigation - Enables arrow key navigation within a container
 * 
 * Allows navigating between focusable children using arrow keys.
 * Supports both horizontal (left/right) and vertical (up/down) navigation.
 * 
 * @param options - Navigation options
 * @returns Ref to attach to the container element
 * 
 * Requirements: 1.3
 */
export interface ArrowNavigationOptions {
  /** Direction of navigation: 'horizontal', 'vertical', or 'both' */
  direction?: 'horizontal' | 'vertical' | 'both'
  /** Whether to wrap around at the ends */
  wrap?: boolean
  /** Selector for focusable elements (default: buttons and links) */
  selector?: string
  /** Callback when an item is selected (Enter key) */
  onSelect?: (element: HTMLElement, index: number) => void
}

export function useArrowNavigation<T extends HTMLElement = HTMLElement>(
  options: ArrowNavigationOptions = {}
) {
  const {
    direction = 'both',
    wrap = true,
    selector = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    onSelect,
  } = options

  const containerRef = useRef<T>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const getFocusableElements = () => {
      return Array.from(container.querySelectorAll<HTMLElement>(selector))
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const focusable = getFocusableElements()
      if (focusable.length === 0) return

      const currentIndex = focusable.findIndex(el => el === document.activeElement)
      if (currentIndex === -1) return

      let nextIndex = currentIndex
      const isHorizontal = direction === 'horizontal' || direction === 'both'
      const isVertical = direction === 'vertical' || direction === 'both'

      switch (e.key) {
        case 'ArrowLeft':
          if (isHorizontal) {
            e.preventDefault()
            nextIndex = currentIndex - 1
          }
          break
        case 'ArrowRight':
          if (isHorizontal) {
            e.preventDefault()
            nextIndex = currentIndex + 1
          }
          break
        case 'ArrowUp':
          if (isVertical) {
            e.preventDefault()
            nextIndex = currentIndex - 1
          }
          break
        case 'ArrowDown':
          if (isVertical) {
            e.preventDefault()
            nextIndex = currentIndex + 1
          }
          break
        case 'Enter':
        case ' ':
          if (onSelect) {
            e.preventDefault()
            onSelect(focusable[currentIndex], currentIndex)
          }
          return
        case 'Home':
          e.preventDefault()
          nextIndex = 0
          break
        case 'End':
          e.preventDefault()
          nextIndex = focusable.length - 1
          break
        default:
          return
      }

      // Handle wrapping
      if (wrap) {
        if (nextIndex < 0) nextIndex = focusable.length - 1
        if (nextIndex >= focusable.length) nextIndex = 0
      } else {
        nextIndex = Math.max(0, Math.min(nextIndex, focusable.length - 1))
      }

      focusable[nextIndex].focus()
    }

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [direction, wrap, selector, onSelect])

  return containerRef
}

/**
 * useAnnounce - Provides ARIA live region announcements
 * 
 * Creates a visually hidden live region that announces messages
 * to screen readers.
 * 
 * @returns Object with announce function and LiveRegion component
 * 
 * Requirements: 1.5
 */
export function useAnnounce() {
  const [message, setMessage] = useState('')
  const [politeness, setPoliteness] = useState<'polite' | 'assertive'>('polite')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const announce = useCallback((
    text: string,
    options: { politeness?: 'polite' | 'assertive'; clearAfter?: number } = {}
  ) => {
    const { politeness: p = 'polite', clearAfter = 5000 } = options

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setPoliteness(p)
    // Force re-announcement by clearing and setting
    setMessage('')
    requestAnimationFrame(() => {
      setMessage(text)
    })

    // Clear message after delay
    if (clearAfter > 0) {
      timeoutRef.current = setTimeout(() => {
        setMessage('')
      }, clearAfter)
    }
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Live region component
  const LiveRegion = useCallback(() => (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {message}
    </div>
  ), [message, politeness])

  return { announce, LiveRegion, message }
}

/**
 * useRovingTabIndex - Manages roving tabindex for a group of elements
 * 
 * Only one element in the group has tabindex="0", others have tabindex="-1".
 * Arrow keys move focus and update the active element.
 * 
 * @param itemCount - Number of items in the group
 * @param initialIndex - Initial active index (default: 0)
 * @returns Object with activeIndex, setActiveIndex, and getTabIndex function
 * 
 * Requirements: 1.2, 1.3
 */
export function useRovingTabIndex(itemCount: number, initialIndex = 0) {
  const [activeIndex, setActiveIndex] = useState(initialIndex)

  const getTabIndex = useCallback((index: number) => {
    return index === activeIndex ? 0 : -1
  }, [activeIndex])

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    let nextIndex = index

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault()
        nextIndex = (index + 1) % itemCount
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault()
        nextIndex = (index - 1 + itemCount) % itemCount
        break
      case 'Home':
        e.preventDefault()
        nextIndex = 0
        break
      case 'End':
        e.preventDefault()
        nextIndex = itemCount - 1
        break
      default:
        return
    }

    setActiveIndex(nextIndex)
  }, [itemCount])

  return {
    activeIndex,
    setActiveIndex,
    getTabIndex,
    handleKeyDown,
  }
}

/**
 * Utility to generate unique IDs for ARIA relationships
 */
let idCounter = 0
export function generateAriaId(prefix = 'aria'): string {
  return `${prefix}-${++idCounter}`
}

/**
 * Hook to generate stable ARIA IDs
 */
export function useAriaId(prefix = 'aria'): string {
  const idRef = useRef<string | null>(null)
  if (!idRef.current) {
    idRef.current = generateAriaId(prefix)
  }
  return idRef.current
}
