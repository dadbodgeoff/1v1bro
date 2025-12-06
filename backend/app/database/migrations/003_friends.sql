-- ============================================
-- Friends & Game Invites Migration
-- Version: 003
-- Description: Adds friend system with requests, blocking, and game invites
-- ============================================

-- ============================================
-- FRIENDSHIPS TABLE
-- Stores friend relationships and requests
-- ============================================
CREATE TABLE IF NOT EXISTS friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Prevent duplicate relationships
    UNIQUE(user_id, friend_id),
    -- Prevent self-friending
    CHECK (user_id != friend_id)
);

-- Enable RLS
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Users can view friendships they're part of
CREATE POLICY "Users can view own friendships" ON friendships
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can create friend requests (as requester)
CREATE POLICY "Users can send friend requests" ON friendships
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update friendships they're part of (accept/block)
CREATE POLICY "Users can update own friendships" ON friendships
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can delete friendships they're part of
CREATE POLICY "Users can delete own friendships" ON friendships
    FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- ============================================
-- GAME INVITES TABLE
-- Stores pending game invitations between friends
-- ============================================
CREATE TABLE IF NOT EXISTS game_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lobby_code VARCHAR(6) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Prevent self-invites
    CHECK (from_user_id != to_user_id)
);

-- Enable RLS
ALTER TABLE game_invites ENABLE ROW LEVEL SECURITY;

-- Users can view invites they sent or received
CREATE POLICY "Users can view own invites" ON game_invites
    FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Users can create invites (as sender)
CREATE POLICY "Users can send invites" ON game_invites
    FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- Users can update invites they received (accept/decline)
CREATE POLICY "Users can respond to invites" ON game_invites
    FOR UPDATE USING (auth.uid() = to_user_id);

-- Users can delete their own sent invites
CREATE POLICY "Users can cancel own invites" ON game_invites
    FOR DELETE USING (auth.uid() = from_user_id);

-- ============================================
-- USER PROFILE EXTENSION
-- Add online status visibility preference
-- ============================================
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS show_online_status BOOLEAN DEFAULT true;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Friendships indexes
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
CREATE INDEX IF NOT EXISTS idx_friendships_user_status ON friendships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_status ON friendships(friend_id, status);

-- Game invites indexes
CREATE INDEX IF NOT EXISTS idx_game_invites_to_user ON game_invites(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_game_invites_from_user ON game_invites(from_user_id);
CREATE INDEX IF NOT EXISTS idx_game_invites_expires ON game_invites(expires_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_game_invites_lobby ON game_invites(lobby_code);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
DROP TRIGGER IF EXISTS update_friendships_updated_at ON friendships;
CREATE TRIGGER update_friendships_updated_at
    BEFORE UPDATE ON friendships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get all friends for a user (accepted only)
CREATE OR REPLACE FUNCTION get_friends(p_user_id UUID)
RETURNS TABLE (
    friendship_id UUID,
    friend_user_id UUID,
    display_name VARCHAR,
    avatar_url TEXT,
    show_online_status BOOLEAN,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id as friendship_id,
        CASE WHEN f.user_id = p_user_id THEN f.friend_id ELSE f.user_id END as friend_user_id,
        up.display_name,
        up.avatar_url,
        up.show_online_status,
        f.created_at
    FROM friendships f
    JOIN user_profiles up ON up.id = CASE WHEN f.user_id = p_user_id THEN f.friend_id ELSE f.user_id END
    WHERE (f.user_id = p_user_id OR f.friend_id = p_user_id)
      AND f.status = 'accepted'
    ORDER BY up.display_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get pending friend requests received
CREATE OR REPLACE FUNCTION get_pending_requests(p_user_id UUID)
RETURNS TABLE (
    friendship_id UUID,
    requester_id UUID,
    display_name VARCHAR,
    avatar_url TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id as friendship_id,
        f.user_id as requester_id,
        up.display_name,
        up.avatar_url,
        f.created_at
    FROM friendships f
    JOIN user_profiles up ON up.id = f.user_id
    WHERE f.friend_id = p_user_id
      AND f.status = 'pending'
    ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get sent friend requests (pending)
CREATE OR REPLACE FUNCTION get_sent_requests(p_user_id UUID)
RETURNS TABLE (
    friendship_id UUID,
    recipient_id UUID,
    display_name VARCHAR,
    avatar_url TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id as friendship_id,
        f.friend_id as recipient_id,
        up.display_name,
        up.avatar_url,
        f.created_at
    FROM friendships f
    JOIN user_profiles up ON up.id = f.friend_id
    WHERE f.user_id = p_user_id
      AND f.status = 'pending'
    ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if two users are friends
CREATE OR REPLACE FUNCTION are_friends(p_user_id UUID, p_other_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM friendships
        WHERE ((user_id = p_user_id AND friend_id = p_other_id)
            OR (user_id = p_other_id AND friend_id = p_user_id))
          AND status = 'accepted'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is blocked by another
CREATE OR REPLACE FUNCTION is_blocked(p_user_id UUID, p_by_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM friendships
        WHERE user_id = p_by_user_id 
          AND friend_id = p_user_id
          AND status = 'blocked'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if there's any relationship between users
CREATE OR REPLACE FUNCTION get_relationship_status(p_user_id UUID, p_other_id UUID)
RETURNS TABLE (
    relationship_exists BOOLEAN,
    status VARCHAR,
    is_requester BOOLEAN,
    friendship_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        true as relationship_exists,
        f.status,
        f.user_id = p_user_id as is_requester,
        f.id as friendship_id
    FROM friendships f
    WHERE (f.user_id = p_user_id AND f.friend_id = p_other_id)
       OR (f.user_id = p_other_id AND f.friend_id = p_user_id)
    LIMIT 1;
    
    -- If no rows returned, return default
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::VARCHAR, false, NULL::UUID;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Expire old game invites (call periodically or via cron)
CREATE OR REPLACE FUNCTION expire_old_invites()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE game_invites
    SET status = 'expired'
    WHERE status = 'pending'
      AND expires_at < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION get_friends TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_requests TO authenticated;
GRANT EXECUTE ON FUNCTION get_sent_requests TO authenticated;
GRANT EXECUTE ON FUNCTION are_friends TO authenticated;
GRANT EXECUTE ON FUNCTION is_blocked TO authenticated;
GRANT EXECUTE ON FUNCTION get_relationship_status TO authenticated;
GRANT EXECUTE ON FUNCTION expire_old_invites TO service_role;
