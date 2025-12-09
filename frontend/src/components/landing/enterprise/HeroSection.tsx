/**
 * HeroSection - Landing page hero section
 * 
 * Full viewport height with background scene, headline, CTAs, and trust line.
 * Implements scroll parallax and animated text reveal.
 * 
 * @module landing/enterprise/HeroSection
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@/utils/helpers'
import { useAuthStore } from '@/stores/authStore'
import { BackgroundScene } from './BackgroundScene'
import { CTAButton } from './CTAButton'
import { ChevronDownIcon } from './icons'

export interface HeroSectionProps {
  /** Additional CSS classes */
  className?: string
}

const HERO_CONTENT = {
  headline: '1v1 Bro – Trivia Duels With Real-Time Combat',
  subheadline: 'Outplay your friends in a live 1v1 arena where every question, dodge, and shot can swing the match.',
  primaryCTA: 'Play Free In Browser',
  secondaryCTA: 'Host a Match With Friends',
  trustLine: 'No downloads. No setup. Just share a code and start battling.',
}

export function HeroSection({ className }: HeroSectionProps) {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [scrollY, setScrollY] = useState(0)
  const [showScrollIndicator, setShowScrollIndicator] = useState(true)

  // Track scroll for parallax and fade
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
      if (window.scrollY > 50) {
        setShowScrollIndicator(false)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-hide scroll indicator after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowScrollIndicator(false)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  const handlePrimaryCTA = () => {
    navigate(isAuthenticated ? '/dashboard' : '/register')
  }

  const handleSecondaryCTA = () => {
    navigate(isAuthenticated ? '/dashboard' : '/register')
  }

  // Calculate opacity based on scroll (fade out after 100px)
  const contentOpacity = Math.max(0, 1 - scrollY / 200)
  const contentTransform = `translateY(${scrollY * 0.5}px)`

  return (
    <section
      className={cn(
        'relative min-h-screen flex items-center',
        className
      )}
    >
      {/* Background */}
      <BackgroundScene />

      {/* Content */}
      <div
        className="relative z-50 w-full max-w-7xl mx-auto px-6 py-20"
        style={{
          opacity: contentOpacity,
          transform: contentTransform,
        }}
      >
        <div className="max-w-[700px]">
          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[48px] md:text-[72px] leading-[56px] md:leading-[80px] font-extrabold tracking-[-0.03em] text-white mb-8"
          >
            {HERO_CONTENT.headline}
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[17px] md:text-[18px] leading-[26px] md:leading-[28px] text-[#B4B4B4] mb-12 max-w-[600px]"
          >
            {HERO_CONTENT.subheadline}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 sm:gap-5 mb-6"
          >
            <CTAButton
              variant="primary"
              size="large"
              onClick={handlePrimaryCTA}
            >
              {HERO_CONTENT.primaryCTA}
            </CTAButton>
            <CTAButton
              variant="secondary"
              size="large"
              onClick={handleSecondaryCTA}
            >
              {HERO_CONTENT.secondaryCTA}
            </CTAButton>
          </motion.div>

          {/* Trust Line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-[14px] leading-[20px] tracking-[0.02em] font-medium text-[#737373]"
          >
            {HERO_CONTENT.trustLine}
          </motion.p>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showScrollIndicator ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="animate-bounce text-[#71717A]">
          <ChevronDownIcon size="lg" />
        </div>
      </motion.div>
    </section>
  )
}

export default HeroSection
