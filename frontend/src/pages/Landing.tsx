/**
 * Landing - Main landing page component
 * Orchestrates all sections and manages scroll state
 * 
 * Validates: Requirements 8.1, 8.2, 8.3, 10.1, 10.2, 10.3
 */

import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useReducedMotion, useLandingStats } from '@/hooks/landing'
import { HeroSection, LoadingScreen, StickyMobileCTA } from '@/components/landing'
import type { LandingState } from '@/components/landing/types'

// Lazy load below-fold sections
const FeatureShowcase = lazy(() => import('@/components/landing/FeatureShowcase').then(m => ({ default: m.FeatureShowcase })))
const StatsSection = lazy(() => import('@/components/landing/StatsSection').then(m => ({ default: m.StatsSection })))
const TechShowcase = lazy(() => import('@/components/landing/TechShowcase').then(m => ({ default: m.TechShowcase })))
const FooterCTA = lazy(() => import('@/components/landing/FooterCTA').then(m => ({ default: m.FooterCTA })))

// Section loading fallback
function SectionFallback() {
  return <div className="py-24 flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
}

export function Landing() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const reducedMotion = useReducedMotion()
  const { stats, isLoading: statsLoading } = useLandingStats()

  const [state, setState] = useState<LandingState>({
    isLoading: true,
    loadProgress: 0,
    activeSection: 'hero',
    demoState: {
      status: 'idle',
      timeRemaining: 60,
      playerHealth: 100,
      botHealth: 100,
      playerScore: 0,
      botScore: 0,
      result: null,
    },
    stats: null,
    reducedMotion,
  })

  const loadStartTime = useRef(Date.now())

  // Handle initial loading
  useEffect(() => {
    const loadAssets = async () => {
      // Simulate asset preloading with progress
      setState(s => ({ ...s, loadProgress: 0.3 }))
      await new Promise(r => setTimeout(r, 200))

      setState(s => ({ ...s, loadProgress: 0.6 }))
      await new Promise(r => setTimeout(r, 200))

      setState(s => ({ ...s, loadProgress: 1 }))
      
      // Ensure minimum loading time for smooth UX
      const elapsed = Date.now() - loadStartTime.current
      const minLoadTime = 800
      if (elapsed < minLoadTime) {
        await new Promise(r => setTimeout(r, minLoadTime - elapsed))
      }

      setState(s => ({ ...s, isLoading: false }))
    }

    loadAssets()
  }, [])

  // Update stats when loaded
  useEffect(() => {
    if (stats) {
      setState(s => ({ ...s, stats }))
    }
  }, [stats])

  // Track time on page for analytics
  const getTimeOnPage = () => Math.floor((Date.now() - loadStartTime.current) / 1000)

  // Set document title
  useEffect(() => {
    document.title = '1v1 Bro - Real-Time PvP Trivia Arena Game'
    return () => {
      document.title = '1v1 Bro'
    }
  }, [])

  // Handle CTA clicks
  const handleCTAClick = (location: string) => {
    // Fire analytics event (placeholder)
    console.log('CTA clicked', { location, timeOnPage: getTimeOnPage() })

    // Navigate based on auth state
    if (isAuthenticated) {
      navigate('/')
    } else {
      navigate('/register')
    }
  }



  // Show loading screen
  if (state.isLoading) {
    return (
      <AnimatePresence>
        <LoadingScreen progress={state.loadProgress} />
      </AnimatePresence>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">


      {/* Skip to content for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-500 focus:text-white focus:rounded"
      >
        Skip to main content
      </a>

      {/* Header with auth-aware CTA */}
      <header className="fixed top-0 w-full z-50 bg-gradient-to-b from-black/80 to-transparent">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-white hover:text-indigo-400 transition-colors">
            1v1 Bro
          </Link>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-neutral-400 hidden sm:inline">
                  Welcome back, {user?.email?.split('@')[0] || 'Player'}
                </span>
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-2 bg-white text-black rounded-lg font-medium hover:bg-neutral-200 transition"
                >
                  Play Now
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-neutral-400 hover:text-white transition-colors hidden sm:inline"
                >
                  Log In
                </Link>
                <button
                  onClick={() => navigate('/register')}
                  className="px-6 py-2 bg-white text-black rounded-lg font-medium hover:bg-neutral-200 transition"
                >
                  Sign Up Free
                </button>
              </>
            )}
          </div>
        </nav>
      </header>

      <main id="main-content">
        <HeroSection
          reducedMotion={reducedMotion}
          onCTAClick={() => handleCTAClick('hero')}
          isAuthenticated={isAuthenticated}
        />

        <Suspense fallback={<SectionFallback />}>
          <FeatureShowcase reducedMotion={reducedMotion} />
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <StatsSection
            stats={state.stats}
            isLoading={statsLoading}
            reducedMotion={reducedMotion}
          />
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <TechShowcase reducedMotion={reducedMotion} />
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <FooterCTA
            onCTAClick={() => handleCTAClick('footer')}
            playerCount={state.stats?.activePlayers}
            isAuthenticated={isAuthenticated}
          />
        </Suspense>
      </main>

      {/* Mobile sticky CTA */}
      <StickyMobileCTA
        onCTAClick={() => handleCTAClick('sticky')}
        isAuthenticated={isAuthenticated}
      />

      {/* Footer */}
      <footer className="py-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-neutral-500">
          <p>© 2025 1v1 Bro. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/leaderboards" className="hover:text-white transition-colors">Leaderboards</Link>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
