import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authAPI, lobbyAPI, APIError } from './api'
import { useAuthStore } from '@/stores/authStore'

// Mock fetch globally
const mockFetch = vi.fn()
;(globalThis as unknown as { fetch: typeof fetch }).fetch = mockFetch

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    useAuthStore.setState({ token: null })
  })

  describe('authAPI', () => {
    it('login sends correct request', async () => {
      const mockResponse = {
        success: true,
        data: {
          token: 'jwt-token',
          user: { id: '123', email: 'test@test.com', display_name: 'Test', games_played: 0, games_won: 0 },
          expires_in: 86400,
        },
      }
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      })

      const result = await authAPI.login({ email: 'test@test.com', password: 'password' })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@test.com', password: 'password' }),
        })
      )
      expect(result.token).toBe('jwt-token')
    })

    it('throws APIError on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: 'Invalid credentials',
          error_code: 'AUTH_ERROR',
        }),
        status: 401,
      })

      await expect(authAPI.login({ email: 'test@test.com', password: 'wrong' }))
        .rejects.toThrow(APIError)
    })

    it('includes auth token when available', async () => {
      useAuthStore.setState({ token: 'my-token' })
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: {} }),
      })

      await authAPI.me()

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/auth/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        })
      )
    })
  })

  describe('lobbyAPI', () => {
    it('create sends correct request', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { id: 'lobby-1', code: 'ABC123' },
        }),
      })

      const result = await lobbyAPI.create('fortnite')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/lobbies',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ game_mode: 'fortnite' }),
        })
      )
      expect(result.code).toBe('ABC123')
    })

    it('join sends correct request', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { id: 'lobby-1', code: 'ABC123' },
        }),
      })

      await lobbyAPI.join('ABC123')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/lobbies/ABC123/join',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })
})
