-- Add location display address field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_display_address TEXT;

-- Add comment for documentation
COMMENT ON COLUMN users.location_display_address IS 'User location display address (city, state, zip) for UI'; 