/**
 * FriendsList - Display friends with online/offline sections
 * Enterprise-style design
 */

import { useState } from 'react'
import { useFriends } from '@/hooks/useFriends'
import { useMessages } from '@/hooks/useMessages'
import { ChatWindow } from '@/components/messages'
import type { Friend } from '@/types/friend'

interface FriendsListProps {
  friends: Friend[]
  lobbyCode?: string
}

export function FriendsList({ friends, lobbyCode }: FriendsListProps) {
  const [chatFriend, setChatFriend] = useState<Friend | null>(null)
  const { openChat } = useMessages()

  const handleOpenChat = (friend: Friend) => {
    setChatFriend(friend)
    openChat(friend.user_id)
  }
  const onlineFriends = friends.filter(f => f.is_online)
  const offlineFriends = friends.filter(f => !f.is_online)

  if (friends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 px-6 text-center">
        <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-white mb-1">No friends yet</h3>
        <p className="text-xs text-neutral-500 max-w-[200px]">
          Search for players to add them as friends
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Online */}
      {onlineFriends.length > 0 && (
        <div>
          <div className="flex items-center gap-2 px-2 mb-2">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
              Online — {onlineFriends.length}
            </span>
          </div>
          <div className="space-y-0.5">
            {onlineFriends.map((friend) => (
              <FriendCard key={friend.friendship_id} friend={friend} lobbyCode={lobbyCode} onMessage={() => handleOpenChat(friend)} />
            ))}
          </div>
        </div>
      )}

      {/* Offline */}
      {offlineFriends.length > 0 && (
        <div>
          <div className="flex items-center gap-2 px-2 mb-2">
            <div className="w-1.5 h-1.5 bg-neutral-600 rounded-full" />
            <span className="text-[10px] font-medium text-neutral-600 uppercase tracking-wider">
              Offline — {offlineFriends.length}
            </span>
          </div>
          <div className="space-y-0.5">
            {offlineFriends.map((friend) => (
              <FriendCard key={friend.friendship_id} friend={friend} lobbyCode={lobbyCode} isOffline onMessage={() => handleOpenChat(friend)} />
            ))}
          </div>
        </div>
      )}

      {/* Chat Window */}
      {chatFriend && (
        <ChatWindow
          friendId={chatFriend.user_id}
          friendName={chatFriend.display_name}
          friendAvatar={chatFriend.avatar_url}
          isOnline={chatFriend.is_online}
          onClose={() => setChatFriend(null)}
        />
      )}
    </div>
  )
}

interface FriendCardProps {
  friend: Friend
  lobbyCode?: string
  isOffline?: boolean
  onMessage: () => void
}

function FriendCard({ friend, lobbyCode, isOffline, onMessage }: FriendCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [inviteState, setInviteState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const { sendGameInvite, removeFriend } = useFriends()

  const handleInvite = async () => {
    if (!lobbyCode || inviteState !== 'idle') return
    setInviteState('sending')
    try {
      await sendGameInvite(friend.user_id, lobbyCode)
      setInviteState('sent')
      setTimeout(() => setInviteState('idle'), 5000)
    } catch {
      setInviteState('idle')
    }
  }

  const handleRemove = async () => {
    try {
      await removeFriend(friend.friendship_id)
    } catch {
      // ignore
    }
    setShowMenu(false)
  }

  return (
    <div className={`group relative flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors ${
      isOffline ? 'opacity-50' : ''
    }`}>
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center overflow-hidden">
          {friend.avatar_url ? (
            <img src={friend.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs text-neutral-500 font-medium">
              {(friend.display_name || 'U')[0].toUpperCase()}
            </span>
          )}
        </div>
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0a0a0a] ${
          friend.is_online ? 'bg-emerald-400' : 'bg-neutral-600'
        }`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{friend.display_name || 'Unknown'}</p>
        <p className="text-[10px] text-neutral-500">{friend.is_online ? 'Online' : 'Offline'}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Message button */}
        <button
          onClick={onMessage}
          className="p-1.5 text-neutral-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-colors"
          title="Send message"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>

        {lobbyCode && friend.is_online && (
          <button
            onClick={handleInvite}
            disabled={inviteState !== 'idle'}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
              inviteState === 'sent'
                ? 'bg-emerald-500/20 text-emerald-400'
                : inviteState === 'sending'
                ? 'bg-white/[0.06] text-neutral-400'
                : 'bg-white text-black hover:bg-neutral-200'
            }`}
          >
            {inviteState === 'sent' ? '✓' : inviteState === 'sending' ? '...' : 'Invite'}
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-neutral-500 hover:text-white hover:bg-white/[0.06] rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="6" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="18" r="1.5" />
            </svg>
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 w-36 py-1 bg-[#141414] border border-white/[0.08] rounded-lg shadow-xl">
                <button
                  onClick={handleRemove}
                  className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Remove Friend
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
