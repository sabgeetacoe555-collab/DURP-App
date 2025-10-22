-- Update sessions table to support both planned and completed sessions

-- Add new fields for planned sessions with invites
ALTER TABLE sessions 
ADD COLUMN name TEXT,
ADD COLUMN start_time TIME,
ADD COLUMN end_time TIME,
ADD COLUMN is_public BOOLEAN DEFAULT false,
ADD COLUMN min_dupr_rating DECIMAL(3,2),
ADD COLUMN max_dupr_rating DECIMAL(3,2),
ADD COLUMN max_players INTEGER,
ADD COLUMN allow_friends BOOLEAN DEFAULT true,
ADD COLUMN creator_id UUID REFERENCES users(id),
ADD COLUMN session_status TEXT CHECK (session_status IN ('planned', 'active', 'completed', 'cancelled')) DEFAULT 'planned';

-- Make existing fields optional (except date which stays required)
ALTER TABLE sessions ALTER COLUMN time DROP NOT NULL;
ALTER TABLE sessions ALTER COLUMN session_type DROP NOT NULL;

-- Update foreign key constraint to reference users table instead of auth.users
ALTER TABLE sessions DROP CONSTRAINT sessions_user_id_fkey;
ALTER TABLE sessions ADD CONSTRAINT sessions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add constraint for creator_id (optional, but if set must reference users)
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_creator_id_fkey;
ALTER TABLE sessions ADD CONSTRAINT sessions_creator_id_fkey 
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL;

-- Add validation constraints
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_dupr_rating_range_check;
ALTER TABLE sessions ADD CONSTRAINT sessions_dupr_rating_range_check 
  CHECK (
    (min_dupr_rating IS NULL OR (min_dupr_rating >= 1.0 AND min_dupr_rating <= 8.0)) AND
    (max_dupr_rating IS NULL OR (max_dupr_rating >= 1.0 AND max_dupr_rating <= 8.0)) AND
    (min_dupr_rating IS NULL OR max_dupr_rating IS NULL OR min_dupr_rating <= max_dupr_rating)
  );

ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_max_players_check;
ALTER TABLE sessions ADD CONSTRAINT sessions_max_players_check 
  CHECK (max_players IS NULL OR (max_players >= 2 AND max_players <= 20));

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS sessions_creator_id_idx ON sessions(creator_id);
CREATE INDEX IF NOT EXISTS sessions_session_status_idx ON sessions(session_status);
CREATE INDEX IF NOT EXISTS sessions_is_public_idx ON sessions(is_public);
CREATE INDEX IF NOT EXISTS sessions_name_idx ON sessions(name);
CREATE INDEX IF NOT EXISTS sessions_start_time_idx ON sessions(start_time);

-- Update RLS policies if they exist
DROP POLICY IF EXISTS "Users can only see own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON sessions;

-- New RLS policies for both planned and completed sessions
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() = creator_id OR
    id IN (
      SELECT session_id FROM session_invites 
      WHERE invitee_id = auth.uid()
    )
  );

CREATE POLICY "Users can view public planned sessions" ON sessions
  FOR SELECT USING (is_public = true AND session_status = 'planned');

CREATE POLICY "Users can create sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON sessions
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    auth.uid() = creator_id
  );

-- Function to set creator_id if not provided
CREATE OR REPLACE FUNCTION public.handle_session_creator()
RETURNS trigger AS $$
BEGIN
  -- If creator_id is not set, use user_id
  IF NEW.creator_id IS NULL THEN
    NEW.creator_id = NEW.user_id;
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set creator_id and updated_at
CREATE TRIGGER on_sessions_updated
  BEFORE INSERT OR UPDATE ON sessions
  FOR EACH ROW EXECUTE PROCEDURE public.handle_session_creator(); 