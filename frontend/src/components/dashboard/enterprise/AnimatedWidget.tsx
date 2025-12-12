/**
 * AnimatedWidget - Wrapper for dashboard widget entrance animations
 * 
 * Provides consistent entrance animations for dashboard widgets:
 * - Staggered fade-up effect on dashboard load (100ms delay between widgets)
 * - Fade-up effect when widget finishes loading (200ms)
 * - Hover lift effect (translateY -2px, 150ms transition)
 * - Press effect on click (scale 0.98, 100ms transition)
 * 
 * Props:
 * @param index - Widget index for stagger animation delay
 * @param children - Widget content
 * @param className - Additional CSS classes
 * @param isLoading - Whether the widget is loading (shows skeleton)
 * @param onClick - Optional click handler
 * 
 * Requirements: 4.1, 4.2, 4.3, 3.3
 */

import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/helpers'

export interface AnimatedWidgetProps {
  index?: number
  children: ReactNode
  className?: string
  isLoading?: boolean
  onClick?: () => void
}

// Animation variants
const widgetVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      delay: index * 0.1, // 100ms stagger - Requirements 4.1
      ease: 'easeOut' as const,
    },
  }),
}

// Hover and tap animations - Requirements 4.2, 4.3
const interactionVariants = {
  hover: {
    y: -2,
    transition: {
      duration: 0.15, // 150ms - Requirements 4.2
      ease: 'easeOut' as const,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1, // 100ms - Requirements 4.3
      ease: 'easeOut' as const,
    },
  },
}

export function AnimatedWidget({
  index = 0,
  children,
  className,
  isLoading = false,
  onClick,
}: AnimatedWidgetProps) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={widgetVariants}
      whileHover={onClick ? 'hover' : undefined}
      whileTap={onClick ? 'tap' : undefined}
      className={cn(
        // Base transition for non-framer-motion properties
        'transition-shadow duration-200',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      // Merge interaction variants when clickable
      {...(onClick && {
        variants: {
          ...widgetVariants,
          hover: interactionVariants.hover,
          tap: interactionVariants.tap,
        },
      })}
    >
      {/* Content with fade-up on load complete - Requirements 3.3 */}
      <motion.div
        initial={isLoading ? { opacity: 0, y: 10 } : false}
        animate={!isLoading ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.2, ease: 'easeOut' }} // 200ms - Requirements 3.3
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

/**
 * Pulse animation for data value changes - Requirements 4.4
 */
export function PulseOnChange({ 
  children, 
  value,
  className,
}: { 
  children: ReactNode
  value: unknown
  className?: string 
}) {
  return (
    <motion.span
      key={String(value)}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.span>
  )
}

/**
 * Bounce animation for notification badges - Requirements 4.5
 */
export function BounceBadge({
  children,
  show,
  className,
}: {
  children: ReactNode
  show: boolean
  className?: string
}) {
  return (
    <motion.span
      initial={{ scale: 0, opacity: 0 }}
      animate={show ? { 
        scale: 1, 
        opacity: 1,
        transition: {
          type: 'spring',
          stiffness: 500,
          damping: 15,
        }
      } : { scale: 0, opacity: 0 }}
      className={className}
    >
      {children}
    </motion.span>
  )
}

/**
 * Stagger container for animating multiple children
 */
export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.05,
}: {
  children: ReactNode
  className?: string
  staggerDelay?: number
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * Stagger item for use within StaggerContainer
 */
export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: { duration: 0.2, ease: 'easeOut' }
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default AnimatedWidget
