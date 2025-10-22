-- Add location fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_latitude DECIMAL(10, 8);
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_longitude DECIMAL(11, 8);
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_display_address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for location queries
CREATE INDEX idx_users_location_coordinates ON users(location_latitude, location_longitude) WHERE location_latitude IS NOT NULL AND location_longitude IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.location_latitude IS 'User location latitude in decimal degrees';
COMMENT ON COLUMN users.location_longitude IS 'User location longitude in decimal degrees';
COMMENT ON COLUMN users.location_address IS 'User location full address for routing/navigation';
COMMENT ON COLUMN users.location_display_address IS 'User location display address (city, state, zip) for UI';
COMMENT ON COLUMN users.location_updated_at IS 'Timestamp when location was last updated'; 