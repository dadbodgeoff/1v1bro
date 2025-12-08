/**
 * ConversationList - List of message conversations
 */

import { formatDistanceToNow } from 'date-fns'
import type { Conversation } from '@/types/message'

interface ConversationListProps {
  conversations: Conversation[]
  onSelect: (conversation: Conversation) => void
}

export function ConversationList({ conversations, onSelect }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center px-4">
        <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-sm text-neutral-500">No conversations yet</p>
        <p className="text-xs text-neutral-600 mt-1">
          Start a chat from your friends list
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-white/[0.04]">
      {conversations.map((conv) => (
        <button
          key={conv.conversation_id}
          onClick={() => onSelect(conv)}
          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors text-left"
        >
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {conv.friend_avatar_url ? (
              <img
                src={conv.friend_avatar_url}
                alt={conv.friend_display_name || 'User'}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-blue-500/20 flex items-center justify-center">
                <span className="text-sm font-medium text-white/60">
                  {(conv.friend_display_name || '?')[0].toUpperCase()}
                </span>
              </div>
            )}
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0a0a0a] ${
                conv.is_online ? 'bg-green-400' : 'bg-neutral-600'
              }`}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-white truncate">
                {conv.friend_display_name || 'Unknown User'}
              </span>
              {conv.last_message && (
                <span className="text-[10px] text-neutral-500 flex-shrink-0">
                  {formatDistanceToNow(new Date(conv.last_message.created_at), {
                    addSuffix: false,
                  })}
                </span>
              )}
            </div>
            {conv.last_message && (
              <p className="text-xs text-neutral-500 truncate mt-0.5">
                {conv.last_message.content}
              </p>
            )}
          </div>

          {/* Unread badge */}
          {conv.unread_count > 0 && (
            <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-indigo-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
              {conv.unread_count > 99 ? '99+' : conv.unread_count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
