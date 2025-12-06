/**
 * GameInviteToast - Notification for incoming game invites
 * Enterprise-style design
 */

import { useEffect, useState } from 'react'
import { useFriends } from '@/hooks/useFriends'
import type { GameInvite } from '@/types/friend'

interface GameInviteToastProps {
  invite: GameInvite
  onDismiss: () => void
}

export function GameInviteToast({ invite, onDismiss }: GameInviteToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAccepting, setIsAccepting] = useState(false)
  const [isDeclining, setIsDeclining] = useState(false)
  const [timeLeft, setTimeLeft] = useState(120)
  const { acceptGameInvite, declineGameInvite } = useFriends()

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const expiresAt = new Date(invite.expires_at).getTime()
    
    const updateTimer = () => {
      const now = Date.now()
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000))
      setTimeLeft(remaining)
      
      if (remaining === 0) {
        handleDismiss()
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [invite.expires_at])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(onDismiss, 300)
  }

  const handleAccept = async () => {
    setIsAccepting(true)
    try {
      await acceptGameInvite(invite.id)
      handleDismiss()
    } catch {
      setIsAccepting(false)
    }
  }

  const handleDecline = async () => {
    setIsDeclining(true)
    try {
      await declineGameInvite(invite.id)
      handleDismiss()
    } catch {
      setIsDeclining(false)
    }
  }

  const progressPercent = (timeLeft / 120) * 100

  return (
    <div
      className={`fixed top-4 right-4 z-[100] w-72 transform transition-all duration-300 ease-out ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="relative overflow-hidden bg-[#0a0a0a] border border-white/[0.1] rounded-xl shadow-2xl">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/[0.06]">
          <div
            className="h-full bg-white/30 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-4 pt-5">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center overflow-hidden flex-shrink-0">
              {invite.from_avatar_url ? (
                <img src={invite.from_avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm text-neutral-500 font-medium">
                  {(invite.from_display_name || 'U')[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Game Invite</p>
              <p className="text-sm text-white font-medium truncate">
                {invite.from_display_name || 'A friend'}
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 text-neutral-500 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg">
            <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-neutral-500">
              Expires in <span className="text-white font-mono tabular-nums">{timeLeft}s</span>
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleAccept}
              disabled={isAccepting || isDeclining}
              className="flex-1 px-4 py-2 text-xs font-medium bg-white text-black rounded-lg hover:bg-neutral-200 disabled:opacity-50 transition-colors"
            >
              {isAccepting ? 'Joining...' : 'Join Game'}
            </button>
            <button
              onClick={handleDecline}
              disabled={isAccepting || isDeclining}
              className="px-4 py-2 text-xs font-medium bg-white/[0.06] text-neutral-300 rounded-lg hover:bg-white/[0.1] disabled:opacity-50 transition-colors"
            >
              {isDeclining ? '...' : 'Decline'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
