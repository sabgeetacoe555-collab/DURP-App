-- Create a more permissive attachment RLS policy for debugging
-- Drop existing policies
DROP POLICY IF EXISTS "Users can create attachments for accessible content" ON attachments;

-- Create a permissive policy that allows any authenticated user to create attachments
-- This is for debugging - we can make it more restrictive later
CREATE POLICY "Allow authenticated users to create attachments" ON attachments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Also add a policy for viewing attachments
DROP POLICY IF EXISTS "Users can view attachments for accessible content" ON attachments;

CREATE POLICY "Allow public view of attachments" ON attachments
  FOR SELECT USING (true);

-- Add policy for deleting attachments
DROP POLICY IF EXISTS "Users can delete their own attachments" ON attachments;

CREATE POLICY "Allow users to delete their own attachments" ON attachments
  FOR DELETE USING (created_by = auth.uid());
