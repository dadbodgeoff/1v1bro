/**
 * FriendRequests - Manage incoming and outgoing friend requests
 * Enterprise-style design
 */

import { useState } from 'react'
import { useFriends } from '@/hooks/useFriends'
import type { FriendRequest } from '@/types/friend'

interface FriendRequestsProps {
  pendingRequests: FriendRequest[]
  sentRequests: FriendRequest[]
}

export function FriendRequests({ pendingRequests, sentRequests }: FriendRequestsProps) {
  const [activeSection, setActiveSection] = useState<'received' | 'sent'>('received')

  const hasRequests = pendingRequests.length > 0 || sentRequests.length > 0

  if (!hasRequests) {
    return (
      <div className="flex flex-col items-center justify-center h-64 px-6 text-center">
        <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-white mb-1">No pending requests</h3>
        <p className="text-xs text-neutral-500 max-w-[200px]">
          Friend requests will appear here
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 py-4">
      {/* Section toggle */}
      <div className="flex gap-1 p-1 bg-white/[0.02] rounded-lg mb-4">
        <button
          onClick={() => setActiveSection('received')}
          className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
            activeSection === 'received'
              ? 'bg-white/[0.08] text-white'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          Received
          {pendingRequests.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-white/[0.1] rounded-full">
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSection('sent')}
          className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
            activeSection === 'sent'
              ? 'bg-white/[0.08] text-white'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          Sent
          {sentRequests.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-white/[0.06] rounded-full">
              {sentRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Requests list */}
      <div className="space-y-2">
        {activeSection === 'received' ? (
          pendingRequests.length > 0 ? (
            pendingRequests.map((request) => (
              <ReceivedRequestCard key={request.friendship_id} request={request} />
            ))
          ) : (
            <p className="py-8 text-center text-neutral-600 text-xs">No pending requests</p>
          )
        ) : (
          sentRequests.length > 0 ? (
            sentRequests.map((request) => (
              <SentRequestCard key={request.friendship_id} request={request} />
            ))
          ) : (
            <p className="py-8 text-center text-neutral-600 text-xs">No sent requests</p>
          )
        )}
      </div>
    </div>
  )
}

function ReceivedRequestCard({ request }: { request: FriendRequest }) {
  const [isAccepting, setIsAccepting] = useState(false)
  const [isDeclining, setIsDeclining] = useState(false)
  const { acceptRequest, declineRequest } = useFriends()

  const handleAccept = async () => {
    setIsAccepting(true)
    try {
      await acceptRequest(request.friendship_id)
    } catch {
      setIsAccepting(false)
    }
  }

  const handleDecline = async () => {
    setIsDeclining(true)
    try {
      await declineRequest(request.friendship_id)
    } catch {
      setIsDeclining(false)
    }
  }

  const timeAgo = getTimeAgo(request.created_at)

  return (
    <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center overflow-hidden flex-shrink-0">
          {request.avatar_url ? (
            <img src={request.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm text-neutral-500 font-medium">
              {(request.display_name || 'U')[0].toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white truncate">{request.display_name || 'Unknown'}</p>
          <p className="text-[10px] text-neutral-500">{timeAgo}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleAccept}
          disabled={isAccepting || isDeclining}
          className="flex-1 px-3 py-2 text-xs font-medium bg-white text-black rounded-lg hover:bg-neutral-200 disabled:opacity-50 transition-colors"
        >
          {isAccepting ? '...' : 'Accept'}
        </button>
        <button
          onClick={handleDecline}
          disabled={isAccepting || isDeclining}
          className="flex-1 px-3 py-2 text-xs font-medium bg-white/[0.06] text-neutral-300 rounded-lg hover:bg-white/[0.1] disabled:opacity-50 transition-colors"
        >
          {isDeclining ? '...' : 'Decline'}
        </button>
      </div>
    </div>
  )
}

function SentRequestCard({ request }: { request: FriendRequest }) {
  const timeAgo = getTimeAgo(request.created_at)

  return (
    <div className="flex items-center gap-3 p-2.5 bg-white/[0.02] rounded-lg">
      <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center overflow-hidden flex-shrink-0">
        {request.avatar_url ? (
          <img src={request.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs text-neutral-500 font-medium">
            {(request.display_name || 'U')[0].toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{request.display_name || 'Unknown'}</p>
        <p className="text-[10px] text-neutral-500">{timeAgo}</p>
      </div>
      <span className="px-2 py-1 text-[10px] text-neutral-500 bg-white/[0.04] rounded">Pending</span>
    </div>
  )
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return date.toLocaleDateString()
}
