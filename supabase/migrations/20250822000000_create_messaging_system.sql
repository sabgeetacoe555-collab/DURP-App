-- Create messaging system
-- This migration adds comprehensive messaging functionality for direct, group, and session messages

-- Create conversations table to group related messages
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_type TEXT NOT NULL CHECK (conversation_type IN ('direct', 'group', 'session')),
  name TEXT, -- For group/session conversations
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- For direct conversations, ensure uniqueness
  UNIQUE(conversation_type, name)
);

-- Create conversation participants table
CREATE TABLE conversation_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_admin BOOLEAN DEFAULT false, -- For group admins
  
  -- Prevent duplicate participants
  UNIQUE(conversation_id, user_id)
);

-- Create messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'location', 'system')),
  metadata JSONB DEFAULT '{}', -- For additional message data (image URLs, location coords, etc.)
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create message reactions table
CREATE TABLE message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT NOT NULL, -- emoji or reaction type
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate reactions from same user
  UNIQUE(message_id, user_id, reaction_type)
);

-- Add indexes for performance
CREATE INDEX idx_conversations_type ON conversations(conversation_type);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at);
CREATE INDEX idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_user_id ON message_reactions(user_id);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view conversations they participate in" ON conversations
  FOR SELECT USING (
    id IN (
      SELECT conversation_id FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (true); -- Will be restricted by participant policies

CREATE POLICY "Users can update conversations they participate in" ON conversations
  FOR UPDATE USING (
    id IN (
      SELECT conversation_id FROM conversation_participants 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- RLS Policies for conversation_participants
CREATE POLICY "Users can view participants of their conversations" ON conversation_participants
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add themselves to conversations" ON conversation_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation" ON conversation_participants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can remove themselves from conversations" ON conversation_participants
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their conversations" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can edit their own messages" ON messages
  FOR UPDATE USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages" ON messages
  FOR DELETE USING (auth.uid() = sender_id);

-- RLS Policies for message_reactions
CREATE POLICY "Users can view reactions in their conversations" ON message_reactions
  FOR SELECT USING (
    message_id IN (
      SELECT m.id FROM messages m
      JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
      WHERE cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add reactions to messages" ON message_reactions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    message_id IN (
      SELECT m.id FROM messages m
      JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
      WHERE cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove their own reactions" ON message_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Functions to update timestamps
CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update timestamps
CREATE TRIGGER on_conversations_updated
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE PROCEDURE update_conversations_updated_at();

CREATE TRIGGER on_messages_updated
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE PROCEDURE update_messages_updated_at();

-- Function to create or get direct conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_direct_conversation(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
  conversation_name TEXT;
BEGIN
  -- Create a consistent name for the direct conversation
  conversation_name := LEAST(user1_id::text, user2_id::text) || '_' || GREATEST(user1_id::text, user2_id::text);
  
  -- Try to find existing conversation
  SELECT id INTO conversation_id
  FROM conversations
  WHERE conversation_type = 'direct' AND name = conversation_name;
  
  -- If not found, create new conversation
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (conversation_type, name)
    VALUES ('direct', conversation_name)
    RETURNING id INTO conversation_id;
    
    -- Add both users as participants
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES (conversation_id, user1_id), (conversation_id, user2_id);
  END IF;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create group conversation
CREATE OR REPLACE FUNCTION create_group_conversation(group_name TEXT, participant_ids UUID[])
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
  participant_id UUID;
BEGIN
  -- Create conversation
  INSERT INTO conversations (conversation_type, name)
  VALUES ('group', group_name)
  RETURNING id INTO conversation_id;
  
  -- Add participants
  FOREACH participant_id IN ARRAY participant_ids
  LOOP
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES (conversation_id, participant_id);
  END LOOP;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create session conversation
CREATE OR REPLACE FUNCTION create_session_conversation(session_id UUID, session_name TEXT)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
BEGIN
  -- Create conversation
  INSERT INTO conversations (conversation_type, name)
  VALUES ('session', session_name || ' (Session)')
  RETURNING id INTO conversation_id;
  
  -- Add session creator and participants (this would need to be called after session creation)
  -- This is a placeholder - actual participant addition would happen in session creation flow
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark conversation as read
CREATE OR REPLACE FUNCTION mark_conversation_read(conversation_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE conversation_participants
  SET last_read_at = NOW()
  WHERE conversation_id = mark_conversation_read.conversation_id
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helpful comments
COMMENT ON TABLE conversations IS 'Groups of messages between users (direct, group, or session-based)';
COMMENT ON TABLE conversation_participants IS 'Users who participate in conversations';
COMMENT ON TABLE messages IS 'Individual messages sent in conversations';
COMMENT ON TABLE message_reactions IS 'Reactions (emojis, etc.) on messages';
COMMENT ON COLUMN conversations.conversation_type IS 'Type of conversation: direct, group, or session';
COMMENT ON COLUMN messages.message_type IS 'Type of message: text, image, location, or system';
COMMENT ON COLUMN messages.metadata IS 'Additional message data (image URLs, location coordinates, etc.)';
