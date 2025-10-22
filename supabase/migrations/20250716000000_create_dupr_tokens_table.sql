-- Create table for token storage
CREATE TABLE dupr_tokens (
  id TEXT PRIMARY KEY,
  access_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: Enable RLS (Row Level Security)
ALTER TABLE dupr_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role access (Edge Functions use service role)
CREATE POLICY "Allow service role access" ON dupr_tokens
  FOR ALL 
  TO service_role
  USING (true); 