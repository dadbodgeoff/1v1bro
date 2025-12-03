import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Home, Login, Register, Lobby, Game, Results } from '@/pages'
import { ArenaTest } from '@/pages/ArenaTest'

function App() {
  // Initialize auth check on app load
  useAuth()

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
        {/* Test route - no auth required */}
        <Route path="/arena-test" element={<ArenaTest />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
