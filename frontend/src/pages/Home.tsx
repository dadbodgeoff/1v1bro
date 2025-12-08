/**
 * Home - Dashboard page with widget-based layout.
 * Requirements: 1.1-1.5, 3.1-3.5, 4.1-4.5, 5.1-5.4, 6.1-6.4
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFriends } from '@/hooks/useFriends'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { QuickActionsWidget } from '@/components/dashboard/QuickActionsWidget'
import { BattlePassWidget } from '@/components/dashboard/BattlePassWidget'
import { MatchHistoryWidget } from '@/components/dashboard/MatchHistoryWidget'
import { FriendsWidget } from '@/components/dashboard/FriendsWidget'
import { FriendsPanel, FriendsNotifications } from '@/components/friends'

export function Home() {
  const navigate = useNavigate()
  const { fetchFriends, isPanelOpen, closePanel } = useFriends()

  useEffect(() => {
    fetchFriends()
  }, [fetchFriends])

  return (
    <DashboardLayout activeNav="play">
      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <QuickActionsWidget />

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/bot-game')}
              className="py-4 bg-[#111111] border border-white/[0.06] rounded-xl text-sm text-neutral-400 hover:bg-white/[0.04] hover:text-white transition-all"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Practice vs Bot
              </span>
            </button>
            <button
              onClick={() => navigate('/fortnite-quiz')}
              className="py-4 bg-[#111111] border border-white/[0.06] rounded-xl text-sm text-neutral-400 hover:bg-white/[0.04] hover:text-white transition-all"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Fortnite Quiz
              </span>
            </button>
          </div>

          {/* Match History */}
          <MatchHistoryWidget maxItems={5} />
        </div>

        {/* Right Column - Widgets */}
        <div className="space-y-6">
          {/* Battle Pass Widget */}
          <BattlePassWidget />

          {/* Friends Widget */}
          <FriendsWidget maxItems={5} />

          {/* Quick Links */}
          <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5">
            <h3 className="text-sm font-medium text-neutral-400 mb-4">Quick Links</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/leaderboards')}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.04] transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-sm text-neutral-300">Leaderboards</span>
              </button>
              <button
                onClick={() => navigate('/shop')}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.04] transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <span className="text-sm text-neutral-300">Shop</span>
              </button>
              <button
                onClick={() => navigate('/inventory')}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.04] transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <span className="text-sm text-neutral-300">Inventory</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Friends Panel */}
      <FriendsPanel isOpen={isPanelOpen} onClose={closePanel} />
      <FriendsNotifications />
    </DashboardLayout>
  )
}
