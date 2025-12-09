/**
 * Landing - Enterprise landing page
 * 
 * AAA-quality landing page with custom background, typography hierarchy,
 * and bespoke components. No gradients, no cyan/purple, 2026 aesthetic.
 * 
 * @module pages/Landing
 * Requirements: All landing page requirements
 */

import { useEffect } from 'react'
import {
  GlobalBackground,
  LandingHeader,
  HeroSection,
  HowItWorksSection,
  FeaturesSection,
  UseCasesSection,
  FinalCTASection,
  LandingFooter,
} from '@/components/landing/enterprise'

export function Landing() {
  useEffect(() => {
    document.title = '1v1 Bro - Trivia Duels With Real-Time Combat'
    return () => {
      document.title = '1v1 Bro'
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#09090B] text-white safe-area-all">
      {/* Global animated background */}
      <GlobalBackground />

      {/* Fixed Header */}
      <LandingHeader />

      {/* Main Content */}
      <main>
        {/* Hero Section - Full viewport */}
        <HeroSection />

        {/* How It Works - 3 steps */}
        <section id="how-it-works">
          <HowItWorksSection />
        </section>

        {/* Features Grid - 2×3 */}
        <FeaturesSection />

        {/* Use Cases - Perfect For... */}
        <UseCasesSection />

        {/* Final CTA - Ready To Settle It? */}
        <FinalCTASection />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  )
}

export default Landing
