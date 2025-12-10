-- Migration: 032_practice_stats.sql
-- Feature: single-player-enhancement
-- Validates: Requirements 4.5, 7.1, 7.4

-- Personal best records for authenticated users
CREATE TABLE IF NOT EXISTS practice_personal_bests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  practice_type VARCHAR(20) NOT NULL CHECK (practice_type IN ('quiz_only', 'combat_only', 'full_game')),
  score INTEGER NOT NULL,
  accuracy DECIMAL(5,2),
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, category, difficulty, practice_type)
);

-- Practice session history for analytics
CREATE TABLE IF NOT EXISTS practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category VARCHAR(50) NOT NULL,
  difficulty VARCHAR(10) NOT NULL,
  practice_type VARCHAR(20) NOT NULL,
  final_score INTEGER NOT NULL,
  bot_score INTEGER NOT NULL,
  accuracy DECIMAL(5,2),
  average_answer_time DECIMAL(6,2),
  longest_streak INTEGER,
  kills INTEGER DEFAULT 0,
  deaths INTEGER DEFAULT 0,
  damage_dealt INTEGER DEFAULT 0,
  duration_seconds INTEGER NOT NULL,
  effective_difficulty DECIMAL(3,2),
  is_personal_best BOOLEAN DEFAULT FALSE,
  xp_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tutorial completion tracking
CREATE TABLE IF NOT EXISTS user_tutorial_status (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  practice_tutorial_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ
);

-- Daily practice tracking for bonus
CREATE TABLE IF NOT EXISTS practice_daily_counts (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_count INTEGER DEFAULT 0,
  daily_bonus_claimed BOOLEAN DEFAULT FALSE,
  
  PRIMARY KEY (user_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_practice_pb_user ON practice_personal_bests(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_created ON practice_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_practice_daily_user_date ON practice_daily_counts(user_id, date);

-- Enable RLS
ALTER TABLE practice_personal_bests ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tutorial_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_daily_counts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for practice_personal_bests
CREATE POLICY "Users can view own personal bests"
  ON practice_personal_bests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own personal bests"
  ON practice_personal_bests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personal bests"
  ON practice_personal_bests FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for practice_sessions
CREATE POLICY "Users can view own sessions"
  ON practice_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON practice_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_tutorial_status
CREATE POLICY "Users can view own tutorial status"
  ON user_tutorial_status FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tutorial status"
  ON user_tutorial_status FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tutorial status"
  ON user_tutorial_status FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for practice_daily_counts
CREATE POLICY "Users can view own daily counts"
  ON practice_daily_counts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily counts"
  ON practice_daily_counts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily counts"
  ON practice_daily_counts FOR UPDATE
  USING (auth.uid() = user_id);
