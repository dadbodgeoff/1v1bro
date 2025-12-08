/**
 * LogoReveal - SVG logo with stroke-dasharray reveal animation
 * 
 * Validates: Requirements 1.5
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface LogoRevealProps {
  duration?: number      // Animation duration in ms
  reducedMotion: boolean
}

export function LogoReveal({ duration = 1500, reducedMotion }: LogoRevealProps) {
  const [isRevealed, setIsRevealed] = useState(reducedMotion)

  useEffect(() => {
    if (!reducedMotion) {
      const timer = setTimeout(() => setIsRevealed(true), duration)
      return () => clearTimeout(timer)
    }
  }, [duration, reducedMotion])

  const pathVariants = {
    hidden: {
      pathLength: 0,
      opacity: 0,
    },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: duration / 1000, ease: 'easeInOut' as const },
        opacity: { duration: 0.3 },
      },
    },
  }

  const fillVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { delay: duration / 1000, duration: 0.5 },
    },
  }

  if (reducedMotion) {
    return (
      <h1 className="text-6xl md:text-8xl font-black text-white tracking-tight">
        1v1 <span className="text-indigo-500">BRO</span>
      </h1>
    )
  }

  return (
    <div className="relative">
      {/* SVG outline animation */}
      <motion.svg
        viewBox="0 0 400 100"
        className="w-[300px] md:w-[400px] h-auto"
        initial="hidden"
        animate="visible"
      >
        {/* "1v1" text path */}
        <motion.text
          x="10"
          y="75"
          className="text-7xl font-black"
          fill="none"
          stroke="white"
          strokeWidth="2"
          variants={pathVariants}
        >
          1v1
        </motion.text>
        
        {/* "BRO" text path */}
        <motion.text
          x="180"
          y="75"
          className="text-7xl font-black"
          fill="none"
          stroke="#6366f1"
          strokeWidth="2"
          variants={pathVariants}
        >
          BRO
        </motion.text>

        {/* Fill after stroke animation */}
        <motion.text
          x="10"
          y="75"
          className="text-7xl font-black"
          fill="white"
          variants={fillVariants}
        >
          1v1
        </motion.text>
        
        <motion.text
          x="180"
          y="75"
          className="text-7xl font-black"
          fill="#6366f1"
          variants={fillVariants}
        >
          BRO
        </motion.text>
      </motion.svg>

      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 blur-2xl opacity-30"
        initial={{ opacity: 0 }}
        animate={{ opacity: isRevealed ? 0.3 : 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full h-full bg-gradient-to-r from-white via-indigo-500 to-purple-500" />
      </motion.div>
    </div>
  )
}
