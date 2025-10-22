-- Implement UTC datetime storage for sessions
-- This fixes timezone issues in session creation and querying

-- Step 1: Add new UTC timestamp columns
ALTER TABLE sessions 
ADD COLUMN session_datetime TIMESTAMP WITH TIME ZONE,
ADD COLUMN end_datetime TIMESTAMP WITH TIME ZONE;

-- Step 2: Create a function to migrate existing data
-- Note: Existing data is assumed to be in local timezone, this is a best-effort conversion
CREATE OR REPLACE FUNCTION migrate_session_datetimes()
RETURNS void AS $$
BEGIN
  -- Update sessions that have both date and start_time/end_time
  UPDATE sessions 
  SET 
    session_datetime = (date + start_time::interval) AT TIME ZONE 'UTC',
    end_datetime = (date + end_time::interval) AT TIME ZONE 'UTC'
  WHERE 
    date IS NOT NULL 
    AND start_time IS NOT NULL 
    AND end_time IS NOT NULL
    AND session_datetime IS NULL;
    
  RAISE NOTICE 'Migrated % sessions to UTC datetime format', 
    (SELECT COUNT(*) FROM sessions WHERE session_datetime IS NOT NULL);
END;
$$ LANGUAGE plpgsql;

-- Step 3: Run the migration (you can run this manually if needed)
-- SELECT migrate_session_datetimes();

-- Step 4: Add indexes for the new timestamp columns
CREATE INDEX IF NOT EXISTS sessions_session_datetime_idx ON sessions(session_datetime);
CREATE INDEX IF NOT EXISTS sessions_end_datetime_idx ON sessions(end_datetime);

-- Step 5: Update spatial search functions to use UTC timestamps

-- First, drop the existing functions to avoid conflicts
DROP FUNCTION IF EXISTS get_sessions_within_radius(DECIMAL, DECIMAL, INTEGER, UUID, DATE, DATE);
DROP FUNCTION IF EXISTS get_sessions_in_city(TEXT, UUID, DATE, DATE);
DROP FUNCTION IF EXISTS get_nearby_session_count(DECIMAL, DECIMAL, INTEGER, UUID, DATE, DATE);

-- Updated function to get sessions within a radius with UTC datetime handling
CREATE OR REPLACE FUNCTION get_sessions_within_radius(
  search_lat DECIMAL,
  search_lng DECIMAL,
  radius_miles INTEGER DEFAULT 20,
  exclude_user_id UUID DEFAULT NULL,
  start_datetime TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_datetime TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 days')
)
RETURNS TABLE (
  session_id UUID,
  distance_miles DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as session_id,
    ROUND(
      (ST_Distance(
        ST_Point(search_lng, search_lat)::geography,
        s.location_point::geography
      ) * 0.000621371)::numeric, -- Convert meters to miles
      1
    ) as distance_miles
  FROM sessions s
  WHERE 
    -- Only sessions with valid location data
    s.location_point IS NOT NULL
    -- Only sessions with valid datetime
    AND s.session_datetime IS NOT NULL
    -- Only public sessions that are scheduled
    AND s.visibility = 'public' 
    AND s.status = 'scheduled'
    -- Exclude user's own sessions if user_id provided
    AND (exclude_user_id IS NULL OR s.user_id != exclude_user_id)
    -- Within the specified radius
    AND ST_DWithin(
      ST_Point(search_lng, search_lat)::geography,
      s.location_point::geography,
      radius_miles * 1609.34  -- Convert miles to meters
    )
    -- Filter by datetime range (UTC comparisons)
    AND s.session_datetime >= start_datetime
    AND s.session_datetime <= end_datetime
    -- Only show future sessions (UTC comparison)
    AND s.session_datetime > NOW()
  ORDER BY distance_miles ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated function to get sessions in a city with UTC datetime handling  
CREATE OR REPLACE FUNCTION get_sessions_in_city(
  city_name TEXT,
  exclude_user_id UUID DEFAULT NULL,
  start_datetime TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_datetime TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 days')
)
RETURNS SETOF sessions AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.*
  FROM sessions s
  WHERE 
    -- Only sessions with valid datetime
    s.session_datetime IS NOT NULL
    -- Only public sessions that are scheduled
    AND s.visibility = 'public' 
    AND s.status = 'scheduled'
    -- Exclude user's own sessions if user_id provided
    AND (exclude_user_id IS NULL OR s.user_id != exclude_user_id)
    -- Match city name in location display address
    AND s.location_display_address ILIKE '%' || city_name || '%'
    -- Filter by datetime range (UTC comparisons)
    AND s.session_datetime >= start_datetime
    AND s.session_datetime <= end_datetime
    -- Only show future sessions (UTC comparison)
    AND s.session_datetime > NOW()
  ORDER BY s.session_datetime ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated function to get nearby session count with UTC datetime handling
CREATE OR REPLACE FUNCTION get_nearby_session_count(
  search_lat DECIMAL,
  search_lng DECIMAL,
  radius_miles INTEGER DEFAULT 20,
  exclude_user_id UUID DEFAULT NULL,
  start_datetime TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_datetime TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 days')
)
RETURNS INTEGER AS $$
DECLARE
  session_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO session_count
  FROM sessions s
  WHERE 
    s.location_point IS NOT NULL
    AND s.session_datetime IS NOT NULL
    AND s.visibility = 'public' 
    AND s.status = 'scheduled'
    AND (exclude_user_id IS NULL OR s.user_id != exclude_user_id)
    AND ST_DWithin(
      ST_Point(search_lng, search_lat)::geography,
      s.location_point::geography,
      radius_miles * 1609.34
    )
    -- Filter by datetime range (UTC comparisons)
    AND s.session_datetime >= start_datetime
    AND s.session_datetime <= end_datetime
    -- Only show future sessions (UTC comparison)  
    AND s.session_datetime > NOW();
    
  RETURN session_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Grant permissions
GRANT EXECUTE ON FUNCTION migrate_session_datetimes TO authenticated;
GRANT EXECUTE ON FUNCTION get_sessions_within_radius TO authenticated;
GRANT EXECUTE ON FUNCTION get_sessions_in_city TO authenticated;
GRANT EXECUTE ON FUNCTION get_nearby_session_count TO authenticated;

-- Step 7: Add helpful comments
COMMENT ON COLUMN sessions.session_datetime IS 'Session start time in UTC (TIMESTAMP WITH TIME ZONE)';
COMMENT ON COLUMN sessions.end_datetime IS 'Session end time in UTC (TIMESTAMP WITH TIME ZONE)';
COMMENT ON FUNCTION migrate_session_datetimes() IS 'One-time migration function to convert legacy date/time fields to UTC timestamps';
