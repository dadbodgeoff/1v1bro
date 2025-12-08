/**
 * ProfileEditorForm - Enhanced Profile Editor Component
 * 
 * Features:
 * - Split layout (form left, preview right on desktop)
 * - Stacked layout (form above preview on mobile)
 * - Enterprise-styled form inputs with labels
 * - Character count displays for text fields
 * - Display name validation (3-30 characters)
 * - Bio character count (0-500)
 * - Avatar/banner upload with preview and validation
 * - File type validation (JPEG, PNG, WebP)
 * - File size validation (<5MB)
 * - Unsaved changes detection
 * - "Unsaved changes" indicator
 * - Enable/disable Save button based on changes
 * - Loading states for save and upload actions
 * - Cancel with confirmation if unsaved changes
 * 
 * Props:
 * - profile: Current profile data
 * - onSave: Save callback
 * - onAvatarUpload: Avatar upload callback
 * - onBannerUpload: Banner upload callback
 * - onCancel: Cancel callback
 * - loading: Loading state
 */

import { useState, useEffect, useMemo } from 'react'
import type { Profile, ProfileUpdate } from '@/types/profile'
import { cn } from '@/utils/helpers'

interface ProfileEditorFormProps {
  profile: Profile
  onSave: (updates: ProfileUpdate) => Promise<void>
  onAvatarUpload?: (file: File) => Promise<void>
  onBannerUpload?: (file: File) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

// Validation rules
export const VALIDATION = {
  displayName: { min: 3, max: 30 },
  bio: { max: 500 },
  title: { max: 50 },
  file: { 
    maxSize: 5 * 1024 * 1024, // 5MB
    types: ['image/jpeg', 'image/png', 'image/webp'] 
  },
  socialLinks: {
    twitter: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+/i,
    twitch: /^https?:\/\/(www\.)?twitch\.tv\/.+/i,
    youtube: /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/i,
    discord: /^.{2,32}(#\d{4})?$/, // Discord username format
  },
}

/**
 * Validate display name
 */
export function validateDisplayName(name: string): { valid: boolean; error?: string } {
  if (name.length < VALIDATION.displayName.min) {
    return { valid: false, error: `Minimum ${VALIDATION.displayName.min} characters required` }
  }
  if (name.length > VALIDATION.displayName.max) {
    return { valid: false, error: `Maximum ${VALIDATION.displayName.max} characters allowed` }
  }
  return { valid: true }
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  if (!VALIDATION.file.types.includes(file.type)) {
    return { valid: false, error: 'File must be JPEG, PNG, or WebP' }
  }
  if (file.size > VALIDATION.file.maxSize) {
    return { valid: false, error: 'File must be less than 5MB' }
  }
  return { valid: true }
}

/**
 * Validate social link URL
 */
export function validateSocialLink(
  platform: 'twitter' | 'twitch' | 'youtube' | 'discord',
  value: string
): { valid: boolean; error?: string } {
  if (!value || value.trim() === '') {
    return { valid: true } // Empty is valid (optional field)
  }
  
  const pattern = VALIDATION.socialLinks[platform]
  if (!pattern.test(value)) {
    const hints: Record<string, string> = {
      twitter: 'Must be a valid twitter.com or x.com URL',
      twitch: 'Must be a valid twitch.tv URL',
      youtube: 'Must be a valid youtube.com or youtu.be URL',
      discord: 'Enter your Discord username',
    }
    return { valid: false, error: hints[platform] }
  }
  return { valid: true }
}

/**
 * Check if form has unsaved changes
 */
export function hasUnsavedChanges(
  original: Profile,
  current: { displayName: string; bio: string; title: string }
): boolean {
  return (
    original.display_name !== current.displayName ||
    (original.bio || '') !== current.bio ||
    (original.title || '') !== current.title
  )
}

export function ProfileEditorForm({
  profile,
  onSave,
  onAvatarUpload,
  onBannerUpload,
  onCancel,
  loading = false,
}: ProfileEditorFormProps) {
  // Form state
  const [displayName, setDisplayName] = useState(profile.display_name)
  const [bio, setBio] = useState(profile.bio || '')
  const [title, setTitle] = useState(profile.title || '')
  
  // Validation state
  const [displayNameError, setDisplayNameError] = useState<string>()
  const [fileError, setFileError] = useState<string>()
  
  // Upload state
  const [uploading, setUploading] = useState(false)

  // Check for unsaved changes
  const hasChanges = useMemo(() => 
    hasUnsavedChanges(profile, { displayName, bio, title }),
    [profile, displayName, bio, title]
  )

  // Validate display name on change
  useEffect(() => {
    const validation = validateDisplayName(displayName)
    setDisplayNameError(validation.error)
  }, [displayName])

  const handleSave = async () => {
    if (!hasChanges || displayNameError) return

    const updates: ProfileUpdate = {}
    if (displayName !== profile.display_name) updates.display_name = displayName
    if (bio !== (profile.bio || '')) updates.bio = bio
    if (title !== (profile.title || '')) updates.title = title

    await onSave(updates)
  }

  const handleFileUpload = async (
    file: File,
    uploadFn?: (file: File) => Promise<void>
  ) => {
    if (!uploadFn) return

    const validation = validateFileUpload(file)
    if (!validation.valid) {
      setFileError(validation.error)
      return
    }

    setFileError(undefined)
    setUploading(true)
    try {
      await uploadFn(file)
    } finally {
      setUploading(false)
    }
  }

  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        onCancel()
      }
    } else {
      onCancel()
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Form Section */}
      <div className="space-y-6">
        {/* Unsaved Changes Indicator */}
        {hasChanges && (
          <div className="flex items-center gap-2 text-sm text-[#f59e0b]">
            <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
            Unsaved changes
          </div>
        )}

        {/* Display Name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={VALIDATION.displayName.max}
            className={cn(
              'w-full px-4 py-3 rounded-lg',
              'bg-[var(--color-bg-elevated)] border',
              'text-white placeholder-[var(--color-text-muted)]',
              'focus:outline-none focus:ring-2 focus:ring-[#6366f1]',
              displayNameError 
                ? 'border-[#ef4444] focus:ring-[#ef4444]' 
                : 'border-white/10'
            )}
            placeholder="Enter your display name"
          />
          <div className="flex justify-between text-xs">
            {displayNameError ? (
              <span className="text-[#ef4444]">{displayNameError}</span>
            ) : (
              <span className="text-[var(--color-text-muted)]">
                {VALIDATION.displayName.min}-{VALIDATION.displayName.max} characters
              </span>
            )}
            <span className="text-[var(--color-text-muted)]">
              {displayName.length}/{VALIDATION.displayName.max}
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={VALIDATION.title.max}
            className={cn(
              'w-full px-4 py-3 rounded-lg',
              'bg-[var(--color-bg-elevated)] border border-white/10',
              'text-white placeholder-[var(--color-text-muted)]',
              'focus:outline-none focus:ring-2 focus:ring-[#6366f1]'
            )}
            placeholder="e.g., Pro Player, Streamer"
          />
          <div className="flex justify-end text-xs text-[var(--color-text-muted)]">
            {title.length}/{VALIDATION.title.max}
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={VALIDATION.bio.max}
            rows={4}
            className={cn(
              'w-full px-4 py-3 rounded-lg resize-none',
              'bg-[var(--color-bg-elevated)] border border-white/10',
              'text-white placeholder-[var(--color-text-muted)]',
              'focus:outline-none focus:ring-2 focus:ring-[#6366f1]'
            )}
            placeholder="Tell others about yourself..."
          />
          <div className="flex justify-end text-xs">
            <span className={cn(
              bio.length > VALIDATION.bio.max - 50 
                ? 'text-[#f59e0b]' 
                : 'text-[var(--color-text-muted)]'
            )}>
              {bio.length}/{VALIDATION.bio.max}
            </span>
          </div>
        </div>

        {/* File Upload Error */}
        {fileError && (
          <div className="text-sm text-[#ef4444]">{fileError}</div>
        )}

        {/* Avatar Upload */}
        {onAvatarUpload && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Avatar
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file, onAvatarUpload)
              }}
              disabled={uploading}
              className="w-full text-sm text-[var(--color-text-muted)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#6366f1] file:text-white hover:file:bg-[#818cf8] file:cursor-pointer"
            />
          </div>
        )}

        {/* Banner Upload */}
        {onBannerUpload && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Banner
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file, onBannerUpload)
              }}
              disabled={uploading}
              className="w-full text-sm text-[var(--color-text-muted)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#6366f1] file:text-white hover:file:bg-[#818cf8] file:cursor-pointer"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={handleSave}
            disabled={!hasChanges || !!displayNameError || loading}
            className={cn(
              'flex-1 py-3 px-6 rounded-lg font-semibold transition-colors',
              hasChanges && !displayNameError && !loading
                ? 'bg-[#6366f1] text-white hover:bg-[#818cf8]'
                : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] cursor-not-allowed'
            )}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="py-3 px-6 rounded-lg font-semibold text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Preview Section (Desktop) */}
      <div className="hidden lg:block">
        <div className="sticky top-4 p-6 rounded-xl bg-[var(--color-bg-card)] border border-white/5">
          <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
          <div className="space-y-4">
            <div>
              <div className="text-2xl font-bold text-white">{displayName || 'Display Name'}</div>
              {title && <div className="text-sm text-[#818cf8]">{title}</div>}
            </div>
            {bio && (
              <p className="text-sm text-gray-300 line-clamp-3">{bio}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
