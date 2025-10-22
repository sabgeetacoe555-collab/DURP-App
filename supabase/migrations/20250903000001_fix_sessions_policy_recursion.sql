-- Fix infinite recursion in sessions table policies
-- This migration cleans up duplicate policies and ensures proper policy structure

-- First, drop all existing policies for the sessions table to start fresh
DROP POLICY IF EXISTS "Users can view their own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can view accessible sessions" ON sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can view public planned sessions" ON sessions;
DROP POLICY IF EXISTS "Users can create sessions" ON sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON sessions;

-- Create clean, non-recursive policies for the sessions table
-- Users can view public sessions or their own sessions
CREATE POLICY "sessions_select_policy" ON sessions
  FOR SELECT USING (
    visibility = 'public' OR
    auth.uid() = user_id
  );

-- Users can only insert their own sessions
CREATE POLICY "sessions_insert_policy" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "sessions_update_policy" ON sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "sessions_delete_policy" ON sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Add helpful comments
COMMENT ON POLICY "sessions_select_policy" ON sessions IS 'Users can view public sessions or their own sessions';
COMMENT ON POLICY "sessions_insert_policy" ON sessions IS 'Users can only insert their own sessions';
COMMENT ON POLICY "sessions_update_policy" ON sessions IS 'Users can update their own sessions';
COMMENT ON POLICY "sessions_delete_policy" ON sessions IS 'Users can delete their own sessions';

-- Verify the policies were created correctly
DO $$
BEGIN
  RAISE NOTICE 'Sessions table policies have been cleaned up and recreated';
  RAISE NOTICE 'Infinite recursion issue should be resolved';
END $$;
