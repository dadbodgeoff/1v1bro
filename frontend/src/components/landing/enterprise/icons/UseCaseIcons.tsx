/**
 * Use Case Icons - Custom icons for use case cards
 * 
 * @module landing/enterprise/icons/UseCaseIcons
 * Requirements: 13.3
 */

import { IconBase } from './IconBase'
import type { IconSize } from './IconBase'

interface IconProps {
  size?: IconSize
  className?: string
}

/**
 * Friends Icon - People for Friends hanging out
 */
export function FriendsIcon({ size, className }: IconProps) {
  return (
    <IconBase size={size} className={className} aria-label="Friends">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </IconBase>
  )
}

/**
 * Community Icon - Server/group for Communities & servers
 */
export function CommunityIcon({ size, className }: IconProps) {
  return (
    <IconBase size={size} className={className} aria-label="Community">
      <path d="M18 21a8 8 0 0 0-16 0" />
      <circle cx="10" cy="8" r="5" />
      <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" />
    </IconBase>
  )
}

/**
 * Event Icon - Calendar/party for Events & watch parties
 */
export function EventIcon({ size, className }: IconProps) {
  return (
    <IconBase size={size} className={className} aria-label="Events">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
      <path d="M8 18h.01" />
      <path d="M12 18h.01" />
      <path d="M16 18h.01" />
    </IconBase>
  )
}

/**
 * Checkmark Icon - For trust indicators
 */
export function CheckmarkIcon({ size, className }: IconProps) {
  return (
    <IconBase size={size} className={className} aria-label="Checkmark">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="M22 4L12 14.01l-3-3" />
    </IconBase>
  )
}

/**
 * Lightning Icon - For instant matchmaking
 */
export function LightningIcon({ size, className }: IconProps) {
  return (
    <IconBase size={size} className={className} aria-label="Lightning">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </IconBase>
  )
}

/**
 * Globe Icon - For browser/web
 */
export function GlobeIcon({ size, className }: IconProps) {
  return (
    <IconBase size={size} className={className} aria-label="Globe">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </IconBase>
  )
}

/**
 * Chevron Down Icon - For scroll indicator
 */
export function ChevronDownIcon({ size, className }: IconProps) {
  return (
    <IconBase size={size} className={className} aria-label="Scroll down">
      <path d="M6 9l6 6 6-6" />
    </IconBase>
  )
}

/**
 * Menu Icon - Hamburger menu for mobile
 */
export function MenuIcon({ size, className }: IconProps) {
  return (
    <IconBase size={size} className={className} aria-label="Menu">
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </IconBase>
  )
}

/**
 * Close Icon - For closing menus/modals
 */
export function CloseIcon({ size, className }: IconProps) {
  return (
    <IconBase size={size} className={className} aria-label="Close">
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </IconBase>
  )
}
