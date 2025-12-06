import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFriendStore } from '@/stores/friendStore'
import { friendsAPI } from '@/services/api'
import { wsService } from '@/services/websocket'
import type {
  FriendRequestPayload,
  FriendAcceptedPayload,
  FriendOnlinePayload,
  FriendOfflinePayload,
  GameInvitePayload,
} from '@/types/friend'

export function useFriends() {
  const navigate = useNavigate()
  const {
    friends,
    pendingRequests,
    sentRequests,
    gameInvites,
    isLoading,
    isPanelOpen,
    activeTab,
    hasNewRequest,
    hasNewInvite,
    setFriends,
    setPendingRequests,
    setSentRequests,
    setGameInvites,
    setLoading,
    setPanelOpen,
    setActiveTab,
    addFriend,
    removeFriend,
    updateFriendOnlineStatus,
    addPendingRequest,
    removePendingRequest,
    removeSentRequest,
    addGameInvite,
    removeGameInvite,
    clearNewRequest,
    clearNewInvite,
  } = useFriendStore()

  // Fetch friends list
  const fetchFriends = useCallback(async () => {
    setLoading(true)
    try {
      const data = await friendsAPI.getFriends()
      setFriends(data.friends)
      setPendingRequests(data.pending_requests)
      setSentRequests(data.sent_requests)
    } catch (error) {
      console.error('Failed to fetch friends:', error)
    } finally {
      setLoading(false)
    }
  }, [setFriends, setPendingRequests, setSentRequests, setLoading])

  // Fetch pending game invites
  const fetchInvites = useCallback(async () => {
    try {
      const data = await friendsAPI.getPendingInvites()
      setGameInvites(data.invites)
    } catch (error) {
      console.error('Failed to fetch invites:', error)
    }
  }, [setGameInvites])

  // Send friend request
  const sendFriendRequest = useCallback(async (userId: string) => {
    try {
      const result = await friendsAPI.sendRequest(userId)
      if (result.status === 'accepted') {
        // Auto-accepted, refresh friends list
        await fetchFriends()
      }
      return result
    } catch (error) {
      throw error
    }
  }, [fetchFriends])

  // Accept friend request
  const acceptRequest = useCallback(async (friendshipId: string) => {
    try {
      await friendsAPI.acceptRequest(friendshipId)
      // Move from pending to friends
      const request = pendingRequests.find((r) => r.friendship_id === friendshipId)
      if (request) {
        removePendingRequest(friendshipId)
        addFriend({
          friendship_id: friendshipId,
          user_id: request.user_id,
          display_name: request.display_name,
          avatar_url: request.avatar_url,
          is_online: false,
          show_online_status: true,
          created_at: new Date().toISOString(),
        })
      }
    } catch (error) {
      throw error
    }
  }, [pendingRequests, removePendingRequest, addFriend])

  // Decline friend request
  const declineRequest = useCallback(async (friendshipId: string) => {
    try {
      await friendsAPI.declineRequest(friendshipId)
      removePendingRequest(friendshipId)
    } catch (error) {
      throw error
    }
  }, [removePendingRequest])

  // Remove friend
  const removeFriendById = useCallback(async (friendshipId: string) => {
    try {
      await friendsAPI.removeFriend(friendshipId)
      removeFriend(friendshipId)
    } catch (error) {
      throw error
    }
  }, [removeFriend])

  // Send game invite
  const sendGameInvite = useCallback(async (friendId: string, lobbyCode: string) => {
    try {
      const result = await friendsAPI.sendGameInvite(friendId, lobbyCode)
      return result
    } catch (error) {
      throw error
    }
  }, [])

  // Accept game invite
  const acceptGameInvite = useCallback(async (inviteId: string) => {
    try {
      const result = await friendsAPI.acceptInvite(inviteId)
      removeGameInvite(inviteId)
      // Navigate to lobby
      navigate(`/lobby/${result.lobby_code}`)
      return result
    } catch (error) {
      throw error
    }
  }, [removeGameInvite, navigate])

  // Decline game invite
  const declineGameInvite = useCallback(async (inviteId: string) => {
    try {
      await friendsAPI.declineInvite(inviteId)
      removeGameInvite(inviteId)
    } catch (error) {
      throw error
    }
  }, [removeGameInvite])

  // Search users
  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 2) return { users: [], total: 0 }
    try {
      return await friendsAPI.searchUsers(query)
    } catch (error) {
      console.error('Search failed:', error)
      return { users: [], total: 0 }
    }
  }, [])

  // Block user
  const blockUser = useCallback(async (userId: string) => {
    try {
      await friendsAPI.blockUser(userId)
      // Remove from friends if they were a friend
      const friend = friends.find((f) => f.user_id === userId)
      if (friend) {
        removeFriend(friend.friendship_id)
      }
    } catch (error) {
      throw error
    }
  }, [friends, removeFriend])

  // WebSocket event handlers
  useEffect(() => {
    const handleFriendRequest = (payload: unknown) => {
      const data = payload as FriendRequestPayload
      addPendingRequest({
        friendship_id: data.friendship_id,
        user_id: data.from_user_id,
        display_name: data.display_name,
        avatar_url: data.avatar_url,
        created_at: new Date().toISOString(),
      })
    }

    const handleFriendAccepted = (payload: unknown) => {
      const data = payload as FriendAcceptedPayload
      // Find and remove from sent requests, add to friends
      const sentRequest = sentRequests.find((r) => r.user_id === data.user_id)
      if (sentRequest) {
        removeSentRequest(sentRequest.friendship_id)
        addFriend({
          friendship_id: sentRequest.friendship_id,
          user_id: data.user_id,
          display_name: data.display_name,
          avatar_url: sentRequest.avatar_url,
          is_online: true, // They just accepted, so they're online
          show_online_status: true,
          created_at: new Date().toISOString(),
        })
      }
    }

    const handleFriendOnline = (payload: unknown) => {
      const data = payload as FriendOnlinePayload
      updateFriendOnlineStatus(data.user_id, true)
    }

    const handleFriendOffline = (payload: unknown) => {
      const data = payload as FriendOfflinePayload
      updateFriendOnlineStatus(data.user_id, false)
    }

    const handleGameInvite = (payload: unknown) => {
      const data = payload as GameInvitePayload
      addGameInvite({
        id: data.invite_id,
        from_user_id: data.from_user_id,
        from_display_name: data.from_display_name,
        from_avatar_url: null,
        lobby_code: data.lobby_code,
        status: 'pending',
        expires_at: new Date(Date.now() + 120000).toISOString(), // 2 min from now
        created_at: new Date().toISOString(),
      })
    }

    // Subscribe to events
    const unsubRequest = wsService.on('friend_request', handleFriendRequest)
    const unsubAccepted = wsService.on('friend_accepted', handleFriendAccepted)
    const unsubOnline = wsService.on('friend_online', handleFriendOnline)
    const unsubOffline = wsService.on('friend_offline', handleFriendOffline)
    const unsubInvite = wsService.on('game_invite', handleGameInvite)

    return () => {
      unsubRequest()
      unsubAccepted()
      unsubOnline()
      unsubOffline()
      unsubInvite()
    }
  }, [
    sentRequests,
    addPendingRequest,
    removeSentRequest,
    addFriend,
    updateFriendOnlineStatus,
    addGameInvite,
  ])

  return {
    // State
    friends,
    pendingRequests,
    sentRequests,
    gameInvites,
    isLoading,
    isPanelOpen,
    activeTab,
    hasNewRequest,
    hasNewInvite,

    // Actions
    fetchFriends,
    fetchInvites,
    sendFriendRequest,
    acceptRequest,
    declineRequest,
    removeFriend: removeFriendById,
    sendGameInvite,
    acceptGameInvite,
    declineGameInvite,
    searchUsers,
    blockUser,

    // UI actions
    openPanel: () => setPanelOpen(true),
    closePanel: () => setPanelOpen(false),
    setActiveTab,
    clearNewRequest,
    clearNewInvite,
  }
}
