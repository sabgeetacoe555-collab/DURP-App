-- Add PostGIS location fields to sessions table
-- This enables spatial queries for session discovery

-- Add PostGIS geometry column for precise location
-- Using POINT geometry with WGS84 (SRID 4326) coordinate system
ALTER TABLE sessions ADD COLUMN location_point GEOMETRY(POINT, 4326);

-- Add address fields for display and search
ALTER TABLE sessions ADD COLUMN location_address TEXT;
ALTER TABLE sessions ADD COLUMN location_display_address TEXT;

-- Add timestamp for location updates
ALTER TABLE sessions ADD COLUMN location_updated_at TIMESTAMP WITH TIME ZONE;

-- Add spatial index for efficient location-based queries
-- GIST index is optimal for spatial operations like distance searches
CREATE INDEX idx_sessions_location_point ON sessions USING GIST (location_point);

-- Add regular index for location address searches
CREATE INDEX idx_sessions_location_display_address ON sessions(location_display_address) WHERE location_display_address IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN sessions.location_point IS 'PostGIS point geometry for session location (WGS84). Use ST_X() for longitude, ST_Y() for latitude.';
COMMENT ON COLUMN sessions.location_address IS 'Full address for routing/navigation to session location';
COMMENT ON COLUMN sessions.location_display_address IS 'Display address (city, state, zip) shown in session lists';
COMMENT ON COLUMN sessions.location_updated_at IS 'Timestamp when session location was last updated';
