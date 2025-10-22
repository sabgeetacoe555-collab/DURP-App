-- Fix attachment RLS policies to be more flexible
-- Drop existing policies
DROP POLICY IF EXISTS "Users can create attachments for their own content" ON attachments;

-- Create a more flexible policy for creating attachments
CREATE POLICY "Users can create attachments for accessible content" ON attachments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
      -- For posts: user must be a participant in the discussion
      (post_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM posts p
        JOIN discussion_participants dp ON dp.discussion_id = p.discussion_id
        WHERE p.id = attachments.post_id
        AND dp.user_id = auth.uid()
      ))
      OR
      -- For replies: user must be a participant in the discussion
      (reply_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM replies r
        JOIN posts p ON p.id = r.post_id
        JOIN discussion_participants dp ON dp.discussion_id = p.discussion_id
        WHERE r.id = attachments.reply_id
        AND dp.user_id = auth.uid()
      ))
    )
  );
