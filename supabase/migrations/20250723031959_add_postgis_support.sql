-- Enable PostGIS extension for geospatial features
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add PostGIS geometry column to users table
-- Using POINT geometry with WGS84 (SRID 4326) coordinate system
ALTER TABLE users ADD COLUMN location_point GEOMETRY(POINT, 4326);

-- Migrate existing coordinate data to PostGIS geometry
-- This will convert existing lat/lng pairs into proper POINT geometries
UPDATE users 
SET location_point = ST_Point(location_longitude, location_latitude)
WHERE location_latitude IS NOT NULL 
  AND location_longitude IS NOT NULL;

-- Add spatial index for efficient location queries
-- GIST index is optimal for spatial operations
CREATE INDEX idx_users_location_point ON users USING GIST (location_point);

-- Add documentation
COMMENT ON COLUMN users.location_point IS 'PostGIS point geometry for precise spatial queries (WGS84). Use ST_X() for longitude, ST_Y() for latitude.';
