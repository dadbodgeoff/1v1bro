/**
 * Home - Enterprise Dashboard with Game Mode Selection
 * 
 * Central hub with two primary game modes:
 * 1. 2D Arena Shooter (Trivia Duel) - Quick matchmaking
 * 2. Survival Runner - Endless trivia runner
 * 
 * Features:
 * - Clean game mode cards with queue functionality
 * - Battle Pass progression widget
 * - Featured shop items
 * - Loadout preview
 * - Match history
 * - Responsive 3-column desktop, 2-column tablet, 1-column mobile
 * 
 * Requirements: 1.1-1.5, 2.1, 2.4, 10.1-10.4
 */

import { useEffect } from 'react'
import { useFriends } from '@/hooks/useFriends'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import {
  WidgetErrorBoundary,
  BattlePassWidget,
  ShopPreviewWidget,
  LoadoutPreviewWidget,
  MatchHistoryWidget,
} from '@/components/dashboard/enterprise'
import { OnboardingModal, useOnboarding } from '@/components/onboarding'
import { SurvivalRunnerCard } from '@/components/dashboard/enterprise/SurvivalRunnerCard'
import { ArenaCard } from '@/components/dashboard/ArenaCard'

export function Home() {
  const { fetchFriends } = useFriends()
  const { showOnboarding, closeOnboarding } = useOnboarding()

  // Fetch friends data on mount - low priority, doesn't block render
  useEffect(() => {
    // Use requestIdleCallback to defer non-critical data fetch
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => fetchFriends(), { timeout: 2000 })
    } else {
      // Fallback for Safari
      setTimeout(fetchFriends, 100)
    }
  }, []) // Empty deps - only fetch on mount

  return (
    <DashboardLayout activeNav="play">
      {/* First-time user onboarding */}
      {showOnboarding && <OnboardingModal onClose={closeOnboarding} />}

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Game Modes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Game Mode Selection Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white tracking-tight">Play</h1>
            <span className="text-xs text-neutral-500">Choose your game mode</span>
          </div>

          {/* Game Mode Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Survival Runner Card */}
            <WidgetErrorBoundary widgetName="Survival Runner" isCritical>
              <SurvivalRunnerCard />
            </WidgetErrorBoundary>

            {/* 3D FPS Arena Card */}
            <WidgetErrorBoundary widgetName="3D Arena" isCritical>
              <ArenaCard />
            </WidgetErrorBoundary>
          </div>

          {/* Match History Widget */}
          <WidgetErrorBoundary widgetName="Match History">
            <MatchHistoryWidget maxItems={5} />
          </WidgetErrorBoundary>
        </div>

        {/* Right Column - Widgets */}
        <div className="space-y-6">
          {/* Battle Pass Widget */}
          <WidgetErrorBoundary widgetName="Battle Pass">
            <BattlePassWidget />
          </WidgetErrorBoundary>

          {/* Shop Preview Widget */}
          <WidgetErrorBoundary widgetName="Featured Items">
            <ShopPreviewWidget maxItems={4} />
          </WidgetErrorBoundary>

          {/* Loadout Preview Widget */}
          <WidgetErrorBoundary widgetName="Your Loadout">
            <LoadoutPreviewWidget />
          </WidgetErrorBoundary>
        </div>
      </div>
    </DashboardLayout>
  )
}
