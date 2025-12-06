/**
 * FriendsPanel - Slide-out panel for friends management
 * Enterprise-style design
 */

import { useEffect, useRef, useState } from 'react'
import { useFriends } from '@/hooks/useFriends'
import { FriendsList } from './FriendsList'
import { FriendRequests } from './FriendRequests'
import { UserSearch } from './UserSearch'

interface FriendsPanelProps {
  isOpen: boolean
  onClose: () => void
  lobbyCode?: string
}

type Tab = 'friends' | 'requests' | 'search'

export function FriendsPanel({ isOpen, onClose, lobbyCode }: FriendsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<Tab>('friends')
  const {
    friends,
    pendingRequests,
    sentRequests,
    isLoading,
    hasNewRequest,
    fetchFriends,
    clearNewRequest,
  } = useFriends()

  useEffect(() => {
    if (isOpen) {
      fetchFriends()
    }
  }, [isOpen, fetchFriends])

  useEffect(() => {
    if (activeTab === 'requests' && hasNewRequest) {
      clearNewRequest()
    }
  }, [activeTab, hasNewRequest, clearNewRequest])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) && isOpen) {
        onClose()
      }
    }
    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handleClickOutside)
    }, 100)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const onlineCount = friends.filter(f => f.is_online).length

  const tabs: { id: Tab; label: string; count?: number; hasNotification?: boolean }[] = [
    { id: 'friends', label: 'Friends', count: onlineCount },
    { id: 'requests', label: 'Requests', count: pendingRequests.length, hasNotification: hasNewRequest },
    { id: 'search', label: 'Add' },
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed right-0 top-0 h-full w-full max-w-sm z-50 bg-[#0a0a0a] border-l border-white/[0.06] transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Friends</h2>
              <p className="text-xs text-neutral-500">{onlineCount} online</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-neutral-500 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-white/[0.02] rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white/[0.08] text-white'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${
                      activeTab === tab.id ? 'bg-white/[0.15] text-white' : 'bg-white/[0.06] text-neutral-400'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </span>
                {tab.hasNotification && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-400 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto h-[calc(100%-140px)]">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {activeTab === 'friends' && <FriendsList friends={friends} lobbyCode={lobbyCode} />}
              {activeTab === 'requests' && <FriendRequests pendingRequests={pendingRequests} sentRequests={sentRequests} />}
              {activeTab === 'search' && <UserSearch />}
            </>
          )}
        </div>
      </div>
    </>
  )
}
