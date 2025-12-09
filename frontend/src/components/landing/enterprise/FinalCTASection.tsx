/**
 * FinalCTASection - Closing call-to-action section
 * 
 * "Ready To Settle It?" with final conversion push.
 * 
 * @module landing/enterprise/FinalCTASection
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { useNavigate } from 'react-router-dom'
import { cn } from '@/utils/helpers'
import { useAuthStore } from '@/stores/authStore'
import { CTAButton } from './CTAButton'

export interface FinalCTASectionProps {
  /** Additional CSS classes */
  className?: string
}

const FINAL_CTA_CONTENT = {
  headline: 'Ready To Settle It?',
  subheadline: 'Jump into a free 1v1 arena match in under 30 seconds. No signup required for your first game.',
  primaryCTA: 'Start A Free Match',
  secondaryCTA: 'Join With A Code',
}

export function FinalCTASection({ className }: FinalCTASectionProps) {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  const handlePrimaryCTA = () => {
    navigate(isAuthenticated ? '/dashboard' : '/register')
  }

  const handleSecondaryCTA = () => {
    navigate(isAuthenticated ? '/dashboard' : '/login')
  }

  return (
    <section
      className={cn(
        'relative py-[100px] md:py-[160px] bg-[#111113] overflow-hidden',
        className
      )}
    >
      {/* Background arena silhouette */}
      <div className="absolute inset-0 opacity-10">
        <svg
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] max-w-6xl h-auto"
          viewBox="0 0 800 300"
          fill="#1F1F23"
        >
          <rect x="100" y="200" width="600" height="40" rx="4" />
          <rect x="200" y="150" width="150" height="20" rx="2" />
          <rect x="450" y="150" width="150" height="20" rx="2" />
          <rect x="300" y="100" width="200" height="15" rx="2" />
          <rect x="80" y="100" width="20" height="140" rx="2" />
          <rect x="700" y="100" width="20" height="140" rx="2" />
        </svg>
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(17,17,19,0.9)_100%)]" />

      {/* Content */}
      <div className="relative z-10 max-w-[560px] mx-auto px-6 text-center">
        {/* Headline */}
        <h2 className="text-[36px] md:text-[48px] leading-[44px] md:leading-[56px] font-bold tracking-[-0.02em] text-white mb-6">
          {FINAL_CTA_CONTENT.headline}
        </h2>

        {/* Subheadline */}
        <p className="text-[17px] md:text-[18px] leading-[26px] md:leading-[28px] text-[#B4B4B4] mb-12">
          {FINAL_CTA_CONTENT.subheadline}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-5">
          <CTAButton
            variant="primary"
            size="large"
            onClick={handlePrimaryCTA}
          >
            {FINAL_CTA_CONTENT.primaryCTA}
          </CTAButton>
          <CTAButton
            variant="secondary"
            size="large"
            onClick={handleSecondaryCTA}
          >
            {FINAL_CTA_CONTENT.secondaryCTA}
          </CTAButton>
        </div>
      </div>
    </section>
  )
}

export default FinalCTASection
