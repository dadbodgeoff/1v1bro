/**
 * DynamicImage Component - Loads images from dynamic URLs
 * Requirements: 4.2, 4.3
 *
 * Features:
 * - Loading skeleton while image loads
 * - Fallback placeholder on error
 * - Smooth fade-in transition
 * - Automatic background removal for emotes and JPG images
 */

import { useState, useEffect } from 'react'
import { cn } from '@/utils/helpers'
import { dynamicAssets, removeBackground } from '@/game/assets'

interface DynamicImageProps {
  src: string | undefined | null
  alt: string
  className?: string
  fallbackClassName?: string
  showSkeleton?: boolean
  style?: React.CSSProperties
  /** Remove background from image (auto-detected for JPG/emotes) */
  removeBackgroundMode?: 'auto' | 'always' | 'never'
}

/**
 * Check if background should be removed from an image
 */
function shouldRemoveBackground(url: string | undefined | null, mode: 'auto' | 'always' | 'never'): boolean {
  if (mode === 'never') return false
  if (mode === 'always') return true
  
  // Auto mode: remove for JPG/JPEG images (emotes, etc.)
  if (!url) return false
  const lowerUrl = url.toLowerCase()
  return lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg')
}

export function DynamicImage({
  src,
  alt,
  className,
  fallbackClassName,
  showSkeleton = true,
  style,
  removeBackgroundMode = 'auto',
}: DynamicImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!src) {
      setImageSrc(null)
      setIsLoading(false)
      setHasError(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setHasError(false)

    const needsBackgroundRemoval = shouldRemoveBackground(src, removeBackgroundMode)

    dynamicAssets
      .loadImage(src)
      .then((img) => {
        if (!cancelled) {
          if (needsBackgroundRemoval) {
            // Remove background and convert canvas to data URL
            const canvas = removeBackground(img, 'auto')
            setImageSrc(canvas.toDataURL('image/png'))
          } else {
            setImageSrc(img.src)
          }
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHasError(true)
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [src, removeBackgroundMode])

  // Loading skeleton
  if (isLoading && showSkeleton) {
    return (
      <div
        className={cn(
          'animate-pulse bg-[var(--color-bg-elevated)]',
          className
        )}
        style={style}
        aria-label={`Loading ${alt}`}
      />
    )
  }

  // Error fallback
  if (hasError || !imageSrc) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-[var(--color-bg-elevated)]',
          fallbackClassName || className
        )}
        style={style}
        aria-label={alt}
      >
        <svg
          className="w-8 h-8 text-[var(--color-text-muted)]"
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
      </div>
    )
  }

  // Loaded image
  return (
    <img
      src={imageSrc}
      alt={alt}
      className={cn('transition-opacity duration-200', className)}
      style={style}
      loading="lazy"
    />
  )
}
