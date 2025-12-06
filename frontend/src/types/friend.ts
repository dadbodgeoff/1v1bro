// Friend system types

export interface Friend {
  friendship_id: string
  user_id: string
  display_name: string | null
  avatar_url: string | null
  is_online: boolean
  show_online_status: boolean
  created_at: string
}

export interface FriendRequest {
  friendship_id: string
  user_id: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface FriendsListResponse {
  friends: Friend[]
  pending_requests: FriendRequest[]
  sent_requests: FriendRequest[]
}

export interface GameInvite {
  id: string
  from_user_id: string
  from_display_name: string | null
  from_avatar_url: string | null
  lobby_code: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  expires_at: string
  created_at: string
}

export interface UserSearchResult {
  id: string
  display_name: string | null
  avatar_url: string | null
  relationship_status: 'pending' | 'accepted' | 'blocked' | null
}

export interface UserSearchResponse {
  users: UserSearchResult[]
  total: number
}

// WebSocket event payloads
export interface FriendRequestPayload {
  friendship_id: string
  from_user_id: string
  display_name: string | null
  avatar_url: string | null
}

export interface FriendAcceptedPayload {
  user_id: string
  display_name: string | null
}

export interface FriendOnlinePayload {
  user_id: string
  display_name: string | null
}

export interface FriendOfflinePayload {
  user_id: string
}

export interface GameInvitePayload {
  invite_id: string
  from_user_id: string
  from_display_name: string | null
  lobby_code: string
}
