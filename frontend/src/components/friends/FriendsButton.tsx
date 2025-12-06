/**
 * FriendsButton - Clean, minimal friends button
 */

import { useFriends } from '@/hooks/useFriends'

interface FriendsButtonProps {
  onClick: () => void
  className?: string
}

export function FriendsButton({ onClick, className = '' }: FriendsButtonProps) {
  const { friends, pendingRequests, hasNewRequest, hasNewInvite } = useFriends()
  const onlineCount = friends.filter((f) => f.is_online).length
  const hasNotification = hasNewRequest || hasNewInvite || pendingRequests.length > 0

  return (
    <button
      onClick={onClick}
      className={`relative py-3 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-neutral-400 hover:bg-white/[0.04] hover:text-white transition-all flex items-center justify-center gap-2 ${className}`}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      <span>Friends</span>
      {onlineCount > 0 && (
        <span className="text-xs text-emerald-400">{onlineCount}</span>
      )}
      {hasNotification && (
        <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-400 rounded-full" />
      )}
    </button>
  )
}

export function FriendsButtonCompact({ onClick, className = '' }: FriendsButtonProps) {
  const { friends, pendingRequests, hasNewRequest, hasNewInvite } = useFriends()
  const onlineCount = friends.filter((f) => f.is_online).length
  const hasNotification = hasNewRequest || hasNewInvite || pendingRequests.length > 0

  return (
    <button
      onClick={onClick}
      className={`relative p-2.5 bg-white/[0.02] border border-white/[0.06] rounded-lg hover:bg-white/[0.04] transition-all ${className}`}
      title={`Friends (${onlineCount} online)`}
    >
      <svg
        className="w-4 h-4 text-neutral-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      {hasNotification && (
        <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-400 rounded-full" />
      )}
      {onlineCount > 0 && (
        <span className="absolute -bottom-1 -right-1 min-w-[16px] h-4 flex items-center justify-center text-[10px] font-medium bg-emerald-500 text-white rounded-full">
          {onlineCount}
        </span>
      )}
    </button>
  )
}
