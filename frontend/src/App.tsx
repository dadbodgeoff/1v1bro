import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { usePresence } from '@/hooks/usePresence'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuthStore } from '@/stores/authStore'
import { warmCache } from '@/game/assets'
import { AnalyticsProvider } from '@/providers/AnalyticsProvider'
import { PolishProvider } from '@/providers/PolishProvider'
import { AnalyticsDebugger } from '@/components/analytics'
import { Home, Login, Register, Lobby, Game, ArenaGame, BotGame, Results, LeaderboardHub, LeaderboardDetail, FortniteQuiz, Landing, Profile, BattlePass, Shop, Inventory, Settings, Friends } from '@/pages'
import { Achievements } from '@/pages/Achievements'
import { InstantPlay } from '@/pages/InstantPlay'
import { AdminAnalytics } from '@/pages/AdminAnalytics'
import { AdminAnalyticsEnterprise } from '@/pages/AdminAnalyticsEnterprise'
import { AdminSurvivalAnalytics } from '@/pages/AdminSurvivalAnalytics'
import { PrivacyPolicy, TermsOfService, RefundPolicy } from '@/pages/legal'
import { VolcanicLanding } from '@/pages/VolcanicLanding'
import { ArcadeLanding } from '@/pages/ArcadeLanding'
import { MatchHistory } from '@/pages/MatchHistory'
import { SimpleArenaTest } from '@/pages/SimpleArenaTest'
import { CornfieldMapBuilder } from '@/pages/CornfieldMapBuilder'
import SurvivalTest from '@/pages/SurvivalTest'
import SurvivalDemoTest from '@/pages/SurvivalDemoTest'
import SurvivalLeaderboard from '@/pages/SurvivalLeaderboard'
import SurvivalGame from '@/pages/SurvivalGame'
import SurvivalInstantPlay from '@/pages/SurvivalInstantPlay'
import { ThumbnailGenerator } from '@/components/admin/ThumbnailGenerator'
import { CoinShop } from '@/pages/CoinShop'
import { CoinSuccess } from '@/pages/CoinSuccess'
import { ProgressionProvider } from '@/components/progression'
import { PageTransition } from '@/components/transitions'

// Root route - shows CRT Arcade Landing for guests, redirects to dashboard for authenticated users
function RootRoute() {
  const { isAuthenticated, isLoading } = useAuthStore()
  
  if (isLoading) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  }
  
  // Use CRT Arcade Landing as the main landing page
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <ArcadeLanding />
}

function App() {
  // Initialize auth check on app load
  useAuth()
  
  // Maintain online presence via heartbeat
  usePresence()
  
  // Warm asset cache in background on app startup
  // Uses requestIdleCallback to avoid blocking initial render
  useEffect(() => {
    warmCache('simple')
  }, [])

  return (
    <BrowserRouter>
      <PolishProvider>
      <AnalyticsProvider enabled={true}>
      <ProgressionProvider>
      <PageTransition>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<RootRoute />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lobby/:code"
          element={
            <ProtectedRoute>
              <Lobby />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/:code"
          element={
            <ProtectedRoute>
              <ArenaGame />
            </ProtectedRoute>
          }
        />
        {/* Legacy quiz-only game route */}
        <Route
          path="/quiz/:code"
          element={
            <ProtectedRoute>
              <Game />
            </ProtectedRoute>
          }
        />
        <Route
          path="/results/:code"
          element={
            <ProtectedRoute>
              <Results />
            </ProtectedRoute>
          }
        />
        {/* Leaderboard routes */}
        <Route
          path="/leaderboards"
          element={
            <ProtectedRoute>
              <LeaderboardHub />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboards/:category"
          element={
            <ProtectedRoute>
              <LeaderboardDetail />
            </ProtectedRoute>
          }
        />
        {/* Bot practice mode */}
        <Route
          path="/bot-game"
          element={
            <ProtectedRoute>
              <BotGame />
            </ProtectedRoute>
          }
        />
        {/* Profile page */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        {/* Match History page */}
        <Route
          path="/profile/matches"
          element={
            <ProtectedRoute>
              <MatchHistory />
            </ProtectedRoute>
          }
        />
        {/* Battle Pass page */}
        <Route
          path="/battlepass"
          element={
            <ProtectedRoute>
              <BattlePass />
            </ProtectedRoute>
          }
        />
        {/* Shop page */}
        <Route
          path="/shop"
          element={
            <ProtectedRoute>
              <Shop />
            </ProtectedRoute>
          }
        />
        {/* Inventory page */}
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <Inventory />
            </ProtectedRoute>
          }
        />
        {/* Settings page */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        {/* Friends page */}
        <Route
          path="/friends"
          element={
            <ProtectedRoute>
              <Friends />
            </ProtectedRoute>
          }
        />
        {/* Achievements page */}
        <Route
          path="/achievements"
          element={
            <ProtectedRoute>
              <Achievements />
            </ProtectedRoute>
          }
        />
        {/* Coin Shop pages */}
        <Route
          path="/coins"
          element={
            <ProtectedRoute>
              <CoinShop />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coins/success"
          element={
            <ProtectedRoute>
              <CoinSuccess />
            </ProtectedRoute>
          }
        />
        {/* Fortnite Quiz - no auth required for testing */}
        <Route path="/fortnite-quiz" element={<FortniteQuiz />} />
        {/* Guest play route - try the game without signup */}
        <Route path="/play" element={<BotGame />} />
        {/* Instant play route - zero-friction guest experience */}
        <Route path="/instant-play" element={<InstantPlay />} />
        {/* Legal pages - no auth required */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/refunds" element={<RefundPolicy />} />
        {/* Legacy landing page - old design preserved at /landing-classic */}
        <Route path="/landing-classic" element={<Landing />} />
        {/* Legacy landing route - redirect to root */}
        <Route path="/landing" element={<Navigate to="/" replace />} />
        {/* Volcanic landing page prototype */}
        <Route path="/promo" element={<VolcanicLanding />} />
        {/* CRT Arcade landing page - also available at /arcade */}
        <Route path="/arcade" element={<ArcadeLanding />} />
        {/* Simple Arena Test - floor tile rendering test */}
        <Route path="/simple-arena-test" element={<SimpleArenaTest />} />
        {/* Cornfield Map Builder - map building/preview tool */}
        <Route path="/cornfield-builder" element={<CornfieldMapBuilder />} />
        {/* Survival Mode 3D Test - asset loading prototype */}
        <Route path="/survival-test" element={<SurvivalTest />} />
        {/* Survival Demo Test - lightweight canvas demo for landing page */}
        <Route path="/survival-demo-test" element={<SurvivalDemoTest />} />
        {/* Admin Analytics Dashboard */}
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute>
              <AdminAnalytics />
            </ProtectedRoute>
          }
        />
        {/* Enterprise Analytics Dashboard */}
        <Route
          path="/admin/analytics/enterprise"
          element={
            <ProtectedRoute>
              <AdminAnalyticsEnterprise />
            </ProtectedRoute>
          }
        />
        {/* Survival Analytics Dashboard */}
        <Route
          path="/admin/analytics/survival"
          element={
            <ProtectedRoute>
              <AdminSurvivalAnalytics />
            </ProtectedRoute>
          }
        />
        {/* Survival Mode - Authenticated */}
        <Route
          path="/survival"
          element={
            <ProtectedRoute>
              <SurvivalGame />
            </ProtectedRoute>
          }
        />
        {/* Survival Leaderboard - Public */}
        <Route path="/survival/leaderboard" element={<SurvivalLeaderboard />} />
        {/* Survival Instant Play - Guest experience */}
        <Route path="/survival/instant" element={<SurvivalInstantPlay />} />
        {/* Admin: 3D Thumbnail Generator - no auth for dev convenience */}
        <Route path="/admin/thumbnail-generator" element={<ThumbnailGenerator />} />
      </Routes>
      </PageTransition>
      </ProgressionProvider>
      {/* Analytics debugger - only visible in development */}
      <AnalyticsDebugger />
      </AnalyticsProvider>
      </PolishProvider>
    </BrowserRouter>
  )
}

export default App
