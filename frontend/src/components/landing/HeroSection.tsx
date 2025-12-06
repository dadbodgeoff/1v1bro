/**
 * HeroSection - Full-viewport hero with animated backdrop
 * Reuses existing backdrop layers for visual consistency
 * 
 * Validates: Requirements 1.1, 1.5, 1.6, 1.7, 1.8, 1.9
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { HeroBackground } from './HeroBackground'
import { LogoReveal, ParticleBurst } from './animations'
import { useParallax } from '@/hooks/landing/useParallax'
import { ANIMATION_CONFIG } from './animations/config'
import type { HeroSectionProps } from './types'

export function HeroSection({ reducedMotion, onCTAClick, isAuthenticated }: HeroSectionProps) {
  const parallaxOffset = useParallax(ANIMATION_CONFIG.hero.parallaxFactor)
  const [isHovering, setIsHovering] = useState(false)

  return (
    <section
      className="relative h-screen w-full overflow-hidden"
      aria-label="Welcome to 1v1 Bro"
    >
        {/* Animated backdrop canvas */}
        <HeroBackground
          reducedMotion={reducedMotion}
          parallaxOffset={parallaxOffset}
        />

        {/* Vignette overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
          }}
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-6">
          {/* Logo with reveal animation */}
          <LogoReveal
            duration={ANIMATION_CONFIG.hero.logoRevealDuration}
            reducedMotion={reducedMotion}
          />

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: reducedMotion ? 0 : ANIMATION_CONFIG.hero.taglineFadeDelay / 1000,
              duration: reducedMotion ? 0 : 0.6,
            }}
            className="mt-6 text-xl md:text-2xl text-neutral-400 text-center max-w-md"
          >
            Real-time PvP Trivia Arena
          </motion.p>

          {/* Primary CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reducedMotion ? 0 : 1, duration: reducedMotion ? 0 : 0.6 }}
            className="mt-10 relative"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <button
              onClick={onCTAClick}
              className="relative px-10 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-black"
              style={{
                boxShadow: `0 0 ${isHovering ? 40 : 20}px rgba(99, 102, 241, ${isHovering ? 0.6 : 0.4})`,
              }}
            >
              {isAuthenticated ? 'Play Now' : 'Play Now - Free'}
            </button>

            {/* Particle burst on hover */}
            {isHovering && !reducedMotion && (
              <ParticleBurst count={ANIMATION_CONFIG.hero.particleBurstCount} />
            )}
          </motion.div>

          {/* Secondary CTA */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: reducedMotion ? 0 : 1.2 }}
            className="mt-4 text-neutral-500 hover:text-white transition-colors focus:outline-none focus:text-white"
            onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Try the demo ↓
          </motion.button>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reducedMotion ? 0 : 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          aria-hidden="true"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <motion.div
              animate={reducedMotion ? {} : { y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-3 bg-white/50 rounded-full mt-2"
            />
          </div>
        </motion.div>
      </section>
  )
}
