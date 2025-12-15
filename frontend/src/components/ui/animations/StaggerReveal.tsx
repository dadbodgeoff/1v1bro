/**
 * StaggerReveal - Coordinated entrance animations
 * 
 * Features:
 * - Staggered fade-up for child elements
 * - Configurable delay and duration
 * - Multiple animation directions
 * - Respects reduced motion
 * 
 * Usage:
 * <StaggerReveal>
 *   <StaggerItem>First</StaggerItem>
 *   <StaggerItem>Second</StaggerItem>
 *   <StaggerItem>Third</StaggerItem>
 * </StaggerReveal>
 */

import { type ReactNode } from 'react'
import { motion, type Variants, type HTMLMotionProps } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export interface StaggerRevealProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  children: ReactNode
  /** Delay between each child in seconds */
  staggerDelay?: number
  /** Initial delay before first child */
  initialDelay?: number
  /** Animation duration for each child */
  duration?: number
  /** Direction children animate from */
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  /** Distance to travel in pixels */
  distance?: number
  /** Trigger animation when in view */
  whenInView?: boolean
  /** Only animate once */
  once?: boolean
}

export function StaggerReveal({
  children,
  staggerDelay = 0.08,
  initialDelay = 0,
  duration = 0.4,
  direction = 'up',
  distance = 20,
  whenInView = false,
  once = true,
  className,
  ...props
}: StaggerRevealProps) {
  const { prefersReducedMotion } = useReducedMotion()

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : staggerDelay,
        delayChildren: prefersReducedMotion ? 0 : initialDelay,
      },
    },
  }

  if (prefersReducedMotion) {
    // Only pass standard HTML div props, not motion-specific ones
    const { style, id } = props as { style?: React.CSSProperties; id?: string }
    return (
      <div className={className} style={style} id={id}>
        {children}
      </div>
    )
  }

  const viewportProps = whenInView
    ? {
        whileInView: 'visible' as const,
        viewport: { once, margin: '-50px' },
      }
    : {
        animate: 'visible' as const,
      }

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      {...viewportProps}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// Stagger Item
// ============================================

export interface StaggerItemProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  children: ReactNode
  /** Override direction for this item */
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  /** Override distance for this item */
  distance?: number
  /** Override duration for this item */
  duration?: number
  /** Custom variants */
  variants?: Variants
}

export function StaggerItem({
  children,
  direction = 'up',
  distance = 20,
  duration = 0.4,
  variants: customVariants,
  className,
  ...props
}: StaggerItemProps) {
  const { prefersReducedMotion } = useReducedMotion()

  const getInitialPosition = () => {
    switch (direction) {
      case 'up': return { y: distance }
      case 'down': return { y: -distance }
      case 'left': return { x: distance }
      case 'right': return { x: -distance }
      case 'none': return {}
      default: return { y: distance }
    }
  }

  const defaultVariants: Variants = {
    hidden: {
      opacity: 0,
      ...getInitialPosition(),
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration,
        ease: [0.25, 0.1, 0.25, 1], // Smooth ease-out
      },
    },
  }

  if (prefersReducedMotion) {
    // Only pass standard HTML div props, not motion-specific ones
    const { style, id } = props as { style?: React.CSSProperties; id?: string }
    return (
      <div className={className} style={style} id={id}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      className={className}
      variants={customVariants || defaultVariants}
      {...props}
    >
      {children}
    </motion.div>
  )
}
