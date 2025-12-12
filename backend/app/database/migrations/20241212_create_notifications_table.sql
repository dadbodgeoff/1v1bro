-- Create notifications table
-- Run this migration in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('friend_request', 'match_invite', 'reward', 'system')),
    title VARCHAR(100) NOT NULL,
    message VARCHAR(500) NOT NULL,
    action_url VARCHAR(200),
    metadata JSONB,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
    ON notifications FOR DELETE
    USING (auth.uid() = user_id);

-- Policy: Service role can insert notifications for any user
CREATE POLICY "Service can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (TRUE);

-- Add comment for documentation
COMMENT ON TABLE notifications IS 'User notifications for friend requests, match invites, rewards, and system messages';
COMMENT ON COLUMN notifications.type IS 'Notification type: friend_request, match_invite, reward, system';
COMMENT ON COLUMN notifications.metadata IS 'Additional data like friend_id, lobby_code, reward_type';
