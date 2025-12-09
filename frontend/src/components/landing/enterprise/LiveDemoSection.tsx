/**
 * LiveDemoSection - Section wrapper for the live gameplay demo
 * 
 * Wraps the LiveDemo component with proper section styling,
 * header, and CTA overlay.
 * 
 * @module landing/enterprise/LiveDemoSection
 * Requirements: 2.1, 2.4
 */

import { cn } from '@/utils/helpers'
import { SectionHeader } from './SectionHeader'
import { LiveDemo } from './LiveDemo'
import { CTAButton } from './CTAButton'
import { SectionDivider } from './SectionDivider'

export interface LiveDemoSectionProps {
  /** Additional CSS classes */
  className?: string
}

export function LiveDemoSection({ className }: LiveDemoSectionProps) {
  return (
    <section
      className={cn(
        'relative py-20 md:py-[120px] bg-[#09090B]',
        className
      )}
    >
      <div className="max-w-5xl mx-auto px-6">
        <SectionHeader 
          title="See It In Action" 
          subtitle="Watch AI players battle it out in real-time. This is actual gameplay, not a video."
        />

        {/* Demo container with glow effect */}
        <div className="relative">
          {/* Outer glow */}
          <div 
            className="absolute -inset-4 rounded-2xl opacity-30 blur-xl"
            style={{
              background: 'linear-gradient(135deg, #F97316 0%, #A855F7 100%)',
            }}
          />
          
          {/* Demo component */}
          <div className="relative">
            <LiveDemo 
              autoPlay={true}
              showHUD={true}
              className="shadow-2xl"
            />
          </div>
        </div>

        {/* CTA below demo */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="/signup">
            <CTAButton 
              variant="primary" 
              size="large"
            >
              Play Now — It's Free
            </CTAButton>
          </a>
          <a href="/login">
            <CTAButton 
              variant="secondary"
            >
              Already have an account?
            </CTAButton>
          </a>
        </div>

        {/* Feature highlights */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { label: 'Real-time', value: '60 FPS' },
            { label: 'Matches', value: '30 sec' },
            { label: 'Questions', value: '5 per match' },
            { label: 'Players', value: '1v1' },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col">
              <span className="text-2xl md:text-3xl font-bold text-[#F97316]">
                {stat.value}
              </span>
              <span className="text-sm text-white/60 mt-1">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Section divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <SectionDivider />
      </div>
    </section>
  )
}

export default LiveDemoSection
