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
 * 
 * Requirements: 1.1-1.5, 10.1-10.4
 */

import { useEffect } from 'react'
import { useFriends } from '@/hooks/useFriends'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import {
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
          {/* Hero Play Section - Primary action area */}
          <HeroPlaySection />

          {/* Match History Widget */}
          <MatchHistoryWidget maxItems={5} />
        </div>

        {/* Right Column - Widgets */}
        <div className="space-y-6">
          {/* Battle Pass Widget */}
          <BattlePassWidget />

          {/* Shop Preview Widget */}
          <ShopPreviewWidget maxItems={4} />

          {/* Loadout Preview Widget */}
          <LoadoutPreviewWidget />

          {/* Stats Summary Widget */}
          <StatsSummaryWidget />

          {/* Friends Widget */}
          <FriendsWidget maxItems={5} />
        </div>
      </div>
    </DashboardLayout>
  )
}
