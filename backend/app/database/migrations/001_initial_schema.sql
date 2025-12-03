-- 1v1 Bro Initial Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- User Profiles (extends Supabase Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(50),
    avatar_url TEXT,
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- Game Lobbies
-- ============================================
CREATE TABLE IF NOT EXISTS lobbies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(6) UNIQUE NOT NULL,
    host_id UUID NOT NULL REFERENCES auth.users(id),
    opponent_id UUID REFERENCES auth.users(id),
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'abandoned')),
    game_mode VARCHAR(50) DEFAULT 'fortnite',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE lobbies ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view lobbies
CREATE POLICY "Authenticated users can view lobbies" ON lobbies
    FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can create lobbies
CREATE POLICY "Authenticated users can create lobbies" ON lobbies
    FOR INSERT WITH CHECK (auth.uid() = host_id);

-- Host can update their lobby
CREATE POLICY "Host can update lobby" ON lobbies
    FOR UPDATE USING (auth.uid() = host_id OR auth.uid() = opponent_id);

-- ============================================
-- Completed Games
-- ============================================
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lobby_id UUID NOT NULL REFERENCES lobbies(id),
    winner_id UUID REFERENCES auth.users(id),
    player1_id UUID NOT NULL REFERENCES auth.users(id),
    player1_score INTEGER NOT NULL DEFAULT 0,
    player2_id UUID NOT NULL REFERENCES auth.users(id),
    player2_score INTEGER NOT NULL DEFAULT 0,
    questions_data JSONB NOT NULL,
    answers_data JSONB,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Players can view games they participated in
CREATE POLICY "Players can view their games" ON games
    FOR SELECT USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Service role can insert games (via backend)
CREATE POLICY "Service can insert games" ON games
    FOR INSERT WITH CHECK (true);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_lobbies_code ON lobbies(code);
CREATE INDEX IF NOT EXISTS idx_lobbies_status ON lobbies(status);
CREATE INDEX IF NOT EXISTS idx_lobbies_host ON lobbies(host_id);
CREATE INDEX IF NOT EXISTS idx_lobbies_created ON lobbies(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_games_players ON games(player1_id, player2_id);
CREATE INDEX IF NOT EXISTS idx_games_winner ON games(winner_id);
CREATE INDEX IF NOT EXISTS idx_games_completed ON games(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_lobby ON games(lobby_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles(display_name);

-- ============================================
-- Updated_at Trigger Function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Apply trigger to tables with updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lobbies_updated_at ON lobbies;
CREATE TRIGGER update_lobbies_updated_at
    BEFORE UPDATE ON lobbies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Function to auto-create user profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
