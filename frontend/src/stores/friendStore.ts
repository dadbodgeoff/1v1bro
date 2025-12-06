import { create } from 'zustand'
import type { Friend, FriendRequest, GameInvite } from '@/types/friend'

interface FriendState {
  // Data
  friends: Friend[]
  pendingRequests: FriendRequest[]
  sentRequests: FriendRequest[]
  gameInvites: GameInvite[]
  
  // UI state
  isLoading: boolean
  isPanelOpen: boolean
  activeTab: 'friends' | 'requests' | 'search'
  
  // Notifications
  hasNewRequest: boolean
  hasNewInvite: boolean

  // Actions
  setFriends: (friends: Friend[]) => void
  setPendingRequests: (requests: FriendRequest[]) => void
  setSentRequests: (requests: FriendRequest[]) => void
  setGameInvites: (invites: GameInvite[]) => void
  setLoading: (loading: boolean) => void
  setPanelOpen: (open: boolean) => void
  setActiveTab: (tab: 'friends' | 'requests' | 'search') => void
  
  // Friend updates
  addFriend: (friend: Friend) => void
  removeFriend: (friendshipId: string) => void
  updateFriendOnlineStatus: (userId: string, isOnline: boolean) => void
  
  // Request updates
  addPendingRequest: (request: FriendRequest) => void
  removePendingRequest: (friendshipId: string) => void
  removeSentRequest: (friendshipId: string) => void
  
  // Invite updates
  addGameInvite: (invite: GameInvite) => void
  removeGameInvite: (inviteId: string) => void
  
  // Notifications
  clearNewRequest: () => void
  clearNewInvite: () => void
  
  // Reset
  reset: () => void
}

const initialState = {
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  gameInvites: [],
  isLoading: false,
  isPanelOpen: false,
  activeTab: 'friends' as const,
  hasNewRequest: false,
  hasNewInvite: false,
}

export const useFriendStore = create<FriendState>((set) => ({
  ...initialState,

  setFriends: (friends) => set({ friends }),
  setPendingRequests: (requests) => set({ pendingRequests: requests }),
  setSentRequests: (requests) => set({ sentRequests: requests }),
  setGameInvites: (invites) => set({ gameInvites: invites }),
  setLoading: (isLoading) => set({ isLoading }),
  setPanelOpen: (isPanelOpen) => set({ isPanelOpen }),
  setActiveTab: (activeTab) => set({ activeTab }),

  addFriend: (friend) =>
    set((state) => ({
      friends: [...state.friends, friend],
    })),

  removeFriend: (friendshipId) =>
    set((state) => ({
      friends: state.friends.filter((f) => f.friendship_id !== friendshipId),
    })),

  updateFriendOnlineStatus: (userId, isOnline) =>
    set((state) => ({
      friends: state.friends.map((f) =>
        f.user_id === userId ? { ...f, is_online: isOnline } : f
      ),
    })),

  addPendingRequest: (request) =>
    set((state) => ({
      pendingRequests: [request, ...state.pendingRequests],
      hasNewRequest: true,
    })),

  removePendingRequest: (friendshipId) =>
    set((state) => ({
      pendingRequests: state.pendingRequests.filter(
        (r) => r.friendship_id !== friendshipId
      ),
    })),

  removeSentRequest: (friendshipId) =>
    set((state) => ({
      sentRequests: state.sentRequests.filter(
        (r) => r.friendship_id !== friendshipId
      ),
    })),

  addGameInvite: (invite) =>
    set((state) => ({
      gameInvites: [invite, ...state.gameInvites],
      hasNewInvite: true,
    })),

  removeGameInvite: (inviteId) =>
    set((state) => ({
      gameInvites: state.gameInvites.filter((i) => i.id !== inviteId),
    })),

  clearNewRequest: () => set({ hasNewRequest: false }),
  clearNewInvite: () => set({ hasNewInvite: false }),

  reset: () => set(initialState),
}))
