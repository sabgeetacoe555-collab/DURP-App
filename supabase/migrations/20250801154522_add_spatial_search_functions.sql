-- Add spatial search functions for session discovery
-- These functions leverage PostGIS for efficient location-based queries

-- Function to get sessions within a radius with distances
-- Returns session IDs and distances for efficiency
CREATE OR REPLACE FUNCTION get_sessions_within_radius(
  search_lat DECIMAL,
  search_lng DECIMAL,
  radius_miles INTEGER DEFAULT 20,
  exclude_user_id UUID DEFAULT NULL,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE DEFAULT (CURRENT_DATE + INTERVAL '5 days')::DATE
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
      ) * 0.000621371)::numeric, -- Convert meters to miles and cast to numeric
      1
    ) as distance_miles
  FROM sessions s
  WHERE 
    -- Only sessions with valid location data
    s.location_point IS NOT NULL
    -- Only public sessions that are scheduled
    AND s.visibility = 'public' 
    AND s.status = 'scheduled'
    -- Exclude user's own sessions if user_id provided
    AND (exclude_user_id IS NULL OR s.user_id != exclude_user_id)
    -- Within the specified radius (using geography for accuracy)
    AND ST_DWithin(
      ST_Point(search_lng, search_lat)::geography,
      s.location_point::geography,
      radius_miles * 1609.34  -- Convert miles to meters
    )
    -- Filter by date range  
    AND s.date >= start_date
    AND s.date <= end_date
    -- For today's sessions, only show future ones
    AND (s.date > CURRENT_DATE OR (s.date = CURRENT_DATE AND s.start_time > CURRENT_TIME))
  ORDER BY distance_miles ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get sessions in a specific city/area
-- Returns full session data using current table schema
CREATE OR REPLACE FUNCTION get_sessions_in_city(
  city_name TEXT,
  exclude_user_id UUID DEFAULT NULL,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE DEFAULT (CURRENT_DATE + INTERVAL '5 days')::DATE
)
RETURNS SETOF sessions AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.*  -- All session columns automatically included
  FROM sessions s
  WHERE 
    -- Only public sessions that are scheduled
    s.visibility = 'public' 
    AND s.status = 'scheduled'
    -- Exclude user's own sessions if user_id provided
    AND (exclude_user_id IS NULL OR s.user_id != exclude_user_id)
    -- Match city name in location display address (case insensitive)
    AND s.location_display_address ILIKE '%' || city_name || '%'
    -- Filter by date range
    AND s.date >= start_date
    AND s.date <= end_date
    -- For today's sessions, only show future ones
    AND (s.date > CURRENT_DATE OR (s.date = CURRENT_DATE AND s.start_time > CURRENT_TIME))
  ORDER BY s.date ASC, s.start_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get nearby session count for quick stats
CREATE OR REPLACE FUNCTION get_nearby_session_count(
  search_lat DECIMAL,
  search_lng DECIMAL,
  radius_miles INTEGER DEFAULT 20,
  exclude_user_id UUID DEFAULT NULL,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE DEFAULT (CURRENT_DATE + INTERVAL '5 days')::DATE
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
    AND s.visibility = 'public' 
    AND s.status = 'scheduled'
    AND (exclude_user_id IS NULL OR s.user_id != exclude_user_id)
    AND ST_DWithin(
      ST_Point(search_lng, search_lat)::geography,
      s.location_point::geography,
      radius_miles * 1609.34
    )
    -- Filter by date range
    AND s.date >= start_date
    AND s.date <= end_date
    -- For today's sessions, only show future ones
    AND (s.date > CURRENT_DATE OR (s.date = CURRENT_DATE AND s.start_time > CURRENT_TIME));
    
  RETURN session_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_sessions_within_radius TO authenticated;
GRANT EXECUTE ON FUNCTION get_sessions_in_city TO authenticated;
GRANT EXECUTE ON FUNCTION get_nearby_session_count TO authenticated;
