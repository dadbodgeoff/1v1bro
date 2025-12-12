/**
 * XpPreviewPopup - Animated XP preview popup for guest players
 * 
 * Shows "+XP" popups that stack and animate upward when guests
 * earn preview XP from correct answers, kills, and streaks.
 * 
 * @module components/game/XpPreviewPopup
 * Requirements: 2.3
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/helpers'
import {
  getEngagementFeedbackSystem,
  type XpPopup,
  type FeedbackEvent,
} from '@/game/guest/EngagementFeedbackSystem'

export interface XpPreviewPopupProps {
  /** Maximum number of popups to show at once */
  maxPopups?: number
  /** Position on screen */
  position?: 'top-right' | 'top-center' | 'bottom-right'
  /** Additional CSS classes */
  className?: string
}

/**
 * Individual popup item component
 */
function PopupItem({ popup, onComplete }: { popup: XpPopup; onComplete: (id: string) => void }) {
  useEffect(() => {
    // Auto-remove after animation
    const timer = setTimeout(() => {
      onComplete(popup.id)
    }, 2000)
    return () => clearTimeout(timer)
  }, [popup.id, onComplete])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        'bg-gradient-to-r from-indigo-500/90 to-orange-500/90',
        'backdrop-blur-sm shadow-lg shadow-indigo-500/20',
        'border border-white/20'
      )}
    >
      {/* XP amount */}
      <span className="text-white font-bold text-lg tabular-nums">
        +{popup.amount}
      </span>
      
      {/* XP label */}
      <span className="text-white/80 text-xs font-medium uppercase tracking-wider">
        XP
      </span>
      
      {/* Reason */}
      <span className="text-white/90 text-sm font-medium ml-1">
        {popup.reason}
      </span>
    </motion.div>
  )
}

/**
 * XpPreviewPopup component
 * 
 * Subscribes to EngagementFeedbackSystem and displays XP popups.
 */
export function XpPreviewPopup({
  maxPopups = 5,
  position = 'top-right',
  className,
}: XpPreviewPopupProps) {
  const [popups, setPopups] = useState<XpPopup[]>([])

  // Handle feedback events
  const handleFeedbackEvent = useCallback((event: FeedbackEvent) => {
    if (event.type === 'xp_preview') {
      const newPopup: XpPopup = {
        id: `popup-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        amount: event.amount,
        reason: event.reason,
        timestamp: Date.now(),
      }

      setPopups(prev => {
        const updated = [...prev, newPopup]
        // Keep only the most recent popups
        if (updated.length > maxPopups) {
          return updated.slice(-maxPopups)
        }
        return updated
      })
    }
  }, [maxPopups])

  // Subscribe to feedback system
  useEffect(() => {
    const feedbackSystem = getEngagementFeedbackSystem()
    const unsubscribe = feedbackSystem.subscribe(handleFeedbackEvent)
    return unsubscribe
  }, [handleFeedbackEvent])

  // Remove completed popup
  const handlePopupComplete = useCallback((id: string) => {
    setPopups(prev => prev.filter(p => p.id !== id))
  }, [])

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
  }

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-2 pointer-events-none',
        positionClasses[position],
        className
      )}
    >
      <AnimatePresence mode="popLayout">
        {popups.map(popup => (
          <PopupItem
            key={popup.id}
            popup={popup}
            onComplete={handlePopupComplete}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

export default XpPreviewPopup
