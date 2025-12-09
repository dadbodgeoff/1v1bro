import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { usePresence } from '@/hooks/usePresence'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuthStore } from '@/stores/authStore'
import { Home, Login, Register, Lobby, Game, ArenaGame, BotGame, Results, LeaderboardHub, LeaderboardDetail, FortniteQuiz, Landing, Profile, BattlePass, Shop, Inventory, Settings, Friends } from '@/pages'
import { PrivacyPolicy, TermsOfService, RefundPolicy } from '@/pages/legal'
import { MatchHistory } from '@/pages/MatchHistory'
import { CoinShop } from '@/pages/CoinShop'
import { CoinSuccess } from '@/pages/CoinSuccess'
import { ArenaTest } from '@/pages/ArenaTest'
import { ProgressionProvider } from '@/components/progression'

// Root route - shows Landing for guests, redirects to dashboard for authenticated users
function RootRoute() {
  const { isAuthenticated, isLoading } = useAuthStore()
  
  if (isLoading) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  }
  
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />
}

function App() {
  // Initialize auth check on app load
  useAuth()
  
  // Maintain online presence via heartbeat
  usePresence()

  return (
    <BrowserRouter>
      <ProgressionProvider>
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
        {/* Test route - no auth required */}
        <Route path="/arena-test" element={<ArenaTest />} />
        {/* Guest play route - try the game without signup */}
        <Route path="/play" element={<BotGame />} />
        {/* Legal pages - no auth required */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/refunds" element={<RefundPolicy />} />
        {/* Legacy landing route - redirect to root */}
        <Route path="/landing" element={<Navigate to="/" replace />} />
      </Routes>
      </ProgressionProvider>
    </BrowserRouter>
  )
}

export default App
