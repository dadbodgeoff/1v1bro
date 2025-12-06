import { useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { authAPI } from '@/services/api'

export function useAuth() {
  const { user, token, isAuthenticated, isLoading, setUser, logout, setLoading } = useAuthStore()

  // Check auth on mount - restore session from token
  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const userData = await authAPI.me()
        setUser(userData, token)
      } catch {
        // Token invalid, clear it
        logout()
      }
    }

    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount - intentionally omitting deps

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await authAPI.login({ email, password })
      setUser(response.user, response.access_token)
      return response.user
    },
    [setUser]
  )

  const register = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const response = await authAPI.register({
        email,
        password,
        display_name: displayName,
      })
      setUser(response.user, response.access_token)
      return response.user
    },
    [setUser]
  )

  const signOut = useCallback(async () => {
    try {
      await authAPI.logout()
    } catch {
      // Ignore logout errors
    }
    logout()
  }, [logout])

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout: signOut,
  }
}
