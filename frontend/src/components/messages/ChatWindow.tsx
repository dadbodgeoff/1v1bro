/**
 * ChatWindow - Direct message chat interface
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useMessages } from '@/hooks/useMessages'
import { useAuthStore } from '@/stores/authStore'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'

interface ChatWindowProps {
  friendId: string
  friendName: string | null
  friendAvatar: string | null
  isOnline: boolean
  onClose: () => void
}

export function ChatWindow({
  friendId,
  friendName,
  friendAvatar,
  isOnline,
  onClose,
}: ChatWindowProps) {
  const user = useAuthStore((s) => s.user)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  const {
    messages,
    hasMore,
    isLoading,
    isSending,
    loadOlderMessages,
    sendMessage,
  } = useMessages()

  // Scroll to bottom on new messages (if already at bottom)
  useEffect(() => {
    if (isAtBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isAtBottom])

  // Track scroll position
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const atBottom = scrollHeight - scrollTop - clientHeight < 50
    setIsAtBottom(atBottom)

    // Load more when scrolled to top
    if (scrollTop < 50 && hasMore && !isLoading) {
      loadOlderMessages(friendId)
    }
  }, [friendId, hasMore, isLoading, loadOlderMessages])

  const handleSend = async (content: string) => {
    await sendMessage(friendId, content)
    setIsAtBottom(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg h-[600px] max-h-[80vh] bg-[#0a0a0a] border border-white/[0.06] rounded-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
          <div className="relative">
            {friendAvatar ? (
              <img
                src={friendAvatar}
                alt={friendName || 'User'}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-blue-500/20 flex items-center justify-center">
                <span className="text-sm font-medium text-white/60">
                  {(friendName || '?')[0].toUpperCase()}
                </span>
              </div>
            )}
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0a0a0a] ${
                isOnline ? 'bg-green-400' : 'bg-neutral-600'
              }`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-white truncate">
              {friendName || 'Unknown User'}
            </h3>
            <p className="text-xs text-neutral-500">
              {isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-500 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-2"
        >
          {isLoading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm text-neutral-500">No messages yet</p>
              <p className="text-xs text-neutral-600 mt-1">
                Send a message to start the conversation
              </p>
            </div>
          ) : (
            <>
              {hasMore && (
                <div className="flex justify-center py-2">
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                  ) : (
                    <button
                      onClick={() => loadOlderMessages(friendId)}
                      className="text-xs text-neutral-500 hover:text-white transition-colors"
                    >
                      Load older messages
                    </button>
                  )}
                </div>
              )}
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  content={msg.content}
                  timestamp={msg.created_at}
                  isOwn={msg.sender_id === user?.id}
                  isRead={!!msg.read_at}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <ChatInput onSend={handleSend} isSending={isSending} />
      </div>
    </div>
  )
}
