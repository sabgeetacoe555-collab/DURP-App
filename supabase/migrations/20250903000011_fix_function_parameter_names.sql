-- Fix the function parameter naming conflict
-- The issue is that 'user_id' conflicts with the sessions.user_id column

-- Drop and recreate the function with better parameter names
DROP FUNCTION IF EXISTS add_user_to_accepted_participants(UUID, UUID);

CREATE OR REPLACE FUNCTION add_user_to_accepted_participants(
  target_session_id UUID,
  participant_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only add if user is not already in the array
  UPDATE sessions 
  SET accepted_participants = array_append(accepted_participants, participant_user_id)
  WHERE id = target_session_id
  AND NOT (participant_user_id = ANY(accepted_participants));
  
  -- Log the action
  RAISE NOTICE 'Added user % to session % accepted participants', participant_user_id, target_session_id;
END;
$$;

-- Add comment to the function
COMMENT ON FUNCTION add_user_to_accepted_participants IS 'Safely adds a user ID to the accepted_participants array if not already present';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Fixed function parameter naming conflict';
  RAISE NOTICE 'Function now uses target_session_id and participant_user_id parameters';
END $$;
