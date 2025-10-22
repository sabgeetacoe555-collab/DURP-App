-- Add missing UTC datetime columns
-- This migration adds the session_datetime and end_datetime columns that should have been added by the UTC migration

-- Step 1: Add UTC timestamp columns if they don't exist
DO $$
BEGIN
    -- Add session_datetime column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' AND column_name = 'session_datetime'
    ) THEN
        ALTER TABLE sessions ADD COLUMN session_datetime TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added session_datetime column to sessions table';
    ELSE
        RAISE NOTICE 'session_datetime column already exists';
    END IF;
    
    -- Add end_datetime column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' AND column_name = 'end_datetime'
    ) THEN
        ALTER TABLE sessions ADD COLUMN end_datetime TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added end_datetime column to sessions table';
    ELSE
        RAISE NOTICE 'end_datetime column already exists';
    END IF;
END $$;

-- Step 2: Add indexes for the new timestamp columns
CREATE INDEX IF NOT EXISTS sessions_session_datetime_idx ON sessions(session_datetime);
CREATE INDEX IF NOT EXISTS sessions_end_datetime_idx ON sessions(end_datetime);

-- Step 3: Add helpful comments
COMMENT ON COLUMN sessions.session_datetime IS 'Session start time in UTC (TIMESTAMP WITH TIME ZONE)';
COMMENT ON COLUMN sessions.end_datetime IS 'Session end time in UTC (TIMESTAMP WITH TIME ZONE)';

-- Step 4: Verify the migration completed successfully
DO $$
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    col_name TEXT;
BEGIN
    -- Check for required columns
    FOR col_name IN SELECT unnest(ARRAY['session_datetime', 'end_datetime'])
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
        RAISE NOTICE 'UTC datetime migration completed successfully. All required columns are present.';
    END IF;
END $$;
