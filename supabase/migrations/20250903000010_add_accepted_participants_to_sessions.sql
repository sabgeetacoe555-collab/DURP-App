-- Add accepted_participants array to sessions table
-- This will store user IDs of people who have accepted invites

-- Add the new column
ALTER TABLE sessions 
ADD COLUMN accepted_participants UUID[] DEFAULT '{}';

-- Add comment explaining the column
COMMENT ON COLUMN sessions.accepted_participants IS 'Array of user IDs who have accepted invites to this session';

-- Add index for performance
CREATE INDEX idx_sessions_accepted_participants ON sessions USING GIN (accepted_participants);

-- Update the sessions select policy to include accepted participants
DROP POLICY IF EXISTS "sessions_select" ON sessions;

CREATE POLICY "sessions_select" ON sessions
  FOR SELECT USING (
    -- User created this session
    user_id = auth.uid()
    OR
    -- Session is public
    visibility = 'public'
    OR
    -- User is in the accepted participants array
    auth.uid() = ANY(accepted_participants)
  );

-- Add helpful comment
COMMENT ON POLICY "sessions_select" ON sessions IS 'Users can view sessions they created, public sessions, or sessions they have accepted invites for';

-- Create function to safely add user to accepted_participants array
CREATE OR REPLACE FUNCTION add_user_to_accepted_participants(
  session_id UUID,
  user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only add if user is not already in the array
  UPDATE sessions 
  SET accepted_participants = array_append(accepted_participants, user_id)
  WHERE id = session_id
  AND NOT (user_id = ANY(accepted_participants));
  
  -- Log the action
  RAISE NOTICE 'Added user % to session % accepted participants', user_id, session_id;
END;
$$;

-- Add comment to the function
COMMENT ON FUNCTION add_user_to_accepted_participants IS 'Safely adds a user ID to the accepted_participants array if not already present';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Added accepted_participants array column to sessions table';
  RAISE NOTICE 'Updated RLS policy to allow access for accepted participants';
  RAISE NOTICE 'Created function to safely add users to accepted participants';
  RAISE NOTICE 'Users will now see real session data for sessions they have joined';
END $$;
