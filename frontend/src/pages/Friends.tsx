/**
 * Friends - Dedicated Friends Page
 * 
 * Full-featured friends management page with friends list,
 * friend requests, and user search functionality.
 * 
 * Features:
 * - DashboardLayout wrapper with activeNav="friends"
 * - Full friends list using existing FriendsList component
 * - Friend requests using existing FriendRequests component
 * - User search using existing UserSearch component
 * - Page header with "Friends" title
 * - Loading and error states
 * 
 * Requirements: 8.5, 8.6
 */

import { useEffect } from 'react'
import { useFriends } from '@/hooks/useFriends'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { FriendsList, FriendRequests, UserSearch, FriendsNotifications } from '@/components/friends'

export function Friends() {
  const { 
    friends, 
    pendingRequests,
    sentRequests,
    isLoading, 
    fetchFriends 
  } = useFriends()

  // Fetch friends data on mount - Requirements 8.6
  useEffect(() => {
    fetchFriends()
  }, [fetchFriends])

  return (
    <DashboardLayout activeNav="friends">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Friends</h1>
          <p className="text-neutral-400 mt-1">
            Manage your friends and find new players to play with
          </p>
        </div>



        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Friends List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Friends List Section */}
            <section className="bg-[#111111] border border-white/[0.06] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  Your Friends
                  {!isLoading && (
                    <span className="ml-2 text-sm font-normal text-neutral-500">
                      ({friends.length})
                    </span>
                  )}
                </h2>
              </div>

              {/* Loading State - Requirements 8.6 */}
              {isLoading && friends.length === 0 ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center gap-3 p-3">
                      <div className="w-10 h-10 bg-white/[0.1] rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 w-24 bg-white/[0.1] rounded mb-1" />
                        <div className="h-3 w-16 bg-white/[0.1] rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : friends.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-white/[0.05] flex items-center justify-center">
                    <FriendsIcon className="w-8 h-8 text-neutral-500" />
                  </div>
                  <p className="text-neutral-400 mb-1">No friends yet</p>
                  <p className="text-sm text-neutral-500">
                    Search for players to add them as friends
                  </p>
                </div>
              ) : (
                <FriendsList friends={friends} />
              )}
            </section>
          </div>

          {/* Right Column - Search & Requests */}
          <div className="space-y-6">
            {/* User Search Section */}
            <section className="bg-[#111111] border border-white/[0.06] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Find Players
              </h2>
              <UserSearch />
            </section>

            {/* Friend Requests Section */}
            <section className="bg-[#111111] border border-white/[0.06] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  Friend Requests
                  {pendingRequests.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-indigo-500/20 text-indigo-400 rounded-full">
                      {pendingRequests.length}
                    </span>
                  )}
                </h2>
              </div>
              <FriendRequests 
                pendingRequests={pendingRequests} 
                sentRequests={sentRequests} 
              />
            </section>
          </div>
        </div>
      </div>

      {/* Friend Notifications */}
      <FriendsNotifications />
    </DashboardLayout>
  )
}

// Icon Component
function FriendsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}

export default Friends
