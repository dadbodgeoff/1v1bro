/**
 * Animation Utilities - Enterprise Polish System
 * 
 * Reusable animation primitives for the "final 20%" polish.
 * All animations respect prefers-reduced-motion.
 * 
 * @module ui/animations
 */

export { AnimatedNumber, type AnimatedNumberProps } from './AnimatedNumber'
export { AnimatedCard, type AnimatedCardProps } from './AnimatedCard'
export { RarityGlow, type RarityGlowProps } from './RarityGlow'
export { StaggerReveal, StaggerItem, type StaggerRevealProps } from './StaggerReveal'
export { ValueFlip, type ValueFlipProps } from './ValueFlip'
export { 
  useMousePosition, 
  useTiltEffect, 
  useSpringAnimation,
  type TiltConfig 
} from './hooks'
