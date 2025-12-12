/**
 * Home - Enterprise Dashboard page with widget-based layout.
 * 
 * Central hub for all platform features with enterprise-grade components.
 * 
 * Features:
 * - HeroPlaySection for quick matchmaking
 * - BattlePassWidget for progression tracking
 * - ShopPreviewWidget for featured items
 * - LoadoutPreviewWidget for equipped cosmetics
 * - StatsSummaryWidget for key performance metrics
 * - MatchHistoryWidget for recent matches
 * - FriendsWidget for online friends
 * - Responsive 3-column desktop, 2-column tablet, 1-column mobile layout
 * - First-time user onboarding modal
 * - Error boundaries for widget isolation (Requirements 2.1, 2.4)
 * 
 * Requirements: 1.1-1.5, 2.1, 2.4, 10.1-10.4
 */

import { useEffect } from 'react'
import { useFriends } from '@/hooks/useFriends'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import {
  WidgetErrorBoundary,
  HeroPlaySection,
  BattlePassWidget,
  ShopPreviewWidget,
  LoadoutPreviewWidget,
  StatsSummaryWidget,
  MatchHistoryWidget,
  FriendsWidget,
} from '@/components/dashboard/enterprise'
import { OnboardingModal, useOnboarding } from '@/components/onboarding'

export function Home() {
  const { fetchFriends } = useFriends()
  const { showOnboarding, closeOnboarding } = useOnboarding()

  useEffect(() => {
    fetchFriends()
  }, [fetchFriends])

  return (
    <DashboardLayout activeNav="play">
      {/* First-time user onboarding */}
      {showOnboarding && <OnboardingModal onClose={closeOnboarding} />}

      {/* Dashboard Grid - Requirements 10.1, 10.2, 10.3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Hero Play Section and Match History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero Play Section - Primary action area (Critical widget) */}
          <WidgetErrorBoundary widgetName="Quick Play" isCritical>
            <HeroPlaySection />
          </WidgetErrorBoundary>

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

          {/* Stats Summary Widget */}
          <WidgetErrorBoundary widgetName="Your Stats">
            <StatsSummaryWidget />
          </WidgetErrorBoundary>

          {/* Friends Widget */}
          <WidgetErrorBoundary widgetName="Friends Online">
            <FriendsWidget maxItems={5} />
          </WidgetErrorBoundary>
        </div>
      </div>
    </DashboardLayout>
  )
}
