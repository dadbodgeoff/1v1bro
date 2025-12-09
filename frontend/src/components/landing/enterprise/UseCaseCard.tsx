/**
 * UseCaseCard - Use case/audience card component
 * 
 * Uses ComponentBox with elevated variant.
 * Displays icon, title, and description.
 * 
 * @module landing/enterprise/UseCaseCard
 * Requirements: 9.3
 */

import type { ReactNode } from 'react'
import { cn } from '@/utils/helpers'
import { ComponentBox } from './ComponentBox'

export interface UseCaseCardProps {
  /** Icon component */
  icon: ReactNode
  /** Use case title */
  title: string
  /** Use case description */
  description: string
  /** Additional CSS classes */
  className?: string
}

export function UseCaseCard({
  icon,
  title,
  description,
  className,
}: UseCaseCardProps) {
  return (
    <ComponentBox
      variant="elevated"
      className={cn('min-h-[160px] flex flex-col p-6 md:p-8', className)}
    >
      {/* Icon */}
      <div className="text-[#F97316] mb-5">
        <div className="w-6 h-6 flex items-center justify-center">
          {icon}
        </div>
      </div>
      
      {/* Title */}
      <h3 className="text-[20px] md:text-[24px] leading-[28px] md:leading-[32px] font-semibold tracking-[-0.01em] text-white mb-3">
        {title}
      </h3>
      
      {/* Description */}
      <p className="text-[16px] md:text-[17px] leading-[26px] md:leading-[28px] text-[#B4B4B4] flex-1">
        {description}
      </p>
    </ComponentBox>
  )
}

export default UseCaseCard
