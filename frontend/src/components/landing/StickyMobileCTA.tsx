/**
 * StickyMobileCTA - Mobile sticky bottom CTA bar
 * Shows after 75% scroll, auto-hides after 10 seconds
 * 
 * Validates: Requirements 8.5
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface StickyMobileCTAProps {
  onCTAClick: () => void
  isAuthenticated: boolean
}

export function StickyMobileCTA({ onCTAClick, isAuthenticated }: StickyMobileCTAProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Show after 75% scroll
  useEffect(() => {
    if (!isMobile || isDismissed) return

    const handleScroll = () => {
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)
      setIsVisible(scrollPercent > 0.75)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isMobile, isDismissed])

  // Auto-hide after 10 seconds
  useEffect(() => {
    if (!isVisible) return

    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 10000)

    return () => clearTimeout(timer)
  }, [isVisible])

  if (!isMobile) return null

  return (
    <AnimatePresence>
      {isVisible && !isDismissed && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black via-black/95 to-transparent"
        >
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={onCTAClick}
              className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg transition-transform active:scale-95"
            >
              {isAuthenticated ? 'Play Now' : 'Sign Up Free'}
            </button>
            
            <button
              onClick={() => setIsDismissed(true)}
              className="p-3 text-neutral-500 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
