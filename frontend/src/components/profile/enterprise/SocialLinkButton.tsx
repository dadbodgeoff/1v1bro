/**
 * SocialLinkButton - Styled Social Media Link Component
 * 
 * Features:
 * - Platform icon display (Twitter, Twitch, YouTube, Discord)
 * - Platform name or username text
 * - Platform brand color on hover
 * - External link behavior (open in new tab)
 * - Discord copy-to-clipboard with toast notification
 * - External link indicator icon for URLs
 * 
 * Props:
 * - platform: Social platform type
 * - value: URL or username
 * - onCopy: Callback when Discord username is copied
 * - className: Additional CSS classes
 */

import { useState } from 'react'
import { cn } from '@/utils/helpers'

type SocialPlatform = 'twitter' | 'twitch' | 'youtube' | 'discord'

interface SocialLinkButtonProps {
  platform: SocialPlatform
  value: string
  onCopy?: () => void
  className?: string
}

/**
 * Platform configuration with colors and behavior
 */
export const platformConfig: Record<SocialPlatform, {
  color: string
  label: string
  isUrl: boolean
}> = {
  twitter: {
    color: '#1DA1F2',
    label: 'Twitter',
    isUrl: true,
  },
  twitch: {
    color: '#9146FF',
    label: 'Twitch',
    isUrl: true,
  },
  youtube: {
    color: '#FF0000',
    label: 'YouTube',
    isUrl: true,
  },
  discord: {
    color: '#5865F2',
    label: 'Discord',
    isUrl: false, // Copy to clipboard
  },
}

/**
 * Get platform color for styling
 */
export function getPlatformColor(platform: SocialPlatform): string {
  return platformConfig[platform].color
}

export function SocialLinkButton({
  platform,
  value,
  onCopy,
  className,
}: SocialLinkButtonProps) {
  const [copied, setCopied] = useState(false)
  const config = platformConfig[platform]

  const handleClick = async () => {
    if (config.isUrl) {
      // Open URL in new tab
      window.open(value, '_blank', 'noopener,noreferrer')
    } else {
      // Copy to clipboard (Discord)
      try {
        await navigator.clipboard.writeText(value)
        setCopied(true)
        onCopy?.()
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg',
        'bg-[var(--color-bg-card)] border border-white/10',
        'text-[var(--color-text-secondary)] font-medium text-sm',
        'transition-all duration-150',
        'hover:border-white/20',
        className
      )}
      style={{
        ['--hover-color' as string]: config.color,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = config.color
        e.currentTarget.style.borderColor = config.color
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = ''
        e.currentTarget.style.borderColor = ''
      }}
    >
      {/* Platform Icon */}
      <PlatformIcon platform={platform} className="w-5 h-5" />

      {/* Label or Username */}
      <span className="truncate max-w-[120px]">
        {copied ? 'Copied!' : (config.isUrl ? config.label : value)}
      </span>

      {/* External Link Indicator */}
      {config.isUrl && (
        <ExternalLinkIcon className="w-3 h-3 opacity-50" />
      )}
    </button>
  )
}

function PlatformIcon({ platform, className }: { platform: SocialPlatform; className?: string }) {
  switch (platform) {
    case 'twitter':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    case 'twitch':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
        </svg>
      )
    case 'youtube':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      )
    case 'discord':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
        </svg>
      )
  }
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  )
}
