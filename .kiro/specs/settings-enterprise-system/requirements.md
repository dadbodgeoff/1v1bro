# Requirements Document

## Introduction

This specification defines a comprehensive enterprise-grade Settings System for the 1v1bro gaming platform. The redesign transforms the current basic Settings page into a AAA-quality preferences management system that matches the enterprise standards established in the Profile, Battle Pass, and Inventory redesigns.

**Current State Analysis:**

| Component | Current Implementation | Problem |
|-----------|----------------------|---------|
| Privacy Settings | Working - persisted to `user_profiles` | Basic UI, needs enterprise styling |
| Notification Settings | UI only - NOT persisted | Settings lost on refresh, no backend |
| 2FA Settings | UI placeholder only | Button shows alert, no implementation |
| Audio Settings | Not implemented | No volume controls for game audio |
| Video Settings | Not implemented | No quality/performance options |
| Keybind Settings | Not implemented | No customization for arena controls |
| Account Management | Sign out only | No delete account, no data export |
| Accessibility | Not implemented | No colorblind, reduced motion options |

The upgrade encompasses:

1. **Enterprise Component Architecture** - New enterprise-grade components in `frontend/src/components/settings/enterprise/` following established patterns
2. **Full Backend Integration** - New database tables, API endpoints, and services for all settings categories
3. **Notification Preferences System** - Persisted email, push, and in-app notification settings
4. **Audio/Video Settings** - Game audio controls, video quality, and performance options
5. **Keybind Customization** - Customizable controls for arena gameplay
6. **Two-Factor Authentication** - Complete 2FA setup, verification, and recovery flow
7. **Account Management** - Account deletion, data export (GDPR compliance)
8. **Accessibility Options** - Colorblind modes, reduced motion, font scaling
9. **Settings Sync** - Real-time sync across devices via WebSocket

## Glossary

- **Settings_System**: The preferences management system at `frontend/src/pages/Settings.tsx` and `frontend/src/components/settings/`
- **Enterprise_Component**: A component following the enterprise architecture pattern established in other modules
- **Settings_Section**: A collapsible section grouping related settings (Privacy, Notifications, Audio, etc.)
- **Settings_Toggle**: A switch component for boolean settings with label and description
- **Settings_Slider**: A range input for numeric settings (volume, sensitivity)
- **Settings_Select**: A dropdown for enumerated options (quality levels, themes)
- **Keybind_Input**: A component for capturing and displaying keyboard shortcuts
- **Notification_Preferences**: User preferences for email, push, and in-app notifications
- **Audio_Settings**: Volume levels for master, music, SFX, and voice
- **Video_Settings**: Quality presets, resolution, and performance options
- **Accessibility_Settings**: Options for colorblind modes, reduced motion, and font scaling
- **Two_Factor_Auth**: TOTP-based two-factor authentication system
- **Account_Actions**: Destructive account operations (delete, export data)
- **Settings_Persistence**: The system for saving and loading user preferences

## Requirements

### Requirement 1: Enterprise Component Architecture

**User Story:** As a developer, I want Settings components organized in an enterprise architecture, so that the codebase maintains consistency with other modules and enables scalable development.

#### Acceptance Criteria

1.1. WHEN the Settings_System initializes THEN the system SHALL load enterprise components from `frontend/src/components/settings/enterprise/` directory

1.2. WHEN enterprise components are created THEN each component SHALL include a JSDoc header documenting:
- Component purpose and features
- Props interface with descriptions
- Accessibility considerations

1.3. WHEN the enterprise directory is structured THEN the system SHALL contain:
- `SettingsHeader.tsx` - Page header with title and navigation
- `SettingsSection.tsx` - Collapsible section container with icon and title
- `SettingsToggle.tsx` - Toggle switch with label, description, and loading state
- `SettingsSlider.tsx` - Range slider with value display and reset option
- `SettingsSelect.tsx` - Dropdown select with options and descriptions
- `KeybindInput.tsx` - Keyboard shortcut capture and display
- `TwoFactorSetup.tsx` - 2FA setup wizard with QR code and verification
- `AccountDangerZone.tsx` - Destructive actions with confirmation dialogs
- `index.ts` - Barrel export file for all enterprise components

1.4. WHEN components are exported THEN the barrel file SHALL export all enterprise components for clean imports

### Requirement 2: Database Schema and API Endpoints

**User Story:** As a backend developer, I want proper database tables and API endpoints for all settings, so that user preferences are persisted reliably.

#### Acceptance Criteria

2.1. WHEN the database is migrated THEN the system SHALL create a `notification_preferences` table with columns:
- `user_id` (UUID, FK to user_profiles, unique)
- `email_enabled` (BOOLEAN, default true)
- `push_enabled` (BOOLEAN, default true)
- `friend_activity` (BOOLEAN, default true)
- `match_updates` (BOOLEAN, default true)
- `marketing_emails` (BOOLEAN, default false)
- `created_at`, `updated_at` (TIMESTAMPTZ)

2.2. WHEN the database is migrated THEN the system SHALL create a `user_settings` table with columns:
- `user_id` (UUID, FK to user_profiles, unique)
- `audio_master` (INTEGER, 0-100, default 80)
- `audio_music` (INTEGER, 0-100, default 70)
- `audio_sfx` (INTEGER, 0-100, default 80)
- `audio_voice` (INTEGER, 0-100, default 100)
- `video_quality` (VARCHAR, enum: 'low', 'medium', 'high', 'ultra', default 'high')
- `video_fps_limit` (INTEGER, enum: 30, 60, 120, 0 for unlimited, default 60)
- `reduced_motion` (BOOLEAN, default false)
- `colorblind_mode` (VARCHAR, enum: 'none', 'protanopia', 'deuteranopia', 'tritanopia', default 'none')
- `font_scale` (FLOAT, 0.8-1.5, default 1.0)
- `keybinds` (JSONB, default keybind map)
- `created_at`, `updated_at` (TIMESTAMPTZ)

2.3. WHEN GET /api/v1/settings/me is called THEN the system SHALL return all user settings including notifications, audio, video, and accessibility

2.4. WHEN PUT /api/v1/settings/notifications is called THEN the system SHALL update notification preferences and return updated settings

2.5. WHEN PUT /api/v1/settings/audio is called THEN the system SHALL update audio settings and return updated settings

2.6. WHEN PUT /api/v1/settings/video is called THEN the system SHALL update video settings and return updated settings

2.7. WHEN PUT /api/v1/settings/accessibility is called THEN the system SHALL update accessibility settings and return updated settings

2.8. WHEN PUT /api/v1/settings/keybinds is called THEN the system SHALL update keybind settings and return updated settings

### Requirement 3: Privacy Settings Enhancement

**User Story:** As a player, I want enhanced privacy controls with enterprise styling, so that I can manage who sees my information.

#### Acceptance Criteria

3.1. WHEN the Privacy section renders THEN the system SHALL display toggles for:
- Public Profile (is_public)
- Accept Friend Requests (accept_friend_requests)
- Allow Direct Messages (allow_messages)
- Show Online Status (show_online_status)
- Show Match History (show_match_history - new field)

3.2. WHEN a privacy toggle is changed THEN the system SHALL:
- Show loading state on the toggle
- Persist change to backend immediately
- Show success toast on completion
- Show error toast and revert on failure

3.3. WHEN privacy settings load THEN the system SHALL:
- Fetch current values from profile
- Display skeleton loaders during fetch
- Handle errors gracefully with retry option

### Requirement 4: Notification Preferences

**User Story:** As a player, I want to control what notifications I receive, so that I'm not overwhelmed with alerts.

#### Acceptance Criteria

4.1. WHEN the Notifications section renders THEN the system SHALL display toggles for:
- Email Notifications (master toggle)
- Push Notifications (master toggle)
- Friend Activity (friend requests, online status)
- Match Updates (match found, results)
- Marketing Emails (promotions, news)

4.2. WHEN a notification toggle is changed THEN the system SHALL:
- Persist change to `notification_preferences` table
- Show loading state during save
- Show success feedback on completion

4.3. WHEN email notifications are disabled THEN the system SHALL:
- Disable all email-related sub-toggles
- Show visual indication that sub-options are disabled
- Persist the master toggle state

4.4. WHEN push notifications are toggled on THEN the system SHALL:
- Request browser notification permission if not granted
- Show permission denied message if blocked
- Enable push only if permission granted

### Requirement 5: Audio Settings

**User Story:** As a player, I want to control game audio levels, so that I can customize my audio experience.

#### Acceptance Criteria

5.1. WHEN the Audio section renders THEN the system SHALL display sliders for:
- Master Volume (0-100%)
- Music Volume (0-100%)
- Sound Effects Volume (0-100%)
- Voice/Announcer Volume (0-100%)

5.2. WHEN a volume slider is adjusted THEN the system SHALL:
- Update audio in real-time (preview)
- Debounce persistence (500ms delay)
- Show current value as percentage
- Provide mute button per channel

5.3. WHEN Master Volume is set to 0 THEN the system SHALL:
- Mute all audio channels
- Show muted indicator on all sliders
- Preserve individual channel values

5.4. WHEN audio settings are saved THEN the system SHALL:
- Persist to `user_settings.audio_*` columns
- Apply settings to game audio engine
- Sync across browser tabs via localStorage

### Requirement 6: Video and Performance Settings

**User Story:** As a player, I want to control video quality and performance, so that the game runs smoothly on my device.

#### Acceptance Criteria

6.1. WHEN the Video section renders THEN the system SHALL display:
- Quality Preset dropdown (Low, Medium, High, Ultra)
- FPS Limit dropdown (30, 60, 120, Unlimited)
- Show FPS Counter toggle
- Reduced Motion toggle (accessibility)

6.2. WHEN Quality Preset is changed THEN the system SHALL:
- Apply preset to game renderer
- Show preview of quality change
- Persist to `user_settings.video_quality`

6.3. WHEN FPS Limit is changed THEN the system SHALL:
- Apply limit to game loop
- Show current FPS if counter enabled
- Persist to `user_settings.video_fps_limit`

6.4. WHEN Reduced Motion is enabled THEN the system SHALL:
- Disable non-essential animations
- Reduce particle effects
- Simplify UI transitions
- Persist to `user_settings.reduced_motion`

### Requirement 7: Keybind Customization

**User Story:** As a player, I want to customize my keyboard controls, so that I can play comfortably with my preferred layout.

#### Acceptance Criteria

7.1. WHEN the Controls section renders THEN the system SHALL display keybind inputs for:
- Move Up (default: W)
- Move Down (default: S)
- Move Left (default: A)
- Move Right (default: D)
- Use Power-up (default: Space)
- Open Emote Wheel (default: E)
- Toggle Scoreboard (default: Tab)

7.2. WHEN a keybind input is clicked THEN the system SHALL:
- Enter capture mode with visual indicator
- Listen for next key press
- Display captured key name
- Validate no conflicts with other bindings

7.3. WHEN a keybind conflict is detected THEN the system SHALL:
- Show warning message with conflicting action
- Offer to swap bindings or cancel
- Prevent saving until resolved

7.4. WHEN keybinds are saved THEN the system SHALL:
- Persist to `user_settings.keybinds` JSONB column
- Apply to game input handler immediately
- Provide "Reset to Defaults" button

### Requirement 8: Two-Factor Authentication

**User Story:** As a player, I want to enable 2FA on my account, so that my account is more secure.

#### Acceptance Criteria

8.1. WHEN 2FA is not enabled THEN the system SHALL display:
- "Enable 2FA" button with security icon
- Description of 2FA benefits
- Supported authenticator apps list

8.2. WHEN "Enable 2FA" is clicked THEN the system SHALL:
- Generate TOTP secret on backend
- Display QR code for authenticator app
- Show manual entry code as fallback
- Require verification code to complete setup

8.3. WHEN verification code is entered THEN the system SHALL:
- Validate code against TOTP secret
- Enable 2FA on success (set `two_factor_enabled = true`)
- Generate and display recovery codes
- Require user to confirm recovery codes saved

8.4. WHEN 2FA is enabled THEN the system SHALL display:
- "2FA Enabled" status with checkmark
- "Disable 2FA" button (requires current code)
- "View Recovery Codes" button (requires current code)
- Last used timestamp

8.5. WHEN disabling 2FA THEN the system SHALL:
- Require current 2FA code for verification
- Show confirmation dialog with warning
- Set `two_factor_enabled = false` on confirm

### Requirement 9: Account Management

**User Story:** As a player, I want to manage my account including deletion and data export, so that I have control over my data.

#### Acceptance Criteria

9.1. WHEN the Account section renders THEN the system SHALL display:
- Sign Out button
- Export My Data button
- Delete Account button (danger zone)

9.2. WHEN "Export My Data" is clicked THEN the system SHALL:
- Trigger backend data export job
- Show progress indicator
- Email download link when ready
- Include: profile, stats, inventory, match history

9.3. WHEN "Delete Account" is clicked THEN the system SHALL:
- Show confirmation dialog with warning
- Require typing "DELETE" to confirm
- Require password re-entry
- Show 14-day grace period notice
- Schedule account for deletion (soft delete)

9.4. WHEN account deletion is confirmed THEN the system SHALL:
- Set `deleted_at` timestamp on user record
- Send confirmation email
- Sign out user immediately
- Allow recovery within 14 days via support

### Requirement 10: Accessibility Settings

**User Story:** As a player with accessibility needs, I want options to customize the interface, so that I can use the platform comfortably.

#### Acceptance Criteria

10.1. WHEN the Accessibility section renders THEN the system SHALL display:
- Colorblind Mode dropdown (None, Protanopia, Deuteranopia, Tritanopia)
- Reduced Motion toggle
- Font Scale slider (80% - 150%)
- High Contrast toggle

10.2. WHEN Colorblind Mode is changed THEN the system SHALL:
- Apply color filter to game and UI
- Update rarity colors to accessible alternatives
- Persist to `user_settings.colorblind_mode`

10.3. WHEN Font Scale is changed THEN the system SHALL:
- Apply scale to all text elements
- Preview change in real-time
- Persist to `user_settings.font_scale`
- Respect system font size preferences

10.4. WHEN High Contrast is enabled THEN the system SHALL:
- Increase border visibility
- Enhance text contrast ratios
- Add focus indicators to all interactive elements

### Requirement 11: Settings Persistence and Sync

**User Story:** As a player, I want my settings to sync across devices, so that I have a consistent experience everywhere.

#### Acceptance Criteria

11.1. WHEN settings are loaded THEN the system SHALL:
- Fetch from backend API first
- Fall back to localStorage if offline
- Merge with defaults for missing values

11.2. WHEN settings are changed THEN the system SHALL:
- Persist to backend immediately (debounced)
- Update localStorage as backup
- Broadcast change via WebSocket to other tabs

11.3. WHEN a settings change is received via WebSocket THEN the system SHALL:
- Update local state without page refresh
- Show "Settings updated from another device" toast
- Apply changes immediately

11.4. WHEN offline THEN the system SHALL:
- Queue changes in localStorage
- Sync when connection restored
- Show offline indicator in settings page

### Requirement 12: Responsive and Mobile Experience

**User Story:** As a player on any device, I want the Settings page to work well on mobile, so that I can manage preferences anywhere.

#### Acceptance Criteria

12.1. WHEN viewport is mobile (< 640px) THEN the system SHALL:
- Stack all sections vertically
- Use full-width toggles and sliders
- Collapse sections by default
- Use bottom sheet for confirmations

12.2. WHEN viewport is tablet (640-1024px) THEN the system SHALL:
- Display sections in single column
- Expand sections by default
- Use modal for confirmations

12.3. WHEN viewport is desktop (> 1024px) THEN the system SHALL:
- Display sidebar navigation for sections
- Show selected section in main area
- Use modal for confirmations

12.4. WHEN touch interactions occur THEN the system SHALL:
- Provide minimum 44x44px tap targets
- Support swipe to toggle on mobile
- Add touch feedback on all interactive elements

