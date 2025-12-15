/**
 * AnalyticsDashboard - Enterprise Analytics Dashboard
 * 
 * Clean, modular dashboard with:
 * - Overview: Key metrics, traffic, devices
 * - Performance: Core Web Vitals, scroll depth
 * - Realtime: Live visitor tracking
 * - Errors: JS error tracking
 * - Survival: Game analytics
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import {
  OverviewPanel,
  PerformancePanel,
  RealtimePanel,
  ErrorsPanel,
  SurvivalPanel,
  PagesPanel,
  TechPanel,
  UTMPanel,
  JourneysPanel,
  SessionsPanel,
  HeatmapPanel,
  EventsPanel,
  FunnelsPanel,
  ExperimentsPanel,
  CohortsPanel,
} from '@/components/analytics/enterprise'

// Admin emails
const ADMIN_EMAILS = ['dadbodgeoff@gmail.com']

type Tab = 'overview' | 'pages' | 'tech' | 'utm' | 'journeys' | 'sessions' | 'performance' | 'realtime' | 'errors' | 'heatmap' | 'events' | 'funnels' | 'experiments' | 'cohorts' | 'survival'

export function AnalyticsDashboard() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()
  
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 7)
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    }
  })
  const [survivalDays, setSurvivalDays] = useState(7)

  // Auth check
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, user?.email, navigate])

  const tabs: { id: Tab; label: string; badge?: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'pages', label: 'Pages' },
    { id: 'tech', label: 'Tech' },
    { id: 'utm', label: 'Campaigns' },
    { id: 'journeys', label: 'Journeys' },
    { id: 'sessions', label: 'Sessions' },
    { id: 'heatmap', label: 'Heatmap' },
    { id: 'events', label: 'Events' },
    { id: 'funnels', label: 'Funnels' },
    { id: 'performance', label: 'Performance' },
    { id: 'realtime', label: 'Realtime', badge: 'Live' },
    { id: 'errors', label: 'Errors' },
    { id: 'experiments', label: 'A/B Tests', badge: '🧪' },
    { id: 'cohorts', label: 'Cohorts' },
    { id: 'survival', label: 'Survival', badge: '🎮' },
  ]

  const quickRanges = [
    { label: '7D', days: 7 },
    { label: '14D', days: 14 },
    { label: '30D', days: 30 },
  ]

  const setQuickRange = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    })
    setSurvivalDays(days)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="text-neutral-500 hover:text-white transition-colors"
              >
                ←
              </button>
              <h1 className="text-xl font-bold">Analytics</h1>
              <span className="text-xs text-orange-400 bg-orange-500/20 px-2 py-1 rounded">
                Enterprise
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Quick Range Buttons */}
              <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                {quickRanges.map((r) => (
                  <button
                    key={r.days}
                    onClick={() => setQuickRange(r.days)}
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      survivalDays === r.days 
                        ? 'bg-orange-500 text-white' 
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              
              {/* Date Pickers */}
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-3 py-1.5 bg-white/5 rounded-lg text-sm border border-white/10 text-neutral-300"
              />
              <span className="text-neutral-600">→</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-1.5 bg-white/5 rounded-lg text-sm border border-white/10 text-neutral-300"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tabs */}
        <nav className="flex gap-1 mb-6 border-b border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-[1px] flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-orange-500 text-white'
                  : 'border-transparent text-neutral-500 hover:text-white'
              }`}
            >
              {tab.label}
              {tab.badge && (
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  tab.badge === 'Live' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-white/10 text-neutral-400'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Panel Content */}
        <main>
          {activeTab === 'overview' && <OverviewPanel dateRange={dateRange} />}
          {activeTab === 'pages' && <PagesPanel dateRange={dateRange} />}
          {activeTab === 'tech' && <TechPanel dateRange={dateRange} />}
          {activeTab === 'utm' && <UTMPanel dateRange={dateRange} />}
          {activeTab === 'journeys' && <JourneysPanel dateRange={dateRange} />}
          {activeTab === 'sessions' && <SessionsPanel dateRange={dateRange} />}
          {activeTab === 'heatmap' && <HeatmapPanel dateRange={dateRange} />}
          {activeTab === 'events' && <EventsPanel dateRange={dateRange} />}
          {activeTab === 'funnels' && <FunnelsPanel dateRange={dateRange} />}
          {activeTab === 'performance' && <PerformancePanel dateRange={dateRange} />}
          {activeTab === 'realtime' && <RealtimePanel />}
          {activeTab === 'errors' && <ErrorsPanel dateRange={dateRange} />}
          {activeTab === 'experiments' && <ExperimentsPanel />}
          {activeTab === 'cohorts' && <CohortsPanel dateRange={dateRange} />}
          {activeTab === 'survival' && <SurvivalPanel days={survivalDays} />}
        </main>
      </div>
    </div>
  )
}

export default AnalyticsDashboard
