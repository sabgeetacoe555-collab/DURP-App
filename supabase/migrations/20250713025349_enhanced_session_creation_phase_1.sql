-- Phase 1: Enhanced Session Creation Flow
-- Add social scheduling fields to existing sessions table

-- First, rename the existing 'time' column to 'start_time' for clarity
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name='sessions' AND column_name='start_time'
  ) THEN
    ALTER TABLE sessions RENAME COLUMN time TO start_time;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name='sessions' AND column_name='end_time'
  ) THEN
    ALTER TABLE sessions ADD COLUMN end_time TIME;
  END IF;
END $$;

-- Update existing records to have end_time 2 hours after start_time
UPDATE sessions SET end_time = (start_time + INTERVAL '2 hours')::time;

-- Add social scheduling columns
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private'));
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS max_players INTEGER DEFAULT 4;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS allow_guests BOOLEAN DEFAULT false;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS dupr_min DECIMAL(3,2) CHECK (dupr_min >= 1.0 AND dupr_min <= 8.0);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS dupr_max DECIMAL(3,2) CHECK (dupr_max >= 1.0 AND dupr_max <= 8.0);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'completed'));

-- Add indexes for performance
CREATE INDEX idx_sessions_visibility ON sessions(visibility);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_dupr_range ON sessions(dupr_min, dupr_max) WHERE dupr_min IS NOT NULL AND dupr_max IS NOT NULL;

-- Update Row Level Security policies for enhanced sessions
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view accessible sessions" ON sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON sessions;

-- Users can view public sessions or their own sessions
CREATE POLICY "Users can view accessible sessions" ON sessions
  FOR SELECT USING (
    visibility = 'public' OR
    auth.uid() = user_id
  );

-- Users can only insert their own sessions
CREATE POLICY "Users can insert their own sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update their own sessions" ON sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Add helpful comments
COMMENT ON COLUMN sessions.start_time IS 'Session start time (renamed from time for clarity)';
COMMENT ON COLUMN sessions.end_time IS 'Session end time to define duration';
COMMENT ON COLUMN sessions.visibility IS 'Session visibility: public sessions can be discovered by anyone, private sessions are invite-only';
COMMENT ON COLUMN sessions.max_players IS 'Maximum number of players allowed in the session (2-8)';
COMMENT ON COLUMN sessions.allow_guests IS 'Whether session participants can bring +1 guests';
COMMENT ON COLUMN sessions.dupr_min IS 'Minimum DUPR rating for participants (optional)';
COMMENT ON COLUMN sessions.dupr_max IS 'Maximum DUPR rating for participants (optional)';
COMMENT ON COLUMN sessions.status IS 'Current session status: scheduled, cancelled, or completed';
