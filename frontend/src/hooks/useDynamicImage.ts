/**
 * Hook for loading dynamic cosmetic images
 * Requirements: 4.1, 4.2, 4.3
 *
 * Provides:
 * - Loading state
 * - Error handling with fallback
 * - Automatic caching via DynamicAssetLoader
 */

import { useState, useEffect } from 'react'
import { dynamicAssets } from '@/game/assets'

interface UseDynamicImageResult {
  src: string | null
  isLoading: boolean
  error: string | null
}

/**
 * Load a dynamic image from URL with loading state and fallback
 */
export function useDynamicImage(url: string | undefined | null): UseDynamicImageResult {
  const [src, setSrc] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!url) {
      setSrc(null)
      setIsLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    dynamicAssets
      .loadImage(url)
      .then((img) => {
        if (!cancelled) {
          setSrc(img.src)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load image')
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [url])

  return { src, isLoading, error }
}

/**
 * Preload multiple images
 */
export function usePreloadImages(urls: string[]): { isLoading: boolean; progress: number } {
  const [loaded, setLoaded] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (urls.length === 0) return

    setIsLoading(true)
    setLoaded(0)

    let count = 0
    const loadPromises = urls.map((url) =>
      dynamicAssets.loadImage(url).finally(() => {
        count++
        setLoaded(count)
      })
    )

    Promise.all(loadPromises).finally(() => {
      setIsLoading(false)
    })
  }, [urls.join(',')])

  return {
    isLoading,
    progress: urls.length > 0 ? loaded / urls.length : 1,
  }
}
