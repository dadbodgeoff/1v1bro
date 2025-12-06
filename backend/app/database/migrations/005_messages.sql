-- ============================================================================
-- Direct Messaging System
-- Migration: 005_messages.sql
-- ============================================================================

-- Conversations table (1:1 between two users)
-- user1_id is always the smaller UUID to ensure uniqueness
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure user1_id < user2_id for consistent ordering
    CONSTRAINT conversations_user_order CHECK (user1_id < user2_id),
    -- Unique conversation per pair
    CONSTRAINT conversations_unique_pair UNIQUE (user1_id, user2_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ DEFAULT NULL,
    
    -- Content length limit
    CONSTRAINT messages_content_length CHECK (char_length(content) <= 500)
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Fast lookup of conversations by user
CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user2_id);

-- Fast message retrieval by conversation (newest first)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_time 
    ON messages(conversation_id, created_at DESC);

-- Fast unread message count
CREATE INDEX IF NOT EXISTS idx_messages_unread 
    ON messages(conversation_id, sender_id) 
    WHERE read_at IS NULL;

-- ============================================================================
-- Functions
-- ============================================================================

-- Get or create conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(p_user1 UUID, p_user2 UUID)
RETURNS UUID AS $$
DECLARE
    v_conversation_id UUID;
    v_smaller UUID;
    v_larger UUID;
BEGIN
    -- Ensure consistent ordering
    IF p_user1 < p_user2 THEN
        v_smaller := p_user1;
        v_larger := p_user2;
    ELSE
        v_smaller := p_user2;
        v_larger := p_user1;
    END IF;
    
    -- Try to find existing conversation
    SELECT id INTO v_conversation_id
    FROM conversations
    WHERE user1_id = v_smaller AND user2_id = v_larger;
    
    -- Create if not exists
    IF v_conversation_id IS NULL THEN
        INSERT INTO conversations (user1_id, user2_id)
        VALUES (v_smaller, v_larger)
        RETURNING id INTO v_conversation_id;
    END IF;
    
    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Update conversation timestamp when new message is sent
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_timestamp
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can only see their own conversations
CREATE POLICY conversations_select_policy ON conversations
    FOR SELECT
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Users can only insert conversations they're part of
CREATE POLICY conversations_insert_policy ON conversations
    FOR INSERT
    WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Users can only see messages in their conversations
CREATE POLICY messages_select_policy ON messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = messages.conversation_id
            AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
        )
    );

-- Users can only send messages in their conversations
CREATE POLICY messages_insert_policy ON messages
    FOR INSERT
    WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = conversation_id
            AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
        )
    );

-- Users can only update read_at on messages sent TO them (not by them)
CREATE POLICY messages_update_policy ON messages
    FOR UPDATE
    USING (
        sender_id != auth.uid()
        AND EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = messages.conversation_id
            AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
        )
    )
    WITH CHECK (
        -- Only allow updating read_at
        sender_id = messages.sender_id
        AND content = messages.content
        AND created_at = messages.created_at
    );

-- ============================================================================
-- Views for easier querying
-- ============================================================================

-- Conversation list with last message and unread count
CREATE OR REPLACE VIEW conversation_summaries AS
SELECT 
    c.id AS conversation_id,
    c.user1_id,
    c.user2_id,
    c.updated_at,
    (
        SELECT json_build_object(
            'id', m.id,
            'content', m.content,
            'sender_id', m.sender_id,
            'created_at', m.created_at
        )
        FROM messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
    ) AS last_message,
    (
        SELECT COUNT(*)
        FROM messages m
        WHERE m.conversation_id = c.id
        AND m.read_at IS NULL
        AND m.sender_id != auth.uid()
    ) AS unread_count
FROM conversations c
WHERE c.user1_id = auth.uid() OR c.user2_id = auth.uid()
ORDER BY c.updated_at DESC;
