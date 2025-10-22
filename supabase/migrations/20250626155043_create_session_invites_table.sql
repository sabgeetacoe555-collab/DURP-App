-- Create session_invites table
CREATE TABLE session_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  inviter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  invitee_id UUID REFERENCES users(id) ON DELETE CASCADE, -- null for external invites
  invitee_phone TEXT,
  invitee_email TEXT, 
  invitee_name TEXT,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'maybe')) DEFAULT 'pending',
  notification_sent BOOLEAN DEFAULT false,
  sms_sent BOOLEAN DEFAULT false, -- for external invites
  invited_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE session_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view invites they sent" ON session_invites
  FOR SELECT USING (auth.uid() = inviter_id);

CREATE POLICY "Users can view invites they received" ON session_invites
  FOR SELECT USING (auth.uid() = invitee_id);

CREATE POLICY "Users can create invites" ON session_invites
  FOR INSERT WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Users can update invites they received" ON session_invites
  FOR UPDATE USING (auth.uid() = invitee_id);

-- Indexes for performance
CREATE INDEX idx_session_invites_session_id ON session_invites(session_id);
CREATE INDEX idx_session_invites_inviter_id ON session_invites(inviter_id);
CREATE INDEX idx_session_invites_invitee_id ON session_invites(invitee_id);
CREATE INDEX idx_session_invites_status ON session_invites(status);

-- Function to update responded_at when status changes
CREATE OR REPLACE FUNCTION public.handle_invite_response()
RETURNS trigger AS $$
BEGIN
  -- Only update responded_at if status changed from pending
  IF OLD.status = 'pending' AND NEW.status != 'pending' THEN
    NEW.responded_at = NOW();
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update responded_at and updated_at
CREATE TRIGGER on_session_invites_updated
  BEFORE UPDATE ON session_invites
  FOR EACH ROW EXECUTE PROCEDURE public.handle_invite_response();

-- Function to validate external vs internal invites
CREATE OR REPLACE FUNCTION public.validate_session_invite()
RETURNS trigger AS $$
BEGIN
  -- Either invitee_id must be set (internal) OR phone/email/name (external)
  IF NEW.invitee_id IS NULL THEN
    -- External invite - require at least phone or email
    IF NEW.invitee_phone IS NULL AND NEW.invitee_email IS NULL THEN
      RAISE EXCEPTION 'External invites must have either phone or email';
    END IF;
    IF NEW.invitee_name IS NULL THEN
      RAISE EXCEPTION 'External invites must have invitee_name';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate invite data
CREATE TRIGGER validate_session_invite_trigger
  BEFORE INSERT OR UPDATE ON session_invites
  FOR EACH ROW EXECUTE PROCEDURE public.validate_session_invite(); 