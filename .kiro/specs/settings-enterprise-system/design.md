# Settings Enterprise System - Design Document

## Overview

This design document outlines the architecture for transforming the Settings page into an enterprise-grade preferences management system. The upgrade creates a comprehensive settings experience with full backend persistence, real-time sync, and accessibility compliance.

The implementation:
1. Creates new enterprise components in `frontend/src/components/settings/enterprise/`
2. Adds database tables for `notification_preferences` and `user_settings`
3. Implements new API endpoints for all settings categories
4. Creates `SettingsService` for backend settings management
5. Implements 2FA setup and verification flow
6. Adds account management features (export, delete)
7. Implements accessibility options with real-time preview
8. Adds settings sync via WebSocket

## Current State Analysis

### Files to Modify
| File | Current State | Changes Needed |
|------|---------------|----------------|
| `frontend/src/pages/Settings.tsx` | Basic page with privacy toggles | Integrate enterprise components, add all sections |
| `backend/app/schemas/profile.py` | Has PrivacySettings | Add new settings schemas |
| `backend/app/services/profile_service.py` | Has update_privacy_settings | Extract to dedicated SettingsService |
| `backend/app/api/v1/profiles.py` | Has /me/privacy endpoint | Add new settings endpoints |

### New Files to Create

#### Backend
| File | Purpose |
|------|---------|
| `backend/app/database/migrations/013_settings_tables.sql` | Create notification_preferences and user_settings tables |
| `backend/app/schemas/settings.py` | Pydantic schemas for all settings types |
| `backend/app/services/settings_service.py` | Settings business logic |
| `backend/app/services/two_factor_service.py` | 2FA setup and verification |
| `backend/app/api/v1/settings.py` | Settings API endpoints |
| `backend/app/database/repositories/settings_repo.py` | Settings database operations |

#### Frontend
| File | Purpose |
|------|---------|
| `frontend/src/components/settings/enterprise/SettingsHeader.tsx` | Page header with navigation |
| `frontend/src/components/settings/enterprise/SettingsSection.tsx` | Collapsible section container |
| `frontend/src/components/settings/enterprise/SettingsToggle.tsx` | Toggle switch component |
| `frontend/src/components/settings/enterprise/SettingsSlider.tsx` | Range slider component |
| `frontend/src/components/settings/enterprise/SettingsSelect.tsx` | Dropdown select component |
| `frontend/src/components/settings/enterprise/KeybindInput.tsx` | Keyboard shortcut capture |
| `frontend/src/components/settings/enterprise/TwoFactorSetup.tsx` | 2FA setup wizard |
| `frontend/src/components/settings/enterprise/AccountDangerZone.tsx` | Destructive actions |
| `frontend/src/components/settings/enterprise/index.ts` | Barrel exports |
| `frontend/src/hooks/useSettings.ts` | Settings state management hook |
| `frontend/src/types/settings.ts` | TypeScript interfaces |
| `frontend/src/stores/settingsStore.ts` | Zustand store for settings |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              Settings Page                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         SettingsHeader                                        │   │
│  │  Settings                                              [Save All] [Reset]    │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌──────────────┐  ┌───────────────────────────────────────────────────────────┐   │
│  │  Navigation  │  │                    Content Area                            │   │
│  │  ┌────────┐  │  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │Privacy │  │  │  │              SettingsSection: Privacy                │  │   │
│  │  ├────────┤  │  │  │  ┌─────────────────────────────────────────────┐    │  │   │
│  │  │Notifs  │  │  │  │  │ Public Profile          [====○====]         │    │  │   │
│  │  ├────────┤  │  │  │  │ Accept Friend Requests  [====●====]         │    │  │   │
│  │  │Audio   │  │  │  │  │ Allow Messages          [====●====]         │    │  │   │
│  │  ├────────┤  │  │  │  │ Show Online Status      [====●====]         │    │  │   │
│  │  │Video   │  │  │  │  └─────────────────────────────────────────────┘    │  │   │
│  │  ├────────┤  │  │  └─────────────────────────────────────────────────────┘  │   │
│  │  │Controls│  │  │                                                            │   │
│  │  ├────────┤  │  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │Security│  │  │  │              SettingsSection: Audio                  │  │   │
│  │  ├────────┤  │  │  │  ┌─────────────────────────────────────────────┐    │  │   │
│  │  │Access. │  │  │  │  │ Master Volume    [========●==] 80%          │    │  │   │
│  │  ├────────┤  │  │  │  │ Music Volume     [======●====] 70%          │    │  │   │
│  │  │Account │  │  │  │  │ SFX Volume       [========●==] 80%          │    │  │   │
│  │  └────────┘  │  │  │  │ Voice Volume     [==========●] 100%         │    │  │   │
│  └──────────────┘  │  │  └─────────────────────────────────────────────┘    │  │   │
│                    │  └─────────────────────────────────────────────────────┘  │   │
│                    └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
Settings (Page)
├── SettingsHeader
│   ├── Title
│   └── Action Buttons (Save All, Reset)
├── SettingsNavigation (desktop sidebar / mobile tabs)
│   └── NavItem[] (Privacy, Notifications, Audio, Video, Controls, Security, Accessibility, Account)
└── SettingsContent
    ├── SettingsSection: Privacy
    │   └── SettingsToggle[] (5 toggles)
    ├── SettingsSection: Notifications
    │   └── SettingsToggle[] (5 toggles)
    ├── SettingsSection: Audio
    │   └── SettingsSlider[] (4 sliders)
    ├── SettingsSection: Video
    │   ├── SettingsSelect (Quality)
    │   ├── SettingsSelect (FPS Limit)
    │   └── SettingsToggle[] (2 toggles)
    ├── SettingsSection: Controls
    │   └── KeybindInput[] (7 keybinds)
    ├── SettingsSection: Security
    │   └── TwoFactorSetup
    ├── SettingsSection: Accessibility
    │   ├── SettingsSelect (Colorblind Mode)
    │   ├── SettingsSlider (Font Scale)
    │   └── SettingsToggle[] (2 toggles)
    └── SettingsSection: Account
        └── AccountDangerZone
            ├── Sign Out Button
            ├── Export Data Button
            └── Delete Account Button
```

## Database Schema

### Migration: 013_settings_tables.sql

```sql
-- ============================================
-- Notification Preferences Table
-- ============================================
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    friend_activity BOOLEAN DEFAULT true,
    match_updates BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- User Settings Table
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    -- Audio Settings
    audio_master INTEGER DEFAULT 80 CHECK (audio_master >= 0 AND audio_master <= 100),
    audio_music INTEGER DEFAULT 70 CHECK (audio_music >= 0 AND audio_music <= 100),
    audio_sfx INTEGER DEFAULT 80 CHECK (audio_sfx >= 0 AND audio_sfx <= 100),
    audio_voice INTEGER DEFAULT 100 CHECK (audio_voice >= 0 AND audio_voice <= 100),
    -- Video Settings
    video_quality VARCHAR(20) DEFAULT 'high' CHECK (video_quality IN ('low', 'medium', 'high', 'ultra')),
    video_fps_limit INTEGER DEFAULT 60 CHECK (video_fps_limit IN (0, 30, 60, 120)),
    show_fps_counter BOOLEAN DEFAULT false,
    -- Accessibility Settings
    reduced_motion BOOLEAN DEFAULT false,
    colorblind_mode VARCHAR(20) DEFAULT 'none' CHECK (colorblind_mode IN ('none', 'protanopia', 'deuteranopia', 'tritanopia')),
    font_scale DECIMAL(3,2) DEFAULT 1.0 CHECK (font_scale >= 0.8 AND font_scale <= 1.5),
    high_contrast BOOLEAN DEFAULT false,
    -- Keybinds (JSONB for flexibility)
    keybinds JSONB DEFAULT '{
        "move_up": "KeyW",
        "move_down": "KeyS",
        "move_left": "KeyA",
        "move_right": "KeyD",
        "use_powerup": "Space",
        "open_emote": "KeyE",
        "toggle_scoreboard": "Tab"
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Add show_match_history to user_profiles
-- ============================================
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS show_match_history BOOLEAN DEFAULT true;

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification preferences" ON notification_preferences
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notification preferences" ON notification_preferences
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notification preferences" ON notification_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Initialize settings for existing users
-- ============================================
INSERT INTO notification_preferences (user_id)
SELECT id FROM user_profiles
WHERE id NOT IN (SELECT user_id FROM notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_settings (user_id)
SELECT id FROM user_profiles
WHERE id NOT IN (SELECT user_id FROM user_settings)
ON CONFLICT (user_id) DO NOTHING;
```

## Components and Interfaces

### SettingsSection Component

```typescript
/**
 * SettingsSection - Collapsible Section Container
 * 
 * Features:
 * - Icon and title header
 * - Collapsible content area
 * - Loading and error states
 * - Consistent padding and styling
 */

interface SettingsSectionProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  description?: string;
  defaultExpanded?: boolean;
  loading?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}
```

### SettingsToggle Component

```typescript
/**
 * SettingsToggle - Toggle Switch with Label
 * 
 * Features:
 * - Label and description text
 * - Loading state with spinner
 * - Disabled state styling
 * - Accessible keyboard navigation
 */

interface SettingsToggleProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}
```

### SettingsSlider Component

```typescript
/**
 * SettingsSlider - Range Slider with Value Display
 * 
 * Features:
 * - Min/max range with step
 * - Current value display (percentage or absolute)
 * - Mute button for audio sliders
 * - Reset to default button
 * - Real-time preview
 */

interface SettingsSliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  defaultValue?: number;
  onChange: (value: number) => void;
  onMute?: () => void;
  muted?: boolean;
  showReset?: boolean;
  className?: string;
}
```

### SettingsSelect Component

```typescript
/**
 * SettingsSelect - Dropdown Select with Options
 * 
 * Features:
 * - Options with labels and descriptions
 * - Selected value display
 * - Keyboard navigation
 * - Loading state
 */

interface SettingsSelectProps {
  id: string;
  label: string;
  description?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

interface SelectOption {
  value: string;
  label: string;
  description?: string;
}
```

### KeybindInput Component

```typescript
/**
 * KeybindInput - Keyboard Shortcut Capture
 * 
 * Features:
 * - Click to capture mode
 * - Key name display
 * - Conflict detection
 * - Reset to default
 */

interface KeybindInputProps {
  id: string;
  action: string;
  currentKey: string;
  defaultKey: string;
  onCapture: (key: string) => void;
  conflictWith?: string;
  className?: string;
}

const DEFAULT_KEYBINDS: Record<string, string> = {
  move_up: 'KeyW',
  move_down: 'KeyS',
  move_left: 'KeyA',
  move_right: 'KeyD',
  use_powerup: 'Space',
  open_emote: 'KeyE',
  toggle_scoreboard: 'Tab',
};
```

### TwoFactorSetup Component

```typescript
/**
 * TwoFactorSetup - 2FA Setup Wizard
 * 
 * Features:
 * - QR code display for authenticator
 * - Manual entry code fallback
 * - Verification code input
 * - Recovery codes display
 * - Disable 2FA flow
 */

interface TwoFactorSetupProps {
  enabled: boolean;
  onEnable: () => Promise<TwoFactorSetupResponse>;
  onVerify: (code: string) => Promise<boolean>;
  onDisable: (code: string) => Promise<boolean>;
  onViewRecoveryCodes: (code: string) => Promise<string[]>;
  className?: string;
}

interface TwoFactorSetupResponse {
  secret: string;
  qr_code_url: string;
  recovery_codes: string[];
}
```

### AccountDangerZone Component

```typescript
/**
 * AccountDangerZone - Destructive Account Actions
 * 
 * Features:
 * - Sign out button
 * - Export data with progress
 * - Delete account with confirmation
 * - Visual danger zone styling
 */

interface AccountDangerZoneProps {
  onSignOut: () => void;
  onExportData: () => Promise<void>;
  onDeleteAccount: (password: string) => Promise<void>;
  className?: string;
}
```

## Data Models

### Backend Schemas (Pydantic)

```python
# backend/app/schemas/settings.py

from pydantic import BaseModel, Field
from typing import Optional, Dict
from enum import Enum

class VideoQuality(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    ULTRA = "ultra"

class ColorblindMode(str, Enum):
    NONE = "none"
    PROTANOPIA = "protanopia"
    DEUTERANOPIA = "deuteranopia"
    TRITANOPIA = "tritanopia"

class NotificationPreferences(BaseModel):
    email_enabled: bool = True
    push_enabled: bool = True
    friend_activity: bool = True
    match_updates: bool = True
    marketing_emails: bool = False

class AudioSettings(BaseModel):
    master: int = Field(default=80, ge=0, le=100)
    music: int = Field(default=70, ge=0, le=100)
    sfx: int = Field(default=80, ge=0, le=100)
    voice: int = Field(default=100, ge=0, le=100)

class VideoSettings(BaseModel):
    quality: VideoQuality = VideoQuality.HIGH
    fps_limit: int = Field(default=60, description="0 for unlimited")
    show_fps_counter: bool = False

class AccessibilitySettings(BaseModel):
    reduced_motion: bool = False
    colorblind_mode: ColorblindMode = ColorblindMode.NONE
    font_scale: float = Field(default=1.0, ge=0.8, le=1.5)
    high_contrast: bool = False

class Keybinds(BaseModel):
    move_up: str = "KeyW"
    move_down: str = "KeyS"
    move_left: str = "KeyA"
    move_right: str = "KeyD"
    use_powerup: str = "Space"
    open_emote: str = "KeyE"
    toggle_scoreboard: str = "Tab"

class UserSettings(BaseModel):
    notifications: NotificationPreferences
    audio: AudioSettings
    video: VideoSettings
    accessibility: AccessibilitySettings
    keybinds: Keybinds

class PrivacySettingsExtended(BaseModel):
    is_public: bool = True
    accept_friend_requests: bool = True
    allow_messages: bool = True
    show_online_status: bool = True
    show_match_history: bool = True
```

### Frontend Types (TypeScript)

```typescript
// frontend/src/types/settings.ts

export type VideoQuality = 'low' | 'medium' | 'high' | 'ultra';
export type ColorblindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
export type FPSLimit = 0 | 30 | 60 | 120;

export interface NotificationPreferences {
  email_enabled: boolean;
  push_enabled: boolean;
  friend_activity: boolean;
  match_updates: boolean;
  marketing_emails: boolean;
}

export interface AudioSettings {
  master: number;
  music: number;
  sfx: number;
  voice: number;
}

export interface VideoSettings {
  quality: VideoQuality;
  fps_limit: FPSLimit;
  show_fps_counter: boolean;
}

export interface AccessibilitySettings {
  reduced_motion: boolean;
  colorblind_mode: ColorblindMode;
  font_scale: number;
  high_contrast: boolean;
}

export interface Keybinds {
  move_up: string;
  move_down: string;
  move_left: string;
  move_right: string;
  use_powerup: string;
  open_emote: string;
  toggle_scoreboard: string;
}

export interface PrivacySettings {
  is_public: boolean;
  accept_friend_requests: boolean;
  allow_messages: boolean;
  show_online_status: boolean;
  show_match_history: boolean;
}

export interface UserSettings {
  privacy: PrivacySettings;
  notifications: NotificationPreferences;
  audio: AudioSettings;
  video: VideoSettings;
  accessibility: AccessibilitySettings;
  keybinds: Keybinds;
}
```

## API Endpoints

### Settings Router

```python
# backend/app/api/v1/settings.py

router = APIRouter(prefix="/settings", tags=["settings"])

@router.get("/me", response_model=APIResponse[UserSettings])
async def get_all_settings(current_user: CurrentUser, settings_service: SettingsServiceDep):
    """Get all user settings."""

@router.put("/notifications", response_model=APIResponse[NotificationPreferences])
async def update_notification_settings(
    settings: NotificationPreferences,
    current_user: CurrentUser,
    settings_service: SettingsServiceDep
):
    """Update notification preferences."""

@router.put("/audio", response_model=APIResponse[AudioSettings])
async def update_audio_settings(
    settings: AudioSettings,
    current_user: CurrentUser,
    settings_service: SettingsServiceDep
):
    """Update audio settings."""

@router.put("/video", response_model=APIResponse[VideoSettings])
async def update_video_settings(
    settings: VideoSettings,
    current_user: CurrentUser,
    settings_service: SettingsServiceDep
):
    """Update video settings."""

@router.put("/accessibility", response_model=APIResponse[AccessibilitySettings])
async def update_accessibility_settings(
    settings: AccessibilitySettings,
    current_user: CurrentUser,
    settings_service: SettingsServiceDep
):
    """Update accessibility settings."""

@router.put("/keybinds", response_model=APIResponse[Keybinds])
async def update_keybinds(
    keybinds: Keybinds,
    current_user: CurrentUser,
    settings_service: SettingsServiceDep
):
    """Update keybind settings."""

@router.post("/2fa/setup", response_model=APIResponse[TwoFactorSetupResponse])
async def setup_two_factor(current_user: CurrentUser, two_factor_service: TwoFactorServiceDep):
    """Initialize 2FA setup and return QR code."""

@router.post("/2fa/verify", response_model=APIResponse[TwoFactorVerifyResponse])
async def verify_two_factor(
    request: TwoFactorVerifyRequest,
    current_user: CurrentUser,
    two_factor_service: TwoFactorServiceDep
):
    """Verify 2FA code and enable 2FA."""

@router.post("/2fa/disable", response_model=APIResponse[dict])
async def disable_two_factor(
    request: TwoFactorVerifyRequest,
    current_user: CurrentUser,
    two_factor_service: TwoFactorServiceDep
):
    """Disable 2FA (requires current code)."""

@router.post("/account/export", response_model=APIResponse[dict])
async def request_data_export(current_user: CurrentUser, settings_service: SettingsServiceDep):
    """Request data export (sends email with download link)."""

@router.delete("/account", response_model=APIResponse[dict])
async def delete_account(
    request: DeleteAccountRequest,
    current_user: CurrentUser,
    settings_service: SettingsServiceDep
):
    """Schedule account for deletion."""
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Audio Volume Bounds
*For any* audio setting (master, music, sfx, voice), the value SHALL be clamped to the range [0, 100].
**Validates: Requirements 5.1, 5.2**

### Property 2: Font Scale Bounds
*For any* font_scale setting, the value SHALL be clamped to the range [0.8, 1.5].
**Validates: Requirements 10.3**

### Property 3: Settings Round-Trip Persistence
*For any* valid UserSettings object, saving to the database and then loading SHALL produce an equivalent object.
**Validates: Requirements 2.3, 11.1**

### Property 4: Keybind Uniqueness
*For any* keybind configuration, no two actions SHALL have the same key binding (conflict detection).
**Validates: Requirements 7.2, 7.3**

### Property 5: Notification Master Toggle
*For any* notification preferences where email_enabled is false, all email-related notifications SHALL be effectively disabled regardless of sub-toggle values.
**Validates: Requirements 4.3**

### Property 6: Video Quality Enum Validity
*For any* video_quality setting, the value SHALL be one of: 'low', 'medium', 'high', 'ultra'.
**Validates: Requirements 6.1, 6.2**

### Property 7: Colorblind Mode Enum Validity
*For any* colorblind_mode setting, the value SHALL be one of: 'none', 'protanopia', 'deuteranopia', 'tritanopia'.
**Validates: Requirements 10.2**

### Property 8: FPS Limit Enum Validity
*For any* fps_limit setting, the value SHALL be one of: 0, 30, 60, 120.
**Validates: Requirements 6.3**

### Property 9: Privacy Toggle Persistence
*For any* privacy setting toggle change, the new value SHALL be persisted to the database and reflected on subsequent loads.
**Validates: Requirements 3.2**

### Property 10: 2FA State Consistency
*For any* user, if two_factor_enabled is true, then two_factor_secret SHALL be non-null and valid.
**Validates: Requirements 8.3, 8.4**

### Property 11: Settings Initialization
*For any* new user, default settings SHALL be created with all default values as specified in the schema.
**Validates: Requirements 2.1, 2.2**

### Property 12: Keybind Default Reset
*For any* keybind reset action, the keybinds SHALL return to the default values defined in DEFAULT_KEYBINDS.
**Validates: Requirements 7.4**

## Error Handling

| Scenario | Handling |
|----------|----------|
| Settings load failure | Display error state with retry button, use cached values |
| Settings save failure | Show error toast, revert optimistic update, enable retry |
| 2FA setup failure | Show error message, allow retry |
| 2FA verification failure | Show "Invalid code" message, allow retry |
| Data export failure | Show error toast, log for support |
| Account deletion failure | Show error message, do not sign out |
| Network timeout | Show timeout message, queue for retry |
| Invalid settings value | Clamp to valid range, show warning |
| Keybind conflict | Show conflict warning, prevent save until resolved |

## Testing Strategy

### Property-Based Testing (Hypothesis)

The following properties will be tested using the Hypothesis library with minimum 100 iterations per test:

1. **Audio Volume Bounds**: Generate random integers, verify clamping to [0, 100]
2. **Font Scale Bounds**: Generate random floats, verify clamping to [0.8, 1.5]
3. **Settings Round-Trip**: Generate valid settings, verify persistence round-trip
4. **Keybind Uniqueness**: Generate keybind configs, verify conflict detection
5. **Notification Master Toggle**: Generate notification states, verify master toggle behavior
6. **Video Quality Enum**: Generate strings, verify enum validation
7. **Colorblind Mode Enum**: Generate strings, verify enum validation
8. **FPS Limit Enum**: Generate integers, verify enum validation
9. **Privacy Toggle Persistence**: Generate toggle states, verify persistence
10. **2FA State Consistency**: Generate 2FA states, verify consistency
11. **Settings Initialization**: Generate user IDs, verify default creation
12. **Keybind Default Reset**: Generate modified keybinds, verify reset

### Unit Tests

- Component rendering with various props
- Toggle state management
- Slider value handling
- Keybind capture logic
- 2FA code validation
- Form validation

### Integration Tests

- Full settings save/load flow
- 2FA setup and verification flow
- Account deletion flow
- Settings sync across tabs
- Offline queue and sync

## Animation Specifications

### Micro-interactions

| Element | Trigger | Animation |
|---------|---------|-----------|
| SettingsToggle | Click | Slide transition 200ms ease |
| SettingsSlider | Drag | Real-time value update |
| SettingsSection | Expand/Collapse | Height transition 300ms ease-out |
| KeybindInput | Capture mode | Pulse border animation |
| Save button | Success | Checkmark fade-in 200ms |

### Loading States

| Component | Skeleton |
|-----------|----------|
| SettingsSection | Full section skeleton with shimmer |
| SettingsToggle | Toggle placeholder with shimmer |
| SettingsSlider | Slider track skeleton |

## Migration Notes

### Component Migration

1. **Settings.tsx** → Integrate enterprise components, add all sections
2. **useProfile.ts** → Extract settings logic to useSettings.ts
3. **profile.ts types** → Add settings types to settings.ts

### Import Updates

```typescript
// Before
import { useProfile } from '../hooks/useProfile';
import type { PrivacySettingsUpdate } from '../types/profile';

// After
import { useSettings } from '../hooks/useSettings';
import {
  SettingsHeader,
  SettingsSection,
  SettingsToggle,
  SettingsSlider,
  SettingsSelect,
  KeybindInput,
  TwoFactorSetup,
  AccountDangerZone,
} from '@/components/settings/enterprise';
import type { UserSettings, PrivacySettings, AudioSettings } from '../types/settings';
```

