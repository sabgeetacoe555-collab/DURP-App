-- Drop legacy location columns from users table
-- These are no longer needed since we're using PostGIS location_point

-- Drop the index first
DROP INDEX IF EXISTS idx_users_location_coordinates;

-- Drop the legacy location columns
ALTER TABLE users DROP COLUMN IF EXISTS location_latitude;
ALTER TABLE users DROP COLUMN IF EXISTS location_longitude;
