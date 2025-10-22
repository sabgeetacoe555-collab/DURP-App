-- Fix infinite recursion in sessions table policies
-- This migration completely rebuilds the sessions RLS policies to avoid recursion

-- First, disable RLS temporarily to avoid issues during policy updates
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies for sessions table
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

-- Create simple, non-recursive policies
-- Policy 1: Users can view public sessions or their own sessions
CREATE POLICY "sessions_view_policy" ON sessions
  FOR SELECT USING (
    visibility = 'public' OR user_id = auth.uid()
  );

-- Policy 2: Users can insert their own sessions
CREATE POLICY "sessions_insert_policy" ON sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy 3: Users can update their own sessions
CREATE POLICY "sessions_update_policy" ON sessions
  FOR UPDATE USING (user_id = auth.uid());

-- Policy 4: Users can delete their own sessions
CREATE POLICY "sessions_delete_policy" ON sessions
  FOR DELETE USING (user_id = auth.uid());

-- Add helpful comments
COMMENT ON POLICY "sessions_view_policy" ON sessions IS 'Users can view public sessions or their own sessions';
COMMENT ON POLICY "sessions_insert_policy" ON sessions IS 'Users can insert their own sessions';
COMMENT ON POLICY "sessions_update_policy" ON sessions IS 'Users can update their own sessions';
COMMENT ON POLICY "sessions_delete_policy" ON sessions IS 'Users can delete their own sessions';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Sessions table RLS policies have been completely rebuilt';
  RAISE NOTICE 'Infinite recursion issue should be resolved';
END $$;
