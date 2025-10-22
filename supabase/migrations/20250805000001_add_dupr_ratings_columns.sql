-- Add DUPR rating columns to users table
ALTER TABLE users ADD COLUMN dupr_rating_singles DECIMAL(3,2);
ALTER TABLE users ADD COLUMN dupr_rating_doubles DECIMAL(3,2);

-- Create indexes for faster lookups by DUPR ratings
CREATE INDEX idx_users_dupr_rating_singles ON users(dupr_rating_singles);
CREATE INDEX idx_users_dupr_rating_doubles ON users(dupr_rating_doubles);

-- Add comments to document the fields
COMMENT ON COLUMN users.dupr_rating_singles IS 'DUPR singles rating from DUPR API';
COMMENT ON COLUMN users.dupr_rating_doubles IS 'DUPR doubles rating from DUPR API'; 