-- Add RLS policies for session discussions
-- This migration extends the existing discussion policies to support session discussions

-- Update discussions policies to include sessions
DROP POLICY IF EXISTS "Users can view discussions they participate in" ON discussions;
DROP POLICY IF EXISTS "Users can create discussions" ON discussions;
DROP POLICY IF EXISTS "Admins can update discussions" ON discussions;

CREATE POLICY "Users can view discussions they participate in" ON discussions
  FOR SELECT USING (
    (discussion_type = 'group' AND entity_id IN (
      SELECT id FROM groups 
      WHERE user_id = auth.uid()
    )) OR
    (discussion_type = 'session' AND entity_id IN (
      SELECT id FROM sessions 
      WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can create discussions" ON discussions
  FOR INSERT WITH CHECK (
    (discussion_type = 'group' AND entity_id IN (
      SELECT id FROM groups 
      WHERE user_id = auth.uid()
    )) OR
    (discussion_type = 'session' AND entity_id IN (
      SELECT id FROM sessions 
      WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Admins can update discussions" ON discussions
  FOR UPDATE USING (
    (discussion_type = 'group' AND entity_id IN (
      SELECT id FROM groups 
      WHERE user_id = auth.uid()
    )) OR
    (discussion_type = 'session' AND entity_id IN (
      SELECT id FROM sessions 
      WHERE user_id = auth.uid()
    ))
  );

-- Update discussion_participants policies to include sessions
DROP POLICY IF EXISTS "Users can view participants of their discussions" ON discussion_participants;
DROP POLICY IF EXISTS "Users can join discussions" ON discussion_participants;

CREATE POLICY "Users can view participants of their discussions" ON discussion_participants
  FOR SELECT USING (
    discussion_id IN (
      SELECT id FROM discussions
      WHERE (discussion_type = 'group' AND entity_id IN (
        SELECT id FROM groups 
        WHERE user_id = auth.uid()
      )) OR
      (discussion_type = 'session' AND entity_id IN (
        SELECT id FROM sessions 
        WHERE user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can join discussions" ON discussion_participants
  FOR INSERT WITH CHECK (
    discussion_id IN (
      SELECT id FROM discussions
      WHERE (discussion_type = 'group' AND entity_id IN (
        SELECT id FROM groups 
        WHERE user_id = auth.uid()
      )) OR
      (discussion_type = 'session' AND entity_id IN (
        SELECT id FROM sessions 
        WHERE user_id = auth.uid()
      ))
    )
  );

-- Update posts policies to include sessions
DROP POLICY IF EXISTS "Users can view posts in their discussions" ON posts;
DROP POLICY IF EXISTS "Users can create posts in their discussions" ON posts;

CREATE POLICY "Users can view posts in their discussions" ON posts
  FOR SELECT USING (
    discussion_id IN (
      SELECT id FROM discussions 
      WHERE (discussion_type = 'group' AND entity_id IN (
        SELECT id FROM groups 
        WHERE user_id = auth.uid()
      )) OR
      (discussion_type = 'session' AND entity_id IN (
        SELECT id FROM sessions 
        WHERE user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can create posts in their discussions" ON posts
  FOR INSERT WITH CHECK (
    discussion_id IN (
      SELECT id FROM discussions 
      WHERE (discussion_type = 'group' AND entity_id IN (
        SELECT id FROM groups 
        WHERE user_id = auth.uid()
      )) OR
      (discussion_type = 'session' AND entity_id IN (
        SELECT id FROM sessions 
        WHERE user_id = auth.uid()
      ))
    )
  );

-- Update replies policies to include sessions
DROP POLICY IF EXISTS "Users can view replies in their discussions" ON replies;
DROP POLICY IF EXISTS "Users can create replies in their discussions" ON replies;

CREATE POLICY "Users can view replies in their discussions" ON replies
  FOR SELECT USING (
    post_id IN (
      SELECT p.id FROM posts p
      JOIN discussions d ON p.discussion_id = d.id
      WHERE (d.discussion_type = 'group' AND d.entity_id IN (
        SELECT id FROM groups 
        WHERE user_id = auth.uid()
      )) OR
      (d.discussion_type = 'session' AND d.entity_id IN (
        SELECT id FROM sessions 
        WHERE user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can create replies in their discussions" ON replies
  FOR INSERT WITH CHECK (
    post_id IN (
      SELECT p.id FROM posts p
      JOIN discussions d ON p.discussion_id = d.id
      WHERE (d.discussion_type = 'group' AND d.entity_id IN (
        SELECT id FROM groups 
        WHERE user_id = auth.uid()
      )) OR
      (d.discussion_type = 'session' AND d.entity_id IN (
        SELECT id FROM sessions 
        WHERE user_id = auth.uid()
      ))
    )
  );

-- Update post_reactions policies to include sessions
DROP POLICY IF EXISTS "Users can view post reactions in their discussions" ON post_reactions;
DROP POLICY IF EXISTS "Users can create post reactions in their discussions" ON post_reactions;

CREATE POLICY "Users can view post reactions in their discussions" ON post_reactions
  FOR SELECT USING (
    post_id IN (
      SELECT p.id FROM posts p
      JOIN discussions d ON p.discussion_id = d.id
      WHERE (d.discussion_type = 'group' AND d.entity_id IN (
        SELECT id FROM groups 
        WHERE user_id = auth.uid()
      )) OR
      (d.discussion_type = 'session' AND d.entity_id IN (
        SELECT id FROM sessions 
        WHERE user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can create post reactions in their discussions" ON post_reactions
  FOR INSERT WITH CHECK (
    post_id IN (
      SELECT p.id FROM posts p
      JOIN discussions d ON p.discussion_id = d.id
      WHERE (d.discussion_type = 'group' AND d.entity_id IN (
        SELECT id FROM groups 
        WHERE user_id = auth.uid()
      )) OR
      (d.discussion_type = 'session' AND d.entity_id IN (
        SELECT id FROM sessions 
        WHERE user_id = auth.uid()
      ))
    )
  );

-- Update reply_reactions policies to include sessions
DROP POLICY IF EXISTS "Users can view reply reactions in their discussions" ON reply_reactions;
DROP POLICY IF EXISTS "Users can create reply reactions in their discussions" ON reply_reactions;

CREATE POLICY "Users can view reply reactions in their discussions" ON reply_reactions
  FOR SELECT USING (
    reply_id IN (
      SELECT r.id FROM replies r
      JOIN posts p ON r.post_id = p.id
      JOIN discussions d ON p.discussion_id = d.id
      WHERE (d.discussion_type = 'group' AND d.entity_id IN (
        SELECT id FROM groups 
        WHERE user_id = auth.uid()
      )) OR
      (d.discussion_type = 'session' AND d.entity_id IN (
        SELECT id FROM sessions 
        WHERE user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can create reply reactions in their discussions" ON reply_reactions
  FOR INSERT WITH CHECK (
    reply_id IN (
      SELECT r.id FROM replies r
      JOIN posts p ON r.post_id = p.id
      JOIN discussions d ON p.discussion_id = d.id
      WHERE (d.discussion_type = 'group' AND d.entity_id IN (
        SELECT id FROM groups 
        WHERE user_id = auth.uid()
      )) OR
      (d.discussion_type = 'session' AND d.entity_id IN (
        SELECT id FROM sessions 
        WHERE user_id = auth.uid()
      ))
    )
  );
