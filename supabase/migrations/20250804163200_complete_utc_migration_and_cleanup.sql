-- Complete UTC migration and cleanup of legacy date/time fields
-- This migration converts all existing sessions to use UTC timestamps and removes legacy fields

-- Step 1: Migrate existing session data to UTC timestamps
-- Convert date + start_time/end_time to proper UTC timestamps
UPDATE sessions 
SET 
  session_datetime = CASE 
    WHEN date IS NOT NULL AND start_time IS NOT NULL THEN
      (date + start_time::interval) AT TIME ZONE 'UTC'
    ELSE NULL
  END,
  end_datetime = CASE 
    WHEN date IS NOT NULL AND end_time IS NOT NULL THEN
      (date + end_time::interval) AT TIME ZONE 'UTC'
    ELSE NULL
  END
WHERE 
  session_datetime IS NULL 
  AND date IS NOT NULL 
  AND start_time IS NOT NULL;

-- Step 2: Report migration results
DO $$
DECLARE
  migrated_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count FROM sessions WHERE session_datetime IS NOT NULL;
  SELECT COUNT(*) INTO total_count FROM sessions;
  
  RAISE NOTICE 'Migration complete: % of % sessions now have UTC timestamps', 
    migrated_count, total_count;
    
  -- Log any sessions that couldn't be migrated
  IF total_count > migrated_count THEN
    RAISE NOTICE 'Warning: % sessions could not be migrated (missing date/time data)', 
      (total_count - migrated_count);
  END IF;
END $$;

-- Step 3: Delete sessions that couldn't be migrated (incomplete data)
-- These would be sessions without proper date/time information
DELETE FROM sessions 
WHERE session_datetime IS NULL;

-- Step 4: Make UTC timestamp fields required for new sessions
ALTER TABLE sessions ALTER COLUMN session_datetime SET NOT NULL;
ALTER TABLE sessions ALTER COLUMN end_datetime SET NOT NULL;

-- Step 5: Drop legacy date/time columns
-- These are no longer needed since we're using UTC timestamps
ALTER TABLE sessions DROP COLUMN IF EXISTS date;
ALTER TABLE sessions DROP COLUMN IF EXISTS time;
ALTER TABLE sessions DROP COLUMN IF EXISTS start_time;
ALTER TABLE sessions DROP COLUMN IF EXISTS end_time;

-- Step 6: Drop any indexes on the old columns (if they exist)
DROP INDEX IF EXISTS sessions_date_idx;
DROP INDEX IF EXISTS sessions_time_idx;
DROP INDEX IF EXISTS sessions_start_time_idx;

-- Step 7: Add helpful comments
COMMENT ON COLUMN sessions.session_datetime IS 'Session start time in UTC (required for all new sessions)';
COMMENT ON COLUMN sessions.end_datetime IS 'Session end time in UTC (required for all new sessions)';

-- Step 8: Update any remaining RLS policies that might reference old columns
-- (Most policies should already be using user_id, but let's be thorough)

-- Step 9: Final validation
DO $$
DECLARE
  remaining_sessions INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_sessions FROM sessions;
  RAISE NOTICE 'Final count: % sessions with complete UTC timestamp data', remaining_sessions;
END $$;
