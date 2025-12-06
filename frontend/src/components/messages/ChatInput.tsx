/**
 * ChatInput - Message input with send button
 */

import { useState, useRef, useEffect, type KeyboardEvent } from 'react'

interface ChatInputProps {
  onSend: (content: string) => void
  isSending: boolean
}

export function ChatInput({ onSend, isSending }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }, [message])

  const handleSend = () => {
    const trimmed = message.trim()
    if (!trimmed || isSending) return

    onSend(trimmed)
    setMessage('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const charCount = message.length
  const isOverLimit = charCount > 500

  return (
    <div className="px-4 py-3 border-t border-white/[0.06]">
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className={`w-full px-3 py-2 bg-white/[0.04] border rounded-xl text-sm text-white placeholder-neutral-500 resize-none focus:outline-none focus:ring-1 transition-colors ${
              isOverLimit
                ? 'border-red-500/50 focus:ring-red-500/50'
                : 'border-white/[0.06] focus:ring-purple-500/50'
            }`}
            disabled={isSending}
          />
          {charCount > 400 && (
            <span
              className={`absolute bottom-2 right-3 text-[10px] ${
                isOverLimit ? 'text-red-400' : 'text-neutral-500'
              }`}
            >
              {charCount}/500
            </span>
          )}
        </div>
        <button
          onClick={handleSend}
          disabled={!message.trim() || isSending || isOverLimit}
          className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSending ? (
            <div className="w-5 h-5 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
      <p className="text-[10px] text-neutral-600 mt-1.5">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  )
}
