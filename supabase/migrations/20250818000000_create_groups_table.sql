-- Create groups functionality
-- This migration adds support for user-created groups of contacts for easier session invitations

-- Create groups table
CREATE TABLE groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure group names are unique per user
  UNIQUE(user_id, name)
);

-- Create group_members table to store contacts in groups
CREATE TABLE group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate contacts in the same group
  UNIQUE(group_id, contact_phone)
);

-- Create group_invitations table to track which groups were invited to sessions
CREATE TABLE group_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate group invitations to the same session
  UNIQUE(session_id, group_id)
);

-- Add indexes for performance
CREATE INDEX idx_groups_user_id ON groups(user_id);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_contact_phone ON group_members(contact_phone);
CREATE INDEX idx_group_invitations_session_id ON group_invitations(session_id);
CREATE INDEX idx_group_invitations_group_id ON group_invitations(group_id);

-- Enable Row Level Security
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for groups
CREATE POLICY "Users can view their own groups" ON groups
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own groups" ON groups
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own groups" ON groups
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for group_members
CREATE POLICY "Users can view members of their groups" ON group_members
  FOR SELECT USING (
    group_id IN (
      SELECT id FROM groups WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add members to their groups" ON group_members
  FOR INSERT WITH CHECK (
    group_id IN (
      SELECT id FROM groups WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update members of their groups" ON group_members
  FOR UPDATE USING (
    group_id IN (
      SELECT id FROM groups WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove members from their groups" ON group_members
  FOR DELETE USING (
    group_id IN (
      SELECT id FROM groups WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for group_invitations
CREATE POLICY "Users can view group invitations for their sessions" ON group_invitations
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create group invitations for their sessions" ON group_invitations
  FOR INSERT WITH CHECK (
    session_id IN (
      SELECT id FROM sessions WHERE user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_groups_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER on_groups_updated
  BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE PROCEDURE update_groups_updated_at();

-- Add helpful comments
COMMENT ON TABLE groups IS 'User-created groups of contacts for easier session invitations';
COMMENT ON TABLE group_members IS 'Contacts that belong to user groups';
COMMENT ON TABLE group_invitations IS 'Tracks which groups were invited to which sessions';
COMMENT ON COLUMN groups.name IS 'Group name (unique per user)';
COMMENT ON COLUMN group_members.contact_phone IS 'Contact phone number (unique per group)';
