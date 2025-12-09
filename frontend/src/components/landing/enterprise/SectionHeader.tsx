/**
 * SectionHeader - Reusable section header component
 * 
 * Displays section title with optional subtitle.
 * Uses H2 typography for title, Body Large for subtitle.
 * 
 * @module landing/enterprise/SectionHeader
 * Requirements: 7.1, 8.1, 9.1
 */

import { cn } from '@/utils/helpers'

export interface SectionHeaderProps {
  /** Section title */
  title: string
  /** Optional subtitle */
  subtitle?: string
  /** Text alignment */
  align?: 'left' | 'center' | 'right'
  /** Additional CSS classes */
  className?: string
}

export function SectionHeader({
  title,
  subtitle,
  align = 'center',
  className,
}: SectionHeaderProps) {
  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }

  return (
    <div className={cn('mb-12 md:mb-16', alignmentClasses[align], className)}>
      <h2 className="text-[32px] md:text-[40px] leading-[40px] md:leading-[48px] font-bold tracking-[-0.02em] text-white">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-6 text-[17px] md:text-[18px] leading-[26px] md:leading-[28px] text-[#B4B4B4] max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  )
}

export default SectionHeader
