/**
 * Direct messaging types.
 */

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  read_at: string | null
}

export interface LastMessage {
  id: string
  content: string
  sender_id: string
  created_at: string
}

export interface Conversation {
  conversation_id: string
  friend_id: string
  friend_display_name: string | null
  friend_avatar_url: string | null
  is_online: boolean
  last_message: LastMessage | null
  unread_count: number
  updated_at: string
}

export interface ConversationListResponse {
  conversations: Conversation[]
  total_unread: number
}

export interface MessageHistoryResponse {
  messages: Message[]
  has_more: boolean
  oldest_id: string | null
}

// WebSocket event payloads
export interface DMMessagePayload {
  message_id: string
  conversation_id: string
  sender_id: string
  sender_display_name: string | null
  content: string
  created_at: string
}

export interface DMReadPayload {
  conversation_id: string
  reader_id: string
}
