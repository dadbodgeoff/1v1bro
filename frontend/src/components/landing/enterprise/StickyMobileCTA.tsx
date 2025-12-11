/**
 * StickyMobileCTA - Sticky bottom CTA bar for mobile users
 * 
 * Shows after user scrolls past the hero section.
 * Provides quick access to play without scrolling back up.
 * 
 * @module landing/enterprise/StickyMobileCTA
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { trackMobileCtaShown, trackMobileCtaClick } from '@/services/analytics'

export interface StickyMobileCTAProps {
  /** Scroll threshold to show the CTA (in pixels) */
  showAfterScroll?: number
}

export function StickyMobileCTA({ showAfterScroll = 600 }: StickyMobileCTAProps) {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [hasTrackedShow, setHasTrackedShow] = useState(false)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Track scroll position
  useEffect(() => {
    if (!isMobile) return

    const handleScroll = () => {
      const shouldShow = window.scrollY > showAfterScroll
      setIsVisible(shouldShow)
      
      // Track when first shown
      if (shouldShow && !hasTrackedShow) {
        trackMobileCtaShown()
        setHasTrackedShow(true)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isMobile, showAfterScroll, hasTrackedShow])

  const handleClick = () => {
    trackMobileCtaClick()
    navigate(isAuthenticated ? '/dashboard' : '/instant-play')
  }

  // Only render on mobile
  if (!isMobile) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe bg-gradient-to-t from-black via-black/95 to-transparent"
        >
          <button
            onClick={handleClick}
            className="w-full py-4 px-6 bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold text-base rounded-xl shadow-lg shadow-orange-500/25 transition-colors active:scale-[0.98]"
          >
            {isAuthenticated ? 'Play Now' : 'Try It Free — No Signup'}
          </button>
          <p className="text-center text-xs text-neutral-500 mt-2">
            Jump into a match in seconds
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default StickyMobileCTA
