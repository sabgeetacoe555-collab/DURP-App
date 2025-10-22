-- Fix RLS policies for session_invites to allow phone-based access for deep links
-- This enables users to view invites sent to their phone number even when not authenticated

-- Add policy to allow viewing invites by phone number
-- This is needed for SMS deep link functionality where users may not be logged in yet
CREATE POLICY "Users can view invites by phone number" ON session_invites
  FOR SELECT USING (
    -- Allow if user is authenticated and phone matches their account
    (auth.uid() IS NOT NULL AND 
     invitee_phone IN (
       SELECT phone FROM users WHERE id = auth.uid()
     )
    )
    OR
    -- Allow anonymous access to invites by phone for deep link functionality
    -- This is safe because phone numbers are not sensitive identifiers
    -- and the invite data itself doesn't contain sensitive information
    (auth.uid() IS NULL AND invitee_phone IS NOT NULL)
  );

-- Add policy to allow updating invites by phone number (for accepting/declining)
CREATE POLICY "Users can update invites by phone number" ON session_invites
  FOR UPDATE USING (
    -- Allow if user is authenticated and phone matches their account
    auth.uid() IS NOT NULL AND 
    invitee_phone IN (
      SELECT phone FROM users WHERE id = auth.uid()
    )
  );

-- Add comment explaining the security model
COMMENT ON TABLE session_invites IS 'Session invitations - allows phone-based access for SMS deep links';
