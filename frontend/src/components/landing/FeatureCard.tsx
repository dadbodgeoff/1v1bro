/**
 * FeatureCard - Individual feature card with animations
 * Shows feature with icon, title, description, and animated demo
 * 
 * Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
 */

import React, { useRef } from 'react'
import { motion } from 'framer-motion'
import { useScrollAnimation } from '@/hooks/landing/useScrollAnimation'
import type { FeatureConfig } from './types'
import { ANIMATION_CONFIG } from './animations/config'

interface FeatureCardProps {
  feature: FeatureConfig
  index: number
  reducedMotion: boolean
}

// Icon components
const ICONS: Record<string, React.ReactElement> = {
  crosshair: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
    </svg>
  ),
  brain: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
      <path d="M12 2a4 4 0 0 0-4 4c0 1.1.45 2.1 1.17 2.83L12 12l2.83-3.17A4 4 0 0 0 12 2z" />
      <path d="M12 12l-2.83 3.17A4 4 0 1 0 12 22a4 4 0 0 0 2.83-6.83L12 12z" />
      <path d="M12 12l3.17-2.83A4 4 0 1 0 22 12a4 4 0 0 0-6.83-2.83L12 12z" />
      <path d="M12 12l-3.17 2.83A4 4 0 1 0 2 12a4 4 0 0 0 6.83 2.83L12 12z" />
    </svg>
  ),
  map: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  ),
  trophy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  ),
}

export function FeatureCard({ feature, index, reducedMotion }: FeatureCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { isVisible, hasAnimated } = useScrollAnimation(ref, {
    threshold: 0.2,
    resetOnExit: !reducedMotion,
  })

  const isEven = index % 2 === 0
  const slideDirection = isEven ? 'left' : 'right'
  const slideDistance = ANIMATION_CONFIG.features.slideDistance

  const containerVariants = {
    hidden: {
      opacity: 0,
      x: slideDirection === 'left' ? -slideDistance : slideDistance,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: reducedMotion ? 0 : 0.6,
        ease: [0.25, 0.1, 0.25, 1] as const,
      },
    },
  }

  const iconVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: reducedMotion ? 0 : ANIMATION_CONFIG.features.iconDrawDuration / 1000,
        ease: 'easeInOut' as const,
      },
    },
  }

  const textVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (delay: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: reducedMotion ? 0 : delay / 1000,
        duration: reducedMotion ? 0 : 0.4,
      },
    }),
  }

  return (
    <motion.div
      ref={ref}
      className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8 md:gap-16`}
      initial="hidden"
      animate={isVisible || hasAnimated ? 'visible' : 'hidden'}
      variants={containerVariants}
    >
      {/* Content */}
      <div className="flex-1 text-center md:text-left">
        {/* Icon */}
        <motion.div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4"
          variants={iconVariants}
        >
          {ICONS[feature.icon] || ICONS.crosshair}
        </motion.div>

        {/* Title */}
        <motion.h3
          className="text-2xl font-bold text-white mb-3"
          variants={textVariants}
          custom={ANIMATION_CONFIG.features.titleFadeDelay}
        >
          {feature.title}
        </motion.h3>

        {/* Description */}
        <motion.p
          className="text-neutral-400 max-w-md"
          variants={textVariants}
          custom={ANIMATION_CONFIG.features.descriptionFadeDelay}
        >
          {feature.description}
        </motion.p>
      </div>

      {/* Animation preview */}
      <div className="flex-1 w-full max-w-md">
        <FeatureAnimation feature={feature} isVisible={isVisible} reducedMotion={reducedMotion} />
      </div>
    </motion.div>
  )
}

// Feature-specific animations
function FeatureAnimation({ feature, isVisible, reducedMotion }: { feature: FeatureConfig; isVisible: boolean; reducedMotion: boolean }) {
  const baseClasses = "w-full aspect-video rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden"

  // Simplified placeholder animations
  switch (feature.animation.type) {
    case 'combat':
      return (
        <div className={baseClasses}>
          <div className="relative w-full h-full p-4">
            {/* Two players */}
            <motion.div
              className="absolute left-8 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-green-500"
              animate={isVisible && !reducedMotion ? { x: [0, 10, 0] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute right-8 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-red-500"
              animate={isVisible && !reducedMotion ? { x: [0, -10, 0] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {/* Projectile */}
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-yellow-400"
              animate={isVisible && !reducedMotion ? { left: ['20%', '80%', '20%'] } : { left: '50%' }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </div>
        </div>
      )

    case 'trivia':
      return (
        <div className={baseClasses}>
          <div className="p-4 w-full">
            <div className="text-sm text-white mb-3 text-center">What year was Fortnite released?</div>
            <div className="grid grid-cols-2 gap-2">
              {['2015', '2016', '2017', '2018'].map((opt, i) => (
                <motion.div
                  key={opt}
                  className="p-2 text-center text-sm rounded bg-white/10 text-neutral-300"
                  animate={isVisible && !reducedMotion && i === 2 ? { backgroundColor: ['rgba(255,255,255,0.1)', 'rgba(34,197,94,0.3)', 'rgba(255,255,255,0.1)'] } : {}}
                  transition={{ duration: 4, repeat: Infinity, delay: 2 }}
                >
                  {opt}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )

    case 'arena':
      return (
        <div className={baseClasses}>
          <div className="relative w-full h-full">
            {/* Mini map grid */}
            <div className="absolute inset-4 border border-white/20 rounded">
              {/* Moving dots */}
              <motion.div
                className="absolute w-2 h-2 rounded-full bg-green-400"
                animate={isVisible && !reducedMotion ? { left: ['10%', '90%', '10%'], top: ['20%', '80%', '20%'] } : { left: '50%', top: '50%' }}
                transition={{ duration: 5, repeat: Infinity }}
              />
              <motion.div
                className="absolute w-2 h-2 rounded-full bg-red-400"
                animate={isVisible && !reducedMotion ? { left: ['90%', '10%', '90%'], top: ['80%', '20%', '80%'] } : { left: '50%', top: '50%' }}
                transition={{ duration: 5, repeat: Infinity }}
              />
              {/* Hazard zone */}
              <motion.div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-orange-500/50"
                animate={isVisible && !reducedMotion ? { scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </div>
        </div>
      )

    case 'competitive':
      return (
        <div className={baseClasses}>
          <div className="p-4 w-full space-y-2">
            {[
              { rank: 1, name: 'ProPlayer99', elo: 2450 },
              { rank: 2, name: 'QuizMaster', elo: 2380 },
              { rank: 3, name: 'ArenaKing', elo: 2290 },
            ].map((entry, i) => (
              <motion.div
                key={entry.rank}
                className="flex items-center justify-between p-2 rounded bg-white/5"
                initial={{ opacity: 0, x: -20 }}
                animate={isVisible ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: reducedMotion ? 0 : i * 0.2 }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 font-bold">#{entry.rank}</span>
                  <span className="text-white text-sm">{entry.name}</span>
                </div>
                <span className="text-indigo-400 text-sm">{entry.elo}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )

    default:
      return <div className={baseClasses}><span className="text-neutral-500">Preview</span></div>
  }
}
