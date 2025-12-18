import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { usePresence } from '@/hooks/usePresence'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuthStore } from '@/stores/authStore'
import { warmCache } from '@/game/assets'
import { AnalyticsProvider } from '@/providers/AnalyticsProvider'
import { PolishProvider } from '@/providers/PolishProvider'
import { AnalyticsDebugger } from '@/components/analytics'
import { ProgressionProvider } from '@/components/progression'

// Critical path - eagerly loaded (login, register, landing, dashboard)
import { Home, Login, Register, Lobby } from '@/pages'
import { ArcadeLanding } from '@/pages/ArcadeLanding'

// Lazy loaded pages - split by feature for optimal chunking
// Game pages (heavy - Three.js, game engine)
const ArenaGame = lazy(() => import('@/pages/ArenaGame').then(m => ({ default: m.ArenaGame })))
const Game = lazy(() => import('@/pages/Game').then(m => ({ default: m.Game })))
const BotGame = lazy(() => import('@/pages/BotGame').then(m => ({ default: m.BotGame })))
const SurvivalGame = lazy(() => import('@/pages/SurvivalGame'))
const SurvivalInstantPlay = lazy(() => import('@/pages/SurvivalInstantPlay'))
const SurvivalTest = lazy(() => import('@/pages/SurvivalTest'))
const SurvivalDemoTest = lazy(() => import('@/pages/SurvivalDemoTest'))
const SimpleArenaTest = lazy(() => import('@/pages/SimpleArenaTest').then(m => ({ default: m.SimpleArenaTest })))
const ArenaMapViewer = lazy(() => import('@/pages/ArenaMapViewer'))
const ArenaPlayTest = lazy(() => import('@/pages/ArenaPlayTest'))
const Arena = lazy(() => import('@/pages/Arena'))
const CornfieldMapBuilder = lazy(() => import('@/pages/CornfieldMapBuilder').then(m => ({ default: m.CornfieldMapBuilder })))

// Shop & Inventory (medium - cosmetics, 3D previews)
const Shop = lazy(() => import('@/pages/Shop').then(m => ({ default: m.Shop })))
const Inventory = lazy(() => import('@/pages/Inventory').then(m => ({ default: m.Inventory })))
const CoinShop = lazy(() => import('@/pages/CoinShop').then(m => ({ default: m.CoinShop })))
const CoinSuccess = lazy(() => import('@/pages/CoinSuccess').then(m => ({ default: m.CoinSuccess })))

// Profile & Social (medium)
const Profile = lazy(() => import('@/pages/Profile').then(m => ({ default: m.Profile })))
const Friends = lazy(() => import('@/pages/Friends').then(m => ({ default: m.Friends })))
const MatchHistory = lazy(() => import('@/pages/MatchHistory').then(m => ({ default: m.MatchHistory })))

// Progression (medium)
const BattlePass = lazy(() => import('@/pages/BattlePass').then(m => ({ default: m.BattlePass })))
const Achievements = lazy(() => import('@/pages/Achievements').then(m => ({ default: m.Achievements })))

// Leaderboards (light)
const LeaderboardHub = lazy(() => import('@/pages/LeaderboardHub').then(m => ({ default: m.LeaderboardHub })))
const LeaderboardDetail = lazy(() => import('@/pages/LeaderboardDetail').then(m => ({ default: m.LeaderboardDetail })))
const SurvivalLeaderboard = lazy(() => import('@/pages/SurvivalLeaderboard'))

// Settings (light)
const Settings = lazy(() => import('@/pages/Settings').then(m => ({ default: m.Settings })))

// Results & Quiz (light)
const Results = lazy(() => import('@/pages/Results').then(m => ({ default: m.Results })))
const FortniteQuiz = lazy(() => import('@/pages/FortniteQuiz').then(m => ({ default: m.FortniteQuiz })))
const InstantPlay = lazy(() => import('@/pages/InstantPlay').then(m => ({ default: m.InstantPlay })))

// Admin pages (rarely accessed)
const AnalyticsDashboard = lazy(() => import('@/pages/AnalyticsDashboard'))
const ThumbnailGenerator = lazy(() => import('@/components/admin/ThumbnailGenerator').then(m => ({ default: m.ThumbnailGenerator })))

// Landing pages (light)
const Landing = lazy(() => import('@/pages/Landing').then(m => ({ default: m.Landing })))
const VolcanicLanding = lazy(() => import('@/pages/VolcanicLanding').then(m => ({ default: m.VolcanicLanding })))

// Legal pages (light)
const PrivacyPolicy = lazy(() => import('@/pages/legal').then(m => ({ default: m.PrivacyPolicy })))
const TermsOfService = lazy(() => import('@/pages/legal').then(m => ({ default: m.TermsOfService })))
const RefundPolicy = lazy(() => import('@/pages/legal').then(m => ({ default: m.RefundPolicy })))

// Loading fallback for lazy routes
function PageLoader() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-neutral-500">Loading...</span>
      </div>
    </div>
  )
}

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
      <Suspense fallback={<PageLoader />}>
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
        {/* Arena Map Viewer - 3D terminal map preview */}
        <Route path="/arena-viewer" element={<ArenaMapViewer />} />
        {/* Arena Play Test - First-person playable arena with physics */}
        <Route path="/arena-play-test" element={<ArenaPlayTest />} />
        {/* Arena - Dashboard-integrated arena (practice mode) */}
        <Route
          path="/arena"
          element={
            <ProtectedRoute>
              <Arena />
            </ProtectedRoute>
          }
        />
        {/* Legacy Analytics Routes - Redirect to new unified dashboard */}
        <Route path="/admin/analytics" element={<Navigate to="/analytics" replace />} />
        <Route path="/admin/analytics/enterprise" element={<Navigate to="/analytics" replace />} />
        <Route path="/admin/analytics/survival" element={<Navigate to="/analytics" replace />} />
        {/* Unified Analytics Dashboard */}
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AnalyticsDashboard />
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
      </Suspense>
      </ProgressionProvider>
      {/* Analytics debugger - only visible in development */}
      <AnalyticsDebugger />
      </AnalyticsProvider>
      </PolishProvider>
    </BrowserRouter>
  )
}

export default App
