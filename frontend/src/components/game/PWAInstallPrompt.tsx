/**
 * PWAInstallPrompt - Non-intrusive banner prompting mobile users to install the app
 * Shows a small dismissible banner at the top when:
 * 1. User is on a mobile device
 * 2. App is not already installed (running in browser)
 * 3. User hasn't dismissed the prompt recently
 */

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = '1v1bro_pwa_dismiss'
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

export function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if already installed as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    
    if (isStandalone) return // Already installed

    // Check if mobile
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (!isMobile) return // Desktop doesn't need this

    // Check if dismissed recently
    const dismissedAt = localStorage.getItem(DISMISS_KEY)
    if (dismissedAt && Date.now() - parseInt(dismissedAt) < DISMISS_DURATION) return

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(isIOSDevice)

    // Listen for beforeinstallprompt (Android/Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // For iOS, show prompt after a delay
    if (isIOSDevice) {
      const timer = setTimeout(() => setShowPrompt(true), 3000)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowPrompt(false)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString())
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  // Small dismissible banner at top
  return (
    <div className="fixed top-0 left-0 right-0 z-[200] bg-gradient-to-r from-indigo-600/95 to-indigo-500/95 backdrop-blur-sm px-4 py-2.5 flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300 shadow-lg">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-white">1v1</span>
        </div>
        <p className="text-white text-sm truncate">
          {isIOS ? 'Add to Home Screen for fullscreen' : 'Install for the best experience'}
        </p>
      </div>
      
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Install button (Android only) */}
        {!isIOS && deferredPrompt && (
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 bg-white text-indigo-600 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
          >
            Install
          </button>
        )}
        
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
