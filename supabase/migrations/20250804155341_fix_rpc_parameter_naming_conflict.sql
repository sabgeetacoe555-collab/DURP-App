-- Fix naming conflict between function parameters and table columns
-- The parameter "end_datetime" conflicts with table column "sessions.end_datetime"

-- Drop and recreate the functions with non-conflicting parameter names

DROP FUNCTION IF EXISTS get_sessions_within_radius;
DROP FUNCTION IF EXISTS get_sessions_in_city;
DROP FUNCTION IF EXISTS get_nearby_session_count;

-- Updated function with renamed parameters to avoid conflicts
CREATE OR REPLACE FUNCTION get_sessions_within_radius(
  search_lat DECIMAL,
  search_lng DECIMAL,
  radius_miles INTEGER DEFAULT 20,
  exclude_user_id UUID DEFAULT NULL,
  search_start_datetime TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  search_end_datetime TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 days')
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
    AND s.session_datetime >= search_start_datetime
    AND s.session_datetime <= search_end_datetime
    -- Only show future sessions (UTC comparison)
    AND s.session_datetime > NOW()
  ORDER BY distance_miles ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated function for city search with renamed parameters
CREATE OR REPLACE FUNCTION get_sessions_in_city(
  city_name TEXT,
  exclude_user_id UUID DEFAULT NULL,
  search_start_datetime TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  search_end_datetime TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 days')
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
    AND s.session_datetime >= search_start_datetime
    AND s.session_datetime <= search_end_datetime
    -- Only show future sessions (UTC comparison)
    AND s.session_datetime > NOW()
  ORDER BY s.session_datetime ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated function for session count with renamed parameters
CREATE OR REPLACE FUNCTION get_nearby_session_count(
  search_lat DECIMAL,
  search_lng DECIMAL,
  radius_miles INTEGER DEFAULT 20,
  exclude_user_id UUID DEFAULT NULL,
  search_start_datetime TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  search_end_datetime TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 days')
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
    AND s.session_datetime >= search_start_datetime
    AND s.session_datetime <= search_end_datetime
    -- Only show future sessions (UTC comparison)  
    AND s.session_datetime > NOW();
    
  RETURN session_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_sessions_within_radius TO authenticated;
GRANT EXECUTE ON FUNCTION get_sessions_in_city TO authenticated;
GRANT EXECUTE ON FUNCTION get_nearby_session_count TO authenticated;
