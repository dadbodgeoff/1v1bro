import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './authStore'

describe('authStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
    })
  })

  it('starts with no user and loading true', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.isLoading).toBe(true)
  })

  it('setUser updates state correctly', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      display_name: 'TestUser',
      games_played: 5,
      games_won: 3,
    }
    const mockToken = 'jwt-token-123'

    useAuthStore.getState().setUser(mockUser, mockToken)

    const state = useAuthStore.getState()
    expect(state.user).toEqual(mockUser)
    expect(state.token).toBe(mockToken)
    expect(state.isAuthenticated).toBe(true)
    expect(state.isLoading).toBe(false)
  })

  it('logout clears user and token', () => {
    // First set a user
    useAuthStore.getState().setUser(
      {
        id: 'user-123',
        email: 'test@example.com',
        display_name: 'TestUser',
        games_played: 0,
        games_won: 0,
      },
      'token-123'
    )

    // Then logout
    useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.isLoading).toBe(false)
  })

  it('setLoading updates loading state', () => {
    useAuthStore.getState().setLoading(false)
    expect(useAuthStore.getState().isLoading).toBe(false)

    useAuthStore.getState().setLoading(true)
    expect(useAuthStore.getState().isLoading).toBe(true)
  })
})
