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
  FloatingProjectiles,
} from '@/components/landing/enterprise'
import { analytics } from '@/services/analytics'

export function Landing() {
  useEffect(() => {
    document.title = '1v1 Bro - Trivia Duels With Real-Time Combat'
    
    // Initialize analytics and track landing page view
    analytics.init()
    analytics.trackPageView('/')
    
    return () => {
      document.title = '1v1 Bro'
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#09090B] text-white safe-area-all">
      {/* Global animated background */}
      <GlobalBackground />

      {/* Floating projectile effects */}
      <FloatingProjectiles count={5} />

      {/* Fixed Header */}
      <LandingHeader />

      {/* Main Content */}
      <main>
        {/* Hero Section - Full viewport with integrated LiveDemo */}
        <section id="demo">
          <HeroSection />
        </section>

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
