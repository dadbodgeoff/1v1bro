import { create } from 'zustand'
import type { Conversation, Message } from '@/types/message'

interface MessageState {
  // Data
  conversations: Conversation[]
  totalUnread: number
  activeConversation: string | null // friend_id
  messages: Record<string, Message[]> // keyed by friend_id
  hasMore: Record<string, boolean>

  // UI state
  isLoading: boolean
  isSending: boolean
  isChatOpen: boolean

  // Actions
  setConversations: (conversations: Conversation[], totalUnread: number) => void
  setActiveConversation: (friendId: string | null) => void
  setMessages: (friendId: string, messages: Message[], hasMore: boolean) => void
  prependMessages: (friendId: string, messages: Message[], hasMore: boolean) => void
  addMessage: (friendId: string, message: Message) => void
  markConversationRead: (friendId: string) => void
  setLoading: (loading: boolean) => void
  setSending: (sending: boolean) => void
  setChatOpen: (open: boolean) => void

  // Real-time updates
  handleNewMessage: (
    friendId: string,
    message: Message,
    senderDisplayName: string | null
  ) => void
  handleMessagesRead: (friendId: string) => void
  updateFriendOnlineStatus: (friendId: string, isOnline: boolean) => void

  // Reset
  reset: () => void
}

const initialState = {
  conversations: [],
  totalUnread: 0,
  activeConversation: null,
  messages: {},
  hasMore: {},
  isLoading: false,
  isSending: false,
  isChatOpen: false,
}

export const useMessageStore = create<MessageState>((set) => ({
  ...initialState,

  setConversations: (conversations, totalUnread) =>
    set({ conversations, totalUnread }),

  setActiveConversation: (friendId) =>
    set({ activeConversation: friendId }),

  setMessages: (friendId, messages, hasMore) =>
    set((state) => ({
      messages: { ...state.messages, [friendId]: messages },
      hasMore: { ...state.hasMore, [friendId]: hasMore },
    })),

  prependMessages: (friendId, messages, hasMore) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [friendId]: [...messages, ...(state.messages[friendId] || [])],
      },
      hasMore: { ...state.hasMore, [friendId]: hasMore },
    })),

  addMessage: (friendId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [friendId]: [...(state.messages[friendId] || []), message],
      },
    })),

  markConversationRead: (friendId) =>
    set((state) => {
      const conv = state.conversations.find((c) => c.friend_id === friendId)
      if (!conv) return state

      const unreadDelta = conv.unread_count
      return {
        conversations: state.conversations.map((c) =>
          c.friend_id === friendId ? { ...c, unread_count: 0 } : c
        ),
        totalUnread: Math.max(0, state.totalUnread - unreadDelta),
      }
    }),

  setLoading: (isLoading) => set({ isLoading }),
  setSending: (isSending) => set({ isSending }),
  setChatOpen: (isChatOpen) => set({ isChatOpen }),

  handleNewMessage: (friendId, message, senderDisplayName) =>
    set((state) => {
      // Add message to conversation if loaded
      const newMessages = { ...state.messages }
      if (newMessages[friendId]) {
        newMessages[friendId] = [...newMessages[friendId], message]
      }

      // Update conversation list
      const existingConv = state.conversations.find(
        (c) => c.friend_id === friendId
      )
      let newConversations = state.conversations

      if (existingConv) {
        // Update existing conversation
        newConversations = state.conversations.map((c) =>
          c.friend_id === friendId
            ? {
                ...c,
                last_message: {
                  id: message.id,
                  content: message.content,
                  sender_id: message.sender_id,
                  created_at: message.created_at,
                },
                unread_count:
                  state.activeConversation === friendId
                    ? c.unread_count
                    : c.unread_count + 1,
                updated_at: message.created_at,
              }
            : c
        )
        // Move to top
        const updated = newConversations.find((c) => c.friend_id === friendId)!
        newConversations = [
          updated,
          ...newConversations.filter((c) => c.friend_id !== friendId),
        ]
      } else {
        // Create new conversation entry
        newConversations = [
          {
            conversation_id: message.conversation_id,
            friend_id: friendId,
            friend_display_name: senderDisplayName,
            friend_avatar_url: null,
            is_online: true,
            last_message: {
              id: message.id,
              content: message.content,
              sender_id: message.sender_id,
              created_at: message.created_at,
            },
            unread_count: state.activeConversation === friendId ? 0 : 1,
            updated_at: message.created_at,
          },
          ...state.conversations,
        ]
      }

      // Update total unread if not viewing this conversation
      const newTotalUnread =
        state.activeConversation === friendId
          ? state.totalUnread
          : state.totalUnread + 1

      return {
        messages: newMessages,
        conversations: newConversations,
        totalUnread: newTotalUnread,
      }
    }),

  handleMessagesRead: (friendId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [friendId]: (state.messages[friendId] || []).map((m) =>
          m.read_at ? m : { ...m, read_at: new Date().toISOString() }
        ),
      },
    })),

  updateFriendOnlineStatus: (friendId, isOnline) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.friend_id === friendId ? { ...c, is_online: isOnline } : c
      ),
    })),

  reset: () => set(initialState),
}))
