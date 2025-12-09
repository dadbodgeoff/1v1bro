/**
 * PWAInstallPrompt - Prompts mobile users to install the app for true fullscreen
 * Shows a dismissible banner when:
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

    // Detect iOS (needs different install instructions)
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(isIOSDevice)

    // Listen for beforeinstallprompt (Android/Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // For iOS, show prompt after a delay (no beforeinstallprompt event)
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

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 shadow-lg animate-in slide-in-from-top duration-300">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            {/* Smartphone icon */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="5" y="2" width="14" height="20" rx="2" strokeWidth="2"/>
              <path d="M12 18h.01" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="text-sm">
            <p className="font-semibold">Play in True Fullscreen!</p>
            <p className="text-white/80 text-xs">
              {isIOS 
                ? 'Tap Share → Add to Home Screen'
                : 'Install app for the best experience'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isIOS && deferredPrompt && (
            <button
              onClick={handleInstall}
              className="flex items-center gap-1 px-3 py-1.5 bg-white text-indigo-600 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
            >
              {/* Download icon */}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Install
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Dismiss"
          >
            {/* X icon */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
