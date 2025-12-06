-- 006_profiles_extended.sql
-- Extended profile fields for user customization, privacy, and 2FA
-- Requirements: 2.1, 2.8, 12.8

-- ============================================
-- Add Profile Customization Columns
-- ============================================
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS bio VARCHAR(200),
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS banner_color VARCHAR(7) DEFAULT '#1a1a2e',
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_xp BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS title VARCHAR(50) DEFAULT 'Rookie',
ADD COLUMN IF NOT EXISTS country VARCHAR(2),
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';

-- ============================================
-- Add Privacy Settings Columns
-- ============================================
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS accept_friend_requests BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_messages BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS theme VARCHAR(10) DEFAULT 'dark';

-- ============================================
-- Add 2FA Columns
-- ============================================
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(32);

-- ============================================
-- Create Indexes for Query Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_country ON user_profiles(country);
CREATE INDEX IF NOT EXISTS idx_user_profiles_level ON user_profiles(level DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_total_xp ON user_profiles(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_public ON user_profiles(is_public) WHERE is_public = true;

-- ============================================
-- Update handle_new_user function to include new defaults
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (
        id, 
        display_name,
        level,
        total_xp,
        title,
        is_public,
        accept_friend_requests,
        allow_messages,
        theme,
        two_factor_enabled
    )
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        1,
        0,
        'Rookie',
        true,
        true,
        true,
        'dark',
        false
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DOWN Migration (for rollback)
-- ============================================
-- To rollback, run:
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS bio;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS banner_url;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS banner_color;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS level;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS total_xp;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS title;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS country;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS social_links;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS is_public;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS accept_friend_requests;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS allow_messages;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS theme;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS two_factor_enabled;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS two_factor_secret;
-- DROP INDEX IF EXISTS idx_user_profiles_country;
-- DROP INDEX IF EXISTS idx_user_profiles_level;
-- DROP INDEX IF EXISTS idx_user_profiles_total_xp;
-- DROP INDEX IF EXISTS idx_user_profiles_is_public;
