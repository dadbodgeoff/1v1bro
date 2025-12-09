/**
 * FeatureCard - Feature showcase card component
 * 
 * Uses ComponentBox with interactive variant and GlowBorder for game-like effects.
 * Displays icon, title, and description.
 * 
 * @module landing/enterprise/FeatureCard
 * Requirements: 3.1, 3.2, 7.2, 7.5
 */

import type { ReactNode } from 'react'
import { cn } from '@/utils/helpers'
import { ComponentBox } from './ComponentBox'
import { GlowBorder } from './GlowBorder'

export interface FeatureCardProps {
  /** Icon component */
  icon: ReactNode
  /** Feature title */
  title: string
  /** Feature description */
  description: string
  /** Additional CSS classes */
  className?: string
  /** Enable glow border effect */
  glowEnabled?: boolean
}

export function FeatureCard({
  icon,
  title,
  description,
  className,
  glowEnabled = true,
}: FeatureCardProps) {
  const cardContent = (
    <ComponentBox
      variant="interactive"
      className={cn(
        'min-h-[200px] flex flex-col group p-6 md:p-8 hover:border-white/[0.16]',
        className
      )}
    >
      {/* Icon */}
      <div className="text-[#F97316] group-hover:text-[#FB923C] transition-colors duration-200 mb-5">
        <div className="w-10 h-10 flex items-center justify-center">
          {icon}
        </div>
      </div>
      
      {/* Title */}
      <h3 className="text-[20px] md:text-[24px] leading-[28px] md:leading-[32px] font-semibold tracking-[-0.01em] text-white mb-4">
        {title}
      </h3>
      
      {/* Description */}
      <p className="text-[16px] md:text-[17px] leading-[26px] md:leading-[28px] text-[#B4B4B4] flex-1">
        {description}
      </p>
    </ComponentBox>
  )

  if (glowEnabled) {
    return (
      <GlowBorder
        color="orange"
        intensity="subtle"
        pulseOnHover={true}
        borderRadius="rounded-xl"
      >
        {cardContent}
      </GlowBorder>
    )
  }

  return cardContent
}

export default FeatureCard
