-- Create threaded discussion system
-- This migration adds forum-style discussions for groups and sessions

-- Create discussions table (replaces conversations for threaded discussions)
CREATE TABLE discussions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  discussion_type TEXT NOT NULL CHECK (discussion_type IN ('group', 'session')),
  entity_id UUID NOT NULL, -- group_id or session_id
  name TEXT, -- For session discussions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one discussion per entity
  UNIQUE(discussion_type, entity_id)
);

-- Create discussion participants table
CREATE TABLE discussion_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_admin BOOLEAN DEFAULT false, -- For group admins
  
  -- Prevent duplicate participants
  UNIQUE(discussion_id, user_id)
);

-- Create posts table (main discussion posts)
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT, -- Optional title for the post
  content TEXT NOT NULL,
  post_type TEXT DEFAULT 'discussion' CHECK (post_type IN ('discussion', 'announcement', 'question')),
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false, -- Prevent new replies
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create replies table (responses to posts)
CREATE TABLE replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  parent_reply_id UUID REFERENCES replies(id) ON DELETE CASCADE, -- For nested replies
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create post reactions table
CREATE TABLE post_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT NOT NULL, -- emoji or reaction type
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate reactions from same user
  UNIQUE(post_id, user_id, reaction_type)
);

-- Create reply reactions table
CREATE TABLE reply_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reply_id UUID REFERENCES replies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT NOT NULL, -- emoji or reaction type
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate reactions from same user
  UNIQUE(reply_id, user_id, reaction_type)
);

-- Add indexes for performance
CREATE INDEX idx_discussions_type ON discussions(discussion_type);
CREATE INDEX idx_discussions_entity_id ON discussions(entity_id);
CREATE INDEX idx_discussions_updated_at ON discussions(updated_at);
CREATE INDEX idx_discussion_participants_discussion_id ON discussion_participants(discussion_id);
CREATE INDEX idx_discussion_participants_user_id ON discussion_participants(user_id);
CREATE INDEX idx_posts_discussion_id ON posts(discussion_id);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_posts_last_reply_at ON posts(last_reply_at);
CREATE INDEX idx_posts_is_pinned ON posts(is_pinned);
CREATE INDEX idx_replies_post_id ON replies(post_id);
CREATE INDEX idx_replies_parent_reply_id ON replies(parent_reply_id);
CREATE INDEX idx_replies_author_id ON replies(author_id);
CREATE INDEX idx_replies_created_at ON replies(created_at);
CREATE INDEX idx_post_reactions_post_id ON post_reactions(post_id);
CREATE INDEX idx_post_reactions_user_id ON post_reactions(user_id);
CREATE INDEX idx_reply_reactions_reply_id ON reply_reactions(reply_id);
CREATE INDEX idx_reply_reactions_user_id ON reply_reactions(user_id);

-- Enable Row Level Security
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reply_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for discussions
CREATE POLICY "Users can view discussions they participate in" ON discussions
  FOR SELECT USING (
    id IN (
      SELECT discussion_id FROM discussion_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create discussions" ON discussions
  FOR INSERT WITH CHECK (true); -- Will be restricted by participant policies

CREATE POLICY "Admins can update discussions" ON discussions
  FOR UPDATE USING (
    id IN (
      SELECT discussion_id FROM discussion_participants 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- RLS Policies for discussion_participants
CREATE POLICY "Users can view participants of their discussions" ON discussion_participants
  FOR SELECT USING (
    discussion_id IN (
      SELECT discussion_id FROM discussion_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join discussions" ON discussion_participants
  FOR INSERT WITH CHECK (true); -- Will be restricted by group/session membership

CREATE POLICY "Users can update their own participation" ON discussion_participants
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for posts
CREATE POLICY "Users can view posts in their discussions" ON posts
  FOR SELECT USING (
    discussion_id IN (
      SELECT discussion_id FROM discussion_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create posts in their discussions" ON posts
  FOR INSERT WITH CHECK (
    discussion_id IN (
      SELECT discussion_id FROM discussion_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE USING (author_id = auth.uid());

-- RLS Policies for replies
CREATE POLICY "Users can view replies in their discussions" ON replies
  FOR SELECT USING (
    post_id IN (
      SELECT p.id FROM posts p
      JOIN discussion_participants dp ON p.discussion_id = dp.discussion_id
      WHERE dp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create replies in their discussions" ON replies
  FOR INSERT WITH CHECK (
    post_id IN (
      SELECT p.id FROM posts p
      JOIN discussion_participants dp ON p.discussion_id = dp.discussion_id
      WHERE dp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own replies" ON replies
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Users can delete their own replies" ON replies
  FOR DELETE USING (author_id = auth.uid());

-- RLS Policies for post_reactions
CREATE POLICY "Users can view post reactions in their discussions" ON post_reactions
  FOR SELECT USING (
    post_id IN (
      SELECT p.id FROM posts p
      JOIN discussion_participants dp ON p.discussion_id = dp.discussion_id
      WHERE dp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create post reactions in their discussions" ON post_reactions
  FOR INSERT WITH CHECK (
    post_id IN (
      SELECT p.id FROM posts p
      JOIN discussion_participants dp ON p.discussion_id = dp.discussion_id
      WHERE dp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own post reactions" ON post_reactions
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for reply_reactions
CREATE POLICY "Users can view reply reactions in their discussions" ON reply_reactions
  FOR SELECT USING (
    reply_id IN (
      SELECT r.id FROM replies r
      JOIN posts p ON r.post_id = p.id
      JOIN discussion_participants dp ON p.discussion_id = dp.discussion_id
      WHERE dp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create reply reactions in their discussions" ON reply_reactions
  FOR INSERT WITH CHECK (
    reply_id IN (
      SELECT r.id FROM replies r
      JOIN posts p ON r.post_id = p.id
      JOIN discussion_participants dp ON p.discussion_id = dp.discussion_id
      WHERE dp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own reply reactions" ON reply_reactions
  FOR DELETE USING (user_id = auth.uid());

-- Create functions for updating reply counts and last reply times
CREATE OR REPLACE FUNCTION update_post_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET reply_count = reply_count + 1,
        last_reply_at = NEW.created_at
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET reply_count = reply_count - 1,
        last_reply_at = (
          SELECT MAX(created_at) 
          FROM replies 
          WHERE post_id = OLD.post_id
        )
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for reply count updates
CREATE TRIGGER update_post_reply_count_trigger
  AFTER INSERT OR DELETE ON replies
  FOR EACH ROW
  EXECUTE FUNCTION update_post_reply_count();

-- Create function to update discussion updated_at when posts are created/updated
CREATE OR REPLACE FUNCTION update_discussion_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE discussions 
  SET updated_at = NOW()
  WHERE id = NEW.discussion_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for discussion updated_at
CREATE TRIGGER update_discussion_updated_at_trigger
  AFTER INSERT OR UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_discussion_updated_at();
