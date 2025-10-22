-- Ensure legacy location columns are dropped and PostGIS columns are properly set up
-- This migration fixes the issue where legacy lat/lng columns still exist but location_point is missing

-- First, enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Check and fix users table
DO $$
BEGIN
    -- Add location_point column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'location_point'
    ) THEN
        ALTER TABLE users ADD COLUMN location_point GEOMETRY(POINT, 4326);
        RAISE NOTICE 'Added location_point column to users table';
    END IF;
    
    -- Migrate data from legacy columns to PostGIS if they exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'location_latitude'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'location_longitude'
    ) THEN
        UPDATE users 
        SET location_point = ST_Point(location_longitude, location_latitude)
        WHERE location_latitude IS NOT NULL 
          AND location_longitude IS NOT NULL
          AND location_point IS NULL;
        RAISE NOTICE 'Migrated data from legacy lat/lng to PostGIS point in users table';
    END IF;
    
    -- Drop legacy columns if they exist
    ALTER TABLE users DROP COLUMN IF EXISTS location_latitude;
    ALTER TABLE users DROP COLUMN IF EXISTS location_longitude;
    ALTER TABLE users DROP COLUMN IF EXISTS location_lat;
    ALTER TABLE users DROP COLUMN IF EXISTS location_long;
    RAISE NOTICE 'Dropped legacy location columns from users table';
    
    -- Ensure spatial index exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'users' AND indexname = 'idx_users_location_point'
    ) THEN
        CREATE INDEX idx_users_location_point ON users USING GIST (location_point);
        RAISE NOTICE 'Created spatial index on users.location_point';
    END IF;
END $$;

-- Check and fix sessions table
DO $$
BEGIN
    -- Add location_point column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' AND column_name = 'location_point'
    ) THEN
        ALTER TABLE sessions ADD COLUMN location_point GEOMETRY(POINT, 4326);
        RAISE NOTICE 'Added location_point column to sessions table';
    END IF;
    
    -- Drop any legacy location columns if they exist (sessions shouldn't have had these)
    ALTER TABLE sessions DROP COLUMN IF EXISTS location_latitude;
    ALTER TABLE sessions DROP COLUMN IF EXISTS location_longitude;
    ALTER TABLE sessions DROP COLUMN IF EXISTS location_lat;
    ALTER TABLE sessions DROP COLUMN IF EXISTS location_long;
    RAISE NOTICE 'Dropped legacy location columns from sessions table';
    
    -- Ensure spatial index exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'sessions' AND indexname = 'idx_sessions_location_point'
    ) THEN
        CREATE INDEX idx_sessions_location_point ON sessions USING GIST (location_point);
        RAISE NOTICE 'Created spatial index on sessions.location_point';
    END IF;
END $$;

-- Add any missing location-related columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_display_address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS location_address TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS location_display_address TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP WITH TIME ZONE;

-- Add comments for documentation
COMMENT ON COLUMN users.location_point IS 'PostGIS point geometry for precise spatial queries (WGS84). Use ST_X() for longitude, ST_Y() for latitude.';
COMMENT ON COLUMN sessions.location_point IS 'PostGIS point geometry for session location (WGS84). Use ST_X() for longitude, ST_Y() for latitude.';
