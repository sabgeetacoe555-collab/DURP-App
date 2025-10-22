-- Add group_id column to session_invites table
-- This tracks which group was created from the session invites
-- so we can add users to the group when they accept the session invite

-- Add group_id column to session_invites table
ALTER TABLE session_invites 
ADD COLUMN group_id UUID REFERENCES groups(id) ON DELETE SET NULL;

-- Add comment to explain the new column
COMMENT ON COLUMN session_invites.group_id IS 'Group created from session invites - users accepting invites will be added to this group';

-- Add index for performance
CREATE INDEX idx_session_invites_group_id ON session_invites(group_id);

-- Add RLS policy for group_id access
CREATE POLICY "Users can view group_id for their session invites" ON session_invites
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM sessions WHERE user_id = auth.uid()
    )
    OR inviter_id = auth.uid()
    OR invitee_id = auth.uid()
  );

CREATE POLICY "Users can update group_id for their session invites" ON session_invites
  FOR UPDATE USING (
    session_id IN (
      SELECT id FROM sessions WHERE user_id = auth.uid()
    )
    OR inviter_id = auth.uid()
  );
