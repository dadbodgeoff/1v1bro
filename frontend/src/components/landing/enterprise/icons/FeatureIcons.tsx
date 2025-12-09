/**
 * Feature Icons - Custom icons for feature cards
 * 
 * @module landing/enterprise/icons/FeatureIcons
 * Requirements: 13.3
 */

import { IconBase } from './IconBase'
import type { IconSize } from './IconBase'

interface IconProps {
  size?: IconSize
  className?: string
}

/**
 * Arena Icon - Crossed swords for Real-time 2D arena
 */
export function ArenaIcon({ size, className }: IconProps) {
  return (
    <IconBase size={size} className={className} aria-label="Arena">
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
      <path d="M13 19l6-6" />
      <path d="M16 16l4 4" />
      <path d="M19 21l2-2" />
      <path d="M9.5 6.5L21 18v3h-3L6.5 9.5" />
      <path d="M11 5l-6 6" />
      <path d="M8 8L4 4" />
      <path d="M5 3L3 5" />
    </IconBase>
  )
}

/**
 * Trivia Icon - Brain with lightning for Head-to-head trivia
 */
export function TriviaIcon({ size, className }: IconProps) {
  return (
    <IconBase size={size} className={className} aria-label="Trivia">
      <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
      <path d="M10 21h4" />
      <path d="M12 6v4" />
      <path d="M10 10h4" />
    </IconBase>
  )
}

/**
 * PowerUp Icon - Lightning bolt for Power-ups
 */
export function PowerUpIcon({ size, className }: IconProps) {
  return (
    <IconBase size={size} className={className} aria-label="Power-ups">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </IconBase>
  )
}

/**
 * BattlePass Icon - Trophy for Progression & battle pass
 */
export function BattlePassIcon({ size, className }: IconProps) {
  return (
    <IconBase size={size} className={className} aria-label="Battle Pass">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </IconBase>
  )
}

/**
 * Cosmetic Icon - Palette for Cosmetic-only monetization
 */
export function CosmeticIcon({ size, className }: IconProps) {
  return (
    <IconBase size={size} className={className} aria-label="Cosmetics">
      <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
    </IconBase>
  )
}

/**
 * Browser Icon - Browser window for Play anywhere
 */
export function BrowserIcon({ size, className }: IconProps) {
  return (
    <IconBase size={size} className={className} aria-label="Browser">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
      <circle cx="6" cy="6" r="0.5" fill="currentColor" />
      <circle cx="8.5" cy="6" r="0.5" fill="currentColor" />
      <circle cx="11" cy="6" r="0.5" fill="currentColor" />
    </IconBase>
  )
}
