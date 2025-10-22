-- Add accepted_invite column to group_members table
-- This tracks whether a user has accepted their group invitation

-- Add accepted_invite column to group_members table
ALTER TABLE group_members 
ADD COLUMN accepted_invite BOOLEAN DEFAULT false;

-- Add comment to explain the new column
COMMENT ON COLUMN group_members.accepted_invite IS 'Whether this member has accepted their group invitation';

-- Update existing group creators to be members of their own groups
-- This ensures group creators are properly represented in the group_members table
INSERT INTO group_members (group_id, contact_name, contact_phone, contact_email, is_admin, accepted_invite)
SELECT 
    g.id as group_id,
    COALESCE(u.name, u.email, 'Group Creator') as contact_name,
    u.phone as contact_phone,
    u.email as contact_email,
    true as is_admin,
    true as accepted_invite
FROM groups g
JOIN users u ON g.user_id = u.id
WHERE NOT EXISTS (
    SELECT 1 FROM group_members gm 
    WHERE gm.group_id = g.id 
    AND (
        (gm.contact_phone = u.phone AND u.phone IS NOT NULL) OR
        (gm.contact_email = u.email AND u.email IS NOT NULL)
    )
);

-- Update the is_group_admin function to handle the new accepted_invite column
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
    AND gm.accepted_invite = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
