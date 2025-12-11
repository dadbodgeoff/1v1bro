/**
 * Types for RewardDisplayBox components
 * 
 * @module battlepass/enterprise/types
 */

export type DisplaySize = 'xl' | 'lg' | 'md' | 'sm'
export type RewardType = 'coins' | 'xp_boost' | 'cosmetic' | 'title'
export type ClaimState = 'locked' | 'claimable' | 'claimed'
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export interface Reward {
  type: RewardType
  value: string | number
  preview_url?: string
  sprite_sheet_url?: string
  rarity?: Rarity
  cosmetic_name?: string
}

export interface SizeConfig {
  container: string
  minHeight: string
  imageSize: number
  imageWrapper: string
  padding: string
  gap: string
  badgeGap: string
  titleSize: string
  titleWeight: string
  titleTracking: string
  typeSize: string
  descSize: string
  showDescription: boolean
  showType: boolean
  badgeSize: 'sm' | 'md'
  ctaSize: 'sm' | 'md'
}
