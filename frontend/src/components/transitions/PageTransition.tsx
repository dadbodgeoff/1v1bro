/**
 * PageTransition - Animated page transition wrapper component
 * 
 * Uses framer-motion AnimatePresence for route transitions with
 * configurable animation types, loading indicators, and reduced motion support.
 * 
 * Requirements: 1.1, 1.2, 1.6
 */

import { useEffect, useState, useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { 
  TransitionManager,
  getTransitionManager,
  type TransitionConfig,
  type TransitionType,
} from '@/systems/polish/TransitionManager'
import type { Easing } from 'framer-motion'
import { usePolishStore } from '@/stores/polishStore'

// ============================================
// Animation Variants
// ============================================

/**
 * Map CSS easing strings to framer-motion Easing type
 */
function mapEasing(easing: string): Easing {
  const easingMap: Record<string, Easing> = {
    'ease': 'easeInOut',
    'ease-in': 'easeIn',
    'ease-out': 'easeOut',
    'ease-in-out': 'easeInOut',
    'linear': 'linear',
  }
  return easingMap[easing] ?? 'easeInOut'
}

/**
 * Get animation variants for a transition type
 */
function getVariants(type: TransitionType, duration: number, easing: string): Variants {
  const transition = { duration: duration / 1000, ease: mapEasing(easing) }

  switch (type) {
    case 'fade':
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition },
        exit: { opacity: 0, transition },
      }

    case 'slide-left':
      return {
        initial: { x: '100%', opacity: 0 },
        animate: { x: 0, opacity: 1, transition },
        exit: { x: '-100%', opacity: 0, transition },
      }

    case 'slide-right':
      return {
        initial: { x: '-100%', opacity: 0 },
        animate: { x: 0, opacity: 1, transition },
        exit: { x: '100%', opacity: 0, transition },
      }

    case 'slide-up':
      return {
        initial: { y: '100%', opacity: 0 },
        animate: { y: 0, opacity: 1, transition },
        exit: { y: '-100%', opacity: 0, transition },
      }

    case 'slide-down':
      return {
        initial: { y: '-100%', opacity: 0 },
        animate: { y: 0, opacity: 1, transition },
        exit: { y: '100%', opacity: 0, transition },
      }

    case 'zoom':
      return {
        initial: { scale: 0.8, opacity: 0 },
        animate: { scale: 1, opacity: 1, transition },
        exit: { scale: 1.1, opacity: 0, transition },
      }

    case 'morph':
      return {
        initial: { scale: 0.95, opacity: 0, borderRadius: '20px' },
        animate: { scale: 1, opacity: 1, borderRadius: '0px', transition },
        exit: { scale: 0.95, opacity: 0, borderRadius: '20px', transition },
      }

    case 'none':
    default:
      return {
        initial: {},
        animate: {},
        exit: {},
      }
  }
}

// ============================================
// Loading Indicator Component
// ============================================

interface LoadingIndicatorProps {
  visible: boolean
}

function LoadingIndicator({ visible }: LoadingIndicatorProps) {
  if (!visible) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    </motion.div>
  )
}

// ============================================
// PageTransition Component
// ============================================

interface PageTransitionProps {
  children: ReactNode
  /** Override transition config for this specific transition */
  transitionConfig?: Partial<TransitionConfig>
  /** Callback when transition starts */
  onTransitionStart?: () => void
  /** Callback when transition completes */
  onTransitionComplete?: () => void
}

export function PageTransition({
  children,
  transitionConfig,
  onTransitionStart,
  onTransitionComplete,
}: PageTransitionProps) {
  const location = useLocation()
  const settings = usePolishStore((s) => s.settings)
  
  const [showLoading, setShowLoading] = useState(false)
  const [currentConfig, setCurrentConfig] = useState<TransitionConfig | null>(null)
  
  const managerRef = useRef<TransitionManager | null>(null)
  const previousPathRef = useRef<string>('')
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Initialize manager
  useEffect(() => {
    managerRef.current = getTransitionManager({
      reducedMotion: !settings.celebrationAnimations,
      pageTransitionsEnabled: settings.pageTransitions,
    })
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [])

  // Update manager settings when polish settings change
  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.setReducedMotion(!settings.celebrationAnimations)
      managerRef.current.setPageTransitionsEnabled(settings.pageTransitions)
    }
  }, [settings.celebrationAnimations, settings.pageTransitions])

  // Handle route changes
  useEffect(() => {
    const manager = managerRef.current
    if (!manager) return

    const currentPath = location.pathname
    const previousPath = previousPathRef.current

    // Skip if same route
    if (currentPath === previousPath) return

    // Determine direction based on browser history
    // This is a simplified heuristic - in production you'd use a more robust method
    const direction = 'forward' // Could be enhanced with history state

    // Get transition config
    const result = manager.startTransition(currentPath, direction)
    
    if (result.allowed) {
      // Apply any overrides
      const config = transitionConfig 
        ? { ...result.config, ...transitionConfig }
        : result.config

      setCurrentConfig(config)
      onTransitionStart?.()

      // Set up loading indicator timeout (Req 1.2)
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
      loadingTimeoutRef.current = setTimeout(() => {
        if (manager.isTransitioning) {
          setShowLoading(true)
        }
      }, TransitionManager.LOADING_THRESHOLD_MS)
    }

    previousPathRef.current = currentPath
  }, [location.pathname, transitionConfig, onTransitionStart])

  // Handle transition completion
  const handleAnimationComplete = () => {
    const manager = managerRef.current
    if (!manager) return

    manager.completeTransition(location.pathname)
    setShowLoading(false)
    
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
      loadingTimeoutRef.current = null
    }

    onTransitionComplete?.()
  }

  // Get variants for current transition
  const config = currentConfig ?? {
    type: 'fade' as TransitionType,
    duration: 200,
    easing: 'ease',
  }
  const variants = getVariants(config.type, config.duration, config.easing)

  return (
    <>
      <AnimatePresence mode="wait" onExitComplete={handleAnimationComplete}>
        <motion.div
          key={location.pathname}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="w-full h-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
      
      <AnimatePresence>
        {showLoading && <LoadingIndicator visible={showLoading} />}
      </AnimatePresence>
    </>
  )
}

// ============================================
// Hook for programmatic transition control
// ============================================

export interface UsePageTransitionReturn {
  isTransitioning: boolean
  showLoading: boolean
  startLoading: () => void
  completeLoading: () => void
}

export function usePageTransition(): UsePageTransitionReturn {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showLoading, setShowLoading] = useState(false)
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startLoading = () => {
    setIsTransitioning(true)
    
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
    }
    
    loadingTimeoutRef.current = setTimeout(() => {
      setShowLoading(true)
    }, TransitionManager.LOADING_THRESHOLD_MS)
  }

  const completeLoading = () => {
    setIsTransitioning(false)
    setShowLoading(false)
    
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
      loadingTimeoutRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [])

  return {
    isTransitioning,
    showLoading,
    startLoading,
    completeLoading,
  }
}

// ============================================
// Export index
// ============================================

export { getVariants }
export type { PageTransitionProps, LoadingIndicatorProps }
