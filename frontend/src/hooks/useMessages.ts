import { useCallback, useEffect, useRef } from 'react'
import { messagesAPI } from '@/services/api'
import { useMessageStore } from '@/stores/messageStore'
import { useAuthStore } from '@/stores/authStore'
import { wsService } from '@/services/websocket'
import type { Message, DMMessagePayload, DMReadPayload } from '@/types/message'

/**
 * Hook for direct messaging operations.
 */
export function useMessages() {
  const user = useAuthStore((s) => s.user)
  const {
    conversations,
    totalUnread,
    activeConversation,
    messages,
    hasMore,
    isLoading,
    isSending,
    isChatOpen,
    setConversations,
    setActiveConversation,
    setMessages,
    prependMessages,
    addMessage,
    markConversationRead,
    setLoading,
    setSending,
    setChatOpen,
    handleNewMessage,
    handleMessagesRead,
    updateFriendOnlineStatus,
  } = useMessageStore()

  const loadedRef = useRef(false)

  // Load conversations on mount
  const loadConversations = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await messagesAPI.getConversations()
      setConversations(data.conversations, data.total_unread)
    } catch (err) {
      console.error('Failed to load conversations:', err)
    } finally {
      setLoading(false)
    }
  }, [user, setLoading, setConversations])

  // Load messages for a conversation
  const loadMessages = useCallback(
    async (friendId: string) => {
      if (!user) return
      setLoading(true)
      try {
        const data = await messagesAPI.getMessages(friendId)
        setMessages(friendId, data.messages, data.has_more)
      } catch (err) {
        console.error('Failed to load messages:', err)
      } finally {
        setLoading(false)
      }
    },
    [user, setLoading, setMessages]
  )

  // Load older messages (pagination)
  const loadOlderMessages = useCallback(
    async (friendId: string) => {
      if (!user || !hasMore[friendId]) return

      const currentMessages = messages[friendId] || []
      const oldestId = currentMessages[0]?.id

      if (!oldestId) return

      setLoading(true)
      try {
        const data = await messagesAPI.getMessages(friendId, 50, oldestId)
        prependMessages(friendId, data.messages, data.has_more)
      } catch (err) {
        console.error('Failed to load older messages:', err)
      } finally {
        setLoading(false)
      }
    },
    [user, messages, hasMore, setLoading, prependMessages]
  )

  // Send a message
  const sendMessage = useCallback(
    async (friendId: string, content: string) => {
      if (!user || !content.trim()) return null

      setSending(true)
      try {
        const message = await messagesAPI.sendMessage(friendId, content.trim())
        addMessage(friendId, message)
        return message
      } catch (err) {
        console.error('Failed to send message:', err)
        return null
      } finally {
        setSending(false)
      }
    },
    [user, setSending, addMessage]
  )

  // Mark messages as read
  const markAsRead = useCallback(
    async (friendId: string) => {
      if (!user) return

      // Optimistic update
      markConversationRead(friendId)

      try {
        await messagesAPI.markAsRead(friendId)
      } catch (err) {
        console.error('Failed to mark as read:', err)
        // Reload to fix state
        loadConversations()
      }
    },
    [user, markConversationRead, loadConversations]
  )

  // Open chat with a friend
  const openChat = useCallback(
    async (friendId: string) => {
      setActiveConversation(friendId)
      setChatOpen(true)

      // Load messages if not already loaded
      if (!messages[friendId]) {
        await loadMessages(friendId)
      }

      // Mark as read
      const conv = conversations.find((c) => c.friend_id === friendId)
      if (conv && conv.unread_count > 0) {
        markAsRead(friendId)
      }
    },
    [
      setActiveConversation,
      setChatOpen,
      messages,
      loadMessages,
      conversations,
      markAsRead,
    ]
  )

  // Close chat
  const closeChat = useCallback(() => {
    setActiveConversation(null)
    setChatOpen(false)
  }, [setActiveConversation, setChatOpen])

  // Handle incoming WebSocket message
  const handleWSMessage = useCallback(
    (payload: DMMessagePayload) => {
      if (!user) return

      const message: Message = {
        id: payload.message_id,
        conversation_id: payload.conversation_id,
        sender_id: payload.sender_id,
        content: payload.content,
        created_at: payload.created_at,
        read_at: null,
      }

      handleNewMessage(
        payload.sender_id,
        message,
        payload.sender_display_name
      )

      // Auto-mark as read if viewing this conversation
      if (activeConversation === payload.sender_id && isChatOpen) {
        markAsRead(payload.sender_id)
      }
    },
    [user, handleNewMessage, activeConversation, isChatOpen, markAsRead]
  )

  // Handle read receipt
  const handleWSRead = useCallback(
    (payload: DMReadPayload) => {
      // Find friend_id from conversation
      const conv = conversations.find(
        (c) => c.conversation_id === payload.conversation_id
      )
      if (conv) {
        handleMessagesRead(conv.friend_id)
      }
    },
    [conversations, handleMessagesRead]
  )

  // Initial load
  useEffect(() => {
    if (user && !loadedRef.current) {
      loadedRef.current = true
      loadConversations()
    }
  }, [user, loadConversations])

  // WebSocket event handlers
  useEffect(() => {
    if (!user) return

    const handleDMMessage = (payload: unknown) => {
      const data = payload as DMMessagePayload
      const message: Message = {
        id: data.message_id,
        conversation_id: data.conversation_id,
        sender_id: data.sender_id,
        content: data.content,
        created_at: data.created_at,
        read_at: null,
      }
      handleNewMessage(data.sender_id, message, data.sender_display_name)
    }

    const handleDMRead = (payload: unknown) => {
      const data = payload as DMReadPayload
      const conv = conversations.find(
        (c) => c.conversation_id === data.conversation_id
      )
      if (conv) {
        handleMessagesRead(conv.friend_id)
      }
    }

    const handleFriendOnline = (payload: unknown) => {
      const data = payload as { user_id: string }
      updateFriendOnlineStatus(data.user_id, true)
    }

    const handleFriendOffline = (payload: unknown) => {
      const data = payload as { user_id: string }
      updateFriendOnlineStatus(data.user_id, false)
    }

    const unsubMessage = wsService.on('dm_message', handleDMMessage)
    const unsubRead = wsService.on('dm_read', handleDMRead)
    const unsubOnline = wsService.on('friend_online', handleFriendOnline)
    const unsubOffline = wsService.on('friend_offline', handleFriendOffline)

    return () => {
      unsubMessage()
      unsubRead()
      unsubOnline()
      unsubOffline()
    }
  }, [user, conversations, handleNewMessage, handleMessagesRead, updateFriendOnlineStatus])

  return {
    // State
    conversations,
    totalUnread,
    activeConversation,
    messages: activeConversation ? messages[activeConversation] || [] : [],
    hasMore: activeConversation ? hasMore[activeConversation] || false : false,
    isLoading,
    isSending,
    isChatOpen,

    // Actions
    loadConversations,
    loadMessages,
    loadOlderMessages,
    sendMessage,
    markAsRead,
    openChat,
    closeChat,

    // WebSocket handlers
    handleWSMessage,
    handleWSRead,
  }
}
