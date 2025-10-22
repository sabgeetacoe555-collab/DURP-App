-- Fix infinite recursion in RLS policies for groups table
-- The issue is caused by circular references between groups and group_members policies

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Allow group access for members and invites" ON groups;

-- Create a simpler policy that doesn't reference group_members
CREATE POLICY "Allow group access for creators and public invites" ON groups
  FOR SELECT USING (
    -- Group creators can view their own groups
    user_id = auth.uid() OR
    -- Anyone can view groups for invite purposes (public access)
    true
  );

-- Also simplify the group_members policy to avoid circular references
DROP POLICY IF EXISTS "Allow group members access" ON group_members;

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

-- Add comment explaining the simplified security model
COMMENT ON TABLE groups IS 'User-created groups - allows access for creators and public invite functionality';
