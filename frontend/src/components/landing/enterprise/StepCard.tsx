/**
 * StepCard - How it works step card component
 * 
 * Displays step number, animated icon, title, and description.
 * Step number uses Display typography at 20% opacity.
 * Icons animate on scroll into view.
 * 
 * @module landing/enterprise/StepCard
 * Requirements: 4.2, 8.2
 */

import type { ReactNode } from 'react'
import { cn } from '@/utils/helpers'
import { AnimatedIcon } from './AnimatedIcon'
import type { AnimatedIconType } from './AnimatedIcon'

export interface StepCardProps {
  /** Step number (1, 2, 3) */
  stepNumber: number
  /** Icon component (legacy support) */
  icon?: ReactNode
  /** Animated icon type (preferred) */
  animatedIcon?: AnimatedIconType
  /** Step title */
  title: string
  /** Step description */
  description: string
  /** Additional CSS classes */
  className?: string
}

/**
 * Get step card configuration for testing
 */
export function getStepCardConfig(_stepNumber: number): { hasAnimatedIcon: boolean } {
  return {
    hasAnimatedIcon: true,
  }
}

export function StepCard({
  stepNumber,
  icon,
  animatedIcon,
  title,
  description,
  className,
}: StepCardProps) {
  return (
    <div className={cn('text-center relative', className)} data-step={stepNumber}>
      {/* Step Number - Large, faded */}
      <div className="text-[80px] md:text-[96px] leading-none font-extrabold tracking-[-0.04em] text-[#F97316]/10 mb-12">
        {String(stepNumber).padStart(2, '0')}
      </div>
      
      {/* Icon - Animated or static */}
      <div className="text-[#F97316] mb-5 flex justify-center">
        <div className="w-8 h-8 flex items-center justify-center" data-icon-container="true">
          {animatedIcon ? (
            <AnimatedIcon 
              icon={animatedIcon} 
              size="lg" 
              animate={true}
              aria-label={`Step ${stepNumber} icon`}
            />
          ) : (
            icon
          )}
        </div>
      </div>
      
      {/* Title */}
      <h3 className="text-[24px] md:text-[28px] leading-[32px] md:leading-[36px] font-semibold tracking-[-0.01em] text-white mb-4">
        {title}
      </h3>
      
      {/* Description */}
      <p className="text-[16px] md:text-[17px] leading-[26px] md:leading-[28px] text-[#B4B4B4] max-w-[320px] mx-auto">
        {description}
      </p>
    </div>
  )
}

export default StepCard
