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
import type { RecentMatch } from '@/types/matchHistory'

export const gameAPI = {
  history: (limit = 20) =>
    request<GameHistory[]>(`/games/history?limit=${limit}`),

  /**
   * Get recent match history with opponent details and ELO changes.
   * Enhanced endpoint that includes opponent_name, opponent_avatar_url, and elo_change.
   */
  getRecentMatches: (limit = 5) =>
    request<RecentMatch[]>(`/games/history?limit=${limit}`),

  get: (id: string) => request<GameHistory>(`/games/${id}`),
}

// Leaderboard API
import type { LeaderboardResponse, UserRankResponse, LeaderboardCategory, UserELORankResponse, ELOLeaderboardResponse } from '@/types/leaderboard'

export const leaderboardAPI = {
  getLeaderboard: (category: LeaderboardCategory, limit = 10, offset = 0) =>
    request<LeaderboardResponse>(`/leaderboards/${category}?limit=${limit}&offset=${offset}`),

  getMyRank: (category: LeaderboardCategory) =>
    request<UserRankResponse>(`/leaderboards/${category}/rank/me`),

  getUserRank: (category: LeaderboardCategory, userId: string) =>
    request<UserRankResponse>(`/leaderboards/${category}/rank/${userId}`),

  // ELO-specific endpoints (different path structure)
  getGlobalELOLeaderboard: (limit = 100, offset = 0) =>
    request<ELOLeaderboardResponse>(`/leaderboards/elo/global?limit=${limit}&offset=${offset}`),

  getMyELORank: () =>
    request<UserELORankResponse>(`/leaderboards/elo/me`),

  getUserELORank: (userId: string) =>
    request<UserELORankResponse>(`/leaderboards/elo/user/${userId}`),

  getRegionalELOLeaderboard: (region: string, limit = 100) =>
    request<ELOLeaderboardResponse>(`/leaderboards/elo/regional/${region}?limit=${limit}`),
}

// Friends API
import type { FriendsListResponse, UserSearchResponse, GameInvite } from '@/types/friend'

export const friendsAPI = {
  // Friends list
  getFriends: () => request<FriendsListResponse>('/friends'),

  // Friend requests
  sendRequest: (userId: string) =>
    request<{ friendship_id: string; status: string; message: string }>('/friends/request', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    }),

  acceptRequest: (friendshipId: string) =>
    request<{ friendship_id: string; status: string; message: string }>(
      `/friends/${friendshipId}/accept`,
      { method: 'POST' }
    ),

  declineRequest: (friendshipId: string) =>
    request<{ message: string }>(`/friends/${friendshipId}/decline`, { method: 'POST' }),

  // Friend management
  removeFriend: (friendshipId: string) =>
    request<{ message: string }>(`/friends/${friendshipId}`, { method: 'DELETE' }),

  // Blocking
  blockUser: (userId: string) =>
    request<{ message: string }>(`/friends/block/${userId}`, { method: 'POST' }),

  unblockUser: (userId: string) =>
    request<{ message: string }>(`/friends/block/${userId}`, { method: 'DELETE' }),

  getBlockedUsers: () => request<Array<{ user_id: string; display_name: string | null; avatar_url: string | null; blocked_at: string }>>('/friends/blocked'),

  // Game invites
  sendGameInvite: (friendId: string, lobbyCode: string) =>
    request<{ invite_id: string; expires_at: string; message: string }>(
      `/friends/${friendId}/invite`,
      {
        method: 'POST',
        body: JSON.stringify({ lobby_code: lobbyCode }),
      }
    ),

  getPendingInvites: () =>
    request<{ invites: GameInvite[] }>('/friends/invites'),

  acceptInvite: (inviteId: string) =>
    request<{ lobby_code: string; message: string }>(`/friends/invites/${inviteId}/accept`, {
      method: 'POST',
    }),

  declineInvite: (inviteId: string) =>
    request<{ message: string }>(`/friends/invites/${inviteId}/decline`, { method: 'POST' }),

  // User search
  searchUsers: (query: string, limit = 10) =>
    request<UserSearchResponse>(`/friends/search?q=${encodeURIComponent(query)}&limit=${limit}`),

  // Settings
  updateOnlineStatus: (showOnline: boolean) =>
    request<{ show_online_status: boolean }>('/friends/settings/online-status', {
      method: 'PUT',
      body: JSON.stringify({ show_online_status: showOnline }),
    }),

  // Presence heartbeat
  heartbeat: () =>
    request<{ status: string }>('/friends/heartbeat', { method: 'POST' }),
}

// Messages API
import type {
  ConversationListResponse,
  MessageHistoryResponse,
  Message,
} from '@/types/message'

export const messagesAPI = {
  // Conversations
  getConversations: () =>
    request<ConversationListResponse>('/messages/conversations'),

  // Messages
  getMessages: (friendId: string, limit = 50, beforeId?: string) => {
    const params = new URLSearchParams({ limit: String(limit) })
    if (beforeId) params.append('before_id', beforeId)
    return request<MessageHistoryResponse>(`/messages/${friendId}?${params}`)
  },

  sendMessage: (friendId: string, content: string) =>
    request<Message>(`/messages/${friendId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  markAsRead: (friendId: string) =>
    request<{ marked_count: number }>(`/messages/${friendId}/read`, {
      method: 'POST',
    }),

  // Unread count
  getUnreadCount: () =>
    request<{ unread_count: number }>('/messages/unread/count'),
}

export { APIError }
