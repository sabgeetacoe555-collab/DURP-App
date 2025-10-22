-- Add group invite approval functionality
-- This allows admins to approve/deny group invites after users accept them

-- Add approval status column to group_members table
ALTER TABLE group_members 
ADD COLUMN approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'denied')) DEFAULT 'pending';

-- Add comment to explain the new column
COMMENT ON COLUMN group_members.approval_status IS 'Admin approval status for group invites: pending (awaiting admin approval), approved (admin approved), denied (admin denied)';

-- Add index for performance
CREATE INDEX idx_group_members_approval_status ON group_members(approval_status);

-- Update existing members to be approved (they were added by admins directly)
UPDATE group_members 
SET approval_status = 'approved' 
WHERE accepted_invite = true;

-- Update group creators to be approved
UPDATE group_members 
SET approval_status = 'approved' 
WHERE is_admin = true;

-- Create function to check if user is approved group member
CREATE OR REPLACE FUNCTION is_approved_group_member(group_id_param UUID, user_id_param UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_id_param
    AND gm.user_id = user_id_param
    AND gm.approval_status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get pending approvals for a group (invitees who have accepted but have not been approved by admin)
CREATE OR REPLACE FUNCTION get_pending_group_approvals(group_id_param UUID)
RETURNS TABLE (
  id UUID,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  user_id UUID,
  accepted_invite BOOLEAN,
  approval_status TEXT,
  added_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gm.id,
    gm.contact_name,
    gm.contact_email,
    gm.contact_phone,
    gm.user_id,
    gm.accepted_invite,
    gm.approval_status,
    gm.added_at
  FROM group_members gm
  WHERE gm.group_id = group_id_param
  AND gm.accepted_invite = true
  AND gm.approval_status = 'pending'
  AND gm.is_admin = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to handle approval status
-- Allow group admins to view pending approvals
CREATE POLICY "Group admins can view pending approvals" ON group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members admin_gm
      WHERE admin_gm.group_id = group_members.group_id
      AND admin_gm.user_id = auth.uid()
      AND admin_gm.is_admin = true
      AND admin_gm.approval_status = 'approved'
    )
  );

-- Allow group admins to update approval status
CREATE POLICY "Group admins can update approval status" ON group_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members admin_gm
      WHERE admin_gm.group_id = group_members.group_id
      AND admin_gm.user_id = auth.uid()
      AND admin_gm.is_admin = true
      AND admin_gm.approval_status = 'approved'
    )
  );

-- Add helpful comments
COMMENT ON FUNCTION is_approved_group_member IS 'Check if a user is an approved member of a group';
COMMENT ON FUNCTION get_pending_group_approvals IS 'Get invitees who have accepted but have not been approved by admin';
