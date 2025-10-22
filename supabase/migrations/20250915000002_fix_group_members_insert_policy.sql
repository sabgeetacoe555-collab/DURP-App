-- Fix RLS policy for group_members INSERT to allow group invites
-- This allows users to add themselves to groups via group invites

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can add members to their groups" ON group_members;

-- Create a new policy that allows both group creators and users joining via invites
CREATE POLICY "Allow group member additions" ON group_members
  FOR INSERT WITH CHECK (
    -- Group creators can add any members to their groups
    group_id IN (
      SELECT id FROM groups WHERE user_id = auth.uid()
    ) OR
    -- Users can add themselves to any group (for group invites)
    user_id = auth.uid()
  );

-- Add comment explaining the policy
COMMENT ON POLICY "Allow group member additions" ON group_members IS 'Allows group creators to add members and users to join groups via invites';
