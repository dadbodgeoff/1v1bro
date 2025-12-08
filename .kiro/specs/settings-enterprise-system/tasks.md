# Implementation Plan

- [x] 1. Create database migration and backend schemas
  - [x] 1.1 Create migration file `backend/app/database/migrations/013_settings_tables.sql`
    - Create `notification_preferences` table with columns: user_id, email_enabled, push_enabled, friend_activity, match_updates, marketing_emails
    - Create `user_settings` table with columns for audio, video, accessibility, and keybinds
    - Add `show_match_history` column to `user_profiles`
    - Create RLS policies for both tables
    - Create triggers for updated_at
    - Initialize settings for existing users
    - _Requirements: 2.1, 2.2_

  - [x] 1.2 Create settings schemas `backend/app/schemas/settings.py`
    - Define enums: VideoQuality, ColorblindMode
    - Define models: NotificationPreferences, AudioSettings, VideoSettings, AccessibilitySettings, Keybinds
    - Define composite UserSettings model
    - Define PrivacySettingsExtended with show_match_history
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [x] 1.3 Write property test for settings schema validation
    - **Property 1: Audio Volume Bounds** - For any audio setting, value SHALL be in [0, 100]
    - **Property 6: Video Quality Enum Validity** - For any video_quality, value SHALL be valid enum
    - **Property 7: Colorblind Mode Enum Validity** - For any colorblind_mode, value SHALL be valid enum
    - **Property 8: FPS Limit Enum Validity** - For any fps_limit, value SHALL be valid enum
    - **Property 2: Font Scale Bounds** - For any font_scale, value SHALL be in [0.8, 1.5]
    - **Validates: Requirements 5.1, 6.1, 10.1, 10.3**

- [x] 2. Implement settings repository and service
  - [x] 2.1 Create settings repository `backend/app/database/repositories/settings_repo.py`
    - Implement get_notification_preferences(user_id)
    - Implement update_notification_preferences(user_id, settings)
    - Implement get_user_settings(user_id)
    - Implement update_audio_settings(user_id, settings)
    - Implement update_video_settings(user_id, settings)
    - Implement update_accessibility_settings(user_id, settings)
    - Implement update_keybinds(user_id, keybinds)
    - Implement get_or_create_settings(user_id) for initialization
    - _Requirements: 2.1, 2.2, 11.1_

  - [x] 2.2 Create settings service `backend/app/services/settings_service.py`
    - Implement get_all_settings(user_id) returning UserSettings
    - Implement update_notifications(user_id, settings)
    - Implement update_audio(user_id, settings)
    - Implement update_video(user_id, settings)
    - Implement update_accessibility(user_id, settings)
    - Implement update_keybinds(user_id, keybinds)
    - Add cache invalidation on updates
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [x] 2.3 Write property test for settings round-trip persistence
    - **Property 3: Settings Round-Trip Persistence** - For any valid UserSettings, save then load SHALL produce equivalent object
    - **Validates: Requirements 2.3, 11.1**

- [x] 3. Implement settings API endpoints
  - [x] 3.1 Create settings router `backend/app/api/v1/settings.py`
    - Implement GET /settings/me returning all settings
    - Implement PUT /settings/notifications
    - Implement PUT /settings/audio
    - Implement PUT /settings/video
    - Implement PUT /settings/accessibility
    - Implement PUT /settings/keybinds
    - Add proper error handling and validation
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [x] 3.2 Register settings router in main app
    - Add router to `backend/app/api/v1/__init__.py`
    - Add dependency injection for SettingsService
    - _Requirements: 2.3_

  - [x] 3.3 Write property test for API validation
    - **Property 4: Keybind Uniqueness** - For any keybind config, no two actions SHALL have same key
    - **Property 5: Notification Master Toggle** - When email_enabled is false, email notifications SHALL be disabled
    - **Validates: Requirements 4.3, 7.3**

- [x] 4. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create frontend TypeScript types and hooks
  - [x] 5.1 Create settings types `frontend/src/types/settings.ts`
    - Define VideoQuality, ColorblindMode, FPSLimit types
    - Define NotificationPreferences interface
    - Define AudioSettings interface
    - Define VideoSettings interface
    - Define AccessibilitySettings interface
    - Define Keybinds interface
    - Define PrivacySettings interface
    - Define UserSettings composite interface
    - _Requirements: 2.3_

  - [x] 5.2 Create settings hook `frontend/src/hooks/useSettings.ts`
    - Implement fetchSettings() to GET /settings/me
    - Implement updateNotifications(settings)
    - Implement updateAudio(settings)
    - Implement updateVideo(settings)
    - Implement updateAccessibility(settings)
    - Implement updateKeybinds(keybinds)
    - Add loading, error, and success states
    - Add debounced save for sliders
    - _Requirements: 5.2, 11.1, 11.2_

  - [x] 5.3 Create settings store `frontend/src/stores/settingsStore.ts`
    - Create Zustand store for settings state
    - Implement localStorage fallback for offline
    - Implement settings sync across tabs
    - _Requirements: 11.1, 11.2, 11.4_

- [x] 6. Create enterprise settings components
  - [x] 6.1 Create SettingsSection component
    - Implement collapsible section with icon and title
    - Add loading and error states
    - Add expand/collapse animation
    - _Requirements: 1.3_

  - [x] 6.2 Create SettingsToggle component
    - Implement toggle switch with label and description
    - Add loading spinner state
    - Add disabled state styling
    - Ensure accessible keyboard navigation
    - _Requirements: 1.3, 3.1, 4.1_

  - [x] 6.3 Create SettingsSlider component
    - Implement range slider with value display
    - Add mute button for audio sliders
    - Add reset to default button
    - Implement real-time preview
    - _Requirements: 1.3, 5.1_

  - [x] 6.4 Create SettingsSelect component
    - Implement dropdown with options
    - Add option descriptions
    - Add keyboard navigation
    - _Requirements: 1.3, 6.1_

  - [x] 6.5 Create KeybindInput component
    - Implement click-to-capture mode
    - Display key name
    - Add conflict detection
    - Add reset to default
    - _Requirements: 1.3, 7.1, 7.2, 7.3_

  - [x] 6.6 Create barrel export file `frontend/src/components/settings/enterprise/index.ts`
    - Export all enterprise components
    - _Requirements: 1.4_

  - [x] 6.7 Write unit tests for settings components
    - Test SettingsToggle state changes
    - Test SettingsSlider value bounds
    - Test KeybindInput capture mode
    - Test SettingsSelect option selection
    - _Requirements: 1.3_

- [x] 7. Implement Settings page sections
  - [x] 7.1 Implement Privacy section
    - Add toggles for: is_public, accept_friend_requests, allow_messages, show_online_status, show_match_history
    - Connect to existing privacy API
    - Add loading and success feedback
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 7.2 Implement Notifications section
    - Add toggles for: email_enabled, push_enabled, friend_activity, match_updates, marketing_emails
    - Implement master toggle behavior (disable sub-toggles when master off)
    - Connect to new notifications API
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 7.3 Implement Audio section
    - Add sliders for: master, music, sfx, voice
    - Implement master volume mute behavior
    - Add debounced persistence
    - Connect to audio API
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 7.4 Implement Video section
    - Add quality preset dropdown
    - Add FPS limit dropdown
    - Add show FPS counter toggle
    - Add reduced motion toggle
    - Connect to video API
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 7.5 Implement Controls section
    - Add keybind inputs for all actions
    - Implement conflict detection
    - Add reset to defaults button
    - Connect to keybinds API
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 7.6 Implement Accessibility section
    - Add colorblind mode dropdown
    - Add font scale slider
    - Add high contrast toggle
    - Add reduced motion toggle (shared with video)
    - Connect to accessibility API
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement Two-Factor Authentication
  - [x] 9.1 Create 2FA service `backend/app/services/two_factor_service.py`
    - Implement generate_secret() returning TOTP secret
    - Implement generate_qr_code(secret, user_email) returning QR code URL
    - Implement verify_code(secret, code) validating TOTP
    - Implement generate_recovery_codes() returning 10 codes
    - _Requirements: 8.2, 8.3_

  - [x] 9.2 Create 2FA API endpoints
    - Implement POST /settings/2fa/setup returning secret and QR
    - Implement POST /settings/2fa/verify enabling 2FA
    - Implement POST /settings/2fa/disable requiring current code
    - Implement POST /settings/2fa/recovery-codes requiring current code
    - _Requirements: 8.2, 8.3, 8.4, 8.5_

  - [x] 9.3 Create TwoFactorSetup component
    - Implement setup wizard with QR code display
    - Add manual entry code fallback
    - Add verification code input
    - Display recovery codes on success
    - Add disable 2FA flow
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 9.4 Write property test for 2FA state consistency
    - **Property 10: 2FA State Consistency** - If two_factor_enabled is true, two_factor_secret SHALL be non-null
    - **Validates: Requirements 8.3, 8.4**

- [x] 10. Implement Account Management
  - [x] 10.1 Create account management endpoints
    - Implement POST /settings/account/export triggering data export job
    - Implement DELETE /settings/account scheduling soft delete
    - Add password verification for delete
    - _Requirements: 9.2, 9.3, 9.4_

  - [x] 10.2 Create AccountDangerZone component
    - Implement sign out button
    - Implement export data button with progress
    - Implement delete account with confirmation dialog
    - Add "type DELETE to confirm" validation
    - Add password re-entry requirement
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 10.3 Integrate Account section into Settings page
    - Add danger zone styling
    - Connect to account APIs
    - Handle sign out and redirect
    - _Requirements: 9.1_

- [x] 11. Implement Settings Sync
  - [x] 11.1 Add WebSocket events for settings sync
    - Add settings_updated event type
    - Broadcast on settings change
    - Handle incoming sync events
    - _Requirements: 11.2, 11.3_

  - [x] 11.2 Implement offline queue
    - Queue changes in localStorage when offline
    - Sync queued changes on reconnect
    - Show offline indicator
    - _Requirements: 11.4_

- [x] 12. Implement responsive design
  - [x] 12.1 Add mobile layout
    - Stack sections vertically
    - Collapse sections by default
    - Use bottom sheet for confirmations
    - _Requirements: 12.1_

  - [x] 12.2 Add desktop sidebar navigation
    - Display section navigation in sidebar
    - Show selected section in main area
    - Smooth scroll between sections
    - _Requirements: 12.3_

- [x] 13. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

