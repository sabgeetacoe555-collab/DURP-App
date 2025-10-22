-- Add missing fields from Phase 1: Enhanced Session Creation Flow
-- This migration ensures all fields from 20250713025349_enhanced_session_creation_phase_1.sql are present

-- Add missing social scheduling columns with safe checks
DO $$
BEGIN
    -- Add allow_guests column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' AND column_name = 'allow_guests'
    ) THEN
        ALTER TABLE sessions ADD COLUMN allow_guests BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added allow_guests column to sessions table';
    ELSE
        RAISE NOTICE 'allow_guests column already exists';
    END IF;
    
    -- Add visibility column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' AND column_name = 'visibility'
    ) THEN
        ALTER TABLE sessions ADD COLUMN visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private'));
        RAISE NOTICE 'Added visibility column to sessions table';
    ELSE
        RAISE NOTICE 'visibility column already exists';
    END IF;
    
    -- Add dupr_min column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' AND column_name = 'dupr_min'
    ) THEN
        ALTER TABLE sessions ADD COLUMN dupr_min DECIMAL(3,2) CHECK (dupr_min >= 1.0 AND dupr_min <= 8.0);
        RAISE NOTICE 'Added dupr_min column to sessions table';
    ELSE
        RAISE NOTICE 'dupr_min column already exists';
    END IF;
    
    -- Add dupr_max column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' AND column_name = 'dupr_max'
    ) THEN
        ALTER TABLE sessions ADD COLUMN dupr_max DECIMAL(3,2) CHECK (dupr_max >= 1.0 AND dupr_max <= 8.0);
        RAISE NOTICE 'Added dupr_max column to sessions table';
    ELSE
        RAISE NOTICE 'dupr_max column already exists';
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' AND column_name = 'status'
    ) THEN
        ALTER TABLE sessions ADD COLUMN status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'completed'));
        RAISE NOTICE 'Added status column to sessions table';
    ELSE
        RAISE NOTICE 'status column already exists';
    END IF;
    
    -- Check if max_players exists (should already exist from earlier migration)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' AND column_name = 'max_players'
    ) THEN
        ALTER TABLE sessions ADD COLUMN max_players INTEGER DEFAULT 4;
        RAISE NOTICE 'Added max_players column to sessions table';
    ELSE
        RAISE NOTICE 'max_players column already exists';
    END IF;
END $$;

-- Add indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_sessions_visibility ON sessions(visibility);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_dupr_range ON sessions(dupr_min, dupr_max) WHERE dupr_min IS NOT NULL AND dupr_max IS NOT NULL;

-- Update Row Level Security policies for enhanced sessions (only if they don't exist)
DO $$
BEGIN
    -- Check if the policy exists before trying to drop it
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sessions' AND policyname = 'Users can view accessible sessions'
    ) THEN
        DROP POLICY "Users can view accessible sessions" ON sessions;
        RAISE NOTICE 'Dropped existing "Users can view accessible sessions" policy';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sessions' AND policyname = 'Users can insert their own sessions'
    ) THEN
        DROP POLICY "Users can insert their own sessions" ON sessions;
        RAISE NOTICE 'Dropped existing "Users can insert their own sessions" policy';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sessions' AND policyname = 'Users can update their own sessions'
    ) THEN
        DROP POLICY "Users can update their own sessions" ON sessions;
        RAISE NOTICE 'Dropped existing "Users can update their own sessions" policy';
    END IF;
END $$;

-- Create new RLS policies for enhanced sessions
CREATE POLICY "Users can view accessible sessions" ON sessions
  FOR SELECT USING (
    visibility = 'public' OR
    auth.uid() = user_id
  );

CREATE POLICY "Users can insert their own sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Add helpful comments
COMMENT ON COLUMN sessions.allow_guests IS 'Whether session participants can bring +1 guests';
COMMENT ON COLUMN sessions.visibility IS 'Session visibility: public sessions can be discovered by anyone, private sessions are invite-only';
COMMENT ON COLUMN sessions.dupr_min IS 'Minimum DUPR rating for participants (optional)';
COMMENT ON COLUMN sessions.dupr_max IS 'Maximum DUPR rating for participants (optional)';
COMMENT ON COLUMN sessions.status IS 'Current session status: scheduled, cancelled, or completed';

-- Verify the migration completed successfully
DO $$
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    col_name TEXT;
BEGIN
    -- Check for required columns
    FOR col_name IN SELECT unnest(ARRAY['allow_guests', 'visibility', 'dupr_min', 'dupr_max', 'status', 'max_players'])
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'sessions' AND column_name = col_name
        ) THEN
            missing_columns := array_append(missing_columns, col_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE EXCEPTION 'Migration incomplete. Missing columns: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE 'Migration completed successfully. All Phase 1 fields are present.';
    END IF;
END $$;
