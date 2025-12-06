/**
 * ScrollReveal - Wrapper component for scroll-triggered animations
 * 
 * Validates: Requirements 3.2
 */

import { useRef, ReactNode } from 'react'
import { motion, Variants } from 'framer-motion'
import { useScrollAnimation } from '@/hooks/landing/useScrollAnimation'

interface ScrollRevealProps {
  children: ReactNode
  direction?: 'left' | 'right' | 'up' | 'down'
  delay?: number           // Delay in seconds
  duration?: number        // Duration in seconds
  distance?: number        // Distance to travel in pixels
  reducedMotion: boolean
  className?: string
  once?: boolean
}

export function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  distance = 50,
  reducedMotion,
  className = '',
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { isVisible, hasAnimated } = useScrollAnimation(ref, {
    threshold: 0.2,
    once,
  })

  // Calculate initial position based on direction
  const getInitialPosition = () => {
    switch (direction) {
      case 'left':
        return { x: -distance, y: 0 }
      case 'right':
        return { x: distance, y: 0 }
      case 'up':
        return { x: 0, y: distance }
      case 'down':
        return { x: 0, y: -distance }
      default:
        return { x: 0, y: 0 }
    }
  }

  const initial = getInitialPosition()

  const variants: Variants = {
    hidden: {
      opacity: 0,
      x: initial.x,
      y: initial.y,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: reducedMotion ? 0 : duration,
        delay: reducedMotion ? 0 : delay,
        ease: [0.25, 0.1, 0.25, 1], // Cubic bezier for smooth easing
      },
    },
  }

  // For reduced motion, show immediately
  if (reducedMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isVisible || hasAnimated ? 'visible' : 'hidden'}
      variants={variants}
    >
      {children}
    </motion.div>
  )
}
