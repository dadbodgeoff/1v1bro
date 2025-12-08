/**
 * MessageBubble - Individual message display
 */

import { formatDistanceToNow } from 'date-fns'

interface MessageBubbleProps {
  content: string
  timestamp: string
  isOwn: boolean
  isRead: boolean
}

export function MessageBubble({ content, timestamp, isOwn, isRead }: MessageBubbleProps) {
  const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: true })

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] px-3 py-2 rounded-2xl ${
          isOwn
            ? 'bg-indigo-500/20 text-white rounded-br-md'
            : 'bg-white/[0.06] text-white rounded-bl-md'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] text-neutral-500">{timeAgo}</span>
          {isOwn && (
            <span className="text-[10px] text-neutral-500">
              {isRead ? (
                <svg className="w-3 h-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
