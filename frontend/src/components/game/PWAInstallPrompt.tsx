/**
 * PWAInstallPrompt - Prompts mobile users to install the app for true fullscreen
 * Shows a FULL SCREEN modal (not just banner) when:
 * 1. User is on a mobile device
 * 2. App is not already installed (running in browser)
 * 3. User hasn't dismissed the prompt recently
 * 
 * This is aggressive because browser fullscreen doesn't work well on mobile
 */

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = '1v1bro_pwa_dismiss'
const DISMISS_DURATION = 24 * 60 * 60 * 1000 // 24 hours (more aggressive)

export function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isSafari, setIsSafari] = useState(false)

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

    // Detect iOS and Safari
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    setIsIOS(isIOSDevice)
    setIsSafari(isSafariBrowser)

    // Listen for beforeinstallprompt (Android/Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // For iOS/Safari, show prompt immediately (no beforeinstallprompt event)
    if (isIOSDevice || isSafariBrowser) {
      const timer = setTimeout(() => setShowPrompt(true), 1500)
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

  // Full screen modal for better conversion
  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
      {/* App icon / branding */}
      <div className="w-20 h-20 mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
        <span className="text-3xl font-bold text-white">1v1</span>
      </div>
      
      <h2 className="text-2xl font-bold text-white mb-2 text-center">
        Get the Full Experience
      </h2>
      
      <p className="text-neutral-400 text-center mb-8 max-w-xs">
        {isIOS || isSafari
          ? "Add to your home screen for true fullscreen gameplay with no browser bars"
          : "Install the app for true fullscreen and faster load times"}
      </p>

      {/* iOS/Safari specific instructions */}
      {(isIOS || isSafari) && (
        <div className="bg-white/10 rounded-xl p-4 mb-6 w-full max-w-xs">
          <p className="text-white text-sm font-medium mb-3">How to install:</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                {/* Share icon */}
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                </svg>
              </div>
              <p className="text-white/80 text-sm">Tap the <span className="text-white font-medium">Share</span> button below</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                {/* Plus icon */}
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                </svg>
              </div>
              <p className="text-white/80 text-sm">Select <span className="text-white font-medium">Add to Home Screen</span></p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                {/* Check icon */}
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <p className="text-white/80 text-sm">Open from home screen to play!</p>
            </div>
          </div>
        </div>
      )}

      {/* Android/Chrome install button */}
      {!isIOS && !isSafari && deferredPrompt && (
        <button
          onClick={handleInstall}
          className="w-full max-w-xs flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-lg font-semibold hover:from-indigo-400 hover:to-purple-500 transition-all shadow-lg shadow-purple-500/30 mb-4"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Install App
        </button>
      )}

      {/* Skip button */}
      <button
        onClick={handleDismiss}
        className="text-neutral-500 hover:text-neutral-300 text-sm transition-colors py-2"
      >
        Continue in browser (limited experience)
      </button>
    </div>
  )
}
