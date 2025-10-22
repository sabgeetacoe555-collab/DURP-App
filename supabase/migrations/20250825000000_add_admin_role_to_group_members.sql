-- Add admin role to group_members table
-- This allows group creators to assign admin privileges to other members

-- Add is_admin column to group_members table
ALTER TABLE group_members 
ADD COLUMN is_admin BOOLEAN DEFAULT false;

-- Add comment to explain the new column
COMMENT ON COLUMN group_members.is_admin IS 'Whether this member has admin privileges in the group';

-- Update RLS policies to allow admins to manage members
-- First, drop existing policies that need to be updated
DROP POLICY IF EXISTS "Users can add members to their groups" ON group_members;
DROP POLICY IF EXISTS "Users can update members of their groups" ON group_members;
DROP POLICY IF EXISTS "Users can remove members from their groups" ON group_members;

-- Create new policies that allow both group creators and admins to manage members
CREATE POLICY "Group creators and admins can add members to groups" ON group_members
  FOR INSERT WITH CHECK (
    group_id IN (
      SELECT id FROM groups WHERE user_id = auth.uid()
    ) OR
    group_id IN (
      SELECT gm.group_id 
      FROM group_members gm 
      WHERE gm.contact_phone = (
        SELECT phone FROM users WHERE id = auth.uid()
      ) AND gm.is_admin = true
    ) OR
    group_id IN (
      SELECT gm.group_id 
      FROM group_members gm 
      WHERE gm.contact_email = (
        SELECT email FROM users WHERE id = auth.uid()
      ) AND gm.is_admin = true
    )
  );

CREATE POLICY "Group creators and admins can update members of groups" ON group_members
  FOR UPDATE USING (
    group_id IN (
      SELECT id FROM groups WHERE user_id = auth.uid()
    ) OR
    group_id IN (
      SELECT gm.group_id 
      FROM group_members gm 
      WHERE gm.contact_phone = (
        SELECT phone FROM users WHERE id = auth.uid()
      ) AND gm.is_admin = true
    ) OR
    group_id IN (
      SELECT gm.group_id 
      FROM group_members gm 
      WHERE gm.contact_email = (
        SELECT email FROM users WHERE id = auth.uid()
      ) AND gm.is_admin = true
    )
  );

CREATE POLICY "Group creators and admins can remove members from groups" ON group_members
  FOR DELETE USING (
    group_id IN (
      SELECT id FROM groups WHERE user_id = auth.uid()
    ) OR
    group_id IN (
      SELECT gm.group_id 
      FROM group_members gm 
      WHERE gm.contact_phone = (
        SELECT phone FROM users WHERE id = auth.uid()
      ) AND gm.is_admin = true
    ) OR
    group_id IN (
      SELECT gm.group_id 
      FROM group_members gm 
      WHERE gm.contact_email = (
        SELECT email FROM users WHERE id = auth.uid()
      ) AND gm.is_admin = true
    )
  );

-- Create a function to check if a user is an admin of a group
CREATE OR REPLACE FUNCTION is_group_admin(group_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_id_param
    AND (
      (gm.contact_phone = (SELECT phone FROM users WHERE id = auth.uid()))
      OR 
      (gm.contact_email = (SELECT email FROM users WHERE id = auth.uid()))
    )
    AND gm.is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if a user is the creator of a group
CREATE OR REPLACE FUNCTION is_group_creator(group_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_id_param
    AND g.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if a user can manage a group (creator or admin)
CREATE OR REPLACE FUNCTION can_manage_group(group_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN is_group_creator(group_id_param) OR is_group_admin(group_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
