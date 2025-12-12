/**
 * FriendsWidget - Enterprise Friends Widget
 * 
 * Online friends list with proper navigation for the dashboard.
 * 
 * Features:
 * - Widget header with "Friends Online" title and count badge
 * - "View All" link that navigates to /friends page (NOT open panel)
 * - List of online friends (max 5)
 * - Friend avatar (32px, rounded), name, online status indicator
 * - Filter to show only online friends (is_online && show_online_status)
 * - Empty state with "Add Friends" CTA
 * 
 * Props:
 * @param maxItems - Maximum friends to display (default: 5)
 * @param className - Additional CSS classes
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import { useEffect, useState, memo, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFriends } from '@/hooks/useFriends'
import type { Friend } from '@/types/friend'
import { DashboardSection } from './DashboardSection'

export interface FriendsWidgetProps {
  maxItems?: number
  className?: string
}

/**
 * Filter friends to only show online friends.
 * Includes friends where is_online is true and show_online_status is not false.
 * @param friends - Full friends list
 * @returns Filtered list of online friends
 */
export function filterOnlineFriends(friends: Friend[]): Friend[] {
  return friends.filter((friend) => 
    friend.is_online === true && 
    friend.show_online_status !== false
  )
}

export function FriendsWidget({ maxItems = 5, className }: FriendsWidgetProps) {
  const navigate = useNavigate()
  const { friends, isLoading, fetchFriends } = useFriends()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadFriends = async () => {
      try {
        setError(null)
        await fetchFriends()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load friends')
      }
    }
    loadFriends()
  }, [fetchFriends])

  // Memoize filtered friends list (Requirements 6.3)
  const onlineFriends = useMemo(() => filterOnlineFriends(friends), [friends])
  const displayedFriends = onlineFriends.slice(0, maxItems)
  const onlineCount = onlineFriends.length

  // Navigate to /friends page - Requirements 8.3
  const handleViewAll = () => {
    navigate('/friends')
  }

  const handleAddFriends = () => {
    navigate('/friends')
  }

  const handleRetry = async () => {
    try {
      setError(null)
      await fetchFriends()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load friends')
    }
  }

  // Loading state
  if (isLoading && friends.length === 0 && !error) {
    return (
      <DashboardSection
        title="Friends Online"
        actionLabel="View All"
        onAction={handleViewAll}
        className={className}
      >
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 p-2">
              <div className="w-8 h-8 bg-white/[0.1] rounded-full" />
              <div className="flex-1">
                <div className="h-4 w-20 bg-white/[0.1] rounded" />
              </div>
            </div>
          ))}
        </div>
      </DashboardSection>
    )
  }

  // Error state
  if (error) {
    return (
      <DashboardSection
        title="Friends Online"
        actionLabel="View All"
        onAction={handleViewAll}
        className={className}
      >
        <div className="text-center py-4">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-red-500/10 flex items-center justify-center">
            <ErrorIcon className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-sm text-red-400 mb-1">Failed to load friends</p>
          <p className="text-xs text-neutral-500 mb-3">{error}</p>
          <button 
            onClick={handleRetry} 
            className="px-4 py-2 bg-white/[0.06] text-neutral-300 text-xs font-medium rounded-lg hover:bg-white/[0.1] transition-colors"
          >
            Try Again
          </button>
        </div>
      </DashboardSection>
    )
  }

  // Empty state - Requirements 8.4
  if (onlineFriends.length === 0) {
    return (
      <DashboardSection
        title="Friends Online"
        badge={0}
        badgeVariant="count"
        actionLabel="View All"
        onAction={handleViewAll}
        className={className}
      >
        <div className="text-center py-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/[0.05] flex items-center justify-center">
            <FriendsIcon className="w-6 h-6 text-neutral-500" />
          </div>
          <p className="text-sm text-neutral-400 mb-1">No friends online</p>
          <p className="text-xs text-neutral-500 mb-3">Invite friends to play together</p>
          <button
            onClick={handleAddFriends}
            className="px-4 py-2 bg-indigo-500/20 text-indigo-400 text-xs font-medium rounded-lg hover:bg-indigo-500/30 transition-colors"
          >
            Add Friends
          </button>
        </div>
      </DashboardSection>
    )
  }

  return (
    <DashboardSection
      title="Friends Online"
      badge={onlineCount}
      badgeVariant="count"
      actionLabel="View All"
      onAction={handleViewAll}
      className={className}
    >
      {/* Friends list - Requirements 8.1, 8.2 */}
      <div className="space-y-1">
        {displayedFriends.map((friend) => (
          <FriendItem key={friend.friendship_id} friend={friend} />
        ))}
      </div>

      {/* Show more indicator */}
      {onlineFriends.length > maxItems && (
        <button 
          onClick={handleViewAll} 
          className="w-full mt-3 py-2 text-xs text-neutral-500 hover:text-white transition-colors"
        >
          +{onlineFriends.length - maxItems} more online
        </button>
      )}
    </DashboardSection>
  )
}

// Friend Item Component - Memoized for performance (Requirements 6.3)
interface FriendItemProps {
  friend: Friend
}

const FriendItem = memo(function FriendItem({ friend }: FriendItemProps) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg">
      {/* Avatar with online indicator - 32px, rounded - Requirements 8.2 */}
      <div className="relative flex-shrink-0">
        {friend.avatar_url ? (
          <img 
            src={friend.avatar_url} 
            alt={friend.display_name || 'Friend'} 
            className="w-8 h-8 rounded-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-600 to-neutral-700 flex items-center justify-center text-white text-xs font-medium">
            {(friend.display_name || '?').charAt(0).toUpperCase()}
          </div>
        )}
        {/* Online status indicator - green dot - Requirements 8.2 */}
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#111111]" />
      </div>

      {/* Friend info */}
      <div className="flex-1 min-w-0">
        {/* Display name - sm font - Requirements 8.2 */}
        <span className="text-sm text-white truncate block">
          {friend.display_name || 'Unknown'}
        </span>
        <span className="text-xs text-emerald-400">Online</span>
      </div>
    </div>
  )
})

// Icon Components
function FriendsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}
