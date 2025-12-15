/**
 * useSectionViewTracking - Track when sections come into view
 * 
 * Uses IntersectionObserver to track when landing page sections
 * become visible to the user for analytics purposes.
 * 
 * Usage:
 *   const ref = useSectionViewTracking('features')
 *   return <section ref={ref}>...</section>
 */

import { useEffect, useRef, useCallback } from 'react'
import { analytics } from '@/services/analytics'

export function useSectionViewTracking(sectionName: string, threshold = 0.3) {
  const ref = useRef<HTMLElement>(null)
  const hasTracked = useRef(false)

  useEffect(() => {
    const element = ref.current
    if (!element || hasTracked.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTracked.current) {
            hasTracked.current = true
            analytics.trackEvent('section_view', { section: sectionName })
            observer.disconnect()
          }
        })
      },
      { threshold }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [sectionName, threshold])

  return ref
}

/**
 * Track video play/complete events
 */
export function useVideoTracking(videoId: string) {
  const hasTrackedPlay = useRef(false)
  const hasTrackedComplete = useRef(false)

  const trackPlay = useCallback(() => {
    if (!hasTrackedPlay.current) {
      hasTrackedPlay.current = true
      analytics.trackEvent('video_play', { video_id: videoId })
    }
  }, [videoId])

  const trackComplete = useCallback(() => {
    if (!hasTrackedComplete.current) {
      hasTrackedComplete.current = true
      analytics.trackEvent('video_complete', { video_id: videoId })
    }
  }, [videoId])

  const trackProgress = useCallback((percent: number) => {
    // Track at 25%, 50%, 75% milestones
    if (percent >= 25 && percent < 50) {
      analytics.trackEvent('video_progress', { video_id: videoId, percent: 25 })
    } else if (percent >= 50 && percent < 75) {
      analytics.trackEvent('video_progress', { video_id: videoId, percent: 50 })
    } else if (percent >= 75 && percent < 100) {
      analytics.trackEvent('video_progress', { video_id: videoId, percent: 75 })
    }
  }, [videoId])

  return { trackPlay, trackComplete, trackProgress }
}

/**
 * Track social link clicks
 */
export function trackSocialClick(platform: string, url: string) {
  analytics.trackEvent('social_link_click', { platform, url })
}

/**
 * Track CTA button clicks
 */
export function trackCTAClick(ctaId: string, location: string) {
  analytics.trackEvent('cta_click', { cta_id: ctaId, location })
}
