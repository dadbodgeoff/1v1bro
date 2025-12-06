import { useEffect, useState } from 'react'
import { useFriends } from '@/hooks/useFriends'
import { useFriendStore } from '@/stores/friendStore'
import { GameInviteToast } from './GameInviteToast'
import type { GameInvite } from '@/types/friend'

/**
 * Container component that manages and displays friend-related notifications.
 * Should be placed at the app root level.
 */
export function FriendsNotifications() {
  const { gameInvites, fetchInvites } = useFriends()
  const removeGameInvite = useFriendStore((state) => state.removeGameInvite)
  const [displayedInvites, setDisplayedInvites] = useState<GameInvite[]>([])

  // Fetch invites on mount
  useEffect(() => {
    fetchInvites()
  }, [fetchInvites])

  // Show new invites as toasts
  useEffect(() => {
    // Find new invites that aren't already displayed
    const newInvites = gameInvites.filter(
      invite => !displayedInvites.find(d => d.id === invite.id)
    )
    
    if (newInvites.length > 0) {
      setDisplayedInvites(prev => [...prev, ...newInvites])
    }
  }, [gameInvites, displayedInvites])

  const handleDismiss = (inviteId: string) => {
    setDisplayedInvites(prev => prev.filter(i => i.id !== inviteId))
    removeGameInvite(inviteId)
  }

  // Only show the most recent invite to avoid stacking
  const activeInvite = displayedInvites[displayedInvites.length - 1]

  if (!activeInvite) return null

  return (
    <GameInviteToast
      key={activeInvite.id}
      invite={activeInvite}
      onDismiss={() => handleDismiss(activeInvite.id)}
    />
  )
}
