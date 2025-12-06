import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { usePresence } from '@/hooks/usePresence'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Home, Login, Register, Lobby, Game, ArenaGame, BotGame, Results, LeaderboardHub, LeaderboardDetail, FortniteQuiz, Landing } from '@/pages'
import { ArenaTest } from '@/pages/ArenaTest'

function App() {
  // Initialize auth check on app load
  useAuth()
  
  // Maintain online presence via heartbeat
  usePresence()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
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
        {/* Fortnite Quiz - no auth required for testing */}
        <Route path="/fortnite-quiz" element={<FortniteQuiz />} />
        {/* Test route - no auth required */}
        <Route path="/arena-test" element={<ArenaTest />} />
        {/* Landing page - no auth required */}
        <Route path="/landing" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
