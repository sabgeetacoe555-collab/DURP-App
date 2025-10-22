-- Fix infinite recursion in group_members RLS policies
-- The new approval policies are causing circular references

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Group admins can view pending approvals" ON group_members;
DROP POLICY IF EXISTS "Group admins can update approval status" ON group_members;

-- Create simpler policies that don't cause recursion
-- Allow group creators to view and manage all members of their groups
CREATE POLICY "Group creators can manage members" ON group_members
  FOR ALL USING (
    group_id IN (
      SELECT id FROM groups WHERE user_id = auth.uid()
    )
  );

-- Allow users to view their own memberships
CREATE POLICY "Users can view own memberships" ON group_members
  FOR SELECT USING (user_id = auth.uid());

-- Allow public access for invite functionality (existing policy should handle this)
-- This is needed for QR code invites and group invite flows

-- Add comment explaining the simplified security model
COMMENT ON TABLE group_members IS 'Group members with approval status - allows creators to manage, users to view own memberships, and public access for invites';
