-- Clean up all sessions policies and create fresh ones
-- This migration completely removes all existing policies to avoid recursion issues

-- Disable RLS temporarily to clean up policies
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies for sessions table (comprehensive cleanup)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'sessions' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON sessions';
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create completely fresh, simple policies
-- Policy 1: View access
CREATE POLICY "sessions_select" ON sessions
  FOR SELECT USING (
    -- User created this session
    user_id = auth.uid()
    OR
    -- Session is public
    visibility = 'public'
  );

-- Policy 2: Insert access
CREATE POLICY "sessions_insert" ON sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy 3: Update access  
CREATE POLICY "sessions_update" ON sessions
  FOR UPDATE USING (user_id = auth.uid());

-- Policy 4: Delete access
CREATE POLICY "sessions_delete" ON sessions
  FOR DELETE USING (user_id = auth.uid());

-- Add comments
COMMENT ON POLICY "sessions_select" ON sessions IS 'Users can view their own sessions or public sessions';
COMMENT ON POLICY "sessions_insert" ON sessions IS 'Users can insert their own sessions';
COMMENT ON POLICY "sessions_update" ON sessions IS 'Users can update their own sessions';
COMMENT ON POLICY "sessions_delete" ON sessions IS 'Users can delete their own sessions';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Sessions table policies completely rebuilt from scratch';
  RAISE NOTICE 'All recursion issues should be resolved';
  RAISE NOTICE 'Users can view sessions they created or public sessions';
  RAISE NOTICE 'Application layer will handle invited sessions access';
END $$;
