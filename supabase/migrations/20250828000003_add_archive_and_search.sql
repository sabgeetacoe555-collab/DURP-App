-- Add archive functionality to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES auth.users(id);

-- Add index for archive status
CREATE INDEX IF NOT EXISTS idx_posts_is_archived ON posts(is_archived);
CREATE INDEX IF NOT EXISTS idx_posts_archived_at ON posts(archived_at);

-- Add full-text search capabilities
ALTER TABLE posts ADD COLUMN IF NOT EXISTS search_vector tsvector 
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) STORED;

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_posts_search_vector ON posts USING GIN(search_vector);

-- Add full-text search to replies
ALTER TABLE replies ADD COLUMN IF NOT EXISTS search_vector tsvector 
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) STORED;

-- Create GIN index for reply search
CREATE INDEX IF NOT EXISTS idx_replies_search_vector ON replies USING GIN(search_vector);

-- Add RLS policies for archived posts
-- Users can only view archived posts if they have access to the discussion
CREATE POLICY "Users can view archived posts in accessible discussions" ON posts
  FOR SELECT USING (
    (is_archived = FALSE OR is_archived = TRUE) AND
    EXISTS (
      SELECT 1 FROM discussion_participants dp
      WHERE dp.discussion_id = posts.discussion_id
      AND dp.user_id = auth.uid()
    )
  );

-- Users can only archive posts they authored or if they are discussion admins
CREATE POLICY "Users can archive their own posts or as discussion admins" ON posts
  FOR UPDATE USING (
    (author_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM discussion_participants dp
      WHERE dp.discussion_id = posts.discussion_id
      AND dp.user_id = auth.uid()
      AND dp.is_admin = TRUE
    )
  );

-- Function to archive a post and its replies
CREATE OR REPLACE FUNCTION archive_post_and_replies(post_id_to_archive UUID)
RETURNS VOID AS $$
BEGIN
  -- Archive the post
  UPDATE posts 
  SET is_archived = TRUE, 
      archived_at = NOW(), 
      archived_by = auth.uid()
  WHERE id = post_id_to_archive;
  
  -- Archive all replies to this post
  UPDATE replies 
  SET is_archived = TRUE, 
      archived_at = NOW(), 
      archived_by = auth.uid()
  WHERE post_id = post_id_to_archive;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unarchive a post and its replies
CREATE OR REPLACE FUNCTION unarchive_post_and_replies(post_id_to_unarchive UUID)
RETURNS VOID AS $$
BEGIN
  -- Unarchive the post
  UPDATE posts 
  SET is_archived = FALSE, 
      archived_at = NULL, 
      archived_by = NULL
  WHERE id = post_id_to_unarchive;
  
  -- Unarchive all replies to this post
  UPDATE replies 
  SET is_archived = FALSE, 
      archived_at = NULL, 
      archived_by = NULL
  WHERE post_id = post_id_to_unarchive;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add archive status to replies table
ALTER TABLE replies ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE replies ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE replies ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES auth.users(id);

-- Add indexes for reply archive status
CREATE INDEX IF NOT EXISTS idx_replies_is_archived ON replies(is_archived);
CREATE INDEX IF NOT EXISTS idx_replies_archived_at ON replies(archived_at);

-- Update RLS policies for replies to include archive status
DROP POLICY IF EXISTS "Users can view replies for accessible posts" ON replies;
CREATE POLICY "Users can view replies for accessible posts" ON replies
  FOR SELECT USING (
    (is_archived = FALSE OR is_archived = TRUE) AND
    EXISTS (
      SELECT 1 FROM posts p
      JOIN discussion_participants dp ON dp.discussion_id = p.discussion_id
      WHERE p.id = replies.post_id
      AND dp.user_id = auth.uid()
    )
  );
