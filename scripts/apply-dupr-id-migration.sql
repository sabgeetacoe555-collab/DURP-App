-- Add dupr_id field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS dupr_id TEXT;

-- Create index for faster lookups by DUPR ID
CREATE INDEX IF NOT EXISTS idx_users_dupr_id ON users(dupr_id);

-- Add comment to document the field
COMMENT ON COLUMN users.dupr_id IS 'DUPR user ID from DUPR API'; 