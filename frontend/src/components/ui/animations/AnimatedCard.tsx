/**
 * AnimatedCard - 3D Tilt Card with Micro-interactions
 * 
 * Features:
 * - 3D perspective tilt following cursor
 * - Optional glare effect
 * - Staggered child element reveals on hover
 * - Spring physics for smooth motion
 * - Press feedback
 * - Respects reduced motion
 * 
 * Usage:
 * <AnimatedCard tilt glare>
 *   <AnimatedCard.Badge>Legendary</AnimatedCard.Badge>
 *   <AnimatedCard.Image src="..." />
 *   <AnimatedCard.Title>Item Name</AnimatedCard.Title>
 * </AnimatedCard>
 */

import { 
  useRef, 
  createContext, 
  type ReactNode,
  forwardRef,
} from 'react'
import { motion, type Variants, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/utils/helpers'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useTiltEffect, type TiltConfig } from './hooks'

// ============================================
// Context for stagger coordination
// ============================================

interface CardContextValue {
  isHovered: boolean
}

const CardContext = createContext<CardContextValue>({ isHovered: false })

// ============================================
// Main AnimatedCard Component
// ============================================

export interface AnimatedCardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  children: ReactNode
  /** Enable 3D tilt effect */
  tilt?: boolean
  /** Tilt configuration */
  tiltConfig?: TiltConfig
  /** Enable glare overlay */
  glare?: boolean
  /** Enable press scale feedback */
  pressable?: boolean
  /** Stagger children on hover */
  staggerOnHover?: boolean
  /** Base stagger delay in seconds */
  staggerDelay?: number
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(({
  children,
  tilt = true,
  tiltConfig,
  glare = false,
  pressable = true,
  staggerOnHover = true,
  staggerDelay = 0.05,
  className,
  onClick,
  ...props
}, forwardedRef) => {
  const internalRef = useRef<HTMLDivElement>(null)
  const ref = (forwardedRef as React.RefObject<HTMLDivElement>) || internalRef
  const { prefersReducedMotion } = useReducedMotion()
  
  const { tiltStyle, glareStyle } = useTiltEffect(ref, {
    maxTilt: 8,
    scale: 1.02,
    glare,
    glareOpacity: 0.15,
    ...tiltConfig,
  })

  // Variants for the card container
  const cardVariants: Variants = {
    initial: { scale: 1 },
    hover: { scale: prefersReducedMotion ? 1 : 1 }, // Scale handled by tilt
    tap: pressable && !prefersReducedMotion ? { scale: 0.98 } : {},
  }

  // Stagger container variants
  const staggerVariants: Variants = {
    initial: {},
    hover: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.05,
      },
    },
  }

  return (
    <motion.div
      ref={ref}
      className={cn('relative', className)}
      style={tilt && !prefersReducedMotion ? tiltStyle : undefined}
      variants={cardVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
      {...props}
    >
      <CardContext.Provider value={{ isHovered: true }}>
        <motion.div
          className="relative h-full"
          variants={staggerOnHover ? staggerVariants : undefined}
        >
          {children}
        </motion.div>
      </CardContext.Provider>

      {/* Glare overlay */}
      {glare && !prefersReducedMotion && (
        <div
          className="absolute inset-0 pointer-events-none rounded-[inherit] transition-opacity duration-300"
          style={glareStyle}
        />
      )}
    </motion.div>
  )
})

AnimatedCard.displayName = 'AnimatedCard'

// ============================================
// Stagger Child Components
// ============================================

const staggerChildVariants: Variants = {
  initial: { opacity: 0.8, y: 4 },
  hover: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.2, ease: 'easeOut' }
  },
}

interface StaggerChildProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  children: ReactNode
  /** Skip stagger animation for this child */
  noStagger?: boolean
}

const StaggerChild = forwardRef<HTMLDivElement, StaggerChildProps>(({
  children,
  noStagger = false,
  className,
  // Filter out motion-specific props for fallback div
  variants: _variants,
  initial: _initial,
  animate: _animate,
  exit: _exit,
  whileHover: _whileHover,
  whileTap: _whileTap,
  whileFocus: _whileFocus,
  whileDrag: _whileDrag,
  whileInView: _whileInView,
  transition: _transition,
  ...props
}, ref) => {
  const { prefersReducedMotion } = useReducedMotion()
  
  if (noStagger || prefersReducedMotion) {
    // Only pass standard HTML div props
    const { style, id, 'aria-label': ariaLabel, role, tabIndex, onClick, onKeyDown } = props as Record<string, unknown>
    return (
      <div 
        ref={ref} 
        className={className}
        style={style as React.CSSProperties}
        id={id as string}
        aria-label={ariaLabel as string}
        role={role as string}
        tabIndex={tabIndex as number}
        onClick={onClick as React.MouseEventHandler<HTMLDivElement>}
        onKeyDown={onKeyDown as React.KeyboardEventHandler<HTMLDivElement>}
      >
        {children}
      </div>
    )
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={staggerChildVariants}
      {...props}
    >
      {children}
    </motion.div>
  )
})

StaggerChild.displayName = 'AnimatedCard.Child'

// ============================================
// Convenience Sub-components
// ============================================

interface BadgeProps extends StaggerChildProps {}
const Badge = forwardRef<HTMLDivElement, BadgeProps>((props, ref) => (
  <StaggerChild ref={ref} {...props} />
))
Badge.displayName = 'AnimatedCard.Badge'

interface ImageProps extends StaggerChildProps {}
const Image = forwardRef<HTMLDivElement, ImageProps>((props, ref) => (
  <StaggerChild ref={ref} {...props} />
))
Image.displayName = 'AnimatedCard.Image'

interface TitleProps extends StaggerChildProps {}
const Title = forwardRef<HTMLDivElement, TitleProps>((props, ref) => (
  <StaggerChild ref={ref} {...props} />
))
Title.displayName = 'AnimatedCard.Title'

interface ContentProps extends StaggerChildProps {}
const Content = forwardRef<HTMLDivElement, ContentProps>((props, ref) => (
  <StaggerChild ref={ref} {...props} />
))
Content.displayName = 'AnimatedCard.Content'

interface FooterProps extends StaggerChildProps {}
const Footer = forwardRef<HTMLDivElement, FooterProps>((props, ref) => (
  <StaggerChild ref={ref} {...props} />
))
Footer.displayName = 'AnimatedCard.Footer'

// Attach sub-components
type AnimatedCardComponent = typeof AnimatedCard & {
  Child: typeof StaggerChild
  Badge: typeof Badge
  Image: typeof Image
  Title: typeof Title
  Content: typeof Content
  Footer: typeof Footer
}

const AnimatedCardWithSubs = AnimatedCard as AnimatedCardComponent
AnimatedCardWithSubs.Child = StaggerChild
AnimatedCardWithSubs.Badge = Badge
AnimatedCardWithSubs.Image = Image
AnimatedCardWithSubs.Title = Title
AnimatedCardWithSubs.Content = Content
AnimatedCardWithSubs.Footer = Footer

export { AnimatedCardWithSubs }
