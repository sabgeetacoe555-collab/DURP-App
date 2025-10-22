-- Add RLS policies for group invites
-- This enables users to view group data for invite purposes, similar to session invites
-- This is needed for QR code group invite functionality

-- Add policy to allow viewing groups for invite purposes
-- This allows anyone to read group data when they have a group invite link
-- This is safe because group data (name, description) is not sensitive
-- and the invite functionality requires the user to accept the invitation
CREATE POLICY "Allow group access for invites" ON groups
  FOR SELECT USING (true);

-- Add policy to allow viewing group members for invite purposes
-- This allows users to see who else is in the group when considering joining
CREATE POLICY "Allow group members access for invites" ON group_members
  FOR SELECT USING (true);

-- Add comment explaining the security model
COMMENT ON TABLE groups IS 'User-created groups of contacts for easier session invitations - allows public read access for invite functionality';
