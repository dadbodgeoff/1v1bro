/**
 * FriendsWidget - Online friends quick view for dashboard.
 * Requirements: 6.1, 6.2, 6.3, 6.4, 5.5
 * 
 * 2025 Redesign Updates:
 * - Uses EmptyState component for empty state
 * - Uses design tokens for colors
 */

import { useEffect } from 'react'
import { useFriends } from '@/hooks/useFriends'
import type { Friend } from '@/types/friend'
import { EmptyState, EmptyFriendsIcon } from '@/components/ui/EmptyState'

interface FriendsWidgetProps {
  maxItems?: number
  className?: string
}

/**
 * Filter friends to only show online friends.
 * Includes friends with status 'online', 'in_game', or 'in_lobby'.
 */
export function filterOnlineFriends(friends: Friend[]): Friend[] {
  return friends.filter((friend) => friend.is_online && friend.show_online_status)
}

export function FriendsWidget({ maxItems = 5, className = '' }: FriendsWidgetProps) {
  const { friends, isLoading, fetchFriends, openPanel } = useFriends()

  useEffect(() => {
    fetchFriends()
  }, [fetchFriends])

  const onlineFriends = filterOnlineFriends(friends)
  const displayedFriends = onlineFriends.slice(0, maxItems)

  // Loading state
  if (isLoading && friends.length === 0) {
    return (
      <div className={`bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl p-5 ${className}`}>
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-4">Friends Online</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-8 h-8 bg-white/[0.1] rounded-full" />
              <div className="flex-1">
                <div className="h-4 w-20 bg-white/[0.1] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Empty state
  if (onlineFriends.length === 0) {
    return (
      <div className={`bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl p-5 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">Friends Online</h3>
          <button onClick={openPanel} className="text-xs text-[var(--color-text-muted)] hover:text-white transition-colors">
            View All
          </button>
        </div>
        <EmptyState
          icon={<EmptyFriendsIcon className="w-10 h-10" />}
          title="No friends online"
          description="Invite friends to play together"
          actionLabel="Add Friends"
          onAction={openPanel}
          className="py-2"
        />
      </div>
    )
  }

  return (
    <div className={`bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">
          Friends Online
          <span className="ml-2 text-xs text-green-400">({onlineFriends.length})</span>
        </h3>
        <button onClick={openPanel} className="text-xs text-neutral-500 hover:text-white transition-colors">
          View All
        </button>
      </div>

      <div className="space-y-2">
        {displayedFriends.map((friend) => (
          <button
            key={friend.friendship_id}
            onClick={openPanel}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.04] transition-colors text-left"
          >
            {/* Avatar with online indicator */}
            <div className="relative flex-shrink-0">
              {friend.avatar_url ? (
                <img src={friend.avatar_url} alt={friend.display_name || 'Friend'} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-600 to-neutral-700 flex items-center justify-center text-white text-xs font-medium">
                  {(friend.display_name || '?').charAt(0).toUpperCase()}
                </div>
              )}
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#111111]" />
            </div>

            {/* Friend info */}
            <div className="flex-1 min-w-0">
              <span className="text-sm text-white truncate block">{friend.display_name || 'Unknown'}</span>
              <span className="text-xs text-green-400">Online</span>
            </div>
          </button>
        ))}
      </div>

      {/* Show more indicator */}
      {onlineFriends.length > maxItems && (
        <button onClick={openPanel} className="w-full mt-3 py-2 text-xs text-neutral-500 hover:text-white transition-colors">
          +{onlineFriends.length - maxItems} more online
        </button>
      )}
    </div>
  )
}
