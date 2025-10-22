-- Clean up group RLS policies to ensure proper access for group invites
-- Remove conflicting policies and ensure group members can access group data

-- Drop all existing policies on groups table to start fresh
DROP POLICY IF EXISTS "Users can view their own groups" ON groups;
DROP POLICY IF EXISTS "Allow group access for invites" ON groups;

-- Create a single comprehensive policy for groups SELECT
CREATE POLICY "Allow group access for members and invites" ON groups
  FOR SELECT USING (
    -- Group creators can view their own groups
    user_id = auth.uid() OR
    -- Group members can view groups they belong to
    id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    ) OR
    -- Anyone can view groups for invite purposes (public access)
    true
  );

-- Drop all existing policies on group_members table to start fresh
DROP POLICY IF EXISTS "Users can view members of their groups" ON group_members;
DROP POLICY IF EXISTS "Users can view their own group memberships" ON group_members;
DROP POLICY IF EXISTS "Allow group members access for invites" ON group_members;

-- Create comprehensive policies for group_members
CREATE POLICY "Allow group members access" ON group_members
  FOR SELECT USING (
    -- Group creators can view members of their groups
    group_id IN (
      SELECT id FROM groups WHERE user_id = auth.uid()
    ) OR
    -- Users can view their own memberships
    user_id = auth.uid() OR
    -- Anyone can view group members for invite purposes (public access)
    true
  );

-- Add comment explaining the updated security model
COMMENT ON TABLE groups IS 'User-created groups - allows access for creators, members, and public invite functionality';
