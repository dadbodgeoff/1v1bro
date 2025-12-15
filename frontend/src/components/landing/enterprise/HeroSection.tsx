/**
 * HeroSection - Landing page hero section with integrated LiveDemo
 * 
 * Two-column layout: content on left, live demo on right.
 * Full viewport height, no scroll needed to see the demo.
 * 
 * @module landing/enterprise/HeroSection
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@/utils/helpers'
import { useAuthStore } from '@/stores/authStore'
import { BackgroundScene } from './BackgroundScene'
import { CTAButton } from './CTAButton'
import { LiveDemo } from './LiveDemo'
import { SurvivalDemo } from './survival-demo'
import { ChevronDownIcon } from './icons'
import { trackSignupClick, trackDemoPlay } from '@/services/analytics'
import { useSectionViewTracking } from '@/hooks/useSectionViewTracking'
import { getInstantPlayManager } from '@/game/guest'

export interface HeroSectionProps {
  /** Additional CSS classes */
  className?: string
}

const HERO_CONTENT = {
  headline: '1v1 Bro',
  tagline: 'Trivia • Survival Runner • 2D Shooter',
  subheadline: 'Outplay your friends in a live 1v1 arena where every question, dodge, and shot can swing the match.',
  primaryCTA: 'Try It Now',
  primaryCTALoggedIn: 'Play Now',
  secondaryCTA: 'Create Account',
  secondaryCTALoggedIn: 'Dashboard',
  trustLine: 'No downloads. No signup required. Jump straight into the action.',
}

export function HeroSection({ className }: HeroSectionProps) {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [scrollY, setScrollY] = useState(0)
  const [showScrollIndicator, setShowScrollIndicator] = useState(true)
  const sectionRef = useSectionViewTracking('hero')

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

  // Auto-hide scroll indicator after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowScrollIndicator(false)
    }, 4000)
    return () => clearTimeout(timer)
  }, [])

  // Preload assets on CTA hover for instant play
  const handlePrimaryHover = useCallback(() => {
    if (!isAuthenticated) {
      const instantPlayManager = getInstantPlayManager()
      instantPlayManager.preloadAssets()
    }
  }, [isAuthenticated])

  const handlePrimaryCTA = () => {
    // Primary CTA: Try the game immediately (instant play for guests, dashboard for logged in)
    if (!isAuthenticated) {
      trackDemoPlay()
    }
    navigate(isAuthenticated ? '/dashboard' : '/instant-play')
  }

  const handleSecondaryCTA = () => {
    // Secondary CTA: Sign up / go to dashboard
    if (!isAuthenticated) {
      trackSignupClick()
    }
    navigate(isAuthenticated ? '/dashboard' : '/register')
  }

  // Calculate opacity based on scroll
  const contentOpacity = Math.max(0, 1 - scrollY / 300)
  const contentTransform = `translateY(${scrollY * 0.3}px)`

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      className={cn(
        'relative min-h-screen flex items-center pt-20 md:pt-24',
        className
      )}
    >
      {/* Background */}
      <BackgroundScene />

      {/* Content + Demos layout */}
      <div
        className="relative z-50 w-full max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12"
        style={{
          opacity: contentOpacity,
          transform: contentTransform,
        }}
      >
        {/* Top section - Headline, tagline, CTAs */}
        <div className="text-center mb-8 lg:mb-10">
          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h1 className="text-[40px] md:text-[56px] lg:text-[72px] leading-[1.1] font-extrabold tracking-[-0.03em] text-white">
              {HERO_CONTENT.headline}
            </h1>
            <p className="text-[20px] md:text-[26px] lg:text-[32px] leading-[1.3] font-semibold tracking-[-0.02em] text-[#F97316] mt-2">
              {HERO_CONTENT.tagline}
            </p>
          </motion.div>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[15px] md:text-[17px] leading-[1.6] text-[#B4B4B4] mt-4 max-w-[600px] mx-auto"
          >
            {HERO_CONTENT.subheadline}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 justify-center"
          >
            <CTAButton
              variant="primary"
              size="large"
              onClick={handlePrimaryCTA}
              onMouseEnter={handlePrimaryHover}
            >
              {isAuthenticated ? HERO_CONTENT.primaryCTALoggedIn : HERO_CONTENT.primaryCTA}
            </CTAButton>
            <CTAButton
              variant="secondary"
              size="default"
              onClick={handleSecondaryCTA}
            >
              {isAuthenticated ? HERO_CONTENT.secondaryCTALoggedIn : HERO_CONTENT.secondaryCTA}
            </CTAButton>
          </motion.div>

          {/* Trust Line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-[13px] leading-[1.5] tracking-[0.02em] font-medium text-[#737373] mt-3"
          >
            {HERO_CONTENT.trustLine}
          </motion.p>
        </div>

        {/* Side-by-side demos */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6"
        >
          {/* Trivia Demo */}
          <div className="relative">
            {/* Outer glow - brand orange */}
            <div 
              className="absolute -inset-2 md:-inset-3 rounded-2xl opacity-40 blur-xl"
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
              }}
              aria-hidden="true"
            />
            
            {/* Demo component */}
            <div className="relative">
              <LiveDemo 
                autoPlay={true}
                showHUD={true}
                className="shadow-2xl rounded-xl"
              />
            </div>

            {/* Badge */}
            <div className="absolute -top-2 -right-2 md:-top-3 md:-right-3 z-20">
              <div className="bg-[#F97316] text-white text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 md:py-1.5 rounded-full shadow-lg">
                TRIVIA DUEL
              </div>
            </div>
          </div>

          {/* Survival Demo */}
          <div className="relative">
            {/* Outer glow - purple accent */}
            <div 
              className="absolute -inset-2 md:-inset-3 rounded-2xl opacity-30 blur-xl"
              style={{
                background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
              }}
              aria-hidden="true"
            />
            
            {/* Demo component */}
            <div className="relative">
              <SurvivalDemo 
                autoPlay={true}
                showHUD={true}
                className="shadow-2xl rounded-xl"
              />
            </div>

            {/* Badge */}
            <div className="absolute -top-2 -right-2 md:-top-3 md:-right-3 z-20">
              <div className="bg-[#A855F7] text-white text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 md:py-1.5 rounded-full shadow-lg">
                SURVIVAL MODE
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick stats below demos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex justify-center gap-8 md:gap-12 mt-6 pt-6 border-t border-white/10"
        >
          {[
            { value: '60 FPS', label: 'Real-time' },
            { value: '2 Modes', label: 'Game Types' },
            { value: '1v1', label: 'Battles' },
            { value: 'Endless', label: 'Survival' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-lg md:text-xl font-bold text-[#F97316]">{stat.value}</div>
              <div className="text-xs text-white/50">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showScrollIndicator ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="animate-bounce text-[#71717A]">
          <ChevronDownIcon size="lg" />
        </div>
      </motion.div>
    </section>
  )
}

export default HeroSection
