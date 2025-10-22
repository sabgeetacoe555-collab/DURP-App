-- Add user_id column to group_members table
-- This allows group members to be linked to authenticated users for group invites
-- This is needed for QR code group invite functionality where anyone logged in can join

-- Add user_id column to group_members table
ALTER TABLE group_members 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add comment to explain the new column
COMMENT ON COLUMN group_members.user_id IS 'Link to authenticated user - used for group invites and notifications';

-- Add index for performance
CREATE INDEX idx_group_members_user_id ON group_members(user_id);

-- Update existing group creators to have user_id
UPDATE group_members 
SET user_id = g.user_id
FROM groups g
WHERE group_members.group_id = g.id
AND group_members.is_admin = true
AND group_members.user_id IS NULL;

-- Update RLS policies to allow users to view their own group memberships
CREATE POLICY "Users can view their own group memberships" ON group_members
  FOR SELECT USING (auth.uid() = user_id);

-- Update the existing policy to also allow viewing memberships by user_id
DROP POLICY IF EXISTS "Allow group members access for invites" ON group_members;
CREATE POLICY "Allow group members access for invites" ON group_members
  FOR SELECT USING (true);
