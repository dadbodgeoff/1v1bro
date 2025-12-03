import { API_BASE } from '@/utils/constants'
import { useAuthStore } from '@/stores/authStore'
import type {
  APIResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  Lobby,
  GameHistory,
} from '@/types/api'

class APIError extends Error {
  code: string
  status: number

  constructor(message: string, code: string, status: number) {
    super(message)
    this.name = 'APIError'
    this.code = code
    this.status = status
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  })

  const data: APIResponse<T> = await response.json()

  if (!data.success) {
    throw new APIError(
      data.error || 'Request failed',
      data.error_code || 'UNKNOWN_ERROR',
      response.status
    )
  }

  return data.data as T
}

// Auth API
export const authAPI = {
  register: (data: RegisterRequest) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: LoginRequest) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () =>
    request<void>('/auth/logout', {
      method: 'POST',
    }),

  me: () => request<User>('/auth/me'),
}

// Lobby API
export const lobbyAPI = {
  create: (gameMode = 'fortnite') =>
    request<Lobby>('/lobbies', {
      method: 'POST',
      body: JSON.stringify({ game_mode: gameMode }),
    }),

  get: (code: string) => request<Lobby>(`/lobbies/${code}`),

  join: (code: string) =>
    request<Lobby>(`/lobbies/${code}/join`, {
      method: 'POST',
    }),

  leave: (code: string) =>
    request<void>(`/lobbies/${code}`, {
      method: 'DELETE',
    }),
}

// Game API
export const gameAPI = {
  history: (limit = 20) =>
    request<GameHistory[]>(`/games/history?limit=${limit}`),

  get: (id: string) => request<GameHistory>(`/games/${id}`),
}

export { APIError }
