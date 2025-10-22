-- Add session_info column to sessions table
-- This will store additional information/details about the session

-- Add the new column
ALTER TABLE sessions 
ADD COLUMN session_info TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN sessions.session_info IS 'Additional information or details about the session provided by the creator';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Added session_info column to sessions table';
  RAISE NOTICE 'Users can now provide additional details when creating sessions';
END $$;
