/**
 * OptimizedImage - Enterprise-grade image loading component
 * 
 * Features:
 * - Loading skeleton with shimmer animation
 * - Error fallback with retry capability
 * - Lazy loading with Intersection Observer
 * - In-memory caching to prevent re-fetches
 * - Blur-up placeholder effect
 * - Timeout handling for slow connections
 */

import { useState, useEffect, useRef, useCallback, memo } from 'react'

// Global image cache to persist across component instances
const imageCache = new Map<string, { loaded: boolean; error: boolean }>()

export interface OptimizedImageProps {
  /** Image source URL */
  src: string | undefined | null
  /** Alt text for accessibility */
  alt: string
  /** CSS class for the image */
  className?: string
  /** Width in pixels */
  width?: number
  /** Height in pixels */
  height?: number
  /** Custom fallback element when image fails to load */
  fallback?: React.ReactNode
  /** Callback when image loads successfully */
  onLoad?: () => void
  /** Callback when image fails to load */
  onError?: () => void
  /** Enable lazy loading (default: true) */
  lazy?: boolean
  /** Loading timeout in ms (default: 15000) */
  timeout?: number
  /** Priority loading - skip lazy loading */
  priority?: boolean
  /** Object fit style */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none'
  /** Show loading skeleton (default: true) */
  showSkeleton?: boolean
  /** Skeleton background color */
  skeletonColor?: string
}

type LoadState = 'idle' | 'loading' | 'loaded' | 'error'

/**
 * Preload an image URL into the cache
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (imageCache.get(url)?.loaded) {
      resolve()
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      imageCache.set(url, { loaded: true, error: false })
      resolve()
    }
    
    img.onerror = () => {
      imageCache.set(url, { loaded: false, error: true })
      reject(new Error(`Failed to preload: ${url}`))
    }
    
    img.src = url
  })
}

/**
 * Preload multiple images with concurrency control
 */
export async function preloadImages(urls: string[], concurrency = 3): Promise<void> {
  const chunks: string[][] = []
  for (let i = 0; i < urls.length; i += concurrency) {
    chunks.push(urls.slice(i, i + concurrency))
  }
  
  for (const chunk of chunks) {
    await Promise.allSettled(chunk.map(preloadImage))
  }
}

/**
 * Loading skeleton with shimmer effect
 */
function LoadingSkeleton({ 
  width, 
  height, 
  color = '#374151',
  className = '',
}: { 
  width?: number
  height?: number
  color?: string
  className?: string
}) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : '100%',
        backgroundColor: color,
      }}
      data-testid="image-skeleton"
    >
      {/* Shimmer effect */}
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite]"
        style={{
          background: `linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.08),
            transparent
          )`,
        }}
      />
    </div>
  )
}

/**
 * Error fallback component
 */
function ErrorFallback({
  width,
  height,
  onRetry,
  className = '',
}: {
  width?: number
  height?: number
  onRetry?: () => void
  className?: string
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center bg-neutral-800/50 ${className}`}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : '100%',
      }}
      data-testid="image-error"
    >
      <svg
        className="w-8 h-8 text-neutral-500 mb-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-neutral-400 hover:text-white transition-colors"
        >
          Tap to retry
        </button>
      )}
    </div>
  )
}

/**
 * OptimizedImage component with loading states and caching
 */
export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  fallback,
  onLoad,
  onError,
  lazy = true,
  timeout = 15000,
  priority = false,
  objectFit = 'cover',
  showSkeleton = true,
  skeletonColor = '#374151',
}: OptimizedImageProps) {
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [isVisible, setIsVisible] = useState(!lazy || priority)
  const [retryCount, setRetryCount] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  // Check cache on mount
  useEffect(() => {
    if (!src) {
      setLoadState('error')
      return
    }

    const cached = imageCache.get(src)
    if (cached?.loaded) {
      setLoadState('loaded')
    } else if (cached?.error) {
      setLoadState('error')
    }
  }, [src])

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || !containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '100px', // Start loading 100px before visible
        threshold: 0,
      }
    )

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [lazy, priority])

  // Handle image loading
  const handleLoad = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    if (src) {
      imageCache.set(src, { loaded: true, error: false })
    }
    
    setLoadState('loaded')
    onLoad?.()
  }, [src, onLoad])

  const handleError = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    if (src) {
      imageCache.set(src, { loaded: false, error: true })
    }
    
    setLoadState('error')
    onError?.()
  }, [src, onError])

  // Start loading when visible
  useEffect(() => {
    if (!isVisible || !src || loadState === 'loaded') return

    // Check cache again
    const cached = imageCache.get(src)
    if (cached?.loaded) {
      setLoadState('loaded')
      return
    }

    setLoadState('loading')

    // Set timeout for slow connections
    timeoutRef.current = setTimeout(() => {
      if (loadState === 'loading') {
        console.warn(`[OptimizedImage] Timeout loading: ${src}`)
        handleError()
      }
    }, timeout)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isVisible, src, loadState, timeout, handleError])

  // Retry handler
  const handleRetry = useCallback(() => {
    if (!src) return
    
    // Clear cache entry
    imageCache.delete(src)
    setRetryCount((c) => c + 1)
    setLoadState('idle')
    
    // Force re-render by toggling visibility
    setIsVisible(false)
    window.requestAnimationFrame(() => setIsVisible(true))
  }, [src])

  // No source provided
  if (!src) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <ErrorFallback width={width} height={height} className={className} />
    )
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : '100%',
      }}
      data-testid="optimized-image-container"
    >
      {/* Loading skeleton */}
      {showSkeleton && loadState === 'loading' && (
        <LoadingSkeleton
          width={width}
          height={height}
          color={skeletonColor}
          className="absolute inset-0"
        />
      )}

      {/* Error state */}
      {loadState === 'error' && (
        fallback || (
          <ErrorFallback
            width={width}
            height={height}
            onRetry={retryCount < 3 ? handleRetry : undefined}
            className="absolute inset-0"
          />
        )
      )}

      {/* Actual image */}
      {isVisible && loadState !== 'error' && (
        <img
          ref={imgRef}
          key={`${src}-${retryCount}`}
          src={src}
          alt={alt}
          crossOrigin="anonymous"
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full transition-opacity duration-300 ${
            loadState === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ objectFit }}
          loading={lazy && !priority ? 'lazy' : 'eager'}
          data-testid="optimized-image"
        />
      )}
    </div>
  )
})

export default OptimizedImage
