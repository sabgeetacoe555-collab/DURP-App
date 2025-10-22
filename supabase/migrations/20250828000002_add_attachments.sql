-- Add attachments table for posts and replies
CREATE TABLE IF NOT EXISTS attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES replies(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'document', 'video', 'audio')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Ensure either post_id or reply_id is set, but not both
  CONSTRAINT attachment_entity_check CHECK (
    (post_id IS NOT NULL AND reply_id IS NULL) OR 
    (post_id IS NULL AND reply_id IS NOT NULL)
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attachments_post_id ON attachments(post_id);
CREATE INDEX IF NOT EXISTS idx_attachments_reply_id ON attachments(reply_id);
CREATE INDEX IF NOT EXISTS idx_attachments_created_by ON attachments(created_by);

-- Add RLS policies for attachments
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view attachments for posts/replies they have access to
CREATE POLICY "Users can view attachments for accessible content" ON attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = attachments.post_id
      AND EXISTS (
        SELECT 1 FROM discussion_participants dp
        WHERE dp.discussion_id = p.discussion_id
        AND dp.user_id = auth.uid()
      )
    )
    OR
    EXISTS (
      SELECT 1 FROM replies r
      JOIN posts p ON p.id = r.post_id
      WHERE r.id = attachments.reply_id
      AND EXISTS (
        SELECT 1 FROM discussion_participants dp
        WHERE dp.discussion_id = p.discussion_id
        AND dp.user_id = auth.uid()
      )
    )
  );

-- Policy: Users can create attachments for posts/replies they authored
CREATE POLICY "Users can create attachments for their own content" ON attachments
  FOR INSERT WITH CHECK (
    (post_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = attachments.post_id
      AND p.author_id = auth.uid()
    ))
    OR
    (reply_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM replies r
      WHERE r.id = attachments.reply_id
      AND r.author_id = auth.uid()
    ))
  );

-- Policy: Users can delete attachments they created
CREATE POLICY "Users can delete their own attachments" ON attachments
  FOR DELETE USING (created_by = auth.uid());

-- Add trigger to automatically set created_by
CREATE OR REPLACE FUNCTION set_attachment_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_attachment_created_by_trigger
  BEFORE INSERT ON attachments
  FOR EACH ROW
  EXECUTE FUNCTION set_attachment_created_by();

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_attachment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_attachment_updated_at_trigger
  BEFORE UPDATE ON attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_attachment_updated_at();
