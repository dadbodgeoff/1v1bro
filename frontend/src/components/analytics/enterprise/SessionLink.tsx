/**
 * SessionLink - Clickable session ID component
 * Renders session IDs as clickable links that open the Session Explorer
 * 
 * Requirements: 2.1 - Session IDs displayed as clickable links
 */

import type { ReactNode, MouseEvent } from 'react'

export interface SessionLinkProps {
  sessionId: string
  className?: string
  children?: ReactNode
  onClick?: (sessionId: string) => void
}

export function SessionLink({ 
  sessionId, 
  className = '', 
  children,
  onClick 
}: SessionLinkProps) {
  const handleClick = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClick?.(sessionId)
  }

  // Truncate session ID for display if no children provided
  const displayText = children ?? truncateSessionId(sessionId)

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        font-mono text-xs text-cyan-400 
        hover:text-cyan-300 hover:underline 
        transition-colors cursor-pointer
        focus:outline-none focus:ring-1 focus:ring-cyan-400/50 focus:ring-offset-1 focus:ring-offset-transparent
        ${className}
      `.trim()}
      title={`View session: ${sessionId}`}
      aria-label={`View session details for ${sessionId}`}
    >
      {displayText}
    </button>
  )
}

/**
 * Truncates a session ID for display
 * Shows first 8 and last 4 characters with ellipsis
 */
function truncateSessionId(sessionId: string): string {
  if (sessionId.length <= 16) return sessionId
  return `${sessionId.slice(0, 8)}...${sessionId.slice(-4)}`
}
