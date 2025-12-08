-- ============================================
-- 014_settings_tables.sql
-- Settings tables for notification preferences and user settings
-- Requirements: 2.1, 2.2
-- ============================================

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

-- Notification preferences policies
CREATE POLICY "Users can view own notification preferences" ON notification_preferences
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notification preferences" ON notification_preferences
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notification preferences" ON notification_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Triggers for updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
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

-- ============================================
-- Trigger to auto-create settings on new user
-- ============================================
CREATE OR REPLACE FUNCTION public.initialize_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_init_settings ON user_profiles;
CREATE TRIGGER on_profile_created_init_settings
    AFTER INSERT ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.initialize_user_settings();

-- ============================================
-- To rollback, run:
-- DROP TRIGGER IF EXISTS on_profile_created_init_settings ON user_profiles;
-- DROP FUNCTION IF EXISTS public.initialize_user_settings();
-- DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
-- DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
-- DROP TABLE IF EXISTS user_settings;
-- DROP TABLE IF EXISTS notification_preferences;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS show_match_history;
-- ============================================
